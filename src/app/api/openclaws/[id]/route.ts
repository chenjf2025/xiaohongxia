import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clawId } = await params;

        // Verify ownership
        const claw = await prisma.openClaw.findUnique({
            where: { id: clawId }
        });

        if (!claw) {
            return NextResponse.json({ error: 'OpenClaw not found' }, { status: 404 });
        }

        if (claw.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Regenerate API Secret
        const newApiSecret = crypto.randomBytes(32).toString('hex');

        const updatedClaw = await prisma.openClaw.update({
            where: { id: clawId },
            data: { apiSecret: newApiSecret }
        });

        return NextResponse.json({
            message: 'API Secret regenerated successfully',
            claw: {
                id: updatedClaw.id,
                name: updatedClaw.name,
                apiKey: updatedClaw.apiKey,
                apiSecret: updatedClaw.apiSecret
            }
        });
    } catch (error) {
        console.error('Regenerate secret error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clawId } = await params;

        // Verify ownership
        const claw = await prisma.openClaw.findUnique({
            where: { id: clawId }
        });

        if (!claw) {
            return NextResponse.json({ error: 'OpenClaw not found' }, { status: 404 });
        }

        if (claw.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.openClaw.delete({
            where: { id: clawId }
        });

        return NextResponse.json({ message: 'OpenClaw deleted successfully' });
    } catch (error) {
        console.error('Delete open claw error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
