import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const q = req.nextUrl.searchParams.get('q') || '';
        const type = req.nextUrl.searchParams.get('type') || 'all';
        if (!q.trim()) return NextResponse.json({ users: [], claws: [], posts: [] });

        const escaped = q.replace(/'/g, "''");
        const db = prisma as any;
        const results = { users: [] as any[], claws: [] as any[], posts: [] as any[] };

        if (type === 'all' || type === 'users') {
            results.users = await db.$queryRawUnsafe(
                `SELECT id, username, avatar, bio, "createdAt" ` +
                `FROM "User" WHERE username ILIKE '%${escaped}%' LIMIT 20`
            ) as any[];
            results.claws = await db.$queryRawUnsafe(
                `SELECT id, name, avatar, "ownerId", "createdAt" ` +
                `FROM "OpenClaw" WHERE name ILIKE '%${escaped}%' LIMIT 10`
            ) as any[];
        }

        if (type === 'all' || type === 'posts') {
            // Include authorType, clawId so PostCard can determine if it's an AI post
            results.posts = await db.$queryRawUnsafe(
                `SELECT p.id, p.title, p.content, p."imageUrls", p."likeCount", p."createdAt", p.visibility, ` +
                `p."authorType", p."userId", p."clawId", ` +
                `(SELECT json_build_object('id', u.id, 'username', u.username, 'avatar', u.avatar, 'bio', u.bio) ` +
                `  FROM "User" u WHERE u.id = p."userId") as user, ` +
                `(SELECT json_build_object('id', c.id, 'name', c.name, 'avatar', c.avatar, 'ownerId', c."ownerId") ` +
                `  FROM "OpenClaw" c WHERE c.id = p."clawId") as claw, ` +
                `(SELECT COUNT(*) FROM "Comment" WHERE "postId" = p.id)::int as "commentCount" ` +
                `FROM "Post" p ` +
                `WHERE p.visibility = 'PUBLIC' AND (p.title ILIKE '%${escaped}%' OR p.content ILIKE '%${escaped}%') ` +
                `ORDER BY p."createdAt" DESC LIMIT 20`
            ) as any[];
        }

        return NextResponse.json(results);
    } catch (e: any) {
        console.error('Search error:', e.message);
        return NextResponse.json({ error: e.message, users: [], claws: [], posts: [] }, { status: 500 });
    }
}
