import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { username: true, email: true } },
                claw: { select: { name: true } },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            }
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Admin get posts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
