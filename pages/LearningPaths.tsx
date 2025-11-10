

import React, { useState, useEffect } from 'react';
import { LearningPath, User } from '../types';
import { EditIcon, TrashIcon, SparklesIcon, TrendingUpIcon } from '../components/icons';
import { generateLearningPath } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);


const LearningPaths: React.FC = () => {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: pathsData, error: pathsError } = await supabase.from('trilhas_aprendizagem').select('*').order('created_at', { ascending: false });
            if (pathsError) throw pathsError;
            setPaths(pathsData as LearningPath[]);
            
            const { data: studentsData, error: studentsError } = await supabase.from('alunos').select('*');
            if(studentsError) throw studentsError;
            setStudents(studentsData as User[]);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePath = async () => {
        if (!prompt.trim()) {
            setError("Por favor, descreva a trilha que deseja criar.");
            return;
        };
        setIsGenerating(true);
        setError(null);
        try {
            const newPathData = await generateLearningPath(prompt);
            const { data, error: insertError } = await supabase
                .from('trilhas_aprendizagem')
                .insert([newPathData])
                .select();

            if (insertError) throw insertError;
            
            if (data) {
                setPaths(prev => [data[0] as LearningPath, ...prev]);
            }
            setPrompt('');
        } catch (e: any) {
            setError(e.message || 'Falha ao gerar a trilha. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDeletePath = async (id: string) => {
        if(window.confirm('Tem certeza que deseja remover esta trilha?')) {
            const { error } = await supabase.from('trilhas_aprendizagem').delete().eq('id', id);
            if (error) {
                alert('Erro ao deletar trilha: ' + error.message);
            } else {
                setPaths(prev => prev.filter(p => p.id !== id));
            }
        }
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Trilhas de Aprendizado com IA</h1>
                <p className="text-gray-600 mt-1">Crie planos de estudo personalizados baseados em performance.</p>
            </header>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                 <h2 className="text-xl font-bold text-gray-800">Gerador de Trilhas Inteligente</h2>
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                    <p>Descreva um objetivo de aprendizado e a IA irá gerar uma trilha de estudos estruturada com etapas, títulos e descrições para guiar o aluno.</p>
                 </div>
                 
                 <div className="space-y-2">
                     <label htmlFor="student-select" className="text-sm font-medium text-gray-700">Selecione o Aluno (opcional, para contexto futuro)</label>
                     <select id="student-select" className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                         <option>Escolha um aluno...</option>
                         {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                 </div>

                 <div className="space-y-2">
                     <label htmlFor="path-prompt" className="text-sm font-medium text-gray-700">Descreva a trilha</label>
                      <textarea
                        id="path-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Crie uma trilha intensiva de 2 semanas sobre Arritmias Cardíacas para alunos avançados, focando em diagnóstico e tratamento..."
                    />
                 </div>
                 {error && <p className="text-red-600 text-sm">{error}</p>}

                 <button
                    onClick={handleGeneratePath}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                    <SparklesIcon className="w-5 h-5" />
                    {isGenerating ? 'Gerando...' : 'Gerar Trilha com IA'}
                </button>
            </div>

            <div className="space-y-4">
                 <h2 className="text-xl font-bold text-gray-800">Trilhas Criadas</h2>
                    {loading ? <p>Carregando trilhas...</p> : paths.map(path => (
                        <div key={path.id} className="bg-white border border-gray-200 rounded-lg p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-blue-600">{path.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        <span>Duração: {path.duration}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>Público: {path.targetAudience}</span>
                                    </div>
                                    <p className="mt-2 text-gray-600 max-w-3xl">{path.description}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-100" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeletePath(path.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100" title="Remover"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="mt-4 border-t border-gray-200 pt-4">
                               <h4 className="font-semibold mb-2 text-gray-700">Etapas da Trilha:</h4>
                               <div className="space-y-2">
                                   {path.steps.map(step => (
                                       <div key={step.step} className="flex items-start gap-4 p-3 rounded bg-gray-50">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded-full">{step.step}</div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{step.title}</p>
                                                <p className="text-sm text-gray-600">{step.description}</p>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                            </div>
                        </div>
                    ))}
                    {!loading && paths.length === 0 && (
                        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                            <TrendingUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhuma trilha de aprendizagem criada.</p>
                             <p className="text-gray-500 text-sm">Use o Gerador de Trilhas Inteligente para começar.</p>
                        </div>
                    )}
                </div>
        </div>
    );
};

export default LearningPaths;
