import React, { useState, useCallback } from 'react';
import { createQuiz } from '../services/quizService';
import { ImportWarning } from '../types';

interface CreateQuizModalProps {
  onClose: () => void;
  onQuizCreated: (warnings: ImportWarning[]) => void;
}

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ onClose, onQuizCreated }) => {
  const [quizName, setQuizName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || !csvFile) {
      setError('Please provide a quiz name and a CSV file.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const fileContent = await csvFile.text();
      const { warnings } = createQuiz(quizName, fileContent);
      onQuizCreated(warnings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [quizName, csvFile, onQuizCreated, onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Quiz</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="quizName" className="block text-sm font-medium text-slate-300 mb-2">Quiz Name</label>
            <input
              type="text"
              id="quizName"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., Common Nouns"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="csvFile" className="block text-sm font-medium text-slate-300 mb-2">Words (CSV file)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-400">
                        <label htmlFor="csvFile" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input id="csvFile" name="csvFile" type="file" className="sr-only" accept=".csv, text/csv" onChange={handleFileChange} required/>
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">CSV up to 10MB. Format: `word,translation`</p>
                    {csvFile && <p className="text-sm text-green-400 pt-2">{csvFile.name}</p>}
                </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-2 bg-transparent border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50">
                Cancel
            </button>
            <button type="submit" disabled={isLoading || !quizName || !csvFile} className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-200 shadow-lg shadow-sky-600/30 transform hover:-translate-y-0.5 disabled:bg-slate-600 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
              {isLoading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};