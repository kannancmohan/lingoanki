import { isAnswerCorrect, segmentAnswer, normalizeAnswer } from '../../components/AnswerDiffViewer';
import { expect, TestCase } from '../test-utils';

export const answerDiffTests: TestCase[] = [
  {
    name: 'Answer Diff: Perfect match should be correct',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein";
      const user = "ich lade ein, du lädst ein";
      expect(isAnswerCorrect(correct, user)).toBe(true);
    },
  },
  {
    name: 'Answer Diff: Case-sensitive checking (German nouns/grammar)',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein, er/sie/es lädt ein";
      // Lowercase typo in pronoun or verb or pronoun case mismatch
      const user = "ich lade ein, du lädst ein, er/sie/es Lädt ein";
      expect(isAnswerCorrect(correct, user)).toBe(false);
    },
  },
  {
    name: 'Answer Diff: Ignores spacing differences around commas (Case 4)',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein";
      const user = "ich lade ein ,  du lädst ein ";
      expect(isAnswerCorrect(correct, user)).toBe(true);
    },
  },
  {
    name: 'Answer Diff: Ignores multiple spaces inside clauses (Case 4)',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein";
      const user = "ich   lade   ein, du lädst ein";
      expect(isAnswerCorrect(correct, user)).toBe(true);
    },
  },
  {
    name: 'Answer Diff: Handles comma placed right after the word with or without spaces',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein";
      const user1 = "ich lade ein,du lädst ein";
      const user2 = "ich lade ein ,du lädst ein";
      expect(isAnswerCorrect(correct, user1)).toBe(true);
      expect(isAnswerCorrect(correct, user2)).toBe(true);
    },
  },
  {
    name: 'Answer Diff: Detects partial/incomplete answer (Case 1)',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein, er/sie/es lädt ein";
      const user = "ich lade ein, du lädst";
      expect(isAnswerCorrect(correct, user)).toBe(false);
    },
  },
  {
    name: 'Answer Diff: Detects simple spelling mistakes (Case 2 & 3)',
    testFn: () => {
      const correct = "ich lade ein, du lädst ein, er/sie/es lädt ein";
      const user = "ich lade ein, du lädst ein, er/sie/es läd ein";
      expect(isAnswerCorrect(correct, user)).toBe(false);
    },
  }
];
