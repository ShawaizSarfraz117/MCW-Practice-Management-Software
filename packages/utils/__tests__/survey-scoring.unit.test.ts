import { describe, it, expect } from "vitest";
import {
  calculateGAD7Score,
  calculatePHQ9Score,
  calculateARM5Score,
  calculateSurveyScore,
  getSurveyType,
} from "../src/survey-scoring";

describe("Survey Scoring Utilities", () => {
  describe("calculateGAD7Score", () => {
    it("should calculate minimal anxiety score", () => {
      const answers = {
        gad7_q1: "Item 1", // Not at all = 0
        gad7_q2: "Item 1",
        gad7_q3: "Item 1",
        gad7_q4: "Item 1",
        gad7_q5: "Item 1",
        gad7_q6: "Item 1",
        gad7_q7: "Item 1",
        gad7_q8: "Item 1",
      };

      const result = calculateGAD7Score(answers);
      expect(result.totalScore).toBe(0);
      expect(result.severity).toBe("Minimal");
      expect(result.interpretation).toBe("Minimal anxiety");
    });

    it("should calculate mild anxiety score", () => {
      const answers = {
        gad7_q1: "Item 2", // Several days = 1
        gad7_q2: "Item 2",
        gad7_q3: "Item 2",
        gad7_q4: "Item 2",
        gad7_q5: "Item 2",
        gad7_q6: "Item 1",
        gad7_q7: "Item 1",
        gad7_q8: "Item 1",
      };

      const result = calculateGAD7Score(answers);
      expect(result.totalScore).toBe(5);
      expect(result.severity).toBe("Mild");
      expect(result.interpretation).toBe("Mild anxiety");
    });

    it("should calculate moderate anxiety score", () => {
      const answers = {
        gad7_q1: "Item 3", // Over half the days = 2
        gad7_q2: "Item 3", // Over half the days = 2
        gad7_q3: "Item 3", // Over half the days = 2
        gad7_q4: "Item 3", // Over half the days = 2
        gad7_q5: "Item 3", // Over half the days = 2
        gad7_q6: "Item 3", // Over half the days = 2
        gad7_q7: "Item 1", // Not at all = 0
        gad7_q8: "Item 1", // Not at all = 0
      };

      const result = calculateGAD7Score(answers);
      expect(result.totalScore).toBe(12); // 2+2+2+2+2+2+0+0 = 12
      expect(result.severity).toBe("Moderate"); // 12 falls in the Moderate range (10-14)
      expect(result.interpretation).toBe("Moderate anxiety");
    });

    it("should calculate severe anxiety score", () => {
      const answers = {
        gad7_q1: "Item 4", // Nearly every day = 3
        gad7_q2: "Item 4",
        gad7_q3: "Item 4",
        gad7_q4: "Item 3",
        gad7_q5: "Item 3",
        gad7_q6: "Item 3",
        gad7_q7: "Item 2",
        gad7_q8: "Item 1",
      };

      const result = calculateGAD7Score(answers);
      expect(result.totalScore).toBe(16); // 3+3+3+2+2+2+1+0 = 16
      expect(result.severity).toBe("Severe"); // 16 falls in the Severe range (15-21)
      expect(result.interpretation).toBe("Severe anxiety");
    });

    it("should handle missing answers", () => {
      const answers = {
        gad7_q1: "Item 2",
        gad7_q3: "Item 3",
        // Missing other questions
      };

      const result = calculateGAD7Score(answers);
      expect(result.totalScore).toBe(3); // 1 + 2
    });
  });

  describe("calculatePHQ9Score", () => {
    it("should calculate none-minimal depression score", () => {
      const answers = {
        phq9_q1: "Item 1",
        phq9_q2: "Item 1",
        phq9_q3: "Item 1",
        phq9_q4: "Item 1",
        phq9_q5: "Item 1",
        phq9_q6: "Item 1",
        phq9_q7: "Item 1",
        phq9_q8: "Item 1",
        phq9_q9: "Item 1",
        phq9_q10: "Item 1",
      };

      const result = calculatePHQ9Score(answers);
      expect(result.totalScore).toBe(0);
      expect(result.severity).toBe("None-Minimal");
      expect(result.interpretation).toBe("None to minimal depression");
      expect(result.flaggedItems).toBeUndefined();
    });

    it("should flag suicidal ideation", () => {
      const answers = {
        phq9_q1: "Item 1",
        phq9_q2: "Item 1",
        phq9_q3: "Item 1",
        phq9_q4: "Item 1",
        phq9_q5: "Item 1",
        phq9_q6: "Item 1",
        phq9_q7: "Item 1",
        phq9_q8: "Item 1",
        phq9_q9: "Item 1",
        phq9_q10: "Item 2", // Not "Not at all"
      };

      const result = calculatePHQ9Score(answers);
      expect(result.totalScore).toBe(0); // q1-q9 all "Item 1" = 0, q10 not included in score
      expect(result.flaggedItems).toContain(
        "Suicidal ideation reported - requires immediate clinical attention",
      );
    });

    it("should calculate severe depression score", () => {
      const answers = {
        phq9_q1: "Item 4", // Nearly every day = 3
        phq9_q2: "Item 4", // Nearly every day = 3
        phq9_q3: "Item 4", // Nearly every day = 3
        phq9_q4: "Item 4", // Nearly every day = 3
        phq9_q5: "Item 4", // Nearly every day = 3
        phq9_q6: "Item 4", // Nearly every day = 3
        phq9_q7: "Item 4", // Nearly every day = 3
        phq9_q8: "Item 2", // Several days = 1
        phq9_q9: "Item 2", // Several days = 1
        phq9_q10: "Item 1", // Not at all = 0
      };

      const result = calculatePHQ9Score(answers);
      expect(result.totalScore).toBe(23); // 7×3 + 2×1 = 21 + 2 = 23 (q1-q9 only)
      expect(result.severity).toBe("Severe"); // 23 falls in Severe range (20-27)
      expect(result.interpretation).toBe("Severe depression");
    });
  });

  describe("calculateARM5Score", () => {
    it("should calculate strong therapeutic alliance", () => {
      const answers = {
        arm5_q1: "Item 7", // Strongly Agree = 7
        arm5_q2: "Item 7",
        arm5_q3: "Item 6",
        arm5_q4: "Item 6",
      };

      const result = calculateARM5Score(answers);
      expect(result.totalScore).toBe(26);
      expect(result.interpretation).toBe("Strong therapeutic alliance");
    });

    it("should calculate poor therapeutic alliance", () => {
      const answers = {
        arm5_q1: "Item 1", // Strongly Disagree = 1
        arm5_q2: "Item 2",
        arm5_q3: "Item 2",
        arm5_q4: "Item 1",
      };

      const result = calculateARM5Score(answers);
      expect(result.totalScore).toBe(6);
      expect(result.interpretation).toBe("Poor therapeutic alliance");
    });

    it("should calculate moderate therapeutic alliance", () => {
      const answers = {
        arm5_q1: "Item 4", // Neutral = 4
        arm5_q2: "Item 4",
        arm5_q3: "Item 4",
        arm5_q4: "Item 4",
      };

      const result = calculateARM5Score(answers);
      expect(result.totalScore).toBe(16);
      expect(result.interpretation).toBe("Moderate therapeutic alliance");
    });
  });

  describe("calculateSurveyScore", () => {
    it("should calculate GAD-7 score", () => {
      const answers = {
        gad7_q1: "Item 2",
        gad7_q2: "Item 2",
        gad7_q3: "Item 1",
        gad7_q4: "Item 1",
        gad7_q5: "Item 1",
        gad7_q6: "Item 1",
        gad7_q7: "Item 1",
        gad7_q8: "Item 1",
      };

      const result = calculateSurveyScore("GAD-7", answers);
      expect(result.totalScore).toBe(2);
    });

    it("should calculate PHQ-9 score", () => {
      const answers = {
        phq9_q1: "Item 2",
        phq9_q2: "Item 2",
        phq9_q3: "Item 1",
        phq9_q4: "Item 1",
        phq9_q5: "Item 1",
        phq9_q6: "Item 1",
        phq9_q7: "Item 1",
        phq9_q8: "Item 1",
        phq9_q9: "Item 1",
        phq9_q10: "Item 1",
      };

      const result = calculateSurveyScore("PHQ-9", answers);
      expect(result.totalScore).toBe(2);
    });

    it("should calculate ARM-5 score", () => {
      const answers = {
        arm5_q1: "Item 5",
        arm5_q2: "Item 5",
        arm5_q3: "Item 5",
        arm5_q4: "Item 5",
      };

      const result = calculateSurveyScore("ARM-5", answers);
      expect(result.totalScore).toBe(20);
    });

    it("should return zero score for unknown survey type", () => {
      const result = calculateSurveyScore("UNKNOWN", {});
      expect(result.totalScore).toBe(0);
      expect(result.severity).toBeUndefined();
      expect(result.interpretation).toBeUndefined();
    });
  });

  describe("getSurveyType", () => {
    it("should identify GAD-7 survey", () => {
      expect(getSurveyType("GAD-7")).toBe("GAD-7");
      expect(getSurveyType("GAD-7 Anxiety Assessment")).toBe("GAD-7");
      expect(getSurveyType("gad-7 survey")).toBe("GAD-7");
    });

    it("should identify PHQ-9 survey", () => {
      expect(getSurveyType("PHQ-9")).toBe("PHQ-9");
      expect(getSurveyType("PHQ-9 Depression Scale")).toBe("PHQ-9");
      expect(getSurveyType("phq-9 assessment")).toBe("PHQ-9");
    });

    it("should identify ARM-5 survey", () => {
      expect(getSurveyType("ARM-5")).toBe("ARM-5");
      expect(getSurveyType("ARM-5 Relationship Measure")).toBe("ARM-5");
      expect(getSurveyType("arm-5 scale")).toBe("ARM-5");
    });

    it("should return null for unrecognized survey", () => {
      expect(getSurveyType("Some Other Survey")).toBeNull();
      expect(getSurveyType("Random Assessment")).toBeNull();
    });
  });
});
