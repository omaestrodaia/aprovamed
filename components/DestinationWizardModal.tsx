import React, { useState } from 'react';
import { ClassbuildSettings, Disciplina, Assunto } from '../types';
import { createDisciplina, createAssunto } from '../services/classbuildService';
import { XIcon } from './icons';

interface DestinationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (disciplina: Disciplina, assunto: Assunto) => void;
  settings: ClassbuildSettings;
  sessionDisciplinas: Disciplina[];
  setSessionDisciplinas: React.Dispatch<React.SetStateAction<Disciplina[]>>;
  sessionAssuntos: Assunto[];
  setSessionAssuntos: React.Dispatch<React.SetStateAction<Assunto[]>>;
}

type WizardStep = 'disciplina' | 'assunto' | 'confirm';

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export const DestinationWizardModal: React.FC<DestinationWizardModalProps> = ({
  isOpen, onClose, onFinish, settings,
  sessionDisciplinas, setSessionDisciplinas,
  sessionAssuntos, setSessionAssuntos
}) => {
  const [step, setStep] = useState<WizardStep>('disciplina');
  const [disciplinaName, setDisciplinaName] = useState('');
  const [assuntoName, setAssuntoName] = useState('');
  const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
  const [selectedAssunto, setSelectedAssunto] = useState<Assunto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setStep('disciplina');
    setDisciplinaName('');
    setAssuntoName('');
    setSelectedDisciplina(null);
    setSelectedAssunto(null);
    setIsLoading(false);
    setError(null);
    onClose();
  };
  
  const handleDisciplinaSubmit = async () => {
    if (!disciplinaName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newDisciplina = await createDisciplina(disciplinaName, settings);
      setSessionDisciplinas(prev => [...prev, newDisciplina]);
      setSelectedDisciplina(newDisciplina);
      setStep('assunto');
    } catch (e: any) {
      setError(e.message || 'Falha ao criar disciplina.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssuntoSubmit = async () => {
    if (!assuntoName.trim() || !selectedDisciplina) return;
    setIsLoading(true);
    setError(null);
    try {
      const newAssunto = await createAssunto(assuntoName, selectedDisciplina.id, settings);
      const assuntoWithContext = {...newAssunto, disciplinaId: selectedDisciplina.id };
      setSessionAssuntos(prev => [...prev, assuntoWithContext]);
      setSelectedAssunto(assuntoWithContext);
      setStep('confirm');
    } catch (e: any) {
      setError(e.message || 'Falha ao criar assunto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (selectedDisciplina && selectedAssunto) {
      onFinish(selectedDisciplina, selectedAssunto);
      resetState();
    }
  };

  const filteredDisciplinas = disciplinaName
    ? sessionDisciplinas.filter(d => d.descricao.toLowerCase().includes(disciplinaName.toLowerCase()))
    : [];
    
  const filteredAssuntos = assuntoName && selectedDisciplina
    ? sessionAssuntos.filter(a => a.disciplinaId === selectedDisciplina.id && a.descricao.toLowerCase().includes(assuntoName.toLowerCase()))
    : [];

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Assistente de Destino</h2>
          <button onClick={resetState} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-gray-50">
          {error && <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-md mb-4">{error}</div>}
          
          {step === 'disciplina' && (
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-800">Passo 1: Defina a Disciplina</label>
              <p className="text-sm text-gray-600">Digite o nome para uma nova disciplina ou selecione uma já criada nesta sessão.</p>
              <input
                type="text"
                value={disciplinaName}
                onChange={e => setDisciplinaName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ex: Cardiologia"
              />
              {filteredDisciplinas.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-gray-100 rounded-md p-2 space-y-1">
                    <p className="text-xs text-gray-500 px-2">Sugestões da sessão:</p>
                    {filteredDisciplinas.map(d => (
                        <button key={d.id} onClick={() => { setSelectedDisciplina(d); setStep('assunto'); }} className="w-full text-left px-3 py-2 text-gray-800 hover:bg-purple-100 rounded-md">
                            {d.descricao}
                        </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === 'assunto' && selectedDisciplina && (
             <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-800">Passo 2: Defina o Assunto</label>
              <p className="text-sm text-gray-600">Agora, crie um assunto para a disciplina <span className="font-bold text-purple-600">"{selectedDisciplina.descricao}"</span>.</p>
               <input
                type="text"
                value={assuntoName}
                onChange={e => setAssuntoName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ex: Arritmias"
              />
               {filteredAssuntos.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-gray-100 rounded-md p-2 space-y-1">
                    <p className="text-xs text-gray-500 px-2">Sugestões da sessão para esta disciplina:</p>
                    {filteredAssuntos.map(a => (
                        <button key={a.id} onClick={() => { setSelectedAssunto(a); setStep('confirm'); }} className="w-full text-left px-3 py-2 text-gray-800 hover:bg-purple-100 rounded-md">
                            {a.descricao}
                        </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && selectedDisciplina && selectedAssunto && (
             <div className="space-y-4 text-center">
                 <h3 className="text-lg font-semibold text-gray-800">Passo 3: Confirmação</h3>
                 <p className="text-gray-600">
                    Você está pronto para enviar as questões selecionadas para o seguinte destino:
                 </p>
                 <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-left">
                    <p><span className="font-semibold text-gray-500">Disciplina:</span> <span className="font-bold text-purple-600">{selectedDisciplina.descricao}</span></p>
                    <p><span className="font-semibold text-gray-500">Assunto:</span> <span className="font-bold text-purple-600">{selectedAssunto.descricao}</span></p>
                 </div>
            </div>
          )}

        </div>
        
        <div className="flex justify-between items-center p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div>
              {step === 'assunto' && <button onClick={() => setStep('disciplina')} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Voltar</button>}
              {step === 'confirm' && <button onClick={() => setStep('assunto')} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Voltar</button>}
            </div>
            <div className="flex justify-end">
                <button onClick={resetState} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
                {step === 'disciplina' && <button onClick={handleDisciplinaSubmit} disabled={!disciplinaName.trim() || isLoading} className="w-32 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex justify-center items-center">{isLoading ? <Spinner /> : "Avançar"}</button>}
                {step === 'assunto' && <button onClick={handleAssuntoSubmit} disabled={!assuntoName.trim() || isLoading} className="w-32 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex justify-center items-center">{isLoading ? <Spinner /> : "Avançar"}</button>}
                {step === 'confirm' && <button onClick={handleFinish} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">Confirmar e Enviar</button>}
            </div>
        </div>

      </div>
    </div>
  );
};