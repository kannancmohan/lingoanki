# Product Requirements Document: LingoAnki

**Version:** 1.0  
**Status:** Live  
**Author:** AI Senior Frontend Engineer

---

## 1. Introduction & Overview

### 1.1. Product Vision

LingoAnki is a client-side, web-based flashcard application designed for efficient vocabulary acquisition. It empowers self-directed learners to create, manage, and study their own digital card decks using a scientifically-backed Spaced Repetition System (SRS).

### 1.2. Problem Statement

Memorizing a large vocabulary is a significant challenge for language learners and students. Traditional study methods like rereading lists are inefficient and provide no mechanism for prioritizing difficult material. Learners need a tool that intelligently schedules reviews to maximize long-term retention and focus study time where it's most needed.

### 1.3. Target Audience

- **Language Learners:** Individuals studying a new language who need to memorize a large volume of words and phrases.
- **Students:** Individuals studying for exams (e.g., medical, law, history) that require memorization of facts, terms, and definitions.
- **Lifelong Learners:** Anyone looking to memorize paired information, from programming functions to historical dates.

---

## 2. Goals & Objectives

- **Maximize Learning Efficiency:** Implement an SRS algorithm to schedule card reviews at optimal intervals, just before the user is likely to forget them.
- **Provide a Focused User Experience:** Offer a clean, minimalist, and distraction-free interface for both studying and deck management.
- **Empower User Content Creation:** Allow users to easily create and customize their own study materials via a simple and universal format (CSV).
- **Deliver Clear Progress Feedback:** Provide users with actionable, easy-to-understand metrics on both their short-term session performance and long-term quiz mastery.
- **Ensure Accessibility & Portability:** Function entirely within the browser with no backend dependency, making it private, fast, and usable on any modern device.

---

## 3. Core Features & Functionality

### 3.1. Quiz & Card Management

#### 3.1.1. Quiz Creation
- Users can create a new quiz by providing a unique name and uploading a CSV file.
- The CSV file must contain paired data in the format `front_of_card,back_of_card` on each line.
- The system gracefully handles common CSV issues:
    - Ignores empty lines.
    - Trims whitespace from fields.
    - Handles quoted fields (e.g., `"word","translation"`).
- **Import Warnings:** If a line in the CSV is invalid (e.g., missing a comma, has empty fields, or is a duplicate of an existing card), it is skipped, and a warning is presented to the user upon completion. The valid lines are still imported.

#### 3.1.2. Quiz List (Dashboard)
- The main application view displays a list of all created quizzes.
- For each quiz, the following information is displayed:
    - Quiz Name
    - Total number of cards
    - A "Mastery" progress bar and percentage (see Section 3.4.1).
- Users can initiate a study session directly from this list.
- Users can access an "Advanced Settings" modal for each quiz.

#### 3.1.3. Advanced Quiz Management
- **Edit Quiz:** Users can edit the name and the content (cards) of any existing quiz.
- **Edit Cards:** A dedicated editor allows users to:
    - Add new, blank cards.
    - Delete existing cards.
    - Modify the text on the front or back of any card.
    - The system prevents saving if any card has empty fields or if there are duplicate card fronts.
- **Append from CSV:** Users can import additional cards from a CSV file into an existing quiz, skipping any duplicates.
- **Reset Progress:** Users can reset all learning progress for a quiz. This action sets all cards back to a "new" state and resets their mastery score. This requires user confirmation.
- **Delete Quiz:** Users can permanently delete a quiz and all its cards. This action is irreversible and requires user confirmation.

### 3.2. Learning Session

#### 3.2.1. Session Configuration
Before starting a quiz, the user can configure the session with the following options:
- **Direction:**
    - `EN → DE`: Show the first CSV column, ask for the second.
    - `DE → EN`: Show the second CSV column, ask for the first.
    - `Mixed`: Randomly choose the direction for each card.
- **Order:**
    - `Random`: Shuffle all new and due cards for the session.
    - `Sequential`: Prioritize due cards (oldest due first), followed by new cards in their original order.
- **Session Size:** A number defining the maximum cards to be drawn for the session.
- **Repeat Incorrect Cards:** A toggle that, when enabled, places incorrectly answered cards into a special review queue to be seen again at the end of the current session.

