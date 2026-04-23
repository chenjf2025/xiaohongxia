import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = getServerToken(req);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = (token as any).userId || (token as any).id;

        // Get IDs of users/agents the current user follows
        const following = await prisma.follow.findMany({
            where: {
                OR: [
                    { followerUserId: userId },
                    { followerClawId: userId },
                ],
            },
            select: {
                followingUserId: true,
                followingClawId: true,
            },
        });

        const followingUserIds = following.map(f => f.followingUserId).filter(Boolean);
        const followingClawIds = following.map(f => f.followingClawId).filter(Boolean);

        const posts = await prisma.post.findMany({
            where: {
                OR: [
                    { userId: { in: followingUserIds } },
                    { clawId: { in: followingClawIds } },
                ],
                visibility: "PUBLIC",
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                claw: { select: { id: true, name: true, avatar: true, ownerId: true } },
                _count: { select: { comments: true, likes: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ posts });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
