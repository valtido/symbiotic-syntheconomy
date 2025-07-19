'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RitualSubmissionFormProps {
  onSubmit: (ritualData: any) => void;
  onValidationChange: (isValid: boolean) => void;
  initialData?: any;
}

interface RitualFormData {
  title: string;
  description: string;
  bioregionId: string;
  culturalReferences: string[];
  ethicalElements: string[];
  spiritualElements: string[];
  materials: string[];
  steps: string[];
  duration: number;
  participants: number;
  ipfsHash?: string;
}

const RitualSubmissionForm: React.FC<RitualSubmissionFormProps> = ({
  onSubmit,
  onValidationChange,
  initialData,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RitualFormData>({
    title: '',
    description: '',
    bioregionId: '',
    culturalReferences: [],
    ethicalElements: [],
    spiritualElements: [],
    materials: [],
    steps: [],
    duration: 60,
    participants: 1,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bioregions = [
    { id: 'tech-haven', name: 'Tech Haven' },
    { id: 'mythic-forest', name: 'Mythic Forest' },
    { id: 'isolated-bastion', name: 'Isolated Bastion' },
  ];

  const validationRules: Record<string, (value: any) => boolean> = {
    title: (value: string) => value.length >= 3 && value.length <= 100,
    description: (value: string) => value.length >= 10 && value.length <= 1000,
    bioregionId: (value: string) => value.length > 0,
    culturalReferences: (value: string[]) => value.length >= 2,
    ethicalElements: (value: string[]) => value.length >= 1,
    spiritualElements: (value: string[]) => value.length >= 1,
    materials: (value: string[]) => value.length >= 1,
    steps: (value: string[]) => value.length >= 3,
    duration: (value: number) => value >= 5 && value <= 480,
    participants: (value: number) => value >= 1 && value <= 1000,
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    Object.entries(validationRules).forEach(([field, validator]) => {
      const value = formData[field as keyof RitualFormData];
      if (!validator(value as any)) {
        newErrors[field] = t(`validation.${field}`);
      }
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
    return isValid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleInputChange = (field: keyof RitualFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (
    field: keyof RitualFormData,
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) =>
        i === index ? value : item,
      ),
    }));
  };

  const addArrayItem = (field: keyof RitualFormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ''],
    }));
  };

  const removeArrayItem = (field: keyof RitualFormData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderArrayField = (
    field: keyof RitualFormData,
    label: string,
    placeholder: string,
  ) => (
    <div className='space-y-2'>
      <label className='block text-sm font-medium text-gray-700'>{label}</label>
      {(formData[field] as string[]).map((item, index) => (
        <div key={index} className='flex gap-2'>
          <input
            type='text'
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
          />
          <button
            type='button'
            onClick={() => removeArrayItem(field, index)}
            className='px-3 py-2 text-red-600 hover:text-red-800'
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type='button'
        onClick={() => addArrayItem(field)}
        className='text-sm text-green-600 hover:text-green-800'
      >
        + Add {label}
      </button>
      {errors[field] && <p className='text-sm text-red-600'>{errors[field]}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg'
    >
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            {t('ritual.form.title')}
          </h2>
          <p className='text-gray-600'>{t('ritual.form.subtitle')}</p>
        </div>

        {/* Basic Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('ritual.form.title')}
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('ritual.form.titlePlaceholder')}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
            />
            {errors.title && (
              <p className='text-sm text-red-600 mt-1'>{errors.title}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('ritual.form.bioregion')}
            </label>
            <select
              value={formData.bioregionId}
              onChange={(e) => handleInputChange('bioregionId', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
            >
              <option value=''>{t('ritual.form.selectBioregion')}</option>
              {bioregions.map((bioregion) => (
                <option key={bioregion.id} value={bioregion.id}>
                  {bioregion.name}
                </option>
              ))}
            </select>
            {errors.bioregionId && (
              <p className='text-sm text-red-600 mt-1'>{errors.bioregionId}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            {t('ritual.form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder={t('ritual.form.descriptionPlaceholder')}
            rows={4}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
          />
          {errors.description && (
            <p className='text-sm text-red-600 mt-1'>{errors.description}</p>
          )}
        </div>

        {/* Cultural References */}
        {renderArrayField(
          'culturalReferences',
          t('ritual.form.culturalReferences'),
          t('ritual.form.culturalReferencePlaceholder'),
        )}

        {/* Ethical Elements */}
        {renderArrayField(
          'ethicalElements',
          t('ritual.form.ethicalElements'),
          t('ritual.form.ethicalElementPlaceholder'),
        )}

        {/* Spiritual Elements */}
        {renderArrayField(
          'spiritualElements',
          t('ritual.form.spiritualElements'),
          t('ritual.form.spiritualElementPlaceholder'),
        )}

        {/* Materials */}
        {renderArrayField(
          'materials',
          t('ritual.form.materials'),
          t('ritual.form.materialPlaceholder'),
        )}

        {/* Steps */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            {t('ritual.form.steps')}
          </label>
          {(formData.steps as string[]).map((step, index) => (
            <div key={index} className='flex gap-2'>
              <span className='flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium'>
                {index + 1}
              </span>
              <input
                type='text'
                value={step}
                onChange={(e) =>
                  handleArrayChange('steps', index, e.target.value)
                }
                placeholder={`${t('ritual.form.step')} ${index + 1}`}
                className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
              />
              <button
                type='button'
                onClick={() => removeArrayItem('steps', index)}
                className='px-3 py-2 text-red-600 hover:text-red-800'
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={() => addArrayItem('steps')}
            className='text-sm text-green-600 hover:text-green-800'
          >
            + Add Step
          </button>
          {errors.steps && (
            <p className='text-sm text-red-600'>{errors.steps}</p>
          )}
        </div>

        {/* Duration and Participants */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('ritual.form.duration')} (minutes)
            </label>
            <input
              type='number'
              value={formData.duration}
              onChange={(e) =>
                handleInputChange('duration', parseInt(e.target.value))
              }
              min='5'
              max='480'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
            />
            {errors.duration && (
              <p className='text-sm text-red-600 mt-1'>{errors.duration}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              {t('ritual.form.participants')}
            </label>
            <input
              type='number'
              value={formData.participants}
              onChange={(e) =>
                handleInputChange('participants', parseInt(e.target.value))
              }
              min='1'
              max='1000'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
            />
            {errors.participants && (
              <p className='text-sm text-red-600 mt-1'>{errors.participants}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className='text-center'>
          <motion.button
            type='submit'
            disabled={isSubmitting || Object.keys(errors).length > 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting
              ? t('ritual.form.submitting')
              : t('ritual.form.submit')}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default RitualSubmissionForm;
