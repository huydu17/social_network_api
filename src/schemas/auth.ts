import Joi, { ObjectSchema } from 'joi';

const emailRegax = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const emailSchema: ObjectSchema = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email là bắt buộc.'
  })
});

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

export const passwordSchema: ObjectSchema = Joi.object({
  oldPassword: Joi.string().required().min(8).messages({
    'string.empty': 'Mật khẩu không được để trống',
    'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  }),
  newPassword: Joi.string().required().min(8).messages({
    'string.empty': 'Mật khẩu không được để trống.',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự.',
    'any.required': 'Mật khẩu là bắt buộc.'
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
    'string.empty': 'Xác nhận mật khẩu không được để trống.',
    'any.only': 'Mật khẩu xác nhận không khớp với mật khẩu.',
    'any.required': 'Xác nhận mật khẩu là bắt buộc.'
  })
});

export const signUpSchema: ObjectSchema = Joi.object({
  firstName: Joi.string().required().trim().messages({
    'string.empty': 'Họ tên không được để trống.',
    'any.required': 'Họ tên là bắt buộc.'
  }),

  lastName: Joi.string().required().trim().messages({
    'string.empty': 'Họ tên không được để trống.',
    'any.required': 'Họ tên là bắt buộc.'
  }),

  email: Joi.string().required().trim().pattern(new RegExp(emailRegax)).messages({
    'string.empty': 'Email không được để trống.',
    'string.pattern.base': 'Email không hợp lệ.',
    'any.required': 'Email là bắt buộc.'
  }),

  password: Joi.string().min(8).required().messages({
    'string.empty': 'Mật khẩu không được để trống.',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự.',
    'any.required': 'Mật khẩu là bắt buộc.'
  }),

  bYear: Joi.number().required().messages({
    'number.base': 'Năm sinh phải là một số.',
    'any.required': 'Năm sinh là bắt buộc.'
  }),

  bMonth: Joi.number().required().min(1).max(12).messages({
    'number.base': 'Tháng sinh phải là một số.',
    'number.min': 'Tháng sinh phải nằm trong khoảng từ 1 đến 12.',
    'number.max': 'Tháng sinh phải nằm trong khoảng từ 1 đến 12.',
    'any.required': 'Tháng sinh là bắt buộc.'
  }),

  bDay: Joi.number().required().min(1).max(31).messages({
    'number.base': 'Ngày sinh phải là một số.',
    'number.min': 'Ngày sinh phải nằm trong khoảng từ 1 đến 31.',
    'number.max': 'Ngày sinh phải nằm trong khoảng từ 1 đến 31.',
    'any.required': 'Ngày sinh là bắt buộc.'
  }),

  gender: Joi.string().valid('Nam', 'Nữ', 'Khác').required().messages({
    'string.empty': 'Giới tính không được để trống.',
    'any.required': 'Giới tính là bắt buộc.',
    'any.only': 'Giới tính phải là một trong các giá trị: Nam, Nữ, Khác.'
  })
});
