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

  // Property Filters
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('');
  const [propertyCityFilter, setPropertyCityFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dialog / Drawer States
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/auth/login');
      return;
    }
    setToken(accToken);
    fetchProperties(accToken);
  }, [router]);

  const dummyPropertiesList: Property[] = [
    {
      id: 'prop-demo-1',
      title: 'Luxury 3BHK Apartment in Indiranagar',
      purpose: 'SELL',
      propertyType: 'APARTMENT',
      locality: 'Indiranagar',
      city: 'Bangalore',
      expectedPrice: 14500000,
      bhk: 3,
      isZivaVerified: false,
      status: 'PENDING_REVIEW',
      duplicateFlag: false,
      fraudFlag: false,
      photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80' }],
      documents: [
        { id: 'doc-1', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Ownership_Title_Deed.pdf', documentType: 'OWNERSHIP_PROOF', isAdminVerified: false },
        { id: 'doc-2', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Encumbrance_Certificate.pdf', documentType: 'ENCUMBRANCE_CERTIFICATE', isAdminVerified: false }
      ],
      ownerProfile: {
        user: {
          firstName: 'Rajesh',
          lastName: 'Sharma',
          phone: '+91 98765 43210',
          email: 'rajesh.sharma@example.com'
        }
      }
    },
    {
      id: 'prop-demo-2',
      title: 'Modern 2BHK Rental Flat near Manyata Tech Park',
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      locality: 'Nagavara',
      city: 'Bangalore',
      monthlyRent: 35000,
      bhk: 2,
      isZivaVerified: true,
      status: 'ACTIVE',
      duplicateFlag: false,
      fraudFlag: false,
      photos: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80' }],
      documents: [
        { id: 'doc-3', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Property_Tax_Receipt.pdf', documentType: 'OWNERSHIP_PROOF', isAdminVerified: true }
      ],
      ownerProfile: {
        user: {
          firstName: 'Priya',
          lastName: 'Nair',
          phone: '+91 98123 45678',
          email: 'priya.nair@example.com'
        }
      }
    },
    {
      id: 'prop-demo-3',
      title: 'Independent 4BHK Villa with Private Garden',
      purpose: 'SELL',
      propertyType: 'VILLA',
      locality: 'Whitefield',
      city: 'Bangalore',
      expectedPrice: 32000000,
      bhk: 4,
      isZivaVerified: false,
      status: 'PENDING_REVIEW',
      duplicateFlag: true,
      fraudFlag: false,
      photos: [{ url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80' }],
      documents: [
        { id: 'doc-4', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'Sale_Deed_Copy.pdf', documentType: 'OWNERSHIP_PROOF', isAdminVerified: false }
      ],
      ownerProfile: {
        user: {
          firstName: 'Vikram',
          lastName: 'Rao',
          phone: '+91 99001 12233',
          email: 'vikram.rao@example.com'
        }
      }
    },
    {
      id: 'prop-demo-4',
      title: 'Studio Apartment near HSR Layout Sector 1',
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      locality: 'HSR Layout',
      city: 'Bangalore',
      monthlyRent: 18000,
      bhk: 1,
      isZivaVerified: false,
      status: 'SUSPENDED',
      duplicateFlag: false,
      fraudFlag: true,
      photos: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80' }],
      ownerProfile: {
        user: {
          firstName: 'Amit',
          lastName: 'Verma',
          phone: '+91 97654 32109',
          email: 'amit.verma@example.com'
        }
      }
    }
  ];

  const fetchProperties = async (accToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const query = `search=${propertySearch}&status=${propertyStatusFilter}&city=${propertyCityFilter}`;
      const res = await fetch(`${apiBase}/api/v1/admin/properties?limit=50&${query}`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const json = await res.json();
      if (res.ok && (json.properties || json.data?.properties)) {
        setPropertiesList(json.data?.properties || json.properties || []);
      } else {
        const fallbackRes = await fetch(`${apiBase}/api/v1/properties?limit=50`);
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          setPropertiesList(fallbackJson.data?.properties || fallbackJson.properties || dummyPropertiesList);
        } else {
          setPropertiesList(dummyPropertiesList);
        }
      }
    } catch {
      setPropertiesList(dummyPropertiesList);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProperty = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedProperty) return;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }

    setReviewing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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

      if (res.ok) {
        alert(`Listing successfully ${action === 'APPROVE' ? 'Approved' : 'Rejected'}.`);
        fetchProperties(token);
        setSelectedProperty(null);
        setAdminNotes('');
        setRejectionReason('');
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Review action failed.');
      }
    } catch (err) {
      alert('Failed to process property review.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSuspendProperty = async (propertyId: string, suspend: boolean) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
        fetchProperties(token);
      } else {
        alert('Failed to update property status.');
      }
    } catch (err) {
      alert('Error updating status.');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to soft delete this property listing?')) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Property soft-deleted successfully.');
        fetchProperties(token);
      } else {
        alert('Failed to delete property.');
      }
    } catch (err) {
      alert('Error deleting property.');
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
            onClick={() => fetchProperties(token)}
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
      ) : (
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
              {propertiesList.map((prop) => (
                <tr key={prop.id} className="hover:bg-[#f2f4f6]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-sm text-[#191c1e]">{prop.title}</div>
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
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setSelectedProperty(prop)}
                        className="bg-[#5e23dc]/10 hover:bg-[#5e23dc]/20 text-[#5e23dc] font-bold px-2 py-1 rounded text-[9px]"
                      >
                        Docs Drawer
                      </button>
                      {prop.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleSuspendProperty(prop.id, false)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[9px] transition"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendProperty(prop.id, true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded text-[9px] transition"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded text-[9px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

              {/* Documents files list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#494455] uppercase">Ownership Deed / Tax Receipt</h4>
                {!selectedProperty.documents || selectedProperty.documents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No deed documents uploaded by seller.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProperty.documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-[#f8f9fb] border border-[#cbc3d8]/60 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-[#191c1e]">{doc.fileName}</p>
                          <p className="text-[10px] text-gray-500">Type: {doc.documentType}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#5e23dc] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-[#4500b4]"
                        >
                          Download
                        </a>
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

            <div className="flex gap-3 pt-6 border-t border-gray-100">
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
      )}
    </div>
  );
}
