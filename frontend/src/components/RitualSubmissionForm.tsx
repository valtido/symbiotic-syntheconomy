import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  AlertTitle,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
} from '@mui/icons-material';

interface RitualFormData {
  name: string;
  bioregion: string;
  description: string;
  culturalContext: string;
  file: File | null;
}

const RitualSubmissionForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RitualFormData>();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile && selectedFile.name.endsWith('.grc')) {
        setFile(selectedFile);
      } else {
        setFile(null);
        setErrorMessage('Please upload a valid .grc file');
      }
    },
    [],
  );

  const onSubmit = async (data: RitualFormData) => {
    if (!file) {
      setErrorMessage('Please upload a .grc file');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setSubmitStatus('idle');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bioregion', data.bioregion);
      formData.append('description', data.description);
      formData.append('culturalContext', data.culturalContext);
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch('/api/rituals', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      setSubmitStatus('success');
      setTimeout(() => {
        setUploadProgress(0);
        setIsSubmitting(false);
        setFile(null);
        reset();
      }, 2000);
    } catch (error) {
      setUploadProgress(0);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to submit ritual',
      );
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant='h4' component='h2' gutterBottom align='center'>
        Submit a Ritual
      </Typography>

      <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label='Ritual Name'
          variant='outlined'
          margin='normal'
          {...register('name', {
            required: 'Ritual name is required',
            maxLength: { value: 100, message: 'Name too long' },
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          fullWidth
          label='Bioregion'
          variant='outlined'
          margin='normal'
          {...register('bioregion', {
            required: 'Bioregion is required',
            maxLength: { value: 100, message: 'Bioregion too long' },
          })}
          error={!!errors.bioregion}
          helperText={errors.bioregion?.message}
        />

        <TextField
          fullWidth
          label='Description'
          variant='outlined'
          margin='normal'
          multiline
          rows={4}
          {...register('description', {
            required: 'Description is required',
            maxLength: { value: 1000, message: 'Description too long' },
          })}
          error={!!errors.description}
          helperText={errors.description?.message}
        />

        <TextField
          fullWidth
          label='Cultural Context'
          variant='outlined'
          margin='normal'
          multiline
          rows={4}
          {...register('culturalContext', {
            required: 'Cultural context is required',
            maxLength: { value: 1000, message: 'Context too long' },
          })}
          error={!!errors.culturalContext}
          helperText={errors.culturalContext?.message}
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept='.grc'
            style={{ display: 'none' }}
            id='file-upload'
            type='file'
            onChange={onFileChange}
          />
          <label htmlFor='file-upload'>
            <Button
              variant='outlined'
              component='span'
              startIcon={<UploadIcon />}
              fullWidth
            >
              Upload Ritual File (.grc)
            </Button>
          </label>
          {file && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>

        {isSubmitting && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <LinearProgress variant='determinate' value={uploadProgress} />
            <Typography
              variant='body2'
              color='text.secondary'
              align='center'
              sx={{ mt: 1 }}
            >
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        {submitStatus === 'success' && (
          <Alert severity='success' sx={{ mb: 2 }}>
            <CheckCircleIcon />
            <AlertTitle>Success</AlertTitle>
            Ritual submitted successfully!
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert severity='error' sx={{ mb: 2 }}>
            <AlertCircleIcon />
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        )}

        <Button
          type='submit'
          variant='contained'
          fullWidth
          disabled={isSubmitting}
          startIcon={!isSubmitting ? <UploadIcon /> : undefined}
          sx={{ mt: 2 }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ritual'}
        </Button>
      </Box>
    </Paper>
  );
};

export default RitualSubmissionForm;
