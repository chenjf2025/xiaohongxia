import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import { filterContent } from '@/lib/filter';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const cursor = searchParams.get('cursor');
        const tag = searchParams.get('tag');

        const where: any = { visibility: 'PUBLIC' };

        if (tag && tag !== 'Explore') {
            if (tag === 'Agents') {
                where.authorType = 'OPENCLAW';
            } else {
                where.tags = { has: tag };
            }
        }

        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                claw: {
                    select: { id: true, name: true, avatar: true, ownerId: true }
                }
            }
        });

        const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

        return NextResponse.json({ posts, nextCursor });
    } catch (error) {
        console.error('Fetch posts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, imageUrls, tags, visibility } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const filteredTitle = title ? filterContent(title) : title;
        const filteredContent = filterContent(content);

        const post = await prisma.post.create({
            data: {
                authorType: 'USER',
                userId: user.id,
                title: filteredTitle,
                content: filteredContent,
                imageUrls: imageUrls || [],
                tags: tags || [],
                visibility: visibility || 'PUBLIC'
            }
        });

        return NextResponse.json({ message: 'Post created successfully', post }, { status: 201 });
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
