import React, { useState, useEffect } from 'react';
import { MaterialEstudo, Disciplina, Assunto } from '../types';
import { PlusCircleIcon, BookCopyIcon, TrashIcon, EditIcon } from '../components/icons';
import { supabase } from '../services/supabaseClient';
import { useAcademicData } from '../contexts/AcademicDataContext';

type MaterialTipo = 'pdf' | 'ppt' | 'video';

const MaterialEstudo: React.FC = () => {
    const [material, setMaterial] = useState<MaterialEstudo[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState<MaterialTipo>('pdf');
    const [url, setUrl] = useState('');
    const [disciplinaId, setDisciplinaId] = useState('');
    const [assuntoId, setAssuntoId] = useState('');

    // Use the central academic data context
    const { disciplinas, assuntos, loading: academicLoading, refetch: refetchAcademicData } = useAcademicData();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: matData, error: matError } = await supabase.from('materiais_estudo').select('*');
            if (matError) throw matError;
            setMaterial(matData || []);
        } catch(e: any) {
            console.error("Error fetching materials data:", e.message);
        } finally {
            setLoading(false);
        }
    }

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (titulo.trim() && disciplinaId && assuntoId && (tipo === 'video' ? url.trim() : true)) {
            const newMaterialData = {
                titulo,
                tipo,
                url,
                disciplina_id: disciplinaId,
                assunto_id: assuntoId,
            };

            const { data, error } = await supabase
                .from('materiais_estudo')
                .insert(newMaterialData)
                .select();
            
            if (error) {
                alert('Erro ao adicionar material: ' + error.message);
            } else if (data) {
                setMaterial(prev => [data[0], ...prev]);
                // Reset form
                setIsFormVisible(false);
                setTitulo('');
                setTipo('pdf');
                setUrl('');
                setDisciplinaId('');
                setAssuntoId('');
            }
        }
    };
    
    const handleDeleteMaterial = async (id: string) => {
        if(window.confirm('Tem certeza que deseja remover este material?')) {
            const { error } = await supabase.from('materiais_estudo').delete().eq('id', id);
            if(error) {
                alert('Erro ao deletar material: ' + error.message);
            } else {
                setMaterial(prev => prev.filter(m => m.id !== id));
            }
        }
    }

    const assuntosFiltrados = disciplinaId ? assuntos.filter(a => a.disciplina_id === disciplinaId) : [];

    const getTypeName = (type: MaterialTipo) => {
        switch (type) {
            case 'pdf': return 'PDF';
            case 'ppt': return 'Apresentação';
            case 'video': return 'Vídeo';
        }
    }
    
    const finalLoading = loading || academicLoading;

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Material de Estudo</h1>
                <p className="text-gray-600 mt-1">Adicione e gerencie os materiais de apoio para os alunos.</p>
            </header>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-end items-center mb-5">
                    <button onClick={() => setIsFormVisible(!isFormVisible)} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>{isFormVisible ? 'Cancelar' : 'Adicionar Material'}</span>
                    </button>
                </div>
                
                {isFormVisible && (
                    <form onSubmit={handleAddMaterial} className="p-5 mb-5 border border-gray-200 rounded-lg bg-gray-50 space-y-4 animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800">Novo Material de Estudo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                                <select value={tipo} onChange={e => setTipo(e.target.value as MaterialTipo)} className="w-full input-style">
                                    <option value="pdf">PDF</option>
                                    <option value="ppt">Apresentação (PPT)</option>
                                    <option value="video">Vídeo do YouTube</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                                <select value={disciplinaId} onChange={e => {setDisciplinaId(e.target.value); setAssuntoId('')}} required className="w-full input-style">
                                    <option value="" disabled>Selecione...</option>
                                    {disciplinas.map(d => <option key={d.id} value={d.id}>{d.descricao}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                                <select value={assuntoId} onChange={e => setAssuntoId(e.target.value)} required disabled={!disciplinaId} className="w-full input-style">
                                     <option value="" disabled>Selecione...</option>
                                     {assuntosFiltrados.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                             {tipo === 'video' ? (
                                <>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                                    <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} required className="w-full input-style" />
                                </>
                             ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
                                    <input type="file" accept={tipo === 'pdf' ? '.pdf' : '.ppt,.pptx'} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                </>
                             )}
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Salvar Material</button>
                        </div>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                    {finalLoading ? (
                         <div className="text-center py-16 text-gray-500">Carregando materiais...</div>
                    ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-gray-600">Título</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Tipo</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Vinculado a</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {material.map(mat => (
                                <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">{mat.titulo}</td>
                                    <td className="p-4 text-gray-600">{getTypeName(mat.tipo)}</td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {disciplinas.find(d => d.id === mat.disciplina_id)?.descricao || 'N/A'} / {assuntos.find(a => a.id === mat.assunto_id)?.descricao || 'N/A'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center space-x-1 justify-end">
                                            <button className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-100" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-100" title="Remover"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                    {!finalLoading && material.length === 0 && (
                        <div className="text-center py-16">
                            <BookCopyIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhum material de estudo cadastrado.</p>
                            <p className="text-gray-500 text-sm">Clique em "Adicionar Material" para começar.</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .input-style {
                    background-color: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    padding: 0.625rem;
                    color: #1F2937;
                }
                .input-style:focus {
                    --tw-ring-color: #3B82F6;
                    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                    border-color: #3B82F6;
                }
                 .input-style:disabled {
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
};

export default MaterialEstudo;