"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@mcw/ui";
import { SurveyType } from "@/types/survey-answer";

interface ScoringGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyType: SurveyType;
}

interface ScoreRange {
  range: string;
  severity: string;
  description: string;
  recommendations?: string[];
}

const scoringGuides: Record<
  SurveyType,
  {
    title: string;
    description: string;
    ranges: ScoreRange[];
    interpretation: string;
    source: string;
  }
> = {
  GAD7: {
    title: "GAD-7 Scoring Guide",
    description: "Generalized Anxiety Disorder 7-item Scale",
    ranges: [
      {
        range: "0-4",
        severity: "Minimal anxiety",
        description: "No significant anxiety symptoms reported",
        recommendations: [
          "Continue routine monitoring",
          "Reassess if symptoms worsen",
        ],
      },
      {
        range: "5-9",
        severity: "Mild anxiety",
        description: "Some anxiety symptoms present but manageable",
        recommendations: [
          "Consider watchful waiting",
          "Provide psychoeducation about anxiety",
          "Schedule follow-up in 4-6 weeks",
        ],
      },
      {
        range: "10-14",
        severity: "Moderate anxiety",
        description: "Significant anxiety symptoms affecting daily functioning",
        recommendations: [
          "Consider therapy (CBT, counseling)",
          "Evaluate need for medication",
          "Regular monitoring recommended",
        ],
      },
      {
        range: "15-21",
        severity: "Severe anxiety",
        description: "Severe symptoms significantly impairing functioning",
        recommendations: [
          "Active treatment warranted",
          "Consider combination therapy and medication",
          "Frequent follow-up appointments",
          "Assess for comorbid conditions",
        ],
      },
    ],
    interpretation:
      "The GAD-7 is a brief self-report scale that identifies probable cases of generalized anxiety disorder and assesses symptom severity. Higher scores indicate greater anxiety severity.",
    source:
      "Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder. Arch Intern Med. 2006;166:1092-1097.",
  },
  PHQ9: {
    title: "PHQ-9 Scoring Guide",
    description: "Patient Health Questionnaire 9-item Scale",
    ranges: [
      {
        range: "0-4",
        severity: "Minimal depression",
        description: "No significant depressive symptoms",
        recommendations: [
          "Continue routine monitoring",
          "Reassess if symptoms emerge",
        ],
      },
      {
        range: "5-9",
        severity: "Mild depression",
        description: "Few symptoms with minimal functional impairment",
        recommendations: [
          "Watchful waiting",
          "Consider counseling or psychotherapy",
          "Follow-up in 4-6 weeks",
        ],
      },
      {
        range: "10-14",
        severity: "Moderate depression",
        description: "Symptoms causing moderate difficulty in functioning",
        recommendations: [
          "Treatment plan warranted",
          "Consider therapy and/or antidepressants",
          "Regular monitoring",
        ],
      },
      {
        range: "15-19",
        severity: "Moderately severe depression",
        description: "Significant symptoms with marked functional impairment",
        recommendations: [
          "Active treatment indicated",
          "Antidepressants likely needed",
          "Consider combined treatment approach",
        ],
      },
      {
        range: "20-27",
        severity: "Severe depression",
        description: "Severe symptoms with severe functional impairment",
        recommendations: [
          "Immediate treatment necessary",
          "Antidepressants indicated",
          "Consider psychiatric referral",
          "Assess suicide risk",
        ],
      },
    ],
    interpretation:
      "The PHQ-9 is a validated tool for screening, diagnosing, monitoring, and measuring the severity of depression. A score ≥10 has 88% sensitivity and 88% specificity for major depression.",
    source:
      "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.",
  },
  ARM5: {
    title: "ARM-5 Scoring Guide",
    description: "Alliance Rupture Measure - 5 item Scale",
    ranges: [
      {
        range: "5-11",
        severity: "Low rupture",
        description: "Strong therapeutic alliance with minimal ruptures",
        recommendations: [
          "Continue current therapeutic approach",
          "Maintain open communication",
        ],
      },
      {
        range: "12-18",
        severity: "Moderate rupture",
        description: "Some alliance difficulties present",
        recommendations: [
          "Address ruptures directly in therapy",
          "Explore client's concerns",
          "Consider supervision/consultation",
        ],
      },
      {
        range: "19-25",
        severity: "High rupture",
        description: "Significant alliance ruptures requiring attention",
        recommendations: [
          "Prioritize rupture repair",
          "Consider changing therapeutic approach",
          "Seek supervision",
          "Evaluate therapist-client match",
        ],
      },
    ],
    interpretation:
      "The ARM-5 measures therapeutic alliance ruptures. Higher scores indicate greater ruptures in the therapeutic relationship. The scale includes subscales for Relationship Ambivalence and Relationship Apprehension.",
    source:
      "Eubanks, C. F., Goldfried, M. R., et al. (2018). The Alliance Rupture Measure (ARM): Development and initial validation.",
  },
};

export function ScoringGuideSheet({
  open,
  onOpenChange,
  surveyType,
}: ScoringGuideSheetProps) {
  const guide = scoringGuides[surveyType];

  if (!guide) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{guide.title}</SheetTitle>
          <SheetDescription>{guide.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Score Interpretation</h3>
            <p className="text-sm text-muted-foreground">
              {guide.interpretation}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Severity Levels</h3>
            <div className="space-y-4">
              {guide.ranges.map((range, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Score {range.range}</span>
                    <span className="text-sm font-semibold text-primary">
                      {range.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {range.description}
                  </p>
                  {range.recommendations && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">
                        Clinical Recommendations:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {range.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Reference</h3>
            <p className="text-xs text-muted-foreground">{guide.source}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
