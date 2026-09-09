'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'expired') {
        setError('Your admin session has expired. Please log in again to continue.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(
        `${apiBase}/api/v1/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: form.email, password: form.password }),
        }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Decode JWT to check role
      const token = data.data?.accessToken;
      if (!token) throw new Error('No token received');

      let payload: any = {};
      try {
        payload = JSON.parse(atob(token.split('.')[1] || ''));
      } catch {
        throw new Error('Invalid token format');
      }

      if (payload.role !== 'ADMIN') {
        throw new Error('Access denied. Admin credentials required.');
      }

      localStorage.setItem('Ziva_access', token);
      localStorage.setItem('Ziva_refresh', data.data.refreshToken);
      router.push('/admin');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0c1a] flex items-center justify-center p-4 font-[Rubik]">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#5e23dc] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-[#16a373] rounded-full blur-[100px] opacity-10 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#5e23dc] to-[#4500b4] rounded-2xl shadow-2xl shadow-[#5e23dc]/40 mb-4">
            <span className="material-symbols-outlined text-3xl text-white">admin_panel_settings</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-[#8b8699] text-sm mt-1">Ziva Housing — Internal Access Only</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#16121f] border border-[#2a2340] rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-[#3b1219] border border-[#ba1a1a]/40 text-[#ff8b8b] px-4 py-3 rounded-xl text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09ab5] uppercase tracking-wider">
                Admin Email
              </label>
              <div className="flex items-center gap-3 bg-[#0e0c1a] border border-[#2a2340] focus-within:border-[#5e23dc] rounded-xl px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-[#5e23dc] text-lg flex-shrink-0">alternate_email</span>
                <input
                  type="email"
                  required
                  placeholder="admin@zivahousing.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#4a4460] font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#a09ab5] uppercase tracking-wider">
                Password
              </label>
              <div className="flex items-center gap-3 bg-[#0e0c1a] border border-[#2a2340] focus-within:border-[#5e23dc] rounded-xl px-4 py-3 transition-colors">
                <span className="material-symbols-outlined text-[#5e23dc] text-lg flex-shrink-0">lock</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:text-[#4a4460] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-[#4a4460] hover:text-[#8b8699] transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#5e23dc] to-[#4500b4] hover:from-[#4500b4] hover:to-[#3500a0] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#5e23dc]/30 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">security</span>
                  Sign In to Admin Panel
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-5 border-t border-[#2a2340] flex items-start gap-2 text-[10px] text-[#4a4460]">
            <span className="material-symbols-outlined text-xs mt-0.5">shield</span>
            <span>This portal is restricted to authorized Ziva Housing administrators. All activity is logged and monitored.</span>
          </div>
        </div>

        {/* Back to main site */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-[#5e23dc] hover:text-[#8b5cf6] text-xs font-semibold transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Back to Ziva Housing
          </Link>
        </div>
      </div>
    </div>
  );
}
