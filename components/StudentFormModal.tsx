import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { XIcon } from './icons';

interface StudentFormModalProps {
  student: Omit<User, 'id' | 'role' | 'avatarUrl' | 'registrationDate'> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'role' | 'avatarUrl' | 'registrationDate'>) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ student, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (student) {
      setFormData({
          name: student.name,
          email: student.email,
          status: student.status,
      });
    } else {
      // Reset for new student
      setFormData({ name: '', email: '', status: 'active' });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <form onSubmit={handleSaveClick} className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{student ? 'Editar Aluno' : 'Adicionar Novo Aluno'}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-gray-50">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: Ana Silva"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: ana.silva@email.com"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
          <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">Salvar</button>
        </div>
      </form>
    </div>
  );
};