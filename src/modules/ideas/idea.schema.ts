import { z } from 'zod';

export const createIdeaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  problemStatement: z.string().min(10, 'Problem statement must be at least 10 characters'),
  proposedSolution: z.string().min(10, 'Proposed solution must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  isPaid: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  price: z.preprocess(
    (val) => (val ? parseFloat(val as string) : undefined),
    z.number().positive('Price must be positive').optional()
  ),
  status: z.enum(['DRAFT', 'UNDER_REVIEW']).default('DRAFT'),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  problemStatement: z.string().min(10).optional(),
  proposedSolution: z.string().min(10).optional(),
  description: z.string().min(20).optional(),
  categoryId: z.string().optional(),
  isPaid: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  price: z.preprocess(
    (val) => (val ? parseFloat(val as string) : undefined),
    z.number().positive().optional()
  ),
});

export const updateIdeaStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminFeedback: z.string().optional(),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type UpdateIdeaStatusInput = z.infer<typeof updateIdeaStatusSchema>;
