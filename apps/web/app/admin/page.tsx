'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Stats {
  totalUsers: number;
  totalProperties: number;
  totalLeads: number;
  leadsToday: number;
  revenueThisMonth: number;
  propertiesByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

interface CommissionRule {
  id: string;
  name: string;
  type: string;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  applicableTo: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  commissionAmount: number;
  gstAmount: number;
  createdAt: string;
  transaction: {
    id: string;
    status: string;
    amount: number;
  };
}

interface CommissionStats {
  grossRevenue: number;
  commissionRevenue: number;
  gstCollected: number;
  netPayouts: number;
  totalPayoutsCount: number;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Overview stats & commissions rule engine
  const [stats, setStats] = useState<Stats | null>(null);
  const [rulesList, setRulesList] = useState<CommissionRule[]>([]);
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);

  // Vendor pipeline KPIs
  const [vendorPendingCount, setVendorPendingCount] = useState(0);
  const [vendorApprovedCount, setVendorApprovedCount] = useState(0);

  // New Rule Form
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState('PERCENTAGE');
  const [newRuleRate, setNewRuleRate] = useState('');
  const [newRuleApplicable, setNewRuleApplicable] = useState('PROPERTY_SELL');
  const [calcPreviewPrice, setCalcPreviewPrice] = useState('');
  const [calcPreviewResult, setCalcPreviewResult] = useState<number | null>(null);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/admin/login');
      return;
    }
    setToken(accToken);
    fetchData(accToken);
  }, [router]);

  const fetchData = async (accToken: string) => {
    setLoading(true);
    setError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const statsRes = await fetch(`${apiBase}/api/v1/admin/dashboard`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const statsJson = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsJson.data || statsJson);
      }

      // Vendor pipeline counts
      const [pendingVRes, approvedVRes] = await Promise.allSettled([
        fetch(`${apiBase}/api/v1/admin/vendors/pending`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/vendors/approved`, { headers: { Authorization: `Bearer ${accToken}` } }),
      ]);
      if (pendingVRes.status === 'fulfilled' && pendingVRes.value.ok) {
        const json = await pendingVRes.value.json();
        const list = json.data || json || [];
        setVendorPendingCount(Array.isArray(list) ? list.length : 0);
      }
      if (approvedVRes.status === 'fulfilled' && approvedVRes.value.ok) {
        const json = await approvedVRes.value.json();
        const list = json.data || json || [];
        setVendorApprovedCount(Array.isArray(list) ? list.length : 0);
      }

      // Commissions
      const [rulesRes, invoicesRes, statsRes2] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/commissions/rules`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/invoices`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/commissions/stats`, { headers: { Authorization: `Bearer ${accToken}` } }),
      ]);

      if (rulesRes.ok) {
        const json = await rulesRes.json();
        setRulesList(json.data || json || []);
      }
      if (invoicesRes.ok) {
        const json = await invoicesRes.json();
        setInvoicesList(json.data || json || []);
      }
      if (statsRes2.ok) {
        const json = await statsRes2.json();
        setCommissionStats(json.data || json || null);
      }
    } catch (err) {
      setError('Failed to load metrics and revenue database. Showing demo/sandbox mode database statistics.');
      setStats({
        totalUsers: 1420,
        totalProperties: 512,
        totalLeads: 87,
        leadsToday: 14,
        revenueThisMonth: 125000,
        propertiesByStatus: { ACTIVE: 412, PENDING_REVIEW: 45, SUSPENDED: 32, REJECTED: 23 },
        usersByRole: { CUSTOMER: 950, OWNER: 320, AGENT: 110, SERVICE_PROVIDER: 40 }
      });
      setVendorPendingCount(2);
      setVendorApprovedCount(2);
      setRulesList([
        { id: 'rule-1', name: 'Standard Property Sale Commission', type: 'PERCENTAGE', rate: 2.5, isActive: true, applicableTo: 'PROPERTY_SELL' },
        { id: 'rule-2', name: 'Standard Rental Commission', type: 'PERCENTAGE', rate: 5, isActive: true, applicableTo: 'PROPERTY_RENT' },
        { id: 'rule-3', name: 'Home Services Flat Fee', type: 'PERCENTAGE', rate: 10, isActive: true, applicableTo: 'SERVICE_BOOKING' }
      ]);
      setInvoicesList([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          totalAmount: 15000,
          commissionAmount: 375,
          gstAmount: 67.5,
          createdAt: new Date().toISOString(),
          transaction: { id: 'tx-1', status: 'SUCCESS', amount: 15000 }
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2024-002',
          totalAmount: 25000,
          commissionAmount: 625,
          gstAmount: 112.5,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          transaction: { id: 'tx-2', status: 'SUCCESS', amount: 25000 }
        }
      ]);
      setCommissionStats({
        grossRevenue: 40000,
        commissionRevenue: 1000,
        gstCollected: 180,
        netPayouts: 38820,
        totalPayoutsCount: 2
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleRate) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/commissions/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRuleName,
          type: newRuleType,
          rate: Number(newRuleRate),
          applicableTo: newRuleApplicable,
        }),
      });
      if (res.ok) {
        alert('Commission rule rule-slab created successfully.');
        setNewRuleName('');
        setNewRuleRate('');
        fetchData(token);
      } else {
        alert('Failed to save rules engine.');
      }
    } catch (err) {
      alert('Error creating commission rule.');
    }
  };

  const calculatePreview = () => {
    if (!calcPreviewPrice) return;
    const price = Number(calcPreviewPrice);
    const matched = rulesList.find((r) => r.applicableTo === newRuleApplicable && r.isActive);
    if (matched) {
      const rate = Number(matched.rate);
      const computed = matched.type === 'PERCENTAGE' ? (price * rate) / 100 : rate;
      setCalcPreviewResult(computed);
    } else {
      setCalcPreviewResult(Math.round(price * 0.025)); // fallback default 2.5%
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#ba1a1a] px-4 py-2 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#cbc3d8] flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">Total Properties</span>
            <span className="material-symbols-outlined text-[#4500b4] bg-[#e8ddff] p-1.5 rounded-full text-sm">home_work</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            {stats?.totalProperties || 0}
          </div>
          <div className="text-[11px] leading-[20px] text-[#16A373] flex items-center gap-1 mt-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +5.2% this week
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#cbc3d8] flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">Active Users</span>
            <span className="material-symbols-outlined text-[#4500b4] bg-[#e8ddff] p-1.5 rounded-full text-sm">group</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[11px] leading-[20px] text-[#16A373] flex items-center gap-1 mt-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +12% this month
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#cbc3d8] flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">New Leads Today</span>
            <span className="material-symbols-outlined text-[#4500b4] bg-[#e8ddff] p-1.5 rounded-full text-sm">mail</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            {stats?.totalLeads || 0}
          </div>
          <div className="text-[11px] leading-[20px] text-[#7a7487] flex items-center gap-1 mt-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_flat</span>
            Steady
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#cbc3d8] flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">Revenue This Month</span>
            <span className="material-symbols-outlined text-[#4500b4] bg-[#e8ddff] p-1.5 rounded-full text-sm">payments</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            ₹{(stats?.revenueThisMonth || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] leading-[20px] text-[#16A373] flex items-center gap-1 mt-1 font-bold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +8.4% vs last month
          </div>
        </div>
      </section>

      {/* Vendor Pipeline KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">Pending Vendor Applications</span>
            <span className="material-symbols-outlined text-amber-700 bg-amber-100 p-1.5 rounded-full text-sm">hourglass_empty</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            {vendorPendingCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {vendorPendingCount > 0 ? 'Awaiting admin review' : 'All clear — no pending applications'}
            </span>
            <a href="/admin/users" className="text-[10px] text-[#5e23dc] font-bold hover:underline">Review →</a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#16a373]/20 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-[13px] leading-[20px] text-[#7a7487] font-semibold">Active Verified Vendors</span>
            <span className="material-symbols-outlined text-[#16a373] bg-[#e8faf4] p-1.5 rounded-full text-sm">verified_user</span>
          </div>
          <div className="text-[20px] leading-[28px] font-semibold text-[#191c1e] mt-1">
            {vendorApprovedCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-[#16a373] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Live on service marketplace
            </span>
            <a href="/admin/users" className="text-[10px] text-[#5e23dc] font-bold hover:underline">Manage →</a>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#cbc3d8] flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#cbc3d8] flex justify-between items-center">
            <h3 className="text-[16px] leading-[24px] font-bold text-[#191c1e]">Recent Activity Feed</h3>
            <span className="text-[10px] bg-[#e8ddff] text-[#4500b4] px-2 py-0.5 rounded-full font-bold">LIVE UPDATE</span>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <ul className="space-y-4">
              <li className="flex gap-3 items-start border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-[#f2f4f6] flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[#494455] text-sm">home_work</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#191c1e]">New property listing awaiting review.</p>
                  <p className="text-[10px] text-[#7a7487] mt-0.5">10 mins ago • Document checks pending</p>
                </div>
              </li>
              <li className="flex gap-3 items-start border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-[#E8FAF4] flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[#16A373] text-sm">check_circle</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#191c1e]">Vendor onboarding application approved.</p>
                  <p className="text-[10px] text-[#7a7487] mt-0.5">1 hour ago • Action by System Moderator</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-sm">report</span>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#191c1e]">Compliance alert triggered: Price outlier flagged.</p>
                  <p className="text-[10px] text-[#7a7487] mt-0.5">3 hours ago • Check compliance alerts logs.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-[#cbc3d8] flex flex-col p-6 space-y-4">
          <h3 className="text-[16px] leading-[24px] font-bold text-[#191c1e]">Workspace Shortcuts</h3>

          <Link href="/admin/properties" className="bg-[#f2f4f6] hover:bg-[#e8ddff]/30 border border-[#cbc3d8]/50 p-4 rounded-xl flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5e23dc]">home_work</span>
              <div>
                <h4 className="text-xs font-bold text-[#191c1e] group-hover:text-[#4500b4] transition-colors">Properties approvals</h4>
                <p className="text-[10px] text-[#7a7487] mt-0.5">Review property documents</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-xs text-[#7a7487] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>

          <Link href="/admin/users" className="bg-[#f2f4f6] hover:bg-[#e8ddff]/30 border border-[#cbc3d8]/50 p-4 rounded-xl flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5e23dc]">group</span>
              <div>
                <h4 className="text-xs font-bold text-[#191c1e] group-hover:text-[#4500b4] transition-colors">Users &amp; Vendors</h4>
                <p className="text-[10px] text-[#7a7487] mt-0.5">Moderate active accounts</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-xs text-[#7a7487] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>

          <Link href="/admin/leads" className="bg-[#f2f4f6] hover:bg-[#e8ddff]/30 border border-[#cbc3d8]/50 p-4 rounded-xl flex items-center justify-between transition group">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#5e23dc]">support_agent</span>
              <div>
                <h4 className="text-xs font-bold text-[#191c1e] group-hover:text-[#4500b4] transition-colors">CRM &amp; Tickets</h4>
                <p className="text-[10px] text-[#7a7487] mt-0.5">Support ticket messaging</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-xs text-[#7a7487] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Commissions Rules and Invoices Engine */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Rules & Rules Form (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-[#cbc3d8] rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="border-b border-[#eceef0] pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#191c1e]">Commissions &amp; Rule Engine</h3>
              <p className="text-xs text-[#7a7487] mt-0.5">Configure transaction fees, rules, and rules slab.</p>
            </div>
            {commissionStats && (
              <span className="bg-[#e8faf4] text-[#16a373] text-xs font-bold px-3 py-1 rounded-full border border-[#16a373]/20">
                GST Collected: ₹{Number(commissionStats.gstCollected || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Active Rules List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Active Rule Slabs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rulesList.map((rule) => (
                <div key={rule.id} className="border border-[#cbc3d8]/50 p-4 rounded-xl bg-[#f8f9fb] relative flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="font-bold text-xs text-[#191c1e] truncate">{rule.name}</h5>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${rule.isActive ? 'bg-[#e8faf4] text-[#16a373]' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7a7487] uppercase tracking-wider">{rule.applicableTo.replace('_', ' ')}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-baseline border-t border-dashed border-[#cbc3d8]/40 pt-2 text-xs font-bold">
                    <span className="text-gray-500">Rate:</span>
                    <span className="text-[#5e23dc] text-sm">
                      {rule.type === 'PERCENTAGE' ? `${rule.rate}%` : `₹${rule.rate}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules Form */}
          <form onSubmit={handleCreateCommissionRule} className="border-t border-[#eceef0] pt-6 space-y-4">
            <h4 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Add New Rule Slab</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Sale Split"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-2.5 text-xs text-[#191c1e] outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Applicable To</label>
                <select
                  value={newRuleApplicable}
                  onChange={(e) => setNewRuleApplicable(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-2 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="PROPERTY_SELL">PROPERTY SELL (Brokerage)</option>
                  <option value="PROPERTY_RENT">PROPERTY RENT (Tenant Finder)</option>
                  <option value="SERVICE_BOOKING">HOME SERVICE BOOKING</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Rule Type</label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-2 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="PERCENTAGE">PERCENTAGE (%)</option>
                  <option value="FIXED">FIXED AMOUNT (INR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Rate / Amount</label>
                <input
                  type="number"
                  placeholder="e.g. 2.5 or 500"
                  value={newRuleRate}
                  onChange={(e) => setNewRuleRate(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-2.5 text-xs text-[#191c1e] outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm"
            >
              Save Rule Slab
            </button>
          </form>
        </div>

        {/* Calc Preview & Recent Invoices (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Calc Preview */}
          <div className="bg-white border border-[#cbc3d8] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Commission Calculator Preview</h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Transaction Value (INR)"
                value={calcPreviewPrice}
                onChange={(e) => setCalcPreviewPrice(e.target.value)}
                className="flex-1 bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-4 py-2 text-xs outline-none text-[#191c1e]"
              />
              <button
                type="button"
                onClick={calculatePreview}
                className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Compute
              </button>
            </div>
            {calcPreviewResult !== null && (
              <div className="bg-[#e8faf4] border border-[#16a373]/20 p-3 rounded-xl flex justify-between items-center text-xs font-bold">
                <span className="text-[#006c47]">Computed Commission Split:</span>
                <span className="text-sm text-[#006c47]">₹{calcPreviewResult.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Invoices List */}
          <div className="bg-white border border-[#cbc3d8] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#cbc3d8] bg-[#f8f9fb] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#494455] uppercase tracking-wider">Recent Invoices</h3>
              <span className="bg-[#e8ddff] text-[#4500b4] text-[9px] font-bold px-2 py-0.5 rounded-full">
                {invoicesList.length} Generated
              </span>
            </div>
            <div className="divide-y divide-[#eceef0] max-h-[300px] overflow-y-auto">
              {invoicesList.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No invoices recorded yet.</div>
              ) : (
                invoicesList.map((invoice) => (
                  <div key={invoice.id} className="p-4 hover:bg-gray-50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#191c1e]">{invoice.invoiceNumber}</p>
                      <p className="text-[10px] text-gray-500">
                        Total Transaction: ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#006c47]">₹{Number(invoice.commissionAmount).toLocaleString('en-IN')}</p>
                      <span className="text-[9px] text-[#7a7487]">GST ₹{invoice.gstAmount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
