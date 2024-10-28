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