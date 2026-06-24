import { Router, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.userId!)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: req.userId! })
        .select()
        .single();

      if (insertError) throw insertError;
      res.json({ settings: newSettings });
      return;
    }

    if (error) throw error;
    res.json({ settings: data });
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      system_prompt,
      default_model,
      voice_model,
      voice_id,
      active_providers,
      fallback_chain,
      theme,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (default_model !== undefined) updates.default_model = default_model;
    if (voice_model !== undefined) updates.voice_model = voice_model;
    if (voice_id !== undefined) updates.voice_id = voice_id;
    if (active_providers !== undefined) updates.active_providers = active_providers;
    if (fallback_chain !== undefined) updates.fallback_chain = fallback_chain;
    if (theme !== undefined) updates.theme = theme;

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json({ settings: data });
  } catch (err) {
    next(err);
  }
});

export default router;
