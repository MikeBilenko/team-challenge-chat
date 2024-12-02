
class Reaction {
  user_id: undefined
  reaction: string
}

export class Message {
  id: undefined
  user_id: undefined
  text: string
  images: [string]
  responds_to_message_id: undefined
  reactions: [Reaction]
  chat_id: undefined
}