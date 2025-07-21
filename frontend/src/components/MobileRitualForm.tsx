import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadIcon, CheckCircleIcon } from 'lucide-react';

interface RitualFormData {
  title: string;
  description: string;
  image?: FileList;
}

const MobileRitualForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RitualFormData>();
  const [isOffline, setIsOffline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle image preview
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const onSubmit = async (data: RitualFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate form submission (replace with actual API call)
      console.log('Form data:', data);
      
      // Store data locally if offline
      if (isOffline) {
        localStorage.setItem('pendingRitual', JSON.stringify(data));
        setSubmitStatus('success');
        alert('Ritual saved locally. Will sync when online.');
      } else {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitStatus('success');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-screen-md mx-auto p-4"
    >
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Submit Ritual</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Ritual Title</Label>
              <Input
                id="title"
                placeholder="Enter ritual title"
                {...register('title', { required: 'Title is required' })}
                className="rounded-md"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the ritual"
                {...register('description', { required: 'Description is required' })}
                className="rounded-md h-24"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Ritual Image</Label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  {...register('image', { onChange: handleImageChange })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isSubmitting}
                />
                <UploadIcon className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Tap to upload image</p>
              </div>
              {previewImage && (
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="mt-2 w-full h-48 object-cover rounded-md" 
                />
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-md py-2.5 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ritual'}
            </Button>

            {isOffline && (
              <p className="text-sm text-yellow-500 text-center">Offline mode: Data will sync when online</p>
            )}

            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center text-green-500"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Ritual submitted successfully!</span>
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <p className="text-sm text-red-500 text-center">Error submitting ritual. Please try again.</p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MobileRitualForm;