import { Card, Quiz, ReviewRating } from '../types';
import { AGAIN_INTERVAL, GOOD_INTERVAL, MIN_EASE_FACTOR, GRADUATING_INTERVAL, EASY_GRADUATING_INTERVAL, HARD_INTERVAL } from '../constants';

export const selectSessionCards = (quiz: Quiz, sessionSize: number, order: 'random' | 'sequential'): Card[] => {
  const now = Date.now();
  
  // Cards that are not new and are due for review
  const dueReviewCards = quiz.cards
    .filter(card => !card.isNew && card.dueDate <= now);

  // Cards that have never been answered correctly
  const newCards = quiz.cards
    .filter(card => card.isNew);

  let sessionDeck: Card[];

  if (order === 'random') {
    let potentialCards = [...dueReviewCards, ...newCards];
    // Shuffle the entire deck of potential cards for this session
    potentialCards.sort(() => 0.5 - Math.random());
    sessionDeck = potentialCards;
  } else { // 'sequential'
    // Prioritize due cards, sorted by how long they've been due
    dueReviewCards.sort((a, b) => a.dueDate - b.dueDate);
    // New cards are already in the order they were imported
    sessionDeck = [...dueReviewCards, ...newCards];
  }
  
  return sessionDeck.slice(0, sessionSize);
};


export const updateCard = (card: Card, rating: ReviewRating): Card => {
  const updatedCard = { ...card };
  let correct = rating !== ReviewRating.Again;

  if (correct) {
    if (updatedCard.repetitions === 0) { // New card -> learning step
      switch (rating) {
        case ReviewRating.Hard:
          updatedCard.interval = HARD_INTERVAL;
          break;
        case ReviewRating.Good:
          updatedCard.interval = GOOD_INTERVAL; // 10 mins
          break;
        case ReviewRating.Easy:
          // If Easy is selected on a new card, it skips learning and graduates immediately.
          updatedCard.interval = EASY_GRADUATING_INTERVAL;
          updatedCard.easeFactor += 0.15;
          break;
      }
    } else { // Reviewing a card that has been correct at least once.
      // If this is the first review after the initial learning step, graduate it.
      if (updatedCard.interval <= GOOD_INTERVAL) {
        switch (rating) {
          case ReviewRating.Good:
            updatedCard.interval = GRADUATING_INTERVAL;
            break;
          case ReviewRating.Easy:
            updatedCard.interval = EASY_GRADUATING_INTERVAL;
            updatedCard.easeFactor += 0.15;
            break;
          case ReviewRating.Hard:
             // Rated Hard on first review, so it doesn't graduate yet.
             // Repeat with a slightly longer interval.
            updatedCard.interval *= 1.2;
            break;
        }
      } else { // It's a mature review card.
        let newInterval;
        if (rating === ReviewRating.Hard) {
          newInterval = updatedCard.interval * 1.2;
          updatedCard.easeFactor = Math.max(MIN_EASE_FACTOR, updatedCard.easeFactor - 0.15);
        } else if (rating === ReviewRating.Good) {
          newInterval = updatedCard.interval * updatedCard.easeFactor;
        } else { // Easy
          newInterval = updatedCard.interval * updatedCard.easeFactor * 1.5;
          updatedCard.easeFactor += 0.15;
        }
        updatedCard.interval = newInterval;
      }
    }
    updatedCard.repetitions += 1;
    updatedCard.isNew = false;
  } else { // Incorrect answer
    updatedCard.repetitions = 0; // Reset repetition count on failure
    updatedCard.interval = AGAIN_INTERVAL;
    updatedCard.easeFactor = Math.max(MIN_EASE_FACTOR, updatedCard.easeFactor - 0.20);
    // A card is no longer "new" once it has been seen, even if answered incorrectly.
    updatedCard.isNew = false;
  }

  // If a card is failed, it should be due immediately for the next session.
  // For correct answers, schedule it based on its new interval.
  if (rating === ReviewRating.Again) {
    updatedCard.dueDate = Date.now();
  } else {
    const minutes_to_ms = updatedCard.interval * 60 * 1000;
    updatedCard.dueDate = Date.now() + minutes_to_ms;
  }
  
  return updatedCard;
};