

import React, { useMemo } from 'react';
import { FileTextIcon, CheckCircleIcon, BarChartIcon } from './icons';
// Fix: Changed QuestionRaw to Question as it is the correct type.
import { Question } from '../types';

interface DashboardMetricsProps {
  totalQuestions: number;
  selectedCount: number;
  questions: Question[];
}

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; colorClass: string }> = ({ icon, label, value, colorClass }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center space-x-4 flex-1 min-w-[200px]">
    <div className={`p-3 rounded-full ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ totalQuestions, selectedCount, questions }) => {
    const answerDistribution = useMemo(() => {
        const counts: { [key: string]: number } = {};
        questions.forEach(q => {
            const correctLetter = q.correta.toUpperCase();
            counts[correctLetter] = (counts[correctLetter] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
        const maxCount = Math.max(...Object.values(counts), 0);
        return { sorted, maxCount };
    }, [questions]);

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap gap-4 md:gap-6">
            <MetricCard
                icon={<FileTextIcon className="w-6 h-6 text-white" />}
                label="Total de Questões"
                value={totalQuestions}
                colorClass="bg-sky-600"
            />
            <MetricCard
                icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
                label="Selecionadas"
                value={selectedCount}
                colorClass="bg-green-600"
            />
        </div>
        
        {questions.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                 <div className="flex items-center mb-4">
                    <BarChartIcon className="w-6 h-6 text-amber-400 mr-3"/>
                    <h3 className="text-lg font-semibold text-white">Distribuição do Gabarito</h3>
                </div>
                {answerDistribution.sorted.length > 0 ? (
                    <div className="flex items-end space-x-4 h-32">
                        {answerDistribution.sorted.map(([letter, count]) => (
                            <div key={letter} className="flex-1 flex flex-col items-center justify-end h-full">
                                <div className="text-sm font-bold text-white mb-1">{count}</div>
                                <div 
                                    className="w-full bg-sky-600 rounded-t-md hover:bg-sky-500 transition-all"
                                    style={{ height: `${answerDistribution.maxCount > 0 ? (count / answerDistribution.maxCount) * 100 : 0}%` }}
                                    title={`${count} questões`}
                                ></div>
                                <div className="w-full text-center text-xs text-gray-400 mt-1 font-medium bg-gray-700 rounded-b-md py-0.5">{letter}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Nenhum gabarito encontrado para exibir.</p>
                )}
            </div>
        )}
    </div>
  );
};