import React from 'react';

interface HelpPageProps {
  onBack: () => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 text-slate-300">
      <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors mb-6">&larr; Back to Quizzes</button>
      
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6">How to Use LingoPriority</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">1. Creating a Quiz</h2>
          <p className="mb-2">
            To start learning, you first need to create a quiz. Click the "New Quiz" button on the main screen. You will need to provide:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><span className="font-semibold text-white">A name for your quiz</span> (e.g., "German Top 100 Verbs").</li>
            <li>
              <span className="font-semibold text-white">A CSV file</span> containing your words. The format must be simple: each line should have the word you want to learn, a comma, and its translation.
              <pre className="bg-slate-900 p-3 rounded-lg mt-2 text-sm text-slate-400">
                <code>
                  dog,der Hund<br />
                  cat,die Katze<br />
                  house,das Haus
                </code>
              </pre>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">2. The Learning Session</h2>
          <p>
            Once you start a quiz, you'll be shown a word and asked to type its translation. After you submit your answer, the app will tell you if you were correct and show you the right answer. Then, you'll assign a priority to the card.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">3. Priority-Aware Learning Explained</h2>
          <p className="mb-2">
            This app uses a **Priority-Aware Weighted Random Sampling (PAWRS)** system to help you learn efficiently. Instead of a rigid schedule, you tell the app which cards are difficult for you, and it will prioritize showing them to you in future sessions.
          </p>
          <p className="mb-4 text-sm text-slate-400 italic">
            Your study session is built by selecting cards based on weights. Cards with a higher priority have a higher chance of being included in your next session.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-red-400">Hard (High Priority - Shortcut: 1)</h3>
              <p className="text-sm">Use this if you struggled to recall the answer. Cards with `High` priority have the greatest chance (~40%) of being selected for your next study session. Answering incorrectly automatically sets a card to High.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-orange-400">Medium (Shortcut: 2)</h3>
              <p className="text-sm">Use this if you recalled the answer, but it took some effort. These cards have a moderate chance (~30%) of being selected.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-sky-400">Easy (Low Priority - Shortcut: 3)</h3>
              <p className="text-sm">Use this if you knew the answer instantly. These cards have a low chance (~20%) of being selected, allowing you to focus on more challenging vocabulary.</p>
            </div>
             <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-slate-400">Unset</h3>
              <p className="text-sm">All new, unrated cards start with this priority. They have a small chance (~10%) of being selected, ensuring you are gradually introduced to new material.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">4. Tracking Your Progress & Mastery</h2>
           <p className="mb-2">
            The app helps you visualize your learning progress for each quiz through a "Mastery" score. This score is an average of how well you know all the cards in the deck, based on the priorities you've set.
          </p>
          <ul className="list-disc list-inside space-y-3 pl-4">
            <li>
              <span className="font-semibold text-white">How it's calculated:</span> Each priority level corresponds to a mastery value for that card:
              <ul className="list-['-_'] list-inside pl-4 mt-2">
                  <li><span className="font-semibold text-sky-400">Easy</span> (Low Priority) = 100% Mastered</li>
                  <li><span className="font-semibold text-orange-400">Medium</span> Priority = 50% Mastered</li>
                  <li><span className="font-semibold text-red-400">Hard</span> (High Priority) = 25% Mastered</li>
                  <li><span className="font-semibold text-slate-400">Unset</span> Priority = 0% Mastered</li>
              </ul>
            </li>
             <li className="mt-2">
              The overall quiz mastery is the average of these values across all cards in the deck. The higher your mastery, the more cards you have marked as `Easy`.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};