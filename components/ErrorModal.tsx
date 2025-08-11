import React from 'react';

interface ErrorModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-500/50" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-red-400 mb-4">{title}</h2>
        <p className="text-slate-300">{message}</p>
        <div className="flex justify-end gap-4 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
