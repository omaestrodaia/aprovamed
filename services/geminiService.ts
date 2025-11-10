import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Question, LearningPath, Flashcard } from '../types';

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

export const extractTextFromFile = async (base64String: string, mimeType: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [
                { text: "Extraia todo o texto deste documento de forma literal, mantendo a formatação e quebras de linha originais. Não inclua nenhum comentário ou resumo, apenas o texto bruto." },
                { inlineData: { data: base64String, mimeType: mimeType } }
            ]}]
        }));
        const fullText = response.text;
        if (typeof fullText !== 'string' || !fullText.trim()) {
            throw new Error("A IA não conseguiu extrair o texto do documento para processamento.");
        }
        return fullText;
    } catch(error) {
        console.error("Error extracting text from file:", error);
        throw new Error("Falha ao extrair texto do arquivo. A IA pode não ter conseguido ler o documento.");
    }
}

export const extractQuestionsFromChunk = async (chunkText: string): Promise<Partial<Question>[]> => {
    try {
         const chunkResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                 { text: `Analise o texto a seguir e extraia as questões de múltipla escolha no padrão "MedGrupo". Para cada questão, extraia o ID numérico, o enunciado (omitindo referências a imagens como "(VER IMAGEM)") e as alternativas (letra e texto). Ignore qualquer texto que não seja uma questão. A saída deve ser um array de objetos JSON.` },
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
                return questionsFromChunk;
            }
        }
        console.warn(`Um bloco de questões não pôde ser processado. Motivo: ${chunkResponse.candidates?.[0]?.finishReason}`);
        return []; // Return empty array for failed chunks to not break the whole process
    } catch (chunkError) {
        console.error(`Erro ao processar o bloco de questões:`, chunkError);
        return []; // Return empty array on error
    }
}

interface GabaritoEntry {
    correta: string;
    comentario: string;
}

export const extractAnswersFromGabarito = async (answersText: string): Promise<{ [key: string]: GabaritoEntry }> => {
     if (!answersText.trim()) {
        return {};
    }
    // This schema tells the AI to return a map-like object where keys are question IDs (as strings of numbers)
    // and values are objects containing the correct answer and the commentary.
    const gabaritoSchema = {
        type: Type.OBJECT,
        patternProperties: {
            "^[0-9]+$": { // Keys are strings of one or more digits
                type: Type.OBJECT,
                properties: {
                    correta: { type: Type.STRING, description: "A letra da alternativa correta (A, B, C, D, ou E)." },
                    comentario: { type: Type.STRING, description: "O texto completo da explicação/resolução da questão." }
                },
                required: ['correta', 'comentario']
            }
        },
        // A description of the overall object can help the model.
        description: "Um objeto mapeando o ID de cada questão para sua resposta e comentário."
    };

    try {
        const answerResponse: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { text: `Analise o texto do gabarito a seguir. Para cada questão, extraia o ID numérico, a letra da resposta correta e o texto do comentário/resolução completo. A resposta correta geralmente está no final do comentário, no formato 'Resposta letra X.'. Retorne um único objeto JSON onde as chaves são os IDs das questões (como strings) e os valores são objetos contendo 'correta' (a letra da resposta) e 'comentario' (o texto completo da explicação).` },
                { text: answersText }
            ],
            config: { 
                responseMimeType: "application/json",
                responseSchema: gabaritoSchema
            }
        }));
        const answerJsonText = answerResponse.text;
        if (typeof answerJsonText === 'string' && answerJsonText.trim()) {
            return JSON.parse(answerJsonText.trim());
        }
        return {};
    } catch(answerError) {
        console.error("Não foi possível analisar a seção do gabarito:", answerError);
        return {};
    }
}


