'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/system';

import { AI_LOADING_STATUSES } from '../utils/aiLoadingStatuses';

const STATUSES = AI_LOADING_STATUSES;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50%        { opacity: 1;   transform: scale(1.1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function AiLoadingBubble() {
  const [statusIdx, setStatusIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUSES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 1.25,
        borderRadius: '18px 18px 18px 4px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        width: 'fit-content',
        maxWidth: 200,
        animation: `${fadeIn} 0.25s ease`,
      }}
    >
      {/* Three dots */}
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            animation: `${pulse} 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          letterSpacing: 0.3,
          minWidth: 72,
          transition: 'all 0.3s ease',
        }}
      >
        {STATUSES[statusIdx]}…
      </Typography>
    </Box>
  );
}
