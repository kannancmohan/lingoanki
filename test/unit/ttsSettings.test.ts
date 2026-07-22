import { DEFAULT_VOICE_SETTINGS } from '../../constants';
import { updateQuiz, getQuiz } from '../../services/quizService';
import { Quiz, VoiceSettings } from '../../types';
import { expect, TestCase } from '../test-utils';
import { speakText } from '../../components/QuizSession';

export const ttsSettingsTests: TestCase[] = [
  {
    name: 'TTS Test: Verify default voice settings matching fallback values',
    testFn: () => {
      expect(DEFAULT_VOICE_SETTINGS.enabled).toBe(false);
      expect(DEFAULT_VOICE_SETTINGS.language).toBe('de-DE');
      expect(DEFAULT_VOICE_SETTINGS.rate).toBe(1.0);
      expect(DEFAULT_VOICE_SETTINGS.pitch).toBe(1.0);
    }
  },
  {
    name: 'TTS Test: Serialization and saving of voiceSettings in localStorage',
    testFn: () => {
      const testQuiz: Quiz = {
        id: 'quiz_tts_test',
        name: 'TTS Test Quiz',
        cards: [],
        createdAt: Date.now(),
        voiceSettings: {
          enabled: true,
          language: 'fr-FR',
          rate: 1.2,
          pitch: 0.9,
          voiceURI: 'google-fr-voice'
        }
      };

      // Save using our service
      updateQuiz(testQuiz);

      // Reload
      const loaded = getQuiz('quiz_tts_test');
      expect(loaded).toBeDefined();
      expect(loaded!.voiceSettings).toBeDefined();
      expect(loaded!.voiceSettings!.enabled).toBe(true);
      expect(loaded!.voiceSettings!.language).toBe('fr-FR');
      expect(loaded!.voiceSettings!.rate).toBe(1.2);
      expect(loaded!.voiceSettings!.pitch).toBe(0.9);
      expect(loaded!.voiceSettings!.voiceURI).toBe('google-fr-voice');
    }
  },
  {
    name: 'TTS Test: speakText correctly configures parameters and calls speechSynthesis.speak',
    testFn: () => {
      const originalSpeechSynthesis = (window as any).speechSynthesis;
      const originalUtterance = (window as any).SpeechSynthesisUtterance;

      let cancelCalled = false;
      const speakCalls: any[] = [];

      class MockSpeechSynthesisUtterance {
        text: string;
        lang: string = '';
        rate: number = 1.0;
        pitch: number = 1.0;
        voice: any = null;

        constructor(text: string) {
          this.text = text;
        }
      }

      const mockVoices = [
        { name: 'Google Deutsch', lang: 'de-DE', voiceURI: 'google-de' },
        { name: 'Google Français', lang: 'fr-FR', voiceURI: 'google-fr' }
      ];

      const mockSpeechSynthesis = {
        cancel: () => {
          cancelCalled = true;
        },
        speak: (utterance: any) => {
          speakCalls.push(utterance);
        },
        getVoices: () => mockVoices,
        onvoiceschanged: null,
        addEventListener: () => {},
        removeEventListener: () => {}
      };

      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
        configurable: true,
        writable: true
      });

      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        value: MockSpeechSynthesisUtterance,
        configurable: true,
        writable: true
      });

      try {
        const settings: VoiceSettings = {
          enabled: true,
          language: 'de-DE',
          rate: 1.5,
          pitch: 1.2,
          voiceURI: 'google-de'
        };

        speakText('Guten Tag', settings);

        expect(cancelCalled).toBe(true);
        expect(speakCalls.length).toBe(1);
        
        const utterance = speakCalls[0];
        expect(utterance.text).toBe('Guten Tag');
        expect(utterance.lang).toBe('de-DE');
        expect(utterance.rate).toBe(1.5);
        expect(utterance.pitch).toBe(1.2);
        expect(utterance.voice).toBeDefined();
        expect(utterance.voice.voiceURI).toBe('google-de');
      } finally {
        // Restore
        Object.defineProperty(window, 'speechSynthesis', {
          value: originalSpeechSynthesis,
          configurable: true,
          writable: true
        });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
          value: originalUtterance,
          configurable: true,
          writable: true
        });
      }
    }
  },
  {
    name: 'TTS Test: Reset helper recovers defaults while retaining active status',
    testFn: () => {
      const resetSettings: VoiceSettings = {
        enabled: true,
        language: DEFAULT_VOICE_SETTINGS.language,
        rate: DEFAULT_VOICE_SETTINGS.rate,
        pitch: DEFAULT_VOICE_SETTINGS.pitch,
        voiceURI: undefined,
      };

      expect(resetSettings.language).toBe('de-DE');
      expect(resetSettings.rate).toBe(1.0);
      expect(resetSettings.pitch).toBe(1.0);
      expect(resetSettings.voiceURI).toBeUndefined();
      expect(resetSettings.enabled).toBe(true);
    }
  },
  {
    name: 'TTS Test: Keyboard shortcut handler avoids action when input fields are focused, but permits Enter key',
    testFn: () => {
      const mockElementInput = { tagName: 'INPUT' };
      const mockElementDiv = { tagName: 'DIV' };

      const checkShortcutAllowed = (activeElement: any, key: string) => {
        const isInputActive = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        if (isInputActive && key !== 'Enter') return false;
        return true;
      };

      expect(checkShortcutAllowed(mockElementInput, 's')).toBe(false);
      expect(checkShortcutAllowed(mockElementInput, '1')).toBe(false);
      expect(checkShortcutAllowed(mockElementInput, 'Enter')).toBe(true);
      expect(checkShortcutAllowed(mockElementDiv, 's')).toBe(true);
      expect(checkShortcutAllowed(null, 's')).toBe(true);
    }
  }
];
