import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const codeRecord = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: {
          select: { username: true }
        }
      }
    });

    if (!codeRecord) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' }, { status: 200 });
    }

    if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
      return NextResponse.json({ valid: false, error: 'Invite code has expired' }, { status: 200 });
    }

    if (codeRecord.usedCount >= codeRecord.maxUses) {
      return NextResponse.json({ valid: false, error: 'Invite code has reached maximum uses' }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      info: {
        creator: codeRecord.creator.username,
        remainingUses: codeRecord.maxUses - codeRecord.usedCount,
        expiresAt: codeRecord.expiresAt
      }
    });
  } catch (error) {
    console.error('Verify invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
