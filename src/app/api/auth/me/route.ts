import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                isAdmin: user.isAdmin,
            }
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
