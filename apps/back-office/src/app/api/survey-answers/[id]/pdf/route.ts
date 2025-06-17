import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "@/api/auth/[...nextauth]/auth-options";
import { prisma } from "@mcw/database";
import { format } from "date-fns";
import {
  PHQ9Content,
  ARM5Content,
  mapGAD7ContentToQuestions,
  mapPHQ9ContentToQuestions,
  mapARM5ContentToQuestions,
  detectSurveyType,
  getSurveyMetadata,
  getDifficultyLabel,
  safeJSONParse,
} from "@/utils/survey-utils";
import { GAD7Content } from "@/types/survey-answer";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveyAnswerId = params.id;

    if (!surveyAnswerId) {
      return NextResponse.json(
        { error: "Survey answer ID is required" },
        { status: 400 },
      );
    }

    // Fetch survey answer with all necessary relations
    const surveyAnswer = await prisma.surveyAnswers.findUnique({
      where: { id: surveyAnswerId },
      include: {
        Client: true,
        SurveyTemplate: true,
      },
    });

    if (!surveyAnswer) {
      return NextResponse.json(
        { error: "Survey answer not found" },
        { status: 404 },
      );
    }

    // Parse score and content using safe parsing utility
    const scoreData = safeJSONParse(surveyAnswer.score);
    const contentData = safeJSONParse(surveyAnswer.content);

    const totalScore = scoreData?.totalScore || 0;
    const severity = scoreData?.severity || "Unknown";
    const interpretation = scoreData?.interpretation || "";

    // Detect survey type and get metadata
    const surveyType = detectSurveyType(surveyAnswer.SurveyTemplate.name);
    const surveyMetadata =
      surveyType !== "UNKNOWN" ? getSurveyMetadata(surveyType) : null;

    // Map content based on survey type using parsed content
    const questions = (() => {
      switch (surveyType) {
        case "GAD7":
          return mapGAD7ContentToQuestions(contentData as GAD7Content | null);
        case "PHQ9":
          return mapPHQ9ContentToQuestions(contentData as PHQ9Content | null);
        case "ARM5":
          return mapARM5ContentToQuestions(contentData as ARM5Content | null);
        default:
          return [];
      }
    })();

    const getClientDisplayName = () => {
      if (!surveyAnswer?.Client) return "Unknown Client";
      const { preferred_name, legal_first_name, legal_last_name } =
        surveyAnswer.Client;
      const firstName = preferred_name || legal_first_name || "";
      const lastName = legal_last_name || "";
      return `${firstName} ${lastName}`.trim() || "Unknown Client";
    };

    const getFormattedDate = () => {
      if (!surveyAnswer?.created_at) return "";
      try {
        return format(
          new Date(surveyAnswer.created_at),
          "MM/dd/yyyy 'at' h:mm a",
        );
      } catch {
        return "";
      }
    };

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${surveyAnswer.SurveyTemplate.name} - ${getClientDisplayName()}</title>
          <style>
            @page {
              size: A4;
              margin: 0.75in;
            }
            
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 0;
              background-color: #fff;
            }
            
            .container {
              max-width: 100%;
            }
            
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              color: #1f2937;
            }
            
            .header-info {
              color: #6b7280;
              font-size: 14px;
            }
            
            .assessment-info {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            
            .assessment-title {
              font-size: 20px;
              font-weight: 600;
              margin: 0 0 10px 0;
              color: #1f2937;
            }
            
            .assessment-meta {
              color: #6b7280;
              font-size: 14px;
            }
            
            .score-section {
              display: flex;
              gap: 30px;
              margin-bottom: 30px;
            }
            
            .score-card {
              flex: 1;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
            }
            
            .score-card h3 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: #1f2937;
            }
            
            .score-display {
              text-align: center;
              margin-bottom: 15px;
            }
            
            .score-number {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              margin: 0;
            }
            
            .score-severity {
              font-size: 14px;
              color: #6b7280;
              margin: 5px 0 0 0;
            }
            
            .score-range {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #9ca3af;
              margin-top: 10px;
            }
            
            .interpretation {
              font-size: 14px;
              color: #4b5563;
              line-height: 1.6;
            }
            
            .questions-section {
              margin-bottom: 30px;
            }
            
            .questions-intro {
              margin-bottom: 20px;
              font-size: 14px;
              color: #4b5563;
            }
            
            .questions-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .questions-table th {
              background-color: #f9fafb;
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .questions-table td {
              padding: 12px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
              vertical-align: top;
            }
            
            .question-number {
              width: 40px;
              font-weight: 600;
              color: #374151;
            }
            
            .question-text {
              color: #4b5563;
            }
            
            .response-text {
              color: #374151;
            }
            
            .score-cell {
              width: 60px;
              text-align: center;
              font-weight: 600;
            }
            
            .change-positive {
              color: #dc2626;
            }
            
            .change-negative {
              color: #2563eb;
            }
            
            .change-neutral {
              color: #6b7280;
            }
            
            .difficulty-question {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .difficulty-grid {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr 1fr;
              gap: 20px;
              align-items: start;
            }
            
            .sources-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .sources-title {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 20px 0;
              color: #1f2937;
            }
            
            .source-item {
              margin-bottom: 15px;
              font-size: 14px;
              color: #4b5563;
              line-height: 1.5;
            }
            
            .disclaimer {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.5;
            }
            
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>${getClientDisplayName()}</h1>
              <div class="header-info">
                ${surveyAnswer.Client.date_of_birth ? `DOB: ${format(new Date(surveyAnswer.Client.date_of_birth), "MM/dd/yyyy")}` : ""}
              </div>
            </div>
            
            <!-- Assessment Info -->
            <div class="assessment-info">
              <div class="assessment-title">${surveyAnswer.SurveyTemplate.name}</div>
              <div class="assessment-meta">
                ${getFormattedDate()}
                ${surveyAnswer.status ? ` • Status: ${surveyAnswer.status.charAt(0).toUpperCase() + surveyAnswer.status.slice(1).toLowerCase()}` : ""}
              </div>
            </div>
            
            <!-- Score Section -->
            <div class="score-section">
              <div class="score-card">
                <h3>Score</h3>
                <div class="score-display">
                  <div class="score-number">${totalScore}</div>
                  <div class="score-severity">${severity}</div>
                </div>
                <div class="score-range">
                  <span>0</span>
                  <span>${surveyMetadata?.maxScore || 21}</span>
                </div>
              </div>
              
              <div class="score-card">
                <h3>Scoring Interpretation</h3>
                <div class="interpretation">
                  <p>${interpretation}</p>
                  ${severity === "Moderate" ? `<p>The client's symptoms make it <strong>somewhat difficult</strong> to function.</p>` : ""}
                  ${severity === "Severe" ? `<p>The client's symptoms make it <strong>very difficult</strong> to function.</p>` : ""}
                </div>
              </div>
            </div>
            
            <!-- Questions Section -->
            <div class="questions-section">
              ${
                surveyMetadata
                  ? `
                <div class="questions-intro">
                  ${surveyMetadata.timeFrame}, ${surveyType === "ARM5" ? "please indicate how strongly you agree or disagree with each statement." : "how often have you been bothered by the following problems?"}
                </div>
              `
                  : ""
              }
              
              <table class="questions-table">
                <thead>
                  <tr>
                    <th class="question-number">#</th>
                    <th>Question</th>
                    <th>Response</th>
                    <th>Score</th>
                    <th>Since Last</th>
                    <th>Since Baseline</th>
                  </tr>
                </thead>
                <tbody>
                  ${questions
                    .map(
                      (item) => `
                    <tr>
                      <td class="question-number">${item.id}.</td>
                      <td class="question-text">${item.question}</td>
                      <td class="response-text">${item.response}</td>
                      <td class="score-cell">${item.score}</td>
                      <td class="${item.sinceLast.includes("↓") ? "change-negative" : item.sinceLast.includes("↑") ? "change-positive" : "change-neutral"}">${item.sinceLast}</td>
                      <td class="${item.sinceBaseline.includes("↓") ? "change-negative" : item.sinceBaseline.includes("↑") ? "change-positive" : "change-neutral"}">${item.sinceBaseline}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              
              <!-- Difficulty Question -->
              ${
                surveyMetadata?.difficultyQuestion &&
                (surveyType === "GAD7" || surveyType === "PHQ9")
                  ? `
                <div class="difficulty-question">
                  <div class="difficulty-grid">
                    <div>${surveyMetadata.difficultyQuestion}</div>
                    <div>
                      ${(() => {
                        let difficultyResponse = "";
                        if (surveyType === "GAD7" && contentData) {
                          difficultyResponse =
                            (contentData as GAD7Content).gad7_q8 || "";
                        } else if (surveyType === "PHQ9" && contentData) {
                          difficultyResponse =
                            (contentData as PHQ9Content).phq9_q10 || "";
                        }
                        return difficultyResponse
                          ? getDifficultyLabel(difficultyResponse)
                          : "Not answered";
                      })()}
                    </div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
            
            <!-- Sources -->
            ${
              surveyMetadata
                ? `
              <div class="sources-section">
                <h3 class="sources-title">Sources</h3>
                ${surveyMetadata.sources
                  .map(
                    (source, index) => `
                  <div class="source-item">
                    <strong>${index + 1}.</strong> ${source.text}
                  </div>
                `,
                  )
                  .join("")}
                <div class="disclaimer">
                  This measure and its scoring information have been reproduced from source material and supporting literature. This tool should not be used as a substitute for clinical judgment.
                </div>
              </div>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `;

    // Return HTML content that can be printed to PDF
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${getClientDisplayName().replace(/[^a-zA-Z0-9]/g, "_")}_${surveyAnswer.SurveyTemplate.name.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(surveyAnswer.created_at), "yyyy-MM-dd")}.html"`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Return more specific error information in development
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: isDevelopment
          ? `PDF generation failed: ${errorMessage}`
          : "Failed to generate PDF",
        ...(isDevelopment && { stack: errorStack }),
      },
      { status: 500 },
    );
  }
}
