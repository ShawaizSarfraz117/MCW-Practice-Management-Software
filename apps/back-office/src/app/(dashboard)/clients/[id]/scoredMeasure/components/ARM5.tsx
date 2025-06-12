"use client";
import React from "react";

const ARM5_QUESTIONS = [
  "1. My therapist is supportive.",
  "2. My therapist and I agree about how to work together.",
  "3. My therapist and I have difficulty working jointly as a partnership.",
  "4. I have confidence in my therapist and their techniques.",
  "5. My therapist is confident in him/herself and his/her techniques.",
];

const ARM5_OPTIONS = [
  "Strongly Disagree",
  "Disagree",
  "Slightly Disagree",
  "Neutral",
  "Slightly Agree",
  "Agree",
  "Strongly Agree",
];

export default function ARM5Form({
  answers,
  setAnswers,
}: {
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  function handleAnswer(idx: number, value: string) {
    setAnswers((ans) => ans.map((a, i) => (i === idx ? value : a)));
  }

  return (
    <>
      <div className="text-gray-700 mb-2">
        Thinking about today's or the most recent meeting, please indicate how
        strongly you agree or disagree with each statement.
      </div>
      {ARM5_QUESTIONS.map((q, idx) => (
        <div key={idx} className="mb-2">
          <div className="font-medium text-gray-800 mb-1">
            <span className="text-red-600">*</span> {q}
          </div>
          <div className="flex flex-col gap-1 ml-4">
            {ARM5_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-gray-700"
              >
                <input
                  checked={answers[idx] === opt}
                  className="accent-[#2d8467]"
                  name={`arm5q${idx}`}
                  type="radio"
                  value={opt}
                  onChange={() => handleAnswer(idx, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500 mb-2">
        Agnew-Davies, R., Stiles, W. B., Hardy, G. E., Barkham, M., & Shapiro,
        D. A. (1998). Alliance structure assessed by the Agnew Relationship
        Measure (ARM). British Journal of Clinical Psychology, 37(2), 155-172.
        https://doi.org/10.1111/j.2044-8260.1998.tb01291.x
      </div>
    </>
  );
}
