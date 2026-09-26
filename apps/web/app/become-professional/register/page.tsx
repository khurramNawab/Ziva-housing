'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('electrician');
  const [locality, setLocality] = useState('');
  
  // OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Dispatch OTP via Email (SMTP) & SMS
  const handleSendOtp = async () => {
    setErrorBanner('');
    setSuccessBanner('');

    if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 10) {
      setErrorBanner('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorBanner('Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mobileNumber.replace(/\D/g, '').slice(-10),
          email: email.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOtpSent(true);
        setSuccessBanner(`Verification code sent to ${email.trim()} & +91 ${mobileNumber.slice(-10)}! Check your inbox.`);
      } else {
        setErrorBanner(data?.message || 'Could not send verification OTP. Please verify server connection.');
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to dispatch verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');
    setSuccessBanner('');

    if (!fullName.trim() || !mobileNumber.trim() || !email.trim() || !locality.trim()) {
      setErrorBanner('Please fill in all required fields.');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorBanner('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const apiBase = getApiBaseUrl();
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Vendor';
      const lastName = nameParts.slice(1).join(' ') || '';
      const finalPassword = password.trim() || 'VendorPass@123';

      // 1. Register Vendor Account in Auth System
      const regRes = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          email: email.trim(),
          firstName,
          lastName,
          role: 'SERVICE_PROVIDER',
          password: finalPassword,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      // 2. Verify OTP or Login to acquire access token
      let token = '';
      if (otpSent && otpCode.trim()) {
        const verifyRes = await fetch(`${apiBase}/api/v1/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            otp: otpCode.trim(),
          }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (verifyRes.ok && verifyData) {
          token = verifyData.data?.accessToken || verifyData.accessToken || '';
        }
      }

      if (!token) {
        // Fallback login to get token
        const loginRes = await fetch(`${apiBase}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: email.trim() || cleanPhone,
            password: finalPassword,
          }),
        });
        const loginData = await loginRes.json().catch(() => ({}));
        if (loginRes.ok && loginData) {
          token = loginData.data?.accessToken || loginData.accessToken || '';
        }
      }

      if (token) {
        localStorage.setItem('Ziva_access', token);
        // 3. Onboard Vendor Details in DB
        await fetch(`${apiBase}/api/v1/services/providers/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            serviceArea: [locality.trim()],
            categoryName: category,
          }),
        }).catch(() => {});
      }

      localStorage.setItem('Ziva_vendor_app_status', 'UNDER_REVIEW');
      localStorage.setItem('Ziva_vendor_name', fullName);
      localStorage.setItem('Ziva_vendor_email', email);
      localStorage.setItem('Ziva_vendor_category', category);

      router.push('/become-professional/status');
    } catch (err: any) {
      console.error(err);
      localStorage.setItem('Ziva_vendor_app_status', 'UNDER_REVIEW');
      localStorage.setItem('Ziva_vendor_name', fullName);
      router.push('/become-professional/status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f6f8] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 md:py-12">
        <div className="w-full max-w-[580px] bg-white rounded-2xl shadow-lg border border-[#cbc3d8] overflow-hidden relative p-6 md:p-8 space-y-6">
          {submitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin w-8 h-8 border-3 border-[#5e23dc] border-t-transparent rounded-full" />
              <p className="text-sm font-bold text-[#191c1e]">Creating &amp; Verifying vendor account...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-[24px] font-bold text-[#191c1e]">Join Ziva Professionals</h1>
            <p className="text-xs text-[#494455]">List your services, verify your email, and grow your business today.</p>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Success Banner */}
          {successBanner && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">mark_email_read</span>
              <span>{successBanner}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Full Name *</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] focus-within:ring-2 focus-within:ring-[#5e23dc]/10 transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">person</span>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Email Address for SMTP verification */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Email Address *</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] focus-within:ring-2 focus-within:ring-[#5e23dc]/10 transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">mail</span>
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Mobile Number & Get OTP via SMTP */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Mobile Number *</label>
              <div className="flex gap-2">
                <div className="flex-1 border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] transition-all">
                  <span className="material-symbols-outlined text-[#7a7487] mr-2 text-lg">phone_iphone</span>
                  <span className="text-xs font-bold text-[#494455] mr-2">+91</span>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="bg-[#e8ddff] text-[#4500b4] hover:bg-[#5e23dc] hover:text-white text-xs font-bold px-4 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {sendingOtp ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#4500b4] border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>{otpSent ? 'Resend OTP' : 'Send Verification OTP'}</span>
                  )}
                </button>
              </div>
            </div>

            {/* OTP Verification Code (if sent) */}
            {otpSent && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-[#16a373]">
                  Enter 6-Digit Email Verification Code *
                </label>
                <div className="border border-[#16a373] rounded-xl bg-[#e8faf4] px-4 py-3 flex items-center">
                  <span className="material-symbols-outlined text-[#16a373] mr-3 text-lg">mark_email_read</span>
                  <input
                    type="text"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs font-bold text-[#191c1e]"
                  />
                </div>
              </div>
            )}

            {/* Account Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">Set Account Password (Optional)</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">lock</span>
                <input
                  type="password"
                  placeholder="Create password for easy vendor login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#191c1e]">Select Service Category *</label>
              <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1 pb-1 scrollbar-thin">
                {[
                  { id: 'electrician', name: 'Electrician', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80' },
                  { id: 'plumbing', name: 'Plumbing', img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=300&q=80' },
                  { id: 'cleaning', name: 'Cleaning', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80' },
                  { id: 'carpentry', name: 'Carpenter', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80' },
                  { id: 'painting', name: 'Painter', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80' },
                  { id: 'ac-technician', name: 'AC Technician', img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80' },
                  { id: 'pest-control', name: 'Pest Control', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80' },
                  { id: 'gardening', name: 'Gardener', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=300&q=80' },
                  { id: 'packers-movers', name: 'Packers & Movers', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80' },
                  { id: 'babysitting', name: 'Babysitter', img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80' },
                  { id: 'elderly-care', name: 'Elderly Care', img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=300&q=80' },
                  { id: 'cook', name: 'Cook / Chef', img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=300&q=80' },
                  { id: 'driver', name: 'Driver', img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=300&q=80' },
                  { id: 'beautician', name: 'Beautician', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80' },
                  { id: 'spa', name: 'Spa / Wellness', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80' },
                ].map((item) => (
                  <label key={item.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={item.id}
                      checked={category === item.id}
                      onChange={() => setCategory(item.id)}
                      className="sr-only peer"
                    />
                    <div className="relative h-20 rounded-xl overflow-hidden border-2 border-[#cbc3d8] peer-checked:border-[#5e23dc] peer-checked:ring-2 peer-checked:ring-[#5e23dc]/20 transition-all group">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute bottom-1.5 left-1 right-1 text-center text-[10px] font-bold text-white drop-shadow leading-tight">
                        {item.name}
                      </span>
                      {category === item.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#5e23dc] rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[10px]">check</span>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {category && (
                <p className="text-xs text-[#5e23dc] font-medium pl-1">
                  Selected: <strong>{category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</strong>
                </p>
              )}
            </div>

            {/* City / Locality */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#191c1e]">City / Locality *</label>
              <div className="border border-[#cbc3d8] rounded-xl bg-white px-4 py-3 flex items-center focus-within:border-[#5e23dc] transition-all">
                <span className="material-symbols-outlined text-[#7a7487] mr-3 text-lg">location_on</span>
                <input
                  type="text"
                  placeholder="e.g. Park Street, Kolkata"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  required
                  className="w-full bg-transparent outline-none text-xs text-[#191c1e] placeholder:text-[#7a7487]"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span>Submit &amp; Register Professional Account</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-[#7a7487]">
            Already registered as a provider?{' '}
            <Link href="/auth/login" className="text-[#5e23dc] font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
