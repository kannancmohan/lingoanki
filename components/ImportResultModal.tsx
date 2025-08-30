import React from 'react';
import { ImportWarning } from '../types';

interface ImportResultModalProps {
  results: {
    addedCount: number;
    skipped: ImportWarning[];
  };
  onClose: () => void;
}

export const ImportResultModal: React.FC<ImportResultModalProps> = ({ results, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-sky-400 mb-4">Import Complete</h2>
        
        <p className="text-lg text-green-400 font-semibold mb-2">
          Successfully added {results.addedCount} new card{results.addedCount !== 1 ? 's' : ''}.
        </p>

        {results.skipped.length > 0 && (
          <>
            <p className="text-slate-300 mt-6 mb-2">
              <span className="font-semibold text-amber-400">{results.skipped.length} row{results.skipped.length !== 1 ? 's' : ''}</span> were skipped:
            </p>
            <div className="max-h-60 overflow-y-auto bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
                {results.skipped.map((warning, index) => (
                    <div key={index} className="text-sm">
                        <p className="text-slate-400">
                            <span className="font-semibold text-white">Line {warning.line}:</span> 
                            <code className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md mx-1">{warning.content}</code>
                        </p>
                        <p className="pl-4 text-amber-400/90">&rarr; Reason: {warning.reason}</p>
                    </div>
                ))}
            </div>
          </>
        )}

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
