export interface ChatMessage {
  id: string;
  content: string;          // visible output in chat pane
  contextUpdate?: string;   // information sent "under the hood" to the LLM at the same time
  timestamp: Date;
  isUser: boolean;
  isTyping?: boolean;
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}