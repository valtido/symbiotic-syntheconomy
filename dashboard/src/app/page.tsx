'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/management');
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1>🔄 Redirecting to Service Management...</h1>
        <p>
          If you're not redirected automatically,{' '}
          <a href='/management' style={{ color: '#1976d2' }}>
            click here
          </a>
        </p>
      </div>
    </div>
  );
}
