'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PropertyPhoto {
  id?: string;
  url: string;
}

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  propertyId: string;
}

interface Lead {
  id: string;
  status: string;
  propertyId: string;
  _count?: { messages: number };
}

export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Stats
  const [visitsCount, setVisitsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    purpose: 'SELL', // SELL, RENT
    propertyType: 'APARTMENT',
    locality: '',
    city: '',
    pincode: '',
    bhk: 3,
    bathrooms: 2,
    balconies: 1,
    totalFloors: 5,
    furnishing: 'SEMI_FURNISHED',
    expectedPrice: 0,
    monthlyRent: 0,
    maintenanceCharges: 0,
    securityDeposit: 0,
    status: 'DRAFT',
    photos: [] as string[],
  });

  const [viewCount, setViewCount] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchPropertyAndStats();
  }, [id]);

  const fetchPropertyAndStats = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // 1. Fetch Property Details (from owner listings to include draft details)
      const myListingsRes = await fetch(`${apiBase}/api/v1/properties/my/listings?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listingsData = await myListingsRes.json();
      if (!myListingsRes.ok) throw new Error(listingsData.message || 'Failed to fetch listings');

      const myListings = listingsData.data?.properties || listingsData.properties || [];
      const match = myListings.find((p: any) => p.id === id);

      if (!match) {
        throw new Error('Property listing not found or unauthorized.');
      }

      setForm({
        title: match.title || '',
        description: match.description || '',
        purpose: match.purpose || 'SELL',
        propertyType: match.propertyType || 'APARTMENT',
        locality: match.locality || '',
        city: match.city || '',
        pincode: match.pincode || '',
        bhk: match.bhk || 3,
        bathrooms: match.bathrooms || 2,
        balconies: match.balconies || 1,
        totalFloors: match.totalFloors || 5,
        furnishing: match.furnishing || 'SEMI_FURNISHED',
        expectedPrice: match.expectedPrice ? Number(match.expectedPrice) : 0,
        monthlyRent: match.monthlyRent ? Number(match.monthlyRent) : 0,
        maintenanceCharges: match.maintenanceCharges ? Number(match.maintenanceCharges) : 0,
        securityDeposit: match.securityDeposit ? Number(match.securityDeposit) : 0,
        status: match.status || 'DRAFT',
        photos: match.photos?.map((p: any) => p.url) || [],
      });

      setViewCount(match.viewCount || 0);
      setEnquiryCount(match.enquiryCount || 0);

      // 2. Fetch Owner's Visits
      const visitsRes = await fetch(`${apiBase}/api/v1/visits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (visitsRes.ok) {
        const visitsData = await visitsRes.json();
        const myPropertyVisits = (visitsData.data || visitsData || []).filter((v: Visit) => v.propertyId === id);
        setVisitsCount(myPropertyVisits.length);
      }

      // 3. Fetch Owner's Leads to calculate offers
      const leadsRes = await fetch(`${apiBase}/api/v1/leads?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const myPropertyLeads = (leadsData.data?.leads || leadsData.leads || []).filter((l: Lead) => l.propertyId === id);

        // Fetch offer logs count for each lead
        let offersTotal = 0;
        for (const lead of myPropertyLeads) {
          const offerRes = await fetch(`${apiBase}/api/v1/offers/leads/${lead.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (offerRes.ok) {
            const offerData = await offerRes.json();
            const list = offerData.data || offerData || [];
            offersTotal += list.length;
          }
        }
        setOffersCount(offersTotal);
      }

    } catch (err: any) {
      setError(err.message || 'Error fetching property detail.');
    } finally {
      setLoading(false);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const uploadedUrls = [...form.photos];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const dataUrl = await readFileAsDataUrl(file);
        try {
          const res = await fetch(`${apiBase}/api/v1/storage/upload-direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: dataUrl, folder: 'ziva/properties' }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.url) {
              uploadedUrls.push(data.url);
              continue;
            }
          }
        } catch {
          // fallback to data URL
        }
        uploadedUrls.push(dataUrl);
      }

      setForm((prev) => ({ ...prev, photos: uploadedUrls }));
    } catch (err: any) {
      alert(err.message || 'Photo upload failed.');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== idx),
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const payload = {
        ...form,
        expectedPrice: form.purpose === 'SELL' ? Number(form.expectedPrice) : undefined,
        monthlyRent: form.purpose === 'RENT' ? Number(form.expectedPrice) : undefined,
        securityDeposit: form.purpose === 'RENT' ? Number(form.securityDeposit) : undefined,
        maintenanceCharges: Number(form.maintenanceCharges),
        bhk: Number(form.bhk),
        bathrooms: Number(form.bathrooms),
        balconies: Number(form.balconies),
        totalFloors: Number(form.totalFloors),
      };

      const res = await fetch(`${apiBase}/api/v1/properties/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update property details');

      setSuccess('Listing updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/owner');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Connection failure to API server.');
    } finally {
      setSaving(false);
    }
  };

  // Determine Visual Deal Flow Stepper Index (Listed -> Enquiries -> Visits -> Offers -> Negotiating -> Booked -> Sold)
  const getStepperActiveIndex = () => {
    if (form.status === 'SOLD' || form.status === 'RENTED') return 5; // Sold/Rented
    if (offersCount > 0 && (form.status === 'ACTIVE' || form.status === 'PENDING_REVIEW')) return 4; // Negotiation
    if (offersCount > 0) return 3; // Offer Received
    if (visitsCount > 0) return 2; // Visits Scheduled
    if (enquiryCount > 0) return 1; // Enquiries Received
    if (form.status === 'ACTIVE') return 0; // Listed
    return -1; // Draft or unknown
  };

  const stepsList = [
    { label: 'Listed', desc: 'Listing is public' },
    { label: 'Enquiries', desc: 'Received enquiries' },
    { label: 'Visits', desc: 'Visits scheduled' },
    { label: 'Offer Received', desc: 'Incoming offer log' },
    { label: 'Negotiation', desc: 'Negotiation thread' },
    { label: 'Booked / Sold', desc: 'Deal finalized' },
  ];

  const stepperIndex = getStepperActiveIndex();

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">
      {/* Navbar Header */}
      <header className="bg-white border-b border-[#eceef0] shadow-sm h-16 flex items-center px-6 justify-between w-full sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg text-[#4500b4] tracking-tight">
            Ziva Housing
          </Link>
          <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-[9px] font-extrabold px-2.5 py-0.5 rounded tracking-wider uppercase">
            Property Management
          </span>
        </div>
        <Link
          href="/dashboard/owner"
          className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Dashboard
        </Link>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#eceef0] pb-4">
          <div>
            <h1 className="text-[24px] md:text-[32px] leading-[32px] md:leading-[40px] font-bold text-[#191c1e]">
              Manage Listing
            </h1>
            <p className="text-[13px] leading-[18px] text-[#494455] mt-1">
              Edit specifications, upload photos, change status, and view active deal progress.
            </p>
          </div>
        </div>

        {/* Workspace grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left panel: form inputs */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#cbc3d8] space-y-6">
            <h2 className="text-lg font-bold text-[#191c1e] border-b border-[#eceef0] pb-2">Property Details</h2>

            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3.5 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#e8faf4] text-[#006c47] p-3.5 rounded-xl text-xs font-semibold">
                {success}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Listing Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Semi-Furnished 3 BHK in Orchid Heights"
                  className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] transition-colors bg-[#f8f9fb]"
                />
              </div>

              {/* Description textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Property Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe details regarding rooms, locality, parks, utility pipelines..."
                  className="w-full p-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] transition-colors h-28 resize-none bg-[#f8f9fb]"
                />
              </div>

              {/* Purpose & Type Selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Purpose</label>
                  <select
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white cursor-pointer"
                  >
                    <option value="SELL">For Sale</option>
                    <option value="RENT">For Rent</option>
                    <option value="PG">PG / Hostel</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Property Type</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white cursor-pointer"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="INDEPENDENT_HOUSE">Independent House</option>
                    <option value="VILLA">Villa</option>
                    <option value="PLOT">Plot</option>
                    <option value="STUDIO">Studio Apartment</option>
                  </select>
                </div>
              </div>

              {/* Specs parameters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">BHK</label>
                  <input
                    type="number"
                    value={form.bhk}
                    onChange={(e) => setForm({ ...form, bhk: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-[#f8f9fb]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Bathrooms</label>
                  <input
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-[#f8f9fb]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Balconies</label>
                  <input
                    type="number"
                    value={form.balconies}
                    onChange={(e) => setForm({ ...form, balconies: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-[#f8f9fb]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Furnishing</label>
                  <select
                    value={form.furnishing}
                    onChange={(e) => setForm({ ...form, furnishing: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white cursor-pointer"
                  >
                    <option value="UNFURNISHED">Unfurnished</option>
                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                    <option value="FULLY_FURNISHED">Fully-Furnished</option>
                  </select>
                </div>
              </div>

              {/* Pricing section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f8f9fb] p-5 rounded-2xl border border-[#cbc3d8]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">
                    {form.purpose === 'SELL' ? 'Expected Sale Price (₹)' : 'Monthly Rent (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={form.expectedPrice}
                    onChange={(e) => setForm({ ...form, expectedPrice: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white font-bold text-[#006c47]"
                  />
                </div>

                {form.purpose === 'RENT' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Security Deposit (₹)</label>
                    <input
                      type="number"
                      value={form.securityDeposit}
                      onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                      className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#494455] uppercase tracking-wider">Maintenance Charges (₹)</label>
                  <input
                    type="number"
                    value={form.maintenanceCharges}
                    onChange={(e) => setForm({ ...form, maintenanceCharges: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] focus:border-[#5e23dc] bg-white"
                  />
                </div>
              </div>

              {/* Photos Management */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Property Photos</h3>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="owner-property-edit-photo-input"
                />
                <label
                  htmlFor="owner-property-edit-photo-input"
                  className="border-2 border-dashed border-[#cbc3d8] hover:border-[#5e23dc] rounded-2xl p-6 text-center bg-[#f8f9fb] flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  {uploadLoading ? (
                    <div className="w-8 h-8 border-3 border-[#5e23dc] border-t-transparent rounded-full animate-spin mb-2" />
                  ) : (
                    <span className="material-symbols-outlined text-[#7a7487] text-4xl mb-1">add_a_photo</span>
                  )}
                  <span className="text-xs font-bold text-[#191c1e]">
                    {uploadLoading ? 'Uploading to S3...' : 'Upload Photos'}
                  </span>
                  <span className="text-[10px] text-[#7a7487] mt-0.5">PNG, JPG up to 10MB</span>
                </label>

                {form.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {form.photos.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-[#cbc3d8]">
                        <img src={url} alt="Listing preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/90"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form submit */}
              <div className="flex gap-4 pt-4 border-t border-[#eceef0]">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/owner')}
                  className="border border-[#cbc3d8] text-[#494455] hover:bg-[#f2f4f6] px-8 py-3 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>

          {/* Right Panel: Stepper, Status controls, stats */}
          <section className="lg:col-span-4 space-y-6">

            {/* Status Change Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#cbc3d8] space-y-4">
              <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Listing Status</h3>

              <div className="flex flex-col gap-2">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#cbc3d8] outline-none text-xs text-[#191c1e] bg-[#f8f9fb] font-semibold cursor-pointer"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="ACTIVE">Active (Live)</option>
                  <option value="SOLD">Sold / Rented</option>
                  <option value="ARCHIVED">Archived (Withdrawn)</option>
                </select>

                <p className="text-[10px] text-[#7a7487] leading-normal">
                  Mark as **Sold** or **Rented** once a deal is completed. Set as **Archived** to take down the listing.
                </p>
              </div>
            </div>

            {/* Visual Stepper Tracker */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#cbc3d8] space-y-4">
              <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-base text-[#5e23dc]">route</span>
                Deal Progress Tracker
              </h3>

              <div className="space-y-4 pt-2">
                {stepsList.map((step, idx) => {
                  const isCompleted = idx < stepperIndex;
                  const isActive = idx === stepperIndex;

                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-[#5e23dc] text-white ring-4 ring-[#e8ddff]' :
                            isCompleted ? 'bg-[#16a373] text-white' : 'bg-[#f2f4f6] text-[#7a7487]'
                          }`}>
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        {idx < stepsList.length - 1 && (
                          <div className={`w-0.5 h-8 ${isCompleted ? 'bg-[#16a373]' : 'bg-[#eceef0]'}`} />
                        )}
                      </div>
                      <div className="pb-2">
                        <h4 className={`text-xs font-bold ${isActive ? 'text-[#5e23dc]' : isCompleted ? 'text-[#16a373]' : 'text-gray-500'}`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-[#7a7487] mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Indicators stats card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#cbc3d8] space-y-4">
              <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Performance Indicators</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8f9fb] border border-[#eceef0] p-4 rounded-xl text-center space-y-1">
                  <span className="material-symbols-outlined text-[#7a7487] text-lg">visibility</span>
                  <span className="text-[10px] uppercase font-bold text-[#7a7487] block">Views</span>
                  <span className="text-xl font-bold text-[#191c1e]">{viewCount}</span>
                </div>

                <div className="bg-[#f8f9fb] border border-[#eceef0] p-4 rounded-xl text-center space-y-1">
                  <span className="material-symbols-outlined text-[#5e23dc] text-lg">mail</span>
                  <span className="text-[10px] uppercase font-bold text-[#7a7487] block">Leads</span>
                  <span className="text-xl font-bold text-[#5e23dc]">{enquiryCount}</span>
                </div>

                <div className="bg-[#f8f9fb] border border-[#eceef0] p-4 rounded-xl text-center space-y-1">
                  <span className="material-symbols-outlined text-[#16a373] text-lg">calendar_month</span>
                  <span className="text-[10px] uppercase font-bold text-[#7a7487] block">Visits</span>
                  <span className="text-xl font-bold text-[#16a373]">{visitsCount}</span>
                </div>

                <div className="bg-[#f8f9fb] border border-[#eceef0] p-4 rounded-xl text-center space-y-1">
                  <span className="material-symbols-outlined text-amber-500 text-lg">handshake</span>
                  <span className="text-[10px] uppercase font-bold text-[#7a7487] block">Offers</span>
                  <span className="text-xl font-bold text-amber-600">{offersCount}</span>
                </div>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
