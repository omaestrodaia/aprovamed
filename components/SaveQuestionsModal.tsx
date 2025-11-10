import React, { useState, useEffect, useMemo } from 'react';
import { Disciplina, Assunto } from '../types';
import { XIcon } from './icons';

interface SaveQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { disciplinaId: string, assuntoId: string }) => void;
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  questionCount: number;
}

export const SaveQuestionsModal: React.FC<SaveQuestionsModalProps> = ({
  isOpen, onClose, onSave, disciplinas, assuntos, questionCount
}) => {
  const [disciplinaId, setDisciplinaId] = useState('');
  const [assuntoId, setAssuntoId] = useState('');

  const filteredAssuntos = useMemo(() => {
    if (!disciplinaId) return [];
    return assuntos.filter(a => a.disciplina_id === disciplinaId);
  }, [disciplinaId, assuntos]);

  useEffect(() => {
    // Reset assunto when disciplina changes
    if (disciplinaId) setAssuntoId('');
  }, [disciplinaId]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setDisciplinaId('');
        setAssuntoId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disciplinaId && assuntoId) {
      onSave({ disciplinaId, assuntoId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Salvar {questionCount} Questões</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-gray-50">
          <p className="text-sm text-gray-600">Selecione o destino acadêmico para vincular as questões salvas no banco de dados.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disciplina</label>
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              required
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Selecione uma disciplina...</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.descricao}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
            <select
              value={assuntoId}
              onChange={(e) => setAssuntoId(e.target.value)}
              required
              disabled={!disciplinaId}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="" disabled>Selecione um assunto...</option>
              {filteredAssuntos.map(a => (
                <option key={a.id} value={a.id}>{a.descricao}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Salvar no Banco</button>
        </div>
      </form>
    </div>
  );
};
