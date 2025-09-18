import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, ImportWarning, Priority } from './types';
import { getQuizzes, deleteQuiz as deleteQuizService, resetPriorities as resetPrioritiesService, updateQuiz as updateQuizService } from './services/quizService';
import { QuizList } from './components/QuizList';
import { CreateQuizModal } from './components/CreateQuizModal';
import { QuizSession } from './components/QuizSession';
import { HelpPage } from './components/HelpPage';
import { AdvancedQuizModal } from './components/AdvancedQuizModal';
import { BrainIcon, QuestionMarkCircleIcon } from './components/icons';
import { EditQuizPage } from './components/EditQuizPage';
import { ImportWarningModal } from './components/ImportWarningModal';
import { CardStatsPage } from './components/CardStatsPage';
// FIX: Import default ease factor for optimistic state update
import { DEFAULT_EASE_FACTOR } from './constants';

type View = 'list' | 'session' | 'create' | 'help' | 'edit' | 'stats';
type ReviewMode = 'immediate' | 'strict';

const App: React.FC = () => {
    const [view, setView] = useState<View>('list');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
    const [quizForAdvancedSettings, setQuizForAdvancedSettings] = useState<Quiz | null>(null);
    const [importWarnings, setImportWarnings] = useState<ImportWarning[] | null>(null);

    const [sessionSize, setSessionSize] = useState(25);
    const [reviewMode, setReviewMode] = useState<ReviewMode>('immediate');

    const refreshData = useCallback(() => {
        setQuizzes(getQuizzes());
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleStartQuiz = (quizId: string) => {
        const quizToStart = quizzes.find(q => q.id === quizId);
        if (quizToStart) {
            setActiveQuiz(quizToStart);
            setView('session');
        }
    };
    
    const handleEndSession = () => {
        setView('list');
        setActiveQuiz(null);
        refreshData();
    };

    const handleQuizCreated = (warnings: ImportWarning[]) => {
        setView('list');
        refreshData();
        if (warnings.length > 0) {
            setImportWarnings(warnings);
        }
    };
    
    const handleDeleteQuiz = (quizId: string) => {
        deleteQuizService(quizId);
        setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
        setQuizForAdvancedSettings(null); // Close modal after deletion
    };
    
    const handleResetPriorities = (quizId: string) => {
        resetPrioritiesService(quizId);
        setQuizzes(prevQuizzes =>
          prevQuizzes.map(quiz => {
            if (quiz.id === quizId) {
              return {
                ...quiz,
                cards: quiz.cards.map(card => ({
                  ...card,
                  priority: Priority.Unset,
                  timesSeen: 0,
                  timesCorrect: 0,
                  timesIncorrect: 0,
                  // FIX: Also reset new SRS properties for optimistic UI update
                  repetitions: 0,
                  interval: 0,
                  easeFactor: DEFAULT_EASE_FACTOR,
                })),
              };
            }
            return quiz;
          })
        );
        setQuizForAdvancedSettings(null);
    };

    const handleOpenAdvancedSettings = (quizId: string) => {
        const quizToOpen = quizzes.find(q => q.id === quizId) || null;
        setQuizForAdvancedSettings(quizToOpen);
    };

    const handleEditQuiz = (quizId: string) => {
        const quizToEdit = quizzes.find(q => q.id === quizId);
        if (quizToEdit) {
            setActiveQuiz(quizToEdit);
            setView('edit');
            setQuizForAdvancedSettings(null); // Close the modal
        }
    };
    
    const handleShowStats = (quizId: string) => {
        const quizToShow = quizzes.find(q => q.id === quizId);
        if (quizToShow) {
            setActiveQuiz(quizToShow);
            setView('stats');
            setQuizForAdvancedSettings(null); // Close the modal
        }
    };

    const handleSaveQuizChanges = (updatedQuiz: Quiz) => {
        updateQuizService(updatedQuiz);
        refreshData();
        setView('list');
        setActiveQuiz(null);
    };
    
    const ToggleSwitch: React.FC<{
        label: string;
        enabled: boolean;
        onChange: (enabled: boolean) => void;
    }> = ({ label, enabled, onChange }) => (
        <label htmlFor={label.replace(/\s+/g, '-')} className="flex items-center cursor-pointer">
            <span className="mr-3 text-sm font-medium text-slate-300 whitespace-nowrap">{label}:</span>
            <div className="relative">
                <input id={label.replace(/\s+/g, '-')} type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-sky-500' : 'bg-slate-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-4' : ''}`}></div>
            </div>
        </label>
    );

    const renderListView = () => (
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-5">Quiz Session Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                 <div className="flex items-center gap-2">
                    <label htmlFor="session-items" className="text-sm font-medium text-slate-300">Items per session:</label>
                    <input
                        id="session-items"
                        type="number"
                        min="1"
                        value={sessionSize}
                        onChange={(e) => setSessionSize(Number(e.target.value))}
                        onBlur={(e) => {
                            if (!e.target.value || Number(e.target.value) < 1) {
                                setSessionSize(10);
                            }
                        }}
                        className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                 <div className="flex items-center gap-2">
                    <ToggleSwitch 
                        label="Repeat incorrect cards"
                        enabled={reviewMode === 'immediate'}
                        onChange={(enabled) => setReviewMode(enabled ? 'immediate' : 'strict')}
                    />
                 </div>
            </div>
        </div>
        <QuizList quizzes={quizzes} onStartQuiz={handleStartQuiz} onCreateQuiz={() => setView('create')} onOpenAdvancedSettings={handleOpenAdvancedSettings}/>
      </div>
    );

    const renderView = () => {
        switch (view) {
            case 'session':
                if (activeQuiz) {
                    return <QuizSession 
                                quiz={activeQuiz} 
                                sessionSize={sessionSize} 
                                onSessionEnd={handleEndSession} 
                                reviewMode={reviewMode}
                            />;
                }
                return null;
            case 'edit':
                 if (activeQuiz) {
                    return <EditQuizPage
                        quiz={activeQuiz}
                        onSave={handleSaveQuizChanges}
                        onCancel={handleEndSession}
                    />;
                }
                return null;
            case 'stats':
                if (activeQuiz) {
                    return <CardStatsPage
                        quiz={activeQuiz}
                        onBack={handleEndSession}
                    />;
                }
                return null;
            case 'create':
                return (
                    <>
                        {renderListView()}
                        <CreateQuizModal onClose={() => setView('list')} onQuizCreated={handleQuizCreated} />
                    </>
                );
            case 'help':
                return <HelpPage onBack={() => setView('list')} />;
            case 'list':
            default:
                return renderListView();
        }
    };

    return (
        <div className="bg-slate-900 min-h-screen font-sans">
            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <BrainIcon className="w-8 h-8 text-sky-400"/>
                            <h1 className="text-xl font-bold text-white">LingoPriority</h1>
                        </div>
                        <button 
                            onClick={() => setView('help')} 
                            className="text-slate-400 hover:text-sky-400 transition-colors"
                            title="How to use"
                            aria-label="How to use the application"
                        >
                            <QuestionMarkCircleIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
            </header>
            <main>
                {renderView()}
                {quizForAdvancedSettings && (
                    <AdvancedQuizModal
                        quiz={quizForAdvancedSettings}
                        onClose={() => setQuizForAdvancedSettings(null)}
                        onDeleteQuiz={handleDeleteQuiz}
                        onResetMastery={handleResetPriorities}
                        onEditQuiz={handleEditQuiz}
                        onShowStats={handleShowStats}
                    />
                )}
                {importWarnings && (
                    <ImportWarningModal
                        warnings={importWarnings}
                        onClose={() => setImportWarnings(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default App;