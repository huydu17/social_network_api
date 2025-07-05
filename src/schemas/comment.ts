import Joi, { ObjectSchema } from 'joi';

const commentSchema: ObjectSchema = Joi.object({
  content: Joi.string().required().trim().messages({
    'string.empty': 'Nội dung bình luận không được để trống.',
    'any.required': 'Nội dung bình luận là bắt buộc.'
  }),
  postId: Joi.string().required()
});

export { commentSchema };
