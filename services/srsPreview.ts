import { Card, ReviewRating } from '../types';
import { AGAIN_INTERVAL, GOOD_INTERVAL, GRADUATING_INTERVAL, EASY_GRADUATING_INTERVAL, HARD_INTERVAL } from '../constants';

// This is the core logic from updateCard, simplified to only return the new interval in minutes.
export const previewCardInterval = (card: Card, rating: ReviewRating): number => {
  let newInterval: number;
  const correct = rating !== ReviewRating.Again;

  if (correct) {
    if (card.repetitions === 0) { // New card -> learning step
      switch (rating) {
        case ReviewRating.Hard:
          newInterval = HARD_INTERVAL;
          break;
        case ReviewRating.Good:
          newInterval = GOOD_INTERVAL; // 10 mins
          break;
        case ReviewRating.Easy:
          newInterval = EASY_GRADUATING_INTERVAL;
          break;
        default:
          newInterval = GOOD_INTERVAL;
          break;
      }
    } else { // Reviewing a card that has been correct at least once.
      if (card.interval <= GOOD_INTERVAL) { // Graduating
        switch (rating) {
          case ReviewRating.Good:
            newInterval = GRADUATING_INTERVAL;
            break;
          case ReviewRating.Easy:
            newInterval = EASY_GRADUATING_INTERVAL;
            break;
          case ReviewRating.Hard:
             // Rated Hard on first review, so it doesn't graduate yet.
             // Repeat with a slightly longer interval.
            newInterval = card.interval * 1.2;
            break;
          default:
            newInterval = GRADUATING_INTERVAL;
            break;
        }
      } else { // It's a mature review card.
        if (rating === ReviewRating.Hard) {
          newInterval = card.interval * 1.2;
        } else if (rating === ReviewRating.Good) {
          newInterval = card.interval * card.easeFactor;
        } else { // Easy
          newInterval = card.interval * card.easeFactor * 1.5;
        }
      }
    }
  } else { // Incorrect answer
    newInterval = AGAIN_INTERVAL;
  }

  return newInterval;
};

/**
 * Formats a duration in minutes into a human-readable string like "10m", "4d", "1.2y".
 */
export const formatInterval = (minutes: number): string => {
    if (minutes < 1) return `<1m`;
    if (minutes < 60) return `${Math.round(minutes)}m`;

    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)}h`;

    const days = hours / 24;
    // Using 30.44 as average days in a month
    if (days < 30.44) {
        const roundedDays = Math.round(days);
        return `${roundedDays}d`;
    }

    const months = days / 30.44;
    if (Math.round(days) < 365) {
        const roundedMonths = parseFloat(months.toFixed(1));
        // Avoid showing ".0" for whole numbers
        return `${roundedMonths % 1 === 0 ? Math.round(roundedMonths) : roundedMonths}mo`;
    }

    const years = days / 365.25;
    const roundedYears = parseFloat(years.toFixed(1));
    // Avoid showing ".0" for whole numbers
    return `${roundedYears % 1 === 0 ? Math.round(roundedYears) : roundedYears}y`;
};