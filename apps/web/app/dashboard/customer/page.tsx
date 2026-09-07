'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PropertyPhoto {
  url: string;
}

interface Counterparty {
  id: string;
  firstName: string;
}

interface LastMessage {
  contentSanitized: string;
  createdAt: string;
}

interface Lead {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    locality: string;
    purpose: string;
    photos: PropertyPhoto[];
  };
  counterparty?: Counterparty;
  lastMessage?: LastMessage | null;
  messageCount: number;
}

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    locality: string;
    photos: PropertyPhoto[];
  };
}

interface MyProperty {
  id: string;
  title: string;
  purpose: string;
  propertyType: string;
  status: string;
  locality: string;
  city: string;
  bhk?: number | null;
  expectedPrice?: number | null;
  monthlyRent?: number | null;
  viewCount: number;
  enquiryCount: number;
  isZivaVerified?: boolean;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  photos: PropertyPhoto[];
}

type Tab = 'dashboard' | 'saved' | 'enquiries' | 'visits' | 'services';

export default function CustomerDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; firstName: string; role: string } | null>(null);

  // Dashboard Tab state & Mobile menu state
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication & session validation
  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      setUser({ id: payload.sub, firstName: payload.firstName || 'Buyer', role: payload.role });
      fetchDashboardData(token);
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Fetch Leads (Enquiries)
      const leadsRes = await fetch(`${apiBase}/api/v1/leads?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leadsJson = await leadsRes.json();

      // Fetch Visits
      const visitsRes = await fetch(`${apiBase}/api/v1/visits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const visitsJson = await visitsRes.json();

      // Fetch Service Bookings
      const bookingsRes = await fetch(`${apiBase}/api/v1/services/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bookingsJson = await bookingsRes.json();

      if (leadsRes.ok) {
        setLeads(leadsJson.data?.leads || leadsJson.leads || []);
      }
      if (visitsRes.ok) {
        setVisits(visitsJson.data || visitsJson || []);
      }
      if (bookingsRes.ok) {
        setServiceBookings(bookingsJson.data || bookingsJson || []);
      }

      // Initialize saved count
      const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
      setSavedCount(saved.length);
    } catch {
      setError('Failed to fetch dashboard data. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProperties();
  }, [activeTab]);

  const fetchSavedProperties = async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
      if (!Array.isArray(saved) || saved.length === 0) {
        setSavedProperties([]);
        setSavedCount(0);
        return;
      }
      setSavedCount(saved.length);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const promises = saved.map(async (item: any) => {
        const id = typeof item === 'string' ? item : item?.id;
        if (!id) return null;
        try {
          const res = await fetch(`${apiBase}/api/v1/properties/${id}`);
          if (res.ok) {
            const json = await res.json();
            return json.data || json;
          }
        } catch {}
        // Fallback to cached item object if already stored with details
        if (typeof item === 'object' && item?.title) {
          return item;
        }
        return null;
      });

      const results = await Promise.all(promises);
      setSavedProperties(results.filter(Boolean));
    } catch (err) {
      console.warn('Error fetching saved properties', err);
    }
  };

  const removeSavedProperty = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
      const updated = saved.filter((item: any) => (typeof item === 'string' ? item !== propertyId : item?.id !== propertyId));
      localStorage.setItem('Ziva_saved_properties', JSON.stringify(updated));
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setSavedCount(updated.length);
    } catch (err) {
      console.error('Failed to remove saved property', err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('Ziva_access');
    localStorage.removeItem('Ziva_refresh');
    router.push('/auth/login');
  };

  // Safe user initials helper
  const getInitials = () => {
    if (!user) return 'JD';
    return user.firstName.substring(0, 2).toUpperCase();
  };

  const sidebarLinks = [
    { icon: 'dashboard', label: 'Buyer Dashboard', key: 'dashboard' as Tab },
    { icon: 'bookmark', label: 'Saved & Shortlist', key: 'saved' as Tab, count: savedCount },
    { icon: 'forum', label: 'My Enquiries & Chats', key: 'enquiries' as Tab, count: leads.length },
    { icon: 'event', label: 'Scheduled Visits', key: 'visits' as Tab, count: visits.length },
    { icon: 'home_repair_service', label: 'Home Services', key: 'services' as Tab, count: serviceBookings.length },
  ];

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center font-[Rubik] antialiased">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#494455] font-medium text-sm">Loading buyer dashboard activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex relative overflow-x-hidden font-[Rubik] antialiased selection:bg-[#5e23dc] selection:text-white">

      {/* ── Sidebar (Desktop View) ── */}
      <nav className="h-screen w-64 fixed left-0 top-0 bg-[#f2f4f6] border-r border-[#cbc3d8] z-40 hidden md:flex flex-col shrink-0">

        {/* Pinned Header */}
        <div className="p-5 pb-0 flex-shrink-0">
          {/* Brand Header */}
          <div className="mb-4 mt-2">
            <Link href="/" className="font-bold text-[20px] text-[#4500b4] tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold shadow-sm">J</span>
              Ziva Housing
            </Link>
          </div>

          {/* User Card */}
          <div className="flex items-center space-x-3 mb-3 p-4 bg-white rounded-xl border border-[#cbc3d8]/50 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#e8ddff] text-[#4500b4] flex items-center justify-center font-bold text-sm shadow-inner">
              {getInitials()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#7a7487]">Logged in as Buyer,</p>
              <p className="text-sm font-bold text-[#191c1e] truncate max-w-[130px]">{user?.firstName}</p>
            </div>
          </div>

          {/* Direct Search / Buy CTA Buttons */}
          <div className="space-y-2 mb-3">
            <Link
              href="/buy"
              className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Buy Properties
            </Link>
            <Link
              href="/properties"
              className="w-full bg-white hover:bg-[#e8ddff]/50 text-[#5e23dc] border border-[#cbc3d8] py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Explore All Listings
            </Link>
          </div>
        </div>

        {/* Scrollable middle nav */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-1">
          <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-widest pl-2 mb-1 block">Activity Dashboard</span>
          {sidebarLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => {
                setActiveTab(link.key);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all w-full ${activeTab === link.key
                  ? 'bg-[#e8ddff] text-[#4500b4] scale-95 shadow-sm'
                  : 'text-[#494455] hover:bg-white hover:text-[#5e23dc]'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">{link.icon}</span>
                <span>{link.label}</span>
              </div>
              {link.count !== undefined && link.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === link.key ? 'bg-[#5e23dc] text-white' : 'bg-[#e8ddff] text-[#4500b4]'
                  }`}>
                  {link.count}
                </span>
              )}
            </button>
          ))}

          <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-widest pl-2 mt-4 mb-1 block">External Tools</span>
          <Link
            href="/properties"
            className="flex items-center justify-between px-4 py-3 text-[#494455] hover:bg-white hover:text-[#5e23dc] rounded-xl text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base">person_search</span>
              <span>Browse Houses</span>
            </div>
            <span className="material-symbols-outlined text-xs text-[#7a7487]">open_in_new</span>
          </Link>
          <Link
            href="/services"
            className="flex items-center justify-between px-4 py-3 text-[#494455] hover:bg-white hover:text-[#5e23dc] rounded-xl text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-base">build</span>
              <span>Home Services</span>
            </div>
            <span className="material-symbols-outlined text-xs text-[#7a7487]">open_in_new</span>
          </Link>
        </div>

        {/* Pinned footer — always visible */}
        <div className="flex-shrink-0 border-t border-[#cbc3d8] px-5 py-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all rounded-xl text-xs font-bold w-full text-left"
          >
            <span className="material-symbols-outlined text-sm text-[#ba1a1a]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer Content */}
          <nav className="relative w-64 bg-[#f2f4f6] h-full flex flex-col p-5 space-y-2 border-r border-[#cbc3d8] animate-in slide-in-from-left duration-200">
            <div className="mb-6 mt-2 flex justify-between items-center">
              <Link href="/" className="font-bold text-[18px] text-[#4500b4] tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-sm font-bold">J</span>
                Ziva Housing
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#7a7487] hover:text-[#191c1e]">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-6 p-4 bg-white rounded-xl border border-[#cbc3d8]/50 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#e8ddff] text-[#4500b4] flex items-center justify-center font-bold text-xs">
                {getInitials()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#7a7487]">Welcome back,</p>
                <p className="text-xs font-bold text-[#191c1e] truncate max-w-[120px]">{user?.firstName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-grow">
              <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-widest pl-2 mb-1 block">Activity Dashboard</span>
              {sidebarLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => {
                    setActiveTab(link.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === link.key
                      ? 'bg-[#e8ddff] text-[#4500b4] scale-95 shadow-sm'
                      : 'text-[#494455] hover:bg-white hover:text-[#5e23dc]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </div>
                  {link.count !== undefined && link.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === link.key ? 'bg-[#5e23dc] text-white' : 'bg-[#e8ddff] text-[#4500b4]'
                      }`}>
                      {link.count}
                    </span>
                  )}
                </button>
              ))}

              <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-widest pl-2 mt-4 mb-1 block">External Tools</span>
              <Link
                href="/properties"
                className="flex items-center justify-between px-4 py-3 text-[#494455] hover:bg-white hover:text-[#5e23dc] rounded-xl text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">person_search</span>
                  <span>Browse Houses</span>
                </div>
                <span className="material-symbols-outlined text-xs text-[#7a7487]">open_in_new</span>
              </Link>
              <Link
                href="/services"
                className="flex items-center justify-between px-4 py-3 text-[#494455] hover:bg-white hover:text-[#5e23dc] rounded-xl text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">build</span>
                  <span>Home Services</span>
                </div>
                <span className="material-symbols-outlined text-xs text-[#7a7487]">open_in_new</span>
              </Link>
            </div>

            <div className="mt-auto border-t border-[#cbc3d8] pt-4">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all rounded-xl text-xs font-bold w-full text-left"
              >
                <span className="material-symbols-outlined text-sm text-[#ba1a1a]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Main Canvas ── */}
      <main className="flex-grow md:ml-64 min-h-screen flex flex-col bg-[#f8f9fb]">

        {/* Mobile Header Bar */}
        <header className="md:hidden flex justify-between items-center h-16 px-4 bg-[#f2f4f6] border-b border-[#cbc3d8] sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="text-[#494455] hover:text-[#191c1e] p-1 rounded-lg">
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <span className="font-bold text-md text-[#4500b4] flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-xs font-bold">J</span>
              Ziva Dashboard
            </span>
          </div>
          <button onClick={handleSignOut} className="text-[#ba1a1a] hover:text-[#ba1a1a]/80 p-1 rounded-lg">
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-6 md:p-10 max-w-[1280px] mx-auto w-full space-y-8 flex-grow">

          {/* Header Description Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#cbc3d8]/50 pb-4">
            <div>
              <h2 className="text-[24px] md:text-[32px] leading-[32px] md:leading-[40px] font-bold text-[#191c1e]">
                {activeTab === 'dashboard' && 'Buyer / Renter Dashboard'}
                {activeTab === 'saved' && 'Saved & Shortlisted Properties'}
                {activeTab === 'enquiries' && 'My Active Enquiries'}
                {activeTab === 'visits' && 'Scheduled Property Visits'}
                {activeTab === 'services' && 'Home Service Bookings'}
              </h2>
              <p className="text-sm text-[#494455] mt-1">
                {activeTab === 'dashboard' && 'Explore verified properties, track shortlisted homes, manage enquiries, and view visit schedules.'}
                {activeTab === 'saved' && 'Review the properties you marked to quickly connect with owners or book visits.'}
                {activeTab === 'enquiries' && 'Engage with property owners and view details of your ongoing property requests.'}
                {activeTab === 'visits' && 'View accepted and pending site visits for your selected properties.'}
                {activeTab === 'services' && 'Track requested repair, cleaning, and maintenance tasks.'}
              </p>
            </div>
            {error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] px-4 py-2 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}
          </div>

          {/* ───────────────── TAB 1: OVERVIEW DASHBOARD ───────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">

              {/* Dynamic Explore & Search Banner */}
              <div className="bg-gradient-to-r from-[#5e23dc] via-[#4500b4] to-[#2b007a] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl z-10">
                  <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                    Verified Buyer Hub
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Find Your Dream Home with 100% Verified Legal Papers
                  </h3>
                  <p className="text-xs md:text-sm text-[#e8ddff] leading-relaxed">
                    Zero spam, zero fake listings. Direct interaction with verified property owners and instant site visit booking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 z-10 shrink-0">
                  <Link
                    href="/buy"
                    className="bg-white text-[#4500b4] hover:bg-[#f2f4f6] px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">home</span>
                    Buy Home
                  </Link>
                  <Link
                    href="/properties?purpose=RENT"
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-2.5 rounded-xl text-xs font-bold transition backdrop-blur-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">apartment</span>
                    Rent House
                  </Link>
                  <Link
                    href="/properties?purpose=PG"
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-2.5 rounded-xl text-xs font-bold transition backdrop-blur-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">bed</span>
                    PG & Co-Living
                  </Link>
                </div>
              </div>

              {/* Summary Bento Grid (Interactive cards to switch tabs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Card: Saved Properties */}
                <button
                  onClick={() => setActiveTab('saved')}
                  className="bg-white p-5 rounded-2xl border border-[#cbc3d8]/50 hover:border-[#5e23dc]/40 transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-gray-400">
                    <span className="material-symbols-outlined text-8xl">bookmark</span>
                  </div>
                  <div className="flex justify-between items-start z-10 w-full">
                    <p className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider">Saved Properties</p>
                    <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-1.5 rounded-full text-sm">bookmark</span>
                  </div>
                  <p className="text-3xl font-bold text-[#4500b4] z-10">{savedCount}</p>
                </button>

                {/* Card: My Enquiries */}
                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="bg-white p-5 rounded-2xl border border-[#cbc3d8]/50 hover:border-[#5e23dc]/40 transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-gray-400">
                    <span className="material-symbols-outlined text-8xl">forum</span>
                  </div>
                  <div className="flex justify-between items-start z-10 w-full">
                    <p className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider">My Enquiries</p>
                    <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-1.5 rounded-full text-sm">forum</span>
                  </div>
                  <p className="text-3xl font-bold text-[#4500b4] z-10">{leads.length}</p>
                </button>

                {/* Card: Scheduled Visits */}
                <button
                  onClick={() => setActiveTab('visits')}
                  className="bg-white p-5 rounded-2xl border border-[#cbc3d8]/50 hover:border-[#5e23dc]/40 transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-gray-400">
                    <span className="material-symbols-outlined text-8xl">event</span>
                  </div>
                  <div className="flex justify-between items-start z-10 w-full">
                    <p className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider">Scheduled Visits</p>
                    <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-1.5 rounded-full text-sm">event</span>
                  </div>
                  <p className="text-3xl font-bold text-[#4500b4] z-10">{visits.length}</p>
                </button>

                {/* Card: Service Bookings */}
                <button
                  onClick={() => setActiveTab('services')}
                  className="bg-white p-5 rounded-2xl border border-[#cbc3d8]/50 hover:border-[#5e23dc]/40 transition-all text-left flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md cursor-pointer"
                >
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-gray-400">
                    <span className="material-symbols-outlined text-8xl">home_repair_service</span>
                  </div>
                  <div className="flex justify-between items-start z-10 w-full">
                    <p className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider">Service Bookings</p>
                    <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-1.5 rounded-full text-sm">home_repair_service</span>
                  </div>
                  <p className="text-3xl font-bold text-[#4500b4] z-10">{serviceBookings.length}</p>
                </button>
              </div>

              {/* Bento Dashboard Sub-sections */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Enquiries mini-list (8 columns) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-end border-b border-[#cbc3d8]/50 pb-2">
                    <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#5e23dc]">forum</span>
                      Recent Active Enquiries
                    </h3>
                    <button
                      onClick={() => setActiveTab('enquiries')}
                      className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5"
                    >
                      View All ({leads.length}) <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>

                  {leads.length === 0 ? (
                    <div className="bg-white p-10 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-3 shadow-sm">
                      <span className="material-symbols-outlined text-[#7a7487] text-3xl">chat_bubble_outline</span>
                      <p className="text-xs font-bold text-[#7a7487]">No active enquiries yet.</p>
                      <Link href="/properties" className="text-xs font-bold text-[#5e23dc] hover:underline block">Explore properties to make enquiries</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {leads.slice(0, 4).map((lead) => {
                        const hasPhoto = lead.property?.photos?.[0]?.url;
                        return (
                          <div key={lead.id} className="bg-white rounded-2xl border border-[#cbc3d8]/50 overflow-hidden flex flex-col justify-between hover:border-[#5e23dc]/40 transition-all hover:shadow-md">
                            <div className="p-4 flex gap-3">
                              <div className="w-14 h-14 rounded-xl bg-[#f2f4f6] overflow-hidden shrink-0">
                                {hasPhoto ? (
                                  <img src={lead.property.photos[0]?.url || ''} alt="Property" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7a7487] bg-[#f2f4f6]">No Image</div>
                                )}
                              </div>
                              <div className="flex-grow min-w-0">
                                <span className="inline-block bg-[#e8ddff] text-[#4500b4] text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">
                                  {lead.id}
                                </span>
                                <h4 className="text-xs font-bold text-[#191c1e] truncate">{lead.property?.title}</h4>
                                <p className="text-[10px] text-[#494455] flex items-center gap-0.5 mt-0.5 truncate">
                                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                                  {lead.property?.locality}, {lead.property?.city}
                                </p>
                              </div>
                            </div>

                            <div className="bg-[#f2f4f6] px-4 py-2.5 border-t border-[#cbc3d8]/50 flex justify-between items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${['NEW', 'VISIT_SCHEDULED', 'NEGOTIATION'].includes(lead.status)
                                  ? 'bg-[#e8ddff] text-[#4500b4]'
                                  : 'bg-[#e8faf4] text-[#16a373]'
                                }`}>
                                {lead.status.replace('_', ' ')}
                              </span>
                              <button
                                onClick={() => router.push(`/chat/${lead.id}`)}
                                className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                              >
                                <span className="material-symbols-outlined text-xs">chat</span>
                                Chat
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Visits mini-list (4 columns) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex justify-between items-end border-b border-[#cbc3d8]/50 pb-2">
                    <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#5e23dc]">event</span>
                      Upcoming Visits
                    </h3>
                    <button
                      onClick={() => setActiveTab('visits')}
                      className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5"
                    >
                      View All ({visits.length}) <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>

                  {visits.length === 0 ? (
                    <div className="bg-white p-10 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-3 shadow-sm">
                      <span className="material-symbols-outlined text-[#7a7487] text-3xl">event_busy</span>
                      <p className="text-xs font-bold text-[#7a7487]">No visits scheduled.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-[#cbc3d8]/50 divide-y divide-[#cbc3d8]/50 overflow-hidden shadow-sm">
                      {visits.slice(0, 3).map((visit) => {
                        const visitDate = new Date(visit.scheduledAt);
                        return (
                          <div key={visit.id} className="p-4 space-y-2">
                            <h4 className="text-xs font-bold text-[#191c1e] truncate">{visit.property?.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-[#494455]">
                              <span className="flex items-center gap-1 font-semibold text-[#191c1e]">
                                <span className="material-symbols-outlined text-xs text-[#5e23dc]">calendar_today</span>
                                {visitDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-[#191c1e]">
                                <span className="material-symbols-outlined text-xs text-[#5e23dc]">schedule</span>
                                {visitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${visit.status === 'ACCEPTED' ? 'bg-[#e8faf4] text-[#16a373]' :
                                  visit.status === 'REQUESTED' ? 'bg-[#e8ddff] text-[#4500b4]' : 'bg-[#ffdad6] text-[#ba1a1a]'
                                }`}>
                                {visit.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}



          {/* ───────────────── TAB 2: MY ENQUIRIES ───────────────── */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6">
              {leads.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-[#7a7487] text-4xl">chat_bubble_outline</span>
                  <p className="text-sm font-semibold text-[#7a7487]">No enquiries found.</p>
                  <p className="text-xs text-[#7a7487]/75">Click "Browse Houses" in the sidebar to search listings and connect with sellers.</p>
                  <Link href="/properties" className="inline-block bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                    Search Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leads.map((lead) => {
                    const hasPhoto = lead.property?.photos?.[0]?.url;
                    return (
                      <div key={lead.id} className="bg-white rounded-2xl border border-[#cbc3d8]/50 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#5e23dc]/40 transition-all">
                        <div className="p-5 flex gap-4">
                          <div className="w-16 h-16 rounded-xl bg-[#f2f4f6] overflow-hidden shrink-0">
                            {hasPhoto ? (
                              <img src={lead.property.photos[0]?.url || ''} alt="Property" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-[#7a7487] bg-[#f2f4f6]">No Image</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block bg-[#e8ddff] text-[#4500b4] text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">
                              {lead.id}
                            </span>
                            <h4 className="text-sm font-semibold text-[#191c1e] truncate">{lead.property?.title}</h4>
                            <p className="text-xs text-[#494455] flex items-center gap-0.5 mt-0.5">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {lead.property?.locality}, {lead.property?.city}
                            </p>
                            <p className="text-xs text-[#494455] mt-2 font-medium">
                              Seller: <span className="text-[#5e23dc] font-bold">{lead.counterparty?.firstName || 'Owner'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${lead.status === 'NEW' ? 'bg-[#e8ddff] text-[#4500b4]' :
                                lead.status === 'CONTACTED' ? 'bg-amber-100 text-amber-800' :
                                  lead.status === 'VISIT_SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                                    lead.status === 'NEGOTIATION' ? 'bg-indigo-100 text-indigo-800' :
                                      lead.status === 'BOOKING' ? 'bg-[#e8faf4] text-[#16a373]' :
                                        'bg-gray-100 text-gray-800'
                              }`}>
                              {lead.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Chat snippet */}
                        <div className="bg-[#f2f4f6] px-5 py-3 border-t border-[#cbc3d8]/50 flex justify-between items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#494455] italic truncate">
                              {lead.lastMessage ? `"${lead.lastMessage.contentSanitized}"` : 'No messages yet'}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/chat/${lead.id}`)}
                            className="bg-[#5e23dc] hover:bg-[#4500b4] text-white border border-transparent text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            Open Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TAB 3: SCHEDULED VISITS ───────────────── */}
          {activeTab === 'visits' && (
            <div className="space-y-6">
              {visits.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-[#7a7487] text-4xl">event_busy</span>
                  <p className="text-sm font-semibold text-[#7a7487]">No scheduled visits yet.</p>
                  <p className="text-xs text-[#7a7487]/75">When an owner accepts your visit request, it will display here.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#cbc3d8]/50 overflow-hidden divide-y divide-[#cbc3d8]/50 shadow-sm">
                  {visits.map((visit) => {
                    const visitDate = new Date(visit.scheduledAt);
                    return (
                      <div key={visit.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#f2f4f6]/30 transition-colors">
                        <div className="flex gap-4 items-center">
                          <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-3 rounded-full shrink-0">
                            calendar_month
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-[#191c1e]">{visit.property?.title}</h4>
                            <p className="text-xs text-[#494455] mt-0.5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {visit.property?.locality}, {visit.property?.city}
                            </p>
                            {visit.notes && (
                              <p className="text-[11px] text-[#494455]/85 mt-2 bg-[#f2f4f6] px-3 py-1.5 rounded-lg border border-[#cbc3d8]/20 inline-block">
                                <span className="font-semibold text-[#191c1e]">Notes:</span> {visit.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#5e23dc]">
                              {visitDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-xs text-[#494455] font-medium">
                              {visitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${visit.status === 'REQUESTED' ? 'bg-[#e8ddff] text-[#4500b4]' :
                              visit.status === 'ACCEPTED' ? 'bg-[#e8faf4] text-[#16a373]' :
                                visit.status === 'REJECTED' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TAB 4: SAVED PROPERTIES ───────────────── */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              {savedProperties.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-[#7a7487] text-4xl">bookmark_border</span>
                  <p className="text-sm font-semibold text-[#7a7487]">No saved properties yet.</p>
                  <p className="text-xs text-[#7a7487]/75">Click on the bookmark icon on any property page to save it for quick access.</p>
                  <Link href="/properties" className="inline-block bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                    Explore Houses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProperties.map((prop) => {
                    const priceVal = prop.purpose === 'RENT' ? (prop.monthlyRent || 0) : (prop.expectedPrice || 0);
                    const priceDisplay = prop.purpose === 'RENT'
                      ? `₹ ${Number(priceVal).toLocaleString('en-IN')}`
                      : `₹ ${Number(priceVal) >= 10000000
                        ? `${(Number(priceVal) / 10000000).toFixed(2)} Cr`
                        : `${(Number(priceVal) / 100000).toFixed(0)} Lakhs`}`;

                    return (
                      <div
                        key={prop.id}
                        onClick={() => router.push(`/properties/${prop.id}`)}
                        className="bg-white rounded-2xl overflow-hidden border border-[#cbc3d8] hover:border-[#5e23dc] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-44 relative overflow-hidden bg-[#f2f4f6]">
                            <img
                              src={prop.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80'}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => removeSavedProperty(prop.id, e)}
                              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-red-500 shadow-md hover:scale-110 transition-all z-10"
                              title="Remove from saved"
                            >
                              <span className="material-symbols-outlined text-sm font-fill">favorite</span>
                            </button>
                          </div>
                          <div className="p-4 space-y-2">
                            <span className="text-lg font-extrabold text-[#5e23dc]">
                              {priceDisplay}{prop.purpose === 'RENT' ? '/mo' : ''}
                            </span>
                            <h4 className="font-bold text-sm text-[#191c1e] truncate group-hover:text-[#4500b4] transition-colors">
                              {prop.title}
                            </h4>
                            <p className="text-[10px] text-[#7a7487] flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#7a7487]">location_on</span>
                              {prop.locality}, {prop.city}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 py-3 border-t border-[#eceef0] bg-[#f8f9fb] flex justify-between text-[10px] font-bold text-[#494455]">
                          <span>{prop.bhk ? `${prop.bhk} BHK` : '3 BHK'}</span>
                          <span>{prop.builtUpArea ? `${Number(prop.builtUpArea).toLocaleString()} sqft` : '1,500 sqft'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────── TAB 5: SERVICE BOOKINGS ───────────────── */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {serviceBookings.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[#cbc3d8]/50 space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-[#7a7487] text-4xl">home_repair_service</span>
                  <p className="text-sm font-semibold text-[#7a7487]">No service bookings yet.</p>
                  <p className="text-xs text-[#7a7487]/75">Book verified professionals for cleaning, repair, and setups with Ziva Guarantee.</p>
                  <Link href="/services" className="inline-block bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                    Book a Service
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#cbc3d8]/50 overflow-hidden divide-y divide-[#cbc3d8]/50 shadow-sm">
                  {serviceBookings.map((booking) => {
                    const scheduledDate = new Date(booking.scheduledAt);
                    return (
                      <div key={booking.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#f2f4f6]/30 transition-colors">
                        <div className="flex gap-4 items-center">
                          <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-3 rounded-full shrink-0">
                            build
                          </span>
                          <div>
                            <span className="inline-block bg-[#5e23dc]/10 text-[#5e23dc] text-[9px] font-bold px-2 py-0.5 rounded-full mb-1">
                              {booking.bookingRef}
                            </span>
                            <h4 className="text-sm font-semibold text-[#191c1e]">
                              {booking.service?.name || 'Home Service'}
                            </h4>
                            <p className="text-xs text-[#494455] mt-0.5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {booking.address}, {booking.city}
                            </p>
                            {booking.serviceProvider && (
                              <p className="text-xs text-[#494455] mt-2 font-medium">
                                Professional: <span className="text-[#16a373] font-bold">{booking.serviceProvider.user?.firstName || 'Assigned'}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#5e23dc]">
                              {scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-xs text-[#494455] font-medium">
                              {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#006c47]">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${booking.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                booking.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                  booking.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                                    booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                      'bg-gray-100 text-gray-800'
                              }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
