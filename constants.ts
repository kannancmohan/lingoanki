import { VoiceSettings } from './types';

export const PRIORITY_WEIGHTS = {
  [ 'High' as const]: 0.4,
  [ 'Medium' as const]: 0.2,
  [ 'Low' as const]: 0.05,
  [ 'Unset' as const]: 0.35,
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  language: 'de-DE', // Standard default language for German/English studies
  rate: 1.0,
  pitch: 1.0,
};
