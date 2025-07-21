import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export function ValidationDashboard() {
  return (
    <Card sx={{ p: 3, mb: 4 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Validation Dashboard
        </Typography>
        <Box>
          <Typography>
            No validations yet. This will populate from validation results.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
