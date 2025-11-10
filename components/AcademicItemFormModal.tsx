import React, { useState, useEffect } from 'react';
import { Curso, Modulo, Disciplina, Assunto } from '../types';
import { XIcon } from './icons';

type AcademicItem = Curso | Modulo | Disciplina | Assunto;
type ItemType = 'curso' | 'modulo' | 'disciplina' | 'assunto';

interface AcademicItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { descricao: string, parentId?: string }) => void;
  itemType: ItemType;
  currentItem: AcademicItem | null;
  parents: AcademicItem[];
}

export const AcademicItemFormModal: React.FC<AcademicItemFormModalProps> = ({
  isOpen, onClose, onSave, itemType, currentItem, parents
}) => {
  const [descricao, setDescricao] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDescricao(currentItem?.descricao || '');
      let currentParentId = '';
      if (currentItem) {
        if ('curso_id' in currentItem && currentItem.curso_id) currentParentId = currentItem.curso_id;
        else if ('modulo_id' in currentItem && currentItem.modulo_id) currentParentId = currentItem.modulo_id;
        else if ('disciplina_id' in currentItem && currentItem.disciplina_id) currentParentId = currentItem.disciplina_id;
      }
      setParentId(currentParentId);
    }
  }, [currentItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (descricao.trim()) {
      onSave({ descricao, parentId });
    }
  };
  
  const getParentLabel = () => {
    switch(itemType) {
      case 'modulo': return 'Curso';
      case 'disciplina': return 'Módulo';
      case 'assunto': return 'Disciplina';
      default: return '';
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 capitalize">{currentItem ? 'Editar' : 'Adicionar'} {itemType}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Nome do ${itemType}`}
            />
          </div>
          {itemType !== 'curso' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vincular a {getParentLabel()}</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Selecione um {getParentLabel()}</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.descricao}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
        </div>
      </form>
    </div>
  );
};
