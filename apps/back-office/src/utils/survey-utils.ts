import { GAD7Content } from "@/types/survey-answer";

// Survey types
export interface PHQ9Content {
  phq9_q1?: string;
  phq9_q2?: string;
  phq9_q3?: string;
  phq9_q4?: string;
  phq9_q5?: string;
  phq9_q6?: string;
  phq9_q7?: string;
  phq9_q8?: string;
  phq9_q9?: string;
  phq9_q10?: string;
}

export interface ARM5Content {
  arm5_q1?: string;
  arm5_q2?: string;
  arm5_q3?: string;
  arm5_q4?: string;
  arm5_q5?: string;
}

export interface BaseQuestion {
  id: number;
  question: string;
  response: string;
  score: string;
  sinceLast: string;
  sinceBaseline: string;
}

// Survey questions
export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge.",
  "Not being able to stop or control worrying.",
  "Worrying too much about different things.",
  "Trouble relaxing.",
  "Being so restless that it's hard to sit still.",
  "Becoming easily annoyed or irritable.",
  "Feeling afraid as if something awful might happen.",
];

export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things.",
  "Feeling down, depressed, or hopeless.",
  "Trouble falling or staying asleep, or sleeping too much.",
  "Feeling tired or having little energy.",
  "Poor appetite or overeating.",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down.",
  "Trouble concentrating on things, such as reading the newspaper or watching television.",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual.",
  "Thoughts that you would be better off dead or of hurting yourself in some way.",
];

export const ARM5_QUESTIONS = [
  "My therapist is supportive.",
  "My therapist and I agree about how to work together.",
  "My therapist and I have difficulty working jointly as a partnership.",
  "I have confidence in my therapist and their techniques.",
  "My therapist is confident in him/herself and his/her techniques.",
];

// Response labels
export const RESPONSE_LABELS: Record<string, string> = {
  "Item 1": "Not at all",
  "Item 2": "Several days",
  "Item 3": "Over half the days",
  "Item 4": "Nearly every day",
};

export const RESPONSE_SCORES: Record<string, number> = {
  "Item 1": 0,
  "Item 2": 1,
  "Item 3": 2,
  "Item 4": 3,
};

export const ARM5_RESPONSE_LABELS: Record<string, string> = {
  "Item 1": "Strongly Disagree",
  "Item 2": "Disagree",
  "Item 3": "Slightly Disagree",
  "Item 4": "Neutral",
  "Item 5": "Slightly Agree",
  "Item 6": "Agree",
  "Item 7": "Strongly Agree",
};

export const ARM5_RESPONSE_SCORES: Record<string, number> = {
  "Item 1": 1,
  "Item 2": 2,
  "Item 3": 3,
  "Item 4": 4,
  "Item 5": 5,
  "Item 6": 6,
  "Item 7": 7,
};

// Mapping functions
export function mapGAD7ContentToQuestions(
  content: GAD7Content | null,
): BaseQuestion[] {
  if (!content) return [];

  return GAD7_QUESTIONS.map((question, index) => {
    const questionKey = `gad7_q${index + 1}` as keyof GAD7Content;
    const responseValue = content[questionKey];
    const response = responseValue || "Item 1";
    const score =
      RESPONSE_SCORES[response as keyof typeof RESPONSE_SCORES] || 0;

    return {
      id: index + 1,
      question,
      response:
        RESPONSE_LABELS[response as keyof typeof RESPONSE_LABELS] || response,
      score: `${score}/3`,
      sinceLast: "0",
      sinceBaseline: "0",
    };
  });
}

export function mapPHQ9ContentToQuestions(
  content: PHQ9Content | null,
): BaseQuestion[] {
  if (!content) return [];

  return PHQ9_QUESTIONS.map((question, index) => {
    const questionKey = `phq9_q${index + 1}` as keyof PHQ9Content;
    const responseValue = content[questionKey];
    const response = responseValue || "Item 1";
    const score =
      RESPONSE_SCORES[response as keyof typeof RESPONSE_SCORES] || 0;

    return {
      id: index + 1,
      question,
      response:
        RESPONSE_LABELS[response as keyof typeof RESPONSE_LABELS] || response,
      score: `${score}/3`,
      sinceLast: "0",
      sinceBaseline: "0",
    };
  });
}

export function mapARM5ContentToQuestions(
  content: ARM5Content | null,
): BaseQuestion[] {
  if (!content) return [];

  return ARM5_QUESTIONS.map((question, index) => {
    const questionKey = `arm5_q${index + 1}` as keyof ARM5Content;
    const responseValue = content[questionKey];
    const response = responseValue || "Item 1";
    const score =
      ARM5_RESPONSE_SCORES[response as keyof typeof ARM5_RESPONSE_SCORES] || 1;

    return {
      id: index + 1,
      question,
      response:
        ARM5_RESPONSE_LABELS[response as keyof typeof ARM5_RESPONSE_LABELS] ||
        response,
      score: `${score}/7`,
      sinceLast: "0",
      sinceBaseline: "0",
    };
  });
}

// Helper to detect survey type
export function detectSurveyType(
  templateName: string,
): "GAD7" | "PHQ9" | "ARM5" | "UNKNOWN" {
  const name = templateName.toLowerCase();
  if (name.includes("gad-7") || name.includes("gad7")) return "GAD7";
  if (name.includes("phq-9") || name.includes("phq9")) return "PHQ9";
  if (name.includes("arm-5") || name.includes("arm5")) return "ARM5";
  return "UNKNOWN";
}

// Get survey metadata
export function getSurveyMetadata(surveyType: "GAD7" | "PHQ9" | "ARM5") {
  switch (surveyType) {
    case "GAD7":
      return {
        maxScore: 21,
        title: "GAD-7 (Generalized Anxiety Disorder-7)",
        timeFrame: "Over the last 2 weeks",
        difficultyQuestion:
          "If you checked off any problems, how difficult have these made it for you to do your work, take care of things at home, or get along with other people?",
        sources: [
          {
            text: "Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of internal medicine, 166(10), 1092–1097.",
          },
        ],
      };
    case "PHQ9":
      return {
        maxScore: 27,
        title: "PHQ-9 (Patient Health Questionnaire-9)",
        timeFrame: "Over the last 2 weeks",
        difficultyQuestion:
          "If you checked off any problems on this questionnaire so far, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?",
        sources: [
          {
            text: "Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke and colleagues.",
          },
        ],
      };
    case "ARM5":
      return {
        maxScore: 35,
        title: "ARM-5 (Agnew Relationship Measure-5)",
        timeFrame: "Thinking about today's or the most recent meeting",
        difficultyQuestion: null,
        sources: [
          {
            text: "Agnew-Davies, R., Stiles, W. B., Hardy, G. E., Barkham, M., & Shapiro, D. A. (1998). Alliance structure assessed by the Agnew Relationship Measure (ARM). British Journal of Clinical Psychology, 37(2), 155-172. https://doi.org/10.1111/j.2044-8260.1998.tb01291.x",
          },
        ],
      };
  }
}

// Get difficulty response label
export function getDifficultyLabel(response: string): string {
  const difficultyLabels: Record<string, string> = {
    "Item 1": "Not difficult at all",
    "Item 2": "Somewhat difficult",
    "Item 3": "Very difficult",
    "Item 4": "Extremely difficult",
  };

  return difficultyLabels[response] || "Not answered";
}
