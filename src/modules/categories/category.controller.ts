import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { uploadToCloudinary } from '../../middleware/upload';

export class CategoryController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAll();
      sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.files && !Array.isArray(req.files)) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['miniImage'] && files['miniImage'][0]) {
          req.body.miniImage = await uploadToCloudinary(files['miniImage'][0].buffer, 'ecospark/categories');
        }
        if (files['bannerImage'] && files['bannerImage'][0]) {
          req.body.bannerImage = await uploadToCloudinary(files['bannerImage'][0].buffer, 'ecospark/categories');
        }
      }
      
      const category = await categoryService.create(req.body);
      sendCreated(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.files && !Array.isArray(req.files)) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['miniImage'] && files['miniImage'][0]) {
          req.body.miniImage = await uploadToCloudinary(files['miniImage'][0].buffer, 'ecospark/categories');
        }
        if (files['bannerImage'] && files['bannerImage'][0]) {
          req.body.bannerImage = await uploadToCloudinary(files['bannerImage'][0].buffer, 'ecospark/categories');
        }
      }

      const category = await categoryService.update(req.params.id as string, req.body);
      sendSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(req.params.id as string);
      sendSuccess(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
