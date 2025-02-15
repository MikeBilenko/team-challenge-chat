import Joi from "joi";

function maxImageCount(maxCount: number) {
  return function (value: any, helper: any) {
    if (!value) {
      return true;
    }
    let i = 0;
    while (i < maxCount) {
      if (!value[i]) {
        return true;
      }
      i++;
    }
    return helper.message(`There must be a maximum of ${maxCount} images`);
  }
}

export const incomingMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  text: Joi.string()
    .max(1024)
    .allow('')
    .required(),
  images: Joi.object()
    .custom(maxImageCount(10)),
  replies_to: Joi.string()
})

export const updateMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  id: Joi.string()
    .required(),
  created_at: Joi.string()
    .isoDate()
    .required(),
  text: Joi.string()
    .max(1024)
    .allow('')
    .required(),
  // images: Joi.object()
  //   .custom(maxImageCount(10)),
  responds_to_message_id: Joi.string()
    .allow(null)
})

export const readMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  id: Joi.string()
    .required(),
  created_at: Joi.string()
    .isoDate()
    .required()
})

export const deleteMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  id: Joi.string()
    .required(),
  created_at: Joi.string()
    .isoDate()
    .required()
})
