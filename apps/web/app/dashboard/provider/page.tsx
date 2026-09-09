'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Booking {
  id: string;
  bookingRef: string;
  scheduledAt: string;
  address: string;
  city: string;
  pincode: string;
  status: string;
  totalAmount: number;
  notes?: string;
  service: {
    name: string;
    imageUrl?: string;
  };
}

interface ProviderProfile {
  id: string;
  userId: string;
  serviceArea: string[];
  categoryName?: string;
  requiresBackgroundCheck: boolean;
  verificationStatus: string; // PENDING, CHANGES_REQUESTED, APPROVED, REJECTED
  backgroundCheckStatus: string; // NOT_REQUIRED, PENDING, PASSED, FAILED
  verificationNotes?: string;
  isVerified: boolean;
  rating: number;
  totalJobs: number;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function VendorDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');

  const [activeJobs, setActiveJobs] = useState<Booking[]>([]);
  const [openJobs, setOpenJobs] = useState<Booking[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(299);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/auth/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(accToken.split('.')[1] || ''));
      if (payload.role && payload.role !== 'SERVICE_PROVIDER' && payload.role !== 'ADMIN') {
        if (payload.role === 'CUSTOMER') router.push('/dashboard/customer');
        else if (payload.role === 'OWNER') router.push('/dashboard/owner');
        else if (payload.role === 'AGENT') router.push('/dashboard/agent');
        else router.push('/');
        return;
      }
      setCurrentUser(payload);
      setToken(accToken);
      fetchProviderData(accToken);
    } catch {
      setCurrentUser({ firstName: 'Vendor', lastName: 'Pro', sub: 'dev-0000' });
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchProviderData = async (accToken: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // 1. Fetch real DB provider profile
      const profRes = await fetch(`${apiBase}/api/v1/services/provider/profile`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      if (profRes.ok) {
        const profJson = await profRes.json();
        setProviderProfile(profJson.data || profJson);
      }

      // 2. Fetch bookings (role-aware — returns provider's assigned bookings)
      const res = await fetch(`${apiBase}/api/v1/services/bookings/my`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        const bookings = json.data || json || [];
        setActiveJobs(bookings.filter((b: Booking) => ['ASSIGNED', 'IN_PROGRESS'].includes(b.status)));
        setOpenJobs(bookings.filter((b: Booking) => b.status === 'PENDING'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitting(true);
    setResubmitSuccess('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Must use PATCH — backend endpoint is @Patch('provider/resubmit')
      const res = await fetch(`${apiBase}/api/v1/services/provider/resubmit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: 'Updated verification documents re-uploaded by vendor.' }),
      });
      if (res.ok) {
        setResubmitSuccess('Application re-submitted successfully! Status set back to Under Review.');
        fetchProviderData(token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResubmitting(false);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Correct endpoint: PATCH /bookings/:id/status with body {status:'ASSIGNED'}
      const res = await fetch(`${apiBase}/api/v1/services/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ASSIGNED' }),
      });
      if (res.ok) fetchProviderData(token);
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarLinks = [
    { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
    { icon: 'group', label: 'Leads', key: 'leads' },
    { icon: 'home_work', label: 'My Listings', key: 'listings' },
    { icon: 'mail', label: 'Inbox', key: 'inbox' },
    { icon: 'payments', label: 'Payments', key: 'payments' },
    { icon: 'settings', label: 'Settings', key: 'settings' },
  ];

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center font-[Rubik]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          <p className="text-[#494455] text-sm">Loading your vendor dashboard...</p>
        </div>
      </div>
    );
  }

  const isFullyVerified = providerProfile?.isVerified ?? false;

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] h-screen overflow-hidden flex font-[Rubik] antialiased">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col h-full w-64 bg-white border-r border-[#eceef0] shrink-0 z-10 shadow-sm">
        {/* Pinned header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="mb-5 flex flex-col gap-1">
            <Link href="/" className="inline-block">
              <img src="/logo.png" alt="Ziva Housing Logo" className="h-9 w-auto object-contain" />
            </Link>
            <p className="text-[12px] text-[#494455] font-medium">Vendor & Service Hub</p>
          </div>

          <Link
            href="/become-professional/register"
            className="w-full bg-[#5e23dc] text-white hover:bg-[#4500b4] transition-colors rounded-lg py-3 px-4 text-[12px] font-bold flex justify-center items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Update Services
          </Link>
        </div>

        {/* Scrollable nav links */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2">
          <div className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => setActiveTab(link.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[12px] font-bold transition-all text-left w-full ${
                  activeTab === link.key ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-[#494455] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned footer */}
        <div className="flex-shrink-0 flex flex-col gap-1 p-3 border-t border-[#eceef0]">
          <Link
            className="text-[#494455] hover:bg-[#f2f4f6] transition-colors rounded-lg flex items-center gap-3 px-4 py-3 text-[12px] font-bold"
            href="/support"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            Help Center
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('Ziva_access');
              router.push('/auth/login');
            }}
            className="text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors rounded-lg flex items-center gap-3 px-4 py-3 text-[12px] font-bold w-full text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </nav>


      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-[#f8f9fb] flex flex-col gap-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full max-w-[1280px] mx-auto">
          <div>
            <h2 className="text-[24px] md:text-[32px] font-bold text-[#191c1e]">Vendor Operations</h2>
            <p className="text-[14px] text-[#494455] mt-1">Live dispatch, status tracking &amp; verification hub.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#eceef0] rounded-full px-4 py-2 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${isOnline && isFullyVerified ? 'bg-[#16a373] animate-pulse' : 'bg-[#ba1a1a]'}`} />
              <button onClick={() => setIsOnline(!isOnline)} className="text-[12px] font-bold text-[#191c1e]">
                {isOnline && isFullyVerified ? 'Online & Receiving Jobs' : isFullyVerified ? 'Offline' : 'Offline (Pending Verification)'}
              </button>
            </div>
          </div>
        </header>

        {/* ── MANDATORY CLEAR VERIFICATION NOTICE BANNER ── */}
        {!isFullyVerified && (
          <div className="w-full max-w-[1280px] mx-auto bg-[#fff8f7] border-2 border-[#ba1a1a]/30 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">gpp_maybe</span>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-[#ba1a1a]">You are not yet visible to customers</h4>
                <p className="text-[13px] text-[#494455] mt-0.5">
                  Your listing will become active and bookable in customer searches once all required verification checks are completed by the trust team.
                </p>
              </div>
            </div>
            <Link
              href="/become-professional/status"
              className="bg-[#ba1a1a] hover:bg-[#930006] text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
            >
              View Application Status
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* ── Bento Grid ── */}
        <div className="w-full max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column (3 cols): Profile + Detailed Verification Status Cards */}
          <div className="md:col-span-4 flex flex-col gap-4">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center border border-[#eceef0] relative overflow-hidden shadow-sm">
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#e8ddff] opacity-40 rounded-full blur-2xl" />
              <div className="relative w-20 h-20 rounded-full border-2 border-[#5e23dc] p-0.5 mb-3">
                <div className="w-full h-full rounded-full bg-[#e8ddff] flex items-center justify-center text-2xl font-bold text-[#4500b4]">
                  {currentUser?.firstName?.[0] || 'V'}
                </div>
                {isFullyVerified && (
                  <div className="absolute bottom-0 right-0 bg-[#16a373] text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                  </div>
                )}
              </div>
              <h3 className="text-[16px] font-bold text-[#191c1e] mb-0.5">
                {currentUser?.firstName || 'Vendor'} {currentUser?.lastName || 'Pro'}
              </h3>
              <p className="text-[12px] text-[#494455] mb-3">
                Category: <strong className="text-[#191c1e]">{providerProfile?.categoryName || 'Home Care'}</strong>
              </p>

              {isFullyVerified ? (
                <div className="bg-[#E8FAF4] text-[#16A373] rounded-full px-4 py-1.5 flex items-center gap-1.5 text-[12px] font-bold w-full justify-center border border-[#16a373]/20">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                  Ziva Verified Provider
                </div>
              ) : (
                <div className="bg-[#feebc8] text-[#b7791f] rounded-full px-4 py-1.5 flex items-center gap-1.5 text-[12px] font-bold w-full justify-center border border-[#b7791f]/20">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>hourglass_empty</span>
                  Verification Pending
                </div>
              )}
            </div>

            {/* ── DETAILED VERIFICATION & BACKGROUND CHECK STATUS CARD ── */}
            <div className="bg-white rounded-xl p-5 border border-[#eceef0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#eceef0] pb-3">
                <h4 className="text-[12px] font-bold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5e23dc]">badge</span>
                  Verification Status
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f2f4f6] text-[#494455]">
                  Real DB Status
                </span>
              </div>

              {/* 1. General Document Verification Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fb] border border-[#cbc3d8]/40">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-base ${
                      providerProfile?.verificationStatus === 'APPROVED'
                        ? 'text-[#16a373]'
                        : providerProfile?.verificationStatus === 'CHANGES_REQUESTED'
                        ? 'text-[#b7791f]'
                        : providerProfile?.verificationStatus === 'REJECTED'
                        ? 'text-[#ba1a1a]'
                        : 'text-[#5e23dc]'
                    }`}
                  >
                    {providerProfile?.verificationStatus === 'APPROVED'
                      ? 'check_circle'
                      : providerProfile?.verificationStatus === 'CHANGES_REQUESTED'
                      ? 'warning'
                      : providerProfile?.verificationStatus === 'REJECTED'
                      ? 'cancel'
                      : 'pending'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#191c1e]">General Documents</div>
                    <div className="text-[10px] text-[#494455]">ID &amp; Address Proof</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    providerProfile?.verificationStatus === 'APPROVED'
                      ? 'bg-[#e8faf4] text-[#16a373]'
                      : providerProfile?.verificationStatus === 'CHANGES_REQUESTED'
                      ? 'bg-[#feebc8] text-[#b7791f]'
                      : providerProfile?.verificationStatus === 'REJECTED'
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : 'bg-[#e8ddff] text-[#4500b4]'
                  }`}
                >
                  {providerProfile?.verificationStatus || 'PENDING'}
                </span>
              </div>

              {/* 2. Distinct Background Check Status (For sensitive categories) */}
              {providerProfile?.requiresBackgroundCheck ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8f9fb] border border-[#cbc3d8]/40">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-base ${
                        providerProfile?.backgroundCheckStatus === 'PASSED'
                          ? 'text-[#16a373]'
                          : providerProfile?.backgroundCheckStatus === 'FAILED'
                          ? 'text-[#ba1a1a]'
                          : 'text-[#b7791f]'
                      }`}
                    >
                      {providerProfile?.backgroundCheckStatus === 'PASSED'
                        ? 'verified_user'
                        : providerProfile?.backgroundCheckStatus === 'FAILED'
                        ? 'gpp_bad'
                        : 'admin_panel_settings'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#191c1e]">Background Check</div>
                      <div className="text-[10px] text-[#494455]">Trust &amp; Safety Screening</div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      providerProfile?.backgroundCheckStatus === 'PASSED'
                        ? 'bg-[#e8faf4] text-[#16a373]'
                        : providerProfile?.backgroundCheckStatus === 'FAILED'
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : 'bg-[#feebc8] text-[#b7791f]'
                    }`}
                  >
                    {providerProfile?.backgroundCheckStatus || 'PENDING'}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-[#7a7487] italic px-1">
                  Background check not required for standard category ({providerProfile?.categoryName || 'General'}).
                </div>
              )}

              {/* Admin Feedback / Notes display */}
              {providerProfile?.verificationNotes && (
                <div className="bg-[#fffbf0] border border-[#feebc8] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-[#b7791f] uppercase tracking-wider block">
                    Admin Verification Feedback
                  </span>
                  <p className="text-xs text-[#494455] italic">&quot;{providerProfile.verificationNotes}&quot;</p>
                </div>
              )}

              {/* Action Form for Changes Requested */}
              {providerProfile?.verificationStatus === 'CHANGES_REQUESTED' && (
                <form onSubmit={handleResubmit} className="space-y-2 pt-2 border-t border-[#eceef0]">
                  <p className="text-[11px] font-bold text-[#ba1a1a]">Action Required: Re-upload updated documents below</p>
                  {resubmitSuccess && (
                    <div className="text-[11px] text-[#16a373] bg-[#e8faf4] p-2 rounded-lg font-semibold">{resubmitSuccess}</div>
                  )}
                  <button
                    type="submit"
                    disabled={resubmitting}
                    className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {resubmitting ? 'Re-submitting...' : 'Re-submit Updated Application'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Middle Column (5 cols): Jobs & Dispatches */}
          <div className="md:col-span-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[20px] font-bold text-[#191c1e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5e23dc]">radar</span>
                  Incoming Requests
                </h3>
                <span className="bg-[#ffdad6] text-[#ba1a1a] px-3 py-1 rounded-full text-[12px] font-bold border border-[#ba1a1a]/20">
                  {openJobs.length} Pending
                </span>
              </div>

              {/* Job Card 1 */}
              <div className="bg-white border border-[#5e23dc]/20 rounded-xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#5e23dc] rounded-l-xl" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#f2f4f6] flex items-center justify-center border border-[#eceef0]">
                      <span className="material-symbols-outlined text-[#494455]" style={{ fontSize: '28px' }}>
                        water_damage
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[16px] text-[#191c1e] font-bold">Emergency Service Request</h4>
                      <p className="text-[13px] text-[#494455] flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          location_on
                        </span>
                        Bangalore Urban • Sector 4
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-bold text-[#191c1e]">₹2,500 - ₹4,000</div>
                    <div className="text-[12px] text-[#494455]">Est. Payout</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#eceef0]">
                  <div className="flex items-center gap-2 text-[#ba1a1a]">
                    <span className="material-symbols-outlined animate-pulse" style={{ fontSize: '18px' }}>
                      timer
                    </span>
                    <span className="text-[12px] font-bold">{formatTimer(secondsLeft)} to accept</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg border border-[#cbc3d8] text-[#191c1e] text-[12px] font-bold hover:bg-[#f2f4f6]">
                      Reject
                    </button>
                    <button
                      onClick={() => openJobs[0] && handleAcceptJob(openJobs[0].id)}
                      disabled={!isFullyVerified}
                      className="px-4 py-2 rounded-lg bg-[#5e23dc] text-white text-[12px] font-bold hover:bg-[#4500b4] disabled:opacity-50"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (3 cols): Earnings & Stats */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#eceef0] flex flex-col shadow-sm">
              <h3 className="text-[11px] font-bold text-[#494455] uppercase tracking-wider mb-3">Total Jobs Done</h3>
              <div className="text-[36px] font-bold text-[#191c1e] leading-none mb-1">{providerProfile?.totalJobs ?? 0}</div>
              <div className="text-[13px] text-[#494455] flex items-center gap-1 mb-4 font-semibold">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>work_history</span>
                {isFullyVerified ? 'Active & Verified' : 'Pending Verification'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-[#eceef0] shadow-sm">
                <div className="text-[22px] font-bold text-[#191c1e]">{activeJobs.length}</div>
                <div className="text-[11px] text-[#494455] font-semibold">Active Jobs</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-[#eceef0] shadow-sm">
                <div className="text-[22px] font-bold text-[#16a373]">
                  {providerProfile?.rating != null ? providerProfile.rating.toFixed(1) : '—'}
                </div>
                <div className="text-[11px] text-[#494455] font-semibold">⭐ Rating</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
