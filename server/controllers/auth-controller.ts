import { Request, Response } from 'express';
import { prisma } from '../db';
import { authUtils } from '../utils/auth';
import { connection as redis } from '../queue';
import { getSMSService, getEmailService } from '../providers/provider-factory';

const OTP_PREFIX = 'auth:otp:';
const OTP_EXPIRY = 300; // 5 mins

export const authController = {
    // Send OTP
    sendOTP: async (req: Request, res: Response) => {
        const { type, account } = req.body;
        if (!type || !account) return res.status(400).json({ error: 'Type and account are required' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `${OTP_PREFIX}${account}`;

        try {
            await redis.set(key, code, 'EX', OTP_EXPIRY);

            if (type === 'phone') {
                await getSMSService().sendOTP(account, code);
            } else {
                await getEmailService().sendOTP(account, code);
            }

            res.json({ success: true, message: 'OTP sent successfully' });
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to send OTP', details: err.message });
        }
    },

    // Login/Register with OTP
    loginWithOTP: async (req: Request, res: Response) => {
        const { type, account, code } = req.body;
        if (!account || !code) return res.status(400).json({ error: 'Account and code are required' });

        const key = `${OTP_PREFIX}${account}`;
        const storedCode = await redis.get(key);

        if (!storedCode || storedCode !== code) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Clear OTP after use
        await redis.del(key);

        try {
            // Find or create user
            let user = await prisma.user.findFirst({
                where: type === 'phone' ? { phone: account } : { email: account }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        nickname: `User_${account.slice(-4)}`,
                        [type === 'phone' ? 'phone' : 'email']: account,
                    }
                });
            }

            const accessToken = authUtils.generateAccessToken(user.id);
            const refreshToken = authUtils.generateRefreshToken(user.id);

            // Store refresh token in DB
            await prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            });

            res.json({
                user: { id: user.id, nickname: user.nickname, avatar: user.avatar, vipLevel: user.vipLevel },
                accessToken,
                refreshToken
            });
        } catch (err: any) {
            res.status(500).json({ error: 'Login failed', details: err.message });
        }
    },

    // Refresh token
    refreshToken: async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const payload = authUtils.verifyRefreshToken(refreshToken);
        if (!payload) return res.status(401).json({ error: 'Invalid refresh token' });

        try {
            const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
            if (!storedToken || storedToken.expiresAt < new Date()) {
                return res.status(401).json({ error: 'Token expired or revoked' });
            }

            const newAccessToken = authUtils.generateAccessToken(payload.userId);
            res.json({ accessToken: newAccessToken });
        } catch (err: any) {
            res.status(500).json({ error: 'Refresh failed', details: err.message });
        }
    },

    // Logout
    logout: async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        }
        res.json({ success: true });
    }
};
