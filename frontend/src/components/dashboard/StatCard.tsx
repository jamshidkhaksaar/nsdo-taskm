import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, textColor }) => {
  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '8px',
        height: '100%',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            {title}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: color,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ color: textColor, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard; 