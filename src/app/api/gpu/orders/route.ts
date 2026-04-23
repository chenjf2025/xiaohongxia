import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orders = await prisma.gpuOrder.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { plan, productId, quantity = 1 } = await req.json();
    if (!plan || !productId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const product = await prisma.gpuProduct.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return NextResponse.json({ error: "Product not available" }, { status: 404 });
    if (product.stock < quantity) return NextResponse.json({ error: "库存不足" }, { status: 400 });
    const priceMap: Record<string, number> = { hourly: 8, weekly: 300, monthly: 999 };
    const hoursMap: Record<string, number> = { hourly: 1, weekly: 168, monthly: 720 };
    const totalAmount = (priceMap[plan] || 8) * quantity;
    const hours = hoursMap[plan] || 1;
    const order = await prisma.gpuOrder.create({
      data: {
        userId: user.id, plan, totalAmount, status: "PENDING",
        items: { create: { productId, quantity, hours } }
      }
    });
    return NextResponse.json({ orderId: order.id, amount: totalAmount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
