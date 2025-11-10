import React, { useState } from 'react';
import { LearningPath } from '../types';
import { XIcon, SparklesIcon } from './icons';
import { generateLearningPath } from '../services/geminiService';

interface LearningPathAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPath: Omit<LearningPath, 'id'>) => void;
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export const LearningPathAiModal: React.FC<LearningPathAiModalProps> = ({ isOpen, onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPath, setGeneratedPath] = useState<Omit<LearningPath, 'id'> | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedPath(null);
        try {
            const result = await generateLearningPath(prompt);
            setGeneratedPath(result);
        } catch (e: any) {
            setError(e.message || 'Falha ao gerar a trilha. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedPath) {
            onSave(generatedPath);
            handleClose();
        }
    };

    const handleClose = () => {
        setPrompt('');
        setError(null);
        setGeneratedPath(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700">
                <div className="flex justify-between items-center p-5 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><SparklesIcon className="w-6 h-6 text-sky-400" /> Criar Trilha com IA</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {!generatedPath ? (
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Descreva a trilha de aprendizagem que você deseja criar:</label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={6}
                                className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-sky-500"
                                placeholder="Ex: Crie uma trilha intensiva de 2 semanas sobre Arritmias Cardíacas para alunos avançados, focando em diagnóstico e tratamento..."
                            />
                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                             <h3 className="text-2xl font-bold text-sky-400">{generatedPath.title}</h3>
                             <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Duração: {generatedPath.duration}</span> | <span>Público: {generatedPath.targetAudience}</span>
                             </div>
                             <p>{generatedPath.description}</p>
                             <div className="mt-4 border-t border-gray-700 pt-4">
                               <h4 className="font-semibold mb-2 text-gray-200">Etapas Sugeridas:</h4>
                               <div className="space-y-2">
                                   {generatedPath.steps.map(step => (
                                       <div key={step.step} className="flex items-start gap-4 p-3 rounded bg-gray-700/50">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-sky-800 text-sky-300 font-bold rounded-full">{step.step}</div>
                                            <div>
                                                <p className="font-semibold text-white">{step.title}</p>
                                                <p className="text-sm text-gray-400">{step.description}</p>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center p-5 border-t border-gray-700 bg-gray-800/50 rounded-b-xl space-x-3">
                    <button onClick={handleClose} className="px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600">Cancelar</button>
                    {!generatedPath ? (
                        <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-40 px-5 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-sky-800/50 flex justify-center items-center">
                            {isLoading ? <Spinner /> : "Gerar Trilha"}
                        </button>
                    ) : (
                         <button onClick={handleSave} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Salvar Trilha</button>
                    )}
                </div>
            </div>
        </div>
    );
};
