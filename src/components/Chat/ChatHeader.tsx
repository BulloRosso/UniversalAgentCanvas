// components/Chat/ChatHeader.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';

interface ChatHeaderProps {
  title: string;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  onToggleFullscreen,
  isFullscreen = false
}) => {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar 
        sx={{ 
          minHeight: '48px !important',  // Match Canvas tab height
          height: '48px'
        }}
      >
        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            color: 'text.primary'  // Use theme text color instead of white
          }}
        >
          {title}
        </Typography>
        {onToggleFullscreen && (
          <IconButton
            size="small"
            edge="end"
            onClick={onToggleFullscreen}
            sx={{ 
              color: 'text.primary',
              marginLeft: 1 
            }}
          >
            {isFullscreen ? (
              <FullscreenExit fontSize="small" />
            ) : (
              <Fullscreen fontSize="small" />
            )}
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};