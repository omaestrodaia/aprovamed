import React from 'react';
import { Test } from '../types';
import { EditIcon, TrashIcon, PlusCircleIcon, ClipboardListIcon } from '../components/icons';

interface TestSchedulingProps {
    tests: Test[];
    setTests: React.Dispatch<React.SetStateAction<Test[]>>;
}

const TestScheduling: React.FC<TestSchedulingProps> = ({ tests, setTests }) => {

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        // Adjust for timezone offset
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    }

    const handleDeleteTest = (testId: string) => {
        if (window.confirm('Tem certeza que deseja remover este teste agendado?')) {
            setTests(prev => prev.filter(t => t.id !== testId));
        }
    };
    
    // Placeholder function for editing
    const handleEditTest = (test: Test) => {
        alert(`Funcionalidade de edição para o teste "${test.title}" será implementada em breve.`);
    };

    // Placeholder function for creating a new test
    const handleCreateNewTest = () => {
        alert('A tela de criação de novo teste será implementada em breve.');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Agendamento de Testes</h1>
                <p className="text-gray-600 mt-1">Crie, edite e gerencie as avaliações para os alunos.</p>
            </header>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-end items-center mb-5">
                    <button onClick={handleCreateNewTest} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Criar Novo Teste</span>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-gray-600">Título do Teste</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Data Agendada</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Alunos Designados</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tests.map(test => (
                                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">{test.title}</td>
                                    <td className="p-4 text-gray-600">{formatDate(test.scheduledDate)}</td>
                                    <td className="p-4 text-gray-600">
                                        <span className="px-2.5 py-1 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">
                                            {test.assignedTo.length}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-1 justify-end">
                                            <button onClick={() => handleEditTest(test)} className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors" title="Editar">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDeleteTest(test.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors" title="Remover">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tests.length === 0 && (
                        <div className="text-center py-16">
                            <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhum teste agendado.</p>
                             <p className="text-gray-500 text-sm">Clique em "Criar Novo Teste" para começar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestScheduling;