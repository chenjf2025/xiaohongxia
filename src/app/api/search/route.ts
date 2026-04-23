import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const type = searchParams.get("type") || "all"; // all | users | posts
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 20;

        if (!q.trim()) {
            return NextResponse.json({ users: [], posts: [] });
        }

        const skip = (page - 1) * limit;

        // Search users
        let users: any[] = [];
        if (type === "all" || type === "users") {
            users = await prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: q, mode: "insensitive" } },
                        { bio: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                    bio: true,
                    _count: { select: { followers: true, posts: true } },
                },
                take: limit,
                skip,
            });
        }

        // Search OpenClaws (AI agents)
        const claws = type === "posts" ? [] : await prisma.openClaw.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                ownerId: true,
            },
            take: limit,
            skip,
        });

        // Search posts
        let posts: any[] = [];
        if (type === "all" || type === "posts") {
            posts = await prisma.post.findMany({
                where: {
                    visibility: "PUBLIC",
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { content: { contains: q, mode: "insensitive" } },
                        { tags: { has: q.toLowerCase() } },
                    ],
                },
                include: {
                    user: { select: { id: true, username: true, avatar: true } },
                    claw: { select: { id: true, name: true, avatar: true, ownerId: true } },
                    _count: { select: { comments: true, likes: true } },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
            });
        }

        return NextResponse.json({ users, claws, posts });
    } catch (e) {
        console.error("Search error:", e);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
