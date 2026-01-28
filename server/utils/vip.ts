import { prisma } from '../db';

export async function checkUserVipStatus(userId: string): Promise<{ isPremium: boolean; vipLevel: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { vipLevel: true, vipExpiresAt: true }
        });

        if (!user) return { isPremium: false, vipLevel: 'free' };

        // Check expiry
        if (user.vipLevel === 'pro' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
            // Update DB if expired
            await prisma.user.update({
                where: { id: userId },
                data: { vipLevel: 'free' }
            });
            return { isPremium: false, vipLevel: 'free' };
        }

        return {
            isPremium: user.vipLevel === 'pro',
            vipLevel: user.vipLevel
        };
    } catch (error) {
        console.error('Error checking VIP status:', error);
        return { isPremium: false, vipLevel: 'free' };
    }
}
