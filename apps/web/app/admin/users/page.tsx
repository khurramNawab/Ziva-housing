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

const DUMMY_PENDING_VENDORS = [
  {
    id: 'vnd-demo-1', firstName: 'Suresh', lastName: 'Yadav', phone: '+91 98765 00001', email: 'suresh.yadav@example.com', createdAt: new Date().toISOString(),
    serviceProviderProfile: {
      id: 'prof-demo-1',
      categoryName: 'Electrician', serviceArea: ['Bangalore', 'Mysore'], verificationStatus: 'PENDING',
      requiresBackgroundCheck: true, backgroundCheckStatus: 'PENDING', verificationNotes: null,
      bankAccountName: 'Suresh Yadav', bankAccountNo: '1234567890', bankIfscCode: 'SBIN0001234',
      idProofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      addressProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      rating: 0, totalJobs: 0,
    },
  },
  {
    id: 'vnd-demo-2', firstName: 'Meena', lastName: 'Kumari', phone: '+91 98765 00002', email: 'meena.k@example.com', createdAt: new Date(Date.now() - 86400000).toISOString(),
    serviceProviderProfile: {
      id: 'prof-demo-2',
      categoryName: 'Deep Cleaning', serviceArea: ['Noida', 'Greater Noida'], verificationStatus: 'CHANGES_REQUESTED',
      requiresBackgroundCheck: false, backgroundCheckStatus: 'NOT_REQUIRED', verificationNotes: 'ID proof is blurry, please re-upload.',
      bankAccountName: null, bankAccountNo: null, bankIfscCode: null,
      idProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      rating: 0, totalJobs: 0,
    },
  },
];

