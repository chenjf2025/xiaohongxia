import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { filterContent } from '@/lib/filter';

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
        const body = await req.json();
        const { content, parentId } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post || post.visibility === 'PRIVATE') {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const filteredContent = filterContent(content);

        const comment = await prisma.comment.create({
            data: {
                postId,
                authorType: 'USER',
                userId: user.id,
                content: filteredContent,
                parentId
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }
            }
        });

        return NextResponse.json({ message: 'Comment created successfully', comment }, { status: 201 });
    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
