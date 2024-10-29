// Create a new file src/components/SlideContent/SlideContent.tsx
import React from 'react';
import { Box } from '@mui/material';

interface SlideContentProps {
  url: string;
}

export const SlideContent = React.forwardRef<HTMLDivElement, SlideContentProps>(
  (props, ref) => {
    const { url } = props;

    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'black',
        }}
      >
        <img
          src={url}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          alt="Presentation slide"
        />
      </Box>
    );
  }
);

SlideContent.displayName = 'SlideContent';