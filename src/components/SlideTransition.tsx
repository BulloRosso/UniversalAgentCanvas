// components/SlideTransition.tsx
import React from 'react';
import { Box, Slide } from '@mui/material';

interface SlideTransitionProps {
  in: boolean;
  children: React.ReactNode;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({ in: inProp, children }) => {
  return (
    <Slide
      direction="left"
      in={inProp}
      timeout={500}
    >
      <Box sx={{ width: '100%', height: '100%' }}>
        {children}
      </Box>
    </Slide>
  );
};