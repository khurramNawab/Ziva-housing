'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [purpose, setPurpose] = useState<'BUY' | 'RENT'>('BUY');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/properties?purpose=${purpose}&q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/properties?purpose=${purpose}`);
    }
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased flex flex-col min-h-screen font-[Rubik]">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* Motion Hero Section */}
        <section className="relative h-[520px] md:h-[600px] flex items-center justify-center bg-[#191919] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
              alt="Modern Luxury Home"
              className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#191919] via-transparent to-[#191919]/40" />
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8 w-full text-center space-y-6">
            <span className="inline-block bg-[#5e23dc] text-white text-[12px] leading-[16px] tracking-[0.05em] font-semibold px-3 py-1 rounded-full uppercase">
              Verified Marketplace &amp; Escrow Protection
            </span>
            <h1 className="text-[36px] md:text-[56px] leading-[44px] md:leading-[64px] font-bold text-white max-w-3xl mx-auto tracking-tight">
              Find Your Next Horizon.
            </h1>
            <p className="text-[16px] md:text-[18px] leading-[24px] text-[#e0e3e5] max-w-xl mx-auto">
              Discover premium real estate and trusted home services, all in one seamless platform.
            </p>

            {/* Floating Search Panel */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-xl border border-[#cbc3d8] max-w-3xl mx-auto space-y-3">
              {/* Tab Selector */}
              <div className="flex gap-2 justify-start border-b border-[#eceef0] pb-2">
                <button
                  suppressHydrationWarning
                  onClick={() => setPurpose('BUY')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purpose === 'BUY' ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-[#494455] hover:bg-[#f2f4f6]'}`}
                >
                  Buy Properties
                </button>
                <button
                  suppressHydrationWarning
                  onClick={() => setPurpose('RENT')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purpose === 'RENT' ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-[#494455] hover:bg-[#f2f4f6]'}`}
                >
                  Rent Homes
                </button>
                <Link
                  href="/services"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#006c47] hover:bg-[#e8faf4] transition-all"
                >
                  Home Services
                </Link>
              </div>

              {/* Input + Action */}
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center bg-[#f2f4f6] rounded-xl px-4 py-3 border border-transparent focus-within:border-[#5e23dc] transition-colors">
                  <span className="material-symbols-outlined text-[#5e23dc] mr-3">search</span>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder="Search locations, BHK, localities, or builder projects..."
                    className="bg-transparent border-none outline-none w-full text-xs font-medium text-[#191c1e] placeholder:text-[#7a7487]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  suppressHydrationWarning
                  onClick={handleSearch}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  Search Homes
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* "Need Help Moving In?" Section (Matching Stitch homepage) */}
        <section className="py-12 bg-white border-b border-[#eceef0]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="bg-[#f8f9fb] border border-[#cbc3d8] rounded-2xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
              <div className="space-y-2 max-w-lg">
                <h2 className="text-[28px] leading-[36px] font-bold text-[#191c1e]">Need Help Moving In?</h2>
                <p className="text-[14px] leading-[20px] text-[#494455]">
                  From deep cleaning to electrical setups, book verified professionals instantly with Ziva Guarantee.
                </p>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 text-[#4500b4] font-bold text-xs hover:underline pt-2"
                >
                  Explore Home Services
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {/* Service Cards Responsive Grid (No horizontal scrolling) */}
              <div className="flex gap-4 overflow-x-auto pb-3 w-full mt-4 md:mt-0 snap-x scrollbar-thin scrollbar-thumb-gray-200">
                {[
                  { slug: 'home-cleaning', title: 'Deep Cleaning', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'ac-repair', title: 'AC Service', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'electrician', title: 'Electrician', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'plumbing', title: 'Plumber', img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'carpenter', title: 'Carpenter', img: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'packers-movers', title: 'Packers & Movers', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'pest-control', title: 'Pest Control', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'baby-sitting', title: 'Baby Sitting', img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'elderly-care', title: 'Elderly Care', img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'painting', title: 'Wall Painting', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'barber', title: 'Barber at Home', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80' },
                  { slug: 'salon', title: 'Women\'s Salon', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80' },
                ].map((svc) => (
                  <Link
                    key={svc.slug}
                    href={['home-cleaning', 'ac-repair', 'electrician', 'plumbing', 'carpenter', 'packers-movers', 'pest-control', 'baby-sitting', 'elderly-care'].includes(svc.slug) ? `/services/${svc.slug}` : `/services`}
                    className="w-32 shrink-0 snap-start h-36 bg-white border border-[#cbc3d8] hover:border-[#5e23dc] rounded-2xl flex flex-col items-center justify-between p-2 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-gray-100">
                      <img src={svc.img} alt={svc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[11px] font-bold text-[#191c1e] group-hover:text-[#4500b4] transition-colors py-1 text-center truncate w-full">{svc.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 max-w-[1280px] mx-auto px-4 md:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-[28px] leading-[36px] font-bold text-[#191c1e]">Why Choose Ziva Housing?</h2>
            <p className="text-[14px] leading-[20px] text-[#494455] max-w-xl mx-auto">
              Our direct-to-owner lead safety policy and verification systems protect your time and money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#e8faf4] text-[#16a373] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h3 className="text-base font-bold text-[#191c1e]">Ziva Verified Listings</h3>
              <p className="text-xs text-[#494455] leading-relaxed">
                Every listed property undergoes document audit and location check to eliminate fake or duplicate ads.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#e8ddff] text-[#4500b4] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-[#191c1e]">Lead Anti-Bypass Protection</h3>
              </div>
              <p className="text-xs text-[#494455] leading-relaxed">
                Sensitive contact details are protected in encrypted negotiation rooms until visit terms are mutual.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#eceef0] shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#fff8e1] text-[#b45309] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <h3 className="text-base font-bold text-[#191c1e]">Token Escrow System</h3>
              <p className="text-xs text-[#494455] leading-relaxed">
                Deposit booking tokens into Ziva Escrow account. Funds remain safe until key handover validation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Dark Footer */}
      <Footer />
    </div>
  );
}
