import { Role as SupabaseRole } from '@supabase/supabase-js';

export type Role = 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string;
  email: string;
  registrationDate: string;
  status: 'active' | 'inactive';
  enrolledCoursesCount?: number;
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
  resolucao: string;
  dica: string;
  created_at?: string;
  disciplina_id?: string;
  assunto_id?: string;
  lotes?: string;
}

// For sending to Classbuild API, without extra fields
export interface QuestionToSend {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
  correta: string;
  resolucao: string;
  dica: string;
}


export interface Curso {
    id: string;
    descricao: string;
}

export interface Modulo {
    id: string;
    descricao: string;
    cursoId: string;
    curso_id?: string; // from supabase
}

export interface Disciplina {
    id:string;
    descricao: string;
    moduloId?: string;
    modulo_id?: string; // from supabase
}

export interface Assunto {
    id: string;
    descricao: string;
    disciplinaId: string;
    disciplina_id?: string; // from supabase
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  targetAudience: string;
  steps: {
    step: number;
    title: string;
    description: string;
  }[];
  created_at?: string;
}

export interface ClassbuildSettings {
  apiKey: string;
  escolaId: string;
  bancoQuestaoId: string;
}

export type SendStatus = 'sending' | 'complete';

export interface SendReport {
  total: number;
  successCount: number;
  errorCount: number;
  errors: { questionId: number; message: string }[];
}

export interface Test {
    id: string;
    title: string;
    scheduledDate: string;
    scheduled_date?: string; // from supabase
    assignedTo: string[];
}

export interface MaterialEstudo {
    id: string;
    titulo: string;
    tipo: 'pdf' | 'ppt' | 'video';
    url?: string;
    disciplina_id: string;
    assunto_id: string;
}

// New types for gamification, flashcards, and test attempts

export interface Flashcard {
  id: string;
  deck_id: string;
  frente: string;
  verso: string;
}

export interface FlashcardDeck {
  id: string;
  assunto_id: string;
  aluno_id: string;
  titulo: string;
  assunto?: Assunto; // Optional relation for display
}

export interface TestAttempt {
  id: string;
  aluno_id: string;
  teste_id: string;
  score: number;
  completed_at: string;
  teste?: Test; // Optional relation for display
}

export interface GamificationStats {
  aluno_id: string;
  xp: number;
  level: number;
  study_streak: number;
}

export interface PracticeProgress {
  aluno_id: string;
  assunto_id: string;
  questoes_respondidas: number[];
  questoes_corretas: number[];
  questoes_com_dica: number[];
}