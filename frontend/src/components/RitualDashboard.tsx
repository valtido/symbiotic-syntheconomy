'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';

export function RitualDashboard() {
  return (
    <Card sx={{ p: 3, mb: 4 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Ritual Dashboard
        </Typography>
        <Box>
          <Typography>
            No rituals yet. This will populate from chain state.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
