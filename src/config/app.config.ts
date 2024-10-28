import userIconUrl from '../assets/user-icon.png';
import agentIconUrl from '../assets/user-icon.png';
import avatarUrl from '../assets/avatar.png';

export const defaultConfig = {
  backgroundColor: '#f5f5f5',
  title: 'Chat Assistant',
  avatar: avatarUrl,
  chatBackgroundColor: '#ff0000',
  chatUserIcon: userIconUrl,
  chatAgentIcon: agentIconUrl,
} as const;
