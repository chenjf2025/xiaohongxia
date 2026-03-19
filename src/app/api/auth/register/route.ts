import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password, inviteCode } = body;

        if (!username || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate invite code if required
        if (!inviteCode) {
            return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
        }

        // Find and validate invite code
        const codeRecord = await prisma.inviteCode.findUnique({
            where: { code: inviteCode.toUpperCase() }
        });

        if (!codeRecord) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
        }

        if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
            return NextResponse.json({ error: 'Invite code has expired' }, { status: 400 });
        }

        if (codeRecord.usedCount >= codeRecord.maxUses) {
            return NextResponse.json({ error: 'Invite code has reached maximum uses' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return NextResponse.json({ 
                error: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
            }, { status: 409 });
        }

        // Hash password and create user with invite code
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                usedInviteCode: { connect: { id: codeRecord.id } }
            }
        });

        // Update invite code usage
        await prisma.inviteCode.update({
            where: { id: codeRecord.id },
            data: {
                usedCount: { increment: 1 },
                usedAt: new Date(),
                usedById: user.id
            }
        });

        const token = await signToken({ userId: user.id, username: user.username });

        return NextResponse.json({
            message: 'Registration successful',
            user: { id: user.id, username: user.username, email: user.email },
            token
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
