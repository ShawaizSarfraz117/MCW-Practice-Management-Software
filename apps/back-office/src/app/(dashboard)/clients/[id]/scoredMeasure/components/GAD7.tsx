"use client";
import React from "react";

const GAD7_QUESTIONS = [
  "1. Feeling nervous, anxious, or on edge.",
  "2. Not being able to stop or control worrying.",
  "3. Worrying too much about different things.",
  "4. Trouble relaxing.",
  "5. Being so restless that it's hard to sit still.",
  "6. Becoming easily annoyed or irritable.",
  "7. Feeling afraid as if something awful might happen.",
];

const GAD7_OPTIONS = [
  "Not at all",
  "Several days",
  "Over half the days",
  "Nearly every day",
];

const DIFFICULTY_OPTIONS = [
  "Not difficult at all",
  "Somewhat difficult",
  "Very difficult",
  "Extremely difficult",
];

interface GAD7FormProps {
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  difficulty: string;
  setDifficulty: React.Dispatch<React.SetStateAction<string>>;
}

export default function GAD7Form({
  answers,
  setAnswers,
  difficulty,
  setDifficulty,
}: GAD7FormProps) {
  function handleAnswer(idx: number, value: string) {
    setAnswers((ans: string[]) => ans.map((a, i) => (i === idx ? value : a)));
  }

  return (
    <>
      <div className="text-gray-700 mb-2">
        Over the last 2 weeks, how often have you been bothered by the following
        problems?
      </div>
      {GAD7_QUESTIONS.map((q, idx) => (
        <div key={idx} className="mb-2">
          <div className="font-medium text-gray-800 mb-1">
            <span className="text-red-600">*</span> {q}
          </div>
          <div className="flex flex-col gap-1 ml-4">
            {GAD7_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-gray-700"
              >
                <input
                  type="radio"
                  name={`q${idx}`}
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
          problems, how difficult have these made it for you to do your work,
          take care of things at home, or get along with other people?
        </div>
        <div className="flex flex-col gap-1 ml-4">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                name="difficulty"
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
