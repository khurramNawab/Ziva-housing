'use client';

import Link from 'next/link';
import Footer from './components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased flex flex-col justify-between">
      {/* Brand Header */}
      <header className="bg-white border-b border-[#eceef0] h-16 flex items-center px-6 md:px-12 justify-between">
        <Link href="/" className="font-bold text-xl text-[#4500b4] flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold">J</span>
          Ziva Housing
        </Link>
        <Link href="/" className="text-xs font-bold text-[#5e23dc] hover:underline">
          Return Home
        </Link>
      </header>

      {/* Main 404 Workspace */}
      <main className="flex-grow flex items-center justify-center p-6 text-center">
        <div className="max-w-lg bg-white rounded-3xl border border-[#cbc3d8] p-10 shadow-lg space-y-6">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center bg-[#e8ddff] rounded-full text-[#4500b4]">
            <span className="material-symbols-outlined text-6xl">travel_explore</span>
            <span className="absolute -top-1 -right-1 bg-[#5e23dc] text-white text-xs font-black px-2 py-0.5 rounded-full">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[28px] md:text-[32px] leading-[36px] font-bold text-[#191c1e]">
              Page Not Found
            </h1>
            <p className="text-[14px] leading-[20px] text-[#494455] max-w-md mx-auto">
              We couldn’t find the page or property listing you were looking for. It may have been moved or unlisted.
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Go to Homepage
            </Link>
            <Link
              href="/properties?purpose=BUY"
              className="bg-[#f2f4f6] hover:bg-[#e8ddff] text-[#191c1e] hover:text-[#4500b4] font-bold py-3 rounded-xl text-xs border border-[#cbc3d8] transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Browse Properties
            </Link>
          </div>

          <div className="pt-4 border-t border-[#eceef0] text-xs text-[#7a7487]">
            Need help? Visit our <Link href="/support" className="text-[#5e23dc] font-bold underline">Support Center</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
