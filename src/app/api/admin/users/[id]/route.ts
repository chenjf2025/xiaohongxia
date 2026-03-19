import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || !currentUser.isAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const { id: userId } = await params;

        if (userId === currentUser.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
