'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PostPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Media upload loadings
  const [uploadLoading, setUploadLoading] = useState(false);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Media preview modal state
  const [previewItem, setPreviewItem] = useState<{ url: string; title: string; type: 'image' | 'pdf' } | null>(null);

  // Wizard state
  const [form, setForm] = useState({
    purpose: 'SELL',
    propertyType: 'APARTMENT',
    title: '',
    description: '',
    addressLine1: '',
    addressLine2: '',
    locality: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '',
    latitude: 12.9716,
    longitude: 77.5946,
    bhk: '2',
    bathrooms: '2',
    balconies: '1',
    totalFloors: '5',
    furnishing: 'SEMI_FURNISHED',
    expectedPrice: '',
    maintenanceCharges: '',
    securityDeposit: '',
    photos: [] as string[],
    documents: [] as Array<{ url: string; documentType: string; fileName: string }>,
  });

  const [geocoding, setGeocoding] = useState(false);

  // Safe localStorage helper to prevent QuotaExceededError
  const safeSaveDraft = (data: typeof form) => {
    try {
      const draft = {
        ...data,
        photos: data.photos.filter((p) => !p.startsWith('data:') || p.length < 50000),
        documents: data.documents.map((d) => ({
          ...d,
          url: d.url.startsWith('data:') && d.url.length > 50000 ? '' : d.url,
        })),
      };
      localStorage.setItem('post_property_draft', JSON.stringify(draft));
    } catch {
      // Gracefully ignore local storage quota limit exceptions
    }
  };

  const autoGeocodeAddress = async () => {
    const fullQuery = `${form.addressLine1} ${form.locality} ${form.city} ${form.pincode}`.trim();
    if (!fullQuery) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullQuery)}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(Number(data[0].lat).toFixed(6));
        const lon = parseFloat(Number(data[0].lon).toFixed(6));
        setForm((prev) => {
          const updated = { ...prev, latitude: lat, longitude: lon };
          safeSaveDraft(updated);
          return updated;
        });
      }
    } catch {
      // ignore
    } finally {
      setGeocoding(false);
    }
  };

  const useDeviceLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lon = parseFloat(pos.coords.longitude.toFixed(6));
          setForm((prev) => {
            const updated = { ...prev, latitude: lat, longitude: lon };
            safeSaveDraft(updated);
            return updated;
          });
          setGeocoding(false);
        },
        () => setGeocoding(false)
      );
    }
  };

  // Check auth, restore draft, and sync step history on mount
  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    setIsLoggedIn(!!token);

    const savedDraft = localStorage.getItem('post_property_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }

    // Read initial step from URL if present
    const params = new URLSearchParams(window.location.search);
    const initialStep = parseInt(params.get('step') || '1', 10);
    if (initialStep >= 1 && initialStep <= 8) {
      setStep(initialStep);
      window.history.replaceState({ step: initialStep }, '', `/post-property?step=${initialStep}`);
    } else {
      window.history.replaceState({ step: 1 }, '', '/post-property?step=1');
    }

    // Listen to browser Back/Forward buttons
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && typeof e.state.step === 'number' && e.state.step >= 1 && e.state.step <= 8) {
        setStep(e.state.step);
      } else {
        const p = new URLSearchParams(window.location.search);
        const s = parseInt(p.get('step') || '1', 10);
        if (s >= 1 && s <= 8) {
          setStep(s);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const validateCurrentStep = () => {
    setError('');
    if (step === 3) {
      if (!form.addressLine1.trim() || !form.locality.trim() || !form.city.trim() || !form.pincode.trim()) {
        setError('Please enter complete location details (Address, Locality, City, and Pincode).');
        return false;
      }
      const cleanPincode = form.pincode.replace(/\D/g, '').trim();
      if (cleanPincode.length !== 6 || !/^\d{6}$/.test(cleanPincode)) {
        setError(`Please enter a valid 6-digit Indian Pincode (e.g. 560038). You entered ${cleanPincode.length} digits.`);
        return false;
      }
    } else if (step === 4) {
      if (!form.title.trim()) {
        setError('Please enter a descriptive property title/headline.');
        return false;
      }
    } else if (step === 5) {
      if (!form.expectedPrice || Number(form.expectedPrice) <= 0) {
        setError('Please enter a valid expected price or monthly rent.');
        return false;
      }
    }
    return true;
  };

  const goToStep = (targetStep: number) => {
    setError('');
    if (targetStep > step && !validateCurrentStep()) return;
    const bounded = Math.max(1, Math.min(targetStep, 8));
    setStep(bounded);
    window.history.pushState({ step: bounded }, '', `/post-property?step=${bounded}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    goToStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    goToStep(step - 1);
  };

  const handleResetWizard = () => {
    try {
      localStorage.removeItem('post_property_draft');
    } catch {
      // ignore
    }
    setSubmitted(false);
    setStep(1);
    setError('');
    setForm({
      purpose: 'SELL',
      propertyType: 'APARTMENT',
      title: '',
      description: '',
      addressLine1: '',
      addressLine2: '',
      locality: '',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '',
      latitude: 12.9716,
      longitude: 77.5946,
      bhk: '2',
      bathrooms: '2',
      balconies: '1',
      totalFloors: '5',
      furnishing: 'SEMI_FURNISHED',
      expectedPrice: '',
      maintenanceCharges: '',
      securityDeposit: '',
      photos: [],
      documents: [],
    });
  };

  // Helper to convert File to base64 string
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload single photo with direct cloud backend & automatic base64 fallback
  const uploadSingleMedia = async (file: File, folder: string): Promise<string> => {
    const dataUrl = await readFileAsDataUrl(file);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const res = await fetch(`${apiBase}/api/v1/storage/upload-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: dataUrl, folder }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) return data.url;
      }
    } catch {
      // Backend upload error fallback
    }
    return dataUrl;
  };

  // Handle Multi-Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.photos.length >= 15) {
      setError('You have reached the maximum limit of 15 property photos.');
      e.target.value = '';
      return;
    }

    setUploadLoading(true);
    setError('');
    const newUploaded: string[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        if (file.size > MAX_SIZE) {
          setError(`Photo "${file.name}" exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please select photos under 10MB.`);
          continue;
        }

        if (form.photos.length + newUploaded.length >= 15) {
          setError('Maximum limit of 15 property photos reached. Extra photos were skipped.');
          break;
        }

        setUploadProgress(`Uploading photo ${i + 1} of ${files.length}...`);
        const uploadedUrl = await uploadSingleMedia(file, 'ziva/properties');
        newUploaded.push(uploadedUrl);
      }

      setForm((prev) => {
        const updatedPhotos = [...prev.photos, ...newUploaded];
        safeSaveDraft({ ...prev, photos: updatedPhotos });
        return { ...prev, photos: updatedPhotos };
      });
    } catch (err: any) {
      setError(err.message || 'Photo upload encountered an issue.');
    } finally {
      setUploadLoading(false);
      setUploadProgress('');
      e.target.value = ''; // Reset input to allow re-uploading same file
    }
  };

  // Handle Multi-Document Upload (Proof of ownership)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.documents.length >= 10) {
      setError('You have reached the maximum limit of 10 verification documents.');
      e.target.value = '';
      return;
    }

    setDocUploadLoading(true);
    setError('');
    const newDocs: Array<{ url: string; documentType: string; fileName: string }> = [];
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        if (file.size > MAX_SIZE) {
          setError(`Document "${file.name}" exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please select documents under 15MB.`);
          continue;
        }

        if (form.documents.length + newDocs.length >= 10) {
          setError('Maximum limit of 10 verification documents reached. Extra files were skipped.');
          break;
        }

        setUploadProgress(`Uploading document ${i + 1} of ${files.length}...`);
        const uploadedUrl = await uploadSingleMedia(file, 'ziva/documents');
        newDocs.push({
          url: uploadedUrl,
          documentType: 'OWNERSHIP_PROOF',
          fileName: file.name,
        });
      }

      setForm((prev) => {
        const updatedDocs = [...prev.documents, ...newDocs];
        safeSaveDraft({ ...prev, documents: updatedDocs });
        return { ...prev, documents: updatedDocs };
      });
    } catch (err: any) {
      setError(err.message || 'Document upload encountered an issue.');
    } finally {
      setDocUploadLoading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setForm((prev) => {
      const updatedPhotos = prev.photos.filter((_, idx) => idx !== index);
      safeSaveDraft({ ...prev, photos: updatedPhotos });
      return { ...prev, photos: updatedPhotos };
    });
  };

  const handleRemoveDoc = (index: number) => {
    setForm((prev) => {
      const updatedDocs = prev.documents.filter((_, idx) => idx !== index);
      safeSaveDraft({ ...prev, documents: updatedDocs });
      return { ...prev, documents: updatedDocs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      localStorage.setItem('post_property_draft', JSON.stringify(form));
      setError('Please log in to submit your property listing. Your details have been saved safely.');
      setLoading(false);
      return;
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const payload = {
        purpose: form.purpose,
        propertyType: form.propertyType,
        title: form.title,
        description: form.description,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        locality: form.locality,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        bhk: Number(form.bhk),
        bathrooms: Number(form.bathrooms),
        balconies: Number(form.balconies),
        totalFloors: Number(form.totalFloors),
        furnishing: form.furnishing,
        expectedPrice: form.purpose === 'SELL' ? Number(form.expectedPrice) : undefined,
        monthlyRent: form.purpose === 'RENT' ? Number(form.expectedPrice) : undefined,
        securityDeposit: form.purpose === 'RENT' ? Number(form.securityDeposit) : undefined,
        photos: form.photos,
        documents: form.documents,
      };

      const res = await fetch(`${apiBase}/api/v1/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.setItem('post_property_draft', JSON.stringify(form));
        setError('Your login session has expired. Please log in again to publish your listing.');
        return;
      }

      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem('post_property_draft');
        setSubmitted(true);
      } else {
        setError(data.message || 'Submission failed. Please check required fields.');
      }
    } catch {
      setError('Connection to server failed. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const stepsInfo = [
    { num: 1, name: 'Purpose', icon: 'sell', desc: 'Sale or Rent' },
    { num: 2, name: 'Property Type', icon: 'apartment', desc: 'Flat, House, PG' },
    { num: 3, name: 'Location', icon: 'location_on', desc: 'Address & Coordinates' },
    { num: 4, name: 'Property Details', icon: 'home_work', desc: 'BHK, Floor & Size' },
    { num: 5, name: 'Pricing', icon: 'payments', desc: 'Price & Charges' },
    { num: 6, name: 'Photos / Media', icon: 'add_photo_alternate', desc: 'Upload Images' },
    { num: 7, name: 'Verification Docs', icon: 'verified_user', desc: 'Proof of Ownership' },
    { num: 8, name: 'Preview & Submit', icon: 'rate_review', desc: 'Verify & Publish' },
  ];

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Header banner */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-[#cbc3d8] mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="bg-[#f2f4f6] hover:bg-[#e8ddff] text-[#5e23dc] px-3 py-2 rounded-xl border border-[#cbc3d8] flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm font-bold text-xs"
                title={`Go back to Step ${step - 1} (${stepsInfo[step - 2]?.name})`}
              >
                <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                <span>Back to Step {step - 1}</span>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#f5f1fd] text-[#5e23dc] flex items-center justify-center border border-[#e8ddff] shrink-0">
                <span className="material-symbols-outlined text-xl">real_estate_agent</span>
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#191c1e]">Post Your Property Listing</h1>
              <p className="text-xs text-[#7a7487] mt-0.5">Step {step} of 8: <strong className="text-[#5e23dc]">{stepsInfo[step - 1]?.name}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-xs text-[#7a7487] hover:text-[#5e23dc] px-2.5 py-1.5 rounded-lg hover:bg-[#f2f4f6] font-medium transition cursor-pointer"
                title="Restart from Step 1"
              >
                Start Over
              </button>
            )}
            <Link
              href="/dashboard/owner"
              className="text-xs font-semibold text-[#7a7487] hover:text-[#ba1a1a] hover:bg-red-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-200 transition flex items-center gap-1"
            >
              Exit Wizard <span className="material-symbols-outlined text-sm">close</span>
            </Link>
          </div>
        </div>

        {/* Auth Notice if not logged in */}
        {!isLoggedIn && (
          <div className="bg-[#e8ddff]/50 border border-[#7c3aed]/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5 text-[#4500b4]">
              <span className="material-symbols-outlined text-lg">info</span>
              <span><strong>Notice:</strong> Please log in to publish and link this listing to your Owner Dashboard.</span>
            </div>
            <Link
              href="/auth/login?redirect=/post-property"
              className="bg-[#5e23dc] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#4500b4] whitespace-nowrap shadow-sm transition"
            >
              Log In Now
            </Link>
          </div>
        )}

        {submitted ? (
          <div className="bg-white rounded-2xl border border-[#cbc3d8] p-12 text-center space-y-6 shadow-sm">
            <span className="material-symbols-outlined text-[#5e23dc] text-6xl">verified</span>
            <h1 className="text-2xl font-bold text-[#191c1e]">Property Listing Submitted!</h1>
            <p className="text-sm text-[#7a7487] max-w-md mx-auto">
              Your property has been submitted for admin verification. Listings with a **Ziva Verified** badge receive up to 5x more organic leads.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/dashboard/owner" className="bg-[#5e23dc] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#4500b4] shadow-md transition-all">
                Go to My Properties
              </Link>
              <button
                onClick={handleResetWizard}
                className="border-2 border-[#5e23dc] text-[#5e23dc] hover:bg-[#5e23dc]/5 px-6 py-3 rounded-xl font-bold text-xs transition-colors"
              >
                Post Another Property
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#cbc3d8] p-6 md:p-8 shadow-sm space-y-6">
            {/* Interactive Step Navigator Pills (Responsive Grid - No Horizontal Scrollbar) */}
            <div className="space-y-3 pb-2 border-b border-[#cbc3d8]/60">
              <div className="flex justify-between items-center text-xs font-bold text-[#7a7487]">
                <span className="flex items-center gap-1.5 text-[#191c1e]">
                  <span className="w-2 h-2 rounded-full bg-[#5e23dc]"></span>
                  Step {step} of 8: <span className="text-[#5e23dc] font-bold">{stepsInfo[step - 1]?.name}</span>
                </span>
                <span className="bg-[#f2f4f6] px-2.5 py-1 rounded-full text-[11px] text-[#5e23dc]">
                  {Math.round((step / 8) * 100)}% Complete
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-[#f2f4f6] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#5e23dc] h-full transition-all duration-300"
                  style={{ width: `${(step / 8) * 100}%` }}
                />
              </div>

              {/* Responsive 8-Step Navigation (Fits on all screens without horizontal scrollbar) */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {stepsInfo.map((s) => {
                  const isCurrent = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => goToStep(s.num)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-semibold transition cursor-pointer border text-center ${
                        isCurrent
                          ? 'bg-[#5e23dc] text-white border-[#5e23dc] shadow-sm'
                          : isCompleted
                          ? 'bg-[#f5f1fd] text-[#5e23dc] border-[#e8ddff] hover:bg-[#e8ddff]'
                          : 'bg-[#f8f9fb] text-[#7a7487] border-[#cbc3d8]/50 hover:bg-[#f2f4f6]'
                      }`}
                      title={`Jump to Step ${s.num}: ${s.name}`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 ${
                        isCurrent ? 'bg-white text-[#5e23dc]' : isCompleted ? 'bg-[#5e23dc] text-white' : 'bg-[#e2e4e8] text-[#7a7487]'
                      }`}>
                        {isCompleted ? '✓' : s.num}
                      </span>
                      <span className="truncate w-full text-[10px] sm:text-[11px] leading-tight">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
                <span>{error}</span>
                {error.includes('log in') && (
                  <Link
                    href="/auth/login?redirect=/post-property"
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shrink-0"
                  >
                    Log In
                  </Link>
                )}
              </div>
            )}

            {/* Step Content */}
            <form onSubmit={handleSubmit} className="space-y-6 min-h-[300px]">
              {/* STEP 1: Purpose */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#191c1e]">What is your listing purpose?</h2>
                  <p className="text-xs text-[#7a7487]">Select whether you want to list this property for sale or rent.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['SELL', 'RENT'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, purpose: p })}
                        className={`p-6 rounded-2xl border-2 text-center transition flex flex-col items-center gap-3 cursor-pointer ${form.purpose === p
                          ? 'border-[#5e23dc] bg-[#f5f1fd] text-[#5e23dc] font-bold shadow-sm ring-2 ring-[#5e23dc]/20'
                          : 'border-[#cbc3d8] text-[#7a7487] hover:border-[#5e23dc]'
                          }`}
                      >
                        <span className="material-symbols-outlined text-4xl">
                          {p === 'SELL' ? 'sell' : 'key'}
                        </span>
                        <span className="text-sm">{p === 'SELL' ? 'For Sale' : 'For Rent'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Property Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#191c1e]">Property Category &amp; Type</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'APARTMENT', label: 'Apartment / Flat', icon: 'apartment' },
                      { id: 'INDEPENDENT_HOUSE', label: 'Independent House / Villa', icon: 'home' },
                      { id: 'COMMERCIAL', label: 'Commercial Office / Shop', icon: 'storefront' },
                      { id: 'LAND', label: 'Plot / Land', icon: 'landscape' },
                      { id: 'PG', label: 'PG / Co-Living Space', icon: 'hotel' },
                      { id: 'FARMHOUSE', label: 'Farm House / Estate', icon: 'cottage' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setForm({ ...form, propertyType: type.id })}
                        className={`p-4 rounded-2xl border-2 text-center transition flex flex-col items-center gap-2 cursor-pointer ${form.propertyType === type.id
                          ? 'border-[#5e23dc] bg-[#f5f1fd] text-[#5e23dc] font-bold shadow-sm ring-2 ring-[#5e23dc]/20'
                          : 'border-[#cbc3d8] text-[#7a7487] hover:border-[#5e23dc]'
                          }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{type.icon}</span>
                        <span className="text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Location */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-[#191c1e]">Where is your property located?</h2>
                    <p className="text-xs text-[#7a7487] mt-0.5">Enter address details or use the interactive map pinning below.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Building/Street Address</label>
                      <input
                        type="text" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition"
                        value={form.addressLine1}
                        onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                        placeholder="e.g. Prestige Heights, Flat 402"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Locality / Area</label>
                      <input
                        type="text" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition"
                        value={form.locality}
                        onChange={(e) => setForm({ ...form, locality: e.target.value })}
                        placeholder="e.g. Indiranagar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">City</label>
                      <input
                        type="text" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">State</label>
                      <input
                        type="text" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">
                        Pincode (6 digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        inputMode="numeric"
                        pattern="\d{6}"
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition font-mono tracking-wider"
                        value={form.pincode}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForm({ ...form, pincode: digitsOnly });
                        }}
                        placeholder="e.g. 560038"
                      />
                      {form.pincode && form.pincode.length < 6 && (
                        <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                          Must be exactly 6 digits ({form.pincode.length}/6 entered)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Map Pinning & Coordinates Panel */}
                  <div className="bg-[#f2f4f6]/60 border border-[#cbc3d8] rounded-2xl p-4 md:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#191c1e]">
                          <span className="material-symbols-outlined text-[#5e23dc] text-sm">map</span>
                          <span>Interactive Map Pinning &amp; GPS Coordinates</span>
                        </div>
                        <p className="text-[11px] text-[#7a7487]">Control where this property pin appears on the live discovery map.</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={autoGeocodeAddress}
                          disabled={geocoding}
                          className="bg-[#5e23dc] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4500b4] transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">{geocoding ? 'sync' : 'pin_drop'}</span>
                          <span>{geocoding ? 'Locating...' : 'Auto-Locate from Address'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={useDeviceLocation}
                          disabled={geocoding}
                          className="bg-white border border-[#cbc3d8] hover:border-[#5e23dc] text-[#191c1e] px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                          title="Use current device GPS"
                        >
                          <span className="material-symbols-outlined text-sm text-[#16a373]">my_location</span>
                          <span>GPS</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#7a7487] mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={form.latitude}
                          onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                          className="w-full h-10 rounded-xl border border-[#cbc3d8] px-3 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                          placeholder="12.9716"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#7a7487] mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={form.longitude}
                          onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                          className="w-full h-10 rounded-xl border border-[#cbc3d8] px-3 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                          placeholder="77.5946"
                        />
                      </div>
                    </div>

                    {/* Live Map Preview Card */}
                    <div className="rounded-xl overflow-hidden border border-[#cbc3d8] bg-white relative h-48 shadow-sm">
                      <iframe
                        title="Property Pin Preview Map"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${(form.longitude || 77.5946) - 0.01}%2C${(form.latitude || 12.9716) - 0.01}%2C${(form.longitude || 77.5946) + 0.01}%2C${(form.latitude || 12.9716) + 0.01}&layer=mapnik&marker=${form.latitude || 12.9716}%2C${form.longitude || 77.5946}`}
                        className="w-full h-[calc(100%+38px)] border-none pointer-events-auto"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm border border-[#cbc3d8] px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#191c1e] shadow-md flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#16a373] animate-ping" />
                        <span>Live Pin Preview ({form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Details */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#191c1e]">Property Specifications</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Title / Headline</label>
                      <input
                        type="text" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] focus:ring-2 focus:ring-[#5e23dc]/15 transition"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Spacious 3 BHK with Private Balcony"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">BHK Configuration</label>
                      <select
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] cursor-pointer"
                        value={form.bhk}
                        onChange={(e) => setForm({ ...form, bhk: e.target.value })}
                      >
                        {['1', '2', '3', '4', '5'].map((n) => (
                          <option key={n} value={n}>{n} BHK</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Bathrooms</label>
                      <select
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] cursor-pointer"
                        value={form.bathrooms}
                        onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                      >
                        {['1', '2', '3', '4', '5'].map((n) => (
                          <option key={n} value={n}>{n} Bathrooms</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Furnishing Status</label>
                      <select
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc] cursor-pointer"
                        value={form.furnishing}
                        onChange={(e) => setForm({ ...form, furnishing: e.target.value })}
                      >
                        <option value="FULLY_FURNISHED">Fully Furnished</option>
                        <option value="SEMI_FURNISHED">Semi Furnished</option>
                        <option value="UNFURNISHED">Unfurnished</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Total Floors</label>
                      <input
                        type="number"
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                        value={form.totalFloors}
                        onChange={(e) => setForm({ ...form, totalFloors: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Detailed Description</label>
                      <textarea
                        rows={3}
                        className="w-full rounded-xl border border-[#cbc3d8] p-3 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Highlight unique features, nearby schools, metro stations, amenities..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Pricing */}
              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#191c1e]">
                    {form.purpose === 'SELL' ? 'Expected Sale Price' : 'Monthly Rent & Deposit'}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">
                        {form.purpose === 'SELL' ? 'Expected Price (₹)' : 'Expected Monthly Rent (₹)'}
                      </label>
                      <input
                        type="number" required
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                        value={form.expectedPrice}
                        onChange={(e) => setForm({ ...form, expectedPrice: e.target.value })}
                        placeholder="e.g. 7500000"
                      />
                    </div>
                    {form.purpose === 'RENT' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#7a7487] mb-1">Security Deposit (₹)</label>
                        <input
                          type="number"
                          className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                          value={form.securityDeposit}
                          onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                          placeholder="e.g. 50000"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-[#7a7487] mb-1">Maintenance Charges (₹/mo)</label>
                      <input
                        type="number"
                        className="w-full h-12 rounded-xl border border-[#cbc3d8] px-3.5 text-xs text-[#191c1e] bg-white outline-none focus:border-[#5e23dc]"
                        value={form.maintenanceCharges}
                        onChange={(e) => setForm({ ...form, maintenanceCharges: e.target.value })}
                        placeholder="e.g. 2500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Media (Multiple Photos) */}
              {step === 6 && (
                <div className="space-y-4 font-sans text-[#191c1e]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#191c1e]">Upload Property Photos</h2>
                      <p className="text-xs text-[#7a7487]">Select multiple photos from your device. Click any photo to view in high resolution.</p>
                    </div>
                    {form.photos.length > 0 && (
                      <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-xs font-bold px-3 py-1 rounded-full">
                        {form.photos.length}/15 Photos Uploaded
                      </span>
                    )}
                  </div>

                  {/* Upload Box */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="property-photo-file-input"
                    disabled={uploadLoading}
                  />
                  <label
                    htmlFor="property-photo-file-input"
                    className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition ${uploadLoading
                      ? 'border-[#5e23dc] bg-[#f5f1fd]'
                      : 'border-[#cbc3d8] hover:border-[#5e23dc] bg-[#f8f9fb] hover:bg-[#f5f1fd]'
                      }`}
                  >
                    {uploadLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs font-bold text-[#5e23dc]">
                          {uploadProgress || 'Processing photos...'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[#5e23dc] text-5xl mb-2">add_photo_alternate</span>
                        <div className="text-sm font-bold text-[#191c1e]">
                          {form.photos.length > 0 ? 'Click or Drag to Add More Photos' : 'Click or Drag Multiple Photos Here'}
                        </div>
                        <div className="text-xs text-[#7a7487] mt-1">PNG, JPG, WEBP • Up to 10MB each • Max 15 photos</div>
                      </>
                    )}
                  </label>

                  {/* Thumbnail Grid */}
                  {form.photos.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-xs font-bold text-[#7a7487]">
                        <span>Uploaded Photos Preview (Click photo to enlarge):</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {form.photos.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group w-full aspect-square rounded-2xl overflow-hidden border border-[#cbc3d8] bg-[#f2f4f6] shadow-sm cursor-pointer hover:ring-2 hover:ring-[#5e23dc] transition"
                            onClick={() => setPreviewItem({ url, title: `Property Photo ${idx + 1}`, type: 'image' })}
                            title="Click to view full photo"
                          >
                            <img src={url} alt={`Property Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute top-2 left-2 bg-[#5e23dc] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow pointer-events-none">
                                Cover Photo
                              </span>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <span className="material-symbols-outlined text-white text-3xl">visibility</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition opacity-90 group-hover:opacity-100 shadow cursor-pointer z-10"
                              title="Delete photo"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}

                        {/* Add More Tile */}
                        {form.photos.length < 15 && (
                          <label
                            htmlFor="property-photo-file-input"
                            className="w-full aspect-square rounded-2xl border-2 border-dashed border-[#5e23dc]/40 hover:border-[#5e23dc] bg-[#f5f1fd]/50 hover:bg-[#f5f1fd] flex flex-col items-center justify-center cursor-pointer transition text-[#5e23dc]"
                          >
                            <span className="material-symbols-outlined text-3xl">add</span>
                            <span className="text-xs font-bold mt-1">Add More</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 7: Docs (Multiple Documents) */}
              {step === 7 && (
                <div className="space-y-4 font-sans text-[#191c1e]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[#191c1e]">Ownership Verification Documents</h2>
                      <p className="text-xs text-[#7a7487]">
                        Upload property deed, electricity bill, or tax receipt. Click any uploaded document to preview it.
                      </p>
                    </div>
                    {form.documents.length > 0 && (
                      <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-xs font-bold px-3 py-1 rounded-full">
                        {form.documents.length}/10 Docs Added
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="property-doc-file-input"
                    disabled={docUploadLoading}
                  />
                  <label
                    htmlFor="property-doc-file-input"
                    className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition ${docUploadLoading
                      ? 'border-[#5e23dc] bg-[#f5f1fd]'
                      : 'border-[#cbc3d8] hover:border-[#5e23dc] bg-[#f8f9fb] hover:bg-[#f5f1fd]'
                      }`}
                  >
                    {docUploadLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs font-bold text-[#5e23dc]">
                          {uploadProgress || 'Uploading documents...'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[#5e23dc] text-5xl mb-2">upload_file</span>
                        <div className="text-sm font-bold text-[#191c1e]">
                          {form.documents.length > 0 ? 'Click to Add More Verification Documents' : 'Upload Proof of Ownership Documents'}
                        </div>
                        <div className="text-xs text-[#7a7487] mt-1">PDF, JPG, PNG up to 15MB each</div>
                      </>
                    )}
                  </label>

                  {/* Document List */}
                  {form.documents.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-[#7a7487]">Attached Documents (Click document to preview):</div>
                      {form.documents.map((doc, idx) => {
                        const isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
                        return (
                          <div
                            key={idx}
                            onClick={() => setPreviewItem({ url: doc.url, title: doc.fileName, type: isPdf ? 'pdf' : 'image' })}
                            className="flex justify-between items-center bg-[#f8f9fb] border border-[#cbc3d8] p-3.5 rounded-xl hover:border-[#5e23dc] hover:bg-[#f5f1fd]/40 transition cursor-pointer group shadow-sm"
                            title="Click to preview document"
                          >
                            <div className="flex items-center gap-3 truncate pr-4">
                              <span className="material-symbols-outlined text-[#5e23dc] text-2xl shrink-0">
                                {isPdf ? 'picture_as_pdf' : 'description'}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-semibold text-[#191c1e] group-hover:text-[#5e23dc] truncate block transition">
                                  {doc.fileName}
                                </span>
                                <span className="text-[10px] text-[#7a7487] flex items-center gap-1">
                                  <span>Ownership Proof</span>
                                  <span>•</span>
                                  <span className="text-[#5e23dc] font-medium flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[11px]">visibility</span> Preview
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewItem({ url: doc.url, title: doc.fileName, type: isPdf ? 'pdf' : 'image' });
                                }}
                                className="text-[#5e23dc] hover:bg-[#e8ddff] p-1.5 rounded-lg transition"
                                title="Preview document"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDoc(idx);
                                }}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                                title="Remove document"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 8: Preview & Submit */}
              {step === 8 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#191c1e]">Review Property Summary</h2>
                    <span className="text-xs text-[#7a7487]">Click any "Edit" link to modify details</span>
                  </div>
                  <div className="bg-[#f8f9fb] p-6 rounded-2xl border border-[#cbc3d8] space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Purpose:</span>
                        <span className="font-bold text-[#5e23dc] text-sm">{form.purpose === 'SELL' ? 'For Sale' : 'For Rent'}</span>
                      </div>
                      <button type="button" onClick={() => goToStep(1)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Property Type:</span>
                        <span className="font-bold text-[#191c1e] text-sm">{form.propertyType}</span>
                      </div>
                      <button type="button" onClick={() => goToStep(2)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Location &amp; Coordinates:</span>
                        <span className="font-bold text-[#191c1e] text-sm">{form.addressLine1}, {form.locality}, {form.city}</span>
                        <span className="text-[10px] text-[#7a7487] block">Geo: ({form.latitude}, {form.longitude})</span>
                      </div>
                      <button type="button" onClick={() => goToStep(3)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Specs &amp; Headline:</span>
                        <span className="font-bold text-[#191c1e] text-sm">{form.bhk} BHK, {form.bathrooms} Bathrooms</span>
                        <span className="text-[11px] text-[#494455] block font-medium mt-0.5">{form.title}</span>
                      </div>
                      <button type="button" onClick={() => goToStep(4)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Expected Amount:</span>
                        <span className="font-bold text-[#5e23dc] text-base">₹ {Number(form.expectedPrice).toLocaleString('en-IN')}</span>
                      </div>
                      <button type="button" onClick={() => goToStep(5)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#cbc3d8]/60 pb-2.5">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Uploaded Photos:</span>
                        <span className="font-bold text-[#191c1e]">{form.photos.length} photos</span>
                      </div>
                      <button type="button" onClick={() => goToStep(6)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#7a7487] block text-[11px]">Verification Documents:</span>
                        <span className="font-bold text-[#191c1e]">{form.documents.length} files attached</span>
                      </div>
                      <button type="button" onClick={() => goToStep(7)} className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">edit</span> Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-[#cbc3d8]">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-5 py-2.5 rounded-xl border border-[#cbc3d8] bg-white text-[#494455] hover:text-[#5e23dc] text-xs font-bold hover:bg-[#f2f4f6] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Back to Step {step - 1} ({stepsInfo[step - 2]?.name})</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 8 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#5e23dc] text-white px-7 py-3 rounded-xl text-xs font-bold hover:bg-[#4500b4] shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next: {stepsInfo[step]?.name}</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#5e23dc] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-[#4500b4] shadow-md flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
                  >
                    {loading && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                    {loading ? 'Submitting...' : 'Submit & Publish Listing'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* High-Resolution Media & Document Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#cbc3d8] bg-white">
              <div className="flex items-center gap-2.5 truncate pr-4">
                <span className="material-symbols-outlined text-[#5e23dc]">
                  {previewItem.type === 'pdf' ? 'picture_as_pdf' : 'visibility'}
                </span>
                <span className="text-sm font-bold text-[#191c1e] truncate">
                  {previewItem.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {previewItem.url && (
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#5e23dc] hover:underline flex items-center gap-1 bg-[#f5f1fd] px-3 py-1.5 rounded-xl border border-[#e8ddff]"
                  >
                    <span>Open Original</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="text-[#7a7487] hover:text-[#191c1e] p-1.5 rounded-xl hover:bg-[#f2f4f6] transition cursor-pointer"
                  title="Close preview"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-auto flex items-center justify-center bg-[#f8f9fb] min-h-[350px]">
              {previewItem.type === 'pdf' ? (
                <iframe
                  src={previewItem.url}
                  title={previewItem.title}
                  className="w-full h-[65vh] rounded-xl border border-[#cbc3d8] bg-white"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-sm border border-[#cbc3d8]"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
