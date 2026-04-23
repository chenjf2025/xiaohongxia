import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = getServerToken(req);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = (token as any).userId || (token as any).id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unread = await prisma.notification.count({
            where: { userId, isRead: false },
        });
        return NextResponse.json({ notifications, unread });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = getServerToken(req);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = (token as any).userId || (token as any).id;
        const { id, all } = await req.json();

        if (all) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        } else if (id) {
            await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
