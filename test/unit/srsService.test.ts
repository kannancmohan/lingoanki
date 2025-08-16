import { updateCard } from '../../services/srsService';
import { Card, ReviewRating } from '../../types';
import { INITIAL_EASE_FACTOR, AGAIN_INTERVAL, GOOD_INTERVAL, EASY_GRADUATING_INTERVAL, GRADUATING_INTERVAL, MIN_EASE_FACTOR } from '../../constants';
import { expect, TestCase } from '../test-utils';

export const srsServiceTests: TestCase[] = [
    {
        name: 'SRS Unit Test: Verify logic for card updates',
        testFn: async () => {
            const now = Date.now();
            const createNewCard = (): Card => ({
                id: 'card_test_srs',
                quizId: 'quiz_test_srs',
                front: 'Front',
                back: 'Back',
                dueDate: now,
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
            let updatedCard = updateCard(card, ReviewRating.Again);
            expect(updatedCard.repetitions).toBe(0);
            expect(updatedCard.interval).toBe(AGAIN_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR - 0.20);
            expect(updatedCard.isNew).toBe(true); // isNew remains true as it was never correct
    
            // Sub-test 2: New card rated 'Good'
            card = createNewCard();
            updatedCard = updateCard(card, ReviewRating.Good);
            expect(updatedCard.repetitions).toBe(1);
            expect(updatedCard.interval).toBe(GOOD_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR);
            expect(updatedCard.isNew).toBe(false);
    
            // Sub-test 3: New card rated 'Easy'
            card = createNewCard();
            updatedCard = updateCard(card, ReviewRating.Easy);
            expect(updatedCard.repetitions).toBe(1);
            expect(updatedCard.interval).toBe(EASY_GRADUATING_INTERVAL);
            expect(updatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR + 0.15);
            expect(updatedCard.isNew).toBe(false);
    
            // Sub-test 4: Graduating a card with 'Good', then 'Good'
            card = createNewCard();
            const learningCard = updateCard(card, ReviewRating.Good); // First 'Good', enters learning phase
            expect(learningCard.interval).toBe(GOOD_INTERVAL);
            
            const graduatedCard = updateCard(learningCard, ReviewRating.Good); // Second 'Good', graduates
            expect(graduatedCard.repetitions).toBe(2);
            expect(graduatedCard.interval).toBe(GRADUATING_INTERVAL);
            expect(graduatedCard.easeFactor).toBe(INITIAL_EASE_FACTOR);
            
            // Sub-test 5: Reviewing a mature card
            const matureCard = { ...graduatedCard, interval: 10 * 24 * 60 }; // Simulate a 10-day interval
            matureCard.easeFactor = 2.5;
    
            // 5a: Mature card rated 'Hard'
            const hardReview = updateCard(matureCard, ReviewRating.Hard);
            expect(hardReview.interval).toBe(matureCard.interval * 1.2);
            expect(hardReview.easeFactor).toBe(2.5 - 0.15);
    
            // 5b: Mature card rated 'Good'
            const goodReview = updateCard(matureCard, ReviewRating.Good);
            expect(goodReview.interval).toBe(matureCard.interval * matureCard.easeFactor);
            expect(goodReview.easeFactor).toBe(2.5); // Unchanged
    
            // 5c: Mature card rated 'Easy'
            const easyReview = updateCard(matureCard, ReviewRating.Easy);
            expect(easyReview.interval).toBe(matureCard.interval * matureCard.easeFactor * 1.5);
            expect(easyReview.easeFactor).toBe(2.5 + 0.15);

            // Sub-test 6: Ease factor does not go below minimum
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
