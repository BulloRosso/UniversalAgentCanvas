// src/components/Chat/TypingIndicator.tsx
import React from 'react';
import { Box } from '@mui/material';

export const TypingIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        padding: '4px',
        alignItems: 'center'
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#90a4ae',
            animation: 'typing 1s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes typing': {
              '0%, 100%': {
                transform: 'translateY(0px)',
                opacity: 0.4,
              },
              '50%': {
                transform: 'translateY(-4px)',
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};