import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface RitualFormData {
  name: string;
  bioregion: string;
  description: string;
  culturalContext: string;
  file: File | null;
}

const RitualSubmissionForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RitualFormData>();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.grc')) {
      setFile(selectedFile);
    } else {
      setFile(null);
      setErrorMessage('Please upload a valid .grc file');
    }
  }, []);

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
        // Reset form
        document.getElementById('ritual-form')?.reset();
      }, 2000);
    } catch (error) {
      setUploadProgress(0);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit ritual');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Submit a Ritual</h2>

      <form id="ritual-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Ritual Name</Label>
          <Input
            id="name"
            placeholder="Enter ritual name"
            {...register('name', { required: 'Ritual name is required', maxLength: { value: 100, message: 'Name too long' } })}
            className="w-full"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bioregion">Bioregion</Label>
          <Input
            id="bioregion"
            placeholder="Enter bioregion"
            {...register('bioregion', { required: 'Bioregion is required', maxLength: { value: 100, message: 'Bioregion too long' } })}
            className="w-full"
          />
          {errors.bioregion && <p className="text-red-500 text-sm">{errors.bioregion.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the ritual"
            {...register('description', { required: 'Description is required', maxLength: { value: 1000, message: 'Description too long' } })}
            className="w-full h-24"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="culturalContext">Cultural Context</Label>
          <Textarea
            id="culturalContext"
            placeholder="Provide cultural context"
            {...register('culturalContext', { required: 'Cultural context is required', maxLength: { value: 1000, message: 'Context too long' } })}
            className="w-full h-24"
          />
          {errors.culturalContext && <p className="text-red-500 text-sm">{errors.culturalContext.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Upload Ritual File (.grc)</Label>
          <Input
            id="file"
            type="file"
            accept=".grc"
            onChange={onFileChange}
            className="w-full"
          />
          {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        </div>

        {isSubmitting && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-500 text-center">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {submitStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200 text-green-700">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertDescription>Ritual submitted successfully!</AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200 text-red-700">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Ritual'}
          {!isSubmitting && <UploadIcon className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default RitualSubmissionForm;
