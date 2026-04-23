import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use raw SQL to avoid Prisma nested relation type limitations
    const rows = await prisma.$queryRaw<
      Array<{
        id: string; orderId: string; productId: string; gpuName: string;
        sshHost: string; sshPort: number; sshUser: string; sshPassword: string;
        status: string; expiresAt: Date; createdAt: Date;
        product_name: string; product_vram: string; product_cudaCores: number;
        plan: string;
      }>
    >`
      SELECT
        i.id, i."orderId", i."productId", i."gpuName",
        i."sshHost", i."sshPort", i."sshUser", i."sshPassword",
        i.status, i."expiresAt", i."createdAt",
        p.name as product_name, p.vram as product_vram, p."cudaCores" as product_cudaCores,
        o.plan
      FROM "GpuInstance" i
      JOIN "GpuOrder" o ON i."orderId" = o.id
      JOIN "GpuProduct" p ON i."productId" = p.id
      WHERE o."userId" = ${user.id}
      ORDER BY i."createdAt" DESC
    `;

    const instances = rows.map(r => ({
      id: r.id,
      orderId: r.orderId,
      productId: r.productId,
      gpuName: r.gpuName,
      sshHost: r.sshHost,
      sshPort: r.sshPort,
      sshUser: r.sshUser,
      sshPassword: r.sshPassword,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      product: { name: r.product_name, vram: r.product_vram, cudaCores: r.cudaCores },
      order: { plan: r.plan }
    }));

    return NextResponse.json({ instances });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
