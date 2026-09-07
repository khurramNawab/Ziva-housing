'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">
        {/* Hero Banner */}
        <div className="bg-[#4500b4] text-white p-8 md:p-12 rounded-3xl space-y-4 shadow-xl">
          <span className="bg-[#5e23dc] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">About Ziva Housing</span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Reimagining Indian Real Estate &amp; Home Services</h1>
          <p className="text-sm md:text-base text-gray-200 max-w-2xl leading-relaxed">
            Ziva Housing is a modern tech-driven marketplace connecting property buyers, owners, agents, and verified service professionals across India with zero friction.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
            <span className="material-symbols-outlined text-3xl text-[#5e23dc]">verified_user</span>
            <h3 className="text-base font-bold">100% Verified Listings</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every property on Ziva undergoes strict document and physical verification before listing approval.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
            <span className="material-symbols-outlined text-3xl text-[#16a373]">handyman</span>
            <h3 className="text-base font-bold">Vetted Home Services</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              From deep cleaning to electrical repairs, our background-checked professionals ensure complete peace of mind.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
            <span className="material-symbols-outlined text-3xl text-[#b7791f]">handshake</span>
            <h3 className="text-base font-bold">Direct Negotiations</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Transparent offers, counter-offer tracking, and instant chat with zero hidden brokerage fees.
            </p>
          </div>
        </div>

        {/* Legal Disclaimer Note */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span> Legal &amp; Compliance Notice
          </p>
          <p>
            Final legal terms and regulatory disclosures are subject to review by qualified legal counsel per Ziva Housing standards.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
