# Plan: Highlighting Mistakes in Quiz Answers

This document outlines the detailed strategy to implement the feature that highlights what went wrong when a user answers a question incorrectly. This is designed for an AI or developer to implement the feature without any further user intervention.

---

## 1. Core Requirements & Constraints

*   **Case Sensitivity (German Grammar)**: Case matters! Do **NOT** convert the answers to lowercase during comparison or highlighting. German nouns must be capitalized, and verbs/pronouns must be correctly cased.
*   **Spaces & Comma Robustness (Case 4)**: 
    *   Extra spaces (leading, trailing, or multiple spaces in between words) must be ignored and treated as correct.
    *   Punctuation such as commas `,` must be handled robustly, regardless of whether spaces are placed before or after them (e.g., `"ich lade ein,"` vs `"ich lade ein ,"`).
*   **Assuming Well-Structured Correct Answers**: The correct answer in the database/JSON is assumed to be well-structured and doesn't require complex healing. We only need to normalize the user input to check against it.
*   **Different Typo Scenarios**:
    1.  *Partial Answer*: The user only typed some of the clauses (e.g., `"ich lade ein, du lädst "`).
    2.  *Single/Few Spelling Mistakes*: The user wrote a full answer but misspelled a word (e.g., `"er/sie/es läd ein"` instead of `"er/sie/es lädt ein"`).
    3.  *Multiple Spelling Mistakes*: Multiple typos across clauses (e.g., `"ihr lad ein"` instead of `"ihr ladet ein"`).

---

## 2. Recommended Library: `diff` (jsdiff)

To perform character-by-character and word-by-word diffing, we will use the **`diff`** package (commonly known as `jsdiff`):
*   **Popularity**: Over 30M weekly downloads, zero external dependencies.
*   **Open Source & Well-Maintained**: Yes, the standard in the JS/TS ecosystem.
*   **Compatibility**: Perfect for React, Vite, and TypeScript.
*   **Installation Needed**:
    ```bash
    npm install diff
    npm install --save-dev @types/diff
    ```

---

## 3. Algorithmic Strategy

To handle both **partial answers** and **spelling mistakes** cleanly, we will use a **Clause-by-Clause Alignment + Diffing** strategy. 

Since German conjugations or lists are separated by commas `,`, we can segment both the correct answer and the user's answer into individual clauses.

### Step A: Clause Segmentation & Cleaning
1.  **Split by Comma**: Split the correct answer and user's answer by the comma character `,`.
2.  **Normalize Whitespace per Clause**: For each split clause:
    *   Trim leading and trailing whitespace.
    *   Replace internal multiple spaces with a single space (e.g., `str.replace(/\s+/g, ' ')`).
3.  **Resulting Arrays**:
    *   `correctClauses`: `["ich lade ein", "du lädst ein", "er/sie/es lädt ein", ...]`
    *   `userClauses`: `["ich lade ein", "du lädst"]` (for Case 1)

### Step B: Exact Match Validation (Robust Check)
Before doing any highlighting, we check if the overall answer is correct:
1.  If `correctClauses.length !== userClauses.length`, it is **Incorrect**.
2.  Otherwise, compare each `correctClauses[i]` with `userClauses[i]` (with case preserved).
3.  If all clauses match perfectly after space normalization, the answer is **Correct**.

### Step C: Highlight Generation (When Incorrect)
For rendering the feedback, we map over the `correctClauses` and align them with the `userClauses`:

```typescript
interface ClauseDiff {
  correctText: string;
  userText: string | null; // null if clause is entirely missing (partial answer)
  isPerfectMatch: boolean;
  diffParts?: { value: string; added?: boolean; removed?: boolean }[];
}
```

For each index `i` of `correctClauses`:
1.  **Case 1: Clause is Missing** (i.e., `i >= userClauses.length`):
    *   Mark as missing/unanswered.
    *   Render the correct clause in a muted style (e.g., gray or red strikethrough/outline) to show it was expected but omitted.
2.  **Case 2: Clause is Present and Matches Exactly**:
    *   Mark `isPerfectMatch = true`.
    *   Render the clause in **green**.
3.  **Case 3: Clause is Present but has Typos**:
    *   Run `diffChars(correctClause, userClause)` using the `diff` library.
    *   This returns an array of diff segments:
        *   `removed: true` => Characters that should be in the answer but were missed/wrong. Render in **light red background / white text** or **underlined green** to show what was expected.
        *   `added: true` => Extra or incorrect characters typed by the user. Render in **strikethrough red / red text**.
        *   `normal` => Correct characters. Render in **standard green / white text**.

---

## 4. UI Design & Component Layout

In `/components/QuizSession.tsx`, when `isAnswered` is true and `isCorrect` is false, we will replace the simple `"Your answer: ..."` text with a beautifully styled interactive difference viewer.

### Visual Mockup:
```
❌ Incorrect
-------------------------------------------------------------
Correct Conjugations:
[ ich lade ein ]  [ du lädst ein ]  [ er/sie/es lädt ein ] ...
  (Correct)         (Typos!)          (Missing)
                    du lädst [ein]    [er/sie/es lädt ein]
-------------------------------------------------------------
```

Within each tag/bubble representing a clause:
*   If correct: Render a pill with a green border and checkmark.
*   If misspelled: Render a pill with a yellow/red border, showing the character-by-character diff inside (e.g., green for correct letters, red for wrong letters, highlighted placeholder for missing letters).
*   If missing: Render a dashed pill with gray text indicating it wasn't supplied.

---

## 5. Step-by-Step Implementation Task Checklist for the AI

1.  **Install dependencies**:
    *   Run `npm install diff` and `npm install --save-dev @types/diff`.
2.  **Create Diff Component**:
    *   Create a new file `/components/AnswerDiffViewer.tsx`.
    *   Implement the clause-based splitting and `diff` character highlighting logic.
3.  **Integrate with `/components/QuizSession.tsx`**:
    *   Update the `handleCheckAnswer` function to use the cased, space-and-comma-robust alignment logic.
    *   Import and render `<AnswerDiffViewer correct={currentCard.back} user={userInput} />` under the `"Incorrect"` message box.
4.  **Verify & Test**:
    *   Run `npm run lint` and `npm run build` to ensure types and compilation pass perfectly.
