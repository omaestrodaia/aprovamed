import React, { useState, useEffect } from 'react';
import { UsersIcon, CheckCircleIcon, BarChartIcon, BookOpenIcon, EditIcon, TrendingUpIcon, FileQuestionIcon } from '../components/icons';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
    setCurrentPage: (page: string) => void;
}

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; iconBgColor: string }> = ({ icon, label, value, iconBgColor }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center space-x-4 flex-1 min-w-[220px]">
    <div className={`p-3 rounded-lg ${iconBgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-gray-900 text-3xl font-bold">{value}</p>
    </div>
  </div>
);

const ActionCard: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-300 transition-all transform hover:-translate-y-1">
         {icon}
        <p className="text-gray-700 font-semibold mt-2">{label}</p>
    </button>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentPage }) => {
    const [stats, setStats] = useState({ studentCount: 0, questionCount: 0, testCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { count: studentCount, error: studentError } = await supabase.from('alunos').select('*', { count: 'exact', head: true });
                if (studentError) throw studentError;

                const { count: questionCount, error: questionError } = await supabase.from('questoes').select('*', { count: 'exact', head: true });
                if (questionError) throw questionError;

                const { count: testCount, error: testError } = await supabase.from('testes').select('*', { count: 'exact', head: true });
                if (testError) throw testError;

                setStats({ 
                    studentCount: studentCount ?? 0, 
                    questionCount: questionCount ?? 0, 
                    testCount: testCount ?? 0 
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-1">Visão geral da plataforma e dos alunos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
            icon={<UsersIcon className="w-6 h-6 text-blue-600" />}
            label="Total de Alunos"
            value={loading ? '...' : stats.studentCount}
            iconBgColor="bg-blue-100"
        />
        <MetricCard
            icon={<BookOpenIcon className="w-6 h-6 text-green-600" />}
            label="Questões Cadastradas"
            value={loading ? '...' : stats.questionCount}
            iconBgColor="bg-green-100"
        />
        <MetricCard
            icon={<CheckCircleIcon className="w-6 h-6 text-blue-600" />}
            label="Testes Agendados"
            value={loading ? '...' : stats.testCount}
            iconBgColor="bg-blue-100"
        />
        <MetricCard
            icon={<TrendingUpIcon className="w-6 h-6 text-orange-600" />}
            label="Tentativas de Testes"
            value={0} // Placeholder, as this requires a 'tentativas' table
            iconBgColor="bg-orange-100"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ActionCard icon={<FileQuestionIcon className="w-8 h-8 text-gray-500"/>} label="Upload Questões" onClick={() => setCurrentPage('upload-questions')} />
            <ActionCard icon={<EditIcon className="w-8 h-8 text-blue-500"/>} label="Criar Teste" onClick={() => setCurrentPage('tests')} />
            <ActionCard icon={<UsersIcon className="w-8 h-8 text-green-500"/>} label="Gerenciar Turmas" onClick={() => alert('Funcionalidade de Turmas em breve!')} />
            <ActionCard icon={<BarChartIcon className="w-8 h-8 text-orange-500"/>} label="Ver CRM" onClick={() => setCurrentPage('students')} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-800">Testes Próximos</h3>
            <div className="text-center py-16 text-gray-500">
                <p>Nenhum teste agendado</p>
            </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-800">Tentativas Recentes</h3>
            <div className="text-center py-16 text-gray-500">
                <p>Nenhuma tentativa ainda</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;