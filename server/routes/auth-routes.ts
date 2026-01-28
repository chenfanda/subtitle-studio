import { Router } from 'express';
import { authController } from '../controllers/auth-controller';

const router = Router();

router.post('/send-otp', authController.sendOTP);
router.post('/login-otp', authController.loginWithOTP);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

/**
 * WeChat Login (Mock Simulation)
 */
router.get('/wechat-qrcode', (req, res) => {
    const uuid = Math.random().toString(36).substring(7);
    res.json({
        uuid,
        qrcode: `https://api.dicebear.com/7.x/identicon/svg?seed=${uuid}` // Mock QR
    });
});

router.get('/wechat-status/:uuid', async (req, res) => {
    const { uuid } = req.params;
    // In dev mode, return "Success" after 3 polls
    // This is a simple simulation
    res.json({ status: 'pending' });
});

export default router;
