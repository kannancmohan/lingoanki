import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Quiz, Card, ImportWarning, Priority, VoiceSettings } from '../types';
import { createNewCard } from '../services/quizService';
import { GroupSelector } from './GroupSelector';
import { TrashIcon, PlusIcon, UploadIcon, SpeakerIcon, ChevronDownIcon } from './icons';
import { ErrorModal } from './ErrorModal';
import { ImportResultModal } from './ImportResultModal';
import { PRIORITY_WEIGHTS, DEFAULT_VOICE_SETTINGS } from '../constants';
import { speakText } from './QuizSession';

interface EditQuizPageProps {
  quiz: Quiz;
  onSave: (updatedQuiz: Quiz) => void;
  onCancel: () => void;
}

const LANGUAGE_SAMPLE_PHRASES: Record<string, string> = {
  'de-DE': 'Guten Tag! Wie geht es dir heute?',
  'en-US': 'Hello! How are you doing today?',
  'es-ES': '¡Hola! ¿Cómo estás hoy?',
  'fr-FR': "Bonjour ! Comment allez-vous aujourd'hui ?",
  'it-IT': 'Ciao! Come stai oggi?',
  'ja-JP': 'こんにちは！今日の調子はいかがですか？',
};

export const EditQuizPage: React.FC<EditQuizPageProps> = ({ quiz, onSave, onCancel }) => {
  const [quizName, setQuizName] = useState(quiz.name);
  const [selectedGroup, setSelectedGroup] = useState(quiz.group || 'default');
  const [cards, setCards] = useState<Card[]>(quiz.cards);
  const [modalError, setModalError] = useState<{ title: string; message: string; } | null>(null);
  const [importResult, setImportResult] = useState<{ addedCount: number; skipped: ImportWarning[] } | null>(null);
  const [isAdvanceSettingsOpen, setIsAdvanceSettingsOpen] = useState(false);

  const cardInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const [newlyAddedCardId, setNewlyAddedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    return quiz.voiceSettings || { ...DEFAULT_VOICE_SETTINGS };
  });

  const [testPhrase, setTestPhrase] = useState(() => LANGUAGE_SAMPLE_PHRASES[voiceSettings.language] || 'Hello!');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices() || []);
    };

    updateVoices();
    
    window.speechSynthesis.onvoiceschanged = updateVoices;
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      }
    };
  }, []);

  const filteredVoices = voices.filter(v => {
    const langLower = v.lang.toLowerCase().replace('_', '-');
    const targetLower = voiceSettings.language.toLowerCase().replace('_', '-');
    return langLower.startsWith(targetLower) || targetLower.startsWith(langLower) || langLower.split('-')[0] === targetLower.split('-')[0];
  });

  useEffect(() => {
    if (voiceSettings.enabled && filteredVoices.length > 0) {
      const voiceExists = filteredVoices.some(v => v.voiceURI === voiceSettings.voiceURI);
      if (!voiceExists) {
        setVoiceSettings(prev => ({ ...prev, voiceURI: filteredVoices[0].voiceURI }));
      }
    }
  }, [voiceSettings.enabled, voiceSettings.language, voices, voiceSettings.voiceURI]);

  const handleToggleVoice = (enabled: boolean) => {
    setVoiceSettings(prev => ({ ...prev, enabled }));
  };

  const handleLanguageChange = (language: string) => {
    setTestPhrase(LANGUAGE_SAMPLE_PHRASES[language] || 'Hello!');
    setVoiceSettings(prev => {
      const filtered = voices.filter(v => {
        const langLower = v.lang.toLowerCase().replace('_', '-');
        const targetLower = language.toLowerCase().replace('_', '-');
        return langLower.startsWith(targetLower) || targetLower.startsWith(langLower) || langLower.split('-')[0] === targetLower.split('-')[0];
      });
      const firstVoiceURI = filtered.length > 0 ? filtered[0].voiceURI : undefined;
      return {
        ...prev,
        language,
        voiceURI: firstVoiceURI,
      };
    });
  };

  const handleVoiceChange = (voiceURI: string) => {
    setVoiceSettings(prev => ({ ...prev, voiceURI }));
  };

  const handleVoiceSettingsSlider = (field: 'rate' | 'pitch', value: number) => {
    setVoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleResetVoiceSettings = () => {
    setVoiceSettings({
      enabled: true,
      language: DEFAULT_VOICE_SETTINGS.language,
      rate: DEFAULT_VOICE_SETTINGS.rate,
      pitch: DEFAULT_VOICE_SETTINGS.pitch,
      voiceURI: undefined,
    });
    setTestPhrase(LANGUAGE_SAMPLE_PHRASES[DEFAULT_VOICE_SETTINGS.language] || 'Hello!');
  };

  const getInitialWeights = () => {
    const weightsSource = quiz.priorityWeights || PRIORITY_WEIGHTS;
    return {
        [Priority.High]: weightsSource.High * 100,
        [Priority.Medium]: weightsSource.Medium * 100,
        [Priority.Low]: weightsSource.Low * 100,
        [Priority.Unset]: weightsSource.Unset * 100,
    };
  };

  const [weights, setWeights] = useState(getInitialWeights());

  const handleWeightChange = (priority: Priority, value: string) => {
      const numericValue = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
          setWeights(prev => ({ ...prev, [priority]: numericValue }));
      }
  };

  const handleResetWeights = () => {
    setWeights({
      [Priority.High]: PRIORITY_WEIGHTS.High * 100,
      [Priority.Medium]: PRIORITY_WEIGHTS.Medium * 100,
      [Priority.Low]: PRIORITY_WEIGHTS.Low * 100,
      [Priority.Unset]: PRIORITY_WEIGHTS.Unset * 100,
    });
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + (w || 0), 0);

  const handleCardChange = useCallback((cardId: string, field: 'front' | 'back', value: string) => {
    setCards(currentCards =>
      currentCards.map(card =>
        card.id === cardId ? { ...card, [field]: value } : card
      )
    );
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(currentCards => currentCards.filter(card => card.id !== cardId));
  }, []);

  const handleAddCard = useCallback(() => {
    const newCard = createNewCard(quiz.id);
    setCards(currentCards => [...currentCards, newCard]);
    setNewlyAddedCardId(newCard.id);
  }, [quiz.id]);
  
  useEffect(() => {
    if (newlyAddedCardId) {
      const inputEl = cardInputRefs.current.get(newlyAddedCardId);
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus({ preventScroll: true });
      }
      setNewlyAddedCardId(null);
    }
  }, [newlyAddedCardId, cards]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        let content = await file.text();
        if (content.startsWith('\uFEFF')) {
            content = content.substring(1);
        }

        const lines = content.split(/\r?\n/);
        const addedCards: Card[] = [];
        const skipped: ImportWarning[] = [];
        
        const existingFronts = new Set(cards.map(c => c.front.trim().toLowerCase()));

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trim();

            if (!trimmedLine) return;

            const cleanField = (field: string | undefined): string => {
                if (!field) return '';
                let cleaned = field.trim();
                if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                    cleaned = cleaned.substring(1, cleaned.length - 1);
                }
                return cleaned.replace(/\s+/g, ' ').trim();
            };

            if (!trimmedLine.includes(',')) {
                skipped.push({ line: lineNumber, content: trimmedLine, reason: 'Line does not contain a comma separator.' });
                return;
            }

            const parts = trimmedLine.split(',');
            const front = cleanField(parts[0]);
            const back = cleanField(parts.slice(1).join(','));

            if (!front || !back) {
                skipped.push({ line: lineNumber, content: trimmedLine, reason: 'One or more fields are empty.' });
                return;
            }

            const normalizedFront = front.trim().toLowerCase();
            if (existingFronts.has(normalizedFront)) {
                skipped.push({ line: lineNumber, content: trimmedLine, reason: `Duplicate entry for "${front}".` });
                return;
            }

            const newCard = createNewCard(quiz.id);
            newCard.front = front;
            newCard.back = back;
            addedCards.push(newCard);
            
            existingFronts.add(normalizedFront);
        });

        if (addedCards.length > 0) {
            setCards(prev => [...prev, ...addedCards]);
        }
        
        setImportResult({ addedCount: addedCards.length, skipped });
        
    } catch (error) {
        setModalError({ title: 'Import Error', message: `Could not process the file. ${error instanceof Error ? error.message : ''}` });
    } finally {
        if (e.target) e.target.value = '';
    }
  };

  const handleSave = () => {
    if (!quizName.trim()) {
        setModalError({ title: 'Invalid Quiz Name', message: 'Quiz name cannot be empty. Please provide a name for your quiz.' });
        return;
    }

    if (Math.round(totalWeight) !== 100) {
        setModalError({ title: 'Invalid Weights', message: `The sum of all priority weights must be exactly 100%. Current total is ${totalWeight}%.` });
        return;
    }

    const invalidCard = cards.find(c => !c.front.trim() || !c.back.trim());
    if (invalidCard) {
        setModalError({ title: 'Incomplete Card', message: 'All cards must have both a front and a back value. Please fill them out or delete the empty card.' });
        return;
    }

    const seenFronts = new Set<string>();
    for (const card of cards) {
      const normalizedFront = card.front.trim().toLowerCase();
      if (normalizedFront) {
        if (seenFronts.has(normalizedFront)) {
          setModalError({
            title: 'Duplicate Card Found',
            message: `The card front "${card.front.trim()}" is used more than once. Please ensure all card fronts are unique.`
          });
          return;
        }
        seenFronts.add(normalizedFront);
      }
    }
    
    const normalizedWeights = {
        [Priority.High]: weights[Priority.High] / 100,
        [Priority.Medium]: weights[Priority.Medium] / 100,
        [Priority.Low]: weights[Priority.Low] / 100,
        [Priority.Unset]: weights[Priority.Unset] / 100,
    };

    const updatedQuiz: Quiz = {
      ...quiz,
      name: quizName.trim(),
      cards: cards,
      priorityWeights: normalizedWeights,
      group: selectedGroup,
      voiceSettings: voiceSettings,
    };
    onSave(updatedQuiz);
  };

  const priorityConfig: { priority: Priority, label: string, color: string }[] = [
      { priority: Priority.High, label: 'Hard', color: 'text-red-400' },
      { priority: Priority.Medium, label: 'Medium', color: 'text-orange-400' },
      { priority: Priority.Low, label: 'Easy', color: 'text-sky-400' },
      { priority: Priority.Unset, label: 'Unset', color: 'text-slate-400' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
       <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept=".csv, text/csv" />
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">&larr; Back to Quizzes</button>
        <div className="flex items-center gap-4">
            <button onClick={handleImportClick} className="flex items-center gap-2 bg-transparent border border-slate-600 text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
                <UploadIcon className="w-5 h-5"/>
                Import from CSV
            </button>
            <button onClick={handleAddCard} className="flex items-center gap-2 bg-transparent border border-slate-600 text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
                <PlusIcon className="w-5 h-5"/>
                Add New Card
            </button>
            <button onClick={handleSave} className="bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-500 transition-colors">
                Save Changes
            </button>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6">Edit Quiz</h1>
        
        {/* Advance settings Accordion */}
        <div className="mb-8 bg-slate-700/30 rounded-xl border border-slate-700 overflow-hidden">
          <button
            type="button"
            id="advance-settings-accordion-btn"
            onClick={() => setIsAdvanceSettingsOpen(prev => !prev)}
            className="w-full flex items-center justify-between p-5 text-left bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-expanded={isAdvanceSettingsOpen}
          >
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                Advance settings
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Configure priority weight distribution and voice pronunciation settings
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-4">
              <span className="text-xs font-medium uppercase tracking-wider bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 border border-slate-600">
                {isAdvanceSettingsOpen ? 'Hide' : 'Show'}
              </span>
              <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isAdvanceSettingsOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {isAdvanceSettingsOpen && (
            <div className="p-6 space-y-6 border-t border-slate-700/50 bg-slate-800/40">
              {/* Custom Priority Weights Section */}
              <div className="p-6 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Custom Priority Weights</h3>
                    <p className="text-sm text-slate-400 mb-4">Define the chance of cards with a certain priority appearing in a study session. The total must be exactly 100%.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetWeights}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-600 hover:bg-slate-500 hover:text-white rounded-md border border-slate-500 transition-colors shrink-0 ml-4"
                  >
                    Reset to Default
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {priorityConfig.map(({ priority, label, color }) => (
                    <div key={priority}>
                      <label htmlFor={`weight-${priority}`} className={`block text-sm font-medium mb-1 ${color}`}>{label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          id={`weight-${priority}`}
                          value={weights[priority]}
                          onChange={(e) => handleWeightChange(priority, e.target.value)}
                          min="0" max="100" step="1"
                          className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 pr-8"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <span className={`font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}>
                    Total: {totalWeight}%
                  </span>
                  {totalWeight !== 100 && <p className="text-xs text-red-400 mt-1">Total must be 100% to save.</p>}
                </div>
              </div>

              {/* Voice & Pronunciation Section */}
              <div id="voice-settings-card" className="p-6 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Voice & Pronunciation</h3>
                    <p className="text-sm text-slate-400">Configure text-to-speech settings to hear correct pronunciations during your session.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="enable-voice"
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
                        <label htmlFor="voice-language" className="block text-sm font-medium text-slate-300 mb-1">Target Language</label>
                        <select
                          id="voice-language"
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
                        <label htmlFor="voice-speaker" className="block text-sm font-medium text-slate-300 mb-1">Speaker Voice</label>
                        <select
                          id="voice-speaker"
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
                          <label htmlFor="voice-rate">Speech Rate (Speed)</label>
                          <span className="text-sky-400">{voiceSettings.rate.toFixed(1)}x</span>
                        </div>
                        <input 
                          id="voice-rate"
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
                          <label htmlFor="voice-pitch">Speech Pitch (Tone)</label>
                          <span className="text-sky-400">{voiceSettings.pitch.toFixed(1)}</span>
                        </div>
                        <input 
                          id="voice-pitch"
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

                    {/* Live Test Pronunciation Section */}
                    <div className="pt-4 border-t border-slate-600/50 flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="flex-1">
                        <label htmlFor="test-phrase-input" className="block text-sm font-medium text-slate-300 mb-1">Test Pronunciation</label>
                        <div className="flex gap-2">
                          <input 
                            id="test-phrase-input"
                            type="text"
                            value={testPhrase}
                            onChange={(e) => setTestPhrase(e.target.value)}
                            className="flex-1 bg-slate-600 border border-slate-500 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                            placeholder="Type a word or sentence to test..."
                          />
                          <button
                            id="test-pronunciation-btn"
                            type="button"
                            onClick={() => speakText(testPhrase, voiceSettings)}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md flex items-center gap-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            aria-label="Test speaker pronunciation"
                          >
                            <SpeakerIcon className="w-5 h-5" />
                            Test Voice
                          </button>
                        </div>
                      </div>
                      <button
                        id="reset-voice-settings-btn"
                        type="button"
                        onClick={handleResetVoiceSettings}
                        className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 border border-slate-500 text-slate-300 hover:text-white rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 sm:self-end h-[38px]"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
            <label htmlFor="quizName" className="block text-sm font-medium text-slate-300 mb-2">Quiz Name</label>
            <input
              type="text"
              id="quizName"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g., Common Nouns"
              required
            />
        </div>

        <div className="mb-6">
            <GroupSelector selectedGroup={selectedGroup} onChange={setSelectedGroup} />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-4">Cards ({cards.length})</h2>
        <div className="space-y-3">
            {cards.map((card, index) => (
                <div key={card.id} className="grid grid-cols-12 gap-3 items-center bg-slate-700/50 p-3 rounded-lg">
                    <div className="col-span-1 text-slate-400 text-sm">{index + 1}</div>
                    <div className="col-span-5">
                        <input
                            ref={(el) => {
                              if (el) {
                                  cardInputRefs.current.set(card.id, el);
                              } else {
                                  cardInputRefs.current.delete(card.id);
                              }
                            }}
                            type="text"
                            value={card.front}
                            onChange={(e) => handleCardChange(card.id, 'front', e.target.value)}
                            placeholder="Front (e.g., English)"
                            className="w-full bg-slate-600 border border-slate-500 rounded-md px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    </div>
                     <div className="col-span-5">
                        <input
                            type="text"
                            value={card.back}
                            onChange={(e) => handleCardChange(card.id, 'back', e.target.value)}
                            placeholder="Back (e.g., German)"
                            className="w-full bg-slate-600 border border-slate-500 rounded-md px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    </div>
                    <div className="col-span-1 flex justify-end">
                        <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            aria-label="Delete card"
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end items-center gap-4">
             <button onClick={handleAddCard} className="flex items-center gap-2 bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 hover:text-white transition-colors">
                <PlusIcon className="w-5 h-5"/>
                Add New Card
            </button>
            <button onClick={handleSave} className="bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-sky-500 transition-colors">
                Save Changes
            </button>
        </div>
      </div>
       {modalError && (
        <ErrorModal 
          title={modalError.title} 
          message={modalError.message} 
          onClose={() => setModalError(null)} 
        />
      )}
      {importResult && (
        <ImportResultModal 
          results={importResult}
          onClose={() => setImportResult(null)}
        />
      )}
    </div>
  );
};