import { Router, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { getCartesiaToken, listVoices, synthesizeSpeech } from '../services/voice';

const router = Router();

router.post('/token', requireAuth, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = await getCartesiaToken();
    res.json({ token, wsUrl: 'wss://api.cartesia.ai/tts/websocket' });
  } catch (err) {
    next(err);
  }
});

router.get('/voices', requireAuth, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const voices = await listVoices();
    res.json({ voices });
  } catch (err) {
    next(err);
  }
});

router.post('/synthesize', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const audio = await synthesizeSpeech(text, voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091');

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audio.length);
    res.send(audio);
  } catch (err) {
    next(err);
  }
});

router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ sessions: data });
  } catch (err) {
    next(err);
  }
});

router.post('/history', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { transcript, duration_seconds } = req.body;

    const { data, error } = await supabase
      .from('voice_sessions')
      .insert({
        user_id: req.userId!,
        transcript: transcript || [],
        duration_seconds: duration_seconds || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ session: data });
  } catch (err) {
    next(err);
  }
});

export default router;
