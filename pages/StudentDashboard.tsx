import React, { useState, useEffect } from 'react';
import { GamificationStats, TestAttempt, PracticeProgress, Disciplina } from '../types';
import { supabase } from '../services/supabaseClient';
import { BarChartIcon, CheckCircleIcon, SparklesIcon, TrendingUpIcon, TargetIcon, HistoryIcon } from '../components/icons';

// Types specific to this dashboard
interface PerformanceData {
  disciplina: string;
  acertos: number;
  total: number;
  percentual: number;
}

interface Activity {
  id: string;
  description: string;
  date: string;
  type: 'test' | 'practice';
}


const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center space-x-4 flex-1 min-w-[220px]">
        <div className={`p-3 rounded-lg ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-gray-900 text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const StudentDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Aluno');
    
    // Metrics State
    const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null);
    const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
    const [practiceProgress, setPracticeProgress] = useState<PracticeProgress[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);

    // Derived State
    const [performanceByDiscipline, setPerformanceByDiscipline] = useState<PerformanceData[]>([]);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado.");

                // Fetch all raw data in parallel
                const [
                    { data: userData },
                    { data: statsData, error: statsError },
                    { data: attemptsData, error: attemptsError },
                    { data: progressData, error: progressError },
                    { data: discData, error: discError },
                ] = await Promise.all([
                    supabase.from('alunos').select('name').eq('id', user.id).single(),
                    supabase.from('gamification_stats').select('*').eq('aluno_id', user.id).maybeSingle(),
                    supabase.from('test_attempts').select('*, teste:testes(title)').eq('aluno_id', user.id),
                    supabase.from('pratica_assunto_progresso').select('*, assunto:assuntos(disciplina_id, descricao)').eq('aluno_id', user.id),
                    supabase.from('disciplinas').select('*'),
                ]);

                if (statsError) throw statsError;
                if (attemptsError) throw attemptsError;
                if (progressError) throw progressError;
                if (discError) throw discError;
                
                setUserName(userData?.name || 'Aluno');
                setGamificationStats(statsData);
                setTestAttempts(attemptsData as TestAttempt[] || []);
                setPracticeProgress(progressData || []);
                setDisciplinas(discData || []);

            } catch (error) {
                console.error("Error fetching student dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        // This effect processes the raw data into displayable metrics whenever the raw data changes.
        if (loading) return;

        // Process Performance by Discipline
        const performanceMap = new Map<string, { acertos: number; total: number }>();
        practiceProgress.forEach(progress => {
            const disciplinaId = (progress as any).assunto?.disciplina_id;
            if (disciplinaId) {
                const stats = performanceMap.get(disciplinaId) || { acertos: 0, total: 0 };
                stats.acertos += progress.questoes_corretas.length;
                stats.total += progress.questoes_respondidas.length;
                performanceMap.set(disciplinaId, stats);
            }
        });

        const performanceData = Array.from(performanceMap.entries()).map(([disciplinaId, stats]) => {
            const disciplina = disciplinas.find(d => d.id === disciplinaId);
            return {
                disciplina: disciplina?.descricao || 'Desconhecida',
                acertos: stats.acertos,
                total: stats.total,
                percentual: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0,
            };
        }).sort((a, b) => b.percentual - a.percentual);
        setPerformanceByDiscipline(performanceData);

        // Process Recent Activities
        const practiceActivities: Activity[] = practiceProgress.map(p => ({
            id: `p-${p.assunto_id}`,
            description: `Você praticou questões de "${(p as any).assunto?.descricao || 'um assunto'}".`,
            date: new Date().toISOString(), // Placeholder, as progress table doesn't have a timestamp
            type: 'practice',
        }));
        
        const testActivities: Activity[] = testAttempts.map(t => ({
            id: `t-${t.id}`,
            description: `Você concluiu o teste "${(t.teste as any)?.title}" com ${t.score}%.`,
            date: t.completed_at,
            type: 'test',
        }));

        const allActivities = [...practiceActivities, ...testActivities]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
        setRecentActivities(allActivities);

    }, [loading, practiceProgress, testAttempts, disciplinas]);


    const mediaGeral = testAttempts.length > 0
        ? Math.round(testAttempts.reduce((acc, a) => acc + a.score, 0) / testAttempts.length)
        : 0;
    
    const maxPerformance = Math.max(...performanceByDiscipline.map(p => p.percentual), 100);

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Olá, {userName}!</h1>
                <p className="text-gray-600 mt-1">Aqui está um resumo do seu progresso. Continue assim!</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={<BarChartIcon className="w-6 h-6 text-orange-600" />} label="Sua Média" value={`${mediaGeral}%`} color="bg-orange-100" />
                <MetricCard icon={<CheckCircleIcon className="w-6 h-6 text-blue-600" />} label="Testes Concluídos" value={testAttempts.length} color="bg-blue-100" />
                <MetricCard icon={<SparklesIcon className="w-6 h-6 text-yellow-600" />} label="XP Acumulado" value={loading ? '...' : gamificationStats?.xp ?? 0} color="bg-yellow-100" />
                <MetricCard icon={<TrendingUpIcon className="w-6 h-6 text-green-600" />} label="Sequência" value={loading ? '...' : `${gamificationStats?.study_streak ?? 0} dias`} color="bg-green-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Main content: Performance */}
                <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><TargetIcon className="w-5 h-5 text-gray-500" /> Desempenho por Disciplina</h3>
                    {loading ? <div className="text-center py-16 text-gray-500">Analisando seu progresso...</div> : performanceByDiscipline.length > 0 ? (
                        <div className="space-y-4">
                            {performanceByDiscipline.map(perf => (
                                <div key={perf.disciplina}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-gray-700">{perf.disciplina}</p>
                                        <p className="text-sm font-bold text-blue-600">{perf.percentual}%</p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(perf.percentual / maxPerformance) * 100}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{perf.acertos} de {perf.total} questões corretas</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p>Nenhum dado de prática encontrado.</p>
                            <p className="text-sm">Comece a praticar na Área de Estudo para ver seu desempenho.</p>
                        </div>
                    )}
                </div>

                {/* Side content: Recent Activities */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><HistoryIcon className="w-5 h-5 text-gray-500" /> Atividades Recentes</h3>
                    {loading ? <div className="text-center py-16 text-gray-500">Carregando atividades...</div> : recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivities.map(activity => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'test' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {activity.type === 'test' ? <CheckCircleIcon className="w-5 h-5 text-blue-600"/> : <SparklesIcon className="w-5 h-5 text-green-600"/>}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p>Nenhuma atividade recente.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;