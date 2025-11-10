import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { EditIcon, TrashIcon, SearchIcon, UsersIcon, PlusCircleIcon } from '../components/icons';
import { StudentFormModal } from '../components/StudentFormModal';

interface StudentManagementProps {
    students: User[];
    setStudents: React.Dispatch<React.SetStateAction<User[]>>;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, setStudents }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = (student: User | null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingStudent(null);
        setIsModalOpen(false);
    };

    const handleSaveStudent = (formData: Omit<User, 'id' | 'role' | 'avatarUrl' | 'registrationDate'>) => {
        if (editingStudent) {
            // Update existing student
            setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...editingStudent, ...formData } : s));
        } else {
            // Add new student
            const newUser: User = {
                id: `student-${Date.now()}`,
                ...formData,
                role: 'student',
                avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
                registrationDate: new Date().toISOString().split('T')[0],
            };
            setStudents(prev => [newUser, ...prev]);
        }
    };

    const handleDeleteStudent = (studentId: string) => {
        if (window.confirm('Tem certeza que deseja remover este aluno? Esta ação não pode ser desfeita.')) {
            setStudents(prev => prev.filter(s => s.id !== studentId));
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(
            s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 s.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <StudentFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveStudent}
                student={editingStudent}
            />

            <header>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Alunos</h1>
                <p className="text-gray-600 mt-1">Adicione, edite e visualize os alunos da plataforma.</p>
            </header>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
                    <div className="relative w-full md:max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pl-10 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <button onClick={() => handleOpenModal(null)} className="w-full md:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Adicionar Novo Aluno</span>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-gray-600">Aluno</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Data de Cadastro</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full" />
                                            <div>
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{formatDate(student.registrationDate)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {student.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-1 justify-end">
                                            <button onClick={() => handleOpenModal(student)} className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors" title="Editar">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDeleteStudent(student.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors" title="Remover">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredStudents.length === 0 && (
                        <div className="text-center py-16">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhum aluno cadastrado.</p>
                             <p className="text-gray-500 text-sm">Clique em "Adicionar Novo Aluno" para começar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;