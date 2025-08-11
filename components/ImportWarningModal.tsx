import React from 'react';
import { ImportWarning } from '../types';

interface ImportWarningModalProps {
  warnings: ImportWarning[];
  onClose: () => void;
}

export const ImportWarningModal: React.FC<ImportWarningModalProps> = ({ warnings, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-amber-500/50" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Quiz Created with Warnings</h2>
        <p className="text-slate-300 mb-6">
          Your quiz was created successfully, but some rows from your CSV file could not be imported.
        </p>
        
        <div className="max-h-60 overflow-y-auto bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
            {warnings.map((warning, index) => (
                <div key={index} className="text-sm">
                    <p className="text-slate-400">
                        <span className="font-semibold text-white">Line {warning.line}:</span> 
                        <code className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md mx-1">{warning.content}</code>
                    </p>
                    <p className="pl-4 text-amber-400/90">&rarr; Reason: {warning.reason}</p>
                </div>
            ))}
        </div>

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