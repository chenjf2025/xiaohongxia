import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log('Available models:', Object.keys(prisma));

        const totalVisits = await prisma.visit.count();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentVisits = await prisma.visit.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo }
            },
            orderBy: { createdAt: 'asc' }
        });

        const visitsByDay: Record<string, number> = {};
        recentVisits.forEach((v: any) => {
            const day = v.createdAt.toISOString().split('T')[0];
            visitsByDay[day] = (visitsByDay[day] || 0) + 1;
        });

        const popularPagesRaw = await prisma.visit.groupBy({
            by: ['path'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    path: 'desc'
                }
            },
            take: 10
        });

        const popularPages = popularPagesRaw.map((p: any) => ({
            path: p.path,
            count: p._count._all
        }));

        return NextResponse.json({
            totalVisits,
            dailyStats: Object.entries(visitsByDay).map(([date, count]) => ({ date, count })),
            popularPages
        });
    } catch (error) {
        console.error('Stats summary error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
