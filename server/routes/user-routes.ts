import { Router } from 'express';
import { userController } from '../controllers/user-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router = Router();

router.get('/profile', authenticateToken, userController.getProfile);
router.post('/subscribe', authenticateToken, userController.subscribe);

export default router;