#### 3.2.2. The Study Interface
- The interface displays the "front" of a single card.
- A text input field is provided for the user to type the answer. The user can submit with an on-screen button or the `Enter` key.
- The system checks the answer (case-insensitive, ignores leading/trailing whitespace).
- **Immediate Feedback:**
    - The UI border changes color (green for correct, red for incorrect) to provide instant feedback.
    - The correct answer is always displayed.
    - If incorrect, the user's typed answer is also shown for comparison.
- **Rating:** After seeing the answer, four rating buttons appear:
    - `Again (1)`
    - `Hard (2)`
    - `Good (3)`
    - `Easy (4)`
    - Each button displays the calculated next review interval (e.g., `10m`, `4d`).
    - The user can click a button or use the corresponding number key.

#### 3.2.3. Session State & Completion
- **Progress Bar:** A progress bar at the top of the screen tracks the percentage of *unique* cards answered correctly *within the current session*. Incorrect answers do not advance the bar.
- **Card Counters:** A text display shows the number of cards remaining in the main session queue and in the "incorrect" review queue.
- **Session End:** The session concludes when both queues are empty.
- **Summary Screen:** A summary screen displays the session's statistics:
    - Total cards reviewed.
    - Number of correct and incorrect answers.
    - A final score percentage (`correct / total`).
    - Options to "Start Again" (restarts the session with the same settings) or go "Back to Quizzes".

### 3.3. Spaced Repetition System (SRS)

The core logic that determines when a card is next shown to the user.

- **Forced Rating:** If a user types the answer incorrectly, the card's rating is automatically treated as `Again` for the SRS calculation, regardless of which rating button is pressed.
- **Card States:**
    - **New:** A card that has never been rated correctly.
    - **Learning:** A card that has been answered correctly but has not yet "graduated" to a long-term interval. Intervals are short (minutes).
    - **Review (Mature):** A graduated card with a long-term interval (days, months, or years).
- **Rating Logic & Interval Calculation:**
    - `Again`: Resets the card's learning progress (`repetitions = 0`). The card is scheduled for review in a very short interval (~1 minute) and its "ease factor" is significantly reduced.
    - `Hard`: The next interval is slightly longer than the previous one. The card's "ease factor" is slightly reduced.
    - `Good`: The standard response for a correct answer. The next interval is calculated by multiplying the previous interval by the card's "ease factor". For new cards, this sets a standard learning interval (~10 minutes).
    - `Easy`: The next interval is significantly larger than for "Good". The card's "ease factor" is increased. For new cards, this immediately "graduates" the card to a long-term review interval (~4 days).
- **Ease Factor:** A numerical multiplier for each card that determines how quickly its review interval grows. It starts at a default value (2.5) and is adjusted down for `Again`/`Hard` ratings and up for `Easy` ratings.

### 3.4. Statistics & Progress Tracking

#### 3.4.1. Quiz Mastery
- A long-term metric displayed on the quiz list.
- It is calculated based on the `repetitions` count of every card in the quiz.
- Each successful repetition adds to the mastery score, with subsequent repetitions contributing bonus points.
- This score reflects how deeply the material is learned and can exceed 100%.

#### 3.4.2. Card Statistics
- A dedicated page, accessible from "Advanced Settings", provides a detailed, sortable table of all cards in a quiz.
- The table displays:
    - Card Front & Back
    - Times Seen
    - Times Correct
    - Times Incorrect
    - Correctness Percentage
- This allows users to identify and focus on their most difficult cards.
- The table columns are resizable by the user.

---

## 4. Design & UI/UX Principles

- **Theme:** A modern, dark theme to reduce eye strain and create a focused study environment.
- **Layout:** A responsive, single-page application (SPA) design that works seamlessly on desktop and mobile devices.
- **Clarity:** The interface is minimalist, prioritizing the content of the flashcards. Visual cues (colors, icons, progress bars) provide immediate, intuitive feedback.
- **Accessibility:** Keyboard shortcuts are provided for all core actions within the learning loop to improve speed and accessibility.

---

## 5. Non-Functional Requirements & Technical Details

- **Platform:** Web-based, running in all modern browsers (Chrome, Firefox, Safari, Edge).
- **Technology Stack:** React, TypeScript, Tailwind CSS.
- **Data Persistence:** All quiz and user progress data is stored exclusively in the browser's `localStorage`. There is no server-side component. This ensures user privacy and offline functionality.

---

## 6. Future Considerations (Out of Scope for v1.0)

- Cloud synchronization of decks and progress across multiple devices.
- Support for images and audio on flashcards.
- Publicly shareable decks.
- Gamification elements (streaks, achievements).
- Pre-made decks for common subjects.
