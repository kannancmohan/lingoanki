import { VoiceSettings } from './types';

export const DEFAULT_ITEMS_PER_SESSION = 30;
export const MIN_ITEMS_PER_SESSION = 1;
export const FALLBACK_ITEMS_PER_SESSION = 10;
export const DEFAULT_REPEAT_INCORRECT_CARDS = true;

export const PRIORITY_WEIGHTS = {
  [ 'High' as const]: 0.5,
  [ 'Medium' as const]: 0.15,
  [ 'Low' as const]: 0.01,
  [ 'Unset' as const]: 0.34,
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  language: 'de-DE', // Standard default language for German/English studies
  rate: 0.7,
  pitch: 1.0,
};

