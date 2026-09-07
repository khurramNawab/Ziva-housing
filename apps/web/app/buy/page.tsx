'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Property {
  id: string;
  title: string;
  purpose: string;
  propertyType: string;
  locality: string;
  city: string;
  expectedPrice?: number;
  bhk?: number;
  isZivaVerified: boolean;
  photos: Array<{ url: string }>;
}

export default function BuyLandingPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [sellListings, setSellListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('Noida');
  const [bhkFilter, setBhkFilter] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const [verifiedLaunches, setVerifiedLaunches] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('Ziva_saved_properties');
      if (raw) {
        const parsed = JSON.parse(raw);
        const ids = parsed.map((item: any) => (typeof item === 'string' ? item : item.id));
        setSavedIds(ids);
      }
    } catch {}
  }, []);

  const toggleSaveProperty = (prop: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const raw = localStorage.getItem('Ziva_saved_properties');
      let list = raw ? JSON.parse(raw) : [];

      const isAlreadySaved = list.some((item: any) => (typeof item === 'string' ? item === prop.id : item.id === prop.id));

      if (isAlreadySaved) {
        list = list.filter((item: any) => (typeof item === 'string' ? item !== prop.id : item.id !== prop.id));
        setSavedIds((prev) => prev.filter((id) => id !== prop.id));
      } else {
        const saveObj = {
          id: prop.id,
          title: prop.title,
          expectedPrice: prop.expectedPrice || 0,
          locality: prop.locality,
          city: prop.city,
          purpose: 'SELL',
          bhk: prop.bhk,
          photos: prop.photos || [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80' }],
        };
        list.push(saveObj);
        setSavedIds((prev) => [...prev, prop.id]);
      }

      localStorage.setItem('Ziva_saved_properties', JSON.stringify(list));
    } catch (err) {
      console.error('Error updating wishlist', err);
    }
  };

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (accToken) setToken(accToken);

    fetchSellProperties();
    fetchVerifiedLaunches();
  }, [cityFilter, bhkFilter, priceMax]);

  const fetchVerifiedLaunches = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const query = `purpose=SELL&limit=6`;
      const res = await fetch(`${apiBase}/api/v1/properties?${query}`);
      const json = await res.json();
      if (res.ok) {
        setVerifiedLaunches(json.data?.properties || json.properties || []);
      }
    } catch {
      // Silent
    }
  };

  const fetchSellProperties = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const query = `purpose=SELL&limit=12${cityFilter ? `&city=${cityFilter}` : ''}${bhkFilter ? `&bhk=${bhkFilter}` : ''}${priceMax ? `&maxPrice=${priceMax}` : ''}`;
      const res = await fetch(`${apiBase}/api/v1/properties?${query}`);
      const json = await res.json();
      if (res.ok) {
        setSellListings(json.data?.properties || json.properties || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/properties?purpose=SELL&city=${cityFilter}&q=${searchQuery}`);
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-sans">
      {/* Unified Global Navbar */}
      <Navbar />

      {/* Hero Header Section */}
      <section className="bg-[#191919] text-white py-16 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80')" }} />
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 w-full space-y-6">
          <span className="bg-[#5e23dc] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Verified Property Marketplace
          </span>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight max-w-xl">
            Find and Buy Your Premium Dream Home with Confidence
          </h1>
          <p className="text-xs text-gray-300 max-w-lg">
            Every home listed on Ziva undergoes verification. Protect your token deposit in Ziva Escrow until handover validation.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 max-w-3xl pt-2">
            <input
              type="text"
              placeholder="Search localities, builder projects, or societies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow h-12 bg-white rounded-xl px-4 text-xs text-[#191c1e] outline-none"
            />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-12 bg-white border border-[#cbc3d8] rounded-xl px-3 text-xs outline-none text-[#191c1e] font-semibold"
            >
              <option value="Noida">Noida</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
            </select>
            <button
              type="submit"
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold h-12 px-6 rounded-xl text-xs transition shadow-lg shrink-0"
            >
              Search Homes
            </button>
          </form>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-[1280px] mx-auto px-6 py-12 flex-grow w-full space-y-12">

        {/* Section: Verified Builder Launches */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-[#eceef0] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#191c1e]">Ziva Verified Builder Launches</h2>
              <p className="text-xs text-gray-500 mt-0.5">Explore premium pre-launch suites directly from trusted developers.</p>
            </div>
            <Link href="/projects/p-prestige-falcon" className="text-xs font-bold text-[#5e23dc] hover:underline">
              View Premium Launch
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {verifiedLaunches.length > 0 ? (
              verifiedLaunches.map((item) => (
                <div key={item.id} className="bg-white border border-[#eceef0] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-md transition relative group">
                  <div className="md:w-1/2 h-44 md:h-auto overflow-hidden relative bg-[#f2f4f6]">
                    <img src={item.photos[0]?.url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-3 left-3 bg-[#e8faf4] text-[#16a373] text-[8px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                      Verified
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSaveProperty(item, e)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${
                        savedIds.includes(item.id) ? 'text-[#ba1a1a]' : 'text-[#7a7487] hover:text-[#ba1a1a]'
                      }`}
                      title={savedIds.includes(item.id) ? 'Remove from Saved' : 'Save Property'}
                    >
                      <span className={`material-symbols-outlined text-sm ${savedIds.includes(item.id) ? 'font-fill text-red-500' : ''}`}>
                        favorite
                      </span>
                    </button>
                  </div>
                  <div className="p-5 md:w-1/2 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-[#5e23dc] uppercase">{item.propertyType || 'Apartment'}</span>
                      <h3 className="font-bold text-sm text-[#191c1e] line-clamp-1">{item.title}</h3>
                      <p className="text-[10px] text-gray-500">{item.locality}, {item.city}</p>
                      <p className="font-bold text-xs text-[#006c47] mt-1">Starting from ₹ {(item.expectedPrice || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <Link
                      href={`/projects/${item.id}`}
                      className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-center py-2 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Explore Layout Plans
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Fallback to Mocks but properly linked to dynamic layout files */}
                <div className="bg-white border border-[#eceef0] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-md transition relative group">
                  <div className="md:w-1/2 h-44 md:h-auto overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80" alt="Godrej Woods" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-3 left-3 bg-[#e8faf4] text-[#16a373] text-[8px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                      68% Completed
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSaveProperty({
                        id: 'p-premium-noida',
                        title: 'Godrej Woods Suites',
                        expectedPrice: 18500000,
                        locality: 'Sector 43',
                        city: 'Noida',
                        bhk: 3,
                        propertyType: 'APARTMENT',
                        photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' }]
                      }, e)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${
                        savedIds.includes('p-premium-noida') ? 'text-[#ba1a1a]' : 'text-[#7a7487] hover:text-[#ba1a1a]'
                      }`}
                      title={savedIds.includes('p-premium-noida') ? 'Remove from Saved' : 'Save Property'}
                    >
                      <span className={`material-symbols-outlined text-sm ${savedIds.includes('p-premium-noida') ? 'font-fill text-red-500' : ''}`}>
                        favorite
                      </span>
                    </button>
                  </div>
                  <div className="p-5 md:w-1/2 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-[#5e23dc] uppercase">Godrej Properties</span>
                      <h3 className="font-bold text-sm text-[#191c1e]">Godrej Woods Suites</h3>
                      <p className="text-[10px] text-gray-500">Sector 43, Noida</p>
                      <p className="font-bold text-xs text-[#006c47] mt-1">Starting from ₹ 1.85 Cr</p>
                    </div>
                    <Link
                      href="/projects/p-premium-noida"
                      className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-center py-2 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Explore Layout Plans
                    </Link>
                  </div>
                </div>

                <div className="bg-white border border-[#eceef0] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-md transition relative group">
                  <div className="md:w-1/2 h-44 md:h-auto overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80" alt="Prestige Suites" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-3 left-3 bg-blue-100 text-blue-800 text-[8px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase">
                      Pre-launch
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSaveProperty({
                        id: 'p-prestige-falcon',
                        title: 'Prestige Falcon City',
                        expectedPrice: 12500000,
                        locality: 'Kanakapura Road',
                        city: 'Bangalore',
                        bhk: 3,
                        propertyType: 'APARTMENT',
                        photos: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' }]
                      }, e)}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${
                        savedIds.includes('p-prestige-falcon') ? 'text-[#ba1a1a]' : 'text-[#7a7487] hover:text-[#ba1a1a]'
                      }`}
                      title={savedIds.includes('p-prestige-falcon') ? 'Remove from Saved' : 'Save Property'}
                    >
                      <span className={`material-symbols-outlined text-sm ${savedIds.includes('p-prestige-falcon') ? 'font-fill text-red-500' : ''}`}>
                        favorite
                      </span>
                    </button>
                  </div>
                  <div className="p-5 md:w-1/2 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-[#5e23dc] uppercase">Prestige Group</span>
                      <h3 className="font-bold text-sm text-[#191c1e]">Prestige Falcon City</h3>
                      <p className="text-[10px] text-gray-500">Kanakapura Road, Bangalore</p>
                      <p className="font-bold text-xs text-[#006c47] mt-1">Starting from ₹ 1.25 Cr</p>
                    </div>
                    <Link
                      href="/projects/p-prestige-falcon"
                      className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-center py-2 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Explore Layout Plans
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section: Properties for Sale */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-[#eceef0] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#191c1e]">Featured Properties For Sale</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filter by pricing and configuration layouts to find matching properties.</p>
            </div>
            {/* Quick Filters */}
            <div className="flex gap-2 text-xs">
              <select
                value={bhkFilter}
                onChange={(e) => setBhkFilter(e.target.value)}
                className="h-8 bg-white border border-[#cbc3d8] rounded-lg px-2 outline-none text-[#191c1e]"
              >
                <option value="">BHK Configuration</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
              </select>
              <select
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-8 bg-white border border-[#cbc3d8] rounded-lg px-2 outline-none text-[#191c1e]"
              >
                <option value="">Price Budget</option>
                <option value="5000000">Under 50 Lakhs</option>
                <option value="10000000">Under 1 Crore</option>
                <option value="20000000">Under 2 Crores</option>
                <option value="50000000">Under 5 Crores</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-gray-400">Fetching listings...</div>
          ) : sellListings.length === 0 ? (
            <div className="bg-white p-12 text-center border border-[#eceef0] rounded-2xl shadow-sm text-xs font-semibold text-gray-400">
              No matching properties for sale in this region.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {sellListings.map((prop) => (
                <div key={prop.id} className="bg-white rounded-2xl overflow-hidden border border-[#eceef0] shadow-sm flex flex-col justify-between hover:shadow-md transition relative group">
                  <div className="space-y-3">
                    <div className="h-40 overflow-hidden relative bg-[#f2f4f6]">
                      <img src={prop.photos[0]?.url || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=350&q=80"} alt="Property mockup" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {prop.isZivaVerified && (
                        <span className="absolute top-2 left-2 bg-[#e8faf4] text-[#16a373] text-[8px] font-extrabold px-2 py-0.5 rounded uppercase">
                          Ziva Verified
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => toggleSaveProperty(prop, e)}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${
                          savedIds.includes(prop.id) ? 'text-[#ba1a1a]' : 'text-[#7a7487] hover:text-[#ba1a1a]'
                        }`}
                        title={savedIds.includes(prop.id) ? 'Remove from Saved' : 'Save Property'}
                      >
                        <span className={`material-symbols-outlined text-sm ${savedIds.includes(prop.id) ? 'font-fill text-red-500' : ''}`}>
                          favorite
                        </span>
                      </button>
                    </div>
                    <div className="px-4 space-y-1">
                      <h4 className="font-bold text-xs text-[#191c1e] truncate">{prop.title}</h4>
                      <p className="text-[10px] text-gray-500">{prop.locality}, {prop.city}</p>
                      <p className="font-bold text-xs text-[#4500b4]">{prop.bhk} BHK | {prop.propertyType}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-[#eceef0] flex justify-between items-center mt-4">
                    <span className="font-bold text-sm text-[#006c47]">₹ {Number(prop.expectedPrice || 0).toLocaleString('en-IN')}</span>
                    <Link
                      href={`/properties/${prop.id}`}
                      className="bg-[#5e23dc]/10 text-[#5e23dc] px-3 py-1 rounded-lg text-[10px] font-bold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
