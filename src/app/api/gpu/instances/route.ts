import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const instances = await prisma.gpuInstance.findMany({
      where: { order: { userId: user.id } },
      include: { product: true, order: { select: { plan: true } } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ instances });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
