# LingoPriority - Vocabulary Trainer

A smart flashcard application designed to help you learn vocabulary efficiently using a **Priority-Aware Weighted Random Sampling (PAWRS)** system. Import your own word lists via CSV, prioritize cards based on difficulty, and master your vocabulary.

![LingoPriority Screenshot](https://placehold.co/800x450/0f172a/ffffff?text=LingoPriority+App+UI)

---

## ✨ Features

- **CSV Import**: Easily create new quizzes by uploading a `.csv` file of words and translations.
- **Priority-Aware Weighted Random Sampling (PAWRS)**: Instead of a rigid schedule, this system intelligently selects cards for your session based on priorities you set. More difficult cards appear more frequently.
- **Interactive Quizzes**: Engage with your vocabulary through a clean and focused quiz interface.
- **Progress Tracking**: Monitor your "Mastery" for each quiz, a score that reflects how well you know the material based on your assigned priorities.
- **Keyboard Shortcuts**: Learn faster with keyboard controls for rating cards (1-3).
- **Fully Responsive**: Learn on any device, desktop or mobile.
- **No Backend Needed**: Runs entirely in your browser using `localStorage`.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Development Environment**: [Nix](https://nixos.org/) (optional)

## 🚀 Getting Started

There are two ways to set up the development environment: using Nix (recommended for reproducibility) or using Node.js directly.

### Prerequisites

- **With Nix**:
  - [Nix package manager](https://nixos.org/download.html) installed with Flakes enabled.
- **Without Nix**:
  - [Node.js](https://nodejs.org/) (v22 or later recommended)
  - [npm](https://www.npmjs.com/) (comes with Node.js)

---

### 1. With Nix (Recommended)

This is the easiest way to get a fully configured development environment.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Activate the development shell**:
    This command reads the `flake.nix` file and provides all the necessary dependencies (like Node.js) in a sandboxed environment. It will also automatically run `npm install` for you if `node_modules` is missing.
    ```bash
    nix develop
    ```

4.  **Install dependencies**:
    Use the provided `Makefile` for convenience.
    ```bash
    make install
    ```

5. **Re-Install dependencies**:
   delete existing node_modules directory and the package-lock.json and run 
   ```bash
    make install
    ```
    
6.  **Run the app**:
    Use the provided `Makefile` for convenience.
    ```bash
    # Start the development server
    make run
    ```
    The application will be available at `http://localhost:5173`.

---

### 2. Without Nix (Manual Setup)

If you prefer not to use Nix, you can install the dependencies on your system directly.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies**:
    This will install React, Vite, and other required packages.
    ```bash
    npm install
    ```

3.  **Run the development server**:
    Assuming your `package.json` has a "dev" script like `"dev": "vite"`.
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## How to Use

1.  **Create a Quiz**:
    - Click on "New Quiz".
    - Give your quiz a name (e.g., "Common Nouns").
    - Prepare a `.csv` file with your vocabulary. Each line should be `word,translation`. For example:
      ```csv
      book,das Buch
      water,das Wasser
      street,die Straße
      ```
    - Upload the file and create the quiz. All new cards start with "Unset" priority.

2.  **Start Learning**:
    - Click on your new quiz from the list to start a session.
    - Type the translation and press Enter.
    - After the answer is revealed, assign a priority using the buttons or number keys (1-3). This tells the app how often to show you the card in future sessions.

### Understanding the Priorities

The PAWRS algorithm uses weights to build your study session. Cards with a higher priority are more likely to be included.

*   **Hard (High Priority - 1)**: You didn't know the answer or struggled a lot. These cards have the **highest chance (40%)** of appearing in a session. Answering incorrectly automatically sets a card to High priority.
*   **Medium (2)**: You hesitated but got it right. These cards have a **medium chance (20%)** of appearing.
*   **Easy (Low Priority - 3)**: You knew it instantly. These cards have the **lowest chance (5%)** of appearing, so you can focus on more difficult material.
*   **Unset**: New cards that haven't been rated yet. They have a **significant chance (35%)** of being chosen, ensuring you're introduced to new material more quickly.

## 🧪 Running Tests

This project includes an in-browser test suite.

1.  **Start the development server**: `npm run dev`
2.  **Open the Test Runner**: Navigate to [`http://localhost:5173/test/index.html`](http://localhost:5173/test/index.html) in your browser.
3.  **Run the Tests**: Click the "Run All Tests" button.

---

This project is a local-first application. All your quizzes and progress are saved in your browser's `localStorage`.