import Joi, { ObjectSchema } from 'joi';

export const updateInfoSchema: ObjectSchema = Joi.object({
  detailsInfo: Joi.object({
    bio: Joi.string().max(500).optional().trim().messages({
      'string.max': 'Tiểu sử không được vượt quá {#limit} ký tự'
    }),
    workplace: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Nơi làm việc không được vượt quá {#limit} ký tự'
    }),
    school: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Trường không được vượt quá {#limit} ký tự'
    }),
    location: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Địa chỉ hiện tại không được vượt quá {#limit} ký tự'
    }),
    relationship: Joi.string().valid('Single', 'In a relationship', 'Married', 'Divorced').optional().messages({
      'any.only': 'Trạng thái mối quan hệ không hợp lệ'
    })
  }).messages({
    'object.base': 'Thông tin chi tiết phải là một đối tượng hợp lệ'
  })
});
