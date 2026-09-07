'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

type VendorStatus = 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';

interface ProviderData {
  id?: string;
  verificationStatus: VendorStatus;
  backgroundCheckStatus?: string;
  verificationNotes?: string;
  categoryName?: string;
  serviceArea?: string[];
  requiresBackgroundCheck?: boolean;
  isVerified?: boolean;
  idProofUrl?: string;
  addressProofUrl?: string;
  certificateUrl?: string;
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

export default function VendorStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VendorStatus>('PENDING');
  const [activeTab, setActiveTab] = useState<'FORM' | 'STATUS'>('STATUS');
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Application form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState('Home Cleaner');
  const [formExperience, setFormExperience] = useState('3');
  const [formHourlyRate, setFormHourlyRate] = useState('499');
  const [formIdProof, setFormIdProof] = useState('Aadhaar Card');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formCity, setFormCity] = useState('Bangalore');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  // Resubmission state for CHANGES_REQUESTED
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resubmitFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (accToken) {
      setToken(accToken);
      try {
        const payload = JSON.parse(atob(accToken.split('.')[1] || ''));
        setCurrentUser(payload);
        if (payload.firstName) {
          setFormName(`${payload.firstName} ${payload.lastName || ''}`.trim());
        }
        if (payload.phone) {
          setFormPhone(payload.phone);
        }
      } catch {
        // Non-fatal
      }
      fetchRealStatus(accToken);
    } else {
      setIsLoading(false);
      setActiveTab('FORM');
    }
  }, []);

  const fetchRealStatus = async (accToken: string) => {
    setIsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/services/provider/profile`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });

      if (res.ok) {
        const json = await res.json();
        const data: ProviderData = json.data || json;
        setProviderData(data);
        const currentVerification = (data.verificationStatus as VendorStatus) || 'PENDING';
        setStatus(currentVerification);
        setActiveTab('STATUS');
        if (data.categoryName) setFormCategory(data.categoryName);
        if (data.serviceArea && data.serviceArea[0]) setFormCity(data.serviceArea[0]);
      } else {
        // If no provider profile exists yet, show the form tab
        setActiveTab('FORM');
      }
    } catch {
      setActiveTab('STATUS');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Attempt pre-signed URL upload
      if (token) {
        const urlRes = await fetch(`${apiBase}/api/v1/storage/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            folder: 'documents',
            filename: file.name,
            contentType: file.type || 'application/pdf',
          }),
        });

        if (urlRes.ok) {
          const urlData = await urlRes.json();
          const uploadUrl = urlData.data?.uploadUrl || urlData.uploadUrl;
          const publicUrl = urlData.data?.publicUrl || urlData.publicUrl || urlData.data?.url || urlData.url;

          if (uploadUrl) {
            await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'application/pdf' },
              body: file,
            });
            return publicUrl || uploadUrl.split('?')[0];
          }
        }
      }
    } catch {
      // Fallback
    }

    // Default simulated document URL for demo/offline resilience
    return `https://storage.Zivahousing.com/documents/kyc-${Date.now()}-${file.name}`;
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in or register before submitting your professional vendor profile.');
      router.push('/auth/login?redirect=/become-professional/status');
      return;
    }

    setFormSubmitting(true);
    setFormSuccess('');

    try {
      let docUrl = uploadedFileUrl;
      if (selectedFile && !docUrl) {
        docUrl = await handleFileUpload(selectedFile);
        setUploadedFileUrl(docUrl);
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/services/provider/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceArea: [formCity],
          categoryName: formCategory,
          idProofUrl: docUrl || `DOC-${formDocNumber || 'AADHAAR'}`,
          addressProofUrl: docUrl || null,
          certificateUrl: docUrl || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const data: ProviderData = json.data || json;
        setProviderData(data);
        setStatus('PENDING');
        setActiveTab('STATUS');
        setFormSuccess('Application submitted successfully! Your profile is now Under Review.');
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || `Server error (${res.status}): Failed to submit application.`);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(err.message ? `Error submitting application: ${err.message}` : 'Error submitting application. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setResubmitting(true);
    try {
      let docUrl = '';
      if (resubmitFile) {
        docUrl = await handleFileUpload(resubmitFile);
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/services/provider/resubmit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idProofUrl: docUrl || undefined,
          notes: resubmitNotes,
        }),
      });

      if (res.ok) {
        alert('Updated documents submitted successfully! Your application is back Under Review.');
        setResubmitNotes('');
        setResubmitFile(null);
        fetchRealStatus(token);
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Failed to resubmit documents.');
      }
    } catch {
      alert('Error resubmitting documents.');
    } finally {
      setResubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    if (token) {
      router.push('/dashboard/provider');
    } else {
      router.push('/auth/login?redirect=/dashboard/provider');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center font-[Rubik]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          <p className="text-sm text-[#494455]">Loading your professional verification status...</p>
        </div>
      </div>
    );
  }

  const stepProgress = status === 'PENDING' ? 33 : status === 'CHANGES_REQUESTED' ? 66 : 100;

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-[860px] mx-auto px-4 md:px-8 py-10 flex flex-col items-center gap-8">

        {/* Section Navigation / Flow Switcher */}
        <div className="w-full bg-white rounded-2xl p-4 border border-[#eceef0] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5e23dc] text-base">verified_user</span>
            <div>
              <span className="text-xs font-bold text-[#191c1e] block">Vendor Onboarding Hub</span>
              <span className="text-[11px] text-[#7a7487]">Official Ziva Professional Accreditation</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('FORM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'FORM' ? 'bg-[#5e23dc] text-white shadow-sm' : 'bg-[#f2f4f6] text-[#494455] hover:bg-[#e8ddff]'
              }`}
            >
              <span className="material-symbols-outlined text-xs">edit_document</span>
              1. Application Form
            </button>

            <button
              onClick={() => {
                setActiveTab('STATUS');
                if (token) fetchRealStatus(token);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'STATUS' ? 'bg-[#5e23dc] text-white shadow-sm' : 'bg-[#f2f4f6] text-[#494455] hover:bg-[#e8ddff]'
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {status === 'APPROVED' ? 'verified' : status === 'CHANGES_REQUESTED' ? 'warning' : 'hourglass_empty'}
              </span>
              2. Live Status ({status})
            </button>
          </div>
        </div>

        {formSuccess && (
          <div className="w-full bg-[#e8faf4] border border-[#16a373] text-[#006c47] p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {formSuccess}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 1: Full Vendor Application Form Section
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'FORM' && (
          <div className="w-full bg-white rounded-3xl p-6 md:p-8 border border-[#cbc3d8] shadow-lg space-y-6">
            <div className="border-b border-[#eceef0] pb-4 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-[#5e23dc] uppercase tracking-wider block">Official Vendor Onboarding</span>
                <h2 className="text-2xl font-bold text-[#191c1e]">Ziva Professional Application Form</h2>
              </div>
              <span className="bg-[#e8ddff] text-[#4500b4] text-xs font-bold px-3 py-1.5 rounded-full">Step 1 of 2</span>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#7a7487] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5e23dc]">person</span>
                  1. Personal &amp; Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Mobile Phone Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Operating City / Service Area *</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Experience (Years) *</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={formExperience}
                      onChange={(e) => setFormExperience(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service & Pricing */}
              <div className="space-y-3 border-t border-[#eceef0] pt-4">
                <h3 className="text-xs font-bold text-[#7a7487] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5e23dc]">handyman</span>
                  2. Service Specialty &amp; Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Service Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-bold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                    >
                      {['Home Cleaner', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'AC Technician', 'Pest Control Specialist', 'Cook / Chef', 'Babysitter', 'Elderly Caregiver', 'Personal Driver', 'Beautician', 'Spa Therapist'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Expected Hourly Rate (₹) *</label>
                    <input
                      type="number"
                      min="99"
                      value={formHourlyRate}
                      onChange={(e) => setFormHourlyRate(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Verification & Compliance */}
              <div className="space-y-3 border-t border-[#eceef0] pt-4">
                <h3 className="text-xs font-bold text-[#7a7487] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5e23dc]">verified_user</span>
                  3. Identity &amp; Background Verification Proof
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Government ID Type *</label>
                    <select
                      value={formIdProof}
                      onChange={(e) => setFormIdProof(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-bold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1e] mb-1">Document Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234-5678-9012"
                      value={formDocNumber}
                      onChange={(e) => setFormDocNumber(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-3 text-xs font-semibold text-[#191c1e] outline-none focus:ring-2 focus:ring-[#5e23dc]"
                    />
                  </div>
                </div>

                {/* Real File Upload Section */}
                <div className="space-y-2">
                  <label
                    htmlFor="kyc-file-input"
                    className={`block border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      selectedFile
                        ? 'border-emerald-500 bg-emerald-50/40'
                        : 'border-[#cbc3d8] hover:border-[#5e23dc] bg-[#f8f9fb] hover:bg-[#e8ddff]/20'
                    }`}
                  >
                    <input
                      id="kyc-file-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSelectedFile(f);
                        }
                      }}
                    />

                    <div className="flex flex-col items-center space-y-2 pointer-events-none">
                      <span className={`material-symbols-outlined text-4xl ${selectedFile ? 'text-emerald-600' : 'text-[#5e23dc]'}`}>
                        {selectedFile ? 'task' : 'cloud_upload'}
                      </span>
                      
                      {selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for upload
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#191c1e]">
                            Click to Upload Identity Card / Skill Certificate
                          </p>
                          <p className="text-[10px] text-[#7a7487]">Supports JPG, PNG, PDF up to 10MB</p>
                        </div>
                      )}

                      <span
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all inline-block mt-2 ${
                          selectedFile
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-[#e8ddff] text-[#4500b4]'
                        }`}
                      >
                        {selectedFile ? 'Change Selected File' : 'Browse File from Device'}
                      </span>
                    </div>
                  </label>

                  {selectedFile && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-[11px] text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        Remove File
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                  {formSubmitting ? 'Submitting Application...' : 'Submit Application & Request Verification'}
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 2: Live Application Journey Status Screens
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'STATUS' && (
          <>
            {/* Progress Steps Header */}
            <div className="w-full">
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-[#eceef0] z-0">
                  <div className="h-full bg-[#5e23dc] transition-all duration-700" style={{ width: `${stepProgress}%` }} />
                </div>
                {[
                  { label: 'Application Submitted', icon: 'send', active: true },
                  { label: 'Under Review', icon: 'manage_search', active: ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'].includes(status) },
                  {
                    label: status === 'APPROVED' ? 'Approved & Live' : status === 'CHANGES_REQUESTED' ? 'Changes Needed' : status === 'REJECTED' ? 'Declined' : 'Decision Pending',
                    icon: status === 'APPROVED' ? 'verified' : status === 'CHANGES_REQUESTED' ? 'warning' : status === 'REJECTED' ? 'cancel' : 'gavel',
                    active: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].includes(status),
                  },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 z-10 w-1/3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all ${
                      step.active
                        ? status === 'APPROVED' && i === 2 ? 'bg-[#16a373] text-white'
                        : status === 'CHANGES_REQUESTED' && i === 2 ? 'bg-[#f59e0b] text-white'
                        : status === 'REJECTED' && i === 2 ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#5e23dc] text-white'
                        : 'bg-white border-2 border-[#cbc3d8] text-[#7a7487]'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#494455] text-center">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 1. UNDER REVIEW (PENDING) ── */}
            {status === 'PENDING' && (
              <div className="w-full bg-white rounded-2xl border border-[#eceef0] shadow-sm overflow-hidden">
                <div className="bg-[#f2f4f6] border-b border-[#eceef0] px-8 py-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#eceef0] flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#5e23dc] animate-spin">hourglass_empty</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#7a7487] uppercase tracking-wider mb-1">Application Submitted</p>
                    <h1 className="text-2xl font-bold text-[#191c1e]">Under Review</h1>
                  </div>
                  <span className="bg-[#e8ddff] text-[#4500b4] text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                    In Review
                  </span>
                </div>
                <div className="p-8 space-y-6">
                  <p className="text-[15px] text-[#494455] leading-relaxed">
                    Your professional vendor application for <strong className="text-[#191c1e]">{providerData?.categoryName || formCategory}</strong> in <strong className="text-[#191c1e]">{providerData?.serviceArea?.[0] || formCity}</strong> is currently being inspected by our compliance team.
                  </p>

                  <div className="bg-[#f8f9fb] rounded-xl p-5 border border-[#eceef0] space-y-3">
                    <p className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">Verification Checklist</p>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#e8faf4] text-[#16a373] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      </div>
                      <span className="text-sm text-[#191c1e] font-medium">Application Received &amp; Registered</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#fff8e6] text-[#f59e0b] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                      </div>
                      <span className="text-sm text-[#191c1e] font-medium">Government ID &amp; Address Verification (In Review)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#f2f4f6] text-[#7a7487] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[13px]">pending</span>
                      </div>
                      <span className="text-sm text-[#7a7487]">
                        {providerData?.requiresBackgroundCheck ? 'Police / Background Verification' : 'Trade License &amp; Skill Clearance'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7a7487] pt-2 border-t border-[#eceef0]">
                    <span>Expected Review Time: <strong>24–48 Hours</strong></span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => token && fetchRealStatus(token)}
                        className="text-[#5e23dc] font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">refresh</span> Check Status
                      </button>
                      <Link href="/support" className="text-[#5e23dc] font-bold hover:underline">
                        Contact Support
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. CHANGES REQUESTED ── */}
            {status === 'CHANGES_REQUESTED' && (
              <div className="w-full bg-white rounded-2xl border border-[#f59e0b]/40 shadow-sm overflow-hidden">
                <div className="bg-[#fff8e6] border-b border-[#f59e0b]/30 px-8 py-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#f59e0b]/30 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#f59e0b]">warning</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#92400e] uppercase tracking-wider mb-1">Action Required</p>
                    <h1 className="text-2xl font-bold text-[#191c1e]">Changes Requested</h1>
                  </div>
                  <span className="bg-[#fef3c7] text-[#92400e] border border-[#f59e0b]/30 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                    Needs Update
                  </span>
                </div>
                <div className="p-8 space-y-6">
                  <p className="text-[15px] text-[#494455] leading-relaxed">
                    Our compliance team has reviewed your application and requested the following corrections before your profile can be approved:
                  </p>

                  <div className="bg-[#fff8e6] border border-[#f59e0b]/30 rounded-xl p-5">
                    <p className="text-xs font-bold text-[#92400e] uppercase tracking-wider mb-2">Admin Reviewer Feedback</p>
                    <p className="text-sm text-[#191c1e] italic font-medium">
                      &ldquo;{providerData?.verificationNotes || 'Please upload a clear high-resolution copy of your ID proof and address document.'}&rdquo;
                    </p>
                  </div>

                  {/* Resubmission Form */}
                  <form onSubmit={handleResubmit} className="bg-[#f8f9fb] border border-[#eceef0] rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">
                      Re-submit Corrected Documents
                    </h3>

                    <input
                      type="file"
                      ref={resubmitFileInputRef}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setResubmitFile(f);
                      }}
                    />

                    <div
                      onClick={() => resubmitFileInputRef.current?.click()}
                      className="bg-white border-2 border-dashed border-[#cbc3d8] hover:border-[#5e23dc] rounded-xl p-4 text-center cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-2xl text-[#5e23dc]">upload_file</span>
                      <p className="text-xs font-bold text-[#191c1e] mt-1">
                        {resubmitFile ? `Selected: ${resubmitFile.name}` : 'Click to select corrected Document / Certificate'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#494455]">Explanation / Notes for Reviewer</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Uploaded high-resolution scan of my Aadhaar card and business registration."
                        value={resubmitNotes}
                        onChange={(e) => setResubmitNotes(e.target.value)}
                        className="w-full bg-white border border-[#eceef0] rounded-xl px-3 py-2 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resubmitting}
                      className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      {resubmitting ? 'Submitting Updates...' : 'Submit Updated Documents for Review'}
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── 3. APPROVED & LIVE 🎉 ── */}
            {status === 'APPROVED' && (
              <div className="w-full bg-white rounded-2xl border border-[#16a373]/30 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#e8faf4] to-[#d1fae5] border-b border-[#16a373]/20 px-8 py-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#16a373]/30 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#16a373]">verified</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#065f46] uppercase tracking-wider mb-1">Ziva Verified Provider</p>
                    <h1 className="text-2xl font-bold text-[#191c1e]">You&apos;re Live! 🎉</h1>
                  </div>
                  <span className="bg-[#e8faf4] text-[#065f46] border border-[#16a373]/30 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-2 h-2 bg-[#16a373] rounded-full animate-pulse inline-block" />
                    Live &amp; Verified
                  </span>
                </div>
                <div className="p-8 space-y-6">
                  <p className="text-center text-[15px] text-[#494455] leading-relaxed">
                    Congratulations! 🎉 Your professional profile for <strong className="text-[#191c1e]">{providerData?.categoryName || formCategory}</strong> has been officially verified. Customers in <strong className="text-[#191c1e]">{providerData?.serviceArea?.[0] || formCity}</strong> can now view your listing and request service jobs!
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: 'visibility', label: 'Listing Status', value: 'Live & Active' },
                      { icon: 'notifications_active', label: 'Job Dispatcher', value: 'Enabled' },
                      { icon: 'verified', label: 'KYC Trust Badge', value: 'Granted' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#f8f9fb] rounded-xl p-4 text-center border border-[#eceef0]">
                        <span className="material-symbols-outlined text-[#16a373] text-xl block mb-1">{stat.icon}</span>
                        <p className="text-[10px] text-[#7a7487] font-medium">{stat.label}</p>
                        <p className="text-xs font-bold text-[#191c1e]">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleGoToDashboard}
                      className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      Open Provider Dashboard
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                    <Link
                      href="/services"
                      className="px-6 py-4 border border-[#eceef0] rounded-xl text-xs font-bold text-[#494455] hover:bg-[#f2f4f6] transition-colors flex items-center justify-center gap-1.5"
                    >
                      Browse Service Marketplace
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. REJECTED ── */}
            {status === 'REJECTED' && (
              <div className="w-full bg-white rounded-2xl border border-[#ba1a1a]/30 shadow-sm overflow-hidden">
                <div className="bg-[#fff8f7] border-b border-[#ba1a1a]/20 px-8 py-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#ba1a1a]/30 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#ba1a1a]">cancel</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mb-1">Application Declined</p>
                    <h1 className="text-2xl font-bold text-[#191c1e]">Not Approved</h1>
                  </div>
                  <span className="bg-[#ffdad6] text-[#93000a] text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                    Rejected
                  </span>
                </div>
                <div className="p-8 space-y-5">
                  <p className="text-[15px] text-[#494455] leading-relaxed">
                    Thank you for your interest in joining Ziva Housing. Unfortunately, your vendor application could not be approved at this time.
                  </p>
                  {providerData?.verificationNotes && (
                    <div className="bg-[#fff8f7] border border-[#ba1a1a]/20 rounded-xl p-5">
                      <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mb-2">Reason Provided:</p>
                      <p className="text-sm text-[#191c1e] italic">&ldquo;{providerData.verificationNotes}&rdquo;</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#7a7487] bg-[#f8f9fb] rounded-xl p-4 border border-[#eceef0]">
                    <span>Need clarification or want to appeal?</span>
                    <Link href="/support" className="text-[#5e23dc] font-bold hover:underline">Contact Support Desk</Link>
                  </div>
                  <button
                    onClick={() => setActiveTab('FORM')}
                    className="w-full bg-[#191c1e] hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Start a New Application
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <Link href="/become-professional" className="text-xs text-[#7a7487] hover:text-[#5e23dc] transition-colors">
          ← Back to Become a Professional
        </Link>
      </main>

      <footer className="py-6 text-center text-xs text-[#7a7487] border-t border-[#eceef0]">
        &copy; 2026 Ziva Housing Professionals. All rights reserved.
      </footer>
    </div>
  );
}