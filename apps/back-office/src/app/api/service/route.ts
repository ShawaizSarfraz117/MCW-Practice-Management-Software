import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json();

  console.log(body, "body");

  const createdService = await prisma.practiceService.create({
    data: {
      type: "",
      description: body.description,
      code: body.service.toLowerCase().replace(/\s+/g, "-"),
      rate: new Prisma.Decimal(body.rate), // Prisma Decimal type
      duration: parseInt(body.duration),
      color: body.color || "#2D8467", // optional fallback
    },
  });

  return NextResponse.json(createdService);
}

export async function GET() {
  try {
    const services = await prisma.practiceService.findMany({});

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log(body, "body");

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 },
      );
    }

    const updatedService = await prisma.practiceService.update({
      where: { id: id as string },
      data: {
        description: body.description,
        rate: new Prisma.Decimal(body.rate),
        duration: parseInt(body.duration),
        color: body.color,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
