// services/classbuildService.ts

import {
  QuestionToSend,
  ClassbuildSettings,
  Disciplina,
  Assunto,
  SendReport,
} from '../types';

const PROXY_BASE_URL = '/proxy'; // Use a proxy to avoid CORS

const getHeaders = (apiKey: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
  'client-timezone-offset': '-3',
});

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status}): ${response.statusText}`;
    try {
      // The error from classbuild might be in a 'detail' property
      const errorJson = JSON.parse(errorText);
      errorMessage += `. Detalhes: ${errorJson.detail || errorJson.message || errorText}`;
    } catch {
      errorMessage += `. Detalhes: ${errorText}`;
    }
    throw new Error(errorMessage);
  }
  // Handle cases where the response might be empty (e.g., on success with no body)
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const checkClassbuildConnection = async (settings: ClassbuildSettings): Promise<{ success: boolean; message: string }> => {
  const url = `${PROXY_BASE_URL}/api/v1/escolas/${settings.escolaId}/disciplinas?format=json&limit=1`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(settings.apiKey),
    });

    if (response.ok) {
        return { success: true, message: 'Conexão bem-sucedida!' };
    } else {
        const errorText = await response.text();
        let errorMessage = `Falha na conexão (${response.status}): `;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage += errorJson.detail || errorJson.message || response.statusText;
        } catch {
            errorMessage += response.statusText;
        }
        return { success: false, message: errorMessage };
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    if (error instanceof Error) {
        return { success: false, message: `Erro de rede: ${error.message}` };
    }
    return { success: false, message: 'Não foi possível conectar à API. Verifique a rede ou o proxy.' };
  }
};

export const createDisciplina = async (
  descricao: string,
  settings: ClassbuildSettings
): Promise<Disciplina> => {
  const url = `${PROXY_BASE_URL}/api/v1/escolas/${settings.escolaId}/disciplinas?format=json`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(settings.apiKey),
      body: JSON.stringify({ descricao }),
    });
    const newDisciplina = await handleApiResponse(response);
    if (!newDisciplina.id || !newDisciplina.descricao) {
        throw new Error('A API retornou uma resposta malformada ao criar a disciplina.');
    }
    return newDisciplina;
  } catch (error) {
    console.error('Error creating disciplina:', error);
    if (error instanceof Error) {
      throw new Error(`Falha ao criar disciplina: ${error.message}`);
    }
    throw new Error('Não foi possível criar a disciplina. Verifique suas configurações e conexão.');
  }
};

export const createAssunto = async (
  descricao: string,
  disciplinaId: string,
  settings: ClassbuildSettings
): Promise<Assunto> => {
    const url = `${PROXY_BASE_URL}/api/v1/disciplinas/${disciplinaId}/assuntos?format=json`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(settings.apiKey),
            body: JSON.stringify({ 
                descricao,
                disciplina: { id: disciplinaId }
            }),
        });
        const newAssunto = await handleApiResponse(response);
        if (!newAssunto.id || !newAssunto.descricao) {
            throw new Error('A API retornou uma resposta malformada ao criar o assunto.');
        }
        return newAssunto;
    } catch (error) {
        console.error('Error creating assunto:', error);
        if (error instanceof Error) {
            throw new Error(`Falha ao criar assunto: ${error.message}`);
        }
        throw new Error('Não foi possível criar o assunto. Verifique suas configurações e conexão.');
    }
};

const formatQuestionForApi = (question: QuestionToSend, disciplina: Disciplina, assunto: Assunto) => {
    return {
        enunciado: question.enunciado,
        resolucao: question.resolucao || null,
        dica: question.dica || null,
        alternativaLetraCorreta: question.correta,
        disciplina: { id: disciplina.id },
        assuntos: [{ id: assunto.id }],
        alternativas: question.alternativas.map(alt => ({
            alternativaLetra: alt.letra,
            texto: alt.texto
        })),
        ano: new Date().getFullYear().toString(),
        classeDescricao: "Concurso",
        banca: "Gerado por IA",
        orgao: "N/A",
        prova: null,
        nivelQuestao: "MEDIO",
        tipoQuestao: "OBJETIVA_MULTIPLA_ESCOLHA",
        dificuldadeQuestao: "MEDIO",
    };
};

export const sendQuestionsToClassbuild = async (
  questions: QuestionToSend[],
  settings: ClassbuildSettings,
  disciplina: Disciplina,
  assunto: Assunto,
  onProgress: (report: SendReport) => void
): Promise<SendReport> => {
  const report: SendReport = {
    total: questions.length,
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  for (const question of questions) {
    // Throttle requests by waiting 1.5 seconds as per the support script's recommendation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const url = `${PROXY_BASE_URL}/api/v1/bancos-questao/interna/${settings.bancoQuestaoId}/questao?format=json`;

    try {
      const payload = formatQuestionForApi(question, disciplina, assunto);
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(settings.apiKey),
        body: JSON.stringify(payload),
      });
      await handleApiResponse(response);
      report.successCount++;
    } catch (error: any) {
      report.errorCount++;
      report.errors.push({
        questionId: question.id,
        message: error.message || 'Ocorreu um erro desconhecido.',
      });
    }
    onProgress({ ...report });
  }

  return report;
};