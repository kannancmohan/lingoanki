export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Unset = 'Unset',
}

export interface Card {
  id: string;
  quizId: string;
  front: string; // e.g., English
  back: string;  // e.g., German
  priority: Priority;
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
}

export interface Quiz {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
  priorityWeights?: Record<Priority, number>;
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