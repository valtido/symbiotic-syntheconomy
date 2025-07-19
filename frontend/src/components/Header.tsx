'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const navItems = [
    { name: 'Home', href: '/', id: 'home' },
    { name: 'Submit Ritual', href: '/submit', id: 'submit' },
    { name: 'Bioregions', href: '/bioregions', id: 'bioregions' },
    { name: 'DAO', href: '/dao', id: 'dao' },
    { name: 'About', href: '/about', id: 'about' },
  ];

  return (
    <header className='bg-gradient-to-r from-green-800 to-emerald-700 text-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center py-4'>
          {/* Logo and Brand */}
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center'>
              <span className='text-green-800 font-bold text-lg'>🌱</span>
            </div>
            <div>
              <h1 className='text-xl font-bold'>
                Global Regeneration Ceremony
              </h1>
              <p className='text-green-200 text-sm'>Symbiotic Syntheconomy</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className='hidden md:flex space-x-8'>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button className='text-green-100 hover:text-white focus:outline-none focus:text-white'>
              <svg
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-green-100 hover:bg-green-600 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
