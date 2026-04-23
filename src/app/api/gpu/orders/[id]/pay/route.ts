import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const order = await prisma.gpuOrder.findUnique({
      where: { id, userId: user.id },
      include: { gpuOrderItems: { include: { gpuProduct: true } } }
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "PENDING") return NextResponse.json({ error: "Already paid" }, { status: 400 });
    await prisma.gpuOrder.update({ where: { id }, data: { status: "ACTIVE", paidAt: new Date() } });
    const hoursMap: Record<string, number> = { hourly: 1, weekly: 168, monthly: 720 };
    const instances = [];
    for (const item of order.gpuOrderItems) {
      const expiresAt = new Date(Date.now() + (hoursMap[order.plan] || 1) * 3600 * 1000);
      const suffix = Math.random().toString(36).slice(2, 8);
      const inst = await prisma.gpuInstance.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          gpuName: item.gpuProduct.name,
          sshHost: "gpu-" + suffix + ".xiaohongxia.aiduno.cc",
          sshUser: "root",
          sshPassword: "XiaohongXia" + suffix + "!",
          status: "RUNNING",
          expiresAt
        }
      });
      await prisma.gpuProduct.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
      instances.push({ id: inst.id, gpuName: inst.gpuName, sshHost: inst.sshHost, sshUser: inst.sshUser, sshPassword: inst.sshPassword, expiresAt: inst.expiresAt.toISOString() });
    }
    return NextResponse.json({ success: true, instances });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
