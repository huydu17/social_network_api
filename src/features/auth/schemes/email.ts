import Joi, { ObjectSchema } from 'joi';

export const emailSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email là bắt buộc.'
  })
});
