'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Property {
  id: string;
  title: string;
  purpose: string;
  propertyType: string;
  locality: string;
  city: string;
  latitude?: number;
  longitude?: number;
  expectedPrice?: number;
  monthlyRent?: number;
  bhk?: number;
  isZivaVerified: boolean;
  status: string;
  duplicateFlag: boolean;
  fraudFlag: boolean;
  fraudNotes?: string;
  adminNotes?: string;
  description?: string;
  addressLine1?: string;
  isFeatured?: boolean;
  photos: Array<{ url: string }>;
  documents?: Array<{ id: string; url: string; fileName: string; documentType: string; isAdminVerified: boolean }>;
  ownerProfile?: {
    user: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
    };
  };
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // Property Filters & Pagination
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertyCityFilter, setPropertyCityFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProperties, setTotalProperties] = useState(0);

  // Dialog / Drawer States
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Edit Listing Modal State (Feature 1a)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    expectedPrice: '',
    monthlyRent: '',
    bhk: '',
    locality: '',
    city: '',
    addressLine1: '',
    description: '',
    correctionReason: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Fraud / Duplicate Modal State (Feature 1b)
  const [flaggingProperty, setFlaggingProperty] = useState<Property | null>(null);
  const [flagForm, setFlagForm] = useState({
    fraudFlag: false,
    duplicateFlag: false,
    fraudNotes: '',
  });
  const [savingFlags, setSavingFlags] = useState(false);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/admin/login');
      return;
    }
    setToken(accToken);
    fetchProperties(accToken, currentPage);
  }, [router, currentPage, pageSize]);

  const fetchProperties = async (accToken: string, page = currentPage) => {
    setLoading(true);
    setError(null);
    let localProps: Property[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('Ziva_custom_properties') || localStorage.getItem('Ziva_owner_properties');
        if (raw) localProps = JSON.parse(raw);
      } catch {}
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (propertySearch.trim()) params.append('search', propertySearch.trim());
      if (propertyStatusFilter.trim()) params.append('status', propertyStatusFilter.trim());
      if (propertyCityFilter.trim()) params.append('city', propertyCityFilter.trim());

      const res = await fetch(`${apiBase}/api/v1/admin/properties?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const json = await res.json();
      if (res.ok && (json.properties || json.data?.properties)) {
        const apiList = json.data?.properties || json.properties || [];
        const total = json.data?.total ?? json.total ?? apiList.length;
        setPropertiesList(apiList);
        setTotalProperties(total);
      } else if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch properties from server.');
      } else {
        setPropertiesList([]);
        setTotalProperties(0);
      }
    } catch (err: any) {
      // In genuine offline scenario, only show user's own local properties if any, otherwise empty
      if (localProps.length > 0) {
        setPropertiesList(localProps);
        setTotalProperties(localProps.length);
        setError('Server offline. Showing local cache properties.');
      } else {
        setPropertiesList([]);
        setTotalProperties(0);
        setError(err.message || 'Error fetching properties. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    fetchProperties(token, 1);
  };

  const handleReviewProperty = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedProperty) return;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }

    setReviewing(true);
    const newStatus = action === 'APPROVE' ? 'ACTIVE' : 'REJECTED';

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const route = action === 'APPROVE' ? 'approve' : 'reject';
      const payload = action === 'APPROVE'
        ? { adminNotes }
        : { rejectionReason, adminNotes };

      const res = await fetch(`${apiBase}/api/v1/admin/properties/${selectedProperty.id}/${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to ${action.toLowerCase()} listing.`);
      }

      // Update local storage only if backend succeeded
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('Ziva_custom_properties') || localStorage.getItem('Ziva_owner_properties');
          if (raw) {
            const parsed = JSON.parse(raw);
            const updated = parsed.map((p: any) =>
              p.id === selectedProperty.id ? { ...p, status: newStatus, isZivaVerified: action === 'APPROVE' } : p
            );
            localStorage.setItem('Ziva_custom_properties', JSON.stringify(updated));
            localStorage.setItem('Ziva_owner_properties', JSON.stringify(updated));
          }
        } catch {}
      }

      // Update local state immediately
      setPropertiesList((prev) =>
        prev.map((p) => (p.id === selectedProperty.id ? { ...p, status: newStatus, isZivaVerified: action === 'APPROVE' } : p))
      );

      alert(`Listing successfully ${action === 'APPROVE' ? 'Approved & Made Live' : 'Rejected'}.`);
      setSelectedProperty(null);
      setAdminNotes('');
      setRejectionReason('');
      fetchProperties(token, currentPage);
    } catch (err: any) {
      alert(`Error reviewing listing: ${err.message || 'Operation failed. Please try again.'}`);
    } finally {
      setReviewing(false);
    }
  };

  const handleSuspendProperty = async (propertyId: string, suspend: boolean) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const route = suspend ? 'suspend' : 'unsuspend';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${propertyId}/${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Admin toggle override' }),
      });
      if (res.ok) {
        alert(`Property status successfully set to: ${suspend ? 'SUSPENDED' : 'ACTIVE'}`);
        fetchProperties(token, currentPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to update property status.');
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message || 'Network error'}`);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to soft delete this property listing?')) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Property soft-deleted successfully.');
        fetchProperties(token, currentPage);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Failed to delete property.');
      }
    } catch (err: any) {
      alert(`Error deleting property: ${err.message || 'Network error'}`);
    }
  };

  // Feature 1a: Admin Direct Listing Edit Handlers
  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop);
    setEditForm({
      title: prop.title || '',
      expectedPrice: prop.expectedPrice ? String(prop.expectedPrice) : '',
      monthlyRent: prop.monthlyRent ? String(prop.monthlyRent) : '',
      bhk: prop.bhk ? String(prop.bhk) : '',
      locality: prop.locality || '',
      city: prop.city || '',
      addressLine1: prop.addressLine1 || '',
      description: prop.description || '',
      correctionReason: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProperty) return;
    if (!editForm.correctionReason.trim()) {
      alert('Please provide an administrative correction reason for audit logging.');
      return;
    }
    setSavingEdit(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${editingProperty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          expectedPrice: editForm.expectedPrice ? Number(editForm.expectedPrice) : undefined,
          monthlyRent: editForm.monthlyRent ? Number(editForm.monthlyRent) : undefined,
          bhk: editForm.bhk ? Number(editForm.bhk) : undefined,
          locality: editForm.locality,
          city: editForm.city,
          addressLine1: editForm.addressLine1,
          description: editForm.description,
          correctionReason: editForm.correctionReason,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update property listing');
      }
      alert('Listing updated successfully and change recorded in AuditLog.');
      setEditingProperty(null);
      fetchProperties(token, currentPage);
    } catch (err: any) {
      alert(err.message || 'Error updating listing');
    } finally {
      setSavingEdit(false);
    }
  };

  // Feature 1b: Manual Fraud & Duplicate Flags Handlers
  const handleOpenFlags = (prop: Property) => {
    setFlaggingProperty(prop);
    setFlagForm({
      fraudFlag: !!prop.fraudFlag,
      duplicateFlag: !!prop.duplicateFlag,
      fraudNotes: prop.fraudNotes || '',
    });
  };

  const handleSaveFlags = async () => {
    if (!flaggingProperty) return;
    setSavingFlags(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${flaggingProperty.id}/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(flagForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update property flags');
      }
      alert('Fraud and duplicate flags updated successfully.');
      setFlaggingProperty(null);
      fetchProperties(token, currentPage);
    } catch (err: any) {
      alert(err.message || 'Error updating flags');
    } finally {
      setSavingFlags(false);
    }
  };

  // Feature 1c: Granular Document-by-Document Verification Handler
  const handleVerifyDocument = async (propId: string, docId: string, isVerified: boolean) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${propId}/documents/${docId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isVerified,
          notes: isVerified ? 'Verified by Admin review' : 'Re-upload requested by Admin',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update document verification');
      }
      alert(`Document marked as: ${isVerified ? 'VERIFIED ✓' : 'RE-UPLOAD REQUIRED ✕'}`);
      // Update selectedProperty in place
      setSelectedProperty((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          documents: (prev.documents || []).map((d) =>
            d.id === docId ? { ...d, isAdminVerified: isVerified } : d
          ),
        };
      });
      fetchProperties(token, currentPage);
    } catch (err: any) {
      alert(err.message || 'Error updating document status');
    }
  };

  // Feature 1d: Featured / Top-Pin Listing Handler
  const handleToggleFeatured = async (prop: Property) => {
    const willFeature = !(prop.isFeatured || (prop.adminNotes && prop.adminNotes.includes('[FEATURED]')));
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${prop.id}/toggle-featured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFeatured: willFeature }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to toggle featured status');
      }
      alert(`Listing is now: ${willFeature ? 'FEATURED ⭐ (Pinned to search top)' : 'UNFEATURED'}`);
      fetchProperties(token, currentPage);
    } catch (err: any) {
      alert(err.message || 'Error updating featured status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#cbc3d8]/50 pb-4">
        <div>
          <h1 className="text-xl font-bold">Property Listings Moderator</h1>
          <p className="text-xs text-[#494455] mt-1">Review active, pending, suspended, or duplicate properties.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Title..."
            value={propertySearch}
            onChange={(e) => setPropertySearch(e.target.value)}
            className="h-10 bg-white border border-[#cbc3d8] rounded-xl px-4 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] w-full md:w-44"
          />
          <select
            value={propertyStatusFilter}
            onChange={(e) => setPropertyStatusFilter(e.target.value)}
            className="h-10 bg-white border border-[#cbc3d8] rounded-xl px-2 text-xs outline-none text-[#191c1e]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_REVIEW">PENDING REVIEW</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <input
            type="text"
            placeholder="City..."
            value={propertyCityFilter}
            onChange={(e) => setPropertyCityFilter(e.target.value)}
            className="h-10 bg-white border border-[#cbc3d8] rounded-xl px-3 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] w-24"
          />
          <button
            onClick={handleApplyFilter}
            className="bg-[#5e23dc] hover:bg-[#4500b4] text-white h-10 px-4 rounded-xl text-xs font-bold transition"
          >
            Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-rose-600 text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
        </div>
      ) : propertiesList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#cbc3d8] p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#f2f4f6] rounded-full flex items-center justify-center mx-auto text-[#7a7487]">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#191c1e]">No Properties Found</h3>
            <p className="text-xs text-[#7a7487] mt-1">
              No listings matched your active search or filter criteria.
            </p>
          </div>
          <button
            onClick={() => {
              setPropertySearch('');
              setPropertyStatusFilter('');
              setPropertyCityFilter('');
              setCurrentPage(1);
              fetchProperties(token, 1);
            }}
            className="px-4 py-2 bg-[#5e23dc] text-white text-xs font-bold rounded-xl hover:bg-[#4500b4] transition inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-[#eceef0] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase tracking-wider border-b border-[#eceef0]">
                <tr>
                  <th className="px-5 py-3">Property Title</th>
                  <th className="px-5 py-3">Landlord Name</th>
                  <th className="px-5 py-3">BHK / City</th>
                  <th className="px-5 py-3">Duplicate/Fraud Flags</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {propertiesList.map((prop) => {
                  const isFeatured = prop.isFeatured || (prop.adminNotes && prop.adminNotes.includes('[FEATURED]'));
                  return (
                    <tr key={prop.id} className="hover:bg-[#f2f4f6]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-[#191c1e]">{prop.title}</span>
                          {isFeatured && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                              ⭐ FEATURED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7a7487] mt-0.5">{prop.locality}, {prop.city}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#191c1e]">
                          {prop.ownerProfile?.user?.firstName} {prop.ownerProfile?.user?.lastName}
                        </div>
                        <div className="text-[10px] text-[#7a7487] mt-0.5">{prop.ownerProfile?.user?.phone}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#4500b4] uppercase">
                        {prop.bhk} BHK | {prop.propertyType}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {prop.duplicateFlag && (
                            <span className="bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                              DUPLICATE
                            </span>
                          )}
                          {prop.fraudFlag && (
                            <span className="bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                              OUTLIER PRICE
                            </span>
                          )}
                          {!prop.duplicateFlag && !prop.fraudFlag && (
                            <span className="text-gray-400 italic">Clear</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${prop.status === 'ACTIVE' ? 'bg-[#e8faf4] text-[#16a373]' :
                            prop.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-700' :
                              prop.status === 'PENDING_REVIEW' ? 'bg-blue-100 text-blue-700' : 'bg-red-50 text-red-700'
                          }`}>
                          {prop.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-wrap gap-1.5 justify-center items-center">
                          <button
                            onClick={() => setSelectedProperty(prop)}
                            className="bg-[#5e23dc]/10 hover:bg-[#5e23dc]/20 text-[#5e23dc] font-bold px-2 py-1 rounded text-[9px]"
                            title="Verify Documents"
                          >
                            Docs Drawer
                          </button>
                          <button
                            onClick={() => handleOpenEdit(prop)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold px-2 py-1 rounded text-[9px]"
                            title="Edit Listing Details (Admin Override)"
                          >
                            Edit ✏️
                          </button>
                          <button
                            onClick={() => handleOpenFlags(prop)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-1 rounded text-[9px]"
                            title="Set Fraud / Duplicate Flags"
                          >
                            Flags ⚠️
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(prop)}
                            className={`font-bold px-2 py-1 rounded text-[9px] border transition ${
                              isFeatured
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-gray-100 hover:bg-amber-50 text-gray-700 border-gray-200'
                            }`}
                            title="Toggle Featured / Pin to Search Top"
                          >
                            {isFeatured ? '⭐ Pinned' : '⭐ Pin'}
                          </button>
                          {prop.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleSuspendProperty(prop.id, false)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[9px] transition"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendProperty(prop.id, true)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded text-[9px] transition"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[9px]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-white border border-[#eceef0] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs shadow-sm">
            <div className="text-gray-500 font-medium">
              Showing <span className="font-bold text-[#191c1e]">{totalProperties === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-[#191c1e]">{Math.min(currentPage * pageSize, totalProperties)}</span> of{' '}
              <span className="font-bold text-[#191c1e]">{totalProperties}</span> properties
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-[11px]">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-2 py-1 text-xs outline-none font-bold text-[#191c1e]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#cbc3d8] text-[#191c1e] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Previous
                </button>
                <span className="px-2 font-bold text-[#4500b4]">
                  {currentPage} / {Math.max(1, Math.ceil(totalProperties / pageSize))}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= Math.ceil(totalProperties / pageSize)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#cbc3d8] text-[#191c1e] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docs verification drawer overlay modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-end z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white h-full max-w-lg w-full p-6 space-y-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#191c1e]">Listing verification documents</h3>
                  <p className="text-[10px] text-gray-500">Property: {selectedProperty.title}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Photos check */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#494455] uppercase">Property Photos Preview</h4>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProperty.photos.map((p, idx) => (
                    <div key={idx} className="h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={p.url} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Granular Documents verification */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#494455] uppercase">Ownership Deed / Tax Receipt / NOC</h4>
                {!selectedProperty.documents || selectedProperty.documents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No deed documents uploaded by seller.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProperty.documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-[#f8f9fb] border border-[#cbc3d8]/60 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-[#191c1e]">{doc.fileName}</p>
                            <p className="text-[10px] text-gray-500">Type: {doc.documentType}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            doc.isAdminVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.isAdminVerified ? 'Verified ✓' : 'Pending Review'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2.5 py-1 rounded text-[10px] font-bold"
                          >
                            View Doc
                          </a>
                          <button
                            type="button"
                            onClick={() => handleVerifyDocument(selectedProperty.id, doc.id, true)}
                            disabled={doc.isAdminVerified}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                          >
                            Verify ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyDocument(selectedProperty.id, doc.id, false)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold transition"
                          >
                            Re-upload ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Geo Coordinates & Map Location Verification */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-[#494455] uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#5e23dc]">location_on</span>
                  <span>Map Location &amp; Coordinates</span>
                </h4>
                <div className="p-3 bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-bold text-[#191c1e] text-right">{selectedProperty.locality}, {selectedProperty.city}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">Coordinates:</span>
                    <span className="font-mono font-bold text-[#5e23dc]">
                      {selectedProperty.latitude || 12.9716}, {selectedProperty.longitude || 77.5946}
                    </span>
                  </div>
                  <div className="h-32 rounded-lg overflow-hidden border border-[#cbc3d8] relative mt-2">
                    <iframe
                      title="Admin Property Map Preview"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(selectedProperty.longitude || 77.5946) - 0.01}%2C${(selectedProperty.latitude || 12.9716) - 0.01}%2C${(selectedProperty.longitude || 77.5946) + 0.01}%2C${(selectedProperty.latitude || 12.9716) + 0.01}&layer=mapnik&marker=${selectedProperty.latitude || 12.9716}%2C${selectedProperty.longitude || 77.5946}`}
                      className="w-full h-[calc(100%+38px)] border-none pointer-events-auto"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Moderator notes */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#494455] uppercase">Administrative notes</label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter approval details or audit observations..."
                    className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs outline-none text-[#191c1e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#494455] uppercase">Rejection reason (Required for Rejects)</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Deed owner name mismatch"
                    className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs outline-none text-[#191c1e]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-100">
              {/* Verification reminder alert */}
              {selectedProperty.documents && selectedProperty.documents.some((d) => !d.isAdminVerified) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-xl text-[11px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
                  <span><strong>Notice:</strong> Some documents are pending verification. Verify individual deeds before approving listing.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewProperty('APPROVE')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span> Approve
                </button>
                <button
                  type="button"
                  disabled={reviewing}
                  onClick={() => handleReviewProperty('REJECT')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1a: Admin Edit Listing Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#191c1e]">Edit Listing (Admin Override)</h3>
                <p className="text-xs text-gray-500">Correct price typos, BHK, address, or descriptions. Logged to AuditLog.</p>
              </div>
              <button onClick={() => setEditingProperty(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Property Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Expected Sale Price (₹)</label>
                <input
                  type="number"
                  value={editForm.expectedPrice}
                  onChange={(e) => setEditForm({ ...editForm, expectedPrice: e.target.value })}
                  placeholder="e.g. 15000000"
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={editForm.monthlyRent}
                  onChange={(e) => setEditForm({ ...editForm, monthlyRent: e.target.value })}
                  placeholder="e.g. 45000"
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">BHK Count</label>
                <input
                  type="number"
                  value={editForm.bhk}
                  onChange={(e) => setEditForm({ ...editForm, bhk: e.target.value })}
                  placeholder="e.g. 3"
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Locality</label>
                <input
                  type="text"
                  value={editForm.locality}
                  onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Address Line</label>
                <input
                  type="text"
                  value={editForm.addressLine1}
                  onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="col-span-2 space-y-1 border-t border-gray-100 pt-3">
                <label className="font-bold text-rose-700 uppercase text-[10px]">
                  Administrative Correction Reason (Mandatory for AuditLog) *
                </label>
                <input
                  type="text"
                  value={editForm.correctionReason}
                  onChange={(e) => setEditForm({ ...editForm, correctionReason: e.target.value })}
                  placeholder="e.g. Corrected obvious typo: entered 15k instead of 1.5 Cr per sale deed"
                  className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-2 outline-none text-xs text-rose-900 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-[#5e23dc] hover:bg-[#4500b4] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {savingEdit ? 'Saving...' : 'Save & Log Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1b: Manual Fraud & Duplicate Flags Modal */}
      {flaggingProperty && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#191c1e]">Flag Property Listing</h3>
                <p className="text-xs text-gray-500">Property: {flaggingProperty.title}</p>
              </div>
              <button onClick={() => setFlaggingProperty(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center gap-3 p-3 bg-[#f8f9fb] border border-[#cbc3d8]/60 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagForm.fraudFlag}
                  onChange={(e) => setFlagForm({ ...flagForm, fraudFlag: e.target.checked })}
                  className="w-4 h-4 text-[#5e23dc] rounded"
                />
                <div>
                  <p className="font-bold text-[#191c1e]">Flag as Potential Fraud / Suspicious</p>
                  <p className="text-[10px] text-gray-500">Outlier pricing, suspicious identity, or fake listing details.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#f8f9fb] border border-[#cbc3d8]/60 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagForm.duplicateFlag}
                  onChange={(e) => setFlagForm({ ...flagForm, duplicateFlag: e.target.checked })}
                  className="w-4 h-4 text-[#5e23dc] rounded"
                />
                <div>
                  <p className="font-bold text-[#191c1e]">Flag as Duplicate Listing</p>
                  <p className="text-[10px] text-gray-500">Multiple postings for the same address or unit.</p>
                </div>
              </label>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Investigation / Fraud Notes</label>
                <textarea
                  rows={3}
                  value={flagForm.fraudNotes}
                  onChange={(e) => setFlagForm({ ...flagForm, fraudNotes: e.target.value })}
                  placeholder="Document reason for flag, owner contact notes, or matching listing IDs..."
                  className="w-full bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none focus:border-[#5e23dc]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFlaggingProperty(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingFlags}
                onClick={handleSaveFlags}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                {savingFlags ? 'Updating...' : 'Save Flags'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
