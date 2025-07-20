// PATCH: Add frontend retry UI and test framework for SymbiosisPledge retry logic

// File: frontend/src/components/RitualRetry.tsx
'use client';
import { Button, CircularProgress, Typography, Stack } from '@mui/material';
import { useState } from 'react';

export function RitualRetry({ onRetry }: { onRetry: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<null | boolean>(null);

  const handleRetry = async () => {
    setLoading(true);
    setSuccess(null);
    try {
      await onRetry();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} alignItems='center'>
      <Typography variant='h6'>Retry Ritual Submission</Typography>
      <Button onClick={handleRetry} variant='contained' disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Retry'}
      </Button>
      {success === true && <Typography color='green'>Success!</Typography>}
      {success === false && <Typography color='red'>Retry failed.</Typography>}
    </Stack>
  );
}
