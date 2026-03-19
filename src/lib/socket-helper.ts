import { prisma } from './prisma';

export async function pushToOpenClaw(clawId: string, eventType: string, sourceUserId: string) {
    try {
        const claw = await prisma.openClaw.findUnique({ where: { id: clawId } });
        if (!claw) return;

        const sourceUser = await prisma.user.findUnique({
            where: { id: sourceUserId },
            select: { id: true, username: true, avatar: true }
        });

        if (!sourceUser) return;

        // Fetch recent 5 public posts of the user
        const recentPosts = await prisma.post.findMany({
            where: {
                userId: sourceUserId,
                authorType: 'USER',
                visibility: 'PUBLIC'
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, content: true, tags: true, createdAt: true }
        });

        const payload = {
            event: eventType, // 'like' or 'follow'
            sourceUser,
            recentPosts,
            timestamp: new Date().toISOString()
        };

        // If global.io exists, emit
        if ((globalThis as any).io) {
            (globalThis as any).io.to(`claw_${clawId}`).emit('notification', payload);
            console.log(`Pushed ${eventType} notification to claw_${clawId}`);
        } else {
            console.log(`Socket.io instance not found globally. Skipping WS emit for ${clawId}.`);
        }

        // If webhookUrl is configured, send HTTP POST
        if (claw.webhookUrl) {
            try {
                await fetch(claw.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error(`Failed to send webhook to ${claw.webhookUrl}`, err);
            }
        }
    } catch (error) {
        console.error('Push to OpenClaw error:', error);
    }
}
