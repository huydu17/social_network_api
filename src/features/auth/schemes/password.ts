import Joi, { ObjectSchema } from 'joi';

export const passwordSchema: ObjectSchema = Joi.object({
  password: Joi.string().required().min(8).messages({
    'string.base': 'Mật khẩu phải là một chuỗi.',
    'string.empty': 'Mật khẩu không được để trống.',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự.',
    'any.required': 'Mật khẩu là bắt buộc.'
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'string.base': 'Xác nhận mật khẩu phải là một chuỗi.',
    'string.empty': 'Xác nhận mật khẩu không được để trống.',
    'any.only': 'Mật khẩu xác nhận không khớp với mật khẩu.',
    'any.required': 'Xác nhận mật khẩu là bắt buộc.'
  })
});
