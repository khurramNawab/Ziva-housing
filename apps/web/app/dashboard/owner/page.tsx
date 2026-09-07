'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationCenter from '../../../components/NotificationCenter';

interface PropertyPhoto {
  url: string;
}

interface OwnerProfile {
  id: string;
  isVerified: boolean;
}

interface Property {
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
  adminNotes?: string | null;
  rejectionReason?: string | null;
  photos: PropertyPhoto[];
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
  };
  counterparty?: Counterparty;
  lastMessage?: LastMessage | null;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; firstName: string; role: string } | null>(null);

  // Authentication & session validation
  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (payload.role !== 'OWNER') {
        if (payload.role === 'CUSTOMER') router.push('/dashboard/customer');
        else if (payload.role === 'ADMIN') router.push('/admin');
        else router.push(`/dashboard/${payload.role.toLowerCase()}`);
        return;
      }
      setUser({ id: payload.sub, firstName: payload.firstName || 'Owner', role: payload.role });
      fetchDashboardData(token);
    } catch (err) {
      router.push('/auth/login');
    }
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Fetch Owner Listings
      const propRes = await fetch(`${apiBase}/api/v1/properties/my/listings?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const propJson = await propRes.json();

      // Fetch received leads
      const leadsRes = await fetch(`${apiBase}/api/v1/leads?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leadsJson = await leadsRes.json();

      if (propRes.ok) {
        setProperties(propJson.data?.properties || propJson.properties || []);
      }
      if (leadsRes.ok) {
        setLeads(leadsJson.data?.leads || leadsJson.leads || []);
      }
    } catch (err) {
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  // Submit property for admin review
  const handleSubmitForReview = async (propertyId: string) => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/properties/${propertyId}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Submission failed');
      }

      // Update state local listing status
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'PENDING_REVIEW' } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to submit property for review.');
    }
  };

  // Soft delete / Archive property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete/archive this property listing?')) return;

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Deletion failed');
      }

      // Remove from listings state
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('Ziva_access');
    localStorage.removeItem('Ziva_refresh');
    router.push('/auth/login');
  };

  // Stats summaries
  const totalListings = properties.length;
  const activeLeadsCount = leads.length;
  const totalViews = properties.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#586060] font-medium text-sm">Loading owner dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] min-h-screen flex flex-col font-sans">
      {/* TopNavBar */}
      <header className="bg-white border-b border-[#bfc8c8] font-medium sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center h-20 px-6 md:px-12 max-w-container-max mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-xl text-[#5e23dc] tracking-tight">
              Ziva Housing
            </Link>
            <span className="bg-[#e8ddff] text-[#4500b4] text-[10px] font-bold px-2 py-0.5 rounded-full">
              OWNER PORTAL
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#586060]">Hello, {user?.firstName}</span>
            <NotificationCenter />
            <button
              onClick={handleSignOut}
              className="border border-[#bfc8c8] hover:bg-[#f6f3f2] px-4 py-2 rounded-full text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-container-max w-full mx-auto px-6 md:px-12 py-8 grid grid-cols-12 gap-8">
        {/* Listings Section (8 columns) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          <div className="flex justify-between items-end border-b border-[#bfc8c8]/50 pb-4">
            <div>
              <h1 className="text-xl font-bold text-[#5e23dc]">Owner Dashboard</h1>
              <p className="text-xs text-[#586060] mt-1">Manage listings and view leads on your properties.</p>
            </div>
            <button
              onClick={() => router.push('/post-property')}
              className="bg-[#5e23dc] text-white hover:bg-[#4500b4] px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add New Property
            </button>
          </div>

          {/* Stats Summary Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bfc8c8]/30 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#586060] uppercase tracking-wider">Total Listings</span>
              <span className="text-2xl font-bold text-[#5e23dc]">{totalListings}</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bfc8c8]/30 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#586060] uppercase tracking-wider">Active Leads</span>
              <span className="text-2xl font-bold text-[#5e23dc]">{activeLeadsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#bfc8c8]/30 flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#586060] uppercase tracking-wider">Total Views</span>
              <span className="text-2xl font-bold text-[#5e23dc]">{totalViews}</span>
            </div>
          </div>

          {/* Listings Card Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#cbc3d8]/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#cbc3d8]/40 flex justify-between items-center bg-[#f8f9fb]">
              <div>
                <h2 className="text-base font-bold text-[#191c1e]">My Property Portfolio</h2>
                <p className="text-xs text-[#7a7487]">Track moderation, verification progress, and buyer visibility</p>
              </div>
              <span className="text-xs font-bold bg-[#e8ddff] text-[#4500b4] px-3 py-1 rounded-full shadow-sm">
                {properties.length} Properties
              </span>
            </div>

            {properties.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <span className="material-symbols-outlined text-5xl text-[#7a7487]">home_work</span>
                <div>
                  <p className="text-base font-bold text-[#191c1e]">No properties listed yet.</p>
                  <p className="text-xs text-[#7a7487] max-w-sm mx-auto mt-1">
                    Post your apartment, villa, or PG to start receiving verified buyer and tenant inquiries.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/post-property')}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span> Post Your First Property
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#cbc3d8]/40">
                {properties.map((prop) => {
                  const hasPhoto = prop.photos?.[0]?.url;
                  const isLive = prop.status === 'ACTIVE';
                  const isPending = prop.status === 'PENDING_REVIEW' || prop.status === 'DRAFT';
                  const isRejected = prop.status === 'REJECTED';

                  return (
                    <div key={prop.id} className="p-6 hover:bg-[#f8f9fb]/60 transition-all space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Property Basic Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-[#f2f4f6] overflow-hidden shrink-0 border border-[#cbc3d8]/40">
                            {hasPhoto ? (
                              <img src={prop.photos[0]?.url || ''} alt="Listing" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#f2f4f6] text-[10px] text-[#7a7487] font-bold">No Photo</div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/5 text-[#191c1e]">
                                {prop.purpose === 'SELL' ? 'For Sale' : 'For Rent'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e8ddff] text-[#4500b4]">
                                {prop.propertyType}
                              </span>
                              {prop.bhk && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#f2f4f6] text-[#494455]">
                                  {prop.bhk} BHK
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-[#191c1e] mt-1 line-clamp-1">{prop.title}</h3>
                            <p className="text-xs text-[#7a7487] flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs text-[#5e23dc]">location_on</span>
                              {prop.locality}, {prop.city}
                            </p>
                          </div>
                        </div>

                        {/* Price & Quick Stats */}
                        <div className="flex items-center gap-6 self-end md:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-[#7a7487] font-semibold block">Expected Value</span>
                            <span className="text-sm font-bold text-[#5e23dc]">
                              ₹ {prop.purpose === 'SELL'
                                ? Number(prop.expectedPrice || 0).toLocaleString('en-IN')
                                : `${Number(prop.monthlyRent || prop.expectedPrice || 0).toLocaleString('en-IN')}/mo`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-center px-3 py-1 bg-[#f2f4f6] rounded-lg">
                              <span className="text-[9px] text-[#7a7487] block font-bold">Views</span>
                              <span className="text-xs font-bold text-[#191c1e]">{prop.viewCount || 0}</span>
                            </div>
                            <div className="text-center px-3 py-1 bg-[#e8ddff]/50 rounded-lg">
                              <span className="text-[9px] text-[#4500b4] block font-bold">Leads</span>
                              <span className="text-xs font-bold text-[#5e23dc]">{prop.enquiryCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3-Stage Verification Tracker Stepper */}
                      <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#cbc3d8]/40 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-[#191c1e]">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#5e23dc]">verified_user</span>
                            Ziva Moderation & Verification Pipeline
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            isLive ? 'bg-emerald-100 text-emerald-800' :
                            isPending ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {isLive ? '✓ LIVE ON BUYER SEARCH' : isPending ? '⏳ VERIFICATION IN PROGRESS' : '⚠️ REVISION NEEDED'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {/* Step 1: Details & Docs Submitted */}
                          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-emerald-300 shadow-2xs">
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              ✓
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-[#191c1e] truncate">1. Submitted</p>
                              <p className="text-[9px] text-emerald-700 truncate">Photos & Docs received</p>
                            </div>
                          </div>

                          {/* Step 2: Admin Verification */}
                          <div className={`flex items-center gap-2 bg-white p-2.5 rounded-lg border shadow-2xs ${
                            isLive ? 'border-emerald-300' : isPending ? 'border-amber-400 bg-amber-50/50 animate-pulse' : 'border-red-300'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isLive ? 'bg-emerald-600 text-white' : isPending ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {isLive ? '✓' : isPending ? '2' : '!'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-[#191c1e] truncate">2. Admin Verification</p>
                              <p className="text-[9px] text-[#7a7487] truncate">
                                {isLive ? 'Verified by Team' : isPending ? 'Reviewing legal paper' : 'Action required'}
                              </p>
                            </div>
                          </div>

                          {/* Step 3: Live for Buyers/Renters */}
                          <div className={`flex items-center gap-2 bg-white p-2.5 rounded-lg border shadow-2xs ${
                            isLive ? 'border-emerald-300 bg-emerald-50/30' : 'border-[#cbc3d8]/60 opacity-60'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isLive ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                            }`}>
                              {isLive ? '✓' : '3'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-[#191c1e] truncate">3. Live on Platform</p>
                              <p className="text-[9px] text-[#7a7487] truncate">
                                {isLive ? 'Visible to all Buyers' : 'Locked until verified'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Message Info */}
                        {isPending && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">info</span>
                            Your listing is currently with our legal & admin verification desk. Once approved, it will automatically appear in buyer search.
                          </p>
                        )}

                        {isRejected && prop.rejectionReason && (
                          <div className="text-[11px] text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200 space-y-1">
                            <p className="font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">error</span> Admin Feedback:
                            </p>
                            <p className="text-[10px] text-red-700">{prop.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/properties/${prop.id}`}
                            className="text-xs font-bold text-[#5e23dc] hover:text-[#4500b4] flex items-center gap-1 hover:underline"
                          >
                            <span className="material-symbols-outlined text-xs">visibility</span> Preview Listing
                          </Link>
                          <span className="text-[#cbc3d8]">•</span>
                          <Link
                            href={`/properties/${prop.id}/edit`}
                            className="text-xs font-bold text-[#494455] hover:text-[#191c1e] flex items-center gap-1 hover:underline"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span> Edit Details
                          </Link>
                        </div>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Enquiries Panel (4 columns) */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#bfc8c8]/30 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#bfc8c8]/20 flex justify-between items-center bg-[#f6f3f2]/50">
              <h2 className="text-sm font-bold text-[#1b1c1c]">Received Enquiries</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {leads.length}
              </span>
            </div>

            <div className="p-3 flex flex-col gap-3 min-h-[250px] max-h-[500px] overflow-y-auto">
              {leads.length === 0 ? (
                <div className="text-center py-12 text-[#586060] space-y-2">
                  <span className="material-symbols-outlined text-2xl">mail_outline</span>
                  <p className="text-xs">No active enquiries on your properties.</p>
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="p-3 hover:bg-[#f6f3f2]/40 rounded-lg border border-transparent hover:border-[#bfc8c8]/20 transition-all flex gap-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#5e23dc]/10 text-[#5e23dc] flex items-center justify-center font-bold text-xs shrink-0">
                      {lead.counterparty?.firstName ? lead.counterparty.firstName.substring(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-[#1b1c1c] truncate">
                          {lead.counterparty?.firstName || 'Buyer'}
                        </span>
                        <span className="text-[10px] text-[#586060] shrink-0">
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#5e23dc] font-medium mt-0.5 truncate">
                        Re: {lead.property?.title}
                      </div>
                      <p className="text-xs text-[#586060] mt-1 truncate">
                        {lead.lastMessage?.contentSanitized || 'No messages yet'}
                      </p>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => router.push(`/chat/${lead.id}`)}
                          className="text-[#5e23dc] hover:underline text-[10px] font-bold flex items-center gap-0.5 ml-auto"
                        >
                          <span className="material-symbols-outlined text-[12px]">chat</span> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
