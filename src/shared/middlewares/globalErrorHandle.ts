import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export interface IError {
  status: string;
  statusCode: number;
  message: string;
}

export interface IErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  getMessageError(): IError;
}

export abstract class CustomError extends Error {
  abstract statusCode: number;
  abstract status: string;

  constructor(message: string) {
    super(message);
  }

  getMessageError(): IError {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message
    };
  }
}

export class BadRequestException extends CustomError {
  statusCode: number = HTTP_STATUS.BAD_REQUEST;
  status: string = 'error';
  constructor(message: string) {
    super(message);
  }
}

export class UnAuthorizedException extends CustomError {
  statusCode: number = HTTP_STATUS.UNAUTHORIZED;
  status: string = 'error';

  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenException extends CustomError {
  status: string = 'error';
  statusCode: number = HTTP_STATUS.FORBIDDEN;

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundException extends CustomError {
  status: string = 'error';
  statusCode: number = HTTP_STATUS.NOT_FOUND;

  constructor(message: string) {
    super(message);
  }
}

export class InternalException extends CustomError {
  status: string = 'error';
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  constructor(message: string) {
    super(message);
  }
}

export class JoiValidateException extends CustomError {
  status: string = 'error';
  statusCode: number = HTTP_STATUS.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}

export function asyncWrapper(callback: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await callback(req, res, next);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        next(new BadRequestException(error.message));
      } else if (error instanceof UnAuthorizedException) {
        next(new UnAuthorizedException(error.message));
      } else if (error instanceof ForbiddenException) {
        next(new ForbiddenException(error.message));
      } else if (error instanceof NotFoundException) {
        next(new NotFoundException(error.message));
      } else {
        next(new InternalException(error));
      }
    }
  };
}
