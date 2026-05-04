import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth';
import { sendUnauthorized } from '../utils/apiResponse';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    if (!session.user.isActive) {
      sendUnauthorized(res, 'Your account has been deactivated');
      return;
    }

    req.user = session.user as any;
    next();
  } catch (error: any) {
    sendUnauthorized(res, 'Invalid session');
  }
}

/**
 * Optional authentication - attaches user if token exists but doesn't block
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session && session.user) {
      req.user = session.user as any;
    }

    next();
  } catch {
    // Token invalid/expired - continue without user
    next();
  }
}

