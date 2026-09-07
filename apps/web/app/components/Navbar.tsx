'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [city, setCity] = useState('Detecting...');
  const [locating, setLocating] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<Array<{ display: string; area: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real reverse geocoding with zoom=18 pinpoint accuracy (prioritizes road/neighbourhood over administrative sub-beat)
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      // 1. Try OSM Nominatim with zoom=18 for exact building/street/neighbourhood level
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      
      const mainCity = addr.city || addr.town || addr.state_district || addr.county || addr.state || 'Kolkata';

      // Prioritize exact street / landmark / road / neighbourhood first (e.g., "College Street", "Park Street")
      const exactStreetOrColony =
        addr.road ||
        addr.neighbourhood ||
        addr.amenity ||
        addr.commercial ||
        addr.retail ||
        addr.residential ||
        addr.quarter;

      const subArea =
        exactStreetOrColony ||
        addr.suburb ||
        addr.city_district ||
        addr.subdistrict ||
        addr.village ||
        addr.town;

      if (exactStreetOrColony && mainCity && exactStreetOrColony.toLowerCase() !== mainCity.toLowerCase()) {
        return `${exactStreetOrColony}, ${mainCity}`;
      }

      if (subArea && mainCity && subArea.toLowerCase() !== mainCity.toLowerCase()) {
        return `${subArea}, ${mainCity}`;
      }

      return (subArea || mainCity || addr.state || 'Your Location');
    } catch {
      // 2. Fallback to BigDataCloud reverse geocode client
      try {
        const bdcRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        const bdcData = await bdcRes.json();
        const locality = bdcData.locality || bdcData.principalSubdivisionDistrict || bdcData.city;
        const city = bdcData.city || bdcData.principalSubdivision;
        if (locality && city && locality !== city) return `${locality}, ${city}`;
        return locality || city || 'Your Location';
      } catch {
        return 'Your Location';
      }
    }
  };

  const detectLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          localStorage.setItem('Ziva_lat', String(latitude));
          localStorage.setItem('Ziva_lon', String(longitude));
          localStorage.setItem('Ziva_accuracy', String(accuracy));
          const detectedCity = await reverseGeocode(latitude, longitude);
          setCity(detectedCity);
          localStorage.setItem('Ziva_city', detectedCity);
          setLocating(false);
          setShowLocModal(false);
        },
        async (error) => {
          console.warn('GPS Geolocation prompt error or denied:', error);
          try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData.city) {
              const fallbackLoc = `${ipData.city}, ${ipData.region_code || ipData.country_name}`;
              setCity(fallbackLoc);
              localStorage.setItem('Ziva_city', fallbackLoc);
            } else {
              setCity('Kolkata');
            }
          } catch {
            setCity('India');
          }
          setLocating(false);
        },
        {
          enableHighAccuracy: true, // Hardware GPS triangulation
          timeout: 15000,
          maximumAge: 0, // Force fresh position, never use stale cached ISP node
        }
      );
    }
  };

  // High-precision area / locality / pin code autocomplete search
  const searchAreas = async (q: string) => {
    const query = q.trim();
    if (query.length < 2) {
      setAreaSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      // 1. Photon Geocoder (Fastest, supports PIN codes, colonies, landmarks)
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const suggestions = data.features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || '';
          const street = p.street || '';
          const district = p.district || p.suburb || p.locality || '';
          const city = p.city || p.county || p.state || '';
          const postcode = p.postcode ? ` (${p.postcode})` : '';

          const parts = [name, street, district, city].filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));
          const display = uniqueParts.slice(0, 3).join(', ') + postcode;
          return {
            display: display || p.name || query,
            area: display || p.name || query,
          };
        }).filter((s: any) => s.display);
        setAreaSuggestions(suggestions);
      } else {
        // 2. Fallback to OpenStreetMap Nominatim
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const nomData = await nomRes.json();
        const suggestions = nomData.map((item: any) => {
          const addr = item.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.village || item.display_name.split(',')[0];
          const c = addr.city || addr.town || addr.state_district || '';
          const display = [area, c].filter(Boolean).join(', ') + (addr.postcode ? ` (${addr.postcode})` : '');
          return {
            display: display || item.display_name.split(',').slice(0, 2).join(','),
            area: display || item.display_name.split(',')[0],
          };
        });
        setAreaSuggestions(suggestions);
      }
    } catch {
      setAreaSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAreaSearchChange = (val: string) => {
    setAreaSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAreas(val), 250);
  };

  const selectArea = (display: string, area: string) => {
    setCity(display);
    localStorage.setItem('Ziva_city', display);
    localStorage.removeItem('Ziva_lat');
    localStorage.removeItem('Ziva_lon');
    setAreaSearch('');
    setAreaSuggestions([]);
    setShowLocModal(false);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const accToken = localStorage.getItem('Ziva_access');

    if (accToken) {
      setToken(accToken);
      try {
        const payload = JSON.parse(atob(accToken.split('.')[1] || ''));
        setUserRole(payload.role || '');
      } catch (err) {
        // ignore malformed
      }
    }

    // Restore saved city if present
    const savedCity = localStorage.getItem('Ziva_city');
    if (savedCity) {
      setCity(savedCity);
    } else {
      // Auto-detect on first load
      detectLocation();
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardPath = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'OWNER') return '/dashboard/owner';
    if (userRole === 'AGENT') return '/dashboard/agent';
    if (userRole === 'SERVICE_PROVIDER') return '/dashboard/provider';
    return '/dashboard/customer';
  };

  const isTabActive = (tabKey: string) => {
    if (!mounted || typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const purpose = urlParams.get('purpose');

    if (tabKey === 'BUY') return pathname === '/buy' || (pathname === '/properties' && (purpose === 'BUY' || !purpose));
    if (tabKey === 'RENT') return pathname === '/rent' || (pathname === '/properties' && purpose === 'RENT');
    if (tabKey === 'SELL') return pathname === '/sell' || (pathname === '/properties' && purpose === 'SELL');
    if (tabKey === 'PG') return pathname === '/pg' || (pathname === '/properties' && purpose === 'PG');
    if (tabKey === 'NEW_PROJECTS') return pathname.includes('/projects') || (pathname === '/properties' && purpose === 'NEW_PROJECTS');
    if (tabKey === 'SERVICES') return pathname.includes('/services');
    return false;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#eceef0] sticky top-0 z-50 font-[Rubik]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-2 md:gap-4">
        {/* Brand & Geolocation Location Selector */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="font-bold text-[18px] md:text-[22px] text-[#4500b4] tracking-tight flex items-center gap-1.5 shrink-0">
            <img src="/logo.png" alt="Ziva Housing Logo" className="h-10 sm:h-12 w-auto object-contain flex-shrink-0" />
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowLocModal(!showLocModal)}
              className="flex items-center gap-1 bg-[#f2f4f6] hover:bg-[#e8ddff] px-2.5 py-1.5 rounded-xl border border-[#cbc3d8] text-[11px] md:text-xs font-semibold text-[#191c1e] transition-all cursor-pointer max-w-[120px] sm:max-w-[180px]"
            >
              <span className={`material-symbols-outlined text-xs md:text-sm flex-shrink-0 ${mounted && locating ? 'animate-spin text-[#5e23dc]' : 'text-[#7a7487]'}`}>
                {mounted && locating ? 'sync' : 'location_on'}
              </span>
              <span className="truncate" suppressHydrationWarning>
                {mounted ? (locating ? 'Detecting...' : city) : 'Location'}
              </span>
              <span className="material-symbols-outlined text-xs text-[#7a7487] flex-shrink-0">expand_more</span>
            </button>

            {/* Location Selector Dropdown Modal */}
            {showLocModal && (
              <div className="absolute top-10 left-0 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#cbc3d8] p-4 z-50 space-y-3 animate-in fade-in duration-150">
                <div className="flex justify-between items-center border-b border-[#eceef0] pb-2">
                  <span className="text-xs font-bold text-[#191c1e]">Select Your Location</span>
                  <button onClick={() => setShowLocModal(false)} className="text-gray-400 hover:text-gray-600">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                {/* Area search input with Nominatim autocomplete */}
                <div className="relative">
                  <div className="flex items-center gap-2 bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 focus-within:border-[#5e23dc] focus-within:ring-1 focus-within:ring-[#5e23dc]/20 transition-all">
                    <span className="material-symbols-outlined text-sm text-[#7a7487] flex-shrink-0">
                      {searchLoading ? 'sync' : 'search'}
                    </span>
                    <input
                      type="text"
                      placeholder="Search area, locality, city..."
                      value={areaSearch}
                      onChange={(e) => handleAreaSearchChange(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                    />
                    {areaSearch && (
                      <button onClick={() => { setAreaSearch(''); setAreaSuggestions([]); }} className="text-[#7a7487] hover:text-[#191c1e]">
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>

                  {/* Autocomplete suggestions */}
                  {areaSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#cbc3d8] rounded-xl shadow-lg z-10 overflow-hidden">
                      {areaSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => selectArea(s.display, s.area)}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#f2f4f6] transition-colors flex items-center gap-2 border-b border-[#eceef0] last:border-0"
                        >
                          <span className="material-symbols-outlined text-sm text-[#7a7487] flex-shrink-0">place</span>
                          <span className="font-medium text-[#191c1e] truncate">{s.display}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current location badge */}
                {city !== 'Detecting...' && city !== 'India' && (
                  <div className="flex items-center gap-2 bg-[#e8ddff] border border-[#cbc3d8] rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-sm text-[#5e23dc]">my_location</span>
                    <span className="text-xs font-bold text-[#4500b4] truncate">{city}</span>
                    <span className="ml-auto text-[10px] text-[#7a7487] font-semibold">Current</span>
                  </div>
                )}

                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="w-full bg-[#e8faf4] border border-[#16a373] text-[#006c47] hover:bg-[#16a373] hover:text-white transition-all py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-sm ${locating ? 'animate-spin' : ''}`}>
                    {locating ? 'sync' : 'gps_fixed'}
                  </span>
                  {locating ? 'Getting your location...' : 'Use My Current Location (GPS)'}
                </button>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider block">Popular Cities</span>
                  <div className="grid grid-cols-2 gap-1">
                    {['Bangalore', 'Delhi NCR', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Kolkata'].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c);
                          localStorage.setItem('Ziva_city', c);
                          localStorage.removeItem('Ziva_lat');
                          localStorage.removeItem('Ziva_lon');
                          setShowLocModal(false);
                        }}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          city === c
                            ? 'bg-[#5e23dc] text-white'
                            : 'text-[#494455] hover:bg-[#f2f4f6] hover:text-[#5e23dc]'
                          }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-semibold text-[#494455]">
          {userRole !== 'SERVICE_PROVIDER' && (
            <>
              <Link
                href="/properties?purpose=BUY"
                className={`transition-all py-1 border-b-2 font-bold ${
                  isTabActive('BUY')
                    ? 'text-[#5e23dc] border-[#5e23dc]'
                    : 'border-transparent hover:text-[#4500b4]'
                }`}
              >
                Buy
              </Link>
              <Link
                href="/properties?purpose=RENT"
                className={`transition-all py-1 border-b-2 font-bold ${
                  isTabActive('RENT')
                    ? 'text-[#5e23dc] border-[#5e23dc]'
                    : 'border-transparent hover:text-[#4500b4]'
                }`}
              >
                Rent
              </Link>
              <Link
                href="/sell"
                className={`transition-all py-1 border-b-2 font-bold ${
                  isTabActive('SELL')
                    ? 'text-[#5e23dc] border-[#5e23dc]'
                    : 'border-transparent hover:text-[#4500b4]'
                }`}
              >
                Sell
              </Link>
              <Link
                href="/properties?purpose=PG"
                className={`transition-all py-1 border-b-2 font-bold ${
                  isTabActive('PG')
                    ? 'text-[#5e23dc] border-[#5e23dc]'
                    : 'border-transparent hover:text-[#4500b4]'
                }`}
              >
                PG
              </Link>
              <Link
                href="/projects/p-prestige-falcon"
                className={`transition-all py-1 border-b-2 font-bold ${
                  isTabActive('NEW_PROJECTS')
                    ? 'text-[#5e23dc] border-[#5e23dc]'
                    : 'border-transparent hover:text-[#4500b4]'
                }`}
              >
                New Projects
              </Link>
            </>
          )}

          <Link
            href="/services"
            className={`transition-all py-1 border-b-2 font-bold ${
              isTabActive('SERVICES')
                ? 'text-[#5e23dc] border-[#5e23dc]'
                : 'border-transparent hover:text-[#4500b4]'
            }`}
          >
            Home Services
          </Link>

          {userRole === 'SERVICE_PROVIDER' && (
            <Link
              href="/become-professional/status"
              className={`transition-all py-1 border-b-2 font-bold ${
                pathname?.includes('become-professional')
                  ? 'text-[#5e23dc] border-[#5e23dc]'
                  : 'border-transparent hover:text-[#4500b4]'
              }`}
            >
              Verification Status
            </Link>
          )}
        </nav>

        {/* Header Actions & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {/* Join as Vendor: Only visible to Guests (not logged-in users) */}
          {!token && (
            <Link
              href="/become-professional/register"
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#006c47] bg-[#e8faf4] border border-[#16a373]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#16a373] hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-xs">handyman</span>
              Join as Vendor
            </Link>
          )}

          {/* Post Property: Only visible to Property Owners, Admins, or Guests (Hidden for pure Buyers/Renters and Service Vendors) */}
          {(!token || userRole === 'OWNER' || userRole === 'ADMIN') && (
            <Link
              href="/post-property"
              className="hidden sm:flex bg-[#5e23dc] hover:bg-[#4500b4] text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all shadow-sm items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Post Property</span>
            </Link>
          )}

          {/* Role-Specific Dashboard / Login Button */}
          {token ? (
            <div className="flex items-center gap-2">
              <Link
                href={getDashboardPath()}
                className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1 shadow-sm ${
                  userRole === 'ADMIN'
                    ? 'bg-[#191c1e] text-white hover:bg-black border border-[#3d3c3c]'
                    : userRole === 'SERVICE_PROVIDER'
                    ? 'bg-[#e8faf4] text-[#006c47] border border-[#16a373]/30 hover:bg-[#16a373] hover:text-white'
                    : 'bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {userRole === 'ADMIN' ? 'admin_panel_settings' : userRole === 'SERVICE_PROVIDER' ? 'construction' : 'account_circle'}
                </span>
                <span>
                  {userRole === 'ADMIN'
                    ? 'Admin Portal'
                    : userRole === 'SERVICE_PROVIDER'
                    ? 'Vendor Hub'
                    : userRole === 'AGENT'
                    ? 'Agent CRM'
                    : userRole === 'OWNER'
                    ? 'Owner Panel'
                    : 'Dashboard'}
                </span>
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem('Ziva_access');
                  localStorage.removeItem('Ziva_refresh');
                  setToken('');
                  setUserRole('');
                  router.push('/auth/login');
                }}
                title="Logout"
                className="hidden sm:flex text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden sm:flex border border-[#cbc3d8] text-[#191c1e] hover:bg-[#f2f4f6] px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#191c1e] bg-[#f2f4f6] hover:bg-[#e8ddff] transition-all border border-[#cbc3d8] flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-xl block">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* 📱 Mobile Slide-Out Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#cbc3d8] p-4 shadow-xl animate-in slide-in-from-top duration-200 space-y-4">
          {/* Quick Primary Actions in Mobile Drawer */}
          <div className="grid grid-cols-2 gap-2">
            {userRole !== 'SERVICE_PROVIDER' && (
              <Link
                href="/post-property"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#5e23dc] text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Post Property
              </Link>
            )}

            {token ? (
              <Link
                href={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                  userRole === 'SERVICE_PROVIDER' ? 'col-span-2 bg-[#e8faf4] text-[#006c47] border-[#16a373]' : 'bg-[#e8ddff] text-[#4500b4] border-[#5e23dc]/30'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {userRole === 'ADMIN' ? 'admin_panel_settings' : userRole === 'SERVICE_PROVIDER' ? 'construction' : 'account_circle'}
                </span>
                {userRole === 'ADMIN' ? 'Admin Portal' : userRole === 'SERVICE_PROVIDER' ? 'Vendor Hub & Status' : 'My Dashboard'}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="border border-[#cbc3d8] text-[#191c1e] bg-[#f8f9fb] p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                Login / Sign Up
              </Link>
            )}
          </div>

          <div className="text-[11px] font-bold text-[#7a7487] uppercase tracking-wider px-1 border-t border-[#eceef0] pt-3">Navigation Menu</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {userRole !== 'SERVICE_PROVIDER' && (
              <>
                <Link
                  href="/properties?purpose=BUY"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                    isTabActive('BUY')
                      ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                      : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">home</span>
                  Buy Properties
                </Link>

                <Link
                  href="/properties?purpose=RENT"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                    isTabActive('RENT')
                      ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                      : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                  Rent Homes
                </Link>

                <Link
                  href="/sell"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                    isTabActive('SELL')
                      ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                      : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">sell</span>
                  Sell Property
                </Link>

                <Link
                  href="/properties?purpose=PG"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                    isTabActive('PG')
                      ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                      : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">apartment</span>
                  PG & Hostels
                </Link>
              </>
            )}

            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                isTabActive('SERVICES')
                  ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                  : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">construction</span>
              Home Services
            </Link>

            {userRole === 'SERVICE_PROVIDER' && (
              <Link
                href="/become-professional/status"
                onClick={() => setMobileMenuOpen(false)}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                  pathname?.includes('become-professional')
                    ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                    : 'bg-[#f8f9fb] text-[#191c1e] border-[#cbc3d8]/50 hover:bg-[#e8ddff]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Verification Status
              </Link>
            )}
          </div>

          {(!token || userRole === 'CUSTOMER') && (
            <div className="pt-2 border-t border-[#eceef0] flex flex-col gap-2">
              <Link
                href="/become-professional/register"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#e8faf4] border border-[#16a373] text-[#006c47] p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#16a373] hover:text-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">handyman</span>
                Join as Ziva Vendor / Professional
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
