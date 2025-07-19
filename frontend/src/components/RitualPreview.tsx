'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RitualPreviewProps {
  ritual: {
    id?: string;
    title: string;
    description: string;
    bioregionId: string;
    author: string;
    duration: number;
    participants: number;
    culturalReferences: string[];
    ethicalElements: string[];
    spiritualElements: string[];
    materials: string[];
    steps: string[];
    esepScore: number;
    cedaScore: number;
    narrativeScore: number;
    isApproved: boolean;
    likes: number;
    views: number;
    createdAt: string;
    ipfsHash?: string;
  };
  onView?: (ritualId: string) => void;
  onLike?: (ritualId: string) => void;
  onShare?: (ritualId: string) => void;
  compact?: boolean;
}

const RitualPreview: React.FC<RitualPreviewProps> = ({
  ritual,
  onView,
  onLike,
  onShare,
  compact = false,
}) => {
  const { t } = useTranslation();

  const bioregionNames = {
    'tech-haven': 'Tech Haven',
    'mythic-forest': 'Mythic Forest',
    'isolated-bastion': 'Isolated Bastion',
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Needs Review';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className='bg-white rounded-lg shadow-md p-4 cursor-pointer'
        onClick={() => onView?.(ritual.id || '')}
      >
        <div className='flex items-center justify-between mb-2'>
          <h3 className='font-semibold text-gray-900 truncate'>
            {ritual.title}
          </h3>
          <span className='text-sm text-gray-500'>
            {formatDuration(ritual.duration)}
          </span>
        </div>

        <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
          {ritual.description}
        </p>

        <div className='flex items-center justify-between text-xs text-gray-500'>
          <span>
            {bioregionNames[ritual.bioregionId as keyof typeof bioregionNames]}
          </span>
          <span>{ritual.author}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className='bg-white rounded-lg shadow-lg overflow-hidden'
    >
      {/* Header */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex-1'>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>
              {ritual.title}
            </h2>
            <p className='text-gray-600 line-clamp-3'>{ritual.description}</p>
          </div>
          <div className='ml-4 flex flex-col items-end'>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                ritual.isApproved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {ritual.isApproved
                ? t('ritual.status.approved')
                : t('ritual.status.pending')}
            </span>
          </div>
        </div>

        {/* Meta Information */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
          <div>
            <span className='text-gray-500'>{t('ritual.bioregion')}</span>
            <p className='font-medium'>
              {
                bioregionNames[
                  ritual.bioregionId as keyof typeof bioregionNames
                ]
              }
            </p>
          </div>
          <div>
            <span className='text-gray-500'>{t('ritual.author')}</span>
            <p className='font-medium'>{ritual.author}</p>
          </div>
          <div>
            <span className='text-gray-500'>{t('ritual.duration')}</span>
            <p className='font-medium'>{formatDuration(ritual.duration)}</p>
          </div>
          <div>
            <span className='text-gray-500'>{t('ritual.participants')}</span>
            <p className='font-medium'>{ritual.participants}</p>
          </div>
        </div>
      </div>

      {/* AI Validation Scores */}
      <div className='p-6 bg-gray-50'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          {t('ritual.validation.title')}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>ESEP</span>
              <span
                className={`text-sm font-bold ${getScoreColor(
                  ritual.esepScore,
                )}`}
              >
                {getScoreLabel(ritual.esepScore)}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-green-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${ritual.esepScore * 100}%` }}
              />
            </div>
            <span className='text-xs text-gray-500 mt-1'>
              {(ritual.esepScore * 100).toFixed(0)}%
            </span>
          </div>

          <div className='bg-white p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>CEDA</span>
              <span className='text-sm font-bold text-blue-600'>
                {ritual.cedaScore} refs
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${Math.min(ritual.cedaScore / 5, 1) * 100}%` }}
              />
            </div>
            <span className='text-xs text-gray-500 mt-1'>
              {ritual.cedaScore} cultural references
            </span>
          </div>

          <div className='bg-white p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                Narrative
              </span>
              <span
                className={`text-sm font-bold ${getScoreColor(
                  ritual.narrativeScore,
                )}`}
              >
                {getScoreLabel(ritual.narrativeScore)}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-purple-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${ritual.narrativeScore * 100}%` }}
              />
            </div>
            <span className='text-xs text-gray-500 mt-1'>
              {(ritual.narrativeScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex space-x-4 text-sm text-gray-500'>
            <span>
              {ritual.culturalReferences.length}{' '}
              {t('ritual.culturalReferences')}
            </span>
            <span>
              {ritual.materials.length} {t('ritual.materials')}
            </span>
            <span>
              {ritual.steps.length} {t('ritual.steps')}
            </span>
          </div>
          <span className='text-sm text-gray-500'>
            {formatDate(ritual.createdAt)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center justify-between'>
          <div className='flex space-x-2'>
            <button
              onClick={() => onView?.(ritual.id || '')}
              className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
            >
              {t('ritual.actions.view')}
            </button>
            <button
              onClick={() => onLike?.(ritual.id || '')}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              ❤️ {ritual.likes}
            </button>
            <button
              onClick={() => onShare?.(ritual.id || '')}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              📤 {t('ritual.actions.share')}
            </button>
          </div>

          <div className='text-sm text-gray-500'>
            👁️ {ritual.views} {t('ritual.views')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RitualPreview;
