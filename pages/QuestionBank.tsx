import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Question, Disciplina, Assunto, Test, FlashcardDeck } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
    processQuestionsFile, 
    extractTextFromFile, 
    extractQuestionsFromChunk, 
    extractAnswersFromGabarito 
} from '../services/geminiService';
import { FileUpload } from '../components/FileUpload';
import { QuestionEditorModal } from '../components/QuestionEditorModal';
import { SaveQuestionsModal } from '../components/SaveQuestionsModal';
import { DashboardMetrics } from '../components/DashboardMetrics';
// FIX: Import XIcon to be used in the LinkQuestionsModal component.
import { EditIcon, TrashIcon, SearchIcon, SparklesIcon, XIcon } from '../components/icons';
import { useAcademicData } from '../contexts/AcademicDataContext';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// Main component for the Upload page
export const UploadQuestions: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loteName, setLoteName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPattern, setProcessingPattern] = useState<'pattern1' | 'pattern2'>('pattern2');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [progress, setProgress] = useState<{processed: number; total: number; status: string} | null>(null);
  const [saveProgress, setSaveProgress] = useState<{processed: number; total: number; status: string} | null>(null);

  // Use the central academic data context
  const { disciplinas, assuntos, refetch: refetchAcademicData } = useAcademicData();
  
  const handleProgress = useCallback((update: { processed: number, total: number, status: string }) => {
    setProgress(update);
  }, []);

  const handleFileProcess = async () => {
    if (!selectedFile || !loteName.trim()) {
        setError('Por favor, selecione um arquivo e forneça um nome para o lote.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedQuestionIds(new Set());
    
    try {
        const base64String = await fileToBase64(selectedFile);
        
        if (processingPattern === 'pattern1') {
            handleProgress({ processed: 0, total: 1, status: 'Processando arquivo...' });
            const processedQuestions = await processQuestionsFile(base64String, selectedFile.type, 'pattern1');
            setQuestions(processedQuestions.map((q, i) => ({ ...q, id: q.id || Date.now() + i } as Question)));
            handleProgress({ processed: 1, total: 1, status: 'Concluído!' });
        } else {
            // Orchestrate chunked processing for MedGrupo pattern
            handleProgress({ processed: 0, total: 100, status: 'Extraindo texto do documento...' });
            const fullText = await extractTextFromFile(base64String, selectedFile.type);
            
            const gabaritoIndex = fullText.search(/\n\s*Gabarito\s*\n/i);
            const questionsText = gabaritoIndex !== -1 ? fullText.substring(0, gabaritoIndex) : fullText;
            const answersText = gabaritoIndex !== -1 ? fullText.substring(gabaritoIndex) : "";

            // Improved regex: looks for newline, optional space, 1+ digits, optional space, and then a `)` or a `.`
            const questionBlocks = questionsText.split(/(?=\n\s*\d+\s*[.)])/).filter(block => block.trim().length > 20);
            
            const allQuestionsRaw: Partial<Question>[] = [];
            // Reduced chunk size for higher reliability with large files, preventing API timeouts.
            const CHUNK_SIZE = 20; 
            const totalChunks = Math.ceil(questionBlocks.length / CHUNK_SIZE);

            for (let i = 0; i < totalChunks; i++) {
                const chunkStart = i * CHUNK_SIZE;
                const chunkEnd = chunkStart + CHUNK_SIZE;
                const chunk = questionBlocks.slice(chunkStart, chunkEnd);
                const chunkText = chunk.join('\n\n---\n\n');
                
                const progressPercentage = 5 + Math.round(((i + 1) / totalChunks) * 85);
                handleProgress({ processed: progressPercentage, total: 100, status: `Analisando questões... (${i + 1}/${totalChunks})` });

                const questionsFromChunk = await extractQuestionsFromChunk(chunkText);
                allQuestionsRaw.push(...questionsFromChunk);
            }

            handleProgress({ processed: 95, total: 100, status: 'Analisando gabarito...' });
            const answerMap = await extractAnswersFromGabarito(answersText);

            handleProgress({ processed: 98, total: 100, status: 'Combinando resultados...' });
            const finalQuestions = allQuestionsRaw.map((q, i) => {
                const gabaritoInfo = q.id ? answerMap[String(q.id)] : null;
                return {
                    ...q,
                    id: q.id || Date.now() + i, // Ensure ID exists
                    correta: gabaritoInfo ? gabaritoInfo.correta : '',
                    resolucao: '', // User wants the commentary in the 'dica' field
                    dica: gabaritoInfo ? gabaritoInfo.comentario : '',
                } as Question;
            });

            setQuestions(finalQuestions);
            handleProgress({ processed: 100, total: 100, status: `${finalQuestions.length} questões extraídas!` });
        }
    } catch (e: any) {
      setError(e.message || 'Ocorreu um erro desconhecido durante o processamento.');
      setProgress(null);
    } finally {
      setIsLoading(false);
      // Keep progress bar at 100% on success
      if (!error) {
        setTimeout(() => setProgress(null), 5000);
      }
    }
  };

  const handleSelectQuestion = (id: number) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.size === questions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(questions.map(q => q.id)));
    }
  };

  const handleDeleteSelected = () => {
    setQuestions(prev => prev.filter(q => !selectedQuestionIds.has(q.id)));
    setSelectedQuestionIds(new Set());
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsEditorModalOpen(true);
  };
  
  const handleSaveQuestion = (updatedQuestion: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
    setEditingQuestion(null);
    setIsEditorModalOpen(false);
  };
  
  const handleSaveToDb = async ({ disciplinaId, assuntoId }: { disciplinaId: string, assuntoId: string }) => {
    setIsLoading(true);
    setIsSaveModalOpen(false); // Close the selection modal immediately to show progress on main page
  
    const questionsToSave = questions
      .filter(q => selectedQuestionIds.has(q.id))
      .map(q => {
        const { created_at, ...rest } = q;
        return { 
          ...rest, 
          disciplina_id: disciplinaId, 
          assunto_id: assuntoId, 
          lotes: loteName 
        };
      });
  
    const totalToSave = questionsToSave.length;
    if (totalToSave === 0) {
        alert("Nenhuma questão selecionada para salvar.");
        setIsLoading(false);
        return;
    }
  
    setSaveProgress({ processed: 0, total: totalToSave, status: 'Iniciando salvamento...' });
  
    const BATCH_SIZE = 50; // Process in chunks to avoid timeouts
    let successCount = 0;
    let anyError = null;
  
    try {
      for (let i = 0; i < totalToSave; i += BATCH_SIZE) {
        const batch = questionsToSave.slice(i, i + BATCH_SIZE);
        
        setSaveProgress({
            processed: i + batch.length,
            total: totalToSave,
            status: `Salvando ${i + batch.length} de ${totalToSave}...`
        });
  
        // Use onConflict to prevent errors if an ID already exists, making it a true upsert.
        const { error } = await supabase.from('questoes').upsert(batch, { onConflict: 'id' });
  
        if (error) {
          anyError = error;
          break; // Abort on first error
        }
        successCount += batch.length;
      }
  
      if (anyError) throw anyError;
      
      setSaveProgress({ processed: totalToSave, total: totalToSave, status: 'Concluído!' });
      alert(`${totalToSave} questões salvas com sucesso!`);
      // Reset state after successful save
      setQuestions([]);
      setSelectedFile(null);
      setLoteName('');
      setSelectedQuestionIds(new Set());
  
    } catch (error: any) {
      console.error("Error saving questions to Supabase:", error);
      setError(`Erro ao salvar após ${successCount} questões: ${error.message}`);
      setSaveProgress(null);
    } finally {
      setIsLoading(false);
      if (!anyError) {
        setTimeout(() => setSaveProgress(null), 5000);
      }
    }
  };

  const selectedQuestions = useMemo(() => {
    return questions.filter(q => selectedQuestionIds.has(q.id));
  }, [questions, selectedQuestionIds]);
  
  return (
    <div className="space-y-8 animate-fade-in">
        {/* Modals */}
        <QuestionEditorModal isOpen={isEditorModalOpen} onClose={() => setIsEditorModalOpen(false)} onSave={handleSaveQuestion} question={editingQuestion} disciplinas={disciplinas} assuntos={assuntos} />
        <SaveQuestionsModal 
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveToDb}
            disciplinas={disciplinas}
            assuntos={assuntos}
            questionCount={selectedQuestionIds.size}
        />

        <header>
            <h1 className="text-3xl font-bold text-gray-900">Upload de Questões</h1>
            <p className="text-gray-600 mt-1">Extraia e gerencie questões de arquivos usando IA.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Upload and Controls */}
            <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">1. Envie seu Arquivo</h2>
                    <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="font-bold text-lg mb-2 text-gray-800">2. Nome do Lote</h2>
                    <p className="text-sm text-gray-500 mb-4">Dê um nome a este conjunto de questões para facilitar a filtragem futura.</p>
                    <input 
                        type="text"
                        value={loteName}
                        onChange={e => setLoteName(e.target.value)}
                        placeholder="Ex: Prova de Choque Cardiogênico"
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg"
                    />
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">3. Escolha o Padrão</h2>
                     <select value={processingPattern} onChange={e => setProcessingPattern(e.target.value as any)} className="w-full p-3 bg-white border border-gray-300 rounded-lg">
                        <option value="pattern2">Padrão MedGrupo (ID, Enunciado, Alternativas)</option>
                        <option value="pattern1">Padrão Detalhado (com gabarito, resolução)</option>
                     </select>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="font-bold text-lg mb-4 text-gray-800">4. Iniciar Processamento</h2>
                    <button onClick={handleFileProcess} disabled={!selectedFile || !loteName.trim() || isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isLoading && progress ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5"/>}
                        {isLoading && progress ? 'Processando...' : 'Extrair Questões com IA'}
                    </button>
                    {progress && (
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm font-medium text-gray-600">
                                <span>{progress.status}</span>
                                <span>{progress.processed}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress.processed}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                 </div>
                 {questions.length > 0 && 
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h2 className="font-bold text-lg mb-4 text-gray-800">5. Salvar Questões</h2>
                        <DashboardMetrics totalQuestions={questions.length} selectedCount={selectedQuestionIds.size} questions={selectedQuestions} theme="light" />
                        <div className="mt-4 space-y-2">
                             <button 
                                onClick={() => setIsSaveModalOpen(true)}
                                disabled={selectedQuestionIds.size === 0 || isLoading}
                                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                              >
                                {isLoading && saveProgress ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : `Salvar ${selectedQuestionIds.size} Questões no Banco`}
                              </button>
                            {saveProgress && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>{saveProgress.status}</span>
                                        <span>{saveProgress.processed} / {saveProgress.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                                            style={{ width: `${saveProgress.total > 0 ? (saveProgress.processed / saveProgress.total) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                 }
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl">
                 <div className="p-5 border-b border-gray-200">
                    <h2 className="font-bold text-lg text-gray-800">Questões Extraídas</h2>
                    <p className="text-sm text-gray-500">Revise, edite e selecione as questões para salvar.</p>
                 </div>
                 {questions.length > 0 &&
                    <div className="p-5 flex justify-between items-center">
                        <div className="flex items-center">
                            <input type="checkbox" checked={selectedQuestionIds.size > 0 && selectedQuestionIds.size === questions.length} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                            <label className="ml-2 text-sm text-gray-600">Selecionar Tudo</label>
                        </div>
                         <button onClick={handleDeleteSelected} disabled={selectedQuestionIds.size === 0} className="px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 text-sm flex items-center gap-2">
                            <TrashIcon className="w-4 h-4" />
                            Deletar ({selectedQuestionIds.size})
                        </button>
                    </div>
                 }
                 <div className="overflow-y-auto max-h-[80vh]">
                     {questions.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-4"></th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">ID</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Enunciado</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Gabarito</th>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Ações</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-200">
                                {questions.map(q => (
                                    <tr key={q.id} className={selectedQuestionIds.has(q.id) ? 'bg-blue-50' : ''}>
                                        <td className="p-4"><input type="checkbox" checked={selectedQuestionIds.has(q.id)} onChange={() => handleSelectQuestion(q.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/></td>
                                        <td className="p-4 text-sm text-gray-500 font-mono">{q.id}</td>
                                        <td className="p-4 text-sm text-gray-800 max-w-md truncate" title={q.enunciado}>{q.enunciado}</td>
                                        <td className="p-4 text-sm font-bold text-green-600">{q.correta || '?'}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleEditQuestion(q)} className="p-2 text-gray-500 hover:text-blue-600"><EditIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     ) : (
                        <div className="text-center py-20 text-gray-500">
                            <p>Nenhuma questão extraída ainda.</p>
                            <p className="text-sm">Use o painel à esquerda para começar.</p>
                        </div>
                     )}
                 </div>
            </div>
        </div>
    </div>
  )
};

interface LinkQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkSuccess: () => void;
  selectedQuestionIds: Set<number>;
  selectedQuestions: Question[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  testes: Test[];
  flashcardDecks: FlashcardDeck[];
}

const LinkQuestionsModal: React.FC<LinkQuestionsModalProps> = ({
  isOpen, onClose, onLinkSuccess, selectedQuestionIds, selectedQuestions,
  disciplinas, assuntos, testes, flashcardDecks
}) => {
    const [activeTab, setActiveTab] = useState<'academico' | 'testes' | 'flashcards'>('academico');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Academico state
    const [disciplinaId, setDisciplinaId] = useState('');
    const [assuntoId, setAssuntoId] = useState('');

    // Testes state
    const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());

    // Flashcards state
    const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set());

    const filteredAssuntos = useMemo(() => {
        if (!disciplinaId) return [];
        return assuntos.filter(a => a.disciplina_id === disciplinaId);
    }, [disciplinaId, assuntos]);

    useEffect(() => {
        if (disciplinaId) setAssuntoId('');
    }, [disciplinaId]);
    
    useEffect(() => { // Reset state on open
        if(isOpen) {
            setActiveTab('academico');
            setIsLoading(false);
            setStatusMessage('');
            setDisciplinaId('');
            setAssuntoId('');
            setSelectedTestIds(new Set());
            setSelectedDeckIds(new Set());
        }
    }, [isOpen]);
    
    if (!isOpen) return null;
    
    const handleLinkAcademico = async () => {
        if (!disciplinaId || !assuntoId) {
            setStatusMessage('Por favor, selecione uma Disciplina e um Assunto.');
            return;
        }
        setIsLoading(true);
        setStatusMessage('Vinculando...');
        const { error } = await supabase
            .from('questoes')
            .update({ disciplina_id: disciplinaId, assunto_id: assuntoId })
            .in('id', Array.from(selectedQuestionIds));
        
        if (error) {
            setStatusMessage(`Erro: ${error.message}`);
        } else {
            setStatusMessage('Vínculo acadêmico atualizado com sucesso!');
            setTimeout(() => {
                onLinkSuccess();
                onClose();
            }, 1500);
        }
        setIsLoading(false);
    };
    
    const handleLinkTestes = async () => {
        if (selectedTestIds.size === 0) {
            setStatusMessage('Selecione ao menos um teste.');
            return;
        }
        setIsLoading(true);
        setStatusMessage('Adicionando questões aos testes...');

        // NOTE: This assumes a junction table named 'testes_questoes'
        const links = Array.from(selectedTestIds).flatMap(testId =>
            Array.from(selectedQuestionIds).map(questionId => ({
                teste_id: testId,
                questao_id: questionId,
            }))
        );

        const { error } = await supabase.from('testes_questoes').insert(links);

        if (error) {
            setStatusMessage(`Erro: ${error.message}`);
        } else {
            setStatusMessage('Questões adicionadas aos testes com sucesso!');
            setTimeout(() => {
                onLinkSuccess();
                onClose();
            }, 1500);
        }
        setIsLoading(false);
    };
    
    const handleLinkFlashcards = async () => {
        if (selectedDeckIds.size === 0) {
            setStatusMessage('Selecione ao menos um baralho de flashcards.');
            return;
        }
        setIsLoading(true);
        setStatusMessage('Gerando e salvando flashcards...');
        
        const newFlashcards = Array.from(selectedDeckIds).flatMap(deckId =>
            selectedQuestions.map(q => ({
                frente: q.enunciado,
                verso: `Gabarito: ${q.correta}\n\nResolução: ${q.resolucao || 'Não fornecida.'}`,
                deck_id: deckId,
            }))
        );
        
        const { error } = await supabase.from('flashcards').insert(newFlashcards);

        if (error) {
            setStatusMessage(`Erro: ${error.message}`);
        } else {
            setStatusMessage('Flashcards gerados com sucesso!');
            setTimeout(() => {
                onLinkSuccess();
                onClose();
            }, 1500);
        }
        setIsLoading(false);
    };

    const handleSubmit = () => {
        setStatusMessage('');
        switch(activeTab) {
            case 'academico': handleLinkAcademico(); break;
            case 'testes': handleLinkTestes(); break;
            case 'flashcards': handleLinkFlashcards(); break;
        }
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'academico':
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Vincular a Disciplina/Assunto</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                            <select value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} className="w-full p-2 border rounded-md">
                                <option value="">Selecione...</option>
                                {disciplinas.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                            <select value={assuntoId} onChange={e => setAssuntoId(e.target.value)} disabled={!disciplinaId} className="w-full p-2 border rounded-md disabled:bg-gray-100">
                                <option value="">Selecione...</option>
                                {filteredAssuntos.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'testes':
                return (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Adicionar aos Testes</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md border">
                            {testes.map(t => (
                                <label key={t.id} className="flex items-center p-2 rounded-md hover:bg-blue-100 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded" checked={selectedTestIds.has(t.id)} onChange={() => {
                                        setSelectedTestIds(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(t.id)) newSet.delete(t.id);
                                            else newSet.add(t.id);
                                            return newSet;
                                        });
                                    }}/>
                                    <span className="ml-3 text-gray-700">{t.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'flashcards':
                 return (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Gerar Flashcards para Baralhos</h3>
                        <p className="text-sm text-gray-500 mb-2">Novos flashcards serão criados com o enunciado na frente e o gabarito/resolução no verso.</p>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md border">
                            {flashcardDecks.map(d => (
                                <label key={d.id} className="flex items-center p-2 rounded-md hover:bg-blue-100 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded" checked={selectedDeckIds.has(d.id)} onChange={() => {
                                        setSelectedDeckIds(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(d.id)) newSet.delete(d.id);
                                            else newSet.add(d.id);
                                            return newSet;
                                        });
                                    }}/>
                                    <span className="ml-3 text-gray-700">{d.titulo}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
        }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
            <div className="flex justify-between items-center p-5 border-b">
                <h2 className="text-xl font-bold text-gray-800">Vincular {selectedQuestionIds.size} Questões</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XIcon className="w-6 h-6"/></button>
            </div>
            <div className="p-5">
                <div className="flex justify-center border-b mb-4">
                    <button onClick={() => setActiveTab('academico')} className={`py-2 px-4 font-semibold ${activeTab === 'academico' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Acadêmico</button>
                    <button onClick={() => setActiveTab('testes')} className={`py-2 px-4 font-semibold ${activeTab === 'testes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Testes</button>
                    <button onClick={() => setActiveTab('flashcards')} className={`py-2 px-4 font-semibold ${activeTab === 'flashcards' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Flashcards</button>
                </div>
                {renderContent()}
            </div>
             <div className="flex justify-between items-center p-5 border-t bg-gray-50 rounded-b-xl">
                 <div className="text-sm h-5">{statusMessage}</div>
                 <div className="flex gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {isLoading ? 'Salvando...' : 'Salvar Vínculos'}
                    </button>
                 </div>
            </div>
        </div>
    </div>
    )
};


// Main component for the Question Bank page
const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [testes, setTestes] = useState<Test[]>([]);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [loteFilters, setLoteFilters] = useState<string[]>([]);
  const [selectedLote, setSelectedLote] = useState<string>('');
  
  // Use the central academic data context
  const { disciplinas, assuntos, loading: academicDataLoading } = useAcademicData();


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const [qRes, tRes, fdRes] = await Promise.all([
            supabase.from('questoes').select('*').order('id', { ascending: false }),
            supabase.from('testes').select('*'),
            supabase.from('flashcard_decks').select('*, assunto:assuntos(descricao)'),
        ]);

        if (qRes.error) throw qRes.error;
        if (tRes.error) throw tRes.error;
        if (fdRes.error) throw fdRes.error;

        // One-time data migration for existing questions without a lot
        let questionsData = qRes.data as Question[];
        const questionIdsToUpdate = questionsData.filter(q => !q.lotes).map(q => q.id);
        
        if (questionIdsToUpdate.length > 0) {
            const { error: updateError } = await supabase
                .from('questoes')
                .update({ lotes: 'Choque' })
                .in('id', questionIdsToUpdate);
            
            if (!updateError) {
                // Update data in memory to avoid a full refetch and show changes instantly
                questionsData = questionsData.map(q => 
                    questionIdsToUpdate.includes(q.id) ? { ...q, lotes: 'Choque' } : q
                );
            } else {
                console.error("Failed to migrate questions to 'Choque' lot:", updateError);
            }
        }
        setQuestions(questionsData);
        
        const uniqueLotes = [...new Set(questionsData.map(q => q.lotes).filter(Boolean))] as string[];
        setLoteFilters(uniqueLotes.sort());
        
        setTestes(tRes.data.map(t => ({...t, scheduledDate: t.scheduled_date})) as Test[]);
        setFlashcardDecks(fdRes.data.map((d: any) => ({...d, titulo: `Revisão de ${d.assunto?.descricao || 'Tópico'}`})) as FlashcardDeck[]);

    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsEditorModalOpen(true);
  };
  
  const handleSave = async (updatedQuestion: Question) => {
    const { created_at, ...updatePayload } = updatedQuestion;
    const { error } = await supabase
        .from('questoes')
        .update(updatePayload)
        .eq('id', updatedQuestion.id);

    if (error) {
        alert('Erro ao salvar: ' + error.message);
    } else {
        fetchData(); // Re-fetch to get the latest state
        setIsEditorModalOpen(false);
        setEditingQuestion(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja deletar esta questão?")) {
        const { error } = await supabase.from('questoes').delete().eq('id', id);
        if (error) alert('Erro ao deletar: ' + error.message);
        else {
            fetchData();
            setSelectedQuestionIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            })
        }
    }
  };
  
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
        const fromSelectedLote = !selectedLote || q.lotes === selectedLote;
        const matchesSearch = q.enunciado.toLowerCase().includes(searchTerm.toLowerCase());
        return fromSelectedLote && matchesSearch;
    });
  }, [questions, searchTerm, selectedLote]);
  
  const selectedQuestions = useMemo(() => {
    return questions.filter(q => selectedQuestionIds.has(q.id));
  }, [questions, selectedQuestionIds]);

  const handleSelectQuestion = (id: number) => {
    setSelectedQuestionIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
    } else {
        setSelectedQuestionIds(new Set());
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <QuestionEditorModal isOpen={isEditorModalOpen} onClose={() => setIsEditorModalOpen(false)} onSave={handleSave} question={editingQuestion} disciplinas={disciplinas} assuntos={assuntos} />
        <LinkQuestionsModal 
            isOpen={isLinkModalOpen}
            onClose={() => setIsLinkModalOpen(false)}
            onLinkSuccess={fetchData}
            selectedQuestionIds={selectedQuestionIds}
            selectedQuestions={selectedQuestions}
            disciplinas={disciplinas}
            assuntos={assuntos}
            testes={testes}
            flashcardDecks={flashcardDecks}
        />
        <header>
            <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
            <p className="text-gray-600 mt-1">Visualize e gerencie todas as questões cadastradas.</p>
        </header>

         <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
                <div className="relative w-full md:max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input
                        type="text"
                        placeholder="Buscar por enunciado..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pl-10"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {loteFilters.length > 0 && (
                        <select
                            value={selectedLote}
                            onChange={e => setSelectedLote(e.target.value)}
                            className="w-full sm:w-64 bg-white border border-gray-300 rounded-lg p-2.5 text-sm"
                        >
                            <option value="">Filtrar por todos os lotes</option>
                            {loteFilters.map(lote => (
                                <option key={lote} value={lote}>
                                    {lote}
                                </option>
                            ))}
                        </select>
                    )}
                    <button onClick={() => setIsLinkModalOpen(true)} disabled={selectedQuestionIds.size === 0} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50">
                        <span>Vincular Questões ({selectedQuestionIds.size})</span>
                    </button>
                </div>
            </div>
            
            <div className="mb-6">
                 <DashboardMetrics 
                    totalQuestions={filteredQuestions.length} 
                    selectedCount={selectedQuestionIds.size} 
                    questions={selectedQuestions}
                    theme="light" 
                />
            </div>
            
            {(loading || academicDataLoading) && <p>Carregando questões...</p>}
            {error && <p className="text-red-500">Erro: {error}</p>}
            {!(loading || academicDataLoading) && !error && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 w-12"><input type="checkbox" className="h-4 w-4 rounded" onChange={handleSelectAll} checked={filteredQuestions.length > 0 && selectedQuestionIds.size === filteredQuestions.length} /></th>
                                <th className="p-4 font-semibold text-sm text-gray-600">ID</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Enunciado</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Lote</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Disciplina/Assunto</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Gabarito</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredQuestions.map(q => (
                                <tr key={q.id} className={`${selectedQuestionIds.has(q.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded" checked={selectedQuestionIds.has(q.id)} onChange={() => handleSelectQuestion(q.id)}/></td>
                                    <td className="p-4 text-sm font-mono">{q.id}</td>
                                    <td className="p-4 text-sm max-w-md truncate">{q.enunciado}</td>
                                    <td className="p-4 text-sm text-gray-500">{q.lotes || '/'}</td>
                                    <td className="p-4 text-sm">
                                        <div className="font-semibold">{disciplinas.find(d => d.id === q.disciplina_id)?.descricao || '/'}</div>
                                        <div className="text-gray-500">{assuntos.find(a => a.id === q.assunto_id)?.descricao || '/'}</div>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-green-600">{q.correta}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center">
                                         <button onClick={() => handleEdit(q)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md"><EditIcon className="w-5 h-5"/></button>
                                         <button onClick={() => handleDelete(q.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
         </div>
    </div>
  );
};


export default QuestionBank;