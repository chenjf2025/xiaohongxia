import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Support both email and username login
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username: email }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = await signToken({ userId: user.id, username: user.username });

        return NextResponse.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