export const processQuestionsFile = async (
    base64String: string, 
    mimeType: string, 
    pattern: 'pattern1' | 'pattern2',
): Promise<Partial<Question>[]> => {
    // This function now only handles the simpler, single-call pattern (pattern1).
    // The complex, chunked logic for pattern2 is now orchestrated in the UploadQuestions component.
    try {
        if (pattern === 'pattern2') {
           throw new Error("O processamento do Padrão MedGrupo deve ser iniciado pelo orquestrador no frontend.");
        } 
        
        // Logic for Pattern 1 (Detailed) remains the same
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
        
        return questionsRaw;

    } catch (error) {
        console.error("Error processing file with Gemini:", error);
         if (error instanceof Error) {
            if (error.message.toLowerCase().includes('internal error')) {
                throw new Error("A API da IA encontrou um erro interno. Isso pode ser um problema temporário. Por favor, tente novamente em alguns minutos. Se o problema persistir, tente um arquivo menor ou com formato mais simples.");
            }
        }
        throw error;
    }
};


export const generateLearningPath = async (prompt: string): Promise<Omit<LearningPath, 'id'>> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro",
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
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("A IA não conseguiu gerar uma trilha de aprendizagem com base na sua solicitação. Tente ser mais específico.");
    }
};

export const generateFlashcardsForTopic = async (topic: string): Promise<Omit<Flashcard, 'id' | 'deck_id'>[]> => {
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Crie um conjunto de 10 flashcards sobre o tópico "${topic}". Cada flashcard deve ter uma pergunta concisa no campo "frente" e uma resposta direta no campo "verso". Retorne a resposta como um array de objetos JSON, onde cada objeto tem as chaves "frente" e "verso".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            frente: { type: Type.STRING },
                            verso: { type: Type.STRING }
                        },
                        required: ['frente', 'verso']
                    }
                }
            }
        }));
        const jsonText = response.text;
        if (typeof jsonText !== 'string' || !jsonText.trim()) {
            throw new Error("A IA não retornou uma resposta JSON válida para os flashcards.");
        }
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw new Error("Não foi possível gerar os flashcards. Tente um tópico diferente ou verifique a API.");
    }
};

export const analyzeTestPerformance = async (score: number): Promise<string> => {
    try {
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Um aluno acabou de completar um teste e obteve a nota ${score} de 100. Forneça uma análise de desempenho construtiva e motivacional em formato de texto simples (markdown). Comece com um elogio, depois identifique a faixa de desempenho (excelente, bom, precisa melhorar, etc.), sugira 2-3 áreas de foco genéricas para estudo e termine com uma mensagem de encorajamento.`,
        }));
        return response.text;
    } catch (error) {
        console.error("Error analyzing performance:", error);
        return "Não foi possível analisar o desempenho neste momento.";
    }
};

export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], context: string): Promise<string> => {
    try {
        const chatHistory = history.slice(0, -1) as { role: 'user' | 'model'; parts: { text: string }[] }[];
        const lastUserMessage = history[history.length - 1];

        if (!lastUserMessage || lastUserMessage.role !== 'user') {
            return "Por favor, envie uma mensagem para começar.";
        }

        const fullPrompt = `${lastUserMessage.parts[0].text}\n\nContexto atual: ${context}`;
        
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: chatHistory,
        });

        // FIX: Explicitly type the response to avoid type inference issues.
        const response: GenerateContentResponse = await chat.sendMessage(fullPrompt);

        return response.text;
    } catch (error) {
        console.error("Error getting chat response:", error);
        return "Desculpe, não consegui processar sua pergunta agora. Tente novamente.";
    }
};

export const generateHintForQuestion = async (question: Question): Promise<string> => {
    try {
        const alternativesText = question.alternativas.map(a => `${a.letra}) ${a.texto}`).join('\n');
        const correctAlternativeText = question.alternativas.find(a => a.letra === question.correta)?.texto;
        const prompt = `Você é um tutor de medicina. Um aluno está com dificuldade na seguinte questão:
---
Questão: ${question.enunciado}
Alternativas:
${alternativesText}
---
A resposta correta é a letra ${question.correta}: "${correctAlternativeText}".

Gere uma dica sutil e educacional que ajude o aluno a raciocinar sobre a resposta correta, SEM NUNCA mencionar a letra correta ou a resposta diretamente. A dica deve focar no conceito por trás da pergunta. Seja breve e direto ao ponto.`;

        // FIX: Explicitly type the response for consistency and to prevent potential type inference issues.
        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        }));
        return response.text;
    } catch (error) {
        console.error("Error generating hint:", error);
        return "Não foi possível gerar uma dica neste momento. Tente novamente.";
    }
};