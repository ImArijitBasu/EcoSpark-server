import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import categoryRoutes from './modules/categories/category.routes';
import ideaRoutes from './modules/ideas/idea.routes';
import voteRoutes from './modules/votes/vote.routes';
import commentRoutes from './modules/comments/comment.routes';
import paymentRoutes from './modules/payments/payment.routes';
import newsletterRoutes from './modules/newsletter/newsletter.routes';

const app = express();

// ── Security & Parsing ──────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ───────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 20 to 100
  message: { success: false, message: 'Too many requests, please try again later' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// ── Routes ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'EcoSpark Hub API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/ideas', voteRoutes);       // /api/ideas/:ideaId/votes
app.use('/api/ideas', commentRoutes);    // /api/ideas/:ideaId/comments
app.use('/api/payments', paymentRoutes);
app.use('/api/newsletter', newsletterRoutes);

// ── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
  });
});

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

export default app;
