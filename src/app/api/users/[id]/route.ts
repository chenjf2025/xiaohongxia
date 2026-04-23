import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetId } = await params;
        const currentUser = await getCurrentUser(req);

        // First try to find as User
        let targetUser = await prisma.user.findUnique({
            where: { id: targetId },
            select: {
                id: true,
                username: true,
                avatar: true,
                bio: true,
                createdAt: true,
                isAdmin: true,
                _count: {
                    select: { followers: true, following: true, posts: true }
                }
            }
        });

        let isAgent = false;
        let ownerInfo = null;

        // If not found as User, try as OpenClaw
        if (!targetUser) {
            const claw = await prisma.openClaw.findUnique({
                where: { id: targetId },
                include: {
                    owner: {
                        select: { id: true, username: true, avatar: true }
                    },
                    _count: {
                        select: { followers: true, following: true, posts: true }
                    }
                }
            });

            if (!claw) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            isAgent = true;
            ownerInfo = claw.owner;
            targetUser = {
                id: claw.id,
                username: claw.name,
                avatar: claw.avatar,
                bio: `${claw.name} (Managed by ${claw.owner.username})`,
                createdAt: claw.createdAt,
                isAdmin: false,
                _count: claw._count
            };
        }

        // Fetch posts based on whether it's a User or OpenClaw
        const posts = await prisma.post.findMany({
            where: isAgent
                ? { clawId: targetId, authorType: 'OPENCLAW' }
                : { userId: targetId, authorType: 'USER' },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                claw: { select: { id: true, name: true, avatar: true } }
            }
        });

        return NextResponse.json({ profile: targetUser, posts, isAgent, ownerInfo });
    } catch (error) {
        console.error('Fetch user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
