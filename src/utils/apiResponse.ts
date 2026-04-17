import { Response } from 'express';

interface ApiResponseOptions {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function sendResponse(res: Response, options: ApiResponseOptions) {
  const { success, statusCode, message, data, meta } = options;

  const responseBody: any = {
    success,
    statusCode,
    message,
  };

  if (data !== undefined) {
    responseBody.data = data;
  }

  if (meta) {
    responseBody.meta = meta;
  }

  return res.status(statusCode).json(responseBody);
}

export function sendSuccess(
  res: Response,
  data: any,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponseOptions['meta']
) {
  return sendResponse(res, { success: true, statusCode, message, data, meta });
}

export function sendCreated(res: Response, data: any, message = 'Created successfully') {
  return sendResponse(res, { success: true, statusCode: 201, message, data });
}

export function sendError(res: Response, message: string, statusCode = 400) {
  return sendResponse(res, { success: false, statusCode, message });
}

export function sendNotFound(res: Response, message = 'Resource not found') {
  return sendResponse(res, { success: false, statusCode: 404, message });
}

export function sendUnauthorized(res: Response, message = 'Unauthorized') {
  return sendResponse(res, { success: false, statusCode: 401, message });
}

export function sendForbidden(res: Response, message = 'Forbidden') {
  return sendResponse(res, { success: false, statusCode: 403, message });
}
