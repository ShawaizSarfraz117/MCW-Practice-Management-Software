import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Extract the token from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "Authorization token is missing or invalid",
          statusCode: 400,
        },
        { status: 400 },
      );
    }

    const token = authHeader.split(" ")[1]; // Extract the token from 'Bearer token'

    // Find the login link based on the token
    const existingLoginLink = await prisma.clientLoginLink.findFirst({
      where: { token },
    });

    if (!existingLoginLink) {
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    // Verify if the token is still valid by comparing it with the hashed token in the database
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    if (existingLoginLink.expiresAt < new Date()) {
      return NextResponse.json(
        {
          message: "Token expired",
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    // If the token is valid, respond with a success message or any additional data
    return NextResponse.json({
      message: "Token is valid",
      email: existingLoginLink.email,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Unexpected error in authentication:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}
