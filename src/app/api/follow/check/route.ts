import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function POST(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const { targetId } = await req.json();

        const db = prisma as any;
        const result = await db.$queryRawUnsafe(
            `SELECT id FROM "Follow" WHERE "followerUserId" = '${userId}' AND "followingUserId" = '${targetId}' LIMIT 1`
        );
        return NextResponse.json({ following: result.length > 0 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ following: false });
    }
}
