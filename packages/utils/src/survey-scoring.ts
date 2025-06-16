/**
 * Survey scoring utilities for GAD-7, PHQ-9, and ARM-5
 */

export interface SurveyScore {
  totalScore: number;
  severity?: string;
  interpretation?: string;
  flaggedItems?: string[];
}

/**
 * Calculate GAD-7 score
 */
export function calculateGAD7Score(
  answers: Record<string, string>,
): SurveyScore {
  const scoreMap: Record<string, number> = {
    "Item 1": 0, // Not at all
    "Item 2": 1, // Several days
    "Item 3": 2, // Over half the days
    "Item 4": 3, // Nearly every day
  };

  let totalScore = 0;
  // GAD-7 has 7 main questions plus question 8 (difficulty/impairment)
  const questions = [
    "gad7_q1",
    "gad7_q2",
    "gad7_q3",
    "gad7_q4",
    "gad7_q5",
    "gad7_q6",
    "gad7_q7",
    "gad7_q8",
  ];

  questions.forEach((question) => {
    if (answers[question] && scoreMap[answers[question]] !== undefined) {
      totalScore += scoreMap[answers[question]];
    }
  });

  let severity = "";
  let interpretation = "";

  if (totalScore >= 0 && totalScore <= 4) {
    severity = "Minimal";
    interpretation = "Minimal anxiety";
  } else if (totalScore >= 5 && totalScore <= 9) {
    severity = "Mild";
    interpretation = "Mild anxiety";
  } else if (totalScore >= 10 && totalScore <= 14) {
    severity = "Moderate";
    interpretation = "Moderate anxiety";
  } else if (totalScore >= 15 && totalScore <= 21) {
    severity = "Severe";
    interpretation = "Severe anxiety";
  }

  return {
    totalScore,
    severity,
    interpretation,
  };
}

/**
 * Calculate PHQ-9 score
 */
export function calculatePHQ9Score(
  answers: Record<string, string>,
): SurveyScore {
  const scoreMap: Record<string, number> = {
    "Item 1": 0, // Not at all
    "Item 2": 1, // Several days
    "Item 3": 2, // More than half the days
    "Item 4": 3, // Nearly every day
  };

  let totalScore = 0;
  // PHQ-9 main score uses first 9 questions only
  const questions = [
    "phq9_q1",
    "phq9_q2",
    "phq9_q3",
    "phq9_q4",
    "phq9_q5",
    "phq9_q6",
    "phq9_q7",
    "phq9_q8",
    "phq9_q9",
  ];
  const flaggedItems: string[] = [];

  questions.forEach((question) => {
    if (answers[question] && scoreMap[answers[question]] !== undefined) {
      totalScore += scoreMap[answers[question]];
    }
  });

  // Check suicidal ideation question (question 9)
  if (answers["phq9_q9"] && answers["phq9_q9"] !== "Item 1") {
    flaggedItems.push(
      "Suicidal ideation reported - requires immediate clinical attention",
    );
  }

  // Check functional impairment question (question 10) for suicidal ideation flagging only
  // Note: q10 is NOT included in the total score per standard PHQ-9 scoring
  if (answers["phq9_q10"] && answers["phq9_q10"] !== "Item 1") {
    flaggedItems.push(
      "Suicidal ideation reported - requires immediate clinical attention",
    );
  }

  let severity = "";
  let interpretation = "";

  if (totalScore >= 0 && totalScore <= 4) {
    severity = "None-Minimal";
    interpretation = "None to minimal depression";
  } else if (totalScore >= 5 && totalScore <= 9) {
    severity = "Mild";
    interpretation = "Mild depression";
  } else if (totalScore >= 10 && totalScore <= 14) {
    severity = "Moderate";
    interpretation = "Moderate depression";
  } else if (totalScore >= 15 && totalScore <= 19) {
    severity = "Moderately Severe";
    interpretation = "Moderately severe depression";
  } else if (totalScore >= 20 && totalScore <= 27) {
    severity = "Severe";
    interpretation = "Severe depression";
  }

  return {
    totalScore,
    severity,
    interpretation,
    flaggedItems: flaggedItems.length > 0 ? flaggedItems : undefined,
  };
}

/**
 * Calculate ARM-5 score
 */
export function calculateARM5Score(
  answers: Record<string, string>,
): SurveyScore {
  const scoreMap: Record<string, number> = {
    "Item 1": 1, // Strongly Disagree
    "Item 2": 2, // Disagree
    "Item 3": 3, // Slightly Disagree
    "Item 4": 4, // Neutral
    "Item 5": 5, // Slightly Agree
    "Item 6": 6, // Agree
    "Item 7": 7, // Strongly Agree
  };

  let totalScore = 0;
  // ARM-5 only has 4 questions in the common implementation
  const questions = ["arm5_q1", "arm5_q2", "arm5_q3", "arm5_q4"];

  questions.forEach((question) => {
    if (answers[question] && scoreMap[answers[question]] !== undefined) {
      totalScore += scoreMap[answers[question]];
    }
  });

  // ARM-5 interpretation (for 4-item version, scale 4-28)
  let interpretation = "";
  const averageScore = totalScore / 4;

  if (averageScore >= 6.5) {
    interpretation = "Strong therapeutic alliance";
  } else if (averageScore >= 5.5) {
    interpretation = "Good therapeutic alliance";
  } else if (averageScore >= 4) {
    interpretation = "Moderate therapeutic alliance";
  } else if (averageScore >= 2.5) {
    interpretation = "Weak therapeutic alliance";
  } else {
    interpretation = "Poor therapeutic alliance";
  }

  return {
    totalScore,
    interpretation,
  };
}

/**
 * Calculate score based on survey type
 */
export function calculateSurveyScore(
  surveyType: string,
  answers: Record<string, string>,
): SurveyScore {
  switch (surveyType.toUpperCase()) {
    case "GAD-7":
      return calculateGAD7Score(answers);
    case "PHQ-9":
      return calculatePHQ9Score(answers);
    case "ARM-5":
      return calculateARM5Score(answers);
    default:
      return { totalScore: 0 };
  }
}

/**
 * Get survey type from template name
 */
export function getSurveyType(templateName: string): string | null {
  const normalizedName = templateName.toUpperCase();
  if (normalizedName.includes("GAD-7")) return "GAD-7";
  if (normalizedName.includes("PHQ-9")) return "PHQ-9";
  if (normalizedName.includes("ARM-5")) return "ARM-5";
  return null;
}
