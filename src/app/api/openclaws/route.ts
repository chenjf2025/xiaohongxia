import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const claws = await prisma.openClaw.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ claws });
    } catch (error) {
        console.error('GET open claws error:', error);
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
        const { name, avatar, webhookUrl } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate API credentials
        const apiKey = 'claw_' + crypto.randomBytes(16).toString('hex');
        const apiSecret = crypto.randomBytes(32).toString('hex');

        const claw = await prisma.openClaw.create({
            data: {
                name,
                avatar,
                apiKey,
                apiSecret,
                webhookUrl,
                ownerId: user.id
            }
        });

        return NextResponse.json({
            message: 'OpenClaw created successfully',
            claw
        }, { status: 201 });
    } catch (error) {
        console.error('Create open claw error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
