import Joi, { ObjectSchema } from 'joi';

const postSchema: ObjectSchema = Joi.object({
  background: Joi.string().optional().messages({
    'string.base': 'Nền phải là một chuỗi ký tự'
  }),
  gifUrl: Joi.string().optional().messages({
    'string.base': 'URL GIF phải là một chuỗi ký tự'
  }),
  feelings: Joi.string().optional().messages({
    'string.base': 'Cảm xúc phải là một chuỗi ký tự'
  }),
  privacy: Joi.string().optional().messages({
    'string.base': 'Quyền riêng tư phải là một chuỗi ký tự'
  }),
  text: Joi.string().allow('').optional().messages({
    'string.base': 'Nội dung bài viết phải là một chuỗi ký tự'
  }),
  images: Joi.array().items(Joi.any()).messages({
    'array.base': 'Hình ảnh phải là một mảng'
  }),
  video: Joi.string().allow('').optional().messages({
    'string.base': 'Video phải là một chuỗi ký tự'
  })
})
  .or('text', 'images', 'video', 'gifUrl')
  .messages({
    'object.missing': 'Ít nhất một trong các trường text, images, video hoặc gifUrl phải có giá trị'
  });

export { postSchema };
