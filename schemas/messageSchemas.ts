import Joi from "joi";

export const incomingMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  text: Joi.string()
    .max(1024)
    .allow('')
    .required(),
  images: Joi.object()
    .allow(null),
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
  // images: Joi.array()
  //   .max(10)
  //   .allow(null),
  responds_to_message_id: Joi.string()
    .allow(null)
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
