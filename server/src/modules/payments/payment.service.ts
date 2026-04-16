import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class PaymentService {
  /**
   * Create a Stripe Checkout Session for a paid idea
   */
  async createCheckoutSession(userId: string, ideaId: string) {
    // Check idea exists and is paid
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { author: { select: { name: true } } },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (!idea.isPaid || !idea.price) {
      throw new AppError('This idea is free and does not require payment', 400);
    }

    if (idea.status !== 'APPROVED') {
      throw new AppError('This idea is not available', 400);
    }

    // Check if user is the author (authors don't need to pay)
    if (idea.authorId === userId) {
      throw new AppError('You cannot purchase your own idea', 400);
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    if (existingPayment && existingPayment.status === 'completed') {
      throw new AppError('You have already purchased this idea', 400);
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: idea.title,
              description: `Access to "${idea.title}" by ${idea.author.name}`,
            },
            unit_amount: Math.round(idea.price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&idea_id=${ideaId}`,
      cancel_url: `${env.FRONTEND_URL}/payment/cancel?idea_id=${ideaId}`,
      metadata: {
        userId,
        ideaId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Verify a Stripe Checkout Session and create payment record
   */
  async verifyPayment(sessionId: string, userId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new AppError('Payment session not found', 404);
    }

    // Verify metadata matches
    if (session.metadata?.userId !== userId) {
      throw new AppError('Payment session does not match user', 403);
    }

    const ideaId = session.metadata?.ideaId;
    if (!ideaId) {
      throw new AppError('Invalid payment session', 400);
    }

    if (session.payment_status !== 'paid') {
      throw new AppError('Payment has not been completed', 400);
    }

    // Check if payment already recorded
    const existingPayment = await prisma.payment.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    if (existingPayment) {
      return existingPayment;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        stripeSessionId: sessionId,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        status: 'completed',
        userId,
        ideaId,
      },
    });

    return payment;
  }

  /**
   * Check if a user has paid for an idea
   */
  async checkPaymentStatus(userId: string, ideaId: string) {
    const payment = await prisma.payment.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    return {
      hasPaid: payment?.status === 'completed',
      payment,
    };
  }
}

export const paymentService = new PaymentService();
