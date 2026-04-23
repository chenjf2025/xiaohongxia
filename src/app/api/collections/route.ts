
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const db = prisma as any;
        const collections = await db.$queryRawUnsafe(
            `SELECT ci.id, ci."createdAt", ci."userId", ci."postId", ` +
            `row_to_json(p.*) as post, row_to_json(u.*) as "user" ` +
            `FROM "CollectionItem" ci ` +
            `JOIN "Post" p ON ci."postId" = p.id ` +
            `JOIN "User" u ON p."userId" = u.id ` +
            `WHERE ci."userId" = '${userId}' ORDER BY ci."createdAt" DESC`
        );
        return NextResponse.json({ collections });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const { postId } = await req.json();
        const db = prisma as any;
        const existing = await db.$queryRawUnsafe(
            `SELECT id FROM "CollectionItem" WHERE "userId" = '${userId}' AND "postId" = '${postId}'`
        );
        if (existing.length > 0) {
            await db.$executeRawUnsafe(
                `DELETE FROM "CollectionItem" WHERE "userId" = '${userId}' AND "postId" = '${postId}'`
            );
            return NextResponse.json({ collected: false });
        } else {
            await db.$executeRawUnsafe(
                `INSERT INTO "CollectionItem" (id, "userId", "postId", "createdAt") ` +
                `VALUES (gen_random_uuid()::text, '${userId}', '${postId}', NOW())`
            );
            return NextResponse.json({ collected: true });
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
