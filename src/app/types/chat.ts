interface Message {
  id: string;
  role: "user" | "assistant";
  streaming?: boolean;
  content: string;
  timestamp: Date;
}
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
interface Model {
  label: string;
  id: string;
  provider: string;
}
export type { Message, Conversation, Model };
