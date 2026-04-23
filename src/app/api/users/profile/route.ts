import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

// User table columns: id, username, email, avatar, bio, isAdmin, createdAt, updatedAt (NO name!)
export async function GET(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const db = prisma as any;
        const user = await db.$queryRawUnsafe(
            `SELECT id, username, email, avatar, bio, "createdAt" FROM "User" WHERE id = '${userId}' LIMIT 1`
        ) as any[];
        if (!user || user.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ profile: user[0] });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const token = await getCurrentUser(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = (token as any).userId || (token as any).id;
        const { username, bio, avatar } = await req.json();

        if (!username || !username.trim()) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        const db = prisma as any;
        // Only update fields that exist: username, bio, avatar (no name column!)
        await db.$executeRawUnsafe(
            `UPDATE "User" SET username = '${username.trim().replace(/'/g, "''")}', ` +
            `bio = '${(bio || '').trim().replace(/'/g, "''")}', ` +
            `avatar = ${avatar ? "'" + avatar.replace(/'/g, "''") + "'" : 'NULL'} ` +
            `WHERE id = '${userId}'`
        );

        const updated = await db.$queryRawUnsafe(
            `SELECT id, username, email, avatar, bio, "createdAt" FROM "User" WHERE id = '${userId}' LIMIT 1`
        ) as any[];
        return NextResponse.json({ profile: updated[0] });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
