import Joi from "joi";

export const incomingMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  text: Joi.string()
    .max(1024)
    .allow('')
    .required(),
  images: Joi.array()
    .allow(null)
    .max(10),
  responds_to_message_pk: Joi.object()
    .allow(null)
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
  images: Joi.array()
    .allow(null)
    .max(10),
  responds_to_message_pk: Joi.object()
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

export const getMessageSchema = Joi.object({
  chat_id: Joi.string()
    .required(),
  id: Joi.string()
    .required(),
  created_at: Joi.string()
    .isoDate()
    .required()
})
