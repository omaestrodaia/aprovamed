import React, { useState, useMemo } from 'react';
import { Disciplina, Assunto, Modulo } from '../types';
import { GraduationCapIcon, EditIcon, TrashIcon, PlusCircleIcon, BookOpenIcon } from '../components/icons';

interface AcademicManagementProps {
    page: string;
    modulos: Modulo[];
    disciplinas: Disciplina[];
    setDisciplinas: React.Dispatch<React.SetStateAction<Disciplina[]>>;
    assuntos: Assunto[];
    setAssuntos: React.Dispatch<React.SetStateAction<Assunto[]>>;
}

const AcademicManagement: React.FC<AcademicManagementProps> = ({ page, modulos, disciplinas, setDisciplinas, assuntos, setAssuntos }) => {
    const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(modulos[0] || null);
    const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
    const [newDisciplinaName, setNewDisciplinaName] = useState('');
    const [newAssuntoName, setNewAssuntoName] = useState('');

    const isDisciplinaMode = page === 'disciplinas';

    const handleAddDisciplina = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDisciplinaName.trim() && selectedModulo) {
            const newDisciplina: Disciplina = {
                id: `d-${Date.now()}`,
                moduloId: selectedModulo.id,
                descricao: newDisciplinaName.trim()
            };
            setDisciplinas(prev => [...prev, newDisciplina]);
            setNewDisciplinaName('');
        }
    };
    
    const handleAddAssunto = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAssuntoName.trim() && selectedDisciplina) {
            const newAssunto: Assunto = {
                id: `a-${Date.now()}`,
                disciplinaId: selectedDisciplina.id,
                descricao: newAssuntoName.trim()
            };
            setAssuntos(prev => [...prev, newAssunto]);
            setNewAssuntoName('');
        }
    };

    const handleDeleteAssunto = (assuntoId: string) => {
        if(window.confirm('Tem certeza que deseja remover este assunto?')) {
            setAssuntos(prev => prev.filter(a => a.id !== assuntoId));
        }
    };
    
    const disciplinasFiltradas = useMemo(() => {
        if (!selectedModulo) return [];
        return disciplinas.filter(d => d.moduloId === selectedModulo.id);
    }, [disciplinas, selectedModulo]);

    const assuntosFiltrados = useMemo(() => {
        if (!selectedDisciplina) return [];
        return assuntos.filter(a => a.disciplinaId === selectedDisciplina.id);
    }, [assuntos, selectedDisciplina]);
    
    // Auto-select first disciplina when modulo changes
    React.useEffect(() => {
        setSelectedDisciplina(disciplinasFiltradas[0] || null);
    }, [selectedModulo, disciplinas]);


    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">
                    {isDisciplinaMode ? 'Gerenciamento de Disciplinas' : 'Gerenciamento de Assuntos'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isDisciplinaMode 
                        ? 'Crie e organize as disciplinas dentro de cada módulo.' 
                        : 'Selecione uma disciplina para criar e organizar seus assuntos.'}
                </p>
            </header>
            
            <div className="mb-4">
                <label htmlFor="modulo-select" className="block text-sm font-medium text-gray-700 mb-2">Selecione um Módulo para gerenciar:</label>
                <select 
                    id="modulo-select"
                    value={selectedModulo?.id || ''}
                    onChange={(e) => setSelectedModulo(modulos.find(m => m.id === e.target.value) || null)}
                    className="w-full max-w-sm bg-white border border-gray-300 rounded-md p-2.5 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                     <option value="" disabled>Escolha um módulo</option>
                    {modulos.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-280px)]">
                {/* Disciplinas Panel */}
                <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Disciplinas ({disciplinasFiltradas.length})</h2>
                    </div>
                     {isDisciplinaMode && selectedModulo && (
                        <div className="p-4 border-b border-gray-200">
                            <form onSubmit={handleAddDisciplina} className="flex gap-2">
                               <input
                                    type="text"
                                    value={newDisciplinaName}
                                    onChange={e => setNewDisciplinaName(e.target.value)}
                                    placeholder="Nova disciplina..."
                                    className="flex-grow bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                />
                                <button type="submit" className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"><PlusCircleIcon className="w-5 h-5"/></button>
                            </form>
                        </div>
                    )}
                    <div className="flex-grow overflow-y-auto">
                        {disciplinasFiltradas.map(d => (
                            <button 
                                key={d.id}
                                onClick={() => setSelectedDisciplina(d)}
                                className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${selectedDisciplina?.id === d.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'hover:bg-gray-100'}`}
                            >
                                <GraduationCapIcon className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">{d.descricao}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Assuntos Panel */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                         {selectedDisciplina ? (
                            <h2 className="text-lg font-semibold text-gray-800">Assuntos em <span className="text-purple-600">{selectedDisciplina.descricao}</span> ({assuntosFiltrados.length})</h2>
                         ) : (
                            <h2 className="text-lg font-semibold text-gray-800">Selecione uma disciplina</h2>
                         )}
                    </div>
                    {selectedDisciplina ? (
                        <>
                            <div className="p-4 border-b border-gray-200">
                                <form onSubmit={handleAddAssunto} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAssuntoName}
                                        onChange={e => setNewAssuntoName(e.target.value)}
                                        placeholder="Novo assunto..."
                                        className="flex-grow bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <button type="submit" className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"><PlusCircleIcon className="w-5 h-5"/></button>
                                </form>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr><th className="p-4 font-semibold text-sm text-gray-600">Descrição do Assunto</th><th className="p-4 text-right">Ações</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {assuntosFiltrados.map(a => (
                                            <tr key={a.id} className="hover:bg-gray-50">
                                                <td className="p-4 font-medium text-gray-800">{a.descricao}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-1 justify-end">
                                                        <button className="p-2 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                                        <button onClick={() => handleDeleteAssunto(a.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors" title="Remover"><TrashIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {assuntosFiltrados.length === 0 && <p className="p-8 text-center text-gray-500">Nenhum assunto cadastrado para esta disciplina.</p>}
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                             {!selectedModulo 
                                ? <p>Selecione um módulo para começar.</p> 
                                : <p>Selecione uma disciplina à esquerda para ver seus assuntos.</p>}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AcademicManagement;