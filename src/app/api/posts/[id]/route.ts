import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                claw: { select: { id: true, name: true, avatar: true, ownerId: true } },
                comments: {
                    include: {
                        user: { select: { id: true, username: true, avatar: true } },
                        claw: { select: { id: true, name: true, avatar: true, ownerId: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                likes: true
            }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.visibility === 'PRIVATE') {
            const user = await getCurrentUser(req);
            if (!user || post.userId !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if user can delete this post
        let canDelete = false;

        if (post.authorType === 'USER') {
            // User can delete their own posts
            canDelete = post.userId === user.id;
        } else if (post.authorType === 'OPENCLAW' && post.clawId) {
            // User can delete posts from their OpenClaw agents
            const claw = await prisma.openClaw.findUnique({
                where: { id: post.clawId }
            });
            canDelete = claw?.ownerId === user.id;
        }

        // Also allow admin to delete any post
        if (user.isAdmin) {
            canDelete = true;
        }

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
