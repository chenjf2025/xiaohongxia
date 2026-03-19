import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export async function getCurrentUser(req: NextRequest | Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string }
        });
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}
