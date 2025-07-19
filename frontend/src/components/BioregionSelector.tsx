'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Bioregion {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface BioregionSelectorProps {
  selectedBioregion: string;
  onSelect: (bioregionId: string) => void;
  disabled?: boolean;
  className?: string;
}

const BioregionSelector: React.FC<BioregionSelectorProps> = ({
  selectedBioregion,
  onSelect,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const bioregions: Bioregion[] = [
    {
      id: 'tech-haven',
      name: t('bioregions.tech-haven'),
      description: t('bioregions.descriptions.tech-haven'),
      icon: '🏙️',
      color: 'bg-blue-500',
    },
    {
      id: 'mythic-forest',
      name: t('bioregions.mythic-forest'),
      description: t('bioregions.descriptions.mythic-forest'),
      icon: '🌲',
      color: 'bg-green-500',
    },
    {
      id: 'isolated-bastion',
      name: t('bioregions.isolated-bastion'),
      description: t('bioregions.descriptions.isolated-bastion'),
      icon: '🏰',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <label className='block text-sm font-medium text-gray-700'>
        {t('ritual.form.bioregion')}
      </label>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {bioregions.map((bioregion) => (
          <motion.div
            key={bioregion.id}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`
              relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
              ${
                selectedBioregion === bioregion.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && onSelect(bioregion.id)}
          >
            {/* Selection Indicator */}
            {selectedBioregion === bioregion.id && (
              <div className='absolute top-2 right-2'>
                <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-4 h-4 text-white'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Bioregion Content */}
            <div className='text-center'>
              <div className='text-4xl mb-3'>{bioregion.icon}</div>
              <h3 className='font-semibold text-gray-900 mb-2'>
                {bioregion.name}
              </h3>
              <p className='text-sm text-gray-600 leading-relaxed'>
                {bioregion.description}
              </p>
            </div>

            {/* Color Accent */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${bioregion.color} rounded-b-lg`}
            />
          </motion.div>
        ))}
      </div>

      {selectedBioregion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'
        >
          <p className='text-sm text-blue-800'>
            <strong>Selected:</strong>{' '}
            {bioregions.find((b) => b.id === selectedBioregion)?.name}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BioregionSelector;
