// components/Chat/ChatHeader.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
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
         <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <Typography variant="h6" component="h2" sx={{ color: 'black'}}>
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
           </Box>
      </Toolbar>
    </AppBar>
  );
};