const DUMMY_APPROVED_VENDORS = [
  {
    id: 'vnd-demo-3', firstName: 'Rajesh', lastName: 'Kumar', phone: '+91 98765 00003', email: 'rajesh.k@example.com', createdAt: new Date(Date.now() - 604800000).toISOString(),
    serviceProviderProfile: {
      id: 'prof-demo-3',
      categoryName: 'Electrician', serviceArea: ['Bangalore'], verificationStatus: 'APPROVED',
      requiresBackgroundCheck: true, backgroundCheckStatus: 'PASSED', verificationNotes: null,
      bankAccountName: 'Rajesh Kumar', bankAccountNo: '9876543210', bankIfscCode: 'HDFC0001234',
      idProofUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      rating: 4.9, totalJobs: 342,
    },
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // Tab Selection
  const [adminSubTab, setAdminSubTab] = useState<'USERS' | 'VENDORS' | 'PAYOUTS' | 'BROADCAST' | 'DISPATCHER'>('VENDORS');

  // User States
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('CUSTOMER');
  const [userSearch, setUserSearch] = useState('');
  const [userActionReason, setUserActionReason] = useState('');

  // Vendor States
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState('');

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
      router.push('/auth/login');
      return;
    }
    setToken(accToken);
    fetchData(accToken);
  }, [router, userRoleFilter]);

  const fetchData = async (accToken: string) => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const [usersRes, pendingRes, approvedRes, payoutsRes, bookingsRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/users?limit=50&search=${userSearch}&role=${userRoleFilter}`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/vendors/pending`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/vendors/approved`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/payouts`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/service-bookings`, { headers: { Authorization: `Bearer ${accToken}` } }),
      ]);

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        setUsersList(uJson.data?.users || uJson.users || []);
      }
      if (pendingRes.ok) {
        const pJson = await pendingRes.json();
        setPendingVendors(pJson.data || pJson || []);
      }
      if (approvedRes.ok) {
        const aJson = await approvedRes.json();
        setApprovedVendors(aJson.data || aJson || []);
      }
      if (payoutsRes.ok) {
        const payJson = await payoutsRes.json();
        setPayoutsList(payJson.payouts || []);
        setPayoutStats(payJson.stats || { pendingPayoutAmount: 0, processedPayoutAmount: 0 });
      }
      if (bookingsRes.ok) {
        const bJson = await bookingsRes.json();
        setServiceBookings(bJson.data || bJson || []);
      }
    } catch {
      // Offline fallback
      setPendingVendors(DUMMY_PENDING_VENDORS);
      setApprovedVendors(DUMMY_APPROVED_VENDORS);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND' | 'VERIFY') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason: userActionReason || 'Administrative decision' }),
      });
      if (res.ok) {
        alert(`User status updated to ${action} successfully.`);
        setUserActionReason('');
        fetchData(token);
      } else {
        alert('Action failed.');
      }
    } catch {
      alert('Failed to process user action.');
    }
  };

  const handleVendorAction = async (vendorUserId: string, action: 'APPROVE' | 'CHANGES_REQUESTED' | 'REJECT') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const endpoint = action === 'APPROVE' ? 'approve' : action === 'CHANGES_REQUESTED' ? 'changes-requested' : 'reject';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${vendorUserId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: adminNote || `Admin verification action: ${action}` }),
      });
      if (res.ok) {
        alert(`Vendor document status updated: ${action}`);
        setAdminNote('');
        fetchData(token);
      }
    } catch {
      // Silent
    }
  };

  const handleBackgroundCheckAction = async (vendorUserId: string, status: 'PASSED' | 'FAILED') => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/vendors/${vendorUserId}/background-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, notes: adminNote || `Background check ${status}` }),
      });
      if (res.ok) {
        alert(`Trust & Safety Background Check updated to ${status}.`);
        setAdminNote('');
        fetchData(token);
      }
    } catch {
      alert('Error updating background check status.');
    }
  };

  // ─── Release Payout (Feature 6b) ──────────────────────────────────────────
  const handleReleasePayout = async (payoutId: string) => {
    setReleasingPayoutId(payoutId);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/payouts/${payoutId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: 'Released by Admin' }),
      });
      if (res.ok) {
        alert('Payout marked as PROCESSED successfully!');
        fetchData(token);
      } else {
        alert('Failed to release payout.');
      }
    } catch {
      alert('Error releasing payout.');
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
        alert('Failed to send broadcast notification.');
      }
    } catch {
      alert('Error sending broadcast notification.');
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/service-bookings/${bookingId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newProviderId: targetProviderId }),
      });
      if (res.ok) {
        alert('Service booking reassigned successfully!');
        setTargetProviderId('');
        fetchData(token);
      } else {
        alert('Failed to reassign booking.');
      }
    } catch {
      alert('Error reassigning booking.');
    } finally {
      setReassigningBookingId(null);
    }
  };

  // ─── Create Vendor ──────────────────────────────────────────────────────────
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
        fetchData(token);
      }
    } catch {
      alert('Error creating vendor.');
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#4500b4] uppercase tracking-wider border-b border-[#eceef0] pb-2 flex justify-between">
                <span>Pending Verification ({pendingVendors.length})</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">In Queue</span>
              </h3>

              <div className="space-y-4">
                {pendingVendors.map((vendor) => {
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

                      {/* FEATURE 6A: KYC DOCUMENT PREVIEW BUTTONS */}
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
                            <span className="text-[9px] text-gray-400 italic">No ID proof</span>
                          )}
                          {prof.addressProofUrl ? (
                            <button
                              onClick={() => setPreviewDoc({ url: prof.addressProofUrl, title: `Address Proof — ${vendor.firstName}` })}
                              className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">visibility</span> View Address Proof
                            </button>
                          ) : (
                            <span className="text-[9px] text-gray-400 italic">No address proof</span>
                          )}
                        </div>
                      </div>

                      {/* Verification Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => handleVendorAction(vendor.id, 'APPROVE')} className="flex-1 bg-[#16a373] text-white hover:bg-[#0f6e4d] py-1.5 rounded-lg text-[10px] font-bold transition">Approve Docs</button>
                        <button onClick={() => handleVendorAction(vendor.id, 'CHANGES_REQUESTED')} className="flex-1 bg-amber-500 text-white hover:bg-amber-600 py-1.5 rounded-lg text-[10px] font-bold transition">Req Changes</button>
                        <button onClick={() => handleVendorAction(vendor.id, 'REJECT')} className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approved Vendors */}
            <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#16a373] uppercase tracking-wider border-b border-[#eceef0] pb-2 flex justify-between">
                <span>Active Approved Vendors ({approvedVendors.length})</span>
                <span className="bg-[#e8faf4] text-[#16a373] text-[10px] px-2 py-0.5 rounded-full font-bold">Verified</span>
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {approvedVendors.map((vendor) => {
                  const prof = vendor.serviceProviderProfile || {};
                  return (
                    <div key={vendor.id} className="border border-[#eceef0] p-3 rounded-xl bg-[#f8f9fb] flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-[#191c1e]">{vendor.firstName} {vendor.lastName}</h4>
                        <p className="text-[10px] text-gray-500">Category: {prof.categoryName} • Phone: {vendor.phone}</p>
                        <p className="text-[10px] text-gray-400">Bank: {prof.bankAccountName || 'N/A'} ({prof.bankAccountNo || 'No A/C'})</p>
                      </div>
                      <span className="bg-[#e8faf4] text-[#16a373] text-[9px] font-bold px-2 py-1 rounded-full uppercase border border-[#16a373]/20">Active</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: USER DATABASE
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminSubTab === 'USERS' && (
        <section className="bg-white border border-[#eceef0] rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
            <h2 className="text-sm font-bold text-[#191c1e]">Registered System Users</h2>
            <div className="flex gap-2">
              {['CUSTOMER', 'OWNER', 'AGENT', 'SERVICE_PROVIDER'].map(r => (
                <button key={r} onClick={() => setUserRoleFilter(r)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${userRoleFilter === r ? 'bg-[#5e23dc] text-white' : 'bg-[#f2f4f6] text-gray-600'}`}>{r}</button>
              ))}
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase text-[10px]">
              <tr><th className="p-3">User</th><th className="p-3">Contact</th><th className="p-3">Status</th><th className="p-3 text-center">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {usersList.map(u => (
                <tr key={u.id}>
                  <td className="p-3 font-semibold">{u.firstName} {u.lastName}</td>
                  <td className="p-3">{u.phone}<br/><span className="text-[10px] text-gray-400">{u.email}</span></td>
                  <td className="p-3"><span className="bg-[#e8faf4] text-[#16a373] text-[9px] font-bold px-2 py-0.5 rounded">{u.status}</span></td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleUserAction(u.id, u.status === 'ACTIVE' ? 'BLOCK' : 'UNBLOCK')} className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded">{u.status === 'ACTIVE' ? 'Block' : 'Unblock'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
