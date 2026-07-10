import React from 'react';
import { diffChars } from 'diff';

interface AnswerDiffViewerProps {
  correct: string;
  user: string;
}

export const normalizeClause = (clause: string): string => {
  return clause.replace(/\s+/g, ' ').trim();
};

export const segmentAnswer = (answer: string): string[] => {
  if (!answer) return [];
  return answer.split(',').map(clause => normalizeClause(clause)).filter(c => c.length > 0);
};

export const normalizeAnswer = (str: string): string => {
  return str
    .replace(/\s*,\s*/g, ', ')  // normalize spaces around commas to exactly a comma followed by a single space
    .replace(/\s+/g, ' ')       // collapse multiple spaces into one space
    .trim();                    // trim leading/trailing whitespace
};

export const isAnswerCorrect = (correct: string, user: string): boolean => {
  return normalizeAnswer(correct) === normalizeAnswer(user);
};

export const AnswerDiffViewer: React.FC<AnswerDiffViewerProps> = ({ correct, user }) => {
  if (!user || !user.trim()) {
    return null;
  }

  const correctClauses = segmentAnswer(correct);
  const userClauses = segmentAnswer(user);

  const maxLen = Math.max(correctClauses.length, userClauses.length);
  const clausesAligned = [];

  for (let i = 0; i < maxLen; i++) {
    clausesAligned.push({
      correct: i < correctClauses.length ? correctClauses[i] : null,
      user: i < userClauses.length ? userClauses[i] : null,
    });
  }

  return (
    <div className="mt-6 border-t border-slate-700/60 pt-4" id="answer-diff-viewer">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Mistake Analysis
      </h4>
      <div className="flex flex-wrap gap-3">
        {clausesAligned.map((item, idx) => {
          const { correct: correctClause, user: userClause } = item;

          // Case 1: Missing clause (expected in correct, not supplied by user)
          if (userClause === null) {
            return (
              <div
                key={idx}
                id={`diff-clause-missing-${idx}`}
                className="bg-slate-800/40 border border-dashed border-red-500/40 rounded-xl px-4 py-2.5 flex flex-col gap-1 shadow-inner"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <span className="text-slate-400 font-mono text-sm line-through decoration-slate-600/50">
                  {correctClause}
                </span>
              </div>
            );
          }

          // Case 2: Extra clause (supplied by user, not expected in correct)
          if (correctClause === null) {
            return (
              <div
                key={idx}
                id={`diff-clause-extra-${idx}`}
                className="bg-red-950/20 border border-red-500/30 rounded-xl px-4 py-2.5 flex flex-col gap-1 shadow-md"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <span>✗</span>
                  Extra answer
                </div>
                <span className="text-red-300 font-mono text-sm line-through">
                  {userClause}
                </span>
              </div>
            );
          }

          // Case 3: Exact Match
          if (correctClause === userClause) {
            return (
              <div
                key={idx}
                id={`diff-clause-correct-${idx}`}
                className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex flex-col gap-1 shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span>✓</span>
                  Correct
                </div>
                <span className="text-emerald-200 font-mono text-sm font-medium">
                  {correctClause}
                </span>
              </div>
            );
          }

          // Case 4: Misspelled/Typos (run character level diff)
          const diffParts = diffChars(correctClause, userClause);

          return (
            <div
              key={idx}
              id={`diff-clause-typo-${idx}`}
              className="bg-amber-950/10 border border-amber-500/40 rounded-xl px-4 py-2.5 flex flex-col gap-1 shadow-md"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <span>⚠</span>
                Typos detected
              </div>
              <div className="font-mono text-sm flex flex-wrap items-center">
                {diffParts.map((part, pIdx) => {
                  if (part.added) {
                    return (
                      <span
                        key={pIdx}
                        className="bg-red-500/25 text-red-300 line-through rounded-sm px-0.5 mx-0.5 font-bold"
                        title="Extra/incorrect character"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span
                        key={pIdx}
                        className="bg-amber-500/20 text-amber-300 border-b-2 border-amber-500/70 rounded-sm px-0.5 mx-0.5 font-bold"
                        title="Missing character"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  return (
                    <span key={pIdx} className="text-slate-200">
                      {part.value}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
