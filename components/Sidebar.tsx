import React from 'react';
import { User } from '../types';
import { 
    BrainCircuitIcon, 
    LayoutDashboardIcon, 
    BookOpenIcon, 
    ClipboardListIcon, 
    UsersIcon,
    LogOutIcon,
    FileQuestionIcon,
    TrendingUpIcon,
    UploadCloudIcon,
    GraduationCapIcon,
    FolderKanbanIcon,
    BookCopyIcon
} from './icons';

// Fix: Removed local icon definitions as they were moved to the central icons.tsx file.

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
            ? 'bg-purple-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
    >
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
        <span className="ml-3">{label}</span>
    </button>
);

const NavHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">{title}</h3>
);


const AdminNav: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => (
    <>
        <NavHeader title="Administração" />
        <NavItem icon={<LayoutDashboardIcon />} label="Dashboard Admin" isActive={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        
        <NavHeader title="Gestão Acadêmica" />
        <NavItem icon={<FolderKanbanIcon />} label="Módulos" isActive={currentPage === 'modulos'} onClick={() => setCurrentPage('modulos')} />
        <NavItem icon={<GraduationCapIcon />} label="Disciplinas" isActive={currentPage === 'disciplinas'} onClick={() => setCurrentPage('disciplinas')} />
        <NavItem icon={<BookOpenIcon />} label="Assuntos" isActive={currentPage === 'assuntos'} onClick={() => setCurrentPage('assuntos')} />
        <NavItem icon={<BookCopyIcon />} label="Material de Estudo" isActive={currentPage === 'material-estudo'} onClick={() => setCurrentPage('material-estudo')} />
        
        <NavHeader title="Conteúdo e Avaliações" />
        <NavItem icon={<UploadCloudIcon />} label="Upload Questões" isActive={currentPage === 'upload-questions'} onClick={() => setCurrentPage('upload-questions')} />
        <NavItem icon={<FileQuestionIcon />} label="Banco de Questões" isActive={currentPage === 'question-bank'} onClick={() => setCurrentPage('question-bank')} />
        <NavItem icon={<TrendingUpIcon />} label="Trilhas com IA" isActive={currentPage === 'paths'} onClick={() => setCurrentPage('paths')} />
        <NavItem icon={<ClipboardListIcon />} label="Testes Agendados" isActive={currentPage === 'tests'} onClick={() => setCurrentPage('tests')} />
        
        <NavHeader title="Usuários" />
        <NavItem icon={<UsersIcon />} label="CRM Alunos" isActive={currentPage === 'students'} onClick={() => setCurrentPage('students')} />
    </>
);

const StudentNav: React.FC<{ currentPage: string, setCurrentPage: (page: string) => void }> = ({ currentPage, setCurrentPage }) => (
     <>
        <NavItem icon={<LayoutDashboardIcon />} label="Meu Painel" isActive={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon={<BookOpenIcon />} label="Área de Estudo" isActive={currentPage === 'study'} onClick={() => setCurrentPage('study')} />
        <NavItem icon={<ClipboardListIcon />} label="Meus Testes" isActive={currentPage === 'tests'} onClick={() => setCurrentPage('tests')} />
    </>
);

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, currentPage, setCurrentPage }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4">
      <div className="flex items-center space-x-3 mb-6 px-2">
        <div className="bg-purple-100 p-2 rounded-lg">
            <BrainCircuitIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
            <h1 className="text-md font-bold text-gray-800">Edu-Genius AI</h1>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {user.role === 'admin' ? 
            <AdminNav currentPage={currentPage} setCurrentPage={setCurrentPage} /> : 
            <StudentNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        }
      </nav>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <div className="flex items-center p-2">
            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
            <div className="ml-3">
                <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
            </div>
        </div>
        <button onClick={onLogout} className="flex items-center w-full mt-2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors">
            <LogOutIcon className="w-5 h-5" />
            <span className="ml-3">Sair</span>
        </button>
      </div>
    </aside>
  );
};