import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface RitualFormData {
  name: string;
  bioregion: string;
  description: string;
  culturalContext: string;
  file: FileList;
}

const RitualSubmissionForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RitualFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: RitualFormData) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bioregion', data.bioregion);
      formData.append('description', data.description);
      formData.append('culturalContext', data.culturalContext);
      if (data.file[0]) {
        formData.append('file', data.file[0]);
      }

      await axios.post('/api/rituals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setSuccessMessage('Ritual submitted successfully!');
      setUploadProgress(100);
    } catch (error) {
      console.error('Error submitting ritual:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to submit ritual. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Submit a Ritual</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Ritual Name</Label>
          <Input
            id="name"
            placeholder="Enter ritual name"
            {...register('name', { required: 'Ritual name is required' })}
            className="w-full"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* Bioregion Field */}
        <div className="space-y-2">
          <Label htmlFor="bioregion">Bioregion</Label>
          <Input
            id="bioregion"
            placeholder="Enter bioregion"
            {...register('bioregion', { required: 'Bioregion is required' })}
            className="w-full"
          />
          {errors.bioregion && <p className="text-red-500 text-sm">{errors.bioregion.message}</p>}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the ritual"
            {...register('description', { required: 'Description is required' })}
            className="w-full h-24"
          />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>

        {/* Cultural Context Field */}
        <div className="space-y-2">
          <Label htmlFor="culturalContext">Cultural Context</Label>
          <Textarea
            id="culturalContext"
            placeholder="Provide cultural context"
            {...register('culturalContext', { required: 'Cultural context is required' })}
            className="w-full h-24"
          />
          {errors.culturalContext && <p className="text-red-500 text-sm">{errors.culturalContext.message}</p>}
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file">Ritual File (.grc)</Label>
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-gray-500" />
            <Input
              id="file"
              type="file"
              accept=".grc"
              {...register('file', { required: 'File upload is required' })}
              className="w-full"
            />
          </div>
          {errors.file && <p className="text-red-500 text-sm">{errors.file.message}</p>}
        </div>

        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="text-green-600 bg-green-50 p-3 rounded-md text-sm">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{errorMessage}</div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Ritual'
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default RitualSubmissionForm;
