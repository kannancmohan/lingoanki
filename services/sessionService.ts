import { Card, Quiz, Priority } from '../types';
import { PRIORITY_WEIGHTS } from '../constants';

/**
 * Fisher-Yates (Knuth) shuffle algorithm to produce an unbiased random permutation of an array.
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Selects N items for a Quiz from a pool based on user-defined priority weights.
 * The algorithm adapts to edge cases (e.g., empty priority groups) while ensuring fairness and randomness.
 * @param quiz The quiz to select cards from.
 * @param sessionSize The number of cards (N) to select for the session.
 * @returns An array of cards for the session.
 */
export const selectSessionCards = (quiz: Quiz, sessionSize: number): Card[] => {
  const allCards = quiz.cards || [];
  const totalCards = allCards.length;
  const weights: Record<Priority, number> = {
    ...PRIORITY_WEIGHTS,
    ...(quiz.priorityWeights || {}),
  };

  // 1. If total items <= N, return all items shuffled.
  if (totalCards <= sessionSize) {
    return shuffleArray(allCards);
  }

  // 2. Group cards by priority.
  const groups: Record<Priority, Card[]> = {
    [Priority.High]: [],
    [Priority.Medium]: [],
    [Priority.Low]: [],
    [Priority.Unset]: [],
  };
  allCards.forEach(card => {
    const priority = card.priority || Priority.Unset;
    if (groups[priority]) {
      groups[priority].push(card);
    } else {
      groups[Priority.Unset].push(card);
    }
  });

  const sessionDeck: Card[] = [];
  let remainingN = sessionSize;
  let remainingWeight = 1.0;

  const priorities: Priority[] = [Priority.High, Priority.Medium, Priority.Low, Priority.Unset];

  // 3. Loop through priorities, selecting cards based on redistributed weights.
  for (const priority of priorities) {
    if (remainingN <= 0) break;

    const group = groups[priority];
    const groupWeight = weights[priority] ?? PRIORITY_WEIGHTS[priority];
    
    // 4. If a group is empty, skip and redistribute its weight.
    if (group.length === 0) {
      remainingWeight -= groupWeight;
      continue;
    }

    // Calculate how many to take from this group based on its share of the *remaining* weight and slots.
    const targetCount = remainingWeight > 0 ? Math.round((groupWeight / remainingWeight) * remainingN) : remainingN;
    const countToTake = Math.min(group.length, Math.max(0, targetCount));

    // 5. Use randomized selection within each priority group.
    const shuffledGroup = shuffleArray(group);
    sessionDeck.push(...shuffledGroup.slice(0, countToTake));

    remainingN -= countToTake;
    remainingWeight -= groupWeight;
  }
  
  // 6. If there's a shortfall (due to rounding or empty groups), fill it from any remaining cards.
  if (sessionDeck.length < sessionSize) {
    const deckIds = new Set(sessionDeck.map(c => c.id));
    const remainingCards = shuffleArray(allCards.filter(c => !deckIds.has(c.id)));
    
    const shortfall = sessionSize - sessionDeck.length;
    sessionDeck.push(...remainingCards.slice(0, shortfall));
  }
  
  // Final shuffle to mix cards from different priority groups.
  return shuffleArray(sessionDeck).slice(0, sessionSize);
};


/**
 * Updates a card's priority.
 * @param card The card to update.
 * @param priority The new priority to set.
 * @returns The updated card.
 */
export const updateCard = (card: Card, priority: Priority): Card => {
  return { ...card, priority };
};

/**
 * Formats seconds into a digital time string (mm:ss or hh:mm:ss).
 * @param totalSeconds The elapsed time in seconds.
 * @returns Digital formatted time string (e.g., "00:05", "12:34", "01:02:03").
 */
export const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};