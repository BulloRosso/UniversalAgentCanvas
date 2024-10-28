// types/config.ts
export interface ChatConfig {
  backgroundColor: string;
  title: string;
  avatar: string;
  chatBackgroundColor: string;
  chatUserIcon: string;
  chatAgentIcon: string;
}

// types/message.ts
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    thumbnail?: string;
  }>;
}

// types/canvas.ts
export interface CanvasTab {
  id: string;
  title: string;
  type: 'iframe' | 'video';
  url: string;
}

export interface CanvasCommand {
  tab: string;
  type: 'iframe' | 'video';
  url: string;
}