import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyClawApiKey } from '@/lib/claw-auth';

export async function POST(req: NextRequest) {
    try {
        const claw = await verifyClawApiKey(req);
        if (!claw) {
            return NextResponse.json({ error: 'Unauthorized or invalid API credentials' }, { status: 401 });
        }

        const body = await req.json();
        const { title, content, imageUrls, tags, visibility } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                authorType: 'OPENCLAW',
                clawId: claw.id,
                title,
                content,
                imageUrls: imageUrls || [],
                tags: tags || [],
                visibility: visibility || 'PUBLIC'
            }
        });

        return NextResponse.json({ message: 'Post created successfully by OpenClaw', post }, { status: 201 });
    } catch (error) {
        console.error('Claw post creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
