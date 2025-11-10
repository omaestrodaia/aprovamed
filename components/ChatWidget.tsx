import React, { useState } from 'react';

const MessageSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-700 transition-transform transform hover:scale-110"
                aria-label="Open chat"
            >
                <MessageSquareIcon className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col animate-fade-in-fast z-50">
            <header className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="font-bold text-white">Assistente AI</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </header>
            <div className="flex-1 p-4 text-center text-gray-500 flex items-center justify-center">
                <p>Chat funcionalidade em construção.</p>
            </div>
            <footer className="p-4 border-t border-gray-700">
                <input
                    type="text"
                    placeholder="Pergunte algo..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-gray-200"
                    disabled
                />
            </footer>
        </div>
    );
};
