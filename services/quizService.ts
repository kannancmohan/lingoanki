import { Quiz, Card, ImportWarning, Priority } from '../types';

const QUIZZES_KEY = 'lingoAnkiQuizzes';

export interface CreateQuizResult {
    newQuiz: Quiz;
    warnings: ImportWarning[];
}

export const getQuizzes = (): Quiz[] => {
  try {
    const quizzesJson = localStorage.getItem(QUIZZES_KEY);
    return quizzesJson ? JSON.parse(quizzesJson) : [];
  } catch (error) {
    console.error("Failed to parse quizzes from localStorage", error);
    return [];
  }
};

export const getQuiz = (quizId: string): Quiz | undefined => {
  const quizzes = getQuizzes();
  return quizzes.find(q => q.id === quizId);
};

export const createQuiz = (name: string, csvData: string): CreateQuizResult => {
    const quizzes = getQuizzes();
    const normalizedNewName = name.trim().toLowerCase();

    if (quizzes.some(quiz => quiz.name.trim().toLowerCase() === normalizedNewName)) {
        throw new Error(`A quiz with the name "${name.trim()}" already exists. Please choose a different name.`);
    }

    const quizId = `quiz_${Date.now()}`;

    let content = csvData;
    if (content.startsWith('﻿')) {
        content = content.substring(1);
    }

    const warnings: ImportWarning[] = [];
    const createdCards: Card[] = [];
    const lines = content.split(/\r?\n/);
    const seenFronts = new Set<string>();

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            return; // Silently ignore empty lines
        }

        const cleanField = (field: string | undefined): string => {
            if (!field) return '';
            let cleaned = field.trim();
            if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                cleaned = cleaned.substring(1, cleaned.length - 1);
            }
            return cleaned.replace(/\s+/g, ' ').trim();
        };

        if (!trimmedLine.includes(',')) {
            warnings.push({ line: lineNumber, content: trimmedLine, reason: 'Line does not contain a comma separator.' });
            return;
        }

        const parts = trimmedLine.split(',');
        const front = cleanField(parts[0]);
        const back = cleanField(parts.slice(1).join(','));

        if (!front || !back) {
            warnings.push({ line: lineNumber, content: trimmedLine, reason: 'One or more fields are empty.' });
            return;
        }

        const normalizedFront = front.trim().toLowerCase();
        if (seenFronts.has(normalizedFront)) {
            warnings.push({ line: lineNumber, content: trimmedLine, reason: `Duplicate entry for "${front}".` });
            return;
        }
        
        seenFronts.add(normalizedFront);

        createdCards.push({
            id: `card_${quizId}_${index}`,
            quizId,
            front,
            back,
            priority: Priority.Unset,
            timesSeen: 0,
            timesCorrect: 0,
            timesIncorrect: 0,
        });
    });
    
    if (createdCards.length === 0) {
        throw new Error("CSV file is empty or contains no valid lines. Please ensure it has 'word,translation' format per line.");
    }

    const newQuiz: Quiz = {
        id: quizId,
        name: name.trim(),
        cards: createdCards,
        createdAt: Date.now(),
    };

    const updatedQuizzes = [...quizzes, newQuiz];
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updatedQuizzes));

    return { newQuiz, warnings };
};

export const updateQuiz = (updatedQuiz: Quiz): void => {
  const quizzes = getQuizzes();
  const index = quizzes.findIndex(q => q.id === updatedQuiz.id);
  if (index !== -1) {
    quizzes[index] = updatedQuiz;
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  }
};

export const deleteQuiz = (quizId: string): void => {
    const quizzes = getQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updatedQuizzes));
};

export const calculateQuizMastery = (quiz: Quiz): number => {
    if (!quiz.cards || quiz.cards.length === 0) {
      return 0;
    }
    
    const totalPoints = quiz.cards.reduce((acc, card) => {
        switch (card.priority) {
            case Priority.Low: return acc + 100;
            case Priority.Medium: return acc + 50;
            case Priority.High: return acc + 25;
            case Priority.Unset:
            default:
                return acc + 0;
        }
    }, 0);

    const mastery = totalPoints / quiz.cards.length;

    return Math.round(mastery);
};

export const resetPriorities = (quizId: string): void => {
    const quiz = getQuiz(quizId);
    if (!quiz) return;

    const resetCards = quiz.cards.map(card => ({
        ...card,
        priority: Priority.Unset,
        timesSeen: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
    }));

    const updatedQuiz = { ...quiz, cards: resetCards };
    updateQuiz(updatedQuiz);
};

export const createNewCard = (quizId: string): Card => {
    return {
        id: `card_${quizId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        quizId,
        front: '',
        back: '',
        priority: Priority.Unset,
        timesSeen: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
    };
};