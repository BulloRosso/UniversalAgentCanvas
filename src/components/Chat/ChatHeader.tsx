// components/Chat/ChatHeader.tsx
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar 
} from '@mui/material';
import { Close, Refresh } from '@mui/icons-material';

interface ChatHeaderProps {
  backgroundColor: string;
  title: string;
  avatar: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  backgroundColor,
  title,
  avatar,
}) => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor, 
        height: '30px',
        minHeight: '30px'
      }}
    >
      <Toolbar sx={{ minHeight: '30px !important' }}>
        <Avatar
          src={avatar}
          sx={{
            width: 24,
            height: 24,
            marginRight: 1,
            borderRadius: '50%'
          }}
        />
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          edge="end"
          color="inherit"
          sx={{ marginLeft: 1 }}
        >
          <Refresh fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          edge="end"
          color="inherit"
          sx={{ marginLeft: 1 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};