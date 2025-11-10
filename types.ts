// types.ts

export type Role = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  registrationDate: string;
  status: 'active' | 'inactive';
}

export interface Curso {
    id: string;
    descricao: string;
}

export interface Modulo {
    id: string;
    cursoId: string;
    descricao: string;
}

export interface Disciplina {
  id: string;
  moduloId: string;
  descricao: string;
}

export interface Assunto {
  id: string;
  disciplinaId: string;
  descricao: string;
}

export interface MaterialEstudo {
    id: string;
    tipo: 'pdf' | 'ppt' | 'video';
    titulo: string;
    url: string; // URL for video or path for file
    disciplinaId: string;
    assuntoId: string;
}


export interface Alternativa {
    letra: string;
    texto: string;
}

export interface Question {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
  correta: string;
  resolucao?: string;
  dica?: string;
  disciplinaId?: string;
  assuntoId?: string;
}

// Type used when sending to Classbuild API, which might have a slightly different structure
export interface QuestionToSend extends Omit<Question, 'disciplinaId' | 'assuntoId'> {}

export interface ClassbuildSettings {
  apiKey: string;
  escolaId: string;
  bancoQuestaoId: string;
}

export interface SendReport {
  total: number;
  successCount: number;
  errorCount: number;
  errors: { questionId: number; message: string }[];
}

export type SendStatus = 'sending' | 'complete';

export interface StudentProgress {
  studentId: string;
  completedTests: number;
  averageScore: number;
  studyTime?: number;
  lastActivity: string;
}

export interface Test {
  id: string;
  title: string;
  scheduledDate: string;
  assignedTo: string[]; // array of student IDs
}

export interface LearningPathStep {
    step: number;
    title: string;
    description: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  targetAudience: string;
  steps: LearningPathStep[];
}