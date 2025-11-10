import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { XIcon } from './icons';

interface QuestionEditorModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({ question, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Question | null>(null);

  useEffect(() => {
    if (question) {
      setFormData(JSON.parse(JSON.stringify(question))); // Deep copy
    }
  }, [question]);

  if (!isOpen || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  const handleAlternativeChange = (index: number, text: string) => {
    setFormData(prev => {
        if (!prev) return null;
        const newAlternativas = [...prev.alternativas];
        newAlternativas[index] = { ...newAlternativas[index], texto: text };
        return { ...prev, alternativas: newAlternativas };
    });
  };
  
  const handleCorrectChange = (letter: string) => {
    setFormData(prev => prev ? { ...prev, correta: letter } : null);
  };

  const handleSaveClick = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Editar Questão <span className="text-purple-600">#{formData.id}</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enunciado</label>
            <textarea
              name="enunciado"
              value={formData.enunciado}
              onChange={handleInputChange}
              rows={5}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alternativas</label>
            <div className="space-y-4">
              {formData.alternativas.map((alt, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 bg-white rounded-lg border has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 transition-all">
                   <input
                    type="radio"
                    name="correta"
                    id={`correta-${alt.letra}`}
                    checked={formData.correta === alt.letra}
                    onChange={() => handleCorrectChange(alt.letra)}
                    className="h-5 w-5 mt-1.5 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor={`correta-${alt.letra}`} className="w-full cursor-pointer">
                    <span className="font-bold text-gray-700">{alt.letra})</span>
                    <textarea
                      value={alt.texto}
                      onChange={(e) => handleAlternativeChange(index, e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-300 rounded-md p-2 mt-1 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolução (Opcional)</label>
            <textarea
              name="resolucao"
              value={formData.resolucao}
              onChange={handleInputChange}
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dica (Opcional)</label>
            <textarea
              name="dica"
              value={formData.dica}
              onChange={handleInputChange}
              rows={2}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
        </div>
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
          <button onClick={handleSaveClick} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};