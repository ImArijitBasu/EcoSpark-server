import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface GetIdeasQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isPaid?: string;
  sort?: string;
  author?: string;
  minVotes?: string;
}

interface AdminGetIdeasQuery extends GetIdeasQuery {
  status?: string;
}

export class IdeaService {
  /**
   * Get all approved ideas (public) with filters, search, sort, pagination
   */
  async getApprovedIdeas(query: GetIdeasQuery) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {
      status: 'APPROVED',
    };

    // Search by title or description
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { problemStatement: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (query.category) {
      where.categoryId = query.category;
    }

    // Filter by paid/free
    if (query.isPaid !== undefined) {
      where.isPaid = query.isPaid === 'true';
    }

    // Filter by author
    if (query.author) {
      where.authorId = query.author;
    }

    // Filter by min votes
    if (query.minVotes) {
      where.upvoteCount = { gte: parseInt(query.minVotes) };
    }

    // Sorting
    let orderBy: Prisma.IdeaOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'top-voted') {
      orderBy = { upvoteCount: 'desc' };
    } else if (query.sort === 'most-commented') {
      orderBy = { commentCount: 'desc' };
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.idea.count({ where }),
    ]);

    return {
      ideas,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single idea by ID
   * If paid idea and user hasn't paid, return limited data
   */
  async getIdeaById(id: string, userId?: string) {
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    // Only show approved ideas publicly (unless viewer is author or admin)
    if (idea.status !== 'APPROVED') {
      if (!userId || (idea.authorId !== userId)) {
        // Check if admin
        const user = userId
          ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
          : null;
        if (!user || user.role !== 'ADMIN') {
          throw new AppError('Idea not found', 404);
        }
      }
    }

    // If paid idea, check if user has paid
    if (idea.isPaid && idea.authorId !== userId) {
      // Check if admin
      const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
        : null;

      if (user?.role === 'ADMIN') {
        // Admin can see everything
        return { ...idea, hasPaid: true };
      }

      if (!userId) {
        // Not logged in - return limited data
        return {
          id: idea.id,
          title: idea.title,
          category: idea.category,
          author: idea.author,
          isPaid: true,
          price: idea.price,
          images: idea.images.length > 0 ? [idea.images[0]] : [],
          upvoteCount: idea.upvoteCount,
          downvoteCount: idea.downvoteCount,
          commentCount: idea.commentCount,
          createdAt: idea.createdAt,
          hasPaid: false,
          description: idea.description.substring(0, 100) + '...',
          problemStatement: '',
          proposedSolution: '',
        };
      }

      // Check payment
      const payment = await prisma.payment.findUnique({
        where: {
          userId_ideaId: { userId, ideaId: id },
        },
      });

      if (!payment || payment.status !== 'completed') {
        return {
          id: idea.id,
          title: idea.title,
          category: idea.category,
          author: idea.author,
          isPaid: true,
          price: idea.price,
          images: idea.images.length > 0 ? [idea.images[0]] : [],
          upvoteCount: idea.upvoteCount,
          downvoteCount: idea.downvoteCount,
          commentCount: idea.commentCount,
          createdAt: idea.createdAt,
          hasPaid: false,
          description: idea.description.substring(0, 100) + '...',
          problemStatement: '',
          proposedSolution: '',
        };
      }

      return { ...idea, hasPaid: true };
    }

    return { ...idea, hasPaid: true };
  }

  /**
   * Get current user's ideas
   */
  async getMyIdeas(userId: string, status?: string) {
    const where: Prisma.IdeaWhereInput = { authorId: userId };
    if (status) {
      where.status = status as any;
    }

    return prisma.idea.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new idea
   */
  async createIdea(
    userId: string,
    data: {
      title: string;
      problemStatement: string;
      proposedSolution: string;
      description: string;
      categoryId: string;
      isPaid: boolean;
      price?: number;
      images: string[];
      status: 'DRAFT' | 'UNDER_REVIEW';
    }
  ) {
    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Invalid category', 400);
    }

    // If paid, price is required
    if (data.isPaid && (!data.price || data.price <= 0)) {
      throw new AppError('Price is required for paid ideas', 400);
    }

    return prisma.idea.create({
      data: {
        title: data.title,
        problemStatement: data.problemStatement,
        proposedSolution: data.proposedSolution,
        description: data.description,
        images: data.images,
        isPaid: data.isPaid,
        price: data.isPaid ? data.price : null,
        status: data.status,
        authorId: userId,
        categoryId: data.categoryId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  /**
   * Update an idea (only if DRAFT or REJECTED)
   */
  async updateIdea(
    ideaId: string,
    userId: string,
    data: {
      title?: string;
      problemStatement?: string;
      proposedSolution?: string;
      description?: string;
      categoryId?: string;
      isPaid?: boolean;
      price?: number;
      images?: string[];
    }
  ) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.authorId !== userId) {
      throw new AppError('You can only edit your own ideas', 403);
    }

    if (!['DRAFT', 'REJECTED'].includes(idea.status)) {
      throw new AppError('You can only edit ideas that are in draft or rejected status', 400);
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new AppError('Invalid category', 400);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        ...data,
        // Reset status to DRAFT on edit
        adminFeedback: null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Delete an idea (only if DRAFT or REJECTED)
   */
  async deleteIdea(ideaId: string, userId: string, isAdmin: boolean = false) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (!isAdmin) {
      if (idea.authorId !== userId) {
        throw new AppError('You can only delete your own ideas', 403);
      }
      if (!['DRAFT', 'REJECTED'].includes(idea.status)) {
        throw new AppError('You can only delete ideas that are in draft or rejected status', 400);
      }
    }

    return prisma.idea.delete({ where: { id: ideaId } });
  }

  /**
   * Submit a draft for review
   */
  async submitForReview(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.authorId !== userId) {
      throw new AppError('You can only submit your own ideas', 403);
    }

    if (!['DRAFT', 'REJECTED'].includes(idea.status)) {
      throw new AppError('Only draft or rejected ideas can be submitted for review', 400);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: 'UNDER_REVIEW',
        adminFeedback: null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Admin: Update idea status (approve/reject)
   */
  async updateStatus(ideaId: string, status: 'APPROVED' | 'REJECTED', adminFeedback?: string) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (status === 'REJECTED' && !adminFeedback) {
      throw new AppError('Feedback is required when rejecting an idea', 400);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        status,
        adminFeedback: status === 'REJECTED' ? adminFeedback : null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  /**
   * Admin: Get all ideas with status filter
   */
  async getAllIdeas(query: AdminGetIdeasQuery) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.categoryId = query.category;
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.idea.count({ where }),
    ]);

    return {
      ideas,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured ideas (top by net votes)
   */
  async getFeaturedIdeas(count: number = 3) {
    return prisma.idea.findMany({
      where: { status: 'APPROVED' },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { upvoteCount: 'desc' },
      take: count,
    });
  }
}

export const ideaService = new IdeaService();
