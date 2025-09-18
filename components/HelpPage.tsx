import React from 'react';
import { AGAIN_INTERVAL, GOOD_INTERVAL, GRADUATING_INTERVAL, EASY_GRADUATING_INTERVAL, HARD_INTERVAL } from '../constants';

interface HelpPageProps {
  onBack: () => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 text-slate-300">
      <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors mb-6">&larr; Back to Quizzes</button>
      
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6">How to Use LingoAnki</h1>

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
            Once you start a quiz, you'll be shown a word (the "front" of the card) and asked to type its translation. After you submit your answer, the app will tell you if you were correct and show you the right answer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">3. Spaced Repetition Explained</h2>
          <p className="mb-2">
            This app uses a Spaced Repetition System (SRS) to help you learn efficiently. The goal is to show you cards just before you're about to forget them. After each card, you rate how well you knew it. This rating determines when you'll see the card next.
          </p>
          <p className="mb-4 text-sm text-slate-400 italic">
            A key concept is "graduation". When you first learn a card, it enters a short "learning phase". Once you pass this phase by answering correctly again, the card "graduates", and its next review is scheduled for much later (e.g., the next day), beginning its long-term review cycle.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-red-400">Again (Shortcut: 1)</h3>
              <p className="text-sm">Use this if you got the answer wrong. The card's progress is reset, and it will be shown to you again in this session in about <span className="font-bold">{AGAIN_INTERVAL} minute</span>.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-orange-400">Hard (Shortcut: 2)</h3>
              <p className="text-sm">Use this if you struggled to recall the answer but eventually got it right. For a new card, this means a short learning review in about <span className="font-bold">{HARD_INTERVAL} minutes</span>. For a learned card, the time until the next review increases by a small amount.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-sky-400">Good (Shortcut: 3)</h3>
              <p className="text-sm">This is the default for a correct answer. For a new card, this puts it into a short learning review (about <span className="font-bold">{GOOD_INTERVAL} minutes</span>). For a learned card, the interval increases significantly (e.g., from 1 day to 3 days, and so on).</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-green-400">Easy (Shortcut: 4)</h3>
              <p className="text-sm">Use this if you knew the answer instantly. For a new card, this graduates it immediately to a long interval (about <span className="font-bold">{EASY_GRADUATING_INTERVAL / 60 / 24} days</span>). For a learned card, the interval will increase even more than 'Good'.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-sky-400 mb-3">4. Tracking Your Progress & Mastery</h2>
           <p className="mb-2">
            The app helps you visualize your learning progress for each quiz through a "Mastery" score, visible on the main list and during a session.
          </p>
          <ul className="list-disc list-inside space-y-3 pl-4">
            <li>
              <span className="font-semibold text-white">What it means:</span> Mastery is a score that reflects not just which cards you've learned, but also how well you know them. It starts at 0% and increases as you learn new cards and correctly review existing ones. The score can go above 100% to show that you are strengthening your memory of cards you've already learned.
            </li>
            <li>
              <span className="font-semibold text-white">How it's calculated:</span> Every card in the deck contributes points to the mastery score. A new card is worth 0 points. When you learn a card for the first time, it contributes towards the 100% mark. Each additional time you review it correctly, it contributes a little more, pushing the score beyond 100% to show deeper learning.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};