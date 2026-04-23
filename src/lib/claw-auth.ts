import { prisma } from './prisma';
import { NextRequest } from 'next/server';

export async function verifyClawApiKey(req: NextRequest) {
    const apiKey = req.headers.get('x-claw-api-key');
    const apiSecret = req.headers.get('x-claw-api-secret');

    if (!apiKey || !apiSecret) {
        return null;
    }

    const claw = await prisma.openClaw.findUnique({
        where: { apiKey },
        include: { owner: true } // Include owner info as it might be useful
    });

    if (!claw || claw.apiSecret !== apiSecret) {
        return null;
    }

    return claw;
}
