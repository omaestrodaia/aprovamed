import React, { useState, useEffect, useMemo } from 'react';
import { Curso, Modulo, Disciplina, Assunto } from '../types';
import { supabase } from '../services/supabaseClient';
import { AcademicItemFormModal } from '../components/AcademicItemFormModal';
import { PlusCircleIcon, EditIcon, TrashIcon, FolderKanbanIcon } from '../components/icons';

type AcademicItem = Curso | Modulo | Disciplina | Assunto;
type ItemType = 'curso' | 'modulo' | 'disciplina' | 'assunto';

const AcademicManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ItemType>('curso');
    const [items, setItems] = useState<AcademicItem[]>([]);
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AcademicItem | null>(null);

    const tables: Record<ItemType, string> = {
        curso: 'cursos',
        modulo: 'modulos',
        disciplina: 'disciplinas',
        assunto: 'assuntos',
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        fetchItems(activeTab);
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [cursosRes, modulosRes, disciplinasRes] = await Promise.all([
                supabase.from('cursos').select('*'),
                supabase.from('modulos').select('*'),
                supabase.from('disciplinas').select('*'),
            ]);
            if (cursosRes.error) throw cursosRes.error;
            setCursos(cursosRes.data);
            if (modulosRes.error) throw modulosRes.error;
            setModulos(modulosRes.data);
            if (disciplinasRes.error) throw disciplinasRes.error;
            setDisciplinas(disciplinasRes.data);
        } catch (error) {
            console.error("Error fetching all academic data:", error);
        }
        setLoading(false);
    };

    const fetchItems = async (type: ItemType) => {
        setLoading(true);
        const { data, error } = await supabase.from(tables[type]).select('*').order('descricao', { ascending: true });
        if (error) {
            console.error(`Error fetching ${type}s:`, error);
            setItems([]);
        } else {
            setItems(data);
        }
        setLoading(false);
    };

    const getParentName = (item: AcademicItem) => {
        if ('curso_id' in item && item.curso_id) {
            return cursos.find(c => c.id === item.curso_id)?.descricao || 'N/A';
        }
        if ('modulo_id' in item && item.modulo_id) {
            return modulos.find(m => m.id === item.modulo_id)?.descricao || 'N/A';
        }
        if ('disciplina_id' in item && item.disciplina_id) {
            return disciplinas.find(d => d.id === item.disciplina_id)?.descricao || 'N/A';
        }
        return null;
    };
    
    const handleSave = async (itemData: { descricao: string, parentId?: string }) => {
        const payload: any = { descricao: itemData.descricao };
        if(itemData.parentId) {
             switch(activeTab) {
                case 'modulo': payload.curso_id = itemData.parentId; break;
                case 'disciplina': payload.modulo_id = itemData.parentId; break;
                case 'assunto': payload.disciplina_id = itemData.parentId; break;
            }
        }

        if (editingItem) {
            const { error } = await supabase.from(tables[activeTab]).update(payload).eq('id', editingItem.id);
            if (error) alert(`Erro ao atualizar: ${error.message}`);
        } else {
            const { error } = await supabase.from(tables[activeTab]).insert([payload]);
            if (error) alert(`Erro ao criar: ${error.message}`);
        }
        fetchItems(activeTab);
        fetchAllData(); // Re-fetch all data to update parent names
        setIsModalOpen(false);
        setEditingItem(null);
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza? A remoção pode afetar itens dependentes.')) {
            const { error } = await supabase.from(tables[activeTab]).delete().eq('id', id);
            if (error) alert(`Erro ao deletar: ${error.message}`);
            else fetchItems(activeTab);
        }
    };
    
    const parents = useMemo(() => {
        switch(activeTab) {
            case 'modulo': return cursos;
            case 'disciplina': return modulos;
            case 'assunto': return disciplinas;
            default: return [];
        }
    }, [activeTab, cursos, modulos, disciplinas]);

    return (
        <div className="space-y-8 animate-fade-in">
             <AcademicItemFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                itemType={activeTab}
                currentItem={editingItem}
                parents={parents}
            />
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Gestão Acadêmica</h1>
                <p className="text-gray-600 mt-1">Gerencie a estrutura de Cursos, Módulos, Disciplinas e Assuntos.</p>
            </header>
            
            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-center mb-5 border-b border-gray-200">
                    <nav className="flex space-x-2">
                        {(Object.keys(tables) as ItemType[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize py-2 px-4 font-semibold ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>{tab}s</button>
                        ))}
                    </nav>
                     <button onClick={() => { setEditingItem(null); setIsModalOpen(true);}} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg flex items-center space-x-2">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Adicionar {activeTab}</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? <div className="text-center py-10">Carregando...</div> :
                    items.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 font-semibold text-sm text-gray-600">Descrição</th>
                                    {activeTab !== 'curso' && <th className="p-4 font-semibold text-sm text-gray-600">Vinculado a</th>}
                                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{item.descricao}</td>
                                        {activeTab !== 'curso' && <td className="p-4 text-gray-600">{getParentName(item)}</td>}
                                        <td className="p-4 text-right">
                                            <button onClick={() => {setEditingItem(item); setIsModalOpen(true);}} className="p-2 text-gray-500 hover:text-blue-600"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16">
                            <FolderKanbanIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                            <p className="text-gray-500 font-semibold">Nenhum {activeTab} encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcademicManagement;
