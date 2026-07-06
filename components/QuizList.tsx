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
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Group quizzes
    const groupsMap: Record<string, Quiz[]> = {};
    quizzes.forEach(quiz => {
        const groupName = quiz.group || 'default';
        if (!groupsMap[groupName]) {
            groupsMap[groupName] = [];
        }
        groupsMap[groupName].push(quiz);
    });

    // Sort groups: 'default' first, then alphabetical
    const sortedGroupNames = Object.keys(groupsMap).sort((a, b) => {
        if (a === 'default') return -1;
        if (b === 'default') return 1;
        return a.localeCompare(b);
    });
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Your Quizzes</h1>
                <button 
                    id="new-quiz-btn"
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
                    {sortedGroupNames.map(groupName => {
                        const groupQuizzes = groupsMap[groupName];
                        const isExpanded = !!expandedGroups[groupName];
                        return (
                            <div key={groupName} className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-800/40">
                                <button
                                    id={`group-heading-${groupName}`}
                                    onClick={() => toggleGroup(groupName)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800 text-left hover:bg-slate-750 transition-colors cursor-pointer group/header"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-white group-hover/header:text-sky-400 transition-colors">
                                            {groupName === 'default' ? 'Default Group' : groupName}
                                        </span>
                                        <span className="text-xs bg-slate-700 px-2.5 py-0.5 rounded-full text-slate-300 font-mono">
                                            {groupQuizzes.length} {groupQuizzes.length === 1 ? 'quiz' : 'quizzes'}
                                        </span>
                                    </div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-400' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isExpanded && (
                                    <div className="p-4 space-y-4 bg-slate-900/30 border-t border-slate-700/50">
                                        {groupQuizzes.map(quiz => {
                                            const mastery = calculateQuizMastery(quiz);
                                            return (
                                                <div 
                                                    id={`quiz-card-${quiz.id}`}
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
                                                         id={`quiz-advanced-btn-${quiz.id}`}
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
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};