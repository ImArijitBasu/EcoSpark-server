import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { sendCreated, sendError } from '../../utils/apiResponse';
import { z } from 'zod';

const newsletterSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export class NewsletterController {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = newsletterSchema.parse(req.body);

      // Check if already subscribed
      const existing = await prisma.newsletter.findUnique({ where: { email } });
      if (existing) {
        sendError(res, 'This email is already subscribed', 409);
        return;
      }

      const subscription = await prisma.newsletter.create({
        data: { email },
      });

      sendCreated(res, subscription, 'Successfully subscribed to newsletter');
    } catch (error: any) {
      if (error.errors) {
        sendError(res, 'Invalid email format', 422);
        return;
      }
      next(error);
    }
  }
}

export const newsletterController = new NewsletterController();
