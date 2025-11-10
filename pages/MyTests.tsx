import React, { useState, useEffect } from 'react';
import { Test, TestAttempt } from '../types';
import { supabase } from '../services/supabaseClient';
import { analyzeTestPerformance } from '../services/geminiService';
import { XIcon } from '../components/icons';

const MyTests: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');
    const [tests, setTests] = useState<Test[]>([]);
    const [attempts, setAttempts] = useState<TestAttempt[]>([]);
    const [loading, setLoading] = useState(true);

    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentTest, setCurrentTest] = useState<Test | null>(null);
    const [currentAttempt, setCurrentAttempt] = useState<TestAttempt | null>(null);
    const [reportContent, setReportContent] = useState('');
    const [isReportLoading, setIsReportLoading] = useState(false);


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: testsData, error: testsError } = await supabase.from('testes').select('*');
            if (testsError) throw testsError;

            const { data: attemptsData, error: attemptsError } = await supabase
                .from('test_attempts')
                .select('*, teste:testes(title)');
            if (attemptsError) throw attemptsError;
            
            const completedTestIds = new Set((attemptsData || []).map(a => a.teste_id));
            const todoTests = (testsData || []).filter(t => !completedTestIds.has(t.id));

            setTests(todoTests.map(t => ({...t, scheduledDate: t.scheduled_date})) as Test[]);
            setAttempts(attemptsData as TestAttempt[]);

        } catch (e: any) {
            console.error(e.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleTakeTest = (test: Test) => {
        setCurrentTest(test);
        setIsTestModalOpen(true);
    };

    const handleFinishTest = async () => {
        if (!currentTest) return;

        const score = Math.floor(Math.random() * 61) + 40; // Random score between 40 and 100
        const { data, error } = await supabase
            .from('test_attempts')
            .insert({
                // NOTE: Using a placeholder user ID. In a real app, this would come from the authenticated user session.
                aluno_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
                teste_id: currentTest.id,
                score,
                answers: [], // Placeholder for actual answers
            })
            .select('*, teste:testes(title)')
            .single();
        
        if (error) {
            alert('Erro ao salvar resultado: ' + error.message);
        } else if (data) {
            setAttempts(prev => [data as TestAttempt, ...prev]);
            setTests(prev => prev.filter(t => t.id !== currentTest.id));
        }

        setIsTestModalOpen(false);
        setCurrentTest(null);
    };
    
    const handleAnalyzePerformance = async (attempt: TestAttempt) => {
        setCurrentAttempt(attempt);
        setIsReportModalOpen(true);
        setIsReportLoading(true);
        try {
            const analysis = await analyzeTestPerformance(attempt.score);
            setReportContent(analysis);
        } catch (e) {
            setReportContent("Não foi possível gerar a análise. Tente novamente.");
        } finally {
            setIsReportLoading(false);
        }
    };


    const renderTestList = (list: Test[] | TestAttempt[]) => {
        if (loading) return <p className="py-10 text-center text-gray-500">Carregando...</p>;
        if (list.length === 0) return <p className="py-10 text-center text-gray-500">Nenhum item aqui.</p>;

        return (
            <div className="space-y-4">
                {list.map((item) => {
                     const isAttempt = 'score' in item;
                     const testTitle = isAttempt ? ((item as TestAttempt).teste as any)?.title : (item as Test).title;
                     const date = isAttempt ? (item as TestAttempt).completed_at : (item as Test).scheduledDate;
                    
                     return (
                        <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-800">{testTitle}</h3>
                                <p className="text-sm text-gray-500">
                                    {isAttempt ? `Concluído em: ${new Date(date).toLocaleDateString('pt-BR')}` : `Agendado para: ${new Date(date).toLocaleDateString('pt-BR')}`}
                                </p>
                            </div>
                             <div className="flex items-center gap-2">
                                {isAttempt && <span className="font-bold text-xl text-blue-600">{item.score}%</span>}
                                {isAttempt ? (
                                     <button onClick={() => handleAnalyzePerformance(item as TestAttempt)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">Analisar Desempenho</button>
                                ) : (
                                     <button onClick={() => handleTakeTest(item as Test)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg">Realizar Teste</button>
                                )}
                            </div>
                        </div>
                     )
                })}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Meus Testes</h1>
                <p className="text-gray-600 mt-1">Realize seus testes agendados e veja seus resultados.</p>
            </header>

            <div>
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-4">
                        <button onClick={() => setActiveTab('todo')} className={`py-2 px-4 font-semibold ${activeTab === 'todo' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>A Fazer ({tests.length})</button>
                        <button onClick={() => setActiveTab('completed')} className={`py-2 px-4 font-semibold ${activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Concluídos ({attempts.length})</button>
                    </nav>
                </div>
                <div className="mt-4">
                    {activeTab === 'todo' ? renderTestList(tests) : renderTestList(attempts)}
                </div>
            </div>
            
            {/* Test Taker Modal */}
            {isTestModalOpen && currentTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold">Simulação de Teste</h2>
                        <p className="my-4">Realizando o teste: <span className="font-semibold">{currentTest.title}</span></p>
                        <p className="text-sm text-gray-600">Esta é uma simulação. As questões reais apareceriam aqui. Clique em finalizar para registrar uma nota aleatória.</p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setIsTestModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                            <button onClick={handleFinishTest} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Finalizar Teste</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Report Modal */}
            {isReportModalOpen && currentAttempt && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Análise de Desempenho</h2>
                            <button onClick={() => setIsReportModalOpen(false)}><XIcon className="w-6 h-6"/></button>
                         </div>
                         <div className="overflow-y-auto prose">
                            {isReportLoading ? <p>Analisando...</p> : <div dangerouslySetInnerHTML={{__html: reportContent.replace(/\n/g, '<br/>') }} />}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTests;