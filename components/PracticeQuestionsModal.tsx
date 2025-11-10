import React, { useState, useEffect, useCallback } from 'react';
import { Assunto, Question, PracticeProgress } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateHintForQuestion } from '../services/geminiService';
import { XIcon, RefreshCwIcon, SparklesIcon } from './icons';

interface PracticeQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assuntoId: string | null;
}

const Spinner: React.FC<{ size?: 'sm' | 'md'}> = ({ size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'h-5 w-5 border-white' : 'h-8 w-8 border-blue-500';
    return <div className={`animate-spin rounded-full border-b-2 ${sizeClass}`}></div>;
}


export const PracticeQuestionsModal: React.FC<PracticeQuestionsModalProps> = ({ isOpen, onClose, assuntoId }) => {
    const [assunto, setAssunto] = useState<(Assunto & { questoes: Question[] }) | null>(null);
    const [unansweredQuestions, setUnansweredQuestions] = useState<Question[]>([]);
    const [progress, setProgress] = useState<PracticeProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [xpGained, setXpGained] = useState(0);

    const [hints, setHints] = useState<string[]>([]);
    const [isGeneratingHint, setIsGeneratingHint] = useState(false);

    useEffect(() => {
        const initializePractice = async () => {
            if (!assuntoId) return;
            setLoading(true);
            // Reset all states for a clean session
            setAssunto(null);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setXpGained(0);
            setIsCompleted(false);
            setHints([]);
            setIsGeneratingHint(false);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado.");

                const { data: assuntoData, error: assuntoError } = await supabase
                    .from('assuntos')
                    .select('*, questoes(*)')
                    .eq('id', assuntoId)
                    .single();

                if (assuntoError) throw assuntoError;
                setAssunto(assuntoData);
                
                const { data: progressData, error: progressError } = await supabase
                    .from('pratica_assunto_progresso')
                    .select('*')
                    .eq('aluno_id', user.id)
                    .eq('assunto_id', assuntoId)
                    .maybeSingle(); // Use maybeSingle to not throw error if no row is found

                const initialProgress = progressData || null;
                setProgress(initialProgress);
                
                const fetchedQuestions = assuntoData.questoes || [];
                const answeredIds = initialProgress?.questoes_respondidas || [];
                let remaining = fetchedQuestions.filter(q => !answeredIds.includes(q.id));
                
                if (remaining.length > 0) {
                    // Shuffle remaining questions for variety
                    for (let i = remaining.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
                    }
                }
                setUnansweredQuestions(remaining);
                
                if (remaining.length === 0 && fetchedQuestions.length > 0) {
                    setIsCompleted(true);
                }
            } catch (error) {
                console.error("Error initializing practice:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            initializePractice();
        }
    }, [isOpen, assuntoId]);

    const updateXp = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase.rpc('increment_xp', { user_id: user.id, xp_amount: 10 });
            if (error) throw error;
            setXpGained(prev => prev + 10);
        } catch (error) {
            console.error("Failed to update XP:", error);
        }
    };
    
    const handleAnswerSelect = async (letra: string) => {
        if (isAnswered || !assunto) return;
        const currentQuestion = unansweredQuestions[currentQuestionIndex];
        const isCorrect = letra === currentQuestion.correta;

        setSelectedAnswer(letra);
        setIsAnswered(true);

        if (isCorrect) {
            updateXp();
        }
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const usedHint = hints.length > 0;
            const updatedProgress: PracticeProgress = {
                aluno_id: user.id,
                assunto_id: assunto.id,
                questoes_respondidas: [...(progress?.questoes_respondidas || []), currentQuestion.id],
                questoes_corretas: isCorrect ? [...(progress?.questoes_corretas || []), currentQuestion.id] : (progress?.questoes_corretas || []),
                questoes_com_dica: usedHint ? [...new Set([...(progress?.questoes_com_dica || []), currentQuestion.id])] : (progress?.questoes_com_dica || []),
            };
            
            const { error } = await supabase.from('pratica_assunto_progresso').upsert(updatedProgress);
            if (error) throw error;
            
            setProgress(updatedProgress);

        } catch(e) {
            console.error("Failed to save progress:", e);
        }
    };
    
    const handleRequestHint = async () => {
        if (isGeneratingHint || hints.length >= 3) return;
        const currentQuestion = unansweredQuestions[currentQuestionIndex];
        setIsGeneratingHint(true);
        try {
            const hint = await generateHintForQuestion(currentQuestion);
            setHints(prev => [...prev, hint]);
        } catch (error) {
            console.error("Error getting hint:", error);
            setHints(prev => [...prev, "Desculpe, não foi possível gerar uma dica agora."]);
        } finally {
            setIsGeneratingHint(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < unansweredQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setHints([]); // Reset hints for the next question
        } else {
            setIsCompleted(true);
        }
    };
    
    const handleRestart = async () => {
        if (!assuntoId || !window.confirm("Tem certeza que deseja reiniciar sua prática? Todo o seu progresso neste assunto será perdido.")) {
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('pratica_assunto_progresso').delete()
                .eq('aluno_id', user.id)
                .eq('assunto_id', assuntoId);
            if(error) throw error;
            
            onClose(); 
        } catch(e) {
            console.error("Failed to restart practice:", e);
            alert('Não foi possível reiniciar a prática. Tente novamente.');
        }
    };

    const currentQuestion = unansweredQuestions[currentQuestionIndex];

    const getAlternativeStyle = (letra: string) => {
        if (!isAnswered) return 'border-gray-300 hover:border-blue-400 hover:bg-blue-50';
        const isCorrect = letra === currentQuestion.correta;
        const isSelected = letra === selectedAnswer;
        if (isCorrect) return 'border-green-500 bg-green-100 text-green-800';
        if (isSelected && !isCorrect) return 'border-red-500 bg-red-100 text-red-800';
        return 'border-gray-300 bg-gray-50 text-gray-500';
    };
    
    const initialAnsweredCount = progress?.questoes_respondidas?.length || 0;
    const currentQuestionNumber = initialAnsweredCount + currentQuestionIndex + 1;
    const totalQuestions = assunto?.questoes.length || 0;


    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-full"><Spinner /></div>;
        }

        if (isCompleted) {
            const correctCount = progress?.questoes_corretas.length || 0;
            const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
            return (
                <div className="text-center flex flex-col justify-center items-center h-full">
                    <h3 className="text-2xl font-bold text-gray-800">Parabéns!</h3>
                    <p className="text-gray-600 mt-2">Você concluiu todas as questões deste assunto.</p>
                    <div className="my-6 text-4xl font-bold text-blue-600">
                        {accuracy}% de acerto
                    </div>
                    <p className="text-gray-500">({correctCount} de {totalQuestions} questões corretas)</p>
                </div>
            );
        }

        if (currentQuestion) {
             return (
                <div className="space-y-6">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentQuestion.enunciado}</p>
                    <div className="space-y-3">
                        {currentQuestion.alternativas.map((alt) => (
                            <button
                                key={alt.letra}
                                onClick={() => handleAnswerSelect(alt.letra)}
                                disabled={isAnswered}
                                className={`w-full text-left p-4 border rounded-lg transition-all flex items-start space-x-4 ${getAlternativeStyle(alt.letra)}`}
                            >
                                <span className="font-bold">{alt.letra})</span>
                                <span className="flex-1">{alt.texto}</span>
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                        {hints.map((hint, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg animate-fade-in-fast">
                                <p><span className="font-bold">Dica {index + 1}:</span> {hint}</p>
                            </div>
                        ))}
                        <button 
                            onClick={handleRequestHint} 
                            disabled={isAnswered || isGeneratingHint || hints.length >= 3}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isGeneratingHint ? <Spinner size="sm" /> : <SparklesIcon className="w-5 h-5 text-yellow-500" />}
                            {isGeneratingHint ? 'Gerando...' : `Pedir Dica (${hints.length}/3)`}
                        </button>
                    </div>
                </div>
            );
        }
        
        return <p className="text-center py-10 text-gray-600">Nenhuma questão disponível para praticar.</p>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200">
                <header className="flex justify-between items-start p-5 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Praticando: <span className="text-blue-600">{assunto?.descricao}</span></h2>
                        {!isCompleted && totalQuestions > 0 && <p className="text-sm text-gray-500">Questão {currentQuestionNumber} de {totalQuestions}</p>}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={handleRestart} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100" title="Reiniciar Prática">
                           <RefreshCwIcon className="w-4 h-4"/>
                           <span>Reiniciar</span>
                        </button>
                        <button onClick={onClose} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100" title="Pausar e Salvar Progresso">
                           <XIcon className="w-4 h-4" />
                           <span>Paralisar Prática</span>
                        </button>
                    </div>
                </header>
                
                <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
                   {renderContent()}
                </main>
                
                <footer className="flex justify-between items-center p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl min-h-[76px]">
                    <div className="text-lg font-bold text-yellow-500">
                       {xpGained > 0 && `+${xpGained} XP!`}
                    </div>
                    {isAnswered && !isCompleted && (
                         <button onClick={handleNextQuestion} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            {currentQuestionIndex < unansweredQuestions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                        </button>
                    )}
                    {(isCompleted || unansweredQuestions.length === 0 && !loading) && (
                        <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            Fechar
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
