import React from 'react';
import { SessionStats } from '../types';
import { formatTime } from '../services/sessionService';

interface QuizSummaryProps {
  stats: SessionStats;
  showTimer?: boolean;
  onFinish: () => void;
  onRestart: () => void;
}

export const QuizSummary: React.FC<QuizSummaryProps> = ({ stats, showTimer = true, onFinish, onRestart }) => {
  const score = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isInputActive) return;

      if (e.key === 'Enter') {
        if (document.activeElement?.getAttribute('data-action') === 'finish') {
          return;
        }
        e.preventDefault();
        onRestart();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onFinish]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 text-center">
        <h2 className="text-3xl font-bold text-sky-400 mb-2">Session Complete!</h2>
        <p className="text-slate-300 mb-6">Here's how you did in this session.</p>
        
        <div className="relative my-8">
            <svg className="w-40 h-40 mx-auto" viewBox="0 0 36 36">
                <path
                    className="text-slate-700"
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    className={score > 80 ? "text-green-500" : score > 50 ? "text-yellow-500" : "text-red-500"}
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{score}%</span>
                <span className="text-slate-400">Score</span>
            </div>
        </div>

        <div className={`grid ${showTimer && stats.timeTaken !== undefined ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 sm:gap-3 w-full mb-8`}>
            <div className="text-center p-2 rounded-xl bg-slate-700/40 border border-slate-700/50">
                <p className="text-2xl font-bold text-green-400">{stats.correct}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Correct</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-700/40 border border-slate-700/50">
                <p className="text-2xl font-bold text-red-400">{stats.incorrect}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Incorrect</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-slate-700/40 border border-slate-700/50">
                <p className="text-2xl font-bold text-slate-200">{stats.total}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Total</p>
            </div>
            {showTimer && stats.timeTaken !== undefined && (
                <div className="text-center p-2 rounded-xl bg-slate-700/40 border border-slate-700/50">
                    <p className="text-2xl font-bold text-sky-400 font-mono">{formatTime(stats.timeTaken)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Time Taken</p>
                </div>
            )}
        </div>

        <div className="w-full mt-8 flex flex-col gap-4">
            <button
              autoFocus
              onClick={onRestart}
              className="w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-500 transition-colors focus:ring-2 focus:ring-sky-400 focus:outline-none"
              data-action="restart"
            >
              Start Again
            </button>
            <button 
              onClick={onFinish} 
              className="w-full text-slate-300 font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none"
              data-action="finish"
            >
              Back to Quizzes
            </button>
        </div>
      </div>
    </div>
  );
};
