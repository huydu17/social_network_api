import Joi, { ObjectSchema } from 'joi';

const updateInfoSchema: ObjectSchema = Joi.object({
  detailsInfo: Joi.object({
    bio: Joi.string().max(500).optional().trim().messages({
      'string.max': 'Tiểu sử không được vượt quá {#limit} ký tự'
    }),
    otherName: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Tên khác không được vượt quá {#limit} ký tự'
    }),
    job: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Nghề nghiệp không được vượt quá {#limit} ký tự'
    }),
    workplace: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Nơi làm việc không được vượt quá {#limit} ký tự'
    }),
    highSchool: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Trường cấp 3 không được vượt quá {#limit} ký tự'
    }),
    college: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Trường đại học không được vượt quá {#limit} ký tự'
    }),
    currentCity: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Thành phố hiện tại không được vượt quá {#limit} ký tự'
    }),
    hometown: Joi.string().max(100).optional().trim().messages({
      'string.max': 'Quê quán không được vượt quá {#limit} ký tự'
    }),
    relationship: Joi.string().valid('Single', 'In a relationship', 'Married', 'Divorced').optional().messages({
      'any.only': 'Trạng thái mối quan hệ không hợp lệ'
    })
  }).messages({
    'object.base': 'Thông tin chi tiết phải là một đối tượng hợp lệ'
  })
});

export { updateInfoSchema };
