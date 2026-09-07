'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/properties?purpose=BUY');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center font-[Rubik] antialiased">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[#494455] font-medium text-sm">Loading Verified Properties for Sale...</p>
      </div>
    </div>
  );
}
