// import { NextFunction, Request, Response } from 'express';
// import { Schema, ValidationErrorItem } from 'joi';

import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import { JoiValidateException } from './globalErrorHandle';
import { Helpers } from '../utils/helpers';

export const validateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.files) {
        req.body.images = req.files.images;
      }

      const { error } = await Promise.resolve(schema.validate(req.body));
      if (error?.details) {
        throw new JoiValidateException(Helpers.removeQuetes(error.details[0].message));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
