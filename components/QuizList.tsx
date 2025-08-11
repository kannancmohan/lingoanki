import React from 'react';
import { Quiz } from '../types';
import { calculateQuizMastery } from '../services/quizService';

interface QuizListProps {
  quizzes: Quiz[];
  onStartQuiz: (quizId: string) => void;
  onCreateQuiz: () => void;
  onOpenAdvancedSettings: (quizId: string) => void;
}

export const QuizList: React.FC<QuizListProps> = ({ quizzes, onStartQuiz, onCreateQuiz, onOpenAdvancedSettings }) => {
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Your Quizzes</h1>
                <button 
                    onClick={onCreateQuiz}
                    className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-500 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Quiz
                </button>
            </div>
            {quizzes.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-800 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-semibold text-white">No Quizzes Yet!</h3>
                    <p className="text-slate-400 mt-2">Click "New Quiz" to create your first deck of flashcards.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => {
                        const mastery = calculateQuizMastery(quiz);
                        return (
                        <div 
                            key={quiz.id}
                            onClick={() => onStartQuiz(quiz.id)}
                            className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg hover:border-sky-500 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 group flex justify-between items-center"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">{quiz.name}</h3>
                                <p className="text-slate-400 text-sm mt-1">{quiz.cards.length} cards</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="w-full bg-slate-700 rounded-full h-2 max-w-xs">
                                    <div className="bg-sky-500 h-2 rounded-full" style={{width: `${mastery > 100 ? 100 : mastery}%`}}></div>
                                  </div>
                                  <span className="text-xs font-medium text-slate-300">{mastery}%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAdvancedSettings(quiz.id);
                                 }}
                                 className="text-slate-400 hover:text-sky-400 text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                                 aria-label={`Advanced settings for ${quiz.name}`}
                               >
                                  Advanced...
                               </button>
                               <span className="text-sky-500 font-bold opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all">
                                   Start &#8594;
                               </span>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};