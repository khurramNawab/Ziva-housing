'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NotificationCenter from '../../components/NotificationCenter';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [userInitials, setUserInitials] = useState('AD');

  useEffect(() => {
    if (pathname === '/admin/login') return;

    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/admin/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(accToken.split('.')[1] || ''));
      if (payload.role !== 'ADMIN') {
        router.push('/admin/login');
        return;
      }

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('Ziva_access');
        localStorage.removeItem('Ziva_refresh');
        router.push('/admin/login?reason=expired');
        return;
      }

      setToken(accToken);
      const initials = (payload.firstName?.substring(0, 2) || 'AD').toUpperCase();
      setUserInitials(initials);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem('Ziva_access');
      localStorage.removeItem('Ziva_refresh');
      router.push('/admin/login');
    }
  }, [router, pathname]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleSignOut = () => {
    localStorage.removeItem('Ziva_access');
    localStorage.removeItem('Ziva_refresh');
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'Overview & Commissions' },
    { href: '/admin/properties', icon: 'home_work', label: 'Properties Approval' },
    { href: '/admin/users', icon: 'group', label: 'Users & Vendors' },
    { href: '/admin/leads', icon: 'mail', label: 'CRM & Tickets' },
    { href: '/admin/audit-logs', icon: 'history', label: 'Compliance & Logs' },
  ];

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center font-[Rubik] antialiased">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#494455] font-medium text-sm">Loading admin dashboard activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] h-screen overflow-hidden flex font-[Rubik] antialiased">
      {/* ── SideNavBar ── */}
      <aside className="hidden md:flex flex-col h-full p-6 bg-[#f2f4f6] w-64 text-[#494455] shrink-0 border-r border-[#cbc3d8]">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Ziva Housing Logo" className="h-9 w-auto object-contain" />
          </Link>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#4500b4] text-white font-semibold py-3 px-4 rounded-lg mb-6 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>exit_to_app</span>
          Exit Portal
        </button>
        <nav className="flex-1 flex flex-col gap-1 text-[12px] leading-[16px] tracking-[0.05em] font-semibold">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all ${active
                    ? 'bg-[#5e23dc] text-white scale-95'
                    : 'text-[#494455] hover:bg-[#e6e8ea]'
                  }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-[#cbc3d8]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 text-[#494455] hover:bg-[#e6e8ea] rounded-lg text-left w-full text-[12px] leading-[16px] tracking-[0.05em] font-semibold"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f8f9fb]">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[24px] md:text-[32px] leading-[32px] md:leading-[40px] font-semibold text-[#191c1e]">
              {pathname === '/admin' && 'Overview & Revenue Dashboard'}
              {pathname === '/admin/properties' && 'Property Listings queue'}
              {pathname === '/admin/users' && 'User & Vendor moderation'}
              {pathname === '/admin/leads' && 'Pipeline Leads CRM & Support'}
              {pathname === '/admin/audit-logs' && 'Compliance & System Settings'}
            </h2>
            <p className="text-[14px] leading-[20px] text-[#6D7278]">Real-time system health and administration.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-10 h-10 rounded-full bg-[#e6e8ea] flex items-center justify-center font-bold text-sm text-[#4500b4] border border-[#cbc3d8]">
              {userInitials}
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
