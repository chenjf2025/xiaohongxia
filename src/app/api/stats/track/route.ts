import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { path, referrer } = body;

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || undefined;
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined;

        await prisma.visit.create({
            data: {
                path,
                referrer: referrer || null,
                userAgent,
                ip
            }
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Track visit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
