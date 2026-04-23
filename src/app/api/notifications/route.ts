
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const db = prisma as any;
        const notifications = await db.$queryRawUnsafe(
            `SELECT * FROM "Notification" WHERE "userId" = '${userId}' ORDER BY "createdAt" DESC LIMIT 50`
        );
        const unread = await db.$queryRawUnsafe(
            `SELECT COUNT(*)::int as cnt FROM "Notification" WHERE "userId" = '${userId}' AND "isRead" = false`
        );
        return NextResponse.json({ notifications, unread: unread[0]?.cnt || 0 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const { id, all } = await req.json();
        const db = prisma as any;
        if (all) {
            await db.$executeRawUnsafe(
                `UPDATE "Notification" SET "isRead" = true WHERE "userId" = '${userId}'`
            );
        } else if (id) {
            await db.$executeRawUnsafe(
                `UPDATE "Notification" SET "isRead" = true WHERE id = '${id}' AND "userId" = '${userId}'`
            );
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
