'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SellLandingPage() {
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [bhk, setBhk] = useState('1 BHK');
  const [area, setArea] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<string | null>(null);

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) {
      alert('Please enter property area in sq.ft.');
      return;
    }
    const sqft = parseFloat(area) || 1000;
    const ratePerSqft = propertyType === 'Villa' ? 12000 : propertyType === 'Plot' ? 8000 : 7500;
    const total = sqft * ratePerSqft;
    const formatted = total >= 10000000
      ? `₹ ${(total / 10000000).toFixed(2)} Cr`
      : `₹ ${(total / 100000).toFixed(2)} Lakhs`;
    setEstimatedValue(formatted);
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-12 md:py-20 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left Copy */}
            <div className="space-y-6">
              <span className="bg-[#e8faf4] text-[#16a373] text-[12px] leading-[16px] tracking-[0.05em] font-bold px-3 py-1 rounded-full uppercase inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">verified</span>
                Sell Faster with Ziva
              </span>

              <h1 className="text-[36px] md:text-[52px] leading-[44px] md:leading-[60px] font-bold text-[#191c1e] tracking-tight">
                Sell your property <span className="text-[#5e23dc]">confidently &amp; quickly.</span>
              </h1>

              <p className="text-[16px] leading-[24px] text-[#494455] max-w-lg">
                Reach thousands of verified buyers. Get expert assistance at every step and close the deal on your terms without spam.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/post-property"
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md text-center text-xs"
                >
                  Post Property for Free
                </Link>
                <Link
                  href="/support"
                  className="border border-[#5e23dc] text-[#5e23dc] hover:bg-[#e8ddff] font-bold px-8 py-3.5 rounded-xl transition-all text-center text-xs"
                >
                  Talk to an Expert
                </Link>
              </div>
            </div>

            {/* Right Estimator Card */}
            <div className="bg-white border border-[#cbc3d8] rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
              <div>
                <h3 className="text-[20px] leading-[28px] font-bold text-[#191c1e]">Estimate Value</h3>
                <p className="text-[14px] leading-[20px] text-[#494455] mt-1">Get an instant, data-driven estimate of your property&apos;s worth.</p>
              </div>

              <form onSubmit={handleEstimate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#191c1e] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Noida"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#5e23dc]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#191c1e] mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-3 text-xs outline-none focus:border-[#5e23dc]"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="House/Villa">Independent House / Villa</option>
                    <option value="Plot">Residential Plot</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#191c1e] mb-1">BHK</label>
                    <select
                      value={bhk}
                      onChange={(e) => setBhk(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-3 text-xs outline-none focus:border-[#5e23dc]"
                    >
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#191c1e] mb-1">Area (sq.ft)</label>
                    <input
                      type="number"
                      placeholder="1200"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs outline-none focus:border-[#5e23dc]"
                    />
                  </div>
                </div>

                {estimatedValue && (
                  <div className="bg-[#e8faf4] border border-[#16a373] text-[#006c47] p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">Estimated Market Value</span>
                    <span className="text-[24px] leading-[32px] font-bold block mt-1">{estimatedValue}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#006c47] hover:bg-[#00734b] text-white font-bold py-3.5 rounded-xl transition-all text-xs shadow-sm flex items-center justify-center gap-2"
                >
                  Get Estimate
                  <span className="material-symbols-outlined text-sm">calculate</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* "Why Sell with Ziva?" Bento Grid */}
        <section className="py-16 bg-white border-t border-[#eceef0]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-[32px] leading-[40px] font-bold text-[#191c1e]">Why sell with Ziva?</h2>
              <p className="text-[14px] leading-[20px] text-[#494455] max-w-xl mx-auto">
                We combine advanced technology with human expertise to make selling your property a seamless experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Card 1 with Photo Banner */}
              <div className="bg-[#f8f9fb] rounded-2xl border border-[#cbc3d8] overflow-hidden flex flex-col justify-between h-[380px] shadow-sm hover:shadow-md transition-all">
                <div className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#e8ddff] text-[#4500b4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">groups</span>
                  </div>
                  <h3 className="text-[18px] leading-[26px] font-bold text-[#191c1e]">Verified Buyers</h3>
                  <p className="text-[13px] leading-[19px] text-[#494455]">
                    Access a curated pool of genuine, pre-qualified buyers ready to make an offer, reducing time-wasters.
                  </p>
                </div>
                <div className="h-36 w-full overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
                    alt="Verified Buyers Deal"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Card 2 with Photo Banner */}
              <div className="bg-[#f8f9fb] rounded-2xl border border-[#cbc3d8] overflow-hidden flex flex-col justify-between h-[380px] shadow-sm hover:shadow-md transition-all">
                <div className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#e8faf4] text-[#16a373] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">visibility</span>
                  </div>
                  <h3 className="text-[18px] leading-[26px] font-bold text-[#191c1e]">High Visibility</h3>
                  <p className="text-[13px] leading-[19px] text-[#494455]">
                    Your listing gets premium placement across our network, reaching thousands of buyers daily.
                  </p>
                </div>
                <div className="h-36 w-full overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
                    alt="Luxury Living Room"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Card 3 (Light Bento Item with Photo) */}
              <div className="bg-[#f8f9fb] rounded-2xl border border-[#cbc3d8] overflow-hidden flex flex-col justify-between h-[380px] shadow-sm hover:shadow-md transition-all">
                <div className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#feebc8] text-[#b7791f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                  </div>
                  <h3 className="text-[18px] leading-[26px] font-bold text-[#191c1e]">Expert Assistance</h3>
                  <p className="text-[13px] leading-[19px] text-[#494455]">
                    From pricing strategy to negotiation and paperwork, our dedicated real estate experts guide you securely.
                  </p>
                </div>
                <div className="h-36 w-full overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"
                    alt="Expert Guidance Property"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
