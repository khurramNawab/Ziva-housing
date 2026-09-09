'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'PHONE' | 'VERIFY'>('PHONE');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  const navigateToRole = (role: string) => {
    let dest = '/dashboard/customer';
    if (role === 'CUSTOMER') dest = '/dashboard/customer';
    else if (role === 'OWNER') dest = '/dashboard/owner';
    else if (role === 'AGENT') dest = '/dashboard/agent';
    else if (role === 'SERVICE_PROVIDER') dest = '/dashboard/provider';
    else if (role === 'ADMIN') dest = '/admin';

    try {
      router.push(dest);
    } catch {
      window.location.href = dest;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok && data) {
        const accessToken = data.data?.accessToken || data.accessToken;
        const refreshToken = data.data?.refreshToken || data.refreshToken;

        if (accessToken) {
          localStorage.setItem('Ziva_access', accessToken);
          if (refreshToken) localStorage.setItem('Ziva_refresh', refreshToken);

          const payload = JSON.parse(atob(accessToken.split('.')[1] || '{}'));
          navigateToRole(payload.role || 'CUSTOMER');
          return;
        }
      }

      const errorMsg = data?.message || data?.error || 'Invalid credentials. Please check your email/phone and password.';
      setError(errorMsg);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Flow Handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone || otpPhone.trim().length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!otpEmail || !otpEmail.includes('@')) {
      setOtpError('Please enter a valid email address to receive your OTP via SMTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpPhone.trim(),
          email: otpEmail.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOtpSuccess(`Verification code sent successfully to +91 ${otpPhone.trim()} and ${otpEmail.trim()}!`);
        setOtpStep('VERIFY');
      } else {
        setOtpError(data?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to connect to OTP service.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpPhone.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data) {
        const accessToken = data.data?.accessToken || data.accessToken;
        const refreshToken = data.data?.refreshToken || data.refreshToken;

        if (accessToken) {
          localStorage.setItem('Ziva_access', accessToken);
          if (refreshToken) localStorage.setItem('Ziva_refresh', refreshToken);

          const payload = JSON.parse(atob(accessToken.split('.')[1] || '{}'));
          setShowOtpModal(false);
          navigateToRole(payload.role || 'CUSTOMER');
          return;
        }
      }

      setOtpError(data?.message || 'Invalid or expired OTP code. Please try again.');
    } catch (err: any) {
      setOtpError(err?.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
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
        <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col bg-white justify-center">
          {/* Mobile Brand Header */}
          <div className="md:hidden mb-4 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/logo.png" alt="Ziva Housing Logo" className="h-9 w-auto object-contain" />
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-[24px] leading-[32px] font-bold text-[#191c1e]">Welcome Back</h2>
            <p className="text-[13px] leading-[18px] text-[#494455] mt-0.5">Log in to manage your properties and services.</p>
          </div>

          {/* Tab Toggle as direct Links */}
          <div className="flex bg-[#f2f4f6] rounded-xl p-1 mb-5">
            <Link
              href="/auth/login"
              className="flex-1 py-2 text-center text-[12px] leading-[16px] tracking-[0.05em] font-semibold bg-white text-[#4500b4] shadow-sm rounded-lg transition-all"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 py-2 text-center text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#494455] hover:text-[#4500b4] transition-all rounded-lg"
            >
              Sign Up
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-semibold border border-[#ffb4ab]">
                {error}
              </div>
            )}

            {/* Email/Phone Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] leading-[14px] tracking-[0.05em] font-semibold text-[#191c1e]" htmlFor="identifier">
                Email or Phone Number
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#7a7487] text-base">person</span>
                <input
                  suppressHydrationWarning
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or phone"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#cbc3d8] rounded-xl text-[13px] leading-[18px] text-[#191c1e] outline-none focus:border-[#5e23dc] transition-colors"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] leading-[14px] tracking-[0.05em] font-semibold text-[#191c1e]" htmlFor="password">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#7a7487] text-base">lock</span>
                <input
                  suppressHydrationWarning
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#cbc3d8] rounded-xl text-[13px] leading-[18px] text-[#191c1e] outline-none focus:border-[#5e23dc] transition-colors"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 text-[#7a7487] hover:text-[#5e23dc]"
                >
                  <span className="material-symbols-outlined text-base">{showPass ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#494455]">
                <input suppressHydrationWarning type="checkbox" className="rounded border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]" />
                <span className="text-[11px]">Remember me</span>
              </label>
              <a href="#" className="text-[#4500b4] hover:underline font-semibold text-[11px]">Forgot password?</a>
            </div>

            {/* Submit CTA */}
            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-[13px] leading-[18px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading ? 'Logging in...' : 'Login'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-[#cbc3d8]" />
            <span className="text-[11px] text-[#7a7487] font-semibold">Or continue with</span>
            <hr className="flex-1 border-[#cbc3d8]" />
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setOtpStep('PHONE');
                const isEmail = form.identifier.includes('@');
                setOtpPhone(isEmail ? '' : form.identifier.replace(/\D/g, ''));
                setOtpEmail(isEmail ? form.identifier.trim() : '');
                setOtpError('');
                setOtpSuccess('');
                setShowOtpModal(true);
              }}
              className="w-full py-2.5 px-3 bg-white border border-[#cbc3d8] rounded-xl text-xs font-semibold text-[#191c1e] flex items-center justify-center gap-2 hover:bg-[#f2f4f6] transition-all shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#5e23dc]">sms</span>
              Login with OTP
            </button>
          </div>

          <p className="text-[10px] text-[#7a7487] text-center mt-4">
            By continuing, you agree to Ziva Housing&apos;s <a href="#" className="text-[#4500b4] underline">Terms of Service</a> and <a href="#" className="text-[#4500b4] underline">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Real OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#eceef0] relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#f5f3ff] text-[#5e23dc] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">sms</span>
              </div>
              <h3 className="text-xl font-bold text-[#191c1e]">Login with OTP</h3>
              <p className="text-xs text-[#7a7487] mt-1">
                {otpStep === 'PHONE'
                  ? 'Enter your mobile number and email address to receive your 6-digit verification code.'
                  : `Verification code sent to +91 ${otpPhone} and ${otpEmail}`}
              </p>
            </div>

            {otpError && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-semibold mb-4 border border-[#ffb4ab]">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="bg-[#d7f9e5] text-[#006e3a] p-3 rounded-xl text-xs font-semibold mb-4 border border-[#9df2c2]">
                {otpSuccess}
              </div>
            )}

            {otpStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#191c1e] block mb-1">Mobile Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-[#7a7487]">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-3 py-2.5 bg-white border border-[#cbc3d8] rounded-xl text-sm outline-none focus:border-[#5e23dc] font-semibold"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#191c1e] block mb-1">Email Address <span className="text-[#5e23dc] font-bold">(Required for SMTP Email OTP)</span></label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#7a7487] text-base">alternate_email</span>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#cbc3d8] rounded-xl text-sm outline-none focus:border-[#5e23dc]"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer mt-2"
                >
                  {otpLoading ? 'Sending Code...' : 'Get Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#191c1e] block mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full px-3 py-3 bg-white border border-[#cbc3d8] rounded-xl text-center text-xl font-bold tracking-[6px] outline-none focus:border-[#5e23dc]"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-sm rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('PHONE');
                      setOtpError('');
                    }}
                    className="text-xs text-[#5e23dc] font-semibold hover:underline cursor-pointer"
                  >
                    Change Phone Number
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
