'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string | null;
  durationMinutes: number | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface ServiceGroup {
  id: string;
  groupName: string;
  displayOrder: number;
  subOptions?: any[];
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  order: number;
  services: ServiceItem[];
  serviceGroups: ServiceGroup[];
}

const DEFAULT_MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-cleaning',
    name: 'Cleaning & Pest Control',
    slug: 'cleaning',
    icon: 'cleaning_services',
    isActive: true,
    order: 1,
    description: 'Deep bathroom, kitchen, sofa, carpet & full home cleaning with disinfectant jet wash.',
    serviceGroups: [
      { id: 'grp-cl-1', groupName: 'Cleaning', displayOrder: 1 },
      { id: 'grp-cl-2', groupName: 'Pest Control', displayOrder: 2 },
    ],
    services: [
      { id: 'svc-cl-1', name: 'Bathroom Cleaning (44 mins)', slug: 'bathroom-cleaning', basePrice: 499, durationMinutes: 44, description: 'Tile scrubbing, stains removal & sanitary disinfection.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-cl-2', name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', basePrice: 699, durationMinutes: 60, description: 'Degreasing cabinets, chimney wipe & countertop polish.', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-cl-3', name: 'Living & Bedroom Cleaning', slug: 'living-bedroom-cleaning', basePrice: 599, durationMinutes: 60, description: 'Dusting, floor scrubbing, vacuuming & furniture wiping.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-cl-4', name: 'Full Home / By Room Cleaning', slug: 'full-home-cleaning', basePrice: 1499, durationMinutes: 180, description: 'Top to bottom complete sanitized deep cleaning.', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-cl-5', name: 'Cockroach & Ant Control', slug: 'cockroach-control', basePrice: 599, durationMinutes: 45, description: 'Bayer herbal gel treatment with 6 months warranty.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-cl-6', name: 'Ants & Bed Bugs Control', slug: 'ants-bedbugs-control', basePrice: 799, durationMinutes: 60, description: 'Odorless spray treatment in joints & mattresses.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80', isActive: true },
    ],
  },
  {
    id: 'cat-womens-salon',
    name: "Women's Salon & Spa",
    slug: 'womens-salon-spa',
    icon: 'spa',
    isActive: true,
    order: 2,
    description: 'Waxing, facial cleanups, manicure, pedicure, hair spa & bridal styling at home.',
    serviceGroups: [
      { id: 'grp-ws-1', groupName: 'Salon at Home', displayOrder: 1 },
      { id: 'grp-ws-2', groupName: 'Spa & Relaxation', displayOrder: 2 },
    ],
    services: [
      { id: 'svc-ws-1', name: 'Salon for Women', slug: 'salon-for-women', basePrice: 499, durationMinutes: 60, description: 'RICA waxing, threading & cleanups with single-use kits.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-ws-2', name: 'Spa for Women', slug: 'spa-for-women', basePrice: 1199, durationMinutes: 60, description: 'Aromatherapy full body relaxing massage & hot oils.', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-ws-3', name: 'Hair Studio for Women', slug: 'hair-studio-women', basePrice: 699, durationMinutes: 45, description: 'L’Oréal hair spa, split end trimming & blow dry.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-ws-4', name: 'Makeup, Saree & Styling', slug: 'makeup-saree-styling', basePrice: 1499, durationMinutes: 90, description: 'Party makeup, saree draping & hairstyle for functions.', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80', isActive: true },
    ],
  },
  {
    id: 'cat-mens-salon',
    name: "Men's Salon & Massage",
    slug: 'mens-salon-massage',
    icon: 'content_cut',
    isActive: true,
    order: 3,
    description: 'Men grooming, haircut, beard styling, de-tan cleanup & therapeutic massage.',
    serviceGroups: [
      { id: 'grp-ms-1', groupName: 'Grooming & Haircut', displayOrder: 1 },
      { id: 'grp-ms-2', groupName: 'Therapeutic Massage', displayOrder: 2 },
    ],
    services: [
      { id: 'svc-ms-1', name: 'Salon for Men', slug: 'salon-for-men', basePrice: 349, durationMinutes: 45, description: 'Haircut, beard trimming & herbal face de-tan pack.', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80', isActive: true },
      { id: 'svc-ms-2', name: 'Massage for Men', slug: 'massage-for-men', basePrice: 999, durationMinutes: 60, description: 'Deep tissue stress relief massage for back & shoulders.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80', isActive: true },
    ],
  },
  {
    id: 'cat-ac-appliances',
    name: 'AC & Appliance Repair',
    slug: 'ac-appliance-repair',
    icon: 'ac_unit',
    isActive: false,
    order: 4,
    description: 'Expert servicing, foam jet wash, refrigerant recharge & motherboard fix.',
    serviceGroups: [
      { id: 'grp-ac-1', groupName: 'Large Appliances', displayOrder: 1 },
      { id: 'grp-ac-2', groupName: 'Kitchen & Small Appliances', displayOrder: 2 },
    ],
    services: [
      { id: 'svc-ac-1', name: 'AC Service & Power Jet (44 mins)', slug: 'ac-power-jet', basePrice: 499, durationMinutes: 44, description: 'Power jet wash of filters, cooling coils & outdoor unit.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-ac-2', name: 'Washing Machine Repair', slug: 'washing-machine-repair', basePrice: 299, durationMinutes: 45, description: 'Motor spin check, drain valve fix & drum diagnosis.', imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-ac-3', name: 'Refrigerator Repair', slug: 'refrigerator-repair', basePrice: 349, durationMinutes: 45, description: 'Gas check, thermostat relay replacement & cooling audit.', imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-ac-4', name: 'Television Repair & Wall Mount', slug: 'tv-repair-mount', basePrice: 299, durationMinutes: 40, description: 'LED TV wall bracket installation & speaker diagnostics.', imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-ac-5', name: 'Chimney & Microwave Repair', slug: 'chimney-microwave', basePrice: 399, durationMinutes: 45, description: 'Deep filter degreasing, motor check & magnetron test.', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80', isActive: false },
    ],
  },
  {
    id: 'cat-electrician-handy',
    name: 'Electrician, Plumber & Carpenter',
    slug: 'electrician-plumber-carpenter',
    icon: 'handyman',
    isActive: false,
    order: 5,
    description: 'Certified technicians for wiring, MCBs, pipe leakage, locks & furniture assembly.',
    serviceGroups: [
      { id: 'grp-el-1', groupName: 'Home Repairs', displayOrder: 1 },
      { id: 'grp-el-2', groupName: 'Home Installation', displayOrder: 2 },
    ],
    services: [
      { id: 'svc-el-1', name: 'Electrician (Wiring & Switches)', slug: 'electrician-wiring', basePrice: 149, durationMinutes: 30, description: 'Switchboard wiring, short-circuit diagnostics & MCB trips.', imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-el-2', name: 'Plumber (Tap Leak & Blockage)', slug: 'plumber-taps', basePrice: 199, durationMinutes: 30, description: 'Dripping taps, flush valve change & sink unclogging.', imageUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-el-3', name: 'Carpenter (19 mins arrival)', slug: 'carpenter-woodwork', basePrice: 299, durationMinutes: 19, description: 'Lock installation, door alignment & hinge repair.', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-el-4', name: 'Furniture Assembly (25 mins)', slug: 'furniture-assembly', basePrice: 399, durationMinutes: 25, description: 'Bed, wardrobe, dining table & study unit setup.', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80', isActive: false },
      { id: 'svc-el-5', name: 'Fan & Geyser Installation', slug: 'fan-geyser-install', basePrice: 299, durationMinutes: 45, description: 'Ceiling fan hanging, inlet pipe hookup & safety checks.', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80', isActive: false },
    ],
  },
  {
    id: 'cat-painting',
    name: 'Painting & Waterproofing',
    slug: 'painting-waterproofing',
    icon: 'format_paint',
    isActive: false,
    order: 6,
    description: 'Dustless sanding, waterproof primer & Asian Paints color finish.',
    serviceGroups: [
      { id: 'grp-pt-1', groupName: 'Wall Painting', displayOrder: 1 },
    ],
    services: [
      { id: 'svc-pt-1', name: 'Painting & Water - proofing', slug: 'home-painting-consult', basePrice: 499, durationMinutes: 60, description: 'Laser wall measurement, damp test & color consultation.', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80', isActive: false },
    ],
  },
  {
    id: 'cat-instahelp',
    name: 'InstaHelp',
    slug: 'instahelp',
    icon: 'support_agent',
    isActive: false,
    order: 7,
    description: 'On-demand verified cooks, domestic maids & child caregivers.',
    serviceGroups: [
      { id: 'grp-ih-1', groupName: 'Daily Help', displayOrder: 1 },
    ],
    services: [
      { id: 'svc-ih-1', name: 'InstaHelp Helper & Cook', slug: 'instahelp-helper', basePrice: 399, durationMinutes: 90, description: 'Hygienic home food preparation & dishwashing helper.', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80', isActive: false },
    ],
  },
];

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCatId, setExpandedCatId] = useState<string | null>('cat-cleaning');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('Ziva_access') || '';
    }
    return '';
  };

  const fetchCategories = async () => {
    setLoading(true);
    // 1. Check local saved state first for instant persistence
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('Ziva_categories_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed);
          }
        } catch {}
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/services/categories`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('Ziva_categories_state', JSON.stringify(data));
          }
        }
      }
    } catch (err: any) {
      console.warn('Using local categories state:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleCategory = async (cat: ServiceCategory) => {
    setActionLoadingId(cat.id);
    setSuccessMsg('');
    setErrorMsg('');
    const targetState = !cat.isActive;

    // Instant local state update for zero lag
    const updated = categories.map((c) =>
      c.id === cat.id
        ? {
            ...c,
            isActive: targetState,
            services: c.services.map((s) => ({ ...s, isActive: targetState })),
          }
        : c,
    );
    setCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('Ziva_categories_state', JSON.stringify(updated));
      window.dispatchEvent(new Event('ziva_categories_updated'));
    }

    setSuccessMsg(`Category "${cat.name}" is now ${targetState ? 'LIVE / ACTIVE' : 'DISABLED / HIDDEN'}!`);
    setTimeout(() => setSuccessMsg(''), 3000);

    try {
      await fetch(`${API_BASE}/admin/services/categories/${cat.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isActive: targetState }),
      });
    } catch (err) {
      // handled
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleService = async (service: ServiceItem, catId: string) => {
    setActionLoadingId(service.id);
    const targetState = !service.isActive;

    const updated = categories.map((c) =>
      c.id === catId
        ? {
            ...c,
            services: c.services.map((s) =>
              s.id === service.id ? { ...s, isActive: targetState } : s,
            ),
          }
        : c,
    );
    setCategories(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('Ziva_categories_state', JSON.stringify(updated));
      window.dispatchEvent(new Event('ziva_categories_updated'));
    }

    try {
      await fetch(`${API_BASE}/admin/services/items/${service.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isActive: targetState }),
      });
    } catch (err) {
      // handled
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (filter === 'ACTIVE' && !cat.isActive) return false;
    if (filter === 'INACTIVE' && cat.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchService = cat.services?.some((s) => s.name.toLowerCase().includes(q));
      return matchName || matchService;
    }
    return true;
  });

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fb] font-[Rubik]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5e23dc]">room_service</span>
              Home Services &amp; Category On/Off Control
            </h1>
            <p className="text-sm text-[#494455] mt-1">
              Control which service categories and sub-services are active on the storefront. Enable or disable services with 1-click.
            </p>
          </div>
          <button
            onClick={fetchCategories}
            className="self-start md:self-auto bg-white border border-[#cbc3d8] hover:bg-gray-50 text-[#191c1e] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh List
          </button>
        </div>

        {/* Launch Status Banner */}
        <div className="bg-gradient-to-r from-[#5e23dc]/10 via-[#4500b4]/5 to-transparent border-l-4 border-[#5e23dc] rounded-xl p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#5e23dc] text-2xl">rocket_launch</span>
            <div>
              <h3 className="font-bold text-sm text-[#191c1e]">Initial Launch State Active</h3>
              <p className="text-xs text-[#494455] mt-0.5">
                Currently <strong className="text-emerald-700 font-bold">{activeCount} Categories</strong> are active (Cleaning &amp; Salon/Spa). The remaining <strong className="text-amber-700 font-bold">{inactiveCount} Categories</strong> are disabled and hidden from customer booking.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">{activeCount} Live</span>
            <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full font-bold">{inactiveCount} Inactive</span>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-rose-600">error</span>
            {errorMsg}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#eceef0] shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#5e23dc] text-white shadow-xs'
                  : 'bg-gray-100 text-[#494455] hover:bg-gray-200'
              }`}
            >
              All Categories ({categories.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live / Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'INACTIVE'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'bg-gray-100 text-[#7a7487] hover:bg-gray-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Disabled / Off ({inactiveCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#7a7487] text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search category or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f2f4f6] rounded-xl pl-9 pr-4 py-2 text-xs text-[#191c1e] outline-none border border-transparent focus:border-[#5e23dc] transition-all"
            />
          </div>
        </div>

        {/* Categories List Cards */}
        <div className="space-y-4">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedCatId === cat.id;
            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs ${
                  cat.isActive ? 'border-[#eceef0]' : 'border-gray-200 opacity-90'
                }`}
              >
                {/* Category Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-3.5 cursor-pointer flex-1"
                    onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        cat.isActive ? 'bg-[#f0e7ff] text-[#5e23dc]' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <span className="material-symbols-outlined">{cat.icon || 'category'}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-[#191c1e]">{cat.name}</h2>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cat.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {cat.isActive ? 'LIVE' : 'DISABLED'}
                        </span>
                        <span className="text-xs text-[#7a7487]">
                          ({cat.services?.length || 0} services)
                        </span>
                      </div>
                      <p className="text-xs text-[#494455] mt-0.5 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>

                  {/* On/Off Switch & Expand Chevron */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#494455]">
                        {cat.isActive ? 'Category On' : 'Category Off'}
                      </span>
                      <button
                        type="button"
                        disabled={actionLoadingId === cat.id}
                        onClick={() => handleToggleCategory(cat)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          cat.isActive ? 'bg-[#5e23dc]' : 'bg-gray-300'
                        } ${actionLoadingId === cat.id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            cat.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-[#7a7487] transition-colors"
                      aria-label="Expand category services"
                    >
                      <span
                        className={`material-symbols-outlined transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sub-services Breakdown Accordion */}
                {isExpanded && (
                  <div className="border-t border-[#eceef0] bg-[#fafafa] p-4 sm:p-5 rounded-b-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                      <h4 className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                        Sub-Services &amp; Pricing Controls
                      </h4>
                      <span className="text-xs text-[#7a7487]">
                        Individual 1-click toggle for each service option
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {cat.services?.map((svc) => (
                        <div
                          key={svc.id}
                          className={`bg-white p-3 rounded-xl border flex items-center justify-between gap-3 shadow-2xs ${
                            svc.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              <img
                                src={svc.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80'}
                                alt={svc.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#191c1e] block line-clamp-1">
                                {svc.name}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] text-[#7a7487] mt-0.5">
                                <span className="font-semibold text-emerald-700">₹{svc.basePrice || 499}</span>
                                <span>•</span>
                                <span>{svc.durationMinutes ? `${svc.durationMinutes} mins` : 'Flexible'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-gray-500">
                              {svc.isActive ? 'Active' : 'Off'}
                            </span>
                            <button
                              type="button"
                              disabled={actionLoadingId === svc.id || !cat.isActive}
                              onClick={() => handleToggleService(svc, cat.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                svc.isActive && cat.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                              } ${actionLoadingId === svc.id || !cat.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  svc.isActive && cat.isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#eceef0] space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#7a7487]">
                search_off
              </span>
              <p className="text-sm font-semibold text-[#191c1e]">No matching categories found</p>
              <button
                onClick={() => { setFilter('ALL'); setSearchQuery(''); }}
                className="text-xs text-[#5e23dc] font-bold hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
