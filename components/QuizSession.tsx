import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Quiz, Card, Priority, SessionStats, VoiceSettings } from '../types';
import { selectSessionCards, updateCard, formatTime } from '../services/sessionService';
import { updateQuiz as saveQuiz, calculateQuizMastery } from '../services/quizService';
import { QuizSummary } from './QuizSummary';
import { isAnswerCorrect, AnswerDiffViewer } from './AnswerDiffViewer';
import { SpeakerIcon, ClockIcon } from './icons';

type ReviewMode = 'immediate' | 'strict';

interface QuizSessionProps {
  quiz: Quiz;
  sessionSize: number;
  onSessionEnd: () => void;
  reviewMode: ReviewMode;
  showTimer?: boolean;
}

export const speakText = (text: string, settings: VoiceSettings) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // 1. Cancel any active pronunciations
  window.speechSynthesis.cancel();

  // 2. Prepare utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = settings.language;
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;

  // 3. Match selected VoiceURI if exists
  if (settings.voiceURI) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === settings.voiceURI);
    if (voice) utterance.voice = voice;
  }

  // 4. Pronounce!
  window.speechSynthesis.speak(utterance);
};

const RatingButton: React.FC<{
  onClick: () => void, 
  color: string, 
  label: string, 
  shortcut: string,
}> = ({onClick, color, label, shortcut}) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 px-2 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-105 flex flex-col justify-center items-center ${color}`}
        style={{minHeight: '70px'}}
    >
        <span>{label} <span className="text-xs opacity-75">({shortcut})</span></span>
    </button>
);


export const QuizSession: React.FC<QuizSessionProps> = ({ quiz, sessionSize, onSessionEnd, reviewMode, showTimer = true }) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(quiz);
  
  const [sessionQueue, setSessionQueue] = useState<Card[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [initialDeckSize, setInitialDeckSize] = useState(0);
  const [correctlyAnsweredCardIds, setCorrectlyAnsweredCardIds] = useState(new Set<string>());

  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0, total: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  useEffect(() => {
    const cards = selectSessionCards(quiz, sessionSize);
    setSessionQueue(cards);
    setCurrentCard(cards[0] || null);
    setInitialDeckSize(cards.length);

    if (cards.length === 0) {
        setIsFinished(true);
    }
  }, [quiz, sessionSize]);


  const handleCheckAnswer = useCallback(() => {
    if (!currentCard) return;

    const correct = isAnswerCorrect(currentCard.back, userInput);
    
    setIsCorrect(correct);
    setIsAnswered(true);
  }, [userInput, currentCard]);

  const handleRateCard = useCallback((priority: Priority) => {
    if (!currentCard) return;

    // --- Part 1: Determine effective priority and update stats ---
    const wasAnswerCorrect = isCorrect;
    const effectivePriority = wasAnswerCorrect ? priority : Priority.High;

    // Update progress tracking for unique correct cards. This drives the progress bar.
    if (wasAnswerCorrect && !correctlyAnsweredCardIds.has(currentCard.id)) {
        setCorrectlyAnsweredCardIds(prev => new Set(prev).add(currentCard.id));
    }

    // Update session summary stats (counts every attempt for the summary screen).
    setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + (wasAnswerCorrect ? 1 : 0),
        incorrect: prev.incorrect + (wasAnswerCorrect ? 0 : 1),
        total: prev.total + 1,
    }));
    
    // --- Part 2: Update card priority and persist ---
    const updatedPriorityCard = updateCard(currentCard, effectivePriority);
    const finalUpdatedCard: Card = {
        ...updatedPriorityCard,
        timesSeen: (currentCard.timesSeen || 0) + 1,
        timesCorrect: (currentCard.timesCorrect || 0) + (wasAnswerCorrect ? 1 : 0),
        timesIncorrect: (currentCard.timesIncorrect || 0) + (wasAnswerCorrect ? 0 : 1),
    };

    setCurrentQuiz(prevQuiz => {
        const newCards = prevQuiz.cards.map(c =>
            c.id === finalUpdatedCard.id ? finalUpdatedCard : c
        );
        const updatedQuiz = { ...prevQuiz, cards: newCards };
        saveQuiz(updatedQuiz);
        return updatedQuiz;
    });

    // --- Part 3: Calculate next state and move to next card ---
    const remainingSessionQueue = sessionQueue.slice(1);
    
    let updatedReviewQueue = reviewQueue;
    // If the typed answer was wrong, it must be reviewed.
    if (!wasAnswerCorrect && reviewMode === 'immediate') {
        updatedReviewQueue = [...reviewQueue, finalUpdatedCard];
    }
    
    // Decide what comes next
    if (remainingSessionQueue.length > 0) {
        setCurrentCard(remainingSessionQueue[0]);
        setSessionQueue(remainingSessionQueue);
        setReviewQueue(updatedReviewQueue);
    } else if (updatedReviewQueue.length > 0) {
        const shuffledReview = [...updatedReviewQueue].sort(() => 0.5 - Math.random());
        setCurrentCard(shuffledReview[0]);
        setSessionQueue(shuffledReview);
        setReviewQueue([]);
    } else {
        setIsFinished(true);
        setCurrentCard(null);
    }

    // --- Part 4: Reset UI for next card ---
    setIsAnswered(false);
    setUserInput('');
    setIsCorrect(false);

  }, [currentCard, isCorrect, sessionQueue, reviewQueue, reviewMode, correctlyAnsweredCardIds]);


  const handleRestartSession = () => {
    // Use the most up-to-date quiz data which is in `currentQuiz` state
    const cards = selectSessionCards(currentQuiz, sessionSize);

    // Reset all session-specific states
    setSessionQueue(cards);
    setCurrentCard(cards[0] || null);
    setInitialDeckSize(cards.length);
    setReviewQueue([]);
    setCorrectlyAnsweredCardIds(new Set());
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    setElapsedSeconds(0);

    // Un-finish the session to allow re-render.
    setIsFinished(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if (isFinished) return;

        const isInputActive = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
        if (isInputActive && e.key !== 'Enter') return;

        if(isAnswered) {
            if(e.key === '1') {
                e.preventDefault();
                handleRateCard(Priority.High);
            }
            if(e.key === '2') {
                e.preventDefault();
                handleRateCard(Priority.Medium);
            }
            if(e.key === '3') {
                e.preventDefault();
                handleRateCard(Priority.Low);
            }
            if(e.key === 's' || e.key === 'S') {
                e.preventDefault();
                if (currentQuiz.voiceSettings?.enabled && currentCard) {
                    speakText(currentCard.back, currentQuiz.voiceSettings);
                }
            }
        } else {
            if(e.key === 'Enter') {
                e.preventDefault();
                handleCheckAnswer();
            }
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, handleCheckAnswer, handleRateCard, currentQuiz, currentCard, isFinished]);
  
  const mastery = useMemo(() => calculateQuizMastery(currentQuiz), [currentQuiz]);

  if (currentQuiz.cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
          <h2 className="text-2xl font-bold text-sky-400">No Cards in Quiz</h2>
          <p className="text-slate-300 mt-2">This quiz does not have any flashcards yet. Add cards manually in Edit Quiz or import a CSV file to get started.</p>
          <button onClick={onSessionEnd} className="mt-6 bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-500 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return <QuizSummary stats={{ ...sessionStats, timeTaken: elapsedSeconds }} showTimer={showTimer} onFinish={onSessionEnd} onRestart={handleRestartSession} />;
  }
  if (!currentCard) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
            <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-sky-400">All Done!</h2>
                <p className="text-slate-300 mt-2">There are no more cards in this session. Great job!</p>
                <button onClick={onSessionEnd} className="mt-6 bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-500 transition-colors">Go Back</button>
            </div>
        </div>
    );
  }
  
  const progress = initialDeckSize > 0 ? (correctlyAnsweredCardIds.size / initialDeckSize) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
            <div className="flex justify-between items-center">
              <button onClick={onSessionEnd} className="text-slate-400 hover:text-white transition-colors">&larr; Back to Quizzes</button>
              <div className="flex items-center gap-4">
                {showTimer && (
                  <div className="flex items-center gap-1.5 text-sm font-mono bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-sky-300 shadow-sm" title="Elapsed time">
                    <ClockIcon className="w-4 h-4 text-sky-400" />
                    <span>{formatTime(elapsedSeconds)}</span>
                  </div>
                )}
                <div className="text-sm text-slate-300">
                  Quiz Mastery: <span className="font-bold text-sky-400">{mastery}%</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress > 100 ? 100 : progress}%` }}></div>
            </div>
        </div>
        <div className={`bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-300 border ${!isAnswered ? 'border-slate-700' : isCorrect ? 'border-green-500' : 'border-red-500'}`}>
          <div className="text-center">
            <h2 className="text-5xl font-bold my-8 text-white">{currentCard.front}</h2>
          </div>

          {currentQuiz.tips && (
            <div className="mb-6 bg-sky-950/40 border border-sky-800/60 rounded-lg p-3 text-sm text-sky-200 flex items-start gap-2">
              <span className="font-semibold shrink-0">Tip:</span>
              <span>{currentQuiz.tips}</span>
            </div>
          )}

          {!isAnswered ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Type the answer...`}
                autoFocus
                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg"
              />
              <button onClick={handleCheckAnswer} className="bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-500 transition-colors">Check</button>
            </div>
          ) : (
            <div>
              <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xl text-white font-medium">{currentCard.back}</p>
                  {currentQuiz.voiceSettings?.enabled && (
                    <button 
                      id="speak-button"
                      onClick={() => speakText(currentCard.back, currentQuiz.voiceSettings!)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
                      title="Hear pronunciation (Press 'S')"
                      aria-label="Speak translation (Press 'S')"
                    >
                      <SpeakerIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
                {!isCorrect && (
                  <>
                    <p className="text-sm text-slate-400 mt-2">Your answer: {userInput || <span className="italic text-slate-500">Empty</span>}</p>
                    <AnswerDiffViewer correct={currentCard.back} user={userInput} />
                  </>
                )}
              </div>

              <p className="text-center text-slate-400 mb-3 text-sm">How difficult was this card?</p>
              <div className="flex gap-2 sm:gap-4 text-sm sm:text-base">
                <RatingButton onClick={() => handleRateCard(Priority.High)} color="bg-red-600 hover:bg-red-500" label="Hard" shortcut="1" />
                <RatingButton onClick={() => handleRateCard(Priority.Medium)} color="bg-orange-500 hover:bg-orange-400" label="Medium" shortcut="2" />
                <RatingButton onClick={() => handleRateCard(Priority.Low)} color="bg-sky-600 hover:bg-sky-500" label="Easy" shortcut="3" />
              </div>
            </div>
          )}
        </div>
        <div className="text-center text-slate-500 text-sm mt-4">
            <p>Cards left in round: {sessionQueue.length -1} {reviewQueue.length > 0 && `(+${reviewQueue.length} for review)`}</p>
        </div>
      </div>
    </div>
  );
};