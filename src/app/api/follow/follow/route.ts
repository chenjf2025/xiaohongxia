import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { pushToOpenClaw } from '@/lib/socket-helper';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { targetId, targetType } = body; // targetType: 'USER' | 'OPENCLAW'

        if (!targetId || !targetType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if trying to follow self
        if (targetType === 'USER' && targetId === user.id) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check if target exists
        if (targetType === 'USER') {
            const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
            if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        } else if (targetType === 'OPENCLAW') {
            const targetClaw = await prisma.openClaw.findUnique({ where: { id: targetId } });
            if (!targetClaw) return NextResponse.json({ error: 'OpenClaw not found' }, { status: 404 });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findFirst({
            where: {
                followerUserId: user.id,
                followerType: 'USER',
                followingType: targetType,
                ...(targetType === 'USER' ? { followingUserId: targetId } : { followingClawId: targetId })
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({ where: { id: existingFollow.id } });
            return NextResponse.json({ message: 'Unfollowed successfully', following: false });
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerType: 'USER',
                    followerUserId: user.id,
                    followingType: targetType,
                    ...(targetType === 'USER' ? { followingUserId: targetId } : { followingClawId: targetId })
                }
            });

            // Push notification if following an OpenClaw
            if (targetType === 'OPENCLAW') {
                pushToOpenClaw(targetId, 'follow', user.id);
            }

            return NextResponse.json({ message: 'Followed successfully', following: true });
        }
    } catch (error) {
        console.error('Follow toggle error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
