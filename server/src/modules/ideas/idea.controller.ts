import { Request, Response, NextFunction } from 'express';
import { ideaService } from './idea.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { uploadMultipleToCloudinary } from '../../middleware/upload';

export class IdeaController {
  async getApprovedIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ideaService.getApprovedIdeas({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 12,
        search: req.query.search as string,
        category: req.query.category as string,
        isPaid: req.query.isPaid as string,
        sort: req.query.sort as string,
        author: req.query.author as string,
        minVotes: req.query.minVotes as string,
      });
      sendSuccess(res, result.ideas, 'Ideas retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getIdeaById(req: Request, res: Response, next: NextFunction) {
    try {
      const idea = await ideaService.getIdeaById(req.params.id, req.user?.id);
      sendSuccess(res, idea, 'Idea retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const ideas = await ideaService.getMyIdeas(req.user!.id, status);
      sendSuccess(res, ideas, 'Your ideas retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createIdea(req: Request, res: Response, next: NextFunction) {
    try {
      // Upload images if present
      let imageUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        imageUrls = await uploadMultipleToCloudinary(req.files);
      }

      const idea = await ideaService.createIdea(req.user!.id, {
        title: req.body.title,
        problemStatement: req.body.problemStatement,
        proposedSolution: req.body.proposedSolution,
        description: req.body.description,
        categoryId: req.body.categoryId,
        isPaid: req.body.isPaid === 'true' || req.body.isPaid === true,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        images: imageUrls,
        status: req.body.status || 'DRAFT',
      });

      sendCreated(res, idea, 'Idea created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateIdea(req: Request, res: Response, next: NextFunction) {
    try {
      let imageUrls: string[] | undefined;
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        imageUrls = await uploadMultipleToCloudinary(req.files);
      }

      const updateData: any = { ...req.body };

      if (updateData.isPaid !== undefined) {
        updateData.isPaid = updateData.isPaid === 'true' || updateData.isPaid === true;
      }
      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }
      if (imageUrls) {
        updateData.images = imageUrls;
      }

      const idea = await ideaService.updateIdea(req.params.id, req.user!.id, updateData);
      sendSuccess(res, idea, 'Idea updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteIdea(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      await ideaService.deleteIdea(req.params.id, req.user!.id, isAdmin);
      sendSuccess(res, null, 'Idea deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitForReview(req: Request, res: Response, next: NextFunction) {
    try {
      const idea = await ideaService.submitForReview(req.params.id, req.user!.id);
      sendSuccess(res, idea, 'Idea submitted for review');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, adminFeedback } = req.body;
      const idea = await ideaService.updateStatus(req.params.id, status, adminFeedback);
      sendSuccess(res, idea, `Idea ${status.toLowerCase()} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async getAllIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ideaService.getAllIdeas({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 12,
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
      });
      sendSuccess(res, result.ideas, 'All ideas retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedIdeas(req: Request, res: Response, next: NextFunction) {
    try {
      const count = parseInt(req.query.count as string) || 3;
      const ideas = await ideaService.getFeaturedIdeas(count);
      sendSuccess(res, ideas, 'Featured ideas retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const ideaController = new IdeaController();
