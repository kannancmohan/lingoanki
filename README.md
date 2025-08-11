# LingoAnki - German Learner

A simple Anki-like application to help you learn German words through interactive quizzes. Import your own word lists via CSV, track your progress with a spaced repetition system, and master your vocabulary.

![LingoAnki Screenshot](https://placehold.co/800x450/0f172a/ffffff?text=LingoAnki+App+UI)

---

## ✨ Features

- **CSV Import**: Easily create new quizzes by uploading a `.csv` file of words and translations.
- **Spaced Repetition System (SRS)**: An intelligent algorithm schedules reviews to maximize learning efficiency.
- **Interactive Quizzes**: Engage with your vocabulary through a clean and focused quiz interface.
- **Progress Tracking**: Monitor your mastery for each quiz. Mastery is a score that grows as you learn new cards and strengthen your memory of existing ones through repeated, correct reviews. This score can go beyond 100% to reflect deep learning.
- **Keyboard Shortcuts**: Learn faster with keyboard controls for rating cards (1-4).
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

3.  **Run the app**:
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
    - Upload the file and create the quiz.

2.  **Start Learning**:
    - Click on your new quiz from the list to start a session.
    - Type the translation and press Enter.
    - After the answer is revealed, rate your recall using the buttons or number keys (1-4) to schedule the next review.

## 🧪 Running Tests

This project includes a simple, in-browser test suite for verifying core functionality.

1.  **Start the development server**:
    ```bash
    # With Nix
    nix develop
    make run
    
    # Without Nix
    npm run dev
    ```

2.  **Open the Test Runner**:
    Once the server is running, navigate to the following URL in your browser:
    [`http://localhost:5173/test/index.html`](http://localhost:5173/test/index.html)

3.  **Run the Tests**:
    Click the "Run All Tests" button to execute the test suite. The results will be displayed on the page.

The tests run in an isolated manner, clearing any stored data before each test case to ensure there are no side effects.

---

This project is a local-first application. All your quizzes and progress are saved in your browser's `localStorage`.