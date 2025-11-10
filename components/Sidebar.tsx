
import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboardIcon,
  UsersIcon,
  ClipboardListIcon,
  LogOutIcon,
  UploadCloudIcon,
  FileQuestionIcon,
  GraduationCapIcon,
  FolderKanbanIcon,
  TrendingUpIcon,
  BookCopyIcon,
} from './icons';

interface SidebarProps {
  userRole: Role;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
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
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon className="w-6 h-6" /> },
  { id: 'upload-questions', label: 'Upload de Questões', icon: <UploadCloudIcon className="w-6 h-6" /> },
  { id: 'question-bank', label: 'Banco de Questões', icon: <FileQuestionIcon className="w-6 h-6" /> },
  { id: 'academic-management', label: 'Gestão Acadêmica', icon: <FolderKanbanIcon className="w-6 h-6" /> },
  { id: 'study-material', label: 'Material de Estudo', icon: <BookCopyIcon className="w-6 h-6" /> },
  { id: 'tests', label: 'Agendar Testes', icon: <ClipboardListIcon className="w-6 h-6" /> },
  { id: 'learning-paths', label: 'Trilhas de IA', icon: <TrendingUpIcon className="w-6 h-6" /> },
  { id: 'students', label: 'Alunos (CRM)', icon: <UsersIcon className="w-6 h-6" /> },
];

const studentNavItems = [
  { id: 'dashboard', label: 'Meu Painel', icon: <LayoutDashboardIcon className="w-6 h-6" /> },
  { id: 'study-area', label: 'Área de Estudo', icon: <GraduationCapIcon className="w-6 h-6" /> },
  { id: 'my-tests', label: 'Meus Testes', icon: <ClipboardListIcon className="w-6 h-6" /> },
];


export const Sidebar: React.FC<SidebarProps> = ({ userRole, currentPage, setCurrentPage, onLogout }) => {
  const navItems = userRole === 'admin' ? adminNavItems : studentNavItems;

  return (
    <aside className="w-64 bg-white flex flex-col border-r border-gray-200">
      <div className="p-4 flex items-center justify-center border-b border-gray-200 h-20">
         <img src="https://i.imgur.com/4I15n6c.png" alt="AprovaMed Logo" className="h-12 w-auto" />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.id}
            onClick={() => setCurrentPage(item.id)}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <NavItem
          icon={<LogOutIcon className="w-6 h-6" />}
          label="Sair"
          isActive={false}
          onClick={onLogout}
        />
      </div>
    </aside>
  );
};