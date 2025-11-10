import React from 'react';
import { mockLoginUsers } from '../data/mock';
import { CheckCircleIcon, BarChartIcon, BookOpenIcon } from '../components/icons';

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; colorClass: string, iconBgClass: string }> = ({ icon, label, value, colorClass, iconBgClass }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center space-x-4 flex-1 min-w-[220px]">
    <div className={`p-3 rounded-lg ${iconBgClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  </div>
);

const StudentDashboard: React.FC = () => {
    // For prototype, we'll just use the first student's data from login simulation
    const student = mockLoginUsers.find(u => u.role === 'student');
    // Using a default progress object since real data is not available here
    const progress = { studentId: student?.id, completedTests: 0, averageScore: 0, studyTime: 0, lastActivity: 'N/A' };
    
    if (!student) {
        return <div>Carregando dados do aluno...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">Olá, {student.name.split(' ')[0]}!</h1>
            <p className="text-gray-600 mt-1">Aqui está um resumo do seu progresso. Continue assim!</p>
          </header>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
                icon={<BarChartIcon className="w-6 h-6 text-purple-600" />}
                label="Sua Média"
                value={`${progress.averageScore}%`}
                colorClass="text-gray-900"
                iconBgClass="bg-purple-100"
            />
             <MetricCard
                icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
                label="Testes Concluídos"
                value={progress.completedTests}
                colorClass="text-gray-900"
                iconBgClass="bg-green-100"
            />
            <MetricCard
                icon={<BookOpenIcon className="w-6 h-6 text-blue-600" />}
                label="Horas de Estudo"
                value={`${progress.studyTime}h`}
                colorClass="text-gray-900"
                iconBgClass="bg-blue-100"
            />
          </div>
    
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Próximos Testes</h3>
            </div>
            <div className="p-5 space-y-4">
                <div className="text-center py-10 text-gray-500">
                    Nenhum teste agendado no momento.
                </div>
            </div>
          </div>
        </div>
      );
};

export default StudentDashboard;