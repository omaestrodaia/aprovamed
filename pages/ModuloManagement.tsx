import React, { useState, useMemo } from 'react';
import { Curso, Modulo } from '../types';
import { EditIcon, TrashIcon, PlusCircleIcon, FolderKanbanIcon } from '../components/icons';

interface ModuloManagementProps {
    cursos: Curso[];
    setCursos: React.Dispatch<React.SetStateAction<Curso[]>>;
    modulos: Modulo[];
    setModulos: React.Dispatch<React.SetStateAction<Modulo[]>>;
}

const ModuloManagement: React.FC<ModuloManagementProps> = ({ cursos, setCursos, modulos, setModulos }) => {
    const [selectedCurso, setSelectedCurso] = useState<Curso | null>(cursos[0] || null);
    const [newCursoName, setNewCursoName] = useState('');
    const [newModuloName, setNewModuloName] = useState('');

    const handleAddCurso = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCursoName.trim()) {
            const newCurso: Curso = {
                id: `c-${Date.now()}`,
                descricao: newCursoName.trim()
            };
            setCursos(prev => [...prev, newCurso]);
            setNewCursoName('');
        }
    };
    
    const handleAddModulo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newModuloName.trim() && selectedCurso) {
            const newModulo: Modulo = {
                id: `m-${Date.now()}`,
                cursoId: selectedCurso.id,
                descricao: newModuloName.trim()
            };
            setModulos(prev => [...prev, newModulo]);
            setNewModuloName('');
        }
    };

    const handleDeleteModulo = (moduloId: string) => {
        if(window.confirm('Tem certeza que deseja remover este módulo?')) {
            setModulos(prev => prev.filter(m => m.id !== moduloId));
        }
    };

    const modulosFiltrados = useMemo(() => {
        if (!selectedCurso) return [];
        return modulos.filter(m => m.cursoId === selectedCurso.id);
    }, [modulos, selectedCurso]);


    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Módulos</h1>
                <p className="text-gray-600 mt-1">Organize a estrutura de cursos e seus respectivos módulos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                {/* Cursos Panel */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Cursos ({cursos.length})</h2>
                    </div>
                     <div className="p-4 border-b border-gray-200">
                        <form onSubmit={handleAddCurso} className="flex gap-2">
                           <input
                                type="text"
                                value={newCursoName}
                                onChange={e => setNewCursoName(e.target.value)}
                                placeholder="Novo curso..."
                                className="flex-grow bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button type="submit" className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"><PlusCircleIcon className="w-5 h-5"/></button>
                        </form>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {cursos.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setSelectedCurso(c)}
                                className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${selectedCurso?.id === c.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'hover:bg-gray-100'}`}
                            >
                                <FolderKanbanIcon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{c.descricao}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Módulos Panel */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                         {selectedCurso ? (
                            <h2 className="text-lg font-semibold text-gray-800">Módulos em <span className="text-purple-600">{selectedCurso.descricao}</span> ({modulosFiltrados.length})</h2>
                         ) : (
                            <h2 className="text-lg font-semibold text-gray-800">Selecione um curso</h2>
                         )}
                    </div>
                    {selectedCurso && (
                        <>
                            <div className="p-4 border-b border-gray-200">
                                <form onSubmit={handleAddModulo} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newModuloName}
                                        onChange={e => setNewModuloName(e.target.value)}
                                        placeholder="Novo módulo..."
                                        className="flex-grow bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <button type="submit" className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"><PlusCircleIcon className="w-5 h-5"/></button>
                                </form>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr><th className="p-4 font-semibold text-sm text-gray-600">Descrição do Módulo</th><th className="p-4 text-right">Ações</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {modulosFiltrados.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800">{m.descricao}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-1 justify-end">
                                                        <button className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => handleDeleteModulo(m.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors" title="Remover"><TrashIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {modulosFiltrados.length === 0 && <p className="p-8 text-center text-gray-500">Nenhum módulo cadastrado para este curso.</p>}
                            </div>
                        </>
                    )}
                     {!selectedCurso && (
                        <div className="flex-grow flex items-center justify-center">
                             <p className="text-gray-500">Selecione um curso à esquerda para ver seus módulos.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default ModuloManagement;
