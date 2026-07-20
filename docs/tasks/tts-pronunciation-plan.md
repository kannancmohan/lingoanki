# Plan: Text-to-Speech (TTS) Pronunciation for Quiz Answers

This document outlines the detailed strategy to implement a Text-to-Speech (TTS) pronunciation feature in the flashcard applet. When the user submits an answer, they can hear the correct pronunciation of the target translation (the back of the card) by clicking a speaker icon, provided audio pronunciation is enabled for that quiz.

---

## 1. Core Requirements

1.  **Quiz-Level Configuration**:
    *   TTS settings must be configured per-quiz.
    *   Settings are located under the "Edit Quiz" page inside the "Advanced Settings" card, positioned right after the "Custom Priority Weights" section.
    *   **New Quiz Defaults (Disabled)**: When a new quiz is created, TTS must be disabled by default (i.e. `enabled` is set to `false`), and no speaker icon will be shown in the session. Only after a user opens "Edit Quiz" and toggles on "Enable audio pronunciation" will the speaker icon become visible in the session.
    *   No UI configuration is needed when *creating* a new quiz (it should fall back to this disabled standard default).

2.  **Voice & Pronunciation Settings Section**:
    *   A clean toggle switch (or custom styled checkbox/button) named **"Enable audio pronunciation"**.
    *   When disabled, all other pronunciation parameters are hidden.
    *   When enabled, the following configuration fields appear:
        *   **Language Dropdown**: A list of standard common study languages (e.g., German, Spanish, French, Italian, English, Japanese, etc.).
        *   **Voice Selector**: A dynamically populated select element listing available synthesizer voices registered in the browser for the selected language.
        *   **Speech Rate (Speed)**: A slider ranging from `0.5` (slow) to `2.0` (fast), defaulting to `1.0`.
        *   **Speech Pitch (Tone)**: A slider ranging from `0.5` (low pitch) to `2.0` (high pitch), defaulting to `1.0`.

3.  **Dynamic Web Speech API Integration**:
    *   Use the native, widely supported client-side **Web Speech API (`window.speechSynthesis`)**. It is completely free, runs offline, requires no API keys, and integrates seamlessly with all modern browsers.
    *   Because available voices are populated asynchronously by the browser, the application must subscribe to the `speechSynthesis.onvoiceschanged` event to fetch and filter eligible voices.

4.  **Quiz Session Speaker Icon**:
    *   Only show the speaker icon if **"Enable audio pronunciation"** is active in the quiz's `voiceSettings`.
    *   The speaker icon appears next to the correct answer on the feedback panel *after* the user submits their answer.
    *   Clicking the speaker icon triggers the TTS voice to pronounce the back of the card (the target translation, e.g., German words).
    *   Ensure any active utterance is canceled before speaking a new one to prevent overlaying sounds.

---

## 2. Recommended Technology: Web Speech API (`SpeechSynthesis`)

*   **API**: Standard built-in HTML5 browser feature (`window.speechSynthesis` and `SpeechSynthesisUtterance`).
*   **Benefits**:
    *   Zero dependencies, keeping `/package.json` clean.
    *   Full offline support.
    *   Offers detailed voice listings (often including Siri/Google voices depending on OS) which can be selected dynamically.
*   **Browser Gotcha (Important)**:
    *   `window.speechSynthesis.getVoices()` is asynchronous on many web browsers (like Chrome/Vite dev environments). A robust hook or listener on `speechSynthesis.onvoiceschanged` is mandatory to populate the voices dropdown correctly.

---

## 3. Architecture & Data Structures

### A. Type Definitions (`/types.ts`)
Add a new interface for voice configuration and update the `Quiz` interface to support optional `voiceSettings`:

```typescript
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
```

### B. Standard Fallback Configuration
When a quiz lacks custom `voiceSettings` (e.g., when it was newly created), we use a safe default:
```typescript
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  language: 'de-DE', // Standard default language for German/English studies
  rate: 1.0,
  pitch: 1.0,
};
```

---

## 4. UI Design & Component Integration

### A. Edit Quiz Page (`/components/EditQuizPage.tsx`)
Place the setting in a card styled exactly like the Custom Priority Weights section, right below it.

