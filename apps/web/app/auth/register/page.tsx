'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

type Step = 'form' | 'otp';
type Role = 'CUSTOMER' | 'OWNER' | 'AGENT' | 'SERVICE_PROVIDER';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setStep('otp');
      setSuccessMsg(data.message || `Verification code sent to +91 ${form.phone} and ${form.email}`);
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to server. Please ensure the app is running or try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const apiBase = getApiBaseUrl();
      const cleanPhone = form.phone.replace(/\D/g, '');
      const res = await fetch(`${apiBase}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          email: form.email ? form.email.trim() : undefined,
          otp: otpCode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP code. Please check your email or phone and try again.');
      }

      const accessToken = data.data?.accessToken || data.accessToken;
      const refreshToken = data.data?.refreshToken || data.refreshToken;

      if (!accessToken) {
        throw new Error(data.message || 'OTP verification succeeded but no token received.');
      }

      localStorage.setItem('Ziva_access', accessToken);
      if (refreshToken) localStorage.setItem('Ziva_refresh', refreshToken);

      let payload: any = {};
      try {
        payload = JSON.parse(atob(accessToken.split('.')[1] || '{}'));
      } catch {}

      const targetRole = payload.role || role;
      if (targetRole === 'CUSTOMER') router.push('/dashboard/customer');
      else if (targetRole === 'OWNER') router.push('/dashboard/owner');
      else if (targetRole === 'AGENT') router.push('/dashboard/agent');
      else if (targetRole === 'SERVICE_PROVIDER') router.push('/dashboard/provider');
      else if (targetRole === 'ADMIN') router.push('/admin');
      else router.push('/dashboard/customer');
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      // Handle paste of full 6-digit code
      const pasted = digitsOnly.slice(0, 6).split('');
      const newOtp = [...otpValues];
      pasted.forEach((char, idx) => {
        if (idx < 6) newOtp[idx] = char;
      });
      setOtpValues(newOtp);
      const lastIdx = Math.min(pasted.length, 5);
      const next = document.getElementById(`otp-${lastIdx}`);
      next?.focus();
      return;
    }

    const newValues = [...otpValues];
    newValues[index] = digitsOnly;
    setOtpValues(newValues);
    if (digitsOnly && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone.replace(/\D/g, ''), email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      setSuccessMsg(`Fresh OTP resent successfully to +91 ${form.phone} and ${form.email}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased min-h-screen flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="w-full max-w-[1100px] bg-white rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden border border-[#eceef0]">

        {/* Left Side: Image / Brand */}
        <div
          className="w-full md:w-1/2 relative flex-col justify-between hidden md:flex p-8 lg:p-10 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#191919]/90 via-[#191919]/40 to-transparent" />

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Ziva Housing Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <div className="relative z-10 max-w-md space-y-2">
            <h2 className="text-[28px] lg:text-[32px] leading-[36px] lg:leading-[40px] font-bold text-white">Find Your Next Horizon.</h2>
            <p className="text-[14px] leading-[20px] text-[#e0e3e5]">
              Join thousands of users discovering premium properties and reliable home services seamlessly integrated into one platform.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white justify-center">
          {/* Mobile Brand Header */}
          <div className="md:hidden mb-4 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/logo.png" alt="Ziva Housing Logo" className="h-9 w-auto object-contain" />
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-[24px] leading-[32px] font-bold text-[#191c1e]">Create Account</h2>
            <p className="text-[13px] leading-[18px] text-[#494455] mt-0.5">
              {step === 'form' ? 'Sign up to discover verified properties & services.' : `Enter 6-digit OTP sent to +91 ${form.phone} and ${form.email}`}
            </p>
          </div>

          {/* Tab Toggle as direct Links */}
          <div className="flex bg-[#f2f4f6] rounded-xl p-1 mb-4">
            <Link
              href="/auth/login"
              className="flex-1 py-2 text-center text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#494455] hover:text-[#4500b4] transition-all rounded-lg"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 py-2 text-center text-[12px] leading-[16px] tracking-[0.05em] font-semibold bg-white text-[#4500b4] shadow-sm rounded-lg transition-all"
            >
              Sign Up
            </Link>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {error && (
                <div className="bg-[#ffdad6] text-[#9300a] p-2.5 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] leading-[14px] tracking-[0.05em] font-semibold text-[#191c1e] mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CUSTOMER', 'OWNER'] as const).map((r) => (
                    <button
                      suppressHydrationWarning
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 ${role === r
                          ? 'border-[#5e23dc] bg-[#e8ddff] text-[#4500b4] shadow-sm'
                          : 'border-[#cbc3d8] bg-white text-[#494455] hover:bg-[#f2f4f6]'
                        }`}
                    >
                      {r === 'CUSTOMER' ? '🏠 Buyer / Renter' : '🏗️ Property Owner'}
                    </button>
                  ))}
                  {/* Agent & Service Partner commented out as requested
                  {(['AGENT', 'SERVICE_PROVIDER'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl font-bold text-xs transition-all border ${role === r
                          ? 'border-[#5e23dc] bg-[#e8ddff] text-[#4500b4]'
                          : 'border-[#cbc3d8] bg-white text-[#494455] hover:bg-[#f2f4f6]'
                        }`}
                    >
                      {r === 'AGENT' ? '💼 Agent' : '🔧 Service Partner'}
                    </button>
                  ))}
                  */}
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#191c1e]">First Name</label>
                  <input
                    suppressHydrationWarning
                    type="text" placeholder="Rahul" required
                    className="w-full px-3 py-2 bg-white border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#191c1e]">Last Name</label>
                  <input
                    suppressHydrationWarning
                    type="text" placeholder="Sharma" required
                    className="w-full px-3 py-2 bg-white border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-[11px] font-semibold text-[#191c1e]">Email Address</label>
                <input
                  suppressHydrationWarning
                  type="email" placeholder="name@example.com" required
                  className="w-full px-3 py-2 bg-white border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-[11px] font-semibold text-[#191c1e]">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs font-bold text-[#494455] flex items-center">+91</span>
                  <input
                    suppressHydrationWarning
                    type="tel" placeholder="9876543210" required pattern="[6-9][0-9]{9}"
                    className="flex-1 px-3 py-2 bg-white border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold text-[#191c1e]">Password</label>
                <div className="relative flex items-center">
                  <input
                    suppressHydrationWarning
                    type={showPass ? 'text' : 'password'} placeholder="At least 8 characters" minLength={8} required
                    className="w-full px-3 py-2 bg-white border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] pr-8"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button suppressHydrationWarning type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-[#7a7487]">
                    <span className="material-symbols-outlined text-sm">{showPass ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                suppressHydrationWarning
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {loading ? 'Creating Account...' : 'Get Verification OTP'}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-semibold border border-[#ffb4ab]">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-[#d7f9e5] text-[#006e3a] p-3 rounded-xl text-xs font-semibold border border-[#9df2c2] flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-2 justify-center py-2">
                {otpValues.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="tel"
                    maxLength={1}
                    className="w-10 h-10 text-center text-lg font-bold bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl text-[#191c1e] outline-none focus:border-[#5e23dc]"
                    value={v}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !v && i > 0) {
                        const prev = document.getElementById(`otp-${i - 1}`);
                        prev?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otpValues.join('').length !== 6}
                className="w-full py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Complete Registration'}
              </button>

              <div className="flex justify-between items-center text-xs pt-1">
                <button type="button" onClick={handleResendOtp} disabled={loading} className="text-[#5e23dc] font-bold hover:underline">
                  Resend OTP Code via Email/SMS
                </button>
                <button type="button" onClick={() => setStep('form')} className="text-[#7a7487] font-semibold hover:underline">
                  Edit details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
