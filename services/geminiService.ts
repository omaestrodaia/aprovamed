

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Question, LearningPath } from '../types';

// Assumes API_KEY is set in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function for retrying API calls on 500 errors
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof Error && (error.message.includes('500') || error.message.toLowerCase().includes('internal error'))) {
      console.warn(`API internal error detected. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};


// Schema for Pattern 1 (Detailed)
const questionSchemaPattern1 = {
    type: Type.OBJECT,
    properties: {
        enunciado: { type: Type.STRING, description: "O texto completo da pergunta." },
        alternativas: {
            type: Type.ARRAY,
            description: "Uma lista de 5 alternativas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    letra: { type: Type.STRING, description: "A letra da alternativa (A, B, C, D, E)." },
                    texto: { type: Type.STRING, description: "O texto da alternativa." },
                },
                required: ['letra', 'texto']
            }
        },
        correta: { type: Type.STRING, description: "A letra da alternativa correta." },
        resolucao: { type: Type.STRING, description: "Uma explicação opcional para a resposta correta.", nullable: true },
        dica: { type: Type.STRING, description: "Uma dica opcional para resolver a questão.", nullable: true },
    },
    required: ['enunciado', 'alternativas', 'correta']
};

// Schema for Pattern 2 (MedGrupo style)
const questionSchemaPattern2 = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.NUMBER, description: "O ID numérico da questão, que aparece no início." },
        enunciado: { type: Type.STRING, description: "O texto completo do enunciado da pergunta, começando após 'Enunciado:'." },
        alternativas: {
            type: Type.ARRAY,
            description: "Uma lista de alternativas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    letra: { type: Type.STRING, description: "A letra da alternativa (A, B, C, D, E)." },
                    texto: { type: Type.STRING, description: "O texto da alternativa." },
                },
                required: ['letra', 'texto']
            }
        },
    },
    required: ['id', 'enunciado', 'alternativas']
};

const handleGeminiError = (response: GenerateContentResponse): string => {
    const finishReason = response.candidates?.[0]?.finishReason;
    let errorMessage = "A IA não retornou uma resposta de texto válida.";
    if (finishReason === 'SAFETY') {
        errorMessage = "A solicitação foi bloqueada por motivos de segurança. Verifique o conteúdo do arquivo.";
    } else if (finishReason) {
        errorMessage += ` Motivo do término: ${finishReason}.`;
    }
    console.error("Gemini response was not text:", response);
    return errorMessage;
};


export const processQuestionsFile = async (base64String: string, mimeType: string, pattern: 'pattern1' | 'pattern2'): Promise<Question[]> => {
    try {
        if (pattern === 'pattern2') {
            // Step 1: Extract the full text from the large document.
            // FIX: Explicitly type the response from Gemini API.
            const textExtractionResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: [{ parts: [
                    { text: "Extraia todo o texto deste documento de forma literal, mantendo a formatação e quebras de linha originais. Não inclua nenhum comentário ou resumo, apenas o texto bruto." },
                    { inlineData: { data: base64String, mimeType: mimeType } }
                ]}]
            }));
            const fullText = textExtractionResponse.text;
            if (typeof fullText !== 'string' || !fullText.trim()) {
                throw new Error("A IA não conseguiu extrair o texto do documento para processamento.");
            }

            // Step 2: Split Questions and Answers sections
            const gabaritoIndex = fullText.search(/\n\s*Gabarito\s*\n/i);
            const questionsText = gabaritoIndex !== -1 ? fullText.substring(0, gabaritoIndex) : fullText;
            const answersText = gabaritoIndex !== -1 ? fullText.substring(gabaritoIndex) : "";

            // Step 3: Process the questions in smaller chunks.
            const questionBlocks = questionsText.split(/(?=\d{4,}\))/).filter(block => block.trim().length > 20);
            const allQuestionsRaw: any[] = [];
            const CHUNK_SIZE = 15; // Reduced chunk size for more stability

            for (let i = 0; i < questionBlocks.length; i += CHUNK_SIZE) {
                const chunkText = questionBlocks.slice(i, i + CHUNK_SIZE).join('\n\n---\n\n');
                try {
                    // FIX: Explicitly type the response from Gemini API.
                    const chunkResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [
                             { text: `Extraia todas as questões de múltipla escolha do texto a seguir, seguindo o padrão "MedGrupo". Cada questão começa com um ID numérico de 4 ou mais dígitos seguido por um parêntese (ex: "345441)" ou "84516)"), seguido por "Enunciado:" e depois as alternativas (A), B), C), D), etc). Para cada questão, extraia apenas o ID numérico, o enunciado e o texto de cada alternativa com sua respectiva letra. Se um enunciado mencionar uma imagem ou vídeo (ex: "(VER IMAGEM)"), extraia o texto normalmente mas omita essa referência específica. Ignore qualquer texto que não se pareça com uma questão. Formate a saída como um array de objetos JSON.` },
                            { text: chunkText },
                        ],
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: { type: Type.ARRAY, items: questionSchemaPattern2 },
                        },
                    }));
                     const jsonText = chunkResponse.text;
                    if (typeof jsonText === 'string' && jsonText.trim()) {
                        const questionsFromChunk = JSON.parse(jsonText.trim());
                        if (Array.isArray(questionsFromChunk)) {
                            allQuestionsRaw.push(...questionsFromChunk);
                        }
                    } else {
                        console.warn(`Um bloco de questões (a partir da questão ${i + 1}) não pôde ser processado. Motivo: ${chunkResponse.candidates?.[0]?.finishReason}`);
                    }
                } catch (chunkError) {
                    console.error(`Erro ao processar o bloco de questões a partir da questão ${i + 1}:`, chunkError);
                }
            }

            // Step 4: Process Answers section to get the answer key
            let answerMap: { [key: string]: string } = {};
            if (answersText.trim()) {
                try {
                    // FIX: Explicitly type the response from Gemini API.
                    const answerResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: [
                            { text: `Analise o texto do gabarito a seguir. Para cada questão, extraia o ID numérico e a letra da resposta correta. A resposta geralmente está no final do comentário, no formato 'Resposta letra X.'. Retorne um único objeto JSON onde as chaves são os IDs das questões (como strings) e os valores são as letras das respostas corretas (A, B, C, D, ou E). Ignore qualquer texto que não siga este padrão.` },
                            { text: answersText }
                        ],
                        config: { responseMimeType: "application/json" }
                    }));
                    const answerJsonText = answerResponse.text;
                    if (typeof answerJsonText === 'string' && answerJsonText.trim()) {
                        answerMap = JSON.parse(answerJsonText.trim());
                    }
                } catch(answerError) {
                    console.error("Não foi possível analisar a seção do gabarito:", answerError);
                }
            }

            // Step 5: Merge results
            return allQuestionsRaw.map((q: any) => ({
                id: q.id,
                enunciado: q.enunciado,
                alternativas: q.alternativas,
                correta: answerMap[q.id] || '', // Use the map here
                resolucao: '',
                dica: '',
            }));

        } else { // Original logic for pattern1
            // FIX: Explicitly type the response from Gemini API.
            const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { parts: [
                        { text: `Extraia todas as questões de múltipla escolha do arquivo a seguir. Para cada questão, forneça o enunciado, 5 alternativas (com letra e texto), a letra da alternativa correta, e, se disponíveis, a resolução e uma dica. Formate a saída como um array de objetos JSON. Se não houver resolução ou dica, omita esses campos ou deixe-os como nulos.` },
                        { inlineData: { data: base64String, mimeType: mimeType } },
                    ]},
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.ARRAY, items: questionSchemaPattern1 },
                },
            }));

            const jsonText = response.text;
            if (typeof jsonText !== 'string' || !jsonText.trim()) {
                throw new Error(handleGeminiError(response));
            }
            
            const questionsRaw = JSON.parse(jsonText.trim());

            if (!Array.isArray(questionsRaw)) {
                throw new Error("A resposta da IA não foi um array de questões.");
            }

            return questionsRaw.map((q, index) => ({ ...q, id: Date.now() + index }));
        }

    } catch (error) {
        console.error("Error processing file with Gemini:", error);
        if (error instanceof Error && error.message.includes('MAX_TOKENS')) {
             throw new Error("Ocorreu um erro de 'MAX_TOKENS' mesmo com o processamento em blocos. O arquivo pode ter um formato inesperado ou ser excessivamente grande. Tente um arquivo menor.");
        }
        throw error;
    }
};


export const generateLearningPath = async (prompt: string): Promise<Omit<LearningPath, 'id'>> => {
    try {
        // FIX: Explicitly type the response from Gemini API.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Better for complex generation tasks
            contents: `Com base na seguinte solicitação do usuário, crie uma "trilha de aprendizagem" estruturada. A resposta DEVE ser um único objeto JSON. O objeto deve ter as seguintes propriedades: "title" (string), "description" (string), "duration" (string, ex: "2 semanas"), "targetAudience" (string, ex: "Alunos avançados"), e "steps" (um array de objetos, onde cada objeto tem "step" (number), "title" (string), e "description" (string)). \n\nSolicitação do Usuário: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        targetAudience: { type: Type.STRING },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step: { type: Type.INTEGER },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ['step', 'title', 'description']
                            }
                        }
                    },
                    required: ['title', 'description', 'duration', 'targetAudience', 'steps']
                }
            }
        });

        const jsonText = response.text;
        
        if (typeof jsonText !== 'string' || !jsonText.trim()) {
            throw new Error(handleGeminiError(response));
        }

        const trimmedJsonText = jsonText.trim();
        return JSON.parse(trimmedJsonText);

    } catch (error) {
        console.error("Error generating learning path with Gemini:", error);
        // Propagate the specific error to be handled by the UI component
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("A IA não conseguiu gerar uma trilha de aprendizagem com base na sua solicitação. Tente ser mais específico.");
    }
};