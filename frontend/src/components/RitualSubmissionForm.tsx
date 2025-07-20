'use client';

import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { useState } from 'react';

interface RitualSubmissionData {
  ritualName: string;
  details: string;
  bioregionId: string;
  ritualFile?: File;
}

export function RitualSubmissionForm() {
  const [formData, setFormData] = useState<RitualSubmissionData>({
    ritualName: '',
    details: '',
    bioregionId: 'tech-haven',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRitualId, setLastRitualId] = useState<number | null>(null);

  const validateForm = (): boolean => {
    if (!formData.ritualName.trim()) {
      setError('Ritual name is required');
      return false;
    }
    if (!formData.details.trim()) {
      setError('Ritual details are required');
      return false;
    }
    if (!formData.bioregionId) {
      setError('Please select a bioregion');
      return false;
    }
    return true;
  };

  const submitRitual = async (isRetry: boolean = false) => {
    if (!validateForm()) return;

    const loadingState = isRetry ? setIsRetrying : setIsSubmitting;
    loadingState(true);
    setError(null);

    try {
      // Create form data for multipart submission
      const formDataToSend = new FormData();
      formDataToSend.append('ritualName', formData.ritualName);
      formDataToSend.append('description', formData.details);
      formDataToSend.append('bioregionId', formData.bioregionId);

      // Add sample ritual file if available
      if (formData.ritualFile) {
        formDataToSend.append('ritualFile', formData.ritualFile);
      }

      const response = await fetch('/api/v1/rituals/submit', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit ritual');
      }

      const result = await response.json();

      // Store the ritual ID for retry functionality
      if (result.ritualId) {
        setLastRitualId(result.ritualId);
      }

      if (isRetry) {
        setRetryCount((prev) => prev + 1);
        setSuccess(`Ritual retry successful! Attempt ${retryCount + 1}`);
      } else {
        setSuccess('Ritual submitted successfully!');
      }

      // Reset form on success
      setFormData({
        ritualName: '',
        details: '',
        bioregionId: 'tech-haven',
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      if (isRetry) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      loadingState(false);
    }
  };

  const handleRetry = () => {
    submitRitual(true);
  };

  const handleSmartContractRetry = async () => {
    if (!lastRitualId) {
      setError(
        'No ritual ID available for retry. Please submit a ritual first.',
      );
      return;
    }

    setIsRetrying(true);
    setError(null);

    try {
      console.log(
        `🔁 Initiating smart contract retry for ritual ${lastRitualId}`,
      );

      const response = await fetch('/api/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ritualId: lastRitualId }),
      });

      const result = await response.json();

      if (result.success) {
        setRetryCount((prev) => prev + 1);
        setSuccess(
          `Smart contract retry successful! Ritual ${lastRitualId} retry completed.`,
        );
        console.log(
          `✅ Smart contract retry successful for ritual ${lastRitualId}`,
        );
      } else {
        setError(result.error || 'Smart contract retry failed');
        console.log(
          `❌ Smart contract retry failed for ritual ${lastRitualId}:`,
          result.error,
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.log(
        `💥 Error during smart contract retry for ritual ${lastRitualId}:`,
        err,
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, ritualFile: file }));
    }
  };

  return (
    <>
      <Card sx={{ p: 3, mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Submit a Ritual
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
              <Button
                size='small'
                onClick={handleRetry}
                disabled={isRetrying}
                sx={{ ml: 2 }}
              >
                {isRetrying ? <CircularProgress size={16} /> : 'Retry'}
              </Button>
            </Alert>
          )}

          <Box display='flex' flexDirection='column' gap={2}>
            <TextField
              label='Ritual Name'
              value={formData.ritualName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ritualName: e.target.value }))
              }
              required
              disabled={isSubmitting || isRetrying}
            />

            <TextField
              label='Details'
              multiline
              rows={4}
              value={formData.details}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, details: e.target.value }))
              }
              required
              disabled={isSubmitting || isRetrying}
            />

            <TextField
              select
              label='Bioregion'
              value={formData.bioregionId}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bioregionId: e.target.value,
                }))
              }
              required
              disabled={isSubmitting || isRetrying}
              SelectProps={{
                native: true,
              }}
            >
              <option value='tech-haven'>Tech Haven</option>
              <option value='mythic-forest'>Mythic Forest</option>
              <option value='ocean-depths'>Ocean Depths</option>
            </TextField>

            <input
              accept='.grc'
              style={{ display: 'none' }}
              id='ritual-file-input'
              type='file'
              onChange={handleFileChange}
              disabled={isSubmitting || isRetrying}
            />
            <label htmlFor='ritual-file-input'>
              <Button
                variant='outlined'
                component='span'
                disabled={isSubmitting || isRetrying}
                fullWidth
              >
                Upload Ritual File (.grc)
              </Button>
            </label>

            {formData.ritualFile && (
              <Typography variant='body2' color='text.secondary'>
                Selected: {formData.ritualFile.name}
              </Typography>
            )}

            <Button
              variant='contained'
              onClick={() => submitRitual(false)}
              disabled={isSubmitting || isRetrying}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ritual'}
            </Button>

            {lastRitualId && (
              <Button
                variant='outlined'
                onClick={handleSmartContractRetry}
                disabled={isRetrying}
                startIcon={isRetrying ? <CircularProgress size={20} /> : null}
                color='secondary'
              >
                {isRetrying ? 'Retrying...' : 'Retry Ritual'}
              </Button>
            )}

            {retryCount > 0 && (
              <Typography variant='body2' color='text.secondary'>
                Retry attempts: {retryCount}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity='success'>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
}
