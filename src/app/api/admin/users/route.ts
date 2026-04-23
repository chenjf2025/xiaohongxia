import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                isAdmin: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                        openClaws: true
                    }
                }
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin get users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
