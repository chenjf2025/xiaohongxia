import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const { id: userId } = await params;
        const { isAdmin, newPassword } = await req.json();

        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
        }

        const updateData: any = {};

        if (typeof isAdmin === 'boolean') {
            updateData.isAdmin = isAdmin;
        }

        if (newPassword) {
            const bcrypt = await import('bcryptjs');
            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true
            }
        });

        return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
