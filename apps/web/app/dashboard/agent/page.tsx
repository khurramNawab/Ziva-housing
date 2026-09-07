'use client';

/**
 * TODO: Defer API wiring of this dashboard until the missing Agent backend modules/APIs
 * (from the earlier "Tier 4 — build missing backend modules" plan) are implemented.
 * Currently, no controller or service exists for AgentProfile on the server.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) { router.push('/auth/login'); return; }
    try {
      const payload = JSON.parse(atob(accToken.split('.')[1] || ''));
      setCurrentUser(payload);
      setToken(accToken);
    } catch { router.push('/auth/login'); }
    setLoading(false);
  }, [router]);

  const sidebarLinks = [
    { icon: 'dashboard', label: 'Dashboard', key: 'dashboard' },
    { icon: 'group', label: 'Leads', key: 'leads' },
    { icon: 'home_work', label: 'My Listings', key: 'listings' },
    { icon: 'mail', label: 'Inbox', key: 'inbox' },
    { icon: 'payments', label: 'Payments', key: 'payments' },
    { icon: 'settings', label: 'Settings', key: 'settings' },
  ];

  interface PipelineCard {
    name: string;
    time: string;
    desc: string;
    budget: string;
    hot: boolean;
    visitHighlight?: boolean;
  }

  // Mock pipeline data matching Stitch design
  const pipelineColumns: { title: string; count: number; color: string; cards: PipelineCard[] }[] = [
    {
      title: 'New', count: 4, color: 'bg-[#cbc3d8]',
      cards: [
        { name: 'Michael T.', time: '2h ago', desc: 'Looking for 3BHK in HSR Layout', budget: '₹1.5Cr - ₹2Cr', hot: false },
        { name: 'Priya S.', time: '', desc: 'Immediate possession, Whitefield', budget: '₹80L - ₹1Cr', hot: true },
      ],
    },
    {
      title: 'Contacted', count: 2, color: 'bg-[#cbc3d8]',
      cards: [
        { name: 'Rahul K.', time: 'Yesterday', desc: 'Shared brochure for Orchid Springs', budget: 'Rent: ₹40k', hot: false },
      ],
    },
    {
      title: 'Visit', count: 3, color: 'bg-[#e8ddff]',
      cards: [
        { name: 'Sarah J.', time: 'Today 2:30 PM', desc: 'Skyline Residency, Apt 402', budget: '₹2.2Cr', hot: false, visitHighlight: true },
      ],
    },
    {
      title: 'Negotiation', count: 1, color: 'bg-[#FEEBC8]',
      cards: [
        { name: 'Amit P.', time: '', desc: 'Offered ₹1.4Cr for Villa 12, waiting on owner.', budget: 'Est. Comm: ₹2.8L', hot: false },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#4500b4] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] font-[Rubik] antialiased overflow-x-hidden flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex bg-[#f2f4f6] flex-col h-full p-6 w-64 shrink-0 z-20">
        <div className="mb-6">
          <h1 className="text-[20px] leading-[28px] font-semibold text-[#4500b4]">Ziva Dashboard</h1>
          <p className="text-[14px] leading-[20px] text-[#494455] mt-1">Manage your properties</p>
        </div>
        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => setActiveTab(link.key)}
              className={`flex items-center w-full px-4 py-3 rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-semibold transition-all ${activeTab === link.key
                  ? 'bg-[#5e23dc] text-[#cfbfff] scale-95'
                  : 'text-[#494455] hover:bg-[#e6e8ea]'
                }`}
            >
              <span className="material-symbols-outlined mr-3" style={activeTab === link.key ? { fontVariationSettings: "'FILL' 1" } : {}}>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 pt-6 border-t border-[#cbc3d8]">
          <button className="w-full bg-[#4500b4] text-white text-[12px] leading-[16px] tracking-[0.05em] font-semibold py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity mb-6">
            Post New Listing
          </button>
          <a className="flex items-center px-4 py-3 text-[#494455] hover:bg-[#e6e8ea] rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-semibold transition-colors" href="#">
            <span className="material-symbols-outlined mr-3">help</span> Help Center
          </a>
          <button
            onClick={() => { localStorage.removeItem('Ziva_access'); router.push('/auth/login'); }}
            className="flex items-center w-full px-4 py-3 text-[#494455] hover:bg-[#e6e8ea] rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined mr-3">logout</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8f9fb] relative flex flex-col">
        <div className="p-4 md:p-10 max-w-[1280px] mx-auto w-full space-y-6 pb-24 md:pb-10">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[24px] md:text-[32px] leading-[32px] md:leading-[40px] font-semibold text-[#191c1e]">Agent Overview</h2>
              <p className="text-[14px] leading-[20px] text-[#6D7278] mt-1">Track your pipeline, listings, and commissions.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7487]">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#cbc3d8] rounded-lg text-[16px] leading-[24px] focus:border-[#4500b4] focus:ring-2 focus:ring-[#4500b4]/10 transition-all outline-none"
                  placeholder="Search leads or listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="w-10 h-10 rounded-full bg-white border border-[#cbc3d8] flex items-center justify-center shrink-0 hover:bg-[#f2f4f6] transition-colors relative">
                <span className="material-symbols-outlined text-[#494455]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#5e23dc] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {currentUser?.firstName?.[0] || 'A'}
              </div>
            </div>
          </div>

          {/* ── KPI Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Commissions */}
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#eceef0] flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[14px] leading-[20px] text-[#6D7278]">Total Commissions (YTD)</p>
                  <h3 className="text-[24px] leading-[32px] font-semibold text-[#191c1e] mt-1">₹12.4L</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#E8FAF4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#16A373]">account_balance_wallet</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16A373] text-sm">trending_up</span>
                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#16A373]">+15% vs last month</span>
              </div>
            </div>

            {/* Active Leads */}
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#eceef0] flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[14px] leading-[20px] text-[#6D7278]">Active Leads</p>
                  <h3 className="text-[24px] leading-[32px] font-semibold text-[#191c1e] mt-1">42</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e8ddff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#4500b4]">group</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278]">8 need follow-up</span>
              </div>
            </div>

            {/* Active Listings */}
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#eceef0] flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[14px] leading-[20px] text-[#6D7278]">Active Listings</p>
                  <h3 className="text-[24px] leading-[32px] font-semibold text-[#191c1e] mt-1">15</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e6e8ea] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#494455]">real_estate_agent</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278]">3 pending approval</span>
              </div>
            </div>

            {/* Next Visit — dark card */}
            <div className="bg-[#191919] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-col justify-between h-full relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#5e23dc] via-[#191919] to-[#191919]" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-1 bg-[#545353] text-white rounded text-[12px] leading-[16px] tracking-[0.05em] font-semibold">Next Visit</span>
                  <span className="material-symbols-outlined text-white">calendar_today</span>
                </div>
                <h4 className="text-[20px] leading-[28px] font-semibold text-white mb-1">Today, 2:30 PM</h4>
                <p className="text-[14px] leading-[20px] text-[#e0e3e5] mb-3">Skyline Residency, Apt 402</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#5e23dc] flex items-center justify-center text-white text-[10px] font-bold">SJ</div>
                  <span className="text-[14px] leading-[20px] text-[#e0e3e5]">with Sarah Jenkins</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Lead Pipeline Kanban ── */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[20px] leading-[28px] font-semibold text-[#191c1e]">Lead Pipeline</h3>
              <button className="text-[#4500b4] text-[12px] leading-[16px] tracking-[0.05em] font-semibold hover:text-[#6934e7] transition-colors">View All Leads →</button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
              {pipelineColumns.map((col) => (
                <div key={col.title} className="bg-[#f2f4f6] rounded-xl p-3 w-72 shrink-0 snap-start flex flex-col min-h-[400px] border border-transparent">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#494455] uppercase">
                      {col.title} <span className={`ml-2 ${col.color} text-[#494455] px-2 py-0.5 rounded-full text-[10px]`}>{col.count}</span>
                    </h4>
                  </div>
                  <div className="space-y-3 flex-1">
                    {col.cards.map((card, i) => (
                      <div
                        key={i}
                        className={`bg-white p-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#eceef0] cursor-grab hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow ${card.hot ? 'border-l-2 border-l-[#ba1a1a]' : ''
                          } ${card.visitHighlight ? 'border-l-2 border-l-[#4500b4]' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-[16px] leading-[24px] font-semibold text-[#191c1e]">{card.name}</h5>
                          {card.hot ? (
                            <span className="text-xs text-[#ba1a1a] font-medium flex items-center">
                              <span className="material-symbols-outlined text-[12px] mr-0.5">local_fire_department</span> Hot
                            </span>
                          ) : card.visitHighlight ? (
                            <span className="text-xs text-[#4500b4] font-medium flex items-center bg-[#e8ddff] px-1.5 py-0.5 rounded">{card.time}</span>
                          ) : card.time ? (
                            <span className="text-xs text-[#6D7278] bg-[#e6e8ea] px-1.5 py-0.5 rounded">{card.time}</span>
                          ) : null}
                        </div>
                        <p className="text-[14px] leading-[20px] text-[#6D7278] mb-3 line-clamp-1">{card.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#4500b4]">{card.budget}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Active Listings Table ── */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[20px] leading-[28px] font-semibold text-[#191c1e]">Active Listings</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-[#cbc3d8] rounded-lg text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#191c1e] hover:bg-[#f2f4f6] transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                </button>
              </div>
            </div>
            <div className="bg-white border border-[#cbc3d8] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f2f4f6] border-b border-[#cbc3d8]">
                      <th className="p-4 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278] uppercase">Property</th>
                      <th className="p-4 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278] uppercase">Status</th>
                      <th className="p-4 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278] uppercase">Price</th>
                      <th className="p-4 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278] uppercase">Owner/Co-Agent</th>
                      <th className="p-4 text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#6D7278] uppercase text-right">Views/Leads</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cbc3d8]">
                    <tr className="hover:bg-[#f8f9fb] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-[#e6e8ea] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#7a7487]">apartment</span>
                          </div>
                          <div>
                            <p className="text-[16px] leading-[24px] font-medium text-[#191c1e]">Skyline Residency, Apt 402</p>
                            <p className="text-[14px] leading-[20px] text-[#6D7278]">Koramangala, Bangalore</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#E8FAF4] text-[#16A373] text-[12px] leading-[16px] tracking-[0.05em] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A373] mr-1.5" /> Active
                        </span>
                      </td>
                      <td className="p-4 text-[16px] leading-[24px] text-[#191c1e] font-medium">₹2.2 Cr</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#e5e2e1] flex items-center justify-center text-[10px] font-semibold text-[#3d3c3c]">JD</div>
                          <span className="text-[14px] leading-[20px] text-[#191c1e]">John Doe</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-[16px] leading-[24px] text-[#191c1e]">1,240 <span className="text-[#6D7278] text-sm">/ 12</span></p>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-[#7a7487] hover:text-[#4500b4] transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f8f9fb] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-[#e0e3e5] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#7a7487]">image</span>
                          </div>
                          <div>
                            <p className="text-[16px] leading-[24px] font-medium text-[#191c1e]">Orchid Springs Villa</p>
                            <p className="text-[14px] leading-[20px] text-[#6D7278]">Whitefield, Bangalore</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#FEEBC8] text-[#9A6A00] text-[12px] leading-[16px] tracking-[0.05em] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9A6A00] mr-1.5" /> Under Offer
                        </span>
                      </td>
                      <td className="p-4 text-[16px] leading-[24px] text-[#191c1e] font-medium">₹4.5 Cr</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#e8ddff] flex items-center justify-center text-[10px] font-semibold text-[#4500b4]">RS</div>
                          <span className="text-[14px] leading-[20px] text-[#191c1e]">Ravi S. (Co)</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-[16px] leading-[24px] text-[#191c1e]">3,102 <span className="text-[#6D7278] text-sm">/ 45</span></p>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-[#7a7487] hover:text-[#4500b4] transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-[#cbc3d8] bg-white text-center">
                <button className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold text-[#4500b4] hover:underline">View All Listings</button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
