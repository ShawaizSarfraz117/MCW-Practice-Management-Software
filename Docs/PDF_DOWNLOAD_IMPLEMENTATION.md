# PDF Download Implementation Plan

## Overview
Implement PDF download functionality for client files, specifically for survey templates with answers.

## Requirements
1. When downloading a file with a survey_template_id, generate a PDF from:
   - Survey template JSON structure
   - Survey answers (if available)
2. Format the PDF to match the provided samples with:
   - Professional layout
   - Questions and answers clearly displayed
   - Client and practice information

## Implementation Steps

### 1. Install PDF Generation Library
Since no PDF library is currently installed, we'll use jsPDF with html2canvas for client-side PDF generation:
```bash
npm install jspdf html2canvas @types/jspdf @types/html2canvas
```

### 2. Create PDF Generation Service
Create `/apps/back-office/src/utils/pdfGenerator.ts`:
- Function to render survey template JSON to HTML
- Function to merge survey answers with template
- Function to generate PDF from HTML

### 3. Create API Endpoint for Download
Create `/apps/back-office/src/app/api/client/files/download/route.ts`:
- GET endpoint that accepts file_id
- Fetch ClientFiles with relations
- If survey_template_id exists:
  - Fetch SurveyTemplate
  - Fetch SurveyAnswers if available
  - Generate PDF
- If regular file with URL:
  - Redirect to file URL
- Return appropriate response

### 4. Update FilesTab Component
- Modify handleDownload to call new API endpoint
- Handle PDF generation for survey templates
- Handle direct download for uploaded files

## Data Flow
1. User clicks download → handleDownload()
2. Check if file has survey_template_id
3. If yes: Call /api/client/files/download?file_id=X
4. API fetches template and answers
5. Generate PDF and return
6. If no: Direct download from URL

## PDF Structure
Based on samples:
- Header: Title and description
- Body: Questions with answers (if available)
- Footer: Reference information
- Styling: Clean, professional layout