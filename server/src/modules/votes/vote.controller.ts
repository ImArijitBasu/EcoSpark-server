import { Request, Response, NextFunction } from 'express';
import { voteService } from './vote.service';
import { sendSuccess } from '../../utils/apiResponse';

export class VoteController {
  async toggleVote(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const { type } = req.body; // 'UPVOTE' or 'DOWNVOTE'

      if (!type || !['UPVOTE', 'DOWNVOTE'].includes(type)) {
        res.status(400).json({ success: false, message: 'Vote type must be UPVOTE or DOWNVOTE' });
        return;
      }

      const result = await voteService.toggleVote(req.user!.id, ideaId, type);
      sendSuccess(res, result, `Vote ${result.action} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async removeVote(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const result = await voteService.removeVote(req.user!.id, ideaId);
      sendSuccess(res, result, 'Vote removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserVote(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const vote = await voteService.getUserVote(req.user!.id, ideaId);
      sendSuccess(res, vote, 'User vote retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const voteController = new VoteController();
