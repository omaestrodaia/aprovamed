// types.ts

// Fix: Removed StudentProgress from import as it's not defined in types.ts.
import { User, Curso, Modulo, Disciplina, Assunto, Question, Test, LearningPath, MaterialEstudo } from '../types';

// DEPRECATED: Real authentication is now handled by Supabase.

// All data is now fetched from Supabase. These arrays are kept to prevent import errors.
export const mockStudents: User[] = [];
export const mockCursos: Curso[] = [];
export const mockModulos: Modulo[] = [];
export const mockDisciplinas: Disciplina[] = [];
export const mockAssuntos: Assunto[] = [];
export const mockMaterialEstudo: MaterialEstudo[] = [];
export const mockQuestions: Question[] = [];
// Fix: Changed StudentProgress[] to any[] as the type is not defined.
export const mockStudentProgress: any[] = [];
export const mockTests: Test[] = [];
export const mockLearningPaths: LearningPath[] = [];