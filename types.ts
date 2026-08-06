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

export interface VoiceSettings {
  enabled: boolean;
  language: string;    // e.g., 'de-DE', 'en-US', 'es-ES', 'fr-FR'
  voiceURI?: string;   // Stores the specific SpeechSynthesisVoice.voiceURI
  rate: number;        // Speech speed (0.5 to 2.0)
  pitch: number;       // Tone pitch (0.5 to 2.0)
}

export interface Quiz {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
  priorityWeights?: Record<Priority, number>;
  group?: string;
  voiceSettings?: VoiceSettings; // New optional setting
}

export interface SessionStats {
  correct: number;
  incorrect: number;
  total: number;
  timeTaken?: number; // In seconds
}

export interface ImportWarning {
  line: number;
  content: string;
  reason: string;
}