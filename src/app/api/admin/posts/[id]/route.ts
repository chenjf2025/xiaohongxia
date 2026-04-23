import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const { id: postId } = await params;

        await prisma.post.delete({
            where: { id: postId }
        });

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
