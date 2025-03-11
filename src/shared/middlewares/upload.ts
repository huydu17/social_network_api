import { NextFunction, Request, Response } from 'express';
import { asyncWrapper, BadRequestException } from './globalErrorHandle';
export const upload = asyncWrapper((req: Request, res: Response, next: NextFunction) => {
  if (req.files) {
    let files = Object.values(req.files).flat();
    files.forEach((file) => {
      if (
        file.mimetype !== 'image/jpeg' &&
        file.mimetype !== 'image/png' &&
        file.mimetype !== 'image/gif' &&
        file.mimetype !== 'image/webp'
      ) {
        throw new BadRequestException('Invalid file');
      }
      if (file.size > 1024 * 1024 * 5) {
        throw new BadRequestException('File size is too large');
      }
    });
  }
  next();
});
