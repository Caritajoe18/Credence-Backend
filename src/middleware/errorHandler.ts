import { Request, Response, NextFunction } from 'express'
import { LockTimeoutError } from '../db/transaction.js'
import { InsufficientFundsError } from '../db/repositories/bondsRepository.js'

/**
 * Standard error response format
 */
export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
  retryable?: boolean
  retryAfterMs?: number
}

/**
 * Express error handler middleware that converts database errors
 * into actionable HTTP responses with appropriate status codes.
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Lock timeout - resource temporarily unavailable
  if (error instanceof LockTimeoutError) {
    const response: ErrorResponse = {
      code: 'LOCK_TIMEOUT',
      message: 'Resource is currently locked by another operation',
      details: {
        policy: error.policy,
        timeoutMs: error.timeoutMs,
      },
      retryable: true,
      retryAfterMs: 1000, // Suggest 1 second retry delay
    }

    res.status(409).json(response)
    return
  }

  // Insufficient funds - business logic validation
  if (error instanceof InsufficientFundsError) {
    const response: ErrorResponse = {
      code: 'INSUFFICIENT_FUNDS',
      message: error.message,
      details: {
        bondId: error.bondId,
        available: error.available,
        requested: error.requested,
      },
      retryable: false,
    }

    res.status(422).json(response)
    return
  }

  // PostgreSQL errors
  if ('code' in error) {
    const pgError = error as { code: string; detail?: string }

    // Unique constraint violation
    if (pgError.code === '23505') {
      const response: ErrorResponse = {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists',
        retryable: false,
      }

      res.status(409).json(response)
      return
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      const response: ErrorResponse = {
        code: 'INVALID_REFERENCE',
        message: 'Referenced resource does not exist',
        retryable: false,
      }

      res.status(422).json(response)
      return
    }

    // Serialization failure (concurrent update conflict)
    if (pgError.code === '40001') {
      const response: ErrorResponse = {
        code: 'SERIALIZATION_FAILURE',
        message: 'Transaction conflict, please retry',
        retryable: true,
        retryAfterMs: 500,
      }

      res.status(409).json(response)
      return
    }

    // Deadlock detected
    if (pgError.code === '40P01') {
      const response: ErrorResponse = {
        code: 'DEADLOCK_DETECTED',
        message: 'Deadlock detected, please retry',
        retryable: true,
        retryAfterMs: 1000,
      }

      res.status(409).json(response)
      return
    }
  }

  // Validation errors (from middleware)
  if (error.name === 'ValidationError') {
    const response: ErrorResponse = {
      code: 'VALIDATION_ERROR',
      message: error.message,
      retryable: false,
    }

    res.status(400).json(response)
    return
  }

  // Default internal server error
  console.error('Unhandled error:', error)

  const response: ErrorResponse = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    retryable: false,
  }

  res.status(500).json(response)
}

/**
 * Async handler wrapper that catches errors and passes them to error middleware
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
