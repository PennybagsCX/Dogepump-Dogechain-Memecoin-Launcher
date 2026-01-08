import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { APIError } from '../types/index.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log the error
  request.log.error(error);

  // Handle validation errors
  if (error.validation) {
    const apiError: APIError = {
      statusCode: 400,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.validation,
    };
    reply.status(400).send(apiError);
    return;
  }

  // Handle known API errors
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 600) {
    const apiError: APIError = {
      statusCode: error.statusCode,
      error: error.name || 'Error',
      message: error.message || 'An error occurred',
    };
    reply.status(error.statusCode).send(apiError);
    return;
  }

  // Handle unexpected errors
  const apiError: APIError = {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };

  reply.status(500).send(apiError);
}

export function createAPIError(
  statusCode: number,
  error: string,
  message: string,
  details?: any
): APIError {
  return {
    statusCode,
    error,
    message,
    details,
  };
}

export function handleSuccess<T>(data: T, statusCode: number = 200) {
  return {
    success: true,
    data,
    statusCode,
  };
}

export function handleError(
  statusCode: number,
  error: string,
  message: string,
  details?: any
): APIError {
  return createAPIError(statusCode, error, message, details);
}
