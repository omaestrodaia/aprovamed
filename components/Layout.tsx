import React, { useState } from 'react';
import { User } from '../types';
import { Sidebar } from './Sidebar';

// Import all possible page components
import AdminDashboard from '../pages/AdminDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import ModuloManagement from '../pages/ModuloManagement';
import AcademicManagement from '../pages/AcademicManagement';
import MaterialEstudo from '../pages/MaterialEstudo';
import QuestionBank from '../pages/QuestionBank';
import LearningPaths from '../pages/LearningPaths';
import TestScheduling from '../pages/TestScheduling';
import StudentManagement from '../pages/StudentManagement';

// Mock data will be passed down from here, simulating a central state management
import { mockStudents, mockCursos, mockModulos, mockDisciplinas, mockAssuntos, mockStudentProgress, mockTests, mockLearningPaths, mockMaterialEstudo } from '../data/mock';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
    // These states simulate a global store or context for the prototype
    const [students, setStudents] = useState(mockStudents);
    const [cursos, setCursos] = useState(mockCursos);
    const [modulos, setModulos] = useState(mockModulos);
    const [disciplinas, setDisciplinas] = useState(mockDisciplinas);
    const [assuntos, setAssuntos] = useState(mockAssuntos);
    const [materialEstudo, setMaterialEstudo] = useState(mockMaterialEstudo);
    const [studentProgress, setStudentProgress] = useState(mockStudentProgress);
    const [tests, setTests] = useState(mockTests);
    const [learningPaths, setLearningPaths] = useState(mockLearningPaths);

    const [currentPage, setCurrentPage] = useState('dashboard');

    const renderAdminPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <AdminDashboard students={students} studentProgress={studentProgress} tests={tests} setCurrentPage={setCurrentPage} />;
            case 'modulos':
                return <ModuloManagement cursos={cursos} setCursos={setCursos} modulos={modulos} setModulos={setModulos} />;
            case 'disciplinas':
            case 'assuntos':
                return <AcademicManagement page={currentPage} modulos={modulos} disciplinas={disciplinas} setDisciplinas={setDisciplinas} assuntos={assuntos} setAssuntos={setAssuntos} />;
            case 'material-estudo':
                return <MaterialEstudo material={materialEstudo} setMaterial={setMaterialEstudo} disciplinas={disciplinas} assuntos={assuntos} />;
            case 'upload-questions':
            case 'question-bank':
                 return <QuestionBank disciplinas={disciplinas} assuntos={assuntos} />;
            case 'paths':
                return <LearningPaths paths={learningPaths} setPaths={setLearningPaths} students={students} />;
            case 'tests':
                return <TestScheduling tests={tests} setTests={setTests} />;
            case 'students':
                return <StudentManagement students={students} setStudents={setStudents} />;
            default:
                return <AdminDashboard students={students} studentProgress={studentProgress} tests={tests} setCurrentPage={setCurrentPage} />;
        }
    };
    
    const renderStudentPage = () => {
         switch (currentPage) {
            case 'dashboard':
                return <StudentDashboard />;
            case 'study':
                return <div className="text-gray-800">Área de Estudo (em construção)</div>;
            case 'tests':
                 return <div className="text-gray-800">Meus Testes (em construção)</div>;
            default:
                return <StudentDashboard />;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex">
            <Sidebar user={user} onLogout={onLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
                {user.role === 'admin' ? renderAdminPage() : renderStudentPage()}
            </main>
        </div>
    );
};