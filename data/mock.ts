import { User, Curso, Modulo, Disciplina, Assunto, Question, StudentProgress, Test, LearningPath, MaterialEstudo } from '../types';

// These users are only for the initial role selection screen to simulate a login.
export const mockLoginUsers: User[] = [
    { 
        id: 'admin-1', 
        name: 'Dr. Admin', 
        role: 'admin', 
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
        email: 'admin@edu-genius.ai',
        registrationDate: '2023-01-15',
        status: 'active'
    },
    { 
        id: 'student-1', 
        name: 'Aluno Padrão', 
        role: 'student', 
        avatarUrl: 'https://i.pravatar.cc/150?u=student1',
        email: 'aluno.padrao@email.com',
        registrationDate: '2023-08-20',
        status: 'active'
    },
];

// The application will start with these empty arrays, to be populated manually by the admin.
export const mockStudents: User[] = [];

export const mockCursos: Curso[] = [
    { id: 'c-1', descricao: 'Curso Preparatório Principal' }
];

export const mockModulos: Modulo[] = [];

export const mockDisciplinas: Disciplina[] = [];

export const mockAssuntos: Assunto[] = [];

export const mockMaterialEstudo: MaterialEstudo[] = [];

export const mockQuestions: Question[] = [];

export const mockStudentProgress: StudentProgress[] = [];

export const mockTests: Test[] = [];

export const mockLearningPaths: LearningPath[] = [];