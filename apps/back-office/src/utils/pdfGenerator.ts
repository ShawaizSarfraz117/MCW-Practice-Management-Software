import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SurveyQuestion {
  type: string;
  name: string;
  title?: string;
  html?: string;
  isRequired?: boolean;
  choices?: Array<{
    value: string;
    text: string;
  }>;
  showOtherItem?: boolean;
  otherText?: string;
}

interface SurveyPage {
  name: string;
  elements: SurveyQuestion[];
}

interface SurveyTemplate {
  title?: string;
  description?: string;
  pages: SurveyPage[];
  showTitle?: boolean;
}

interface SurveyAnswers {
  [key: string]: string | number | boolean | string[] | undefined;
}

export class SurveyPDFGenerator {
  private doc: jsPDF;
  private yPosition: number;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.yPosition = 20;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margin = 20;
    this.lineHeight = 7;
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.yPosition + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    return this.doc.splitTextToSize(text, maxWidth);
  }

  private addTitle(title: string) {
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    const lines = this.wrapText(title, this.pageWidth - 2 * this.margin);
    lines.forEach((line) => {
      this.checkPageBreak();
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 10;
    });
    this.yPosition += 5;
  }

  private addDescription(description: string) {
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100);
    const lines = this.wrapText(description, this.pageWidth - 2 * this.margin);
    lines.forEach((line) => {
      this.checkPageBreak();
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += this.lineHeight;
    });
    this.doc.setTextColor(0);
    this.yPosition += 10;
  }

  private addQuestion(
    question: SurveyQuestion,
    answer?: string | number | boolean | string[] | undefined,
  ) {
    // Add question title
    if (question.title) {
      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      const lines = this.wrapText(
        question.title,
        this.pageWidth - 2 * this.margin,
      );
      lines.forEach((line) => {
        this.checkPageBreak();
        this.doc.text(line, this.margin, this.yPosition);
        this.yPosition += this.lineHeight;
      });
      this.yPosition += 2;
    }

    // Add HTML content if present
    if (question.type === "html" && question.html) {
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "normal");
      // Strip HTML tags for basic text rendering
      const text = question.html.replace(/<[^>]*>/g, "");
      const lines = this.wrapText(text, this.pageWidth - 2 * this.margin);
      lines.forEach((line) => {
        this.checkPageBreak();
        this.doc.text(line, this.margin, this.yPosition);
        this.yPosition += this.lineHeight;
      });
      this.yPosition += 5;
      return;
    }

    // Add answer if available
    if (answer !== undefined && answer !== null) {
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "normal");

      // Handle different answer types
      let displayAnswer = "";
      if (question.type === "radiogroup" && question.choices) {
        // Find the matching choice
        const choice = question.choices.find((c) => c.value === answer);
        if (choice) {
          displayAnswer = choice.text;
        } else if (answer === "other" && question.showOtherItem) {
          displayAnswer = question.otherText || "Other";
        } else {
          displayAnswer = answer.toString();
        }
      } else if (typeof answer === "object") {
        displayAnswer = JSON.stringify(answer);
      } else {
        displayAnswer = answer.toString();
      }

      this.doc.setTextColor(0, 0, 255);
      const lines = this.wrapText(
        `Answer: ${displayAnswer}`,
        this.pageWidth - 2 * this.margin,
      );
      lines.forEach((line) => {
        this.checkPageBreak();
        this.doc.text(line, this.margin + 5, this.yPosition);
        this.yPosition += this.lineHeight;
      });
      this.doc.setTextColor(0);
    } else if (question.choices) {
      // Show choices if no answer
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100);
      question.choices.forEach((choice) => {
        this.checkPageBreak();
        this.doc.text(`□ ${choice.text}`, this.margin + 5, this.yPosition);
        this.yPosition += this.lineHeight;
      });
      if (question.showOtherItem) {
        this.checkPageBreak();
        this.doc.text(
          `□ ${question.otherText || "Other"}`,
          this.margin + 5,
          this.yPosition,
        );
        this.yPosition += this.lineHeight;
      }
      this.doc.setTextColor(0);
    }

    this.yPosition += 8;
  }

  public generatePDF(
    template: SurveyTemplate,
    answers?: SurveyAnswers,
    metadata?: {
      clientName?: string;
      date?: string;
      practiceName?: string;
    },
  ): Blob {
    // Add header with metadata
    if (metadata) {
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(100);

      if (metadata.practiceName) {
        this.doc.text(metadata.practiceName, this.margin, this.yPosition);
        this.yPosition += this.lineHeight;
      }

      if (metadata.clientName) {
        this.doc.text(
          `Client: ${metadata.clientName}`,
          this.margin,
          this.yPosition,
        );
        this.yPosition += this.lineHeight;
      }

      if (metadata.date) {
        this.doc.text(`Date: ${metadata.date}`, this.margin, this.yPosition);
        this.yPosition += this.lineHeight;
      }

      this.doc.setTextColor(0);
      this.yPosition += 10;
    }

    // Add title
    if (template.title) {
      this.addTitle(template.title);
    }

    // Add description
    if (template.description) {
      this.addDescription(template.description);
    }

    // Process pages and questions
    template.pages.forEach((page) => {
      page.elements.forEach((element) => {
        const answer = answers?.[element.name];
        this.addQuestion(element, answer);
      });
    });

    // Return as blob
    return this.doc.output("blob");
  }

  public async generatePDFFromHTML(element: HTMLElement): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF("p", "mm", "a4");
    let position = 0;

    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return doc.output("blob");
  }
}
