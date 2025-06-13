import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { SurveyPDFGenerator } from "@/utils/pdfGenerator";
import {
  generateDownloadUrl,
  deleteFromAzureStorage,
} from "@/utils/azureStorage";

// GET /api/client/files/[id] - Download a specific file
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;

    const clientGroupFile = await prisma.clientGroupFile.findFirst({
      where: { id: fileId },
      include: {
        ClientGroup: true,
      },
    });

    if (clientGroupFile) {
      if (clientGroupFile.url) {
        try {
          const sasUrl = await generateDownloadUrl(clientGroupFile.url);

          return NextResponse.json({
            success: true,
            downloadUrl: sasUrl,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: `Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            { status: 500 },
          );
        }
      }
    }

    const clientFile = await prisma.clientFiles.findFirst({
      where: { id: fileId },
      include: {
        Client: true,
        ClientGroupFile: true,
        SurveyAnswers: true,
      },
    });

    if (!clientFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if this is a survey template
    if (clientFile.ClientGroupFile.survey_template_id) {
      // Fetch the survey template separately
      const surveyTemplate = await prisma.surveyTemplate.findUnique({
        where: { id: clientFile.ClientGroupFile.survey_template_id },
      });

      if (!surveyTemplate) {
        return NextResponse.json(
          { error: "Survey template not found" },
          { status: 404 },
        );
      }

      // Parse the survey template JSON
      let templateData;
      try {
        templateData = JSON.parse(surveyTemplate.content);
      } catch (error) {
        console.error("Failed to parse survey template:", error);
        return NextResponse.json(
          { error: "Invalid survey template format" },
          { status: 500 },
        );
      }

      // Parse survey answers if available
      let answersData = null;
      if (clientFile.SurveyAnswers?.content) {
        try {
          answersData = JSON.parse(clientFile.SurveyAnswers.content);
        } catch (error) {
          console.error("Failed to parse survey answers:", error);
        }
      }

      const pdfGenerator = new SurveyPDFGenerator();
      const pdfBlob = pdfGenerator.generatePDF(templateData, answersData, {
        clientName: `${clientFile.Client.legal_first_name} ${clientFile.Client.legal_last_name}`,
        date: new Date().toLocaleDateString(),
        practiceName: "Practice",
      });

      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${clientFile.ClientGroupFile.title || "survey"}.pdf"`,
        },
      });
    }

    if (clientFile.ClientGroupFile.url) {
      try {
        const sasUrl = await generateDownloadUrl(
          clientFile.ClientGroupFile.url,
        );

        // Return the SAS URL as JSON instead of redirecting
        // The frontend will handle the redirect
        return NextResponse.json({
          success: true,
          downloadUrl: sasUrl,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: `Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 },
        );
      }
    }

    // No downloadable content
    return NextResponse.json(
      { error: "No downloadable content available" },
      { status: 404 },
    );
  } catch (error: unknown) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}

// DELETE /api/client/files/[id] - Delete a specific file
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;

    const clientGroupFile = await prisma.clientGroupFile.findFirst({
      where: { id: fileId },
      include: {
        ClientFiles: true,
      },
    });

    if (clientGroupFile) {
      if (clientGroupFile.ClientFiles.length > 0) {
        return NextResponse.json(
          {
            requiresConfirmation: true,
            sharedWithCount: clientGroupFile.ClientFiles.length,
            message: `This file will be permanently removed. Anyone who previously had access to the file will lose access immediately.`,
          },
          { status: 200 },
        );
      }

      await prisma.$transaction(async (tx) => {
        if (clientGroupFile.url) {
          await deleteFromAzureStorage(clientGroupFile.url);
        }

        await tx.clientGroupFile.delete({
          where: { id: fileId },
        });
      });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    }

    // Not a ClientGroupFile, try as ClientFiles (shared file)
    const clientFile = await prisma.clientFiles.findFirst({
      where: { id: fileId },
      include: {
        ClientGroupFile: true,
        SurveyAnswers: true,
      },
    });

    if (!clientFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if file is locked
    if (clientFile.status === "Locked") {
      return NextResponse.json(
        { error: "Cannot delete locked files" },
        { status: 403 },
      );
    }

    // Handle survey files - delete survey answers
    if (
      clientFile.ClientGroupFile.survey_template_id &&
      clientFile.SurveyAnswers
    ) {
      await prisma.surveyAnswers.delete({
        where: { id: clientFile.SurveyAnswers.id },
      });
    }

    // Delete only the client file record (unshare)
    await prisma.clientFiles.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: "File unshared successfully",
    });
  } catch (error: unknown) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}

// POST /api/client/files/[id]/confirm-delete - Confirm deletion of Practice Upload with shares
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;

    // Parse request body
    const body = await request.json();
    if (!body.confirmDelete) {
      return NextResponse.json(
        { error: "Confirmation required" },
        { status: 400 },
      );
    }

    // Find the ClientGroupFile
    const clientGroupFile = await prisma.clientGroupFile.findFirst({
      where: { id: fileId },
      include: {
        ClientFiles: true,
      },
    });

    if (!clientGroupFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Proceed with deletion in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all ClientFiles records first
      await tx.clientFiles.deleteMany({
        where: { client_group_file_id: fileId },
      });

      // Delete from Azure if it has a URL
      if (clientGroupFile.url) {
        try {
          await deleteFromAzureStorage(clientGroupFile.url);
        } catch (error) {
          console.error("Failed to delete from Azure:", error);
        }
      }

      // Delete the ClientGroupFile
      await tx.clientGroupFile.delete({
        where: { id: fileId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "File and all shares deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Confirm delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
