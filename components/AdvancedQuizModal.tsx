import React, { useState } from 'react';
import { Quiz } from '../types';
import { ResetIcon, TrashIcon, PencilIcon, BarChartIcon } from './icons';

interface AdvancedQuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onDeleteQuiz: (quizId: string) => void;
  onResetMastery: (quizId: string) => void;
  onEditQuiz: (quizId: string) => void;
  onShowStats: (quizId: string) => void;
}

export const AdvancedQuizModal: React.FC<AdvancedQuizModalProps> = ({ quiz, onClose, onDeleteQuiz, onResetMastery, onEditQuiz, onShowStats }) => {
  const [confirmAction, setConfirmAction] = useState<'delete' | 'reset' | null>(null);

  const handleConfirm = () => {
    if (confirmAction === 'delete') {
      onDeleteQuiz(quiz.id);
    } else if (confirmAction === 'reset') {
      onResetMastery(quiz.id);
    }
    // The modal will be closed by the parent component after the action is performed
  };

  const confirmationContent = {
    reset: {
      title: 'Reset Quiz Priorities',
      message: `Are you sure you want to reset all progress for the "${quiz.name}" quiz? All cards will be set to "Unset" priority.`,
      confirmText: 'Yes, Reset Priorities',
      buttonClass: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500'
    },
    delete: {
      title: 'Permanently Delete Quiz',
      message: `Are you sure you want to permanently delete the "${quiz.name}" quiz and all its cards? This action cannot be undone.`,
      confirmText: 'Yes, Delete Permanently',
      buttonClass: 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
    }
  };
  
  const currentConfirmation = confirmAction ? confirmationContent[confirmAction] : null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
        
        {currentConfirmation ? (
          // Confirmation View
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">{currentConfirmation.title}</h2>
            <p className="text-slate-300">{currentConfirmation.message}</p>
            <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={() => setConfirmAction(null)} 
                className="px-6 py-2 bg-transparent border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                className={`px-6 py-2 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors ${currentConfirmation.buttonClass}`}
              >
                {currentConfirmation.confirmText}
              </button>
            </div>
          </div>
        ) : (
          // Main View
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Advanced Settings</h2>
            <p className="text-slate-400 mb-6">Quiz: <span className="font-semibold text-slate-300">{quiz.name}</span></p>
            
            <div className="space-y-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-2">Edit Quiz</h3>
                    <p className="text-sm text-slate-300 mb-4">Change the quiz name, manage cards, and set custom priority weights for sessions.</p>
                    <button
                        onClick={() => onEditQuiz(quiz.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
                    >
                        <PencilIcon className="w-5 h-5"/>
                        Edit Quiz
                    </button>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-2">View Statistics</h3>
                    <p className="text-sm text-slate-300 mb-4">See detailed statistics for each card, including its priority and your answer history.</p>
                    <button
                        onClick={() => onShowStats(quiz.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
                    >
                        <BarChartIcon className="w-5 h-5"/>
                        View Card Statistics
                    </button>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-2">Reset Priorities</h3>
                    <p className="text-sm text-slate-300 mb-4">This will reset all learning progress for this quiz. All cards will be marked with "Unset" priority. Use this if you want to start the quiz over from the beginning.</p>
                    <button
                        onClick={() => setConfirmAction('reset')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 transition-colors"
                    >
                        <ResetIcon className="w-5 h-5"/>
                        Reset Quiz Priorities
                    </button>
                </div>

                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                    <h3 className="font-bold text-red-300 mb-2">Delete Quiz</h3>
                    <p className="text-sm text-red-300/80 mb-4">This will permanently delete the quiz and all of its associated cards. This action is irreversible.</p>
                    <button
                        onClick={() => setConfirmAction('delete')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon className="w-5 h-5" />
                        Permanently Delete Quiz
                    </button>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-transparent border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
                    Close
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};