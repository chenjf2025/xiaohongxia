import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        const currentUser = await getCurrentUser(req);

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: { followers: true, following: true }
                }
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const posts = await prisma.post.findMany({
            where: {
                userId: userId,
                authorType: 'USER',
                ...(currentUser?.id !== userId ? { visibility: 'PUBLIC' } : {})
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                claw: { select: { id: true, name: true, avatar: true } }
            }
        });

        return NextResponse.json({ profile: targetUser, posts });
    } catch (error) {
        console.error('Fetch user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
