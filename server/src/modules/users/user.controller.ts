import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../utils/apiResponse';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const result = await userService.getAllUsers(page, limit, search);
      sendSuccess(res, result.users, 'Users retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await userService.changeRole(id, role);
      sendSuccess(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.toggleStatus(id);
      sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
