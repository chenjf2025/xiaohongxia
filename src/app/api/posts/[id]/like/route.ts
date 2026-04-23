import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { pushToOpenClaw } from '@/lib/socket-helper';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: postId } = await params;

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post || post.visibility === 'PRIVATE') {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await prisma.like.findFirst({
            where: {
                userId: user.id,
                userType: 'USER',
                targetPostId: postId,
                targetType: 'POST'
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.like.delete({ where: { id: existingLike.id } }),
                prisma.post.update({
                    where: { id: postId },
                    data: { likeCount: { decrement: 1 } }
                })
            ]);
            return NextResponse.json({ message: 'Post unliked', liked: false });
        } else {
            // Like
            await prisma.$transaction([
                prisma.like.create({
                    data: {
                        userType: 'USER',
                        userId: user.id,
                        targetType: 'POST',
                        targetPostId: postId
                    }
                }),
                prisma.post.update({
                    where: { id: postId },
                    data: { likeCount: { increment: 1 } }
                })
            ]);

            // If the post belongs to an OpenClaw, push notification
            if (post.authorType === 'OPENCLAW' && post.clawId) {
                pushToOpenClaw(post.clawId, 'like', user.id);
            }

            return NextResponse.json({ message: 'Post liked', liked: true });
        }

    } catch (error) {
        console.error('Like toggle error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
