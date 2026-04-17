import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

export class VoteService {
  /**
   * Toggle vote on an idea (Reddit-style)
   * - If no existing vote: create vote
   * - If existing vote with same type: remove vote (toggle off)
   * - If existing vote with different type: change vote type
   */
  async toggleVote(userId: string, ideaId: string, type: 'UPVOTE' | 'DOWNVOTE') {
    // Check idea exists and is approved
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      throw new AppError('Idea not found', 404);
    }
    if (idea.status !== 'APPROVED') {
      throw new AppError('You can only vote on approved ideas', 400);
    }

    // Check existing vote
    const existingVote = await prisma.vote.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Same type - remove vote (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });

        // Update counts
        await prisma.idea.update({
          where: { id: ideaId },
          data: {
            upvoteCount: type === 'UPVOTE' ? { decrement: 1 } : undefined,
            downvoteCount: type === 'DOWNVOTE' ? { decrement: 1 } : undefined,
          },
        });

        return { action: 'removed', vote: null };
      } else {
        // Different type - change vote
        const updatedVote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });

        // Update counts
        if (type === 'UPVOTE') {
          await prisma.idea.update({
            where: { id: ideaId },
            data: {
              upvoteCount: { increment: 1 },
              downvoteCount: { decrement: 1 },
            },
          });
        } else {
          await prisma.idea.update({
            where: { id: ideaId },
            data: {
              upvoteCount: { decrement: 1 },
              downvoteCount: { increment: 1 },
            },
          });
        }

        return { action: 'changed', vote: updatedVote };
      }
    } else {
      // No existing vote - create new
      const newVote = await prisma.vote.create({
        data: { userId, ideaId, type },
      });

      await prisma.idea.update({
        where: { id: ideaId },
        data: {
          upvoteCount: type === 'UPVOTE' ? { increment: 1 } : undefined,
          downvoteCount: type === 'DOWNVOTE' ? { increment: 1 } : undefined,
        },
      });

      return { action: 'created', vote: newVote };
    }
  }

  /**
   * Remove a vote
   */
  async removeVote(userId: string, ideaId: string) {
    const existingVote = await prisma.vote.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    if (!existingVote) {
      throw new AppError('You have not voted on this idea', 400);
    }

    await prisma.vote.delete({ where: { id: existingVote.id } });

    await prisma.idea.update({
      where: { id: ideaId },
      data: {
        upvoteCount: existingVote.type === 'UPVOTE' ? { decrement: 1 } : undefined,
        downvoteCount: existingVote.type === 'DOWNVOTE' ? { decrement: 1 } : undefined,
      },
    });

    return { action: 'removed' };
  }

  /**
   * Get user's vote on an idea
   */
  async getUserVote(userId: string, ideaId: string) {
    return prisma.vote.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });
  }
}

export const voteService = new VoteService();
