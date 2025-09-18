import { previewCardInterval, formatInterval } from '../../services/srsPreview';
import { Card, ReviewRating } from '../../types';
import { INITIAL_EASE_FACTOR, AGAIN_INTERVAL, GOOD_INTERVAL, EASY_GRADUATING_INTERVAL, GRADUATING_INTERVAL, HARD_INTERVAL } from '../../constants';
import { expect, TestCase } from '../test-utils';

const createTestCard = (isNew: boolean, repetitions: number, interval: number, easeFactor: number = INITIAL_EASE_FACTOR): Card => ({
    id: 'card_test_preview', quizId: 'quiz_test_preview', front: 'f', back: 'b',
    dueDate: Date.now(), isNew, repetitions, interval, easeFactor,
    timesSeen: 0, timesCorrect: 0, timesIncorrect: 0,
});

export const srsPreviewTests: TestCase[] = [
    {
        name: 'SRS Preview Test: Interval calculation for different card states',
        testFn: () => {
            // New card scenarios
            const newCard = createTestCard(true, 0, 0);
            expect(previewCardInterval(newCard, ReviewRating.Again)).toBe(AGAIN_INTERVAL);
            expect(previewCardInterval(newCard, ReviewRating.Hard)).toBe(HARD_INTERVAL);
            expect(previewCardInterval(newCard, ReviewRating.Good)).toBe(GOOD_INTERVAL);
            expect(previewCardInterval(newCard, ReviewRating.Easy)).toBe(EASY_GRADUATING_INTERVAL);

            // Learning card scenarios (first correct answer was 'Good')
            const learningCard = createTestCard(false, 1, GOOD_INTERVAL);
            expect(previewCardInterval(learningCard, ReviewRating.Good)).toBe(GRADUATING_INTERVAL);
            expect(previewCardInterval(learningCard, ReviewRating.Easy)).toBe(EASY_GRADUATING_INTERVAL);
            expect(previewCardInterval(learningCard, ReviewRating.Hard)).toBe(GOOD_INTERVAL * 1.2);

            // Mature card scenarios
            const matureCard = createTestCard(false, 5, 10 * 24 * 60, 2.5); // 10 days interval, EF 2.5
            expect(previewCardInterval(matureCard, ReviewRating.Again)).toBe(AGAIN_INTERVAL);
            expect(previewCardInterval(matureCard, ReviewRating.Hard)).toBe(matureCard.interval * 1.2);
            expect(previewCardInterval(matureCard, ReviewRating.Good)).toBe(matureCard.interval * 2.5);
            expect(previewCardInterval(matureCard, ReviewRating.Easy)).toBe(matureCard.interval * 2.5 * 1.5);
        }
    },
    {
        name: 'SRS Preview Test: formatInterval correctly formats various durations',
        testFn: () => {
            // Minutes
            expect(formatInterval(0.5)).toBe('<1m');
            expect(formatInterval(1)).toBe('1m');
            expect(formatInterval(59)).toBe('59m');

            // Hours
            expect(formatInterval(60)).toBe('1h');
            expect(formatInterval(90)).toBe('2h'); // rounds up
            expect(formatInterval(23 * 60)).toBe('23h');

            // Days
            expect(formatInterval(24 * 60)).toBe('1d');
            expect(formatInterval(1.6 * 24 * 60)).toBe('2d'); // rounds up
            expect(formatInterval(30 * 24 * 60)).toBe('30d');

            // Months
            const approxMonth = 30.44 * 24 * 60;
            expect(formatInterval(approxMonth)).toBe('1mo');
            expect(formatInterval(approxMonth * 1.5)).toBe('1.5mo');
            expect(formatInterval(approxMonth * 11.9)).toBe('11.9mo');

            // Years
            const approxYear = 365.25 * 24 * 60;
            expect(formatInterval(approxYear)).toBe('1y');
            expect(formatInterval(approxYear * 1.5)).toBe('1.5y');
            expect(formatInterval(approxYear * 2)).toBe('2y');
        }
    }
];