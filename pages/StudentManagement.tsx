import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { StudentFormModal } from '../components/StudentFormModal';
import { AssignCoursesModal } from '../components/AssignCoursesModal';
import { PlusCircleIcon, SearchIcon, EditIcon, TrashIcon, UsersIcon, GraduationCapIcon } from '../components/icons';

const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [studentToAssign, setStudentToAssign] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data: studentsData, error: studentsError } = await supabase
                .from('alunos')
                .select('*')
                .order('name', { ascending: true });

            if (studentsError) throw studentsError;

            // Fetch all enrollments to count them on the client. More robust than a complex query.
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('alunos_cursos')
                .select('aluno_id');
            
            if (enrollmentsError) throw enrollmentsError;

            const enrollmentCounts = (enrollmentsData || []).reduce((acc, enrollment) => {
                acc[enrollment.aluno_id] = (acc[enrollment.aluno_id] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);


            const formattedData: User[] = (studentsData || []).map(student => ({
                id: student.id,
                name: student.name,
                email: student.email,
                role: 'student',
                avatarUrl: student.avatar_url || `https://i.pravatar.cc/150?u=${student.id}`,
                registrationDate: student.registration_date,
                status: student.status,
                enrolledCoursesCount: enrollmentCounts[student.id] || 0,
            }));
            setStudents(formattedData);
        } catch (error) {
            console.error('Error fetching students:', error instanceof Error ? error.message : JSON.stringify(error));
            setStudents([]);
        }
        setLoading(false);
    };

    const handleOpenFormModal = (student: User | null = null) => {
        setEditingStudent(student);
        setIsFormModalOpen(true);
    };
    
    const handleOpenAssignModal = (student: User) => {
        setStudentToAssign(student);
        setIsAssignModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setEditingStudent(null);
    };

    const handleSaveStudent = async (studentData: Omit<User, 'id' | 'role' | 'avatarUrl' | 'registrationDate'>) => {
        if (editingStudent) {
            // Update existing student
            const { data, error } = await supabase
                .from('alunos')
                .update({ name: studentData.name, email: studentData.email, status: studentData.status })
                .eq('id', editingStudent.id)
                .select()
                .single();

            if (error) {
                alert('Erro ao atualizar aluno: ' + error.message);
            } else if (data) {
                // To update the UI correctly, we refetch all students
                fetchStudents();
            }
        } else {
            // Create new student
            const { data, error } = await supabase
                .from('alunos')
                .insert([{
                    name: studentData.name,
                    email: studentData.email,
                    status: studentData.status,
                }])
                .select()
                .single();

            if (error) {
                alert(`Erro ao adicionar aluno: ${error.message}`);
            } else if (data) {
                // To update the UI correctly, we refetch all students
                fetchStudents();
            }
        }
        handleCloseModal();
    };


    const handleDeleteStudent = async (studentId: string) => {
        if (window.confirm('Tem certeza que deseja remover este aluno? Esta ação não pode ser desfeita.')) {
            const { error } = await supabase.from('alunos').delete().eq('id', studentId);
            if (error) {
                alert('Erro ao deletar aluno: ' + error.message);
            } else {
                setStudents(prev => prev.filter(s => s.id !== studentId));
            }
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-8 animate-fade-in">
            <StudentFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveStudent}
                student={editingStudent}
            />
            <AssignCoursesModal 
                student={studentToAssign}
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSaveSuccess={fetchStudents}
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
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pl-10 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button onClick={() => handleOpenFormModal()} className="w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Adicionar Aluno</span>
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    {loading ? (
                         <div className="text-center py-16 text-gray-500">Carregando alunos...</div>
                    ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-gray-600">Aluno</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Data de Cadastro</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-center">Cursos Matriculados</th>
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
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {student.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                     <td className="p-4 text-center">
                                        <span className="px-2.5 py-1 text-sm font-semibold bg-gray-100 text-gray-800 rounded-full">
                                            {student.enrolledCoursesCount}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-1 justify-end">
                                             <button onClick={() => handleOpenAssignModal(student)} className="p-2 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-100 transition-colors" title="Matricular em cursos">
                                                <GraduationCapIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleOpenFormModal(student)} className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-colors" title="Editar">
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
                    )}
                    {!loading && filteredStudents.length === 0 && (
                        <div className="text-center py-16">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhum aluno encontrado.</p>
                             <p className="text-gray-500 text-sm">{searchTerm ? 'Tente um termo de busca diferente.' : 'Clique em "Adicionar Aluno" para começar.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentManagement;