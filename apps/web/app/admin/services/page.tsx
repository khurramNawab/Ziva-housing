'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ServiceTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  startingPrice: number | null;
  features: string[];
  displayOrder: number;
  isActive: boolean;
  services?: ServiceItem[];
}

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  durationMinutes: number | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
  subCategoryId?: string | null;
  tierId?: string | null;
}

interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  groupHeader: string | null;
  displayOrder: number;
  isActive: boolean;
  tiers?: ServiceTier[];
  services?: ServiceItem[];
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  description?: string | null;
  order: number;
  isActive: boolean;
  subCategories?: ServiceSubCategory[];
  services?: ServiceItem[];
}

function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `/api/v1${cleanPath}`;
  }
  const base = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const cleanBase = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return `${cleanBase}${cleanPath}`;
}

function renderAdminIcon(iconStr: string | null | undefined, fallbackEmoji = '🛠️', size = 'text-2xl') {
  if (!iconStr) return <span className={size}>{fallbackEmoji}</span>;
  const trimmed = iconStr.trim();
  if (/^[a-z0-9_]+$/i.test(trimmed) && trimmed.length > 2) {
    return <span className={`material-symbols-outlined ${size} text-[#5e23dc]`}>{trimmed}</span>;
  }
  return <span className={size}>{trimmed}</span>;
}

export default function AdminServicesHierarchyPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Accordion expanded states
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

  // Active modal management
  const [modalType, setModalType] = useState<
    'CATEGORY' | 'SUBCATEGORY' | 'TIER' | 'SERVICE' | null
  >(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalParentContext, setModalParentContext] = useState<{
    categoryId?: string;
    subCategoryId?: string;
    tierId?: string;
  }>({});

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('Ziva_access') || localStorage.getItem('token') || '';
  };

  // Fetch all categories with full hierarchy
  const fetchAllCategories = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await fetch(getApiUrl('/admin/services/categories'), {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setCategories(Array.isArray(data) ? data : []);
        // Auto-expand first 3 categories
        if (Array.isArray(data) && data.length > 0) {
          const initExpCat: Record<string, boolean> = {};
          data.slice(0, 3).forEach((c) => {
            initExpCat[c.id] = true;
          });
          setExpandedCategories((prev) => ({ ...initExpCat, ...prev }));
        }
      } else {
        throw new Error(`Failed to load admin categories (${res.status})`);
      }
    } catch (err: any) {
      console.warn('Error loading admin services:', err);
      showToast('Could not fetch latest categories from backend', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  // Toggle handlers
  const handleToggleCategory = async (cat: ServiceCategory) => {
    const newStatus = !cat.isActive;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: newStatus } : c))
    );

    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/categories/${cat.id}/toggle`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to toggle category');
      showToast(`Category "${cat.name}" is now ${newStatus ? 'ACTIVE' : 'OFF'}`);
      localStorage.setItem('ziva_services_updated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('ziva_admin_sync');
        bc.postMessage({ type: 'SERVICES_UPDATED' });
        bc.close();
      } catch {}
    } catch (err) {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
      );
      showToast(`Error toggling category "${cat.name}"`, 'error');
    }
  };

  const handleToggleSubCategory = async (sub: ServiceSubCategory) => {
    const newStatus = !sub.isActive;
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        subCategories: (c.subCategories || []).map((s) =>
          s.id === sub.id ? { ...s, isActive: newStatus } : s
        ),
      }))
    );

    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/subcategories/${sub.id}/toggle`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to toggle subcategory');
      showToast(`SubCategory "${sub.name}" is now ${newStatus ? 'ACTIVE' : 'OFF'}`);
      localStorage.setItem('ziva_services_updated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('ziva_admin_sync');
        bc.postMessage({ type: 'SERVICES_UPDATED' });
        bc.close();
      } catch {}
    } catch (err) {
      fetchAllCategories();
      showToast(`Error toggling subcategory`, 'error');
    }
  };

  const handleToggleTier = async (tier: ServiceTier) => {
    const newStatus = !tier.isActive;
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        subCategories: (c.subCategories || []).map((s) => ({
          ...s,
          tiers: (s.tiers || []).map((t) => (t.id === tier.id ? { ...t, isActive: newStatus } : t)),
        })),
      }))
    );

    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/tiers/${tier.id}/toggle`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to toggle tier');
      showToast(`Tier "${tier.name}" is now ${newStatus ? 'ACTIVE' : 'OFF'}`);
      localStorage.setItem('ziva_services_updated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('ziva_admin_sync');
        bc.postMessage({ type: 'SERVICES_UPDATED' });
        bc.close();
      } catch {}
    } catch (err) {
      fetchAllCategories();
      showToast(`Error toggling tier`, 'error');
    }
  };

  const handleToggleService = async (service: ServiceItem) => {
    const newStatus = !service.isActive;
    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/items/${service.id}/toggle`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to toggle service');
      showToast(`Service "${service.name}" is now ${newStatus ? 'ACTIVE' : 'OFF'}`);
      fetchAllCategories();
      localStorage.setItem('ziva_services_updated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('ziva_admin_sync');
        bc.postMessage({ type: 'SERVICES_UPDATED' });
        bc.close();
      } catch {}
    } catch (err) {
      showToast(`Error toggling service`, 'error');
    }
  };

  // Delete handlers
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Category "${name}" and all its subcategories?`)) return;
    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/categories/${id}`), {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast(`Category "${name}" deleted`);
      fetchAllCategories();
    } catch (err) {
      showToast('Error deleting category', 'error');
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete SubCategory "${name}"?`)) return;
    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/subcategories/${id}`), {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast(`SubCategory "${name}" deleted`);
      fetchAllCategories();
    } catch (err) {
      showToast('Error deleting subcategory', 'error');
    }
  };

  const handleDeleteTier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Tier "${name}"?`)) return;
    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/tiers/${id}`), {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast(`Tier "${name}" deleted`);
      fetchAllCategories();
    } catch (err) {
      showToast('Error deleting tier', 'error');
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Service "${name}"?`)) return;
    try {
      const token = getAdminToken();
      const res = await fetch(getApiUrl(`/admin/services/items/${id}`), {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast(`Service "${name}" deleted`);
      fetchAllCategories();
    } catch (err) {
      showToast('Error deleting service', 'error');
    }
  };

  // Stats calculation
  const totalCategories = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.isActive).length;
  let totalSubCategories = 0;
  let activeSubCategoriesCount = 0;
  let totalTiers = 0;
  let totalServices = 0;

  categories.forEach((cat) => {
    (cat.subCategories || []).forEach((sub) => {
      totalSubCategories += 1;
      if (sub.isActive && cat.isActive) activeSubCategoriesCount += 1;
      totalTiers += (sub.tiers || []).length;
      totalServices += (sub.services || []).length;
    });
    totalServices += (cat.services || []).length;
  });

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.subCategories || []).some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return cat.isActive;
    if (statusFilter === 'INACTIVE') return !cat.isActive;
    return true;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-[Rubik] text-[#191c1e]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-[150] px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/90 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/admin" className="hover:text-[#5e23dc]">Admin Console</Link>
            <span>/</span>
            <span className="text-[#111827] font-semibold">Home Services Taxonomy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Multi-Level Home Services System
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Urban Company-style 4-level hierarchy: Categories ➔ SubCategories ➔ Preference Tiers ➔ Bookable Services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingItem(null);
              setModalParentContext({});
              setModalType('CATEGORY');
            }}
            className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Categories</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-[#5e23dc] flex items-center justify-center text-sm font-bold">
              1
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#111827]">{totalCategories}</span>
            <span className="text-[11px] font-bold text-emerald-600">
              ({activeCategoriesCount} Active)
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">SubCategories</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              2
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#111827]">{totalSubCategories}</span>
            <span className="text-[11px] font-bold text-emerald-600">
              ({activeSubCategoriesCount} Live)
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Preference Tiers</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              3
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#111827]">{totalTiers}</span>
            <span className="text-[11px] text-gray-500 ml-1.5 font-medium">Luxe / Prime / Ayurveda</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Bookable Services</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              4
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-[#111827]">{totalServices}</span>
            <span className="text-[11px] text-gray-500 ml-1.5 font-medium">Leaf Services</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-full md:w-96 border border-gray-100 focus-within:border-[#5e23dc] transition-colors">
          <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search categories, subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500">Filter:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#111827] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════ 4-LEVEL HIERARCHY ACCORDION TREE ════════════════════ */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
            <p className="text-gray-500 font-medium text-sm">No service categories found.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isCatExpanded = !!expandedCategories[cat.id];
            const subCats = cat.subCategories || [];

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  cat.isActive
                    ? 'border-gray-200/90 shadow-2xs hover:border-purple-200'
                    : 'border-dashed border-gray-300 bg-gray-50/50 opacity-80'
                }`}
              >
                {/* ─── Level 1: Category Header Bar ─── */}
                <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                      }
                      className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-transform cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-lg transition-transform duration-200 ${
                          isCatExpanded ? 'rotate-90' : ''
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs overflow-hidden">
                      {renderAdminIcon(cat.icon, '🛠️', 'text-2xl')}
                    </div>

                    {/* Category Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-extrabold text-[#111827] truncate">
                          {cat.name}
                        </h2>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          /{cat.slug}
                        </span>
                        {cat.badge && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {subCats.length} Subcategories • Order: #{cat.order}
                      </p>
                    </div>
                  </div>

                  {/* Actions & ON/OFF Toggle */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <span
                        className={`text-[11px] font-extrabold ${
                          cat.isActive ? 'text-emerald-700' : 'text-gray-400'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          cat.isActive ? 'bg-[#16a34a]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            cat.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Add SubCategory */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setModalParentContext({ categoryId: cat.id });
                        setModalType('SUBCATEGORY');
                      }}
                      className="p-2 rounded-xl bg-purple-50 text-[#5e23dc] hover:bg-[#5e23dc] hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Add SubCategory"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span className="hidden sm:inline">Add SubCategory</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(cat);
                        setModalType('CATEGORY');
                      }}
                      className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* ─── Level 2: SubCategories Accordion ─── */}
                {isCatExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 space-y-4">
                    {subCats.length === 0 ? (
                      <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-500">No subcategories created yet.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(null);
                            setModalParentContext({ categoryId: cat.id });
                            setModalType('SUBCATEGORY');
                          }}
                          className="text-xs font-bold text-[#5e23dc] hover:underline mt-1 cursor-pointer"
                        >
                          + Add first subcategory
                        </button>
                      </div>
                    ) : (
                      subCats.map((sub) => {
                        const isSubExpanded = !!expandedSubCategories[sub.id];
                        const tiers = sub.tiers || [];
                        const directServices = sub.services || [];

                        return (
                          <div
                            key={sub.id}
                            className={`bg-white rounded-xl border transition-all overflow-hidden ${
                              sub.isActive
                                ? 'border-gray-200/90 shadow-2xs'
                                : 'border-dashed border-gray-300 opacity-75'
                            }`}
                          >
                            {/* SubCategory Header Bar */}
                            <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSubCategories((prev) => ({
                                      ...prev,
                                      [sub.id]: !prev[sub.id],
                                    }))
                                  }
                                  className="w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer"
                                >
                                  <span
                                    className={`material-symbols-outlined text-base transition-transform duration-200 ${
                                      isSubExpanded ? 'rotate-90' : ''
                                    }`}
                                  >
                                    chevron_right
                                  </span>
                                </button>

                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 overflow-hidden">
                                  {renderAdminIcon(sub.icon, '🛠️', 'text-lg')}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-[#111827] truncate">
                                      {sub.name}
                                    </h3>
                                    <span className="text-[9px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-xs">
                                      {sub.slug}
                                    </span>
                                    {sub.groupHeader && (
                                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded-xs">
                                        Group: {sub.groupHeader}
                                      </span>
                                    )}
                                    {sub.badge && (
                                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded-xs">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500">
                                    {tiers.length > 0 ? `${tiers.length} Tiers` : `${directServices.length} Services`}
                                  </p>
                                </div>
                              </div>

                              {/* Actions & ON/OFF */}
                              <div className="flex items-center gap-2 self-end md:self-center">
                                {/* Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubCategory(sub)}
                                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                                    sub.isActive ? 'bg-[#16a34a]' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                                      sub.isActive ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>

                                {/* Add Tier */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem(null);
                                    setModalParentContext({ subCategoryId: sub.id, categoryId: cat.id });
                                    setModalType('TIER');
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                  title="Add Preference Tier (Luxe, Prime, etc.)"
                                >
                                  <span className="material-symbols-outlined text-xs">add</span>
                                  <span>Tier</span>
                                </button>

                                {/* Add Service */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem(null);
                                    setModalParentContext({ subCategoryId: sub.id, categoryId: cat.id });
                                    setModalType('SERVICE');
                                  }}
                                  className="p-1.5 rounded-lg bg-purple-50 text-[#5e23dc] hover:bg-[#5e23dc] hover:text-white text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                  title="Add Bookable Service"
                                >
                                  <span className="material-symbols-outlined text-xs">add</span>
                                  <span>Service</span>
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem(sub);
                                    setModalParentContext({ categoryId: cat.id });
                                    setModalType('SUBCATEGORY');
                                  }}
                                  className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-200 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              </div>
                            </div>

                            {/* ─── Level 3: Tiers & Level 4: Services Sub-tree ─── */}
                            {isSubExpanded && (
                              <div className="border-t border-gray-100 bg-[#fafafa] p-4 space-y-3">
                                {/* Tiers list */}
                                {tiers.length > 0 && (
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                      Preference Tiers ({tiers.length})
                                    </span>
                                    {tiers.map((tier) => {
                                      const isTierExpanded = !!expandedTiers[tier.id];
                                      const tierServices = (tier.services || []).length > 0
                                        ? tier.services
                                        : (sub.services || []).filter((s) => s.tierId === tier.id);

                                      return (
                                        <div
                                          key={tier.id}
                                          className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedTiers((prev) => ({
                                                    ...prev,
                                                    [tier.id]: !prev[tier.id],
                                                  }))
                                                }
                                                className="text-gray-400 hover:text-black cursor-pointer"
                                              >
                                                <span
                                                  className={`material-symbols-outlined text-sm transition-transform ${
                                                    isTierExpanded ? 'rotate-90' : ''
                                                  }`}
                                                >
                                                  chevron_right
                                                </span>
                                              </button>
                                              <span className="text-xs font-extrabold text-[#111827]">
                                                {tier.name}
                                              </span>
                                              {tier.badge && (
                                                <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 rounded-xs">
                                                  {tier.badge}
                                                </span>
                                              )}
                                              {tier.startingPrice && (
                                                <span className="text-[10px] text-gray-500 font-bold">
                                                  Starts ₹{tier.startingPrice}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                              {/* Tier Toggle */}
                                              <button
                                                type="button"
                                                onClick={() => handleToggleTier(tier)}
                                                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                                                  tier.isActive ? 'bg-[#16a34a]' : 'bg-gray-300'
                                                }`}
                                              >
                                                <span
                                                  className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${
                                                    tier.isActive ? 'translate-x-4' : 'translate-x-0'
                                                  }`}
                                                />
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingItem(null);
                                                  setModalParentContext({
                                                    tierId: tier.id,
                                                    subCategoryId: sub.id,
                                                    categoryId: cat.id,
                                                  });
                                                  setModalType('SERVICE');
                                                }}
                                                className="text-[10px] font-bold text-[#5e23dc] bg-purple-50 hover:bg-[#5e23dc] hover:text-white px-2 py-0.5 rounded-md cursor-pointer"
                                              >
                                                + Service
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingItem(tier);
                                                  setModalParentContext({ subCategoryId: sub.id, categoryId: cat.id });
                                                  setModalType('TIER');
                                                }}
                                                className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                              >
                                                <span className="material-symbols-outlined text-xs">edit</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => handleDeleteTier(tier.id, tier.name)}
                                                className="text-gray-400 hover:text-red-600 cursor-pointer"
                                              >
                                                <span className="material-symbols-outlined text-xs">delete</span>
                                              </button>
                                            </div>
                                          </div>

                                          {/* Services in Tier */}
                                          {isTierExpanded && (
                                            <div className="pl-6 pt-2 space-y-1.5 border-t border-gray-100">
                                              {tierServices && tierServices.length > 0 ? (
                                                tierServices.map((svc) => (
                                                  <div
                                                    key={svc.id}
                                                    className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-bold text-gray-800">{svc.name}</span>
                                                      <span className="text-[11px] font-extrabold text-[#5e23dc]">
                                                        ₹{svc.basePrice}
                                                      </span>
                                                      {svc.durationMinutes && (
                                                        <span className="text-[10px] text-gray-400">
                                                          • {svc.durationMinutes}m
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleToggleService(svc)}
                                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs cursor-pointer ${
                                                          svc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                      >
                                                        {svc.isActive ? 'ON' : 'OFF'}
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteService(svc.id, svc.name)}
                                                        className="text-gray-400 hover:text-red-600 cursor-pointer"
                                                      >
                                                        <span className="material-symbols-outlined text-xs">delete</span>
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-[11px] text-gray-400">No services in this tier yet.</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Direct Services under SubCategory */}
                                {directServices.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                      Services ({directServices.length})
                                    </span>
                                    {directServices.map((svc) => (
                                      <div
                                        key={svc.id}
                                        className="bg-white rounded-lg border border-gray-100 p-2.5 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          {svc.imageUrl && (
                                            <img
                                              src={svc.imageUrl}
                                              alt={svc.name}
                                              className="w-8 h-8 rounded-md object-cover"
                                            />
                                          )}
                                          <div className="truncate">
                                            <span className="font-bold text-gray-800 block truncate">
                                              {svc.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                              ₹{svc.basePrice} • {svc.durationMinutes || 60} mins
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleService(svc)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                                              svc.isActive
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}
                                          >
                                            {svc.isActive ? 'Active' : 'Off'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingItem(svc);
                                              setModalParentContext({
                                                subCategoryId: sub.id,
                                                categoryId: cat.id,
                                              });
                                              setModalType('SERVICE');
                                            }}
                                            className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-xs">edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteService(svc.id, svc.name)}
                                            className="text-gray-400 hover:text-red-600 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-xs">delete</span>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ════════════════════ CREATE / EDIT MODALS ════════════════════ */}
      {modalType && (
        <HierarchyItemModal
          modalType={modalType}
          editingItem={editingItem}
          parentContext={modalParentContext}
          categories={categories}
          onClose={() => {
            setModalType(null);
            setEditingItem(null);
          }}
          onSaved={() => {
            setModalType(null);
            setEditingItem(null);
            fetchAllCategories();
            showToast('Item saved successfully');
            window.dispatchEvent(new Event('storage'));
          }}
        />
      )}
    </div>
  );
}

// ─── Hierarchy Item Modal Component ──────────────────────────────────────────
function HierarchyItemModal({
  modalType,
  editingItem,
  parentContext,
  categories,
  onClose,
  onSaved,
}: {
  modalType: 'CATEGORY' | 'SUBCATEGORY' | 'TIER' | 'SERVICE';
  editingItem: any | null;
  parentContext: { categoryId?: string; subCategoryId?: string; tierId?: string };
  categories: ServiceCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!editingItem;
  const [loading, setLoading] = useState(false);

  // Common Form Fields
  const [name, setName] = useState(editingItem?.name || '');
  const [slug, setSlug] = useState(editingItem?.slug || '');
  const [icon, setIcon] = useState(editingItem?.icon || '🛠️');
  const [badge, setBadge] = useState(editingItem?.badge || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [order, setOrder] = useState<number>(editingItem?.order ?? editingItem?.displayOrder ?? 1);
  const [isActive, setIsActive] = useState<boolean>(editingItem?.isActive ?? true);

  // SubCategory specific
  const [categoryId, setCategoryId] = useState(
    editingItem?.categoryId || parentContext.categoryId || categories[0]?.id || ''
  );
  const [groupHeader, setGroupHeader] = useState(editingItem?.groupHeader || '');

  // Tier specific
  const [subCategoryId, setSubCategoryId] = useState(
    editingItem?.subCategoryId || parentContext.subCategoryId || ''
  );
  const [startingPrice, setStartingPrice] = useState<number | string>(editingItem?.startingPrice || '');
  const [featuresStr, setFeaturesStr] = useState<string>(
    Array.isArray(editingItem?.features) ? editingItem.features.join('\n') : ''
  );

  // Service specific
  const [tierId, setTierId] = useState(editingItem?.tierId || parentContext.tierId || '');
  const [basePrice, setBasePrice] = useState<number | string>(editingItem?.basePrice || 499);
  const [durationMinutes, setDurationMinutes] = useState<number | string>(
    editingItem?.durationMinutes || 60
  );
  const [imageUrl, setImageUrl] = useState(
    editingItem?.imageUrl ||
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
  );

  const getAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('Ziva_access') || localStorage.getItem('token') || '';
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getAdminToken();
      let url = '';
      let method = isEditing ? 'PATCH' : 'POST';
      let payload: any = { name, slug, isActive, order: Number(order) };

      if (modalType === 'CATEGORY') {
        url = isEditing
          ? getApiUrl(`/admin/services/categories/${editingItem.id}`)
          : getApiUrl('/admin/services/categories');
        payload = { ...payload, icon, badge, description };
      } else if (modalType === 'SUBCATEGORY') {
        url = isEditing
          ? getApiUrl(`/admin/services/subcategories/${editingItem.id}`)
          : getApiUrl('/admin/services/subcategories');
        payload = {
          ...payload,
          categoryId,
          icon,
          badge,
          groupHeader: groupHeader || null,
          displayOrder: Number(order),
        };
      } else if (modalType === 'TIER') {
        url = isEditing
          ? getApiUrl(`/admin/services/tiers/${editingItem.id}`)
          : getApiUrl('/admin/services/tiers');
        const features = featuresStr
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        payload = {
          ...payload,
          subCategoryId,
          badge,
          description,
          startingPrice: startingPrice ? Number(startingPrice) : null,
          features,
          displayOrder: Number(order),
        };
      } else if (modalType === 'SERVICE') {
        url = isEditing
          ? getApiUrl(`/admin/services/items/${editingItem.id}`)
          : getApiUrl('/admin/services/items');
        payload = {
          ...payload,
          categoryId,
          subCategoryId: subCategoryId || null,
          tierId: tierId || null,
          basePrice: Number(basePrice),
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          description,
          imageUrl,
        };
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      onSaved();
    } catch (err: any) {
      alert(`Failed to save: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-[Rubik]">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-[#111827]">
            {isEditing ? `Edit ${modalType}` : `Add New ${modalType}`}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                placeholder="e.g. Salon for Women"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-mono text-[11px]"
                placeholder="salon-for-women"
              />
            </div>
          </div>

          {/* SubCategory specific parent selector */}
          {modalType === 'SUBCATEGORY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Parent Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Group Header (Optional)</label>
                <input
                  type="text"
                  value={groupHeader}
                  onChange={(e) => setGroupHeader(e.target.value)}
                  placeholder="e.g. Large appliances"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                />
              </div>
            </div>
          )}

          {/* Icon & Badge */}
          {(modalType === 'CATEGORY' || modalType === 'SUBCATEGORY') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Icon / Emoji</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  placeholder="🧖‍♀️ or vacuum"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Badge (Optional)</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  placeholder="e.g. 44 mins or Sale"
                />
              </div>
            </div>
          )}

          {/* Tier Specific Fields */}
          {modalType === 'TIER' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Starting Price (₹)</label>
                  <input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="1199"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tier Badge</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Top-tier professionals"
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Features (One per line)</label>
                <textarea
                  rows={3}
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  placeholder="Mono-dose products&#10;Experienced senior beauticians&#10;100% hygienic kits"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-sans"
                />
              </div>
            </div>
          )}

          {/* Service Specific Fields */}
          {modalType === 'SERVICE' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
            />
          </div>

          {/* Display Order & Active */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Display Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="activeStatus"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#5e23dc] rounded-md focus:ring-0 cursor-pointer"
              />
              <label htmlFor="activeStatus" className="font-bold text-gray-700 cursor-pointer">
                Enabled / Active
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
