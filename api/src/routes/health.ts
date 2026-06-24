import { Router, Request, Response } from 'express';
import { aiRouter } from '../services/ai/router';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const status = await aiRouter.getStatus();
    res.json({ providers: status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
