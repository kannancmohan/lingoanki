export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Unset = 'Unset',
}

// FIX: Add ReviewRating enum for srsPreview.ts
export enum ReviewRating {
  Again,
  Hard,
  Good,
  Easy,
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
  // FIX: Add optional properties for srsPreview.ts to avoid breaking existing logic.
  repetitions?: number;
  easeFactor?: number;
  interval?: number;
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