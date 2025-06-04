"use client";
import React from "react";

const PHQ9_QUESTIONS = [
  "1. Little interest or pleasure in doing things.",
  "2. Feeling down, depressed, or hopeless.",
  "3. Trouble falling or staying asleep, or sleeping too much.",
  "4. Feeling tired or having little energy.",
  "5. Poor appetite or overeating.",
  "6. Feeling bad about yourself — or that you are a failure or have let yourself or your family down.",
  "7. Trouble concentrating on things, such as reading the newspaper or watching television.",
  "8. Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual.",
  "9. Thoughts that you would be better off dead or of hurting yourself in some way.",
];

const PHQ9_OPTIONS = [
  "Not at all",
  "Several days",
  "More than half the days",
  "Nearly every day",
];

const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult",
];

export default function PHQ9Form({
  answers,
  setAnswers,
  difficulty,
  setDifficulty,
}: {
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  difficulty: string;
  setDifficulty: React.Dispatch<React.SetStateAction<string>>;
}) {
  function handleAnswer(idx: number, value: string) {
    setAnswers((ans) => ans.map((a, i) => (i === idx ? value : a)));
  }

  return (
    <>
      <div className="text-gray-700 mb-2">
        Over the last 2 weeks, how often have you been bothered by any of the
        following?
      </div>
      {PHQ9_QUESTIONS.map((q, idx) => (
        <div key={idx} className="mb-2">
          <div className="font-medium text-gray-800 mb-1">
            <span className="text-red-600">*</span> {q}
          </div>
          <div className="flex flex-col gap-1 ml-4">
            {PHQ9_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-gray-700"
              >
                <input
                  type="radio"
                  name={`phq9q${idx}`}
                  value={opt}
                  checked={answers[idx] === opt}
                  onChange={() => handleAnswer(idx, opt)}
                  className="accent-[#2d8467]"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      {/* Difficulty Question */}
      <div className="mb-2">
        <div className="font-medium text-gray-800 mb-1">
          <span className="text-red-600">*</span> If you checked off any
          problems on this questionnaire so far, how difficult have these
          problems made it for you to do your work, take care of things at home,
          or get along with other people?
        </div>
        <div className="flex flex-col gap-1 ml-4">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                name="phq9difficulty"
                value={opt}
                checked={difficulty === opt}
                onChange={() => setDifficulty(opt)}
                className="accent-[#2d8467]"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-2">
        Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke
        and colleagues.
      </div>
    </>
  );
}
