import { Card, Quiz, Priority } from '../types';
import { PRIORITY_WEIGHTS } from '../constants';

/**
 * Selects N items for a Quiz from a pool based on user-defined priority weights.
 * The algorithm adapts to edge cases (e.g., empty priority groups) while ensuring fairness and randomness.
 * @param quiz The quiz to select cards from.
 * @param sessionSize The number of cards (N) to select for the session.
 * @returns An array of cards for the session.
 */
export const selectSessionCards = (quiz: Quiz, sessionSize: number): Card[] => {
  const allCards = quiz.cards;
  const totalCards = allCards.length;
  const weights = quiz.priorityWeights || PRIORITY_WEIGHTS;

  // 1. If total items < N, return all items shuffled.
  if (totalCards <= sessionSize) {
    return [...allCards].sort(() => 0.5 - Math.random());
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
    groups[priority].push(card);
  });

  const sessionDeck: Card[] = [];
  let remainingN = sessionSize;
  let remainingWeight = 1.0;

  const priorities: Priority[] = [Priority.High, Priority.Medium, Priority.Low, Priority.Unset];

  // 3. Loop through priorities, selecting cards based on redistributed weights.
  for (const priority of priorities) {
    if (remainingN <= 0) break;

    const group = groups[priority];
    const groupWeight = weights[priority];
    
    // 4. If a group is empty, skip and redistribute its weight.
    if (group.length === 0) {
      remainingWeight -= groupWeight;
      continue;
    }

    // Calculate how many to take from this group based on its share of the *remaining* weight and slots.
    const targetCount = remainingWeight > 0 ? Math.round((groupWeight / remainingWeight) * remainingN) : remainingN;
    const countToTake = Math.min(group.length, targetCount);

    // 5. Use randomized selection within each priority group.
    group.sort(() => 0.5 - Math.random());
    sessionDeck.push(...group.slice(0, countToTake));

    remainingN -= countToTake;
    remainingWeight -= groupWeight;
  }
  
  // 6. If there's a shortfall (due to rounding or empty groups), fill it from any remaining cards.
  if (sessionDeck.length < sessionSize) {
    const deckIds = new Set(sessionDeck.map(c => c.id));
    const remainingCards = allCards
      .filter(c => !deckIds.has(c.id))
      .sort(() => 0.5 - Math.random());
    
    const shortfall = sessionSize - sessionDeck.length;
    sessionDeck.push(...remainingCards.slice(0, shortfall));
  }
  
  // Final shuffle to mix cards from different priority groups.
  return sessionDeck.sort(() => 0.5 - Math.random()).slice(0, sessionSize);
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