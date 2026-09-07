'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      router.replace('/auth/login?redirect=/dashboard');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const role = payload.role;

      if (role === 'OWNER') {
        router.replace('/dashboard/owner');
      } else if (role === 'AGENT') {
        router.replace('/dashboard/agent');
      } else if (role === 'SERVICE_PROVIDER') {
        router.replace('/dashboard/provider');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard/customer');
      }
    } catch {
      router.replace('/auth/login?redirect=/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center font-[Rubik] antialiased">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[#494455] font-medium text-sm">Directing to your personalized workspace...</p>
      </div>
    </div>
  );
}
