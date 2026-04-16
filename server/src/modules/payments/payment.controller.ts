import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export class PaymentController {
  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.body;

      if (!ideaId) {
        res.status(400).json({ success: false, message: 'Idea ID is required' });
        return;
      }

      const result = await paymentService.createCheckoutSession(req.user!.id, ideaId);
      sendCreated(res, result, 'Checkout session created');
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const payment = await paymentService.verifyPayment(sessionId as string, req.user!.id);
      sendSuccess(res, payment, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const result = await paymentService.checkPaymentStatus(req.user!.id, ideaId as string);
      sendSuccess(res, result, 'Payment status retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
