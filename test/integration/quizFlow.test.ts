import { createQuiz, getQuizzes, calculateQuizMastery, updateQuiz, createNewCard } from '../../services/quizService';
import { updateCard } from '../../services/srsService';
import { ReviewRating, Quiz, Card, ImportWarning } from '../../types';
import { INITIAL_EASE_FACTOR, AGAIN_INTERVAL, GOOD_INTERVAL, EASY_GRADUATING_INTERVAL, GRADUATING_INTERVAL } from '../../constants';
import { expect, TestCase } from '../test-utils';

const sampleCsvData = `Page,die Seite
Hair(single strand),das Haar
Head,der Kopf
Face,das Gesicht
Meat,das Fleisch
Street,die Straße
Water,das Wasser
Beef,das Rindfleisch
Pork,das Schweinefleisch
Pig,das Schwein
Lamb(Zool),das Lamm
Hospital,das Krankenhaus
Doctor(male),der Arzt
Engineer(male),der Ingenieur
Teacher(male),der Lehrer
Table,der Tisch
Calendar,der Kalender
Cow,die Kuh
Crow,die Krähe
Crowd,die Menge
Umbrella,der Regenschirm
Bottle,die Flasche`;


export const quizFlowTests: TestCase[] = [
    {
        name: 'Integration Test: Create a new quiz and verify its properties',
        testFn: async () => {
            const quizName = "IntTest22";
            const expectedCardCount = 22;

            // Action: create the quiz
            createQuiz(quizName, sampleCsvData);

            // Verification
            const quizzes = getQuizzes();
            const createdQuiz = quizzes.find(q => q.name === quizName);

            // Assert quiz was created
            expect(createdQuiz).toBeDefined();
            
            // This check is for TypeScript to know createdQuiz is not undefined from this point
            if (!createdQuiz) throw new Error("Quiz should have been defined");

            // Assert correct name
            expect(createdQuiz.name).toBe(quizName);

            // Assert correct number of cards
            expect(createdQuiz.cards).toHaveLength(expectedCardCount);

            // Assert initial mastery is 0
            const mastery = calculateQuizMastery(createdQuiz);
            expect(mastery).toBe(0);
        }
    },
    {
        name: 'Integration Test: Full SRS review cycle on a quiz',
        testFn: async () => {
            // 1. Create a quiz
            const quizName = "SRS Integration Quiz";
            const { newQuiz } = createQuiz(quizName, "hello,hallo\nworld,welt\neasy,einfach");
            
            let quiz: Quiz | undefined = getQuizzes().find(q => q.id === newQuiz.id);
            expect(quiz).toBeDefined();
            if (!quiz) throw new Error("Quiz not created");

            // --- SCENARIO 1: Successfully learning and graduating a card ---
            let card1 = { ...quiz.cards.find(c => c.front === 'hello')! };
            expect(card1.isNew).toBe(true);
            
            // First review: 'Good' -> enters learning phase
            card1 = updateCard(card1, ReviewRating.Good);
            expect(card1.repetitions).toBe(1);
            expect(card1.interval).toBe(GOOD_INTERVAL);
            expect(card1.isNew).toBe(false);
            
            // Second review: 'Good' -> graduates
            card1 = updateCard(card1, ReviewRating.Good);
            expect(card1.repetitions).toBe(2);
            expect(card1.interval).toBe(GRADUATING_INTERVAL);
            
            // --- SCENARIO 2: Failing a card, then recovering ---
            let card2 = { ...quiz.cards.find(c => c.front === 'world')! };

            // First review: Fail with 'Again'
            card2 = updateCard(card2, ReviewRating.Again);
            expect(card2.repetitions).toBe(0);
            expect(card2.interval).toBe(AGAIN_INTERVAL);
            expect(card2.easeFactor).toBe(INITIAL_EASE_FACTOR - 0.20);
            expect(card2.isNew).toBe(true); // Still new because never answered correctly

            // Second review: Pass with 'Good'
            card2 = updateCard(card2, ReviewRating.Good);
            expect(card2.repetitions).toBe(1);
            expect(card2.interval).toBe(GOOD_INTERVAL);
            expect(card2.easeFactor).toBe(INITIAL_EASE_FACTOR - 0.20); // Ease factor does not recover on 'Good'
            expect(card2.isNew).toBe(false);

            // --- SCENARIO 3: Reviewing a mature card ---
            let card3 = { ...quiz.cards.find(c => c.front === 'easy')! };
            // Manually make it a mature card for the test
            card3.isNew = false;
            card3.repetitions = 5;
            card3.interval = 10 * 24 * 60; // 10 days
            card3.easeFactor = 2.5;

            // Review as 'Hard'
            let hardReviewedCard = updateCard(card3, ReviewRating.Hard);
            expect(hardReviewedCard.repetitions).toBe(6);
            expect(hardReviewedCard.interval).toBe(card3.interval * 1.2);
            expect(hardReviewedCard.easeFactor).toBe(2.5 - 0.15);

            // Review as 'Easy'
            let easyReviewedCard = updateCard(card3, ReviewRating.Easy);
            expect(easyReviewedCard.repetitions).toBe(6);
            expect(easyReviewedCard.interval).toBe(card3.interval * card3.easeFactor * 1.5);
            expect(easyReviewedCard.easeFactor).toBe(2.5 + 0.15);
            
            // --- SCENARIO 4: Persistence ---
            // Update quiz with all card changes and save it
            quiz.cards = quiz.cards.map(c => {
                if (c.id === card1.id) return card1;
                if (c.id === card2.id) return card2;
                // for card3, we'll just save the last 'easy' review state
                if (c.id === card3.id) return easyReviewedCard;
                return c;
            });
            updateQuiz(quiz);

            // Load from storage and verify
            const savedQuiz = getQuizzes().find(q => q.id === quiz!.id);
            expect(savedQuiz).toBeDefined();
            if(!savedQuiz) throw new Error("Saved quiz not found");

            const savedCard1 = savedQuiz.cards.find(c => c.id === card1.id)!;
            expect(savedCard1.interval).toBe(GRADUATING_INTERVAL);
            expect(savedCard1.repetitions).toBe(2);

            const savedCard2 = savedQuiz.cards.find(c => c.id === card2.id)!;
            expect(savedCard2.interval).toBe(GOOD_INTERVAL);
            expect(savedCard2.repetitions).toBe(1);

            const savedCard3 = savedQuiz.cards.find(c => c.id === card3.id)!;
            expect(savedCard3.interval).toBe(easyReviewedCard.interval);
            expect(savedCard3.easeFactor).toBe(easyReviewedCard.easeFactor);
        }
    },
    {
        name: 'Integration Test: Prevents creating quizzes with duplicate names',
        testFn: async () => {
            const quizName = "Duplicate Test Quiz";
    
            // 1. Create the first quiz successfully
            createQuiz(quizName, "a,b");
            let quizzes = getQuizzes();
            expect(quizzes).toHaveLength(1);
            expect(quizzes[0].name).toBe(quizName);
    
            // 2. Attempt to create a duplicate and expect an error
            let errorThrown = false;
            const duplicateAttemptName = `  ${quizName.toUpperCase()}  `;
            try {
                // Attempt with same name but different casing and whitespace
                createQuiz(duplicateAttemptName, "c,d");
            } catch (error) {
                errorThrown = true;
                expect(error instanceof Error).toBe(true);
                if (error instanceof Error) {
                    expect(error.message).toBe(`A quiz with the name "${duplicateAttemptName.trim()}" already exists. Please choose a different name.`);
                }
            }
            
            // 3. Verify that an error was indeed thrown
            if (!errorThrown) {
                throw new Error("Expected createQuiz to throw an error for a duplicate name, but it did not.");
            }
            
            // 4. Verify that no new quiz was added
            quizzes = getQuizzes();
            expect(quizzes).toHaveLength(1);
        }
    },
    {
        name: 'Integration Test: Appends cards from CSV, skipping duplicates and invalid lines',
        testFn: async () => {
            // 1. Setup initial quiz
            const { newQuiz } = createQuiz("Append Test Quiz", "apple,der Apfel\ncar,das Auto");
            let quiz = getQuizzes().find(q => q.id === newQuiz.id)!;
            expect(quiz.cards.length).toBe(2);

            // 2. CSV data to append
            const csvToAppend = `
car,das Auto # This is a duplicate
bike,das Fahrrad
,empty front
invalid line
"Apple","der Apfel (duplicate with different casing/quote)"
            `;

            // 3. Simulate the append logic from EditQuizPage
            const existingCards = [...quiz.cards];
            let content = csvToAppend;
            const lines = content.split(/\r?\n/);
            const addedCards: Card[] = [];
            const skipped: ImportWarning[] = [];
            const existingFronts = new Set(existingCards.map(c => c.front.trim().toLowerCase()));

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
            
            const finalCards = [...existingCards, ...addedCards];

            // 4. Assertions
            expect(finalCards.length).toBe(3); // 2 initial + 1 new ("bike")
            expect(addedCards.length).toBe(1);
            expect(addedCards[0].front).toBe("bike");

            const bikeCard = finalCards.find(c => c.front === 'bike');
            expect(bikeCard).toBeDefined();

            const appleCard = finalCards.find(c => c.front === 'apple');
            expect(appleCard?.back).toBe('der Apfel'); // ensure original wasn't overwritten

            expect(skipped.length).toBe(4); // duplicate car, empty front, invalid line, duplicate apple
            
            const duplicateReason1 = skipped.find(s => s.content.includes('car'));
            expect(duplicateReason1?.reason).toBe('Duplicate entry for "car".');
            
            const emptyFrontReason = skipped.find(s => s.content.includes('empty front'));
            expect(emptyFrontReason?.reason).toBe('One or more fields are empty.');
            
            const invalidLineReason = skipped.find(s => s.content.includes('invalid line'));
            expect(invalidLineReason?.reason).toBe('Line does not contain a comma separator.');

            const duplicateReason2 = skipped.find(s => s.content.includes('Apple'));
            expect(duplicateReason2?.reason).toBe('Duplicate entry for "Apple".');
        }
    }
];