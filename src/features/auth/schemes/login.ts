import Joi from 'joi';

export const signInSchema = Joi.object({
  emailOrUsername: Joi.string().required().messages({
    'string.empty': 'Email hoặc tên đăng nhập không được để trống.',
    'any.required': 'Email hoặc tên đăng nhập là bắt buộc.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'any.required': 'Mật khẩu là bắt buộc.'
  })
});
