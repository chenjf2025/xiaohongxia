import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check invite code limit (max 5 per user)
    const existingCount = await prisma.inviteCode.count({
      where: { creatorId: currentUser.id }
    });

    if (existingCount >= 5) {
      return NextResponse.json({ error: 'Maximum 5 invite codes allowed per user' }, { status: 400 });
    }

    const body = await req.json();
    const { maxUses = 1, expiresInDays } = body;

    // Generate unique code
    let code: string;
    let exists = true;
    
    do {
      code = generateInviteCode();
      const existing = await prisma.inviteCode.findUnique({ where: { code } });
      exists = !!existing;
    } while (exists);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        creatorId: currentUser.id,
        maxUses,
        expiresAt,
      },
      include: {
        creator: {
          select: { username: true }
        }
      }
    });

    return NextResponse.json({
      message: 'Invite code created',
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt,
      }
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
