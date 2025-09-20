import { createQuiz, getQuizzes, calculateQuizMastery, updateQuiz, resetPriorities } from '../../services/quizService';
import { updateCard, selectSessionCards } from '../../services/sessionService';
import { Priority, Quiz } from '../../types';
import { expect, TestCase } from '../test-utils';

const sampleCsvData = `Page,die Seite
Hair(single strand),das Haar
Head,der Kopf
Face,das Gesicht
Meat,das Fleisch
Street,die Straße`;


export const quizFlowTests: TestCase[] = [
    {
        name: 'Integration Test: Create a new quiz and verify card priorities',
        testFn: async () => {
            const quizName = "IntTest PAWRS";
            
            createQuiz(quizName, sampleCsvData);
            const createdQuiz = getQuizzes().find(q => q.name === quizName);

            expect(createdQuiz).toBeDefined();
            if (!createdQuiz) throw new Error("Quiz should have been defined");

            expect(createdQuiz.cards).toHaveLength(6);
            
            const allUnset = createdQuiz.cards.every(c => c.priority === Priority.Unset);
            if (!allUnset) {
                throw new Error(`Expected all new cards to have 'Unset' priority, but found other priorities.`);
            }

            const mastery = calculateQuizMastery(createdQuiz);
            expect(mastery).toBe(0);
        }
    },
    {
        name: 'Integration Test: Session flow and priority updates',
        testFn: async () => {
            const { newQuiz } = createQuiz("Priority Update Quiz", "hello,hallo\nworld,welt");
            let quiz = getQuizzes().find(q => q.id === newQuiz.id)!;
            
            // Card 1: Will be rated 'Low'
            let card1 = quiz.cards[0];
            card1 = updateCard(card1, Priority.Low);
            
            // Card 2: Will be rated 'Medium'
            let card2 = quiz.cards[1];
            card2 = updateCard(card2, Priority.Medium);
            
            quiz.cards = [card1, card2];
            updateQuiz(quiz);

            // Verify persistence
            const reloadedQuiz = getQuizzes().find(q => q.id === newQuiz.id)!;
            expect(reloadedQuiz.cards[0].priority).toBe(Priority.Low);
            expect(reloadedQuiz.cards[1].priority).toBe(Priority.Medium);
            
            // Verify mastery calculation
            // (100 for Low + 50 for Medium) / 2 cards = 75
            const mastery = calculateQuizMastery(reloadedQuiz);
            expect(mastery).toBe(75);
        }
    },
    {
        name: 'Integration Test: Reset priorities works correctly',
        testFn: async () => {
            const { newQuiz } = createQuiz("Reset Test", "a,b\nc,d");
            let quiz = getQuizzes().find(q => q.id === newQuiz.id)!;
            
            // Set some priorities
            quiz.cards[0].priority = Priority.High;
            quiz.cards[1].priority = Priority.Low;
            updateQuiz(quiz);
            
            // Check that mastery is not 0
            let mastery = calculateQuizMastery(getQuizzes().find(q => q.id === newQuiz.id)!);
            // (25 for High + 100 for Low) / 2 = 62.5 -> 63
            expect(mastery).toBe(63);

            // Reset priorities
            resetPriorities(newQuiz.id);
            
            const resetQuiz = getQuizzes().find(q => q.id === newQuiz.id)!;
            const allUnset = resetQuiz.cards.every(c => c.priority === Priority.Unset);
            if (!allUnset) {
                throw new Error("Expected all priorities to be 'Unset' after reset.");
            }
            
            // Check that mastery is 0 again
            mastery = calculateQuizMastery(resetQuiz);
            expect(mastery).toBe(0);
        }
    }
];