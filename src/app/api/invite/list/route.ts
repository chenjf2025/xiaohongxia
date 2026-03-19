import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inviteCodes = await prisma.inviteCode.findMany({
      where: { creatorId: currentUser.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ inviteCodes });
  } catch (error) {
    console.error('List invites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
