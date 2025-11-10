import React, { useMemo } from 'react';
import { FileTextIcon, CheckCircleIcon, BarChartIcon } from './icons';
import { Question } from '../types';

interface DashboardMetricsProps {
  totalQuestions: number;
  selectedCount: number;
  questions: Question[];
  theme?: 'light' | 'dark';
}

interface MetricCardProps {
    icon: React.ReactNode; 
    label: string; 
    value: number | string; 
    colorClass: string;
    theme: 'light' | 'dark';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, colorClass, theme }) => {
    const isDark = theme === 'dark';
    return (
        <div className={`${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-xl p-4 flex items-center space-x-4 flex-1 min-w-[200px]`}>
            <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
            </div>
            <div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{label}</p>
            <p className={`${isDark ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>{value}</p>
            </div>
        </div>
    );
};


export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ totalQuestions, selectedCount, questions, theme = 'dark' }) => {
    const isDark = theme === 'dark';
    const answerDistribution = useMemo(() => {
        const counts: { [key: string]: number } = {};
        questions.forEach(q => {
            if (q.correta) {
                const correctLetter = q.correta.toUpperCase();
                counts[correctLetter] = (counts[correctLetter] || 0) + 1;
            }
        });
        const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
        const maxCount = Math.max(...Object.values(counts), 0);
        return { sorted, maxCount };
    }, [questions]);

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap gap-4 md:gap-6">
            <MetricCard
                theme={theme}
                icon={<FileTextIcon className="w-6 h-6 text-white" />}
                label={theme === 'dark' ? "Total de Questões" : "Questões na Tabela"}
                value={totalQuestions}
                colorClass="bg-sky-600"
            />
            <MetricCard
                theme={theme}
                icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
                label="Selecionadas"
                value={selectedCount}
                colorClass="bg-green-600"
            />
        </div>
        
        {questions.length > 0 && (
            <div className={`${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-xl p-4`}>
                 <div className="flex items-center mb-4">
                    <BarChartIcon className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-blue-500'} mr-3`}/>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Distribuição do Gabarito</h3>
                </div>
                {answerDistribution.sorted.length > 0 ? (
                    <div className="flex items-end space-x-4 h-32">
                        {answerDistribution.sorted.map(([letter, count]) => (
                            <div key={letter} className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>{count}</div>
                                <div 
                                    className="w-full bg-sky-600 rounded-t-md hover:bg-sky-500 transition-all"
                                    style={{ height: `${answerDistribution.maxCount > 0 ? (count / answerDistribution.maxCount) * 100 : 0}%` }}
                                    title={`${count} questões`}
                                ></div>
                                <div className={`w-full text-center text-xs ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-200'} mt-1 font-medium rounded-b-md py-0.5`}>{letter}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'} py-8`}>Nenhum gabarito encontrado para exibir.</p>
                )}
            </div>
        )}
    </div>
  );
};