import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { sendEmail } from "../../../utils/email";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        {
          message: "Server configuration error",
          statusCode: 500,
        },
        { status: 500 },
      );
    }

    const body: { email?: string } = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        {
          message: "Invalid email format",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    // Check if the user already has a login link
    let existingLoginLink = await prisma.clientLoginLink.findFirst({
      where: { email },
    });

    const isNewClient = !existingLoginLink;

    if (isNewClient) {
      // If the user doesn't exist, create a new user entry
      const expiresIn = 24 * 60 * 60;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Create the new login link (without token initially)
      existingLoginLink = await prisma.clientLoginLink.create({
        data: {
          email,
          expiresAt,
          token: "", // Empty token initially
        },
      });
    }

    // Generate a new token using the user's id
    const expiresIn = 24 * 60 * 60;
    const token = jwt.sign(
      { email, type: "login", id: existingLoginLink?.id },
      JWT_SECRET,
      { expiresIn },
    );

    // Update the existing login link with the hashed token
    await prisma.clientLoginLink.update({
      where: { id: existingLoginLink?.id },
      data: { token: token, expiresAt: existingLoginLink?.expiresAt },
    });

    // Create the URL for the login link (send the hashed token)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const link = `${baseUrl}/sign-in?token=${token}`;

    // Prepare the email content
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              color: #333;
            }
            .cta-button-container {
              text-align: center;
              margin-top: 20px;
            }
            .cta-button {
              display: inline-block;
              background-color: #28a745;
              color: #ffffff !important;
              padding: 12px 25px;
              font-size: 16px;
              text-decoration: none;
              border-radius: 5px;
              text-align: center;
            }
            .cta-button:hover {
              background-color: #218838;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to MCW</h2>
              <p>${isNewClient ? "Your account has been created!" : "Here is your new login link"}</p>
            </div>

            <p>We've received a request to log in to your account. To proceed, simply click the button below. This link will expire in 24 hours.</p>

            <div class="cta-button-container">
              <a href="${link}" class="cta-button">Sign In to MCW</a>
            </div>

            <div class="footer">
              <p>If you didn't request this, please ignore this email.</p>
              <p>Thank you for using MCW!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email with the hashed token link
    await sendEmail(
      email,
      isNewClient
        ? "Client Registered and Login Link Sent"
        : "New Login Link Sent to the Client",
      html,
    );

    // Return response based on whether it's a new client or not
    return NextResponse.json(
      {
        message: isNewClient
          ? "Client registered and Login Link sent"
          : "New Login Link Sent to the Client",
        statusCode: isNewClient ? 201 : 200,
      },
      { status: isNewClient ? 201 : 200 },
    );
  } catch (error) {
    console.error("Unexpected error in send-link route:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
