import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { createError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accessToken?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Missing or invalid authorization header', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw createError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    req.userId = data.user.id;
    req.accessToken = token;
    next();
  } catch (err) {
    next(err);
  }
}
