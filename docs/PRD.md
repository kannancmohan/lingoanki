# Product Requirements Document: LingoPriority

**Version:** 1.0
**Status:** Live
**Author:** AI Senior Frontend Engineer

---

## 1. Introduction & Overview

### 1.1. Product Vision

LingoPriority is a client-side, web-based flashcard application designed for efficient vocabulary acquisition. It empowers self-directed learners to create, manage, and study their own digital card decks using a **Priority-Aware Weighted Random Sampling (PAWRS)** system.

### 1.2. Problem Statement

Memorizing a large vocabulary is a significant challenge. Learners need a tool that allows them to focus their study time on the material they find most difficult, rather than following a rigid, predetermined schedule.

### 1.3. Target Audience

- **Language Learners:** Individuals who need to memorize a large volume of words and phrases.
- **Students:** Individuals studying for exams that require memorization of facts and terms.
- **Lifelong Learners:** Anyone looking to memorize paired information.

---

## 2. Goals & Objectives

- **Maximize Learning Efficiency:** Implement the PAWRS algorithm to build study sessions that are weighted towards more difficult material, as defined by the user.
- **Provide a Focused User Experience:** Offer a clean, minimalist, and distraction-free interface for both studying and deck management.
- **Empower User Content Creation:** Allow users to easily create and customize their own study materials via CSV.
- **Deliver Clear Progress Feedback:** Provide users with an intuitive "Mastery" score based on the priorities they have assigned to their cards.
- **Ensure Accessibility & Portability:** Function entirely within the browser with no backend dependency, making it private, fast, and usable on any modern device.

---

## 3. Core Features & Functionality

### 3.1. Quiz & Card Management

#### 3.1.1. Quiz Creation
- Users can create a new quiz by providing a unique name and uploading a CSV file (`front,back`).
- All new cards are created with a default priority of `Unset`.
- The system gracefully handles common CSV issues and provides warnings for skipped lines.

#### 3.1.2. Quiz List (Dashboard)
- The main view displays a list of all created quizzes.
- Each quiz shows its name, card count, and a "Mastery" progress bar and percentage.
- Users can initiate a study session or access advanced settings for each quiz.

#### 3.1.3. Advanced Quiz Management
- **Edit Quiz:** Users can edit the quiz name and manage its cards.
- **Edit Cards:** A dedicated editor allows adding, deleting, or modifying cards.
- **Append from CSV:** Users can import additional cards into an existing quiz.
- **Reset Priorities:** Users can reset all card priorities in a quiz back to `Unset`. This action requires confirmation.
- **Delete Quiz:** Users can permanently delete a quiz. This action requires confirmation.

### 3.2. Learning Session

#### 3.2.1. Session Configuration
Before starting a quiz, the user can configure:
- **Session Size:** The number of cards to include in the study session.
- **Repeat Incorrect Cards:** A toggle that, when enabled, places incorrectly answered cards into a review queue to be seen again at the end of the current session.

#### 3.2.2. The Study Interface
- The interface displays the "front" of a card and provides a text input for the answer.
- **Immediate Feedback:** The UI provides instant visual feedback (green/red) on the correctness of the answer.
- **Prioritization:** After seeing the answer, three priority buttons appear:
    - `Hard (High Priority - 1)`
    - `Medium (2)`
    - `Easy (Low Priority - 3)`
    - Answering incorrectly automatically sets the card's priority to `High`.
    - Users can click a button or use the corresponding number key.

#### 3.2.3. Session Completion
- A summary screen displays the session's statistics (correct, incorrect, total, score).
- Options are provided to "Start Again" or go "Back to Quizzes".

### 3.3. Priority-Aware Weighted Random Sampling (PAWRS)

The core logic that determines which cards are selected for a session.

- **Weighted Selection:** The algorithm assembles a session deck by drawing cards from four priority groups based on the following weights:
    - **High:** 40%
    - **Medium:** 20%
    - **Low:** 5%
    - **Unset:** 35%
- **Dynamic Weight Redistribution:** If a priority group is empty or has fewer cards than its target allotment, its weight is automatically redistributed among the remaining groups. This ensures the session is always full and intelligently adapts to the state of the deck.
- **Randomization:** Selection within each group is random to prevent seeing the same cards in the same order. The final deck is also shuffled.

### 3.4. Statistics & Progress Tracking

#### 3.4.1. Quiz Mastery
- A long-term metric that provides an at-a-glance understanding of how well a quiz is known.
- It is calculated as the average "mastery score" of all cards in the deck, where:
    - `Low` priority = 100% mastery
    - `Medium` priority = 50% mastery
    - `High` priority = 25% mastery
    - `Unset` priority = 0% mastery

#### 3.4.2. Card Statistics
- A dedicated page provides a sortable table of all cards in a quiz.
- The table displays:
    - Card Front & Back
    - Current Priority
    - Times Seen, Correct, Incorrect
    - Correctness Percentage
- This allows users to identify their most difficult cards.

---

## 4. Design & UI/UX Principles

- **Theme:** A modern, dark theme.
- **Layout:** A responsive, single-page application (SPA) design.
- **Clarity:** A minimalist interface that prioritizes content and provides intuitive feedback.
- **Accessibility:** Keyboard shortcuts are provided for all core actions.

---

## 5. Non-Functional Requirements & Technical Details

- **Platform:** Web-based, running in all modern browsers.
- **Technology Stack:** React, TypeScript, Tailwind CSS.
- **Data Persistence:** All data is stored exclusively in the browser's `localStorage`.