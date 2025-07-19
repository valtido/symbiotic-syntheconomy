'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ValidationResultsProps {
  result: {
    success?: boolean;
    error?: string;
    scores?: {
      esepScore: number;
      cedaScore: number;
      narrativeScore: number;
    };
    isApproved?: boolean;
    message?: string;
  };
}

export default function ValidationResults({ result }: ValidationResultsProps) {
  if (result.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-red-50 border border-red-200 rounded-lg p-4'
      >
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-red-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>
              Validation Failed
            </h3>
            <p className='text-sm text-red-700 mt-1'>{result.error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (result.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-green-50 border border-green-200 rounded-lg p-4'
      >
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-green-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-green-800'>
              {result.isApproved ? 'Ritual Approved!' : 'Ritual Submitted'}
            </h3>
            <p className='text-sm text-green-700 mt-1'>
              {result.message ||
                'Your ritual has been successfully submitted for validation.'}
            </p>
          </div>
        </div>

        {result.scores && (
          <div className='mt-4 grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-800'>
                {(result.scores.esepScore * 100).toFixed(1)}%
              </div>
              <div className='text-xs text-green-600'>ESEP Score</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-800'>
                {(result.scores.cedaScore * 100).toFixed(1)}%
              </div>
              <div className='text-xs text-green-600'>CEDA Score</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-800'>
                {(result.scores.narrativeScore * 100).toFixed(1)}%
              </div>
              <div className='text-xs text-green-600'>Narrative Score</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}
