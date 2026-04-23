import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const db = prisma as any;

        const following = await db.$queryRawUnsafe(
            `SELECT "followingUserId", "followingClawId" FROM "Follow" WHERE "followerUserId" = '${userId}'`
        ) as any[];

        const userIds: string[] = [];
        const clawIds: string[] = [];
        for (const f of following) {
            if (f.followingUserId) userIds.push(f.followingUserId);
            if (f.followingClawId) clawIds.push(f.followingClawId);
        }

        let posts: any[] = [];
        if (userIds.length > 0 || clawIds.length > 0) {
            const uList = userIds.length > 0 ? userIds.map(id => "'" + id + "'").join(',') : "''";
            const cList = clawIds.length > 0 ? clawIds.map(id => "'" + id + "'").join(',') : "''";
            posts = await db.$queryRawUnsafe(
                `SELECT p.id, p.title, p.content, p."imageUrls", p."likeCount", p."createdAt", p.visibility, ` +
                `row_to_json(u.*) as user, ` +
                `(SELECT COUNT(*) FROM "Comment" WHERE "postId" = p.id)::int as "commentCount" ` +
                `FROM "Post" p ` +
                `JOIN "User" u ON p."userId" = u.id ` +
                `WHERE p.visibility = 'PUBLIC' AND (p."userId" IN (${uList}) OR p."clawId" IN (${cList})) ` +
                `ORDER BY p."createdAt" DESC LIMIT 20`
            ) as any[];
        }

        return NextResponse.json({ posts });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
