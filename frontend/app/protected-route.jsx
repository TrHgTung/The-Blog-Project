'use client';

import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return children;
}
