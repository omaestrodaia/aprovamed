import React from 'react';
import { User } from '../types';
import { Sidebar } from './Sidebar';
import { ChatWidget } from './ChatWidget';

interface LayoutProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentPage, setCurrentPage, onLogout, children }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar
                userRole={user.role}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onLogout={onLogout}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-end items-center p-4 bg-white border-b border-gray-200">
                     <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-700">{user.name}</span>
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                    </div>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </main>
            {user.role === 'student' && <ChatWidget currentPage={currentPage} />}
        </div>
    );
};
