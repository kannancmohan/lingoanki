import { selectSessionCards, formatTime } from '../../services/sessionService';
import { Card, Priority, Quiz } from '../../types';
import { expect, TestCase } from '../test-utils';

const createTestCard = (id: number, priority: Priority): Card => ({
    id: `card_${id}`,
    quizId: 'quiz_test',
    front: `f${id}`,
    back: `b${id}`,
    priority,
    timesSeen: 0,
    timesCorrect: 0,
    timesIncorrect: 0,
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
            // Weights: High: 0.4, Medium: 0.2, Low: 0.05, Unset: 0.35
            // Session Size: 100 -> High: 40, Medium: 20, Low: 5, Unset: 35
            const quiz = createTestQuiz({ High: 50, Medium: 50, Low: 50, Unset: 50 });
            quiz.priorityWeights = { High: 0.4, Medium: 0.2, Low: 0.05, Unset: 0.35 };
            const session = selectSessionCards(quiz, 100);
            
            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            // Allow for rounding differences
            const tolerance = 2;
            if (Math.abs(counts.High - 40) > tolerance) throw new Error(`Expected ~40 High cards, got ${counts.High}`);
            if (Math.abs(counts.Medium - 20) > tolerance) throw new Error(`Expected ~20 Medium cards, got ${counts.Medium}`);
            if (Math.abs(counts.Low - 5) > tolerance) throw new Error(`Expected ~5 Low cards, got ${counts.Low}`);
            if (Math.abs(counts.Unset - 35) > tolerance) throw new Error(`Expected ~35 Unset cards, got ${counts.Unset}`);
        },
    },
    {
        name: 'PAWRS Test: Redistributes weight when a priority group is empty',
        testFn: () => {
            // High is empty, its 40% weight should be redistributed.
            // Remaining weights: Med: 0.2, Low: 0.05, Unset: 0.35 (Total: 0.6)
            // Proportions: Med: 0.2/0.6=33.3%, Low: 0.05/0.6=8.3%, Unset: 0.35/0.6=58.3%
            // Session of 30 -> Med: 10, Low: 2.5(3), Unset: 17.5(17)
            const quiz = createTestQuiz({ High: 0, Medium: 20, Low: 20, Unset: 20 });
            quiz.priorityWeights = { High: 0.4, Medium: 0.2, Low: 0.05, Unset: 0.35 };
            const session = selectSessionCards(quiz, 30);
            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            expect(counts.High).toBe(0);
            const tolerance = 2;
            if (Math.abs(counts.Medium - 10) > tolerance) throw new Error(`Expected ~10 Medium cards, got ${counts.Medium}`);
            if (Math.abs(counts.Low - 3) > tolerance) throw new Error(`Expected ~3 Low cards, got ${counts.Low}`);
            if (Math.abs(counts.Unset - 17) > tolerance) throw new Error(`Expected ~17 Unset cards, got ${counts.Unset}`);
            expect(session.length).toBe(30);
        },
    },
    {
        name: 'PAWRS Test: Handles insufficient cards in a high-priority group',
        testFn: () => {
            // Target for session of 20: High: 8, Med: 4, Low: 1, Unset: 7
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
            // Only Low (0.05 weight) and Unset (0.35 weight) cards are available. Unset should be heavily favored.
            const quiz = createTestQuiz({ High: 0, Medium: 0, Low: 5, Unset: 5 });
            const session = selectSessionCards(quiz, 8);

            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);
            
            expect(session.length).toBe(8);
            expect(counts.High).toBe(0);
            expect(counts.Medium).toBe(0);
            
            // The algorithm should take all 5 available Unset cards (as its weight is higher) and fill the rest with Low cards.
            expect(counts.Unset).toBe(5);
            expect(counts.Low).toBe(3);
        }
    },
    {
        name: 'PAWRS Test: Redistributes weight when Unset group is empty (all cards answered at least once)',
        testFn: () => {
            // User has answered all cards so Unset = 0.
            // High: 50 cards, Medium: 50 cards, Low: 50 cards, Unset: 0 cards.
            const quiz = createTestQuiz({ High: 50, Medium: 50, Low: 50, Unset: 0 });
            const session = selectSessionCards(quiz, 30);

            const counts = { High: 0, Medium: 0, Low: 0, Unset: 0 };
            session.forEach(card => counts[card.priority]++);

            expect(session.length).toBe(30);
            expect(counts.Unset).toBe(0);
            
            // Expected breakdown roughly: High ~ 21 (71.4%), Medium ~ 8 (25.7%), Low ~ 1 (2.9%)
            const tolerance = 3;
            if (Math.abs(counts.High - 21) > tolerance) {
                throw new Error(`Expected ~21 High cards, got ${counts.High}`);
            }
            if (Math.abs(counts.Medium - 8) > tolerance) {
                throw new Error(`Expected ~8 Medium cards, got ${counts.Medium}`);
            }
            if (counts.Low < 1 || counts.Low > 4) {
                throw new Error(`Expected 1-4 Low cards, got ${counts.Low}`);
            }
        }
    },
    {
        name: 'Randomness Test: Selects cards in random non-sequential order when all cards are Unset',
        testFn: () => {
            // Create 100 Unset cards
            const quiz = createTestQuiz({ High: 0, Medium: 0, Low: 0, Unset: 100 });
            const session = selectSessionCards(quiz, 30);
            
            expect(session.length).toBe(30);

            // Check that the returned IDs are NOT identical to card_1, card_2, ..., card_30
            const selectedIds = session.map(c => c.id);
            const sequentialIds = Array.from({ length: 30 }, (_, i) => `card_${i + 1}`);

            let matchesInOrder = 0;
            for (let i = 0; i < 30; i++) {
                if (selectedIds[i] === sequentialIds[i]) {
                    matchesInOrder++;
                }
            }

            // With true random shuffling out of 100 cards, the chance of getting exact sequential card_1..card_30 is virtually 0
            if (matchesInOrder > 25) {
                throw new Error(`Session cards were picked sequentially! Found ${matchesInOrder}/30 matching original sequence.`);
            }
        }
    },
    {
        name: 'Timer Test: Formats seconds into digital timer format (mm:ss / hh:mm:ss)',
        testFn: () => {
            expect(formatTime(0)).toBe('00:00');
            expect(formatTime(5)).toBe('00:05');
            expect(formatTime(65)).toBe('01:05');
            expect(formatTime(3600)).toBe('01:00:00');
            expect(formatTime(3665)).toBe('01:01:05');
        }
    },
];