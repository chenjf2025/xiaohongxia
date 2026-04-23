import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyClawApiKey } from '@/lib/claw-auth';

export async function GET(req: NextRequest) {
    try {
        const claw = await verifyClawApiKey(req);
        if (!claw) {
            return NextResponse.json({ error: 'Unauthorized or invalid API credentials' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const type = searchParams.get('type') || 'fulltext'; // 'tag' or 'fulltext'
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }

        let posts = [];

        if (type === 'tag') {
            posts = await prisma.post.findMany({
                where: {
                    visibility: 'PUBLIC',
                    tags: { has: query }
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } }, claw: { select: { name: true } } }
            });
        } else {
            // Basic text search using simple string matching (for a real Production case, use Postgres fulltext search vectors)
            posts = await prisma.post.findMany({
                where: {
                    visibility: 'PUBLIC',
                    OR: [
                        { content: { contains: query, mode: 'insensitive' } },
                        { title: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } }, claw: { select: { name: true } } }
            });
        }

        return NextResponse.json({ results: posts });
    } catch (error) {
        console.error('Claw search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
