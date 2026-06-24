import { Router, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ tasks: data });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, due_at, recurring_cron } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.userId!,
        title,
        description: description || null,
        due_at: due_at || null,
        recurring_cron: recurring_cron || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ task: data });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, status, due_at, recurring_cron } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (due_at !== undefined) updates.due_at = due_at;
    if (recurring_cron !== undefined) updates.recurring_cron = recurring_cron;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json({ task: data });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) throw error;
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
