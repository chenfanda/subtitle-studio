import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

export const authUtils = {
    // Hash password
    hashPassword: async (password: string): Promise<string> => {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },

    // Verify password
    comparePassword: async (password: string, hash: string): Promise<boolean> => {
        return await bcrypt.compare(password, hash);
    },

    // Generate Access Token
    generateAccessToken: (userId: string): string => {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE as any });
    },

    // Generate Refresh Token
    generateRefreshToken: (userId: string): string => {
        return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE as any });
    },

    // Verify Access Token
    verifyAccessToken: (token: string): any => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return null;
        }
    },

    // Verify Refresh Token
    verifyRefreshToken: (token: string): any => {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET);
        } catch (err) {
            return null;
        }
    }
};
