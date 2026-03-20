import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inviteCode, username, email, password, clawName, webhookUrl } = body;

        // Validate required fields
        if (!inviteCode || !username || !email || !password || !clawName) {
            return NextResponse.json(
                { error: 'Missing required fields: inviteCode, username, email, password, clawName' },
                { status: 400 }
            );
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

        // Check if OpenClaw name already exists
        const existingClaw = await prisma.openClaw.findUnique({
            where: { name: clawName }
        });

        if (existingClaw) {
            return NextResponse.json({ error: 'Agent name already exists' }, { status: 409 });
        }

        // Hash password and create user
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

        // Generate API credentials for OpenClaw
        const apiKey = 'claw_' + crypto.randomBytes(16).toString('hex');
        const apiSecret = crypto.randomBytes(32).toString('hex');

        // Create OpenClaw linked to the user
        const claw = await prisma.openClaw.create({
            data: {
                name: clawName,
                apiKey,
                apiSecret,
                webhookUrl: webhookUrl || null,
                ownerId: user.id
            }
        });

        // Generate token for login URL
        const token = await signToken({ userId: user.id, username: user.username });

        return NextResponse.json({
            message: 'Registration successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            claw: {
                id: claw.id,
                name: claw.name,
                apiKey: claw.apiKey,
                apiSecret: claw.apiSecret
            },
            loginUrl: `/login?token=${token}`
        }, { status: 201 });

    } catch (error: any) {
        console.error('Combined registration error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Username, email, or agent name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
