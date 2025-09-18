import { selectSessionCards } from '../../services/srsService';
import { Card, Priority, Quiz } from '../../types';
import { expect, TestCase } from '../test-utils';
// FIX: Import DEFAULT_EASE_FACTOR to initialize new card properties.
import { DEFAULT_EASE_FACTOR } from '../../constants';

const createTestCard = (id: number, priority: Priority): Card => ({
    id: `card_${id}`,
    quizId: 'quiz_test',
    front: `f${id}`,
    back: `b${id}`,
    priority,
    timesSeen: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
    // FIX: Add missing properties to align with the Card type.
    repetitions: 0,
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
});

const createTestQuiz = (cardCounts: Record<Priority, number>): Quiz => {
    const cards: Card[] = [];
    let id = 1;
    for (const priority in cardCounts) {
        for (let i = 0; i < cardCounts[priority as Priority]; i++) {
            cards.push(createTestCard(id++, priority as Priority));
        }
    }
    return { id: 'quiz_test', name: 'Test Quiz', createdAt: Date.now(), cards };
};

export const pawrsServiceTests: TestCase[] = [
    {
        name: 'PAWRS Test: Returns all cards if total is less than session size',
        testFn: () => {
            const quiz = createTestQuiz({ High: 2, Medium: 3, Low: 4, Unset: 1 }); // 10 cards
            const session = selectSessionCards(quiz, 20);
            expect(session.length).toBe(10);
        },
    },
    {
        name: 'PAWRS Test: Returns correct number of cards for a session',
        testFn: () => {
            const quiz = createTestQuiz({ High: 10, Medium: 10, Low: 10, Unset: 10 });
            const session = selectSessionCards(quiz, 20);
            expect(session.length).toBe(20);
        },
    },
    {
        name: 'PAWRS Test: Approximates correct distribution with ample cards',
        testFn: () => {
            // Weights: High: 0.4, Medium: 0.3, Low: 0.2, Unset: 0.1
            // Session Size: 100 -> High: 40, Medium: 30, Low: 20, Unset: 10
            const quiz = createTestQuiz({ High: 50, Medium: 50, Low: 50, Unset: 50 });
            const session = selectSessionCards(quiz, 100);
            
            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            // Allow for rounding differences
            const tolerance = 2;
            if (Math.abs(counts.High - 40) > tolerance) throw new Error(`Expected ~40 High cards, got ${counts.High}`);
            if (Math.abs(counts.Medium - 30) > tolerance) throw new Error(`Expected ~30 Medium cards, got ${counts.Medium}`);
            if (Math.abs(counts.Low - 20) > tolerance) throw new Error(`Expected ~20 Low cards, got ${counts.Low}`);
            if (Math.abs(counts.Unset - 10) > tolerance) throw new Error(`Expected ~10 Unset cards, got ${counts.Unset}`);
        },
    },
    {
        name: 'PAWRS Test: Redistributes weight when a priority group is empty',
        testFn: () => {
            // High is empty, its 40% weight should be redistributed.
            // Remaining weights: Med: 0.3, Low: 0.2, Unset: 0.1 (Total: 0.6)
            // Proportions: Med: 0.3/0.6=50%, Low: 0.2/0.6=33.3%, Unset: 0.1/0.6=16.7%
            // Session of 30 -> Med: 15, Low: 10, Unset: 5
            const quiz = createTestQuiz({ High: 0, Medium: 20, Low: 20, Unset: 20 });
            const session = selectSessionCards(quiz, 30);
            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            expect(counts.High).toBe(0);
            const tolerance = 2;
            if (Math.abs(counts.Medium - 15) > tolerance) throw new Error(`Expected ~15 Medium cards, got ${counts.Medium}`);
            if (Math.abs(counts.Low - 10) > tolerance) throw new Error(`Expected ~10 Low cards, got ${counts.Low}`);
            if (Math.abs(counts.Unset - 5) > tolerance) throw new Error(`Expected ~5 Unset cards, got ${counts.Unset}`);
            expect(session.length).toBe(30);
        },
    },
    {
        name: 'PAWRS Test: Handles insufficient cards in a high-priority group',
        testFn: () => {
            // Target for session of 20: High: 8, Med: 6, Low: 4, Unset: 2
            // We only have 3 High cards. The shortfall of 5 should be filled by other groups.
            const quiz = createTestQuiz({ High: 3, Medium: 20, Low: 20, Unset: 20 });
            const session = selectSessionCards(quiz, 20);
            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            expect(counts.High).toBe(3); // Should take all available High cards
            expect(session.length).toBe(20); // Should still fill the session
        },
    },
    {
        name: 'PAWRS Test: Fills session completely even with multiple empty/small groups',
        testFn: () => {
            // Only Low and Unset cards are available.
            const quiz = createTestQuiz({ High: 0, Medium: 0, Low: 5, Unset: 5 });
            const session = selectSessionCards(quiz, 8);

            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);
            
            expect(session.length).toBe(8);
            expect(counts.High).toBe(0);
            expect(counts.Medium).toBe(0);
            expect(counts.Low).toBe(5); // Takes all 5 Low cards
            expect(counts.Unset).toBe(3); // Fills the rest with Unset
        }
    },
];