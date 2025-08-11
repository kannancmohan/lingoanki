export type QuizDirection = 'en-de' | 'de-en' | 'mixed';

export interface Card {
  id: string;
  quizId: string;
  front: string; // e.g., English
  back: string;  // e.g., German
  dueDate: number; // timestamp
  interval: number; // in minutes
  easeFactor: number;
  repetitions: number;
  isNew: boolean;
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
}

export interface Quiz {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

export enum ReviewRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface SessionStats {
  correct: number;
  incorrect: number;
  total: number;
}

export interface ImportWarning {
  line: number;
  content: string;
  reason: string;
}