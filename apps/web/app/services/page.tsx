'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UrbanCompanyModal from '../components/UrbanCompanyModal';

interface ServiceSubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  order: number;
  isActive: boolean;
  subCategories?: ServiceSubCategory[];
}

function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const cleanBase = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
}

const ICON_MAP: Record<string, string> = {
  'vacuum': '🧹',
  'cleaning': '🧹',
  'face_retouching_natural': '🧖‍♀️',
  'womens-salon-spa': '🧖‍♀️',
  'content_cut': '🧔‍♂️',
  'person_grooming': '🧔‍♂️',
  'mens-salon-massage': '🧔‍♂️',
  'ac_unit': '❄️',
  'ac-appliance-repair': '❄️',
  'handyman': '🔧',
  'electrician-plumber-carpenter': '🔧',
  'format_paint': '🖌️',
  'painting-waterproofing': '🖌️',
  'support_agent': '👩‍🍳',
  'instahelp': '👩‍🍳',
};

function renderServiceIcon(iconStr?: string | null, fallback: string = '🛠️') {
  if (!iconStr) return fallback;
  const trimmed = iconStr.trim();
  if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
  if (ICON_MAP[trimmed.toLowerCase()]) return ICON_MAP[trimmed.toLowerCase()];
  return trimmed;
}

export default function ServicesDirectoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('all');

  const loadActiveCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/services/categories'), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        const activeList = data.filter((c: any) => c.isActive !== false);
        setCategories(activeList);
      }
    } catch (err) {
      console.warn('Error fetching categories directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveCategories();

    const handleRefresh = () => loadActiveCategories();
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ziva_admin_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'SERVICES_UPDATED') {
          loadActiveCategories();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      if (bc) bc.close();
    };
  }, []);

  const openCategoryModal = (catSlug: string) => {
    setModalCategory(catSlug);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik] text-[#191c1e]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-10">
        {/* Top Hero Heading */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-block bg-[#5e23dc]/10 text-[#5e23dc] font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            Verified Home Services
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#111827] tracking-tight">
            Professional doorstep services on demand
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Select a category below to browse verified experts, compare tiers, and schedule your appointment with Ziva Guarantee.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-3xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8">
            <p className="text-gray-500 font-medium">No home service categories currently active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const subCount = cat.subCategories?.length || 0;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-purple-200"
                  onClick={() => openCategoryModal(cat.slug)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 group-hover:bg-[#5e23dc] transition-colors flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 duration-200">
                        <span>{renderServiceIcon(cat.icon, '🛠️')}</span>
                      </div>
                      {cat.badge && (
                        <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {cat.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-[#111827] group-hover:text-[#5e23dc] transition-colors">
                        {cat.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {subCount > 0 ? `${subCount} sub-services available` : 'Book doorstep experts'}
                      </p>
                    </div>

                    {/* Sub-categories preview chips */}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {cat.subCategories.slice(0, 4).map((sub) => (
                          <span
                            key={sub.id}
                            className="bg-gray-50 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-100 group-hover:border-purple-100"
                          >
                            {renderServiceIcon(sub.icon, '')} {sub.name}
                          </span>
                        ))}
                        {cat.subCategories.length > 4 && (
                          <span className="text-[11px] text-gray-400 font-bold self-center px-1">
                            +{cat.subCategories.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5e23dc]">
                      Explore Services
                    </span>
                    <span className="w-8 h-8 rounded-full bg-purple-50 group-hover:bg-[#5e23dc] group-hover:text-white text-[#5e23dc] flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <UrbanCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCategory={modalCategory}
      />

      <Footer />
    </div>
  );
}
