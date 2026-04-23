import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.gpuProduct.findMany({
      where: { isActive: true },
      orderBy: { pricePerHour: "asc" }
    });
    return NextResponse.json({ products });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
