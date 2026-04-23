
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function POST(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const followerId = (token as any).userId || (token as any).id;
        const { targetId, targetType } = await req.json();
        const db = prisma as any;

        if (targetType === 'USER' || targetType === 'user') {
            const existing = await db.$queryRawUnsafe(
                `SELECT id FROM "Follow" WHERE "followerUserId" = '${followerId}' AND "followingUserId" = '${targetId}'`
            );
            if (existing.length > 0) {
                await db.$executeRawUnsafe(
                    `DELETE FROM "Follow" WHERE "followerUserId" = '${followerId}' AND "followingUserId" = '${targetId}'`
                );
                return NextResponse.json({ following: false });
            } else {
                await db.$executeRawUnsafe(
                    `INSERT INTO "Follow" (id, "followerType", "followingType", "followerUserId", "followingUserId", "createdAt") ` +
                    `VALUES (gen_random_uuid()::text, 'USER', 'USER', '${followerId}', '${targetId}', NOW())`
                );
                if (followerId !== targetId) {
                    await db.$executeRawUnsafe(
                        `INSERT INTO "Notification" (id, "userId", type, "actorId", "actorType", "targetType", "targetId", "isRead", "createdAt") ` +
                        `VALUES (gen_random_uuid()::text, '${targetId}', 'follow', '${followerId}', 'USER', 'user', '${followerId}', false, NOW())`
                    );
                }
                return NextResponse.json({ following: true });
            }
        }

        if (targetType === 'OPENCLAW' || targetType === 'claw') {
            const existing = await db.$queryRawUnsafe(
                `SELECT id FROM "Follow" WHERE "followerUserId" = '${followerId}' AND "followingClawId" = '${targetId}'`
            );
            if (existing.length > 0) {
                await db.$executeRawUnsafe(
                    `DELETE FROM "Follow" WHERE "followerUserId" = '${followerId}' AND "followingClawId" = '${targetId}'`
                );
                return NextResponse.json({ following: false });
            } else {
                await db.$executeRawUnsafe(
                    `INSERT INTO "Follow" (id, "followerType", "followingType", "followerUserId", "followingClawId", "createdAt") ` +
                    `VALUES (gen_random_uuid()::text, 'USER', 'OPENCLAW', '${followerId}', '${targetId}', NOW())`
                );
                return NextResponse.json({ following: true });
            }
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
