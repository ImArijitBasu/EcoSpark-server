import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        statusCode: 409,
        message: `A record with this ${prismaError.meta?.target?.join(', ')} already exists`,
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Record not found',
      });
      return;
    }
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerError = err as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'File size cannot exceed 5MB',
      });
      return;
    }
    if (multerError.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Maximum 5 files allowed',
      });
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token',
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
