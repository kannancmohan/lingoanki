import { updateCard } from '../../services/srsService';
import { Card, ReviewRating } from '../../types';
import { INITIAL_EASE_FACTOR, AGAIN_INTERVAL, GOOD_INTERVAL, EASY_GRADUATING_INTERVAL, GRADUATING_INTERVAL, MIN_EASE_FACTOR, HARD_INTERVAL } from '../../constants';
import { expect, TestCase } from '../test-utils';

// Helper to check if a dueDate is approximately correct, allowing for small delays in test execution
const expectDueDateApprox = (actual: number, expected: number) => {
    const tolerance = 100; // ms
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected dueDate ${actual} to be approximately ${expected} (within ${tolerance}ms)`);
    }
};

export const srsServiceTests: TestCase[] = [
    {
        name: 'SRS Unit Test: Verify logic for card updates including due dates',
        testFn: async () => {
            const createNewCard = (): Card => ({
                id: 'card_test_srs',
                quizId: 'quiz_test_srs',
                front: 'Front',
                back: 'Back',
                dueDate: Date.now(),
                interval: 0,
                easeFactor: INITIAL_EASE_FACTOR,
                repetitions: 0,
                isNew: true,
                timesSeen: 0,
                timesCorrect: 0,
                timesIncorrect: 0,
            });
    
            // Sub-test 1: New card rated 'Again'
            let card = createNewCard();
            let now = Date.now();
            let updatedCard = updateCard(card, ReviewRating.Again);
            expect(updatedCard.repetitions).toBe(0);
            expect(updatedCard.interval).toBe(AGAIN_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR - 0.20);
            expect(updatedCard.isNew).toBe(false);
            expectDueDateApprox(updatedCard.dueDate, now); // Should be due immediately
    
            // Sub-test 2: New card rated 'Hard'
            card = createNewCard();
            now = Date.now();
            updatedCard = updateCard(card, ReviewRating.Hard);
            expect(updatedCard.repetitions).toBe(1);
            expect(updatedCard.interval).toBe(HARD_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR);
            expect(updatedCard.isNew).toBe(false);
            expectDueDateApprox(updatedCard.dueDate, now + HARD_INTERVAL * 60 * 1000);

            // Sub-test 3: New card rated 'Good'
            card = createNewCard();
            now = Date.now();
            updatedCard = updateCard(card, ReviewRating.Good);
            expect(updatedCard.repetitions).toBe(1);
            expect(updatedCard.interval).toBe(GOOD_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR);
            expect(updatedCard.isNew).toBe(false);
            expectDueDateApprox(updatedCard.dueDate, now + GOOD_INTERVAL * 60 * 1000);

            // Sub-test 4: New card rated 'Easy'
            card = createNewCard();
            now = Date.now();
            updatedCard = updateCard(card, ReviewRating.Easy);
            expect(updatedCard.repetitions).toBe(1);
            expect(updatedCard.interval).toBe(EASY_GRADUATING_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR + 0.15);
            expect(updatedCard.isNew).toBe(false);
            expectDueDateApprox(updatedCard.dueDate, now + EASY_GRADUATING_INTERVAL * 60 * 1000);

            // Sub-test 5: Graduating a card with 'Good', then 'Good'
            card = createNewCard();
            const learningCard = updateCard(card, ReviewRating.Good);
            expect(learningCard.interval).toBe(GOOD_INTERVAL);
            
            now = Date.now();
            const graduatedCard = updateCard(learningCard, ReviewRating.Good);
            expect(graduatedCard.repetitions).toBe(2);
            expect(graduatedCard.interval).toBe(GRADUATING_INTERVAL);
            expect(graduatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR);
            expectDueDateApprox(graduatedCard.dueDate, now + GRADUATING_INTERVAL * 60 * 1000);
            
            // Sub-test 6: Reviewing a mature card
            const matureCard = { ...graduatedCard, interval: 10 * 24 * 60 }; // Simulate a 10-day interval
            matureCard.easeFactor = 2.5;
    
            // 6a: Mature card rated 'Hard'
            now = Date.now();
            const hardReview = updateCard(matureCard, ReviewRating.Hard);
            expect(hardReview.interval).toBe(matureCard.interval * 1.2);
            expect(hardReview.easeFactor).toBe(2.5 - 0.15);
            expectDueDateApprox(hardReview.dueDate, now + hardReview.interval * 60 * 1000);

            // 6b: Mature card rated 'Good'
            now = Date.now();
            const goodReview = updateCard(matureCard, ReviewRating.Good);
            expect(goodReview.interval).toBe(matureCard.interval * matureCard.easeFactor);
            expect(goodReview.easeFactor).toBe(2.5); // Unchanged
            expectDueDateApprox(goodReview.dueDate, now + goodReview.interval * 60 * 1000);

            // 6c: Mature card rated 'Easy'
            now = Date.now();
            const easyReview = updateCard(matureCard, ReviewRating.Easy);
            expect(easyReview.interval).toBe(matureCard.interval * matureCard.easeFactor * 1.5);
            expect(easyReview.easeFactor).toBe(2.5 + 0.15);
            expectDueDateApprox(easyReview.dueDate, now + easyReview.interval * 60 * 1000);

            // Sub-test 7: Ease factor does not go below minimum
            card = createNewCard();
            card.easeFactor = 1.35;
            updatedCard = updateCard(card, ReviewRating.Again);
            expect(updatedCard.easeFactor).toBe(MIN_EASE_FACTOR);

            card.easeFactor = 1.25; // Start below minimum
            updatedCard = updateCard(card, ReviewRating.Again);
            expect(updatedCard.easeFactor).toBe(MIN_EASE_FACTOR);
        }
    }
];