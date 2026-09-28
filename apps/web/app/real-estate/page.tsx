'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RealEstatePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [purpose, setPurpose] = useState<'BUY' | 'RENT'>('BUY');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/properties?purpose=${purpose}&q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/properties?purpose=${purpose}`);
    }
  };

  const handleTabClick = (tab: 'BUY' | 'RENT') => {
    setPurpose(tab);
    // If user clicks Rent directly, allow instant browsing or tab switch
    if (tab === 'RENT') {
      router.push('/properties?purpose=RENT');
    }
  };

  const QUICK_LINKS = purpose === 'BUY' ? [
    { label: '2 BHK in Bangalore', href: '/properties?purpose=BUY&q=2+BHK+Bangalore' },
    { label: '3 BHK in Delhi NCR', href: '/properties?purpose=BUY&q=3+BHK+Delhi' },
    { label: 'Luxury Villas in Mumbai', href: '/properties?purpose=BUY&q=villa+Mumbai' },
    { label: 'Gated Communities in Hyderabad', href: '/properties?purpose=BUY&q=Hyderabad' },
  ] : [
    { label: 'Furnished Flats in Bangalore', href: '/properties?purpose=RENT&q=furnished+Bangalore' },
    { label: '2 BHK for Rent in Gurgaon', href: '/properties?purpose=RENT&q=2+BHK+Gurgaon' },
    { label: 'Bandra Apartments, Mumbai', href: '/properties?purpose=RENT&q=Bandra' },
    { label: 'Studio Flats in Pune', href: '/properties?purpose=RENT&q=studio+Pune' },
  ];

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased flex flex-col min-h-screen font-[Rubik]">
      <Navbar />
      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative min-h-[580px] md:min-h-[640px] flex items-center justify-center bg-[#0f0c1a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
              alt="Premium Real Estate"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c1a]/75 via-[#0f0c1a]/45 to-[#0f0c1a]/85" />
          </div>

          {/* Trust Stat Pills */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 z-10 shadow-lg">
            {[
              { label: 'Verified Listings', value: '1,500+' },
              { label: 'Active Cities', value: '10+' },
              { label: 'Happy Customers', value: '2,800+' },
              { label: 'Avg. Response', value: '< 2 hrs' },
            ].map((s) => (
              <div key={s.label} className="text-center px-3 border-r border-white/20 last:border-0">
                <div className="text-white font-extrabold text-sm">{s.value}</div>
                <div className="text-white/70 text-[10px] font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="relative z-10 max-w-[920px] mx-auto px-4 md:px-8 w-full text-center space-y-6 pt-16 md:pt-6">
            <span className="inline-block bg-[#5e23dc] text-white text-[11px] tracking-[0.08em] font-bold px-3.5 py-1 rounded-full uppercase shadow-md">
              Verified Marketplace &amp; Escrow Protection
            </span>

            <h1 className="text-[38px] md:text-[60px] leading-[44px] md:leading-[68px] font-black text-white max-w-3xl mx-auto tracking-tight">
              Find Your Perfect <span className="text-[#a78bfa]">Home.</span>
            </h1>

            <p className="text-[15px] md:text-[17px] leading-[24px] text-white/80 max-w-xl mx-auto">
              Buy, rent, or sell premium verified properties with Ziva Escrow protection &amp; legal clearance.
            </p>

            {/* DEDICATED SEARCH CARD — ZERO EMOJIS, HIGH-GRADE ICONS */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl mx-auto overflow-hidden border border-gray-100">
              {/* Top Navigation Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#eceef0] bg-[#fafafa]">
                <button
                  type="button"
                  onClick={() => setPurpose('BUY')}
                  className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs md:text-sm font-black tracking-wide transition-all cursor-pointer ${
                    purpose === 'BUY'
                      ? 'bg-white text-[#5e23dc] border-b-2 border-[#5e23dc] shadow-xs'
                      : 'text-[#494455] hover:bg-gray-100/80 hover:text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px] sm:text-[18px]">home</span>
                  <span className="truncate">Buy Property</span>
                </button>

                <Link
                  href="/properties?purpose=RENT"
                  className={`flex items-center justify-center gap-1.5 py-3 px-2 text-xs md:text-sm font-black tracking-wide transition-all cursor-pointer ${
                    purpose === 'RENT'
                      ? 'bg-white text-[#5e23dc] border-b-2 border-[#5e23dc] shadow-xs'
                      : 'text-[#494455] hover:bg-gray-100/80 hover:text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px] sm:text-[18px]">key</span>
                  <span className="truncate">Rent Home</span>
                </Link>

                <Link
                  href="/properties?purpose=PG"
                  className="flex items-center justify-center gap-1.5 py-3 px-2 text-xs md:text-sm font-black text-[#494455] hover:bg-gray-100/80 hover:text-[#191c1e] transition-all text-center"
                >
                  <span className="material-symbols-outlined text-[17px] sm:text-[18px]">apartment</span>
                  <span className="truncate">PG &amp; Co-Living</span>
                </Link>

                <Link
                  href="/projects/p-prestige-falcon"
                  className="flex items-center justify-center gap-1.5 py-3 px-2 text-xs md:text-sm font-black text-[#494455] hover:bg-gray-100/80 hover:text-[#191c1e] transition-all text-center"
                >
                  <span className="material-symbols-outlined text-[17px] sm:text-[18px]">domain_add</span>
                  <span className="truncate">New Projects</span>
                </Link>
              </div>

              {/* Search Input Bar */}
              <div className="flex flex-col md:flex-row bg-white">
                <div className="flex-1 flex items-center px-4 py-3.5 border-b md:border-b-0 md:border-r border-[#eceef0]">
                  <span className="material-symbols-outlined text-[#5e23dc] mr-3 text-xl">search</span>
                  <input
                    type="text"
                    placeholder={purpose === 'BUY' ? "Search city, locality, builder, BHK type to buy..." : "Search rental apartments, flats, independent floors..."}
                    className="bg-transparent border-none outline-none w-full text-sm font-medium text-[#191c1e] placeholder:text-[#9ca3af]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-black px-8 py-3.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <span>Search</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Popular Search Chips */}
            <div className="flex flex-wrap justify-center gap-2" suppressHydrationWarning>
              <span className="text-white/60 text-xs font-medium self-center">Popular:</span>
              {QUICK_LINKS.map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="bg-white/10 hover:bg-white/20 text-white/95 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 transition-all backdrop-blur-sm hover:scale-105"
                >
                  {q.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* BROWSE BY PROPERTY TYPE */}
        <section className="py-14 bg-white border-b border-[#eceef0]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[24px] md:text-[28px] font-extrabold text-[#191c1e]">
                  Browse by Property Type
                </h2>
                <p className="text-sm text-gray-500 mt-1">Explore verified homes suited to your lifestyle and budget</p>
              </div>
              <Link
                href="/properties?purpose=BUY"
                className="text-[#5e23dc] font-bold text-sm flex items-center gap-1 hover:underline"
              >
                <span>View all</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { icon: 'apartment', label: 'Apartments', href: '/properties?purpose=BUY&q=apartment', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
                { icon: 'villa', label: 'Villas', href: '/properties?purpose=BUY&q=villa', color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
                { icon: 'home', label: 'Independent Houses', href: '/properties?purpose=BUY&q=house', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
                { icon: 'business', label: 'Commercial Spaces', href: '/properties?purpose=BUY&q=commercial', color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
                { icon: 'landscape', label: 'Plots & Land', href: '/properties?purpose=BUY&q=plot', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
                { icon: 'hotel', label: 'PG & Co-Living', href: '/properties?purpose=PG', color: 'bg-rose-50 text-rose-600', border: 'border-rose-100' },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={`flex flex-col items-center gap-3 p-5 bg-[#f8f9fb] hover:bg-white border ${cat.border} hover:border-[#5e23dc] rounded-2xl transition-all hover:shadow-lg group text-center cursor-pointer`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs`}>
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-[#191c1e] group-hover:text-[#5e23dc] transition-colors">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE ZIVA HOUSING */}
        <section className="py-14 bg-[#f8f9fb]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-extrabold text-[#5e23dc] uppercase tracking-wider">Trusted Real Estate</span>
              <h2 className="text-[26px] md:text-[34px] font-black text-[#191c1e] mt-1">Why Choose Ziva Housing?</h2>
              <p className="text-sm text-gray-500 mt-2">Zero spam, 100% verified documents, and India's first escrow-backed real estate portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: '100% Verified Listings', desc: 'Every home is physically inspected & legal documents verified before going live.', icon: 'verified_user' },
                { title: 'Escrow Transaction Shield', desc: 'Your token and deposit remain safely held in institutional escrow until closing.', icon: 'lock' },
                { title: 'Direct Owner Connect', desc: 'No intrusive middlemen. Chat directly with verified owners and authorized builders.', icon: 'forum' },
                { title: 'End-to-End Home Services', desc: 'Seamlessly shift in with deep cleaning, AC install, and packers & movers.', icon: 'home_repair_service' },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5e23dc] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#191c1e] mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CROSSLINK TO SERVICES (ACTIVE URBAN COMPANY SECTION) */}
        <section className="py-10 bg-gradient-to-r from-[#191c1e] via-[#2a174f] to-[#5e23dc] text-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="bg-amber-400 text-[#191c1e] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Home Services by Ziva
              </span>
              <h3 className="text-xl md:text-2xl font-black">Need Cleaning, AC Service, or Packers &amp; Movers?</h3>
              <p className="text-xs md:text-sm text-purple-200">
                Book 200+ doorstep home services backed by our 30-Day Guarantee &amp; ₹10,000 damage cover.
              </p>
            </div>
            <Link
              href="/"
              className="bg-amber-400 hover:bg-amber-300 text-[#191c1e] font-extrabold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">home_repair_service</span>
              <span>Explore Home Services</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
