
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, FileTextIcon, XIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  if (selectedFile) {
    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
                <FileTextIcon className="w-8 h-8 text-blue-600" />
                <div>
                    <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>
          <button
            onClick={() => onFileSelect(null)}
            className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
            title="Remover arquivo"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
    )
  }

  return (
    <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-xl transition-colors duration-300 ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
    >
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.xlsx,.txt,.md" />
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full cursor-pointer text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UploadCloudIcon className="w-8 h-8 text-gray-600" />
            </div>
            <p className="mb-2 text-md text-gray-600">
                <span className="font-semibold text-blue-600">Arraste seu arquivo aqui</span>
            </p>
            <p className="text-sm text-gray-500">ou clique para selecionar</p>
            <p className="text-xs text-gray-400 mt-2">Suportado: PDF, DOCX, XLSX (até 20MB)</p>
        </label>
    </div>
  );
};
