import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Quiz, Card, ReviewRating, SessionStats, QuizDirection } from '../types';
import { selectSessionCards, updateCard } from '../services/srsService';
import { updateQuiz as saveQuiz, calculateQuizMastery } from '../services/quizService';
import { QuizSummary } from './QuizSummary';

type ReviewMode = 'immediate' | 'strict';

interface QuizSessionProps {
  quiz: Quiz;
  sessionSize: number;
  onSessionEnd: () => void;
  order: 'random' | 'sequential';
  quizDirection: QuizDirection;
  reviewMode: ReviewMode;
}

const RatingButton: React.FC<{onClick: () => void, color: string, label: string, shortcut: string}> = ({onClick, color, label, shortcut}) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-2 rounded-lg text-white font-semibold transition-all duration-200 transform hover:scale-105 ${color}`}
    >
        {label} <span className="text-xs opacity-75">({shortcut})</span>
    </button>
);


export const QuizSession: React.FC<QuizSessionProps> = ({ quiz, sessionSize, onSessionEnd, order, quizDirection, reviewMode }) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>(quiz);
  
  // New Queue-based state management
  const [sessionQueue, setSessionQueue] = useState<Card[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [initialDeckSize, setInitialDeckSize] = useState(0);

  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0, total: 0 });

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerLanguage, setAnswerLanguage] = useState('German');

  useEffect(() => {
    const cards = selectSessionCards(quiz, sessionSize, order);
    setSessionQueue(cards);
    setCurrentCard(cards[0] || null);
    setInitialDeckSize(cards.length);

    if (cards.length === 0) {
        setIsFinished(true);
    }
  }, [quiz, sessionSize, order]);

  useEffect(() => {
    if (!currentCard) return;

    let direction = quizDirection;
    if (direction === 'mixed') {
      direction = Math.random() < 0.5 ? 'en-de' : 'de-en';
    }

    if (direction === 'en-de') {
      setCurrentQuestion(currentCard.front);
      setCurrentAnswer(currentCard.back);
      setAnswerLanguage('German');
    } else { // 'de-en'
      setCurrentQuestion(currentCard.back);
      setCurrentAnswer(currentCard.front);
      setAnswerLanguage('English');
    }
  }, [currentCard, quizDirection]);


  const handleCheckAnswer = useCallback(() => {
    if (!currentCard) return;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();
    const correct = normalize(userInput) === normalize(currentAnswer);
    
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + 1,
        total: prev.total + 1,
      }));
    } else {
      setReviewQueue(prev => [...prev, currentCard]);
      setSessionStats(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1,
        total: prev.total + 1,
      }));
    }
  }, [userInput, currentCard, currentAnswer]);

  const moveToNextCard = useCallback(() => {
    setIsAnswered(false);
    setUserInput('');

    const nextQueue = sessionQueue.slice(1);
    setSessionQueue(nextQueue);

    if (nextQueue.length > 0) {
      setCurrentCard(nextQueue[0]);
    } else {
      // Current round is finished, check for review round
      if (reviewMode === 'immediate' && reviewQueue.length > 0) {
        const shuffledReview = reviewQueue.sort(() => 0.5 - Math.random());
        setSessionQueue(shuffledReview);
        setCurrentCard(shuffledReview[0]);
        setReviewQueue([]);
      } else {
        // Session is over (strict mode, or immediate mode with no errors)
        setIsFinished(true);
        setCurrentCard(null);
      }
    }
  }, [sessionQueue, reviewQueue, reviewMode]);


  const handleRateCard = (rating: ReviewRating) => {
    if (!currentCard) return;
    
    const wasCorrect = rating !== ReviewRating.Again;
    
    // Update SRS properties
    const updatedSrsCard = updateCard(currentCard, rating);
    
    // Combine with statistics update
    const finalUpdatedCard = {
        ...updatedSrsCard,
        timesSeen: (currentCard.timesSeen || 0) + 1,
        timesCorrect: (currentCard.timesCorrect || 0) + (wasCorrect ? 1 : 0),
        timesIncorrect: (currentCard.timesIncorrect || 0) + (wasCorrect ? 0 : 1),
    };

    setCurrentQuiz(prevQuiz => {
        const newCards = prevQuiz.cards.map(c => 
            c.id === finalUpdatedCard.id ? finalUpdatedCard : c
        );
        const updatedQuiz = { ...prevQuiz, cards: newCards };
        // Persist the changes to localStorage
        saveQuiz(updatedQuiz);
        return updatedQuiz;
    });

    moveToNextCard();
  };

  const handleRestartSession = () => {
    // Use the most up-to-date quiz data which is in `currentQuiz` state
    const cards = selectSessionCards(currentQuiz, sessionSize, order);

    // Reset all session-specific states
    setSessionQueue(cards);
    setCurrentCard(cards[0] || null);
    setInitialDeckSize(cards.length);
    setReviewQueue([]);
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });

    // Un-finish the session to allow re-render. If there are no cards,
    // the component will show the "All Done" message.
    setIsFinished(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if(isAnswered) {
            if(e.key === '1') handleRateCard(ReviewRating.Again);
            if(e.key === '2') handleRateCard(ReviewRating.Hard);
            if(e.key === '3') handleRateCard(ReviewRating.Good);
            if(e.key === '4') handleRateCard(ReviewRating.Easy);
        } else {
            if(e.key === 'Enter') {
                e.preventDefault();
                handleCheckAnswer();
            }
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, handleCheckAnswer, handleRateCard]);
  
  const mastery = useMemo(() => calculateQuizMastery(currentQuiz), [currentQuiz]);

  if (isFinished) {
    return <QuizSummary stats={sessionStats} onFinish={onSessionEnd} onRestart={handleRestartSession} />;
  }
  if (!currentCard) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
            <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-sky-400">All Done!</h2>
                <p className="text-slate-300 mt-2">There are no new or due cards in this quiz right now. Great job!</p>
                <button onClick={onSessionEnd} className="mt-6 bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-500 transition-colors">Go Back</button>
            </div>
        </div>
    );
  }
  
  const totalQuestionsInSession = initialDeckSize + (reviewMode === 'immediate' ? sessionStats.incorrect : 0);
  const progress = totalQuestionsInSession > 0 ? (sessionStats.total / totalQuestionsInSession) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white font-sans">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
            <div className="flex justify-between items-center">
              <button onClick={onSessionEnd} className="text-slate-400 hover:text-white transition-colors">&larr; Back to Quizzes</button>
              <div className="text-sm text-slate-300">
                Quiz Mastery: <span className="font-bold text-sky-400">{mastery}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
        <div className={`bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-300 border ${!isAnswered ? 'border-slate-700' : isCorrect ? 'border-green-500' : 'border-red-500'}`}>
          <div className="text-center">
            <p className="text-lg text-slate-400">Translate this word:</p>
            <h2 className="text-5xl font-bold my-8 text-white">{currentQuestion}</h2>
          </div>

          {!isAnswered ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Type the ${answerLanguage} word...`}
                autoFocus
                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg"
              />
              <button onClick={handleCheckAnswer} className="bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-sky-500 transition-colors">Check</button>
            </div>
          ) : (
            <div>
              <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                <p className="text-xl text-white mt-1">{currentAnswer}</p>
                 {!isCorrect && <p className="text-sm text-slate-400">Your answer: {userInput}</p>}
              </div>

              <div className="flex gap-2 sm:gap-4 text-sm sm:text-base">
                <RatingButton onClick={() => handleRateCard(ReviewRating.Again)} color="bg-red-600 hover:bg-red-500" label="Again" shortcut="1" />
                <RatingButton onClick={() => handleRateCard(ReviewRating.Hard)} color="bg-orange-500 hover:bg-orange-400" label="Hard" shortcut="2" />
                <RatingButton onClick={() => handleRateCard(ReviewRating.Good)} color="bg-sky-600 hover:bg-sky-500" label="Good" shortcut="3" />
                <RatingButton onClick={() => handleRateCard(ReviewRating.Easy)} color="bg-green-600 hover:bg-green-500" label="Easy" shortcut="4" />
              </div>
            </div>
          )}
        </div>
        <div className="text-center text-slate-500 text-sm mt-4">
            <p>Cards left: {sessionQueue.length} {reviewQueue.length > 0 && `(+${reviewQueue.length} for review)`}</p>
        </div>
      </div>
    </div>
  );
};