import React from 'react';
import { Role } from '../types';
import { BrainCircuitIcon } from '../components/icons';

interface RoleSelectorProps {
    onSelectRole: (role: Role) => void;
}

const RoleCard: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full max-w-sm p-8 bg-white border border-gray-200 rounded-xl text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
        <h3 className="text-2xl font-bold text-blue-600">{title}</h3>
        <p className="mt-2 text-gray-500">{description}</p>
    </button>
);

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="text-center mb-12">
                <img src="https://pub-872633efa2d545638be12ea86363c2ca.r2.dev/WhatsApp%20Image%202025-11-09%20at%2013.47.15.png" alt="AprovaMed Logo" className="h-20 mx-auto mb-6" />
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Sua plataforma de aprendizado inteligente. Escolha seu perfil para começar.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <RoleCard
                    title="Administrador"
                    description="Gerencie conteúdo, crie testes e acompanhe o progresso dos alunos."
                    onClick={() => onSelectRole('admin')}
                />
                <RoleCard
                    title="Aluno"
                    description="Acesse materiais de estudo, realize testes e aprimore seus conhecimentos."
                    onClick={() => onSelectRole('student')}
                />
            </div>
             <p className="mt-16 text-sm text-gray-400">
                Este é um protótipo. A seleção de perfil simula a experiência de login.
            </p>
        </div>
    );
};