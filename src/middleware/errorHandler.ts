import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../types/common.types';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error
  logger.error(
    {
      err,
      req: {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
      },
    },
    'Error occurred'
  );

  const response: ErrorResponse = {
    error: err.name,
    message: isOperational ? message : 'Internal server error',
    statusCode,
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
};
