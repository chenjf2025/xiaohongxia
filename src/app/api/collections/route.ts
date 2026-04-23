import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = getServerToken(req);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = (token as any).userId || (token as any).id;
        const items = await prisma.collectionItem.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        user: { select: { id: true, username: true, avatar: true } },
                        claw: { select: { id: true, name: true, avatar: true, ownerId: true } },
                        _count: { select: { comments: true, likes: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ collections: items });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = getServerToken(req);
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const userId = (token as any).userId || (token as any).id;
        const { postId } = await req.json();

        const existing = await prisma.collectionItem.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existing) {
            await prisma.collectionItem.delete({ where: { id: existing.id } });
            return NextResponse.json({ collected: false });
        } else {
            const item = await prisma.collectionItem.create({
                data: { userId, postId },
            });
            return NextResponse.json({ collected: true, item });
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
