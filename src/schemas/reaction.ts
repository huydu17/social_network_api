import Joi, { ObjectSchema } from 'joi';

const createReactSchema: ObjectSchema = Joi.object({
  type: Joi.string().valid('like', 'love', 'haha', 'sad', 'angry', 'wow').required(),
  postId: Joi.string().required()
});

export { createReactSchema };
