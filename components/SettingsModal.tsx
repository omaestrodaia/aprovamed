
import React, { useState, useEffect } from 'react';
import { ClassbuildSettings } from '../types';
import { XIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { checkClassbuildConnection } from '../services/classbuildService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClassbuildSettings;
  onSave: (settings: ClassbuildSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [currentSettings, setCurrentSettings] = useState<ClassbuildSettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    setCurrentSettings(settings);
    if (isOpen) {
        setTestStatus('idle');
        setTestMessage('');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(currentSettings);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!currentSettings.apiKey || !currentSettings.escolaId) {
        setTestStatus('error');
        setTestMessage('Token e ID da Escola são obrigatórios.');
        setTimeout(() => setTestStatus('idle'), 5000);
        return;
    }
    setTestStatus('testing');
    setTestMessage('');
    const result = await checkClassbuildConnection(currentSettings);
    if (result.success) {
        setTestStatus('success');
    } else {
        setTestStatus('error');
    }
    setTestMessage(result.message);

    setTimeout(() => {
        setTestStatus('idle');
    }, 5000);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Configurações de Envio</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bearer Token (JWT)</label>
            <input
              type="password"
              name="apiKey"
              value={currentSettings.apiKey}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cole seu token aqui"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID da Escola</label>
            <input
              type="text"
              name="escolaId"
              value={currentSettings.escolaId}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ID da sua escola na ClassBuild"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ID do Banco de Questões</label>
            <input
              type="text"
              name="bancoQuestaoId"
              value={currentSettings.bancoQuestaoId}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ID do banco de destino"
            />
          </div>
        </div>
        <div className="flex justify-between items-center p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex-1 pr-4">
            {testStatus === 'success' && (
                <div className="flex items-center text-green-600 animate-fade-in-fast">
                    <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">{testMessage}</span>
                </div>
            )}
            {testStatus === 'error' && (
                <div className="flex items-center text-red-600 animate-fade-in-fast">
                    <XCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">{testMessage}</span>
                </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
            <button 
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="w-40 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait flex justify-center items-center"
            >
                {testStatus === 'testing' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : "Testar Conexão"}
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};
