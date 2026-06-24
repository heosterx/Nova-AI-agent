import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (data.user) {
      await supabase.from('user_settings').insert({ user_id: data.user.id });
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.auth.getUser(req.accessToken!);
    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.json({ user: data.user });
  } catch (err) {
    next(err);
  }
});

export default router;
