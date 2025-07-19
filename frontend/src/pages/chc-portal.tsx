'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Candidate {
  id: string;
  name: string;
  bioregion: string;
  culturalBackground: string;
  experience: string;
  vision: string;
  voteCount: number;
  percentage: number;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'completed';
  totalVotes: number;
  candidates: Candidate[];
}

interface CouncilMember {
  id: string;
  name: string;
  bioregion: string;
  role: string;
  termStart: string;
  termEnd: string;
  activeRituals: number;
  validationRate: number;
}

const CHCPortal: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    'elections' | 'council' | 'analytics'
  >('elections');
  const [elections, setElections] = useState<Election[]>([]);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockElections: Election[] = [
      {
        id: '1',
        title: 'Cultural Heritage Council Election 2025',
        description:
          'Electing representatives for bioregional cultural preservation and ritual validation',
        startDate: '2025-01-15',
        endDate: '2025-01-22',
        status: 'active',
        totalVotes: 1247,
        candidates: [
          {
            id: '1',
            name: 'Dr. Maya Chen',
            bioregion: 'Pacific Northwest',
            culturalBackground:
              'Indigenous Coast Salish traditions, Environmental anthropology',
            experience:
              '15 years in cultural preservation, 8 years in ritual validation',
            vision:
              'Harmonizing traditional wisdom with ecological stewardship',
            voteCount: 456,
            percentage: 36.6,
          },
          {
            id: '2',
            name: 'Elder James Black Elk',
            bioregion: 'Great Plains',
            culturalBackground: 'Lakota traditions, Intergenerational wisdom',
            experience:
              '40 years as cultural elder, 25 years in community leadership',
            vision: 'Preserving ancestral knowledge for future generations',
            voteCount: 389,
            percentage: 31.2,
          },
          {
            id: '3',
            name: 'Prof. Elena Rodriguez',
            bioregion: 'Southwest Desert',
            culturalBackground: 'Mexican-American traditions, Desert ecology',
            experience:
              '12 years in cultural studies, 6 years in bioregional planning',
            vision: 'Integrating desert wisdom with modern sustainability',
            voteCount: 234,
            percentage: 18.8,
          },
          {
            id: '4',
            name: 'Sarah Mitchell',
            bioregion: 'Appalachian Mountains',
            culturalBackground: 'Celtic traditions, Mountain ecology',
            experience:
              '8 years in folk traditions, 5 years in community organizing',
            vision: 'Revitalizing mountain traditions for ecological harmony',
            voteCount: 168,
            percentage: 13.4,
          },
        ],
      },
    ];

    const mockCouncilMembers: CouncilMember[] = [
      {
        id: '1',
        name: 'Dr. Aisha Patel',
        bioregion: 'Northeast Coast',
        role: 'Council Chair',
        termStart: '2024-01-01',
        termEnd: '2026-12-31',
        activeRituals: 23,
        validationRate: 94.2,
      },
      {
        id: '2',
        name: 'Chief Running Bear',
        bioregion: 'Great Lakes',
        role: 'Cultural Preservation',
        termStart: '2024-01-01',
        termEnd: '2026-12-31',
        activeRituals: 18,
        validationRate: 96.8,
      },
      {
        id: '3',
        name: 'Dr. Carlos Mendez',
        bioregion: 'Southeast',
        role: 'Ritual Validation',
        termStart: '2024-01-01',
        termEnd: '2026-12-31',
        activeRituals: 31,
        validationRate: 91.5,
      },
    ];

    setElections(mockElections);
    setCouncilMembers(mockCouncilMembers);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'pending':
        return '🟡';
      case 'completed':
        return '🔵';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center'
        >
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>
            Loading Cultural Heritage Council Portal...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-green-800 to-emerald-700 text-white shadow-lg'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center'>
              <span className='text-green-800 font-bold text-xl'>🏛️</span>
            </div>
            <div>
              <h1 className='text-3xl font-bold'>Cultural Heritage Council</h1>
              <p className='text-green-200'>Governance & Election Portal</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white shadow-sm border-b'
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex space-x-8'>
            {[
              { id: 'elections', label: 'Active Elections', icon: '🗳️' },
              { id: 'council', label: 'Council Members', icon: '👥' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className='mr-2'>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {activeTab === 'elections' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='space-y-6'
          >
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Active Elections
              </h2>

              {elections.map((election) => (
                <div key={election.id} className='border rounded-lg p-6 mb-6'>
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h3 className='text-xl font-semibold text-gray-900'>
                        {election.title}
                      </h3>
                      <p className='text-gray-600 mt-1'>
                        {election.description}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        election.status,
                      )}`}
                    >
                      <span className='mr-1'>
                        {getStatusIcon(election.status)}
                      </span>
                      {election.status.charAt(0).toUpperCase() +
                        election.status.slice(1)}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm text-gray-600'>
                    <div>
                      <span className='font-medium'>Start Date:</span>{' '}
                      {new Date(election.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className='font-medium'>End Date:</span>{' '}
                      {new Date(election.endDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className='font-medium'>Total Votes:</span>{' '}
                      {election.totalVotes.toLocaleString()}
                    </div>
                  </div>

                  {/* Candidates */}
                  <div className='space-y-4'>
                    <h4 className='text-lg font-semibold text-gray-900'>
                      Candidates
                    </h4>
                    {election.candidates.map((candidate, index) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                      >
                        <div className='flex justify-between items-start mb-3'>
                          <div className='flex-1'>
                            <h5 className='font-semibold text-gray-900'>
                              {candidate.name}
                            </h5>
                            <p className='text-sm text-gray-600'>
                              {candidate.bioregion}
                            </p>
                            <p className='text-sm text-gray-500 mt-1'>
                              {candidate.culturalBackground}
                            </p>
                          </div>
                          <div className='text-right'>
                            <div className='text-lg font-bold text-green-600'>
                              {candidate.voteCount}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {candidate.percentage}%
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className='w-full bg-gray-200 rounded-full h-2 mb-3'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${candidate.percentage}%` }}
                            transition={{
                              duration: 1,
                              delay: 0.5 + index * 0.1,
                            }}
                            className='bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full'
                          />
                        </div>

                        <div className='text-sm text-gray-600'>
                          <p>
                            <span className='font-medium'>Experience:</span>{' '}
                            {candidate.experience}
                          </p>
                          <p>
                            <span className='font-medium'>Vision:</span>{' '}
                            {candidate.vision}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'council' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='space-y-6'
          >
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                Current Council Members
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {councilMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='border rounded-lg p-6 hover:shadow-lg transition-shadow'
                  >
                    <div className='text-center mb-4'>
                      <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3'>
                        <span className='text-white font-bold text-xl'>
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {member.name}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        {member.bioregion}
                      </p>
                    </div>

                    <div className='space-y-3 text-sm'>
                      <div>
                        <span className='font-medium text-gray-700'>Role:</span>
                        <p className='text-gray-600'>{member.role}</p>
                      </div>
                      <div>
                        <span className='font-medium text-gray-700'>Term:</span>
                        <p className='text-gray-600'>
                          {new Date(member.termStart).toLocaleDateString()} -{' '}
                          {new Date(member.termEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className='font-medium text-gray-700'>
                          Active Rituals:
                        </span>
                        <p className='text-gray-600'>{member.activeRituals}</p>
                      </div>
                      <div>
                        <span className='font-medium text-gray-700'>
                          Validation Rate:
                        </span>
                        <div className='flex items-center space-x-2'>
                          <div className='flex-1 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-green-500 h-2 rounded-full'
                              style={{ width: `${member.validationRate}%` }}
                            />
                          </div>
                          <span className='text-gray-600'>
                            {member.validationRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='space-y-6'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <div className='flex items-center'>
                  <div className='p-3 rounded-full bg-blue-100 text-blue-600'>
                    <span className='text-2xl'>📊</span>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Total Rituals
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>1,247</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <div className='flex items-center'>
                  <div className='p-3 rounded-full bg-green-100 text-green-600'>
                    <span className='text-2xl'>✅</span>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Validation Rate
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>94.2%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <div className='flex items-center'>
                  <div className='p-3 rounded-full bg-purple-100 text-purple-600'>
                    <span className='text-2xl'>🌍</span>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Bioregions
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>12</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <div className='flex items-center'>
                  <div className='p-3 rounded-full bg-yellow-100 text-yellow-600'>
                    <span className='text-2xl'>👥</span>
                  </div>
                  <div className='ml-4'>
                    <p className='text-sm font-medium text-gray-600'>
                      Active Voters
                    </p>
                    <p className='text-2xl font-bold text-gray-900'>892</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts and Analytics */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Cultural Diversity Score
                </h3>
                <div className='space-y-4'>
                  {[
                    { region: 'Pacific Northwest', score: 92 },
                    { region: 'Great Plains', score: 88 },
                    { region: 'Southwest Desert', score: 85 },
                    { region: 'Appalachian Mountains', score: 91 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm text-gray-600'>
                        {item.region}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <div className='w-24 bg-gray-200 rounded-full h-2'>
                          <div
                            className='bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full'
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className='text-sm font-medium text-gray-900'>
                          {item.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className='bg-white rounded-lg shadow-lg p-6'
              >
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Ritual Validation Trends
                </h3>
                <div className='space-y-4'>
                  {[
                    { month: 'Jan', approved: 45, rejected: 8 },
                    { month: 'Feb', approved: 52, rejected: 6 },
                    { month: 'Mar', approved: 48, rejected: 9 },
                    { month: 'Apr', approved: 61, rejected: 5 },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm text-gray-600'>
                        {item.month}
                      </span>
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-1'>
                          <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                          <span className='text-sm text-gray-600'>
                            {item.approved}
                          </span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                          <span className='text-sm text-gray-600'>
                            {item.rejected}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CHCPortal;
