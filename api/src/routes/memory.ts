import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { storeMemory, listMemories, updateMemory, deleteMemory, searchMemory } from '../services/memory';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    if (search) {
      const results = await searchMemory(req.userId!, search, 20);
      res.json({ memories: results });
      return;
    }

    const memories = await listMemories(req.userId!, category);
    res.json({ memories });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { content, category, expiresInDays } = req.body;

    if (!content || !category) {
      res.status(400).json({ error: 'Content and category are required' });
      return;
    }

    const memory = await storeMemory(req.userId!, content, category, expiresInDays);
    res.status(201).json({ memory });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { content, category } = req.body;
    const id = req.params.id as string;
    const memory = await updateMemory(id, req.userId!, { content, category });
    res.json({ memory });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await deleteMemory(id, req.userId!);
    res.json({ message: 'Memory deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
