import React from 'react';
import { SendStatus, SendReport } from '../types';
import { XIcon, CheckCircleIcon, XCircleIcon } from './icons';

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
);

// Fix: Define the missing SendStatusModalProps interface.
interface SendStatusModalProps {
  isOpen: boolean;
  status: SendStatus;
  report: SendReport | null;
  onClose: () => void;
}

export const SendStatusModal: React.FC<SendStatusModalProps> = ({ isOpen, status, report, onClose }) => {
  if (!isOpen) return null;

  const progress = report && report.total > 0 ? ((report.successCount + report.errorCount) / report.total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {status === 'sending' && 'Enviando Questões...'}
            {status === 'complete' && 'Envio Concluído'}
          </h2>
          {status === 'complete' && (
             <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
                <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="p-6 bg-gray-50 text-center">
            {status === 'sending' && (
                <div className="flex flex-col items-center">
                    <Spinner />
                    <p className="mt-4 text-gray-600">Enviando questão {report ? report.successCount + report.errorCount + 1 : 1} de {report?.total || '...'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
            {status === 'complete' && report && (
                 <div className="text-left space-y-4">
                    <div className="flex items-center p-4 bg-gray-100 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-500 mr-3" />
                        <span className="font-medium text-gray-800">{report.successCount} questões enviadas com sucesso.</span>
                    </div>
                    <div className="flex items-center p-4 bg-gray-100 rounded-lg">
                         <XCircleIcon className="w-6 h-6 text-red-500 mr-3" />
                        <span className="font-medium text-gray-800">{report.errorCount} questões falharam.</span>
                    </div>

                    {report.errors.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800">Detalhes dos Erros:</h3>
                            <div className="max-h-48 overflow-y-auto bg-gray-100 p-3 rounded-md border border-gray-200 space-y-2">
                                {report.errors.map((err, index) => (
                                    <p key={index} className="text-sm text-red-700 font-mono">
                                        <span className="font-bold">Questão #{err.questionId}:</span> {err.message}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        {status === 'complete' && (
            <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                 <button onClick={onClose} className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">Fechar Relatório</button>
            </div>
        )}
      </div>
    </div>
  );
};