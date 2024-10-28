export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  isTyping?: boolean;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}