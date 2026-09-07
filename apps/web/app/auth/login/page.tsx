'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      const accessToken = data.data?.accessToken || data.accessToken;
      const refreshToken = data.data?.refreshToken || data.refreshToken;

      if (!accessToken) throw new Error(data.message || 'Login failed, no token received');

      localStorage.setItem('Ziva_access', accessToken);
      if (refreshToken) localStorage.setItem('Ziva_refresh', refreshToken);

      const payload = JSON.parse(atob(accessToken.split('.')[1] || '{}'));
      const role = payload.role;

      if (role === 'CUSTOMER') {
        router.push('/dashboard/customer');
      } else if (role === 'OWNER') {
        router.push('/dashboard/owner');
      } else if (role === 'AGENT') {
        router.push('/dashboard/agent');
      } else if (role === 'SERVICE_PROVIDER') {
        router.push('/dashboard/provider');
      } else if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to server. Please ensure the backend is running or try again later.');
      } else {
        setError(err.message);
      }
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
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#191919]/90 via-[#191919]/40 to-transparent" />

          <div className="relative z-10">
            <Link href="/" className="font-bold text-2xl text-white tracking-tight flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#5e23dc] flex items-center justify-center text-base font-bold text-white">J</div>
              Ziva Housing
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
            <Link href="/" className="font-bold text-xl text-[#4500b4] tracking-tight inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-xs">J</span>
              Ziva Housing
            </Link>
          </div>

          <div className="mb-4">
            <h2 className="text-[24px] leading-[32px] font-bold text-[#191c1e]">Welcome Back</h2>
            <p className="text-[13px] leading-[18px] text-[#494455] mt-0.5">Log in to manage your properties and services.</p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-[#f2f4f6] rounded-xl p-1 mb-4">
            <button
              className="flex-1 py-1.5 text-[12px] leading-[16px] tracking-[0.05em] font-semibold bg-white text-[#4500b4] shadow-sm rounded-lg transition-all"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="flex-1 py-1.5 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#494455] hover:text-[#4500b4] transition-all rounded-lg"
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && (
              <div className="bg-[#ffdad6] text-[#9300a] p-2.5 rounded-lg text-xs font-semibold">
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
              className="w-full py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-[13px] leading-[18px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-1"
            >
              {loading ? 'Logging in...' : 'Login'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <div className="flex items-center gap-3 my-3">
            <hr className="flex-1 border-[#cbc3d8]" />
            <span className="text-[11px] text-[#7a7487] font-semibold">Or continue with</span>
            <hr className="flex-1 border-[#cbc3d8]" />
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-2">
            <button suppressHydrationWarning className="w-full py-2 px-3 bg-white border border-[#cbc3d8] rounded-xl text-xs font-semibold text-[#191c1e] flex items-center justify-center gap-2 hover:bg-[#f2f4f6] transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button suppressHydrationWarning className="w-full py-2 px-3 bg-white border border-[#cbc3d8] rounded-xl text-xs font-semibold text-[#191c1e] flex items-center justify-center gap-2 hover:bg-[#f2f4f6] transition-all">
              <span className="material-symbols-outlined text-sm text-[#7a7487]">sms</span>
              Login with OTP
            </button>
          </div>

          <p className="text-[10px] text-[#7a7487] text-center mt-3">
            By continuing, you agree to Ziva Housing&apos;s <a href="#" className="text-[#4500b4] underline">Terms of Service</a> and <a href="#" className="text-[#4500b4] underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
