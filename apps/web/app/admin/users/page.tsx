'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const SERVICE_CATEGORIES = [
  'Electrician', 'Plumber', 'Deep Cleaning', 'Pest Control', 'AC Repair',
  'Carpenter', 'Painter', 'Babysitter', 'Elderly Care', 'Cook / Chef',
  'Driver', 'Packers & Movers', 'Gardening', 'Solar Installation',
  'Beautician', "Women's Spa", "Men's Spa",
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // Tab Selection
  const [adminSubTab, setAdminSubTab] = useState<'USERS' | 'VENDORS' | 'PAYOUTS' | 'BROADCAST' | 'DISPATCHER'>('VENDORS');

  // User States & Pagination
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('CUSTOMER');
  const [userSearch, setUserSearch] = useState('');
  const [userActionReason, setUserActionReason] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Vendor States
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState('');

  // Vendor Search & Filter
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState('');

  // KYC Preview Modal (Feature 6a)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Create Vendor Modal
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    categoryName: 'Electrician', serviceArea: 'Bangalore',
    requiresBackgroundCheck: true, autoApprove: false,
    bankAccountName: '', bankAccountNo: '', bankIfscCode: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Vendor Profile
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);

  // Payouts Ledger State (Feature 6b)
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [payoutStats, setPayoutStats] = useState({ pendingPayoutAmount: 0, processedPayoutAmount: 0 });
  const [releasingPayoutId, setReleasingPayoutId] = useState<string | null>(null);

  // Broadcast Notification State (Feature 6c)
  const [broadcastForm, setBroadcastForm] = useState({
    audience: 'ALL',
    title: '',
    body: '',
  });
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Dispatcher State (Feature 6d)
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [reassigningBookingId, setReassigningBookingId] = useState<string | null>(null);
  const [targetProviderId, setTargetProviderId] = useState<string>('');

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/admin/login');
      return;
    }
    setToken(accToken);
    fetchData(accToken, userPage);
  }, [router, userRoleFilter, userPage, userPageSize]);

  const fetchData = async (accToken: string, page = userPage) => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const userParams = new URLSearchParams({
        page: String(page),
        limit: String(userPageSize),
      });
      if (userSearch.trim()) userParams.append('search', userSearch.trim());
      if (userRoleFilter.trim()) userParams.append('role', userRoleFilter.trim());

      const [usersRes, pendingRes, approvedRes, payoutsRes, bookingsRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/users?${userParams.toString()}`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/vendors/pending`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/vendors/approved`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/payouts`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/service-bookings`, { headers: { Authorization: `Bearer ${accToken}` } }),
      ]);

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        const list = uJson.data?.users || uJson.users || [];
        setUsersList(list);
        setTotalUsersCount(uJson.data?.total ?? uJson.total ?? list.length);
      } else {
        setUsersList([]);
        setTotalUsersCount(0);
      }
      if (pendingRes.ok) {
        const pJson = await pendingRes.json();
        setPendingVendors(pJson.data || pJson || []);
      } else {
        setPendingVendors([]);
      }
      if (approvedRes.ok) {
        const aJson = await approvedRes.json();
        setApprovedVendors(aJson.data || aJson || []);
      } else {
        setApprovedVendors([]);
      }
      if (payoutsRes.ok) {
        const payJson = await payoutsRes.json();
        setPayoutsList(payJson.payouts || payJson.data?.payouts || []);
        setPayoutStats(payJson.stats || payJson.data?.stats || { pendingPayoutAmount: 0, processedPayoutAmount: 0 });
      }
      if (bookingsRes.ok) {
        const bJson = await bookingsRes.json();
        setServiceBookings(bJson.data || bJson || []);
      }
    } catch {
      // Genuine offline: show honest empty states, never fabricated dummy records
      setUsersList([]);
      setTotalUsersCount(0);
      setPendingVendors([]);
      setApprovedVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND' | 'VERIFY') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: userActionReason || 'Administrative decision' }),
      });
      if (res.ok) {
        alert(`User status updated to ${action} successfully.`);
        setUserActionReason('');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || `Failed to perform ${action} on user.`);
      }
    } catch (err: any) {
      alert(`Failed to process user action: ${err.message || 'Network error'}`);
    }
  };

  const handleVendorAction = async (vendorUserId: string, action: 'APPROVE' | 'CHANGES_REQUESTED' | 'REJECT') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = action === 'APPROVE' ? 'approve' : action === 'CHANGES_REQUESTED' ? 'changes-requested' : 'reject';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${vendorUserId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: adminNote || `Admin verification action: ${action}` }),
      });
      if (res.ok) {
        alert(`Vendor document status updated: ${action}`);
        setAdminNote('');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || `Failed to update vendor status to ${action}.`);
      }
    } catch (err: any) {
      alert(`Error updating vendor: ${err.message || 'Network error'}`);
    }
  };

  const handleBackgroundCheckAction = async (vendorUserId: string, status: 'PASSED' | 'FAILED') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${vendorUserId}/background-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, notes: adminNote || `Background check ${status}` }),
      });
      if (res.ok) {
        alert(`Trust & Safety Background Check updated to ${status}.`);
        setAdminNote('');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to update background check status.');
      }
    } catch (err: any) {
      alert(`Error updating background check status: ${err.message || 'Network error'}`);
    }
  };

  const handleVendorSuspend = async (vendorUserId: string) => {
    if (!confirm('Are you sure you want to suspend / revoke approval for this vendor?')) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${vendorUserId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: adminNote || 'Vendor status revoked/suspended by Admin' }),
      });
      if (res.ok) {
        alert('Vendor approval has been suspended.');
        setAdminNote('');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to suspend vendor.');
      }
    } catch (err: any) {
      alert(`Error suspending vendor: ${err.message || 'Network error'}`);
    }
  };

  const handleSaveVendorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setEditLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${editingVendor.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categoryName: editForm.categoryName,
          serviceArea: typeof editForm.serviceArea === 'string'
            ? editForm.serviceArea.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editForm.serviceArea,
          bankAccountName: editForm.bankAccountName,
          bankAccountNo: editForm.bankAccountNo,
          bankIfscCode: editForm.bankIfscCode,
          rating: parseFloat(editForm.rating) || 5.0,
          totalJobs: parseInt(editForm.totalJobs) || 0,
          verificationNotes: editForm.verificationNotes,
        }),
      });
      if (res.ok) {
        alert('Vendor profile updated successfully!');
        setEditingVendor(null);
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to update vendor profile.');
      }
    } catch (err: any) {
      alert(`Error updating vendor profile: ${err.message || 'Network error'}`);
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Release Payout (Feature 6b) ──────────────────────────────────────────
  const handleReleasePayout = async (payoutId: string) => {
    setReleasingPayoutId(payoutId);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/payouts/${payoutId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: 'Released by Admin' }),
      });
      if (res.ok) {
        alert('Payout marked as PROCESSED successfully!');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to release payout.');
      }
    } catch (err: any) {
      alert(`Error releasing payout: ${err.message || 'Network error'}`);
    } finally {
      setReleasingPayoutId(null);
    }
  };

  // ─── Broadcast Notification Submit (Feature 6c) ───────────────────────────
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) {
      alert('Title and Body are required.');
      return;
    }
    setBroadcastLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(broadcastForm),
      });
      const json = await res.json();
      if (res.ok) {
        alert(`Broadcast sent successfully! Reached ${json.recipientsCount || 0} users.`);
        setBroadcastForm({ audience: 'ALL', title: '', body: '' });
      } else {
        alert(json.message || 'Failed to send broadcast notification.');
      }
    } catch (err: any) {
      alert(`Error sending broadcast notification: ${err.message || 'Network error'}`);
    } finally {
      setBroadcastLoading(false);
    }
  };

  // ─── Reassign Service Booking (Feature 6d) ────────────────────────────────
  const handleReassignBooking = async (bookingId: string) => {
    if (!targetProviderId) {
      alert('Please select a target service provider.');
      return;
    }
    setReassigningBookingId(bookingId);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/service-bookings/${bookingId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newProviderId: targetProviderId }),
      });
      if (res.ok) {
        alert('Service booking reassigned successfully!');
        setTargetProviderId('');
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to reassign booking.');
      }
    } catch (err: any) {
      alert(`Error reassigning booking: ${err.message || 'Network error'}`);
    } finally {
      setReassigningBookingId(null);
    }
  };

  // ─── Create Vendor ──────────────────────────────────────────────────────────
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...createForm,
          serviceArea: createForm.serviceArea.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        alert('Vendor created successfully!');
        setShowCreateVendor(false);
        fetchData(token, userPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to create vendor.');
      }
    } catch (err: any) {
      alert(`Error creating vendor: ${err.message || 'Network error'}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const inputCls = 'w-full h-9 bg-white border border-[#cbc3d8] rounded-lg px-3 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]';
  const labelCls = 'text-[10px] font-bold text-[#494455] uppercase tracking-wider block mb-1';

  return (
    <div className="space-y-8">
      {/* Tab Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cbc3d8]/60 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#191c1e]">Admin Operations Center</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage Users, Vendors, KYC Proofs, Payout Ledgers &amp; Dispatcher.</p>
        </div>
        <div className="flex gap-2 bg-[#f2f4f6] p-1.5 rounded-2xl">
          {[
            { key: 'VENDORS', label: 'Vendor Verification', icon: 'verified_user' },
            { key: 'USERS', label: 'User Database', icon: 'group' },
            { key: 'PAYOUTS', label: 'Payout Ledger', icon: 'payments' },
            { key: 'DISPATCHER', label: 'Job Dispatcher', icon: 'local_shipping' },
            { key: 'BROADCAST', label: 'Broadcast Alert', icon: 'campaign' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAdminSubTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminSubTab === tab.key
                  ? 'bg-white text-[#4500b4] shadow-sm'
                  : 'text-[#7a7487] hover:text-[#191c1e]'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: VENDOR VERIFICATION & ONBOARDING (FEATURE 6A KYC MODAL INCLUDED)
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'VENDORS' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-[#191c1e]">Vendor Verification &amp; Document Review</h2>
              <p className="text-xs text-gray-500 mt-0.5">Inspect KYC documents, set status, and run background checks.</p>
            </div>
            <button
              onClick={() => setShowCreateVendor(true)}
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              + Add New Vendor
            </button>
          </div>

          {/* Vendor Search & Filter Bar */}
          <div className="flex flex-wrap gap-3 bg-[#f8f9fb] border border-[#eceef0] rounded-2xl p-3 items-center">
            <span className="material-symbols-outlined text-[#7a7487] text-lg">search</span>
            <input
              type="text"
              placeholder="Search vendor by name or phone..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              className="flex-1 min-w-[180px] bg-white border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] transition"
            />
            <select
              value={vendorCategoryFilter}
              onChange={(e) => setVendorCategoryFilter(e.target.value)}
              className="bg-white border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] transition"
            >
              <option value="">All Categories</option>
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {(vendorSearch || vendorCategoryFilter) && (
              <button
                onClick={() => { setVendorSearch(''); setVendorCategoryFilter(''); }}
                className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">close</span> Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            {(() => {
              const filteredPending = pendingVendors.filter((v) => {
                const prof = v.serviceProviderProfile || {};
                const nameMatch = !vendorSearch || `${v.firstName} ${v.lastName} ${v.phone}`.toLowerCase().includes(vendorSearch.toLowerCase());
                const catMatch = !vendorCategoryFilter || (prof.categoryName || '').toLowerCase().includes(vendorCategoryFilter.toLowerCase());
                return nameMatch && catMatch;
              });
              return (
                <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#4500b4] uppercase tracking-wider border-b border-[#eceef0] pb-2 flex justify-between">
                    <span>Pending Verification ({filteredPending.length}{vendorSearch || vendorCategoryFilter ? ` of ${pendingVendors.length}` : ''})</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">In Queue</span>
                  </h3>

                  {filteredPending.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-[#7a7487]">manage_search</span>
                      </div>
                      <p className="text-xs font-bold text-[#191c1e]">
                        {vendorSearch || vendorCategoryFilter ? 'No vendors match your search' : 'No Pending Applications'}
                      </p>
                      <p className="text-[11px] text-gray-400 text-center max-w-[200px]">
                        {vendorSearch || vendorCategoryFilter
                          ? 'Try adjusting your search or filter.'
                          : 'All vendor applications have been reviewed, or no one has applied yet. New applications appear here automatically.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPending.map((vendor) => {
                        const prof = vendor.serviceProviderProfile || {};
                        return (
                          <div key={vendor.id} className="border border-[#eceef0] p-4 rounded-xl space-y-3 bg-[#f8f9fb]">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-xs text-[#191c1e]">{vendor.firstName} {vendor.lastName}</h4>
                                <p className="text-[10px] text-gray-500">📞 {vendor.phone} • 📧 {vendor.email || 'N/A'}</p>
                                <p className="text-[10px] font-bold text-[#5e23dc] mt-0.5">Category: {prof.categoryName || 'General'}</p>
                              </div>
                              <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-2 py-0.5 rounded uppercase">{prof.verificationStatus || 'PENDING'}</span>
                            </div>

                            {/* Trust & Safety Background Check */}
                            <div className="bg-white p-2.5 rounded-lg border border-[#eceef0] flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-bold text-[#7a7487] uppercase tracking-wider block">Trust &amp; Safety Background Check:</span>
                                <span className={`text-[10px] font-bold ${prof.backgroundCheckStatus === 'PASSED' ? 'text-[#16a373]' : prof.backgroundCheckStatus === 'FAILED' ? 'text-red-600' : 'text-amber-600'}`}>
                                  {prof.backgroundCheckStatus || (prof.requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED')}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleBackgroundCheckAction(vendor.id, 'PASSED')}
                                  className="bg-[#e8faf4] text-[#16a373] hover:bg-[#16a373] hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition border border-[#16a373]/30"
                                >
                                  Pass ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBackgroundCheckAction(vendor.id, 'FAILED')}
                                  className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition border border-red-300"
                                >
                                  Fail ✕
                                </button>
                              </div>
                            </div>

                            {/* KYC Document Preview Buttons */}
                            <div className="bg-white p-2.5 rounded-lg border border-[#eceef0] space-y-2">
                              <span className="text-[9px] font-bold text-[#7a7487] uppercase tracking-wider block">Uploaded KYC Proofs:</span>
                              <div className="flex gap-2 flex-wrap">
                                {prof.idProofUrl ? (
                                  <button
                                    onClick={() => setPreviewDoc({ url: prof.idProofUrl, title: `ID Proof — ${vendor.firstName}` })}
                                    className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-xs">visibility</span> View ID Proof
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-gray-400 italic">No ID proof uploaded</span>
                                )}
                                {prof.addressProofUrl ? (
                                  <button
                                    onClick={() => setPreviewDoc({ url: prof.addressProofUrl, title: `Address Proof — ${vendor.firstName}` })}
                                    className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-xs">visibility</span> View Address Proof
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-gray-400 italic">No address proof uploaded</span>
                                )}
                              </div>
                            </div>

                            {/* Admin note input */}
                            <input
                              type="text"
                              placeholder="Optional admin note for vendor (e.g. 'ID document blurry')..."
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              className="w-full text-[10px] border border-[#eceef0] rounded-lg px-3 py-1.5 outline-none focus:border-[#5e23dc] bg-white"
                            />

                            {/* Verification Actions */}
                            <div className="flex gap-2">
                              <button onClick={() => handleVendorAction(vendor.id, 'APPROVE')} className="flex-1 bg-[#16a373] text-white hover:bg-[#0f6e4d] py-1.5 rounded-lg text-[10px] font-bold transition">✓ Approve Docs</button>
                              <button onClick={() => handleVendorAction(vendor.id, 'CHANGES_REQUESTED')} className="flex-1 bg-amber-500 text-white hover:bg-amber-600 py-1.5 rounded-lg text-[10px] font-bold transition">↩ Req Changes</button>
                              <button onClick={() => handleVendorAction(vendor.id, 'REJECT')} className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Approved Vendors */}
            {(() => {
              const filteredApproved = approvedVendors.filter((v) => {
                const prof = v.serviceProviderProfile || {};
                const nameMatch = !vendorSearch || `${v.firstName} ${v.lastName} ${v.phone}`.toLowerCase().includes(vendorSearch.toLowerCase());
                const catMatch = !vendorCategoryFilter || (prof.categoryName || '').toLowerCase().includes(vendorCategoryFilter.toLowerCase());
                return nameMatch && catMatch;
              });
              return (
                <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs text-[#16a373] uppercase tracking-wider border-b border-[#eceef0] pb-2 flex justify-between">
                    <span>Active Approved Vendors ({filteredApproved.length}{vendorSearch || vendorCategoryFilter ? ` of ${approvedVendors.length}` : ''})</span>
                    <span className="bg-[#e8faf4] text-[#16a373] text-[10px] px-2 py-0.5 rounded-full font-bold">Verified</span>
                  </h3>

                  {filteredApproved.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#e8faf4] flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-[#16a373]">verified_user</span>
                      </div>
                      <p className="text-xs font-bold text-[#191c1e]">
                        {vendorSearch || vendorCategoryFilter ? 'No vendors match your search' : 'No Approved Vendors Yet'}
                      </p>
                      <p className="text-[11px] text-gray-400 text-center max-w-[200px]">
                        {vendorSearch || vendorCategoryFilter
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Once you approve vendors from the Pending queue, they will appear here as active service providers.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredApproved.map((vendor) => {
                        const prof = vendor.serviceProviderProfile || {};
                        return (
                          <div key={vendor.id} className="border border-[#eceef0] p-3 rounded-xl bg-[#f8f9fb] space-y-2 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-[#191c1e]">{vendor.firstName} {vendor.lastName}</h4>
                                  <span className="bg-[#e8faf4] text-[#16a373] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-[#16a373]/20">Active</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5">📞 {vendor.phone} • Category: <strong className="text-[#5e23dc]">{prof.categoryName}</strong></p>
                                <p className="text-[10px] text-gray-400">Area: {Array.isArray(prof.serviceArea) ? prof.serviceArea.join(', ') : prof.serviceArea || 'Bangalore'} • Bank: {prof.bankAccountName || 'N/A'} ({prof.bankAccountNo || 'No A/C'})</p>
                                <p className="text-[10px] text-amber-600 font-semibold">Rating: ★ {prof.rating || '5.0'} • Jobs: {prof.totalJobs ?? 0}</p>
                              </div>
                            </div>

                            {/* Action buttons for Approved Vendor */}
                            <div className="flex gap-2 pt-1 border-t border-[#eceef0]/80">
                              {(prof.idProofUrl || prof.addressProofUrl) && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc({ url: prof.idProofUrl || prof.addressProofUrl, title: `KYC Proof — ${vendor.firstName}` })}
                                  className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">visibility</span> KYC
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVendor(vendor);
                                  setEditForm({
                                    categoryName: prof.categoryName || 'Electrician',
                                    serviceArea: Array.isArray(prof.serviceArea) ? prof.serviceArea.join(', ') : prof.serviceArea || '',
                                    bankAccountName: prof.bankAccountName || '',
                                    bankAccountNo: prof.bankAccountNo || '',
                                    bankIfscCode: prof.bankIfscCode || '',
                                    rating: prof.rating || 5.0,
                                    totalJobs: prof.totalJobs ?? 0,
                                    verificationNotes: prof.verificationNotes || '',
                                  });
                                }}
                                className="flex-1 bg-white border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#191c1e] py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span> Edit Profile
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVendorSuspend(vendor.id)}
                                className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-xs">block</span> Suspend
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: USER DATABASE
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'USERS' && (
        <section className="bg-white border border-[#eceef0] rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#eceef0] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#191c1e]">Registered System Users</h2>
              <p className="text-[11px] text-gray-500">Search by phone, email, name, and filter by user role.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setUserPage(1);
                      fetchData(token, 1);
                    }
                  }}
                  className="h-8 bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-3 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] w-44"
                />
              </div>
              <button
                onClick={() => {
                  setUserPage(1);
                  fetchData(token, 1);
                }}
                className="h-8 bg-[#5e23dc] hover:bg-[#4500b4] text-white px-3 rounded-lg text-xs font-bold transition"
              >
                Search
              </button>
              <div className="flex gap-1 bg-[#f2f4f6] p-1 rounded-xl">
                {['CUSTOMER', 'OWNER', 'AGENT', 'SERVICE_PROVIDER'].map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setUserRoleFilter(r);
                      setUserPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${userRoleFilter === r ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {usersList.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-gray-400">person_off</span>
              <p className="text-xs font-bold text-[#191c1e]">No Users Found</p>
              <p className="text-[11px] text-gray-400">No registered users matched the role or search query.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase text-[10px]">
                  <tr><th className="p-3">User</th><th className="p-3">Contact</th><th className="p-3">Status</th><th className="p-3 text-center">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td className="p-3 font-semibold">{u.firstName} {u.lastName}</td>
                      <td className="p-3">{u.phone}<br/><span className="text-[10px] text-gray-400">{u.email || 'N/A'}</span></td>
                      <td className="p-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded ${u.status === 'ACTIVE' ? 'bg-[#e8faf4] text-[#16a373]' : 'bg-rose-100 text-rose-800'}`}>{u.status}</span></td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleUserAction(u.id, u.status === 'ACTIVE' ? 'BLOCK' : 'UNBLOCK')} className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded hover:bg-red-600 transition">{u.status === 'ACTIVE' ? 'Block' : 'Unblock'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Users Pagination */}
              <div className="border-t border-[#eceef0] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                <div className="text-gray-500 font-medium">
                  Showing <span className="font-bold text-[#191c1e]">{totalUsersCount === 0 ? 0 : (userPage - 1) * userPageSize + 1}</span> to{' '}
                  <span className="font-bold text-[#191c1e]">{Math.min(userPage * userPageSize, totalUsersCount)}</span> of{' '}
                  <span className="font-bold text-[#191c1e]">{totalUsersCount}</span> users
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 text-[11px]">Per page:</span>
                    <select
                      value={userPageSize}
                      onChange={(e) => {
                        setUserPageSize(Number(e.target.value));
                        setUserPage(1);
                      }}
                      className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-2 py-1 text-xs outline-none font-bold"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={userPage <= 1}
                      onClick={() => {
                        const newP = Math.max(1, userPage - 1);
                        setUserPage(newP);
                        fetchData(token, newP);
                      }}
                      className="px-3 py-1 rounded-lg border border-[#cbc3d8] text-[#191c1e] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition text-[11px]"
                    >
                      Previous
                    </button>
                    <span className="px-2 font-bold text-[#4500b4]">
                      {userPage} / {Math.max(1, Math.ceil(totalUsersCount / userPageSize))}
                    </span>
                    <button
                      type="button"
                      disabled={userPage >= Math.ceil(totalUsersCount / userPageSize)}
                      onClick={() => {
                        const newP = userPage + 1;
                        setUserPage(newP);
                        fetchData(token, newP);
                      }}
                      className="px-3 py-1 rounded-lg border border-[#cbc3d8] text-[#191c1e] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition text-[11px]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 3: VENDOR PAYOUT LEDGER (FEATURE 6B)
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'PAYOUTS' && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Pending Unpaid Payouts</span>
              <span className="text-2xl font-bold text-amber-900">₹{payoutStats.pendingPayoutAmount.toLocaleString()}</span>
            </div>
            <div className="bg-[#e8faf4] border border-[#16a373]/20 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-[#16a373] uppercase tracking-wider block">Released Payouts Total</span>
              <span className="text-2xl font-bold text-[#0f6e4d]">₹{payoutStats.processedPayoutAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-[#eceef0] rounded-2xl shadow-sm overflow-hidden p-5">
            <h3 className="font-bold text-xs text-[#4500b4] uppercase tracking-wider border-b border-[#eceef0] pb-3 mb-4">Vendor Payout Ledger Records</h3>
            {payoutsList.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">No payout records generated yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase text-[10px]">
                  <tr><th className="p-3">Vendor</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3 text-center">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {payoutsList.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-semibold">{p.user?.firstName} {p.user?.lastName}<br/><span className="text-[10px] text-gray-400">{p.user?.phone}</span></td>
                      <td className="p-3 font-bold text-[#191c1e]">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.status === 'PROCESSED' ? 'bg-[#e8faf4] text-[#16a373]' : 'bg-amber-100 text-amber-800'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        {p.status === 'PENDING' ? (
                          <button
                            onClick={() => handleReleasePayout(p.id)}
                            disabled={releasingPayoutId === p.id}
                            className="bg-[#16a373] hover:bg-[#0f6e4d] text-white px-3 py-1 rounded-lg text-[10px] font-bold transition shadow-sm"
                          >
                            {releasingPayoutId === p.id ? 'Releasing...' : 'Release Payment'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-semibold">Released ({p.gatewayRef})</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 4: BROADCAST NOTIFICATION SENDER (FEATURE 6C)
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'BROADCAST' && (
        <section className="bg-white border border-[#eceef0] rounded-2xl shadow-sm p-6 max-w-2xl mx-auto space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5e23dc]">campaign</span>
              Broadcast System Announcement
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Send a real-time notification alert directly to target users' Notification Center.</p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className={labelCls}>Target Audience</label>
              <select
                value={broadcastForm.audience}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                className={inputCls}
              >
                <option value="ALL">All Users (System-wide)</option>
                <option value="CUSTOMERS">Customers Only</option>
                <option value="OWNERS">Property Owners Only</option>
                <option value="VENDORS">Service Vendors Only</option>
                <option value="AGENTS">Agents Only</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Notification Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Special Holiday Discount on Deep Cleaning!"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Notification Body Message</label>
              <textarea
                required
                rows={4}
                placeholder="Type full notification message..."
                value={broadcastForm.body}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                className="w-full bg-white border border-[#cbc3d8] rounded-lg p-3 text-xs outline-none focus:border-[#5e23dc] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastLoading}
              className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white py-3 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
            >
              {broadcastLoading ? 'Broadcasting Notification...' : <><span className="material-symbols-outlined text-sm">send</span> Send Broadcast Notification</>}
            </button>
          </form>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 5: MANUAL SERVICE BOOKING DISPATCHER (FEATURE 6D)
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'DISPATCHER' && (
        <section className="bg-white border border-[#eceef0] rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5e23dc]">local_shipping</span>
              Manual Service Booking Dispatcher / Override
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Reassign service bookings manually to any active, verified vendor.</p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase text-[10px]">
              <tr><th className="p-3">Ref &amp; Service</th><th className="p-3">Customer</th><th className="p-3">Assigned Vendor</th><th className="p-3">Status</th><th className="p-3 text-center">Reassign Action</th></tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {serviceBookings.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-semibold">{b.bookingRef}<br/><span className="text-[10px] text-gray-500">{b.service?.name}</span></td>
                  <td className="p-3">{b.customer?.firstName} {b.customer?.lastName}<br/><span className="text-[10px] text-gray-400">{b.customer?.phone}</span></td>
                  <td className="p-3 font-semibold text-[#5e23dc]">
                    {b.serviceProvider ? `${b.serviceProvider.user?.firstName} (${b.serviceProvider.categoryName})` : 'Unassigned'}
                  </td>
                  <td className="p-3"><span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded">{b.status}</span></td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center items-center">
                      <select
                        onChange={(e) => setTargetProviderId(e.target.value)}
                        className="h-8 border border-[#cbc3d8] rounded-lg text-[10px] px-2 outline-none"
                      >
                        <option value="">Select Vendor...</option>
                        {approvedVendors.map((v) => (
                          <option key={v.serviceProviderProfile?.id || v.id} value={v.serviceProviderProfile?.id || v.id}>
                            {v.firstName} {v.lastName} ({v.serviceProviderProfile?.categoryName})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleReassignBooking(b.id)}
                        disabled={reassigningBookingId === b.id}
                        className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm shrink-0"
                      >
                        {reassigningBookingId === b.id ? 'Reassigning...' : 'Assign Vendor'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURE 6A: KYC DOCUMENT & PDF PREVIEW MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eceef0] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[#eceef0] flex justify-between items-center bg-[#f8f9fb]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#5e23dc] bg-[#e8ddff] p-1.5 rounded-lg text-lg">
                  {previewDoc.url.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#191c1e]">{previewDoc.title}</h3>
                  <p className="text-[10px] text-gray-500">Official KYC Compliance Document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#5e23dc] text-white hover:bg-[#4500b4] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  <span>Open Full Document</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-[#e6e8ea] hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[#191c1e] min-h-[420px]">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title="PDF Preview"
                  className="w-full h-[540px] rounded-xl border border-[#333] bg-white"
                />
              ) : (
                <img
                  src={previewDoc.url}
                  alt="KYC Document Preview"
                  className="max-w-full max-h-[540px] object-contain rounded-xl shadow-2xl border border-[#333]"
                  onError={(e: any) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              )}
            </div>

            <div className="p-3 bg-[#f8f9fb] border-t border-[#eceef0] flex justify-between items-center text-[11px] text-gray-500">
              <span className="flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-xs text-[#16a373]">verified_user</span>
                Encrypted & Stored via Cloudinary Cloud CDN
              </span>
              <span className="text-gray-400 font-mono text-[10px] truncate max-w-xs">{previewDoc.url}</span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE VENDOR MODAL */}
      {showCreateVendor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateVendor(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eceef0] w-full max-w-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#191c1e]">Add New Service Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} className={inputCls} />
                <input required placeholder="Last Name" value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
                <input placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={createForm.categoryName} onChange={(e) => setCreateForm({ ...createForm, categoryName: e.target.value })} className={inputCls}>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Service Area (comma-separated)" value={createForm.serviceArea} onChange={(e) => setCreateForm({ ...createForm, serviceArea: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#eceef0]">
                <button type="button" onClick={() => setShowCreateVendor(false)} className="px-4 py-2 text-xs font-bold text-gray-500">Cancel</button>
                <button type="submit" disabled={createLoading} className="bg-[#5e23dc] text-white px-5 py-2 rounded-xl text-xs font-bold">{createLoading ? 'Creating...' : 'Create Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR PROFILE MODAL */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setEditingVendor(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#eceef0] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#191c1e]">Edit Vendor Profile — {editingVendor.firstName} {editingVendor.lastName}</h3>
                <p className="text-[10px] text-gray-500">Update category, service coverage, bank accounts &amp; verification notes.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendorProfile} className="space-y-3">
              <div>
                <label className={labelCls}>Service Category</label>
                <select
                  value={editForm.categoryName}
                  onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })}
                  className={inputCls}
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Service Areas (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore North, Hebbal, Yelahanka"
                  value={editForm.serviceArea}
                  onChange={(e) => setEditForm({ ...editForm, serviceArea: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Star Rating (0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Total Completed Jobs</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalJobs}
                    onChange={(e) => setEditForm({ ...editForm, totalJobs: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="border-t border-[#eceef0] pt-3 space-y-3">
                <span className="text-[10px] font-bold text-[#4500b4] uppercase tracking-wider block">Direct Deposit Bank Details:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Account Holder</label>
                    <input
                      placeholder="Account Name"
                      value={editForm.bankAccountName}
                      onChange={(e) => setEditForm({ ...editForm, bankAccountName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>IFSC Code</label>
                    <input
                      placeholder="IFSC Code"
                      value={editForm.bankIfscCode}
                      onChange={(e) => setEditForm({ ...editForm, bankIfscCode: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Account Number</label>
                  <input
                    placeholder="Bank Account Number"
                    value={editForm.bankAccountNo}
                    onChange={(e) => setEditForm({ ...editForm, bankAccountNo: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Admin Verification Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Internal audit notes or instructions..."
                  value={editForm.verificationNotes}
                  onChange={(e) => setEditForm({ ...editForm, verificationNotes: e.target.value })}
                  className="w-full bg-white border border-[#cbc3d8] rounded-lg p-2 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eceef0]">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md"
                >
                  {editLoading ? 'Saving Profile...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