```tsx
{/* Voice & Pronunciation Section */}
<div className="mb-8 p-6 bg-slate-700/50 rounded-lg border border-slate-600">
    <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-xl font-semibold text-white">Voice & Pronunciation</h2>
            <p className="text-sm text-slate-400">Configure text-to-speech settings to hear correct pronunciations during your session.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                checked={voiceSettings.enabled} 
                onChange={(e) => handleToggleVoice(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
    </div>

    {voiceSettings.enabled && (
        <div className="space-y-4 pt-4 border-t border-slate-600/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Language Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Target Language</label>
                    <select
                        value={voiceSettings.language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                        <option value="de-DE">German (de-DE)</option>
                        <option value="en-US">English (en-US)</option>
                        <option value="es-ES">Spanish (es-ES)</option>
                        <option value="fr-FR">French (fr-FR)</option>
                        <option value="it-IT">Italian (it-IT)</option>
                        <option value="ja-JP">Japanese (ja-JP)</option>
                    </select>
                </div>

                {/* Voice Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Speaker Voice</label>
                    <select
                        value={voiceSettings.voiceURI || ''}
                        onChange={(e) => handleVoiceChange(e.target.value)}
                        className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                        {filteredVoices.map(v => (
                            <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                        ))}
                        {filteredVoices.length === 0 && <option value="">No voices available for language</option>}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Rate Slider */}
                <div>
                    <div className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                        <span>Speech Rate (Speed)</span>
                        <span className="text-sky-400">{voiceSettings.rate.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1" 
                        value={voiceSettings.rate}
                        onChange={(e) => handleVoiceSettingsSlider('rate', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>

                {/* Pitch Slider */}
                <div>
                    <div className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                        <span>Speech Pitch (Tone)</span>
                        <span className="text-sky-400">{voiceSettings.pitch.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1" 
                        value={voiceSettings.pitch}
                        onChange={(e) => handleVoiceSettingsSlider('pitch', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>
            </div>
        </div>
    )}
</div>
```

*Note:* Inside `handleSave` in `EditQuizPage.tsx`, save the updated `voiceSettings` in the `updatedQuiz` object that is passed to `onSave(updatedQuiz)`.

### B. Add Speaker Icon Component (`/components/icons.tsx`)
Create a simple speaker vector icon to display next to the answers:

```tsx
export const SpeakerIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75l-3.75-3.75H5.25a.75.75 0 01-.75-.75V9.75a.75.75 0 01.75-.75h3l3.75-3.75v14.25z" />
  </svg>
);
```

### C. Integrating inside Quiz Session (`/components/QuizSession.tsx`)
Render the icon inside the feedback card. Here is the suggested visual placement:

```tsx
<div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
  <p className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</p>
  <div className="flex items-center gap-3 mt-1">
    <p className="text-xl text-white font-medium">{currentCard.back}</p>
    {quiz.voiceSettings?.enabled && (
      <button 
        onClick={() => handleSpeak(currentCard.back)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
        title="Hear pronunciation"
        aria-label="Speak translation"
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
```

---

## 5. Implement the Voice/Speech Synthesizer Logic

Implement a robust utility function or helper directly in `QuizSession.tsx` or a custom hooks file to pronounce the text:

```typescript
const speakText = (text: string, settings: VoiceSettings) => {
  if (!('speechSynthesis' in window)) return;

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
```

---

## 6. Testing Strategy

1.  **Create `/test/unit/ttsSettings.test.ts`**:
    *   Test standard fallback values when a quiz has undefined `voiceSettings`.
    *   Test serialization and saving of `voiceSettings` on saving a quiz.
    *   Mock the global browser `speechSynthesis` API structure to verify that the `speakText` function is correctly configuring the `SpeechSynthesisUtterance` parameters (e.g. rate, pitch, lang) and calling `speak()`.

2.  **Add TTS Tests to `/test/test-runner.tsx`**:
    *   Import the new unit tests and append them to the `allTestCases` list.
    *   Run `npm run lint` and `npm run build` to verify standard type checks and compile steps.

---

## 7. Step-by-Step Implementation Task Checklist

1.  **Types & Constants**:
    *   Update `/types.ts` with the new interfaces: `VoiceSettings` and `Quiz` update.
2.  **Update Icons**:
    *   Add `SpeakerIcon` in `/components/icons.tsx`.
3.  **Create / Integrate Speech Helper**:
    *   Add the `speakText` function to `/components/QuizSession.tsx`.
4.  **Edit Quiz Page Form Fields**:
    *   Integrate the "Voice & Pronunciation" section in `/components/EditQuizPage.tsx` after the Custom Priority Weights section.
    *   Utilize standard React `useEffect` with `window.speechSynthesis` and `onvoiceschanged` listeners to fetch dynamic browser voice inputs.
    *   Make sure `handleSave` saves the custom settings into the quiz.
5.  **Quiz Session Display**:
    *   Update `/components/QuizSession.tsx` to render the interactive `SpeakerIcon` next to the correct answer if settings are enabled.
6.  **Add and Register Unit Tests**:
    *   Write `/test/unit/ttsSettings.test.ts` and register it inside `/test/test-runner.tsx`.
7.  **Compilation & Execution Checks**:
    *   Validate the changes via standard linter and builders.
