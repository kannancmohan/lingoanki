import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Quiz, Card, ImportWarning } from '../types';
import { createNewCard } from '../services/quizService';
import { TrashIcon, PlusIcon, UploadIcon } from './icons';
import { ErrorModal } from './ErrorModal';
import { ImportResultModal } from './ImportResultModal';

interface EditQuizPageProps {
  quiz: Quiz;
  onSave: (updatedQuiz: Quiz) => void;
  onCancel: () => void;
}

export const EditQuizPage: React.FC<EditQuizPageProps> = ({ quiz, onSave, onCancel }) => {
  const [quizName, setQuizName] = useState(quiz.name);
  const [cards, setCards] = useState<Card[]>(quiz.cards);
  const [modalError, setModalError] = useState<{ title: string; message: string; } | null>(null);
  const [importResult, setImportResult] = useState<{ addedCount: number; skipped: ImportWarning[] } | null>(null);

  const cardInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const [newlyAddedCardId, setNewlyAddedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


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

    const updatedQuiz: Quiz = {
      ...quiz,
      name: quizName.trim(),
      cards: cards,
    };
    onSave(updatedQuiz);
  };

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