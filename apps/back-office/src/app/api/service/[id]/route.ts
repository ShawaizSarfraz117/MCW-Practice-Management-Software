import { prisma } from "@mcw/database";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = params.id;
  console.log(id, "id");

  const body = await req.json();
  console.log(body, "body");

  try {
    const updatedService = await prisma.practiceService.update({
      where: { id },
      data: {
        description: body.description,
        rate: new Prisma.Decimal(body.rate),
        duration: parseInt(body.duration),
        color: body.color || "#2D8467",
        code: body.code,
        // add any other fields you want to update
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}
