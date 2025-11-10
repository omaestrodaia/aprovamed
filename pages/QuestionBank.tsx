import React, { useState, useMemo } from 'react';
import { FileUpload } from '../components/FileUpload';
import { QuestionEditorModal } from '../components/QuestionEditorModal';
import { EditIcon, TrashIcon, SparklesIcon, FileTextIcon } from '../components/icons';
import { processQuestionsFile } from '../services/geminiService';
import { Question, Disciplina, Assunto } from '../types';

// Helper to truncate text
const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

type FilePattern = 'pattern1' | 'pattern2';

const QuestionBank: React.FC<{ disciplinas: Disciplina[], assuntos: Assunto[] }> = ({ disciplinas, assuntos }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [batchName, setBatchName] = useState('');
    const [filePattern, setFilePattern] = useState<FilePattern>('pattern2'); // Default to MedGrupo
    
    const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
    const [batchDisciplinaId, setBatchDisciplinaId] = useState<string>('');
    const [batchAssuntoId, setBatchAssuntoId] = useState<string>('');


    const handleFileProcess = async () => {
        if (!selectedFile) return;
        setIsProcessing(true);
        setError(null);
        
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            try {
                const base64String = (reader.result as string).split(',')[1];
                const processedQuestions = await processQuestionsFile(base64String, selectedFile.type, filePattern);
                setQuestions(processedQuestions);
            } catch (e: any) {
                setError(e.message || 'An unknown error occurred during file processing.');
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            setError('Failed to read the file.');
            setIsProcessing(false);
        };
    };
    
    const resetUploadState = () => {
        setQuestions([]);
        setSelectedFile(null);
        setBatchName('');
        setError(null);
        setSelectedQuestions(new Set());
    }

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
    };

    const handleSaveEditedQuestion = (updatedQuestion: Question) => {
        setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
        setEditingQuestion(null);
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (window.confirm('Tem certeza que deseja remover esta questão?')) {
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            setSelectedQuestions(prev => {
                const newSet = new Set(prev);
                newSet.delete(questionId);
                return newSet;
            })
        }
    };
    
    const handleSelect = (id: number) => {
        setSelectedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedQuestions(new Set(questions.map(q => q.id)));
        } else {
            setSelectedQuestions(new Set());
        }
    };
    
    const handleAssignDisciplina = (questionId: number, disciplinaId: string) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? {...q, disciplinaId, assuntoId: ''} : q));
    };

    const handleAssignAssunto = (questionId: number, assuntoId: string) => {
        setQuestions(prev => prev.map(q => q.id === questionId ? {...q, assuntoId} : q));
    };

    const handleApplyBatch = () => {
        if (!batchDisciplinaId) return;
        setQuestions(prev => 
            prev.map(q => 
                selectedQuestions.has(q.id) 
                ? { ...q, disciplinaId: batchDisciplinaId, assuntoId: batchAssuntoId || '' } 
                : q
            )
        );
        setSelectedQuestions(new Set());
        setBatchDisciplinaId('');
        setBatchAssuntoId('');
    };

    const isAllSelected = questions.length > 0 && selectedQuestions.size === questions.length;
    const batchAssuntosFiltrados = batchDisciplinaId ? assuntos.filter(a => a.disciplinaId === batchDisciplinaId) : [];


    if (questions.length === 0) {
         return (
             <div className="space-y-6 animate-fade-in">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900">Upload de Arquivo</h1>
                    <p className="text-gray-600 mt-1">Envie seu PDF, DOCX ou XLSX com questões.</p>
                </header>
                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md" role="alert">
                        <strong>Erro:</strong> {error}
                    </div>
                )}
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-lg">
                    <p><span className="font-bold">Importante:</span> O sistema extrairá automaticamente TODAS as questões e seus respectivos gabaritos. Após a extração, verifique se tudo foi importado corretamente.</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Configuração do Lote</h2>
                        <div>
                            <label htmlFor="batchName" className="text-sm font-medium text-gray-700">Nome do Lote</label>
                            <input
                                id="batchName"
                                type="text"
                                value={batchName}
                                onChange={e => setBatchName(e.target.value)}
                                placeholder="Ex: Simulado ENEM 2024, Concurso Público SP, etc."
                                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Este nome ajudará você a identificar o conjunto de questões.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Padrão do Arquivo</label>
                            <fieldset className="mt-2">
                                <legend className="sr-only">Tipo de Padrão do Arquivo</legend>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <input id="pattern1" name="file-pattern" type="radio" checked={filePattern === 'pattern1'} onChange={() => setFilePattern('pattern1')} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                                        <label htmlFor="pattern1" className="ml-2 block text-sm text-gray-900">Padrão 1 (Detalhado)</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="pattern2" name="file-pattern" type="radio" checked={filePattern === 'pattern2'} onChange={() => setFilePattern('pattern2')} className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500" />
                                        <label htmlFor="pattern2" className="ml-2 block text-sm text-gray-900">Padrão 2 (MedGrupo)</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />

                    <button
                        onClick={handleFileProcess}
                        disabled={!selectedFile || isProcessing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                        {isProcessing ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5" />}
                        {isProcessing ? 'Extraindo...' : 'Extrair todas as Questões'}
                    </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-300 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                    <SparklesIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-bold">Extração Aprimorada</h3>
                        <p>Nossa IA foi otimizada para identificar e extrair TODAS as questões e gabaritos do seu documento. Após a extração, sempre verifique se o número de questões está correto.</p>
                    </div>
                </div>
            </div>
         )
    }

    return (
         <div className="space-y-6 animate-fade-in">
            <QuestionEditorModal isOpen={!!editingQuestion} onClose={() => setEditingQuestion(null)} question={editingQuestion} onSave={handleSaveEditedQuestion} />
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
                <p className="text-gray-600 mt-1">Gerencie as questões extraídas e vincule-as a disciplinas e assuntos.</p>
            </header>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                       <FileTextIcon className="w-6 h-6 mr-3 text-purple-600" /> 
                       {questions.length} Questões Extraídas do Lote: <span className="font-bold ml-2">{batchName || 'Sem nome'}</span>
                    </h2>
                    <button onClick={resetUploadState} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700">
                        Processar Novo Arquivo
                    </button>
                </div>
                
                {selectedQuestions.size > 0 && (
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 animate-fade-in">
                        <span className="font-semibold text-purple-800">{selectedQuestions.size} questão(ões) selecionada(s)</span>
                        <div className="flex-grow flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <select value={batchDisciplinaId} onChange={e => {setBatchDisciplinaId(e.target.value); setBatchAssuntoId('')}} className="w-full md:w-64 select-style">
                                <option value="">Vincular à Disciplina...</option>
                                {disciplinas.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                            </select>
                            <select value={batchAssuntoId} onChange={e => setBatchAssuntoId(e.target.value)} disabled={!batchDisciplinaId} className="w-full md:w-64 select-style">
                                <option value="">Vincular ao Assunto...</option>
                                {batchAssuntosFiltrados.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
                            </select>
                        </div>
                        <button onClick={handleApplyBatch} disabled={!batchDisciplinaId} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 w-full md:w-auto">Aplicar</button>
                    </div>
                )}
                
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 w-12"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /></th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">ID</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Enunciado</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Gabarito</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Disciplina</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Assunto</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {questions.map(q => {
                                    const rowAssuntos = q.disciplinaId ? assuntos.filter(a => a.disciplinaId === q.disciplinaId) : [];
                                    return (
                                        <tr key={q.id} className={`transition-colors ${selectedQuestions.has(q.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                                            <td className="p-4"><input type="checkbox" checked={selectedQuestions.has(q.id)} onChange={() => handleSelect(q.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" /></td>
                                            <td className="p-4 text-gray-600 font-mono text-xs">{q.id}</td>
                                            <td className="p-4 text-gray-800 max-w-sm" title={q.enunciado}><div className="truncate">{q.enunciado}</div></td>
                                            <td className="p-4 text-center font-bold text-purple-700">{q.correta || '?'}</td>
                                            <td className="p-4 min-w-[200px]">
                                                <select value={q.disciplinaId || ''} onChange={(e) => handleAssignDisciplina(q.id, e.target.value)} className="w-full text-sm select-style">
                                                    <option value="">Selecione...</option>
                                                    {disciplinas.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-4 min-w-[200px]">
                                                <select value={q.assuntoId || ''} onChange={(e) => handleAssignAssunto(q.id, e.target.value)} disabled={!q.disciplinaId} className="w-full text-sm select-style">
                                                    <option value="">Selecione...</option>
                                                    {rowAssuntos.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                 <div className="flex items-center space-x-1 justify-end">
                                                    <button onClick={() => handleEditQuestion(q)} className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors" title="Editar">
                                                        <EditIcon className="w-5 h-5"/>
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors" title="Remover">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                         {questions.length === 0 && (
                            <div className="text-center py-10 text-gray-500">Nenhuma questão encontrada.</div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .select-style {
                    background-color: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    color: #1F2937;
                    -webkit-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1.5em 1.5em;
                    padding-right: 2.5rem;
                }
                .select-style:focus {
                    --tw-ring-color: #8B5CF6;
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                    border-color: #8B5CF6;
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                }
                 .select-style:disabled {
                    opacity: 0.5;
                    background-color: #F3F4F6;
                }
            `}</style>
        </div>
    );
};

export default QuestionBank;