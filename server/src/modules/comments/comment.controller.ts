import { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export class CommentController {
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const comments = await commentService.getComments(ideaId);
      sendSuccess(res, comments, 'Comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { ideaId } = req.params;
      const { content, parentId } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Comment content is required' });
        return;
      }

      const comment = await commentService.createComment(
        req.user!.id,
        ideaId,
        content.trim(),
        parentId
      );
      sendCreated(res, comment, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const result = await commentService.deleteComment(commentId);
      sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
