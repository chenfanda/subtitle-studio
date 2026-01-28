import { Request, Response } from 'express';
import { prisma } from '../db';
import { AuthenticatedRequest } from '../middleware/auth-middleware';

export const userController = {
    // Get current user profile
    getProfile: async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    nickname: true,
                    avatar: true,
                    vipLevel: true,
                    vipExpiresAt: true,
                    email: true,
                    phone: true,
                }
            });

            if (!user) return res.status(404).json({ error: 'User not found' });

            // Check if VIP has expired
            if (user.vipLevel === 'pro' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { vipLevel: 'free' }
                });
                user.vipLevel = 'free';
            }

            res.json({ user });
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
        }
    },

    // Mock Subscription Logic
    subscribe: async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        const { planId } = req.body; // 'weekly' | 'monthly' | 'quarterly' | 'yearly'

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!planId) return res.status(400).json({ error: 'Plan ID is required' });

        // Industry standard durations (in days)
        const durations: Record<string, number> = {
            weekly: 7,
            monthly: 30,
            quarterly: 90,
            yearly: 365,
        };

        const days = durations[planId.toLowerCase()];
        if (!days) return res.status(400).json({ error: 'Invalid plan ID' });

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ error: 'User not found' });

            let newExpiry = new Date();
            // If already a pro and not expired, extend from existing expiry
            if (user.vipLevel === 'pro' && user.vipExpiresAt && user.vipExpiresAt > new Date()) {
                newExpiry = new Date(user.vipExpiresAt);
            }
            newExpiry.setDate(newExpiry.getDate() + days);

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    vipLevel: 'pro',
                    vipExpiresAt: newExpiry,
                },
                select: {
                    id: true,
                    nickname: true,
                    avatar: true,
                    vipLevel: true,
                    vipExpiresAt: true,
                }
            });

            res.json({
                success: true,
                message: `Successfully subscribed to ${planId} plan`,
                user: updatedUser
            });
        } catch (err: any) {
            res.status(500).json({ error: 'Subscription failed', details: err.message });
        }
    }
};
