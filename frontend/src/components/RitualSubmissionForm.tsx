'use client';

import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useState } from 'react';

export function RitualSubmissionForm() {
  const [ritualName, setRitualName] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    console.log('Submitted:', { ritualName, details });
  };

  return (
    <Card sx={{ p: 3, mb: 4 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Submit a Ritual
        </Typography>
        <Box display='flex' flexDirection='column' gap={2}>
          <TextField
            label='Ritual Name'
            value={ritualName}
            onChange={(e) => setRitualName(e.target.value)}
          />
          <TextField
            label='Details'
            multiline
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <Button variant='contained' onClick={handleSubmit}>
            Submit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
