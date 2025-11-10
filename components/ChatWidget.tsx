import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, XIcon } from './icons';
import { getChatResponse } from '../services/geminiService';

interface ChatWidgetProps {
    currentPage: string;
}

type Message = {
    role: 'user' | 'model';
    text: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const historyForApi = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));
        historyForApi.push({ role: 'user', parts: [{text: userMessage.text }]});

        try {
            const context = `O aluno está atualmente na página: ${currentPage}.`;
            const responseText = await getChatResponse(historyForApi, context);
            const modelMessage: Message = { role: 'model', text: responseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
             const errorMessage: Message = { role: 'model', text: "Desculpe, ocorreu um erro." };
             setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
                title="Abrir assistente IA"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 animate-fade-in-fast z-50">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    Assistente IA
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                 {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                           {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="p-3 rounded-2xl bg-gray-200 text-gray-500">
                           <div className="flex items-center space-x-1">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                           </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Pergunte algo..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};