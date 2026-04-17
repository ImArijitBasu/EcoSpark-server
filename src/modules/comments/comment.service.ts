import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export class CommentService {
  /**
   * Get all comments for an idea (with nested replies)
   */
  async getComments(ideaId: string) {
    // Get top-level comments with one level of replies
    const comments = await prisma.comment.findMany({
      where: {
        ideaId,
        parentId: null, // Top-level only
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  /**
   * Create a comment on an idea
   */
  async createComment(userId: string, ideaId: string, content: string, parentId?: string) {
    // Check idea exists and is approved
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      throw new AppError('Idea not found', 404);
    }
    if (idea.status !== 'APPROVED') {
      throw new AppError('You can only comment on approved ideas', 400);
    }

    // If replying, check parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        throw new AppError('Parent comment not found', 404);
      }
      if (parentComment.ideaId !== ideaId) {
        throw new AppError('Parent comment does not belong to this idea', 400);
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        ideaId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update comment count on idea
    await prisma.idea.update({
      where: { id: ideaId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  /**
   * Delete a comment (admin only)
   */
  async deleteComment(commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Delete all replies first, then the comment
    const totalDeleted = comment._count.replies + 1;

    await prisma.comment.deleteMany({
      where: { parentId: commentId },
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Update comment count
    await prisma.idea.update({
      where: { id: comment.ideaId },
      data: { commentCount: { decrement: totalDeleted } },
    });

    return { deleted: totalDeleted };
  }
}

export const commentService = new CommentService();
