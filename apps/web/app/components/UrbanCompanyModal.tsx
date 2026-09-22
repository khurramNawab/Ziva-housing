'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ServiceTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  startingPrice: number | null;
  imageUrl?: string | null;
  features: string[];
  displayOrder: number;
}

interface ServiceSubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  groupHeader: string | null;
  displayOrder: number;
  tiers?: ServiceTier[];
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  order: number;
  subCategories?: ServiceSubCategory[];
}

export interface UrbanModalCategoryProps {
  initialCategory?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (serviceName: string, categorySlug: string) => void;
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

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const TIER_IMAGES: Record<string, string> = {
  'luxe': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
  'spa-women-luxe': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
  'prime': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
  'spa-women-prime': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
  'ayurveda': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80',
  'spa-women-ayurveda': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80',
  'prime-relaxation': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
  'stress-relief': 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80',
};

export default function UrbanCompanyModal({
  initialCategory = 'all',
  isOpen,
  onClose,
  onSelectService,
}: UrbanModalCategoryProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedSubCategoryForTier, setSelectedSubCategoryForTier] = useState<{
    subCategory: ServiceSubCategory;
    categorySlug: string;
    categoryName: string;
  } | null>(null);

  const fetchCategoryData = useCallback(async () => {
    try {
      let res: Response;
      try {
        res = await fetch(getApiUrl('/services/categories'), { cache: 'no-store' });
      } catch {
        res = await fetch('http://127.0.0.1:4000/api/v1/services/categories', { cache: 'no-store' });
      }

      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        if (Array.isArray(data)) {
          // STRICT DYNAMIC FILTER: ONLY active categories from backend
          const activeCategories = data
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon || '🛠️',
              badge: c.badge || null,
              order: c.order || 1,
              subCategories: (c.subCategories || [])
                .filter((s: any) => s.isActive !== false)
                .map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  icon: s.icon || '🛠️',
                  badge: s.badge || null,
                  groupHeader: s.groupHeader || null,
                  displayOrder: s.displayOrder || 1,
                  tiers: (s.tiers || [])
                    .filter((t: any) => t.isActive !== false)
                    .map((t: any) => ({
                      id: t.id,
                      name: t.name,
                      slug: t.slug,
                      imageUrl: t.imageUrl || TIER_IMAGES[t.slug] || TIER_IMAGES['luxe'],
                      description: t.description || null,
                      badge: t.badge || null,
                      startingPrice: t.startingPrice ? Number(t.startingPrice) : null,
                      features: t.features || [],
                      displayOrder: t.displayOrder || 1,
                    })),
                })),
            }))
            .filter((c: any) => (c.subCategories && c.subCategories.length > 0) || c.slug);

          setCategories(activeCategories);
        }
      }
    } catch (err) {
      console.warn('Using fallback categories in modal:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedSubCategoryForTier(null);
      fetchCategoryData();

      if (initialCategory && initialCategory !== 'all') {
        setTimeout(() => {
          const targetEl = document.getElementById(`modal-section-${initialCategory}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    } else {
      document.body.style.overflow = 'unset';
      setSelectedSubCategoryForTier(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialCategory, fetchCategoryData]);

  if (!isOpen) return null;

  const handleSubCategoryClick = (
    subCat: ServiceSubCategory,
    category: ServiceCategory
  ) => {
    const activeTiers = (subCat.tiers || []).filter((t: any) => t.isActive !== false);
    if (activeTiers.length > 0) {
      setSelectedSubCategoryForTier({
        subCategory: { ...subCat, tiers: activeTiers },
        categorySlug: slugify(category.slug || category.name),
        categoryName: category.name,
      });
    } else {
      onClose();
      const catSlug = slugify(category.slug || category.name);
      const subSlug = slugify(subCat.slug || subCat.name);
      if (onSelectService) {
        onSelectService(subCat.name, catSlug);
      }
      router.push(`/services/${catSlug}?subCategory=${subSlug}`);
    }
  };

  const handleTierSelect = (tier: ServiceTier) => {
    if (!selectedSubCategoryForTier) return;
    const { categorySlug, subCategory } = selectedSubCategoryForTier;
    onClose();
    const catSlug = slugify(categorySlug);
    const subSlug = slugify(subCategory.slug || subCategory.name);
    const tierSlug = slugify(tier.slug || tier.name);
    if (onSelectService) {
      onSelectService(`${subCategory.name} - ${tier.name}`, catSlug);
    }
    router.push(`/services/${catSlug}?subCategory=${subSlug}&tier=${tierSlug}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn font-[Rubik]">
      {/* Modal Container */}
      <div className="relative w-full max-w-[620px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-gray-100">
        
        {/* Top Header */}
        <div className="relative px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
          {selectedSubCategoryForTier ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSubCategoryForTier(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#191c1e] flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                aria-label="Back to subcategories"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <div>
                <h3 className="text-[17px] font-bold text-[#111827] leading-tight">
                  Select your preference
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  {selectedSubCategoryForTier.categoryName} • {selectedSubCategoryForTier.subCategory.name}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-[18px] font-extrabold text-[#111827] tracking-tight">
                {initialCategory !== 'all' && categories.find((c) => c.slug === initialCategory)
                  ? categories.find((c) => c.slug === initialCategory)?.name
                  : 'Select a Service'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Verified professionals with Ziva Guarantee
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#191c1e] text-white flex items-center justify-center hover:bg-black transition-transform hover:scale-110 shadow-md cursor-pointer shrink-0 ml-2"
          >
            <span className="material-symbols-outlined text-[18px] font-bold">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200"
        >
          {selectedSubCategoryForTier ? (
            /* ════════════════════ SCREEN 2: SELECT YOUR PREFERENCE (TIERS) WITH LEFT PHOTO ════════════════════ */
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#5e23dc] uppercase tracking-wider">
                  Tier Selection
                </span>
                <p className="text-[13px] text-gray-600">
                  Select from our range of services tailored to your standard and needs:
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {(selectedSubCategoryForTier.subCategory.tiers || []).map((tier) => {
                  const tierImg =
                    tier.imageUrl ||
                    TIER_IMAGES[tier.slug] ||
                    TIER_IMAGES[slugify(tier.name)] ||
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div
                      key={tier.id}
                      onClick={() => handleTierSelect(tier)}
                      className="p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-[#5e23dc] hover:bg-purple-50/20 transition-all cursor-pointer group shadow-xs hover:shadow-md relative bg-white flex flex-col sm:flex-row gap-4 items-start"
                    >
                      {/* Left Side Relevant Photo */}
                      <div className="w-full sm:w-28 h-28 sm:h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-2xs relative">
                        <img
                          src={tierImg}
                          alt={tier.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Middle & Right Content */}
                      <div className="flex-1 min-w-0 space-y-2 w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[17px] font-extrabold text-[#111827] group-hover:text-[#5e23dc] transition-colors">
                                {tier.name}
                              </h4>
                              {tier.badge && (
                                <span className="bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#bfdbfe]">
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                            {tier.description && (
                              <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                                {tier.description}
                              </p>
                            )}
                          </div>

                          {tier.startingPrice && (
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-[10px] text-gray-500 block font-medium">Starting at</span>
                              <span className="text-[16px] font-extrabold text-[#111827]">
                                ₹{tier.startingPrice}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Features bullets */}
                        {tier.features && tier.features.length > 0 && (
                          <div className="space-y-1 pt-1.5 border-t border-gray-100">
                            {tier.features.slice(0, 3).map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11.5px] text-gray-600 font-medium">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">
                                  check_circle
                                </span>
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explore button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            className="text-xs font-bold text-[#5e23dc] bg-purple-50 group-hover:bg-[#5e23dc] group-hover:text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Explore {tier.name}</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ════════════════════ SCREEN 1: CATEGORY & SUBCATEGORY GRID ════════════════════ */
            <div className="space-y-7">
              {categories.map((category, catIndex) => {
                const subCats = category.subCategories || [];
                if (subCats.length === 0) return null;

                const groups: { header: string; items: ServiceSubCategory[] }[] = [];
                const ungrouped: ServiceSubCategory[] = [];

                subCats.forEach((sub) => {
                  if (sub.groupHeader) {
                    let grp = groups.find((g) => g.header === sub.groupHeader);
                    if (!grp) {
                      grp = { header: sub.groupHeader, items: [] };
                      groups.push(grp);
                    }
                    grp.items.push(sub);
                  } else {
                    ungrouped.push(sub);
                  }
                });

                return (
                  <div
                    key={category.id || category.slug}
                    id={`modal-section-${category.slug}`}
                    className="space-y-3.5 scroll-mt-6"
                  >
                    {/* Category Title */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-[18px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                        <span>{category.name}</span>
                      </h3>
                      {category.badge && (
                        <span className="bg-purple-50 text-[#5e23dc] text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          {category.badge}
                        </span>
                      )}
                    </div>

                    {/* Ungrouped items */}
                    {ungrouped.length > 0 && (
                      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                        {ungrouped.map((sub) => (
                          <button
                            key={sub.id || sub.slug}
                            type="button"
                            onClick={() => handleSubCategoryClick(sub, category)}
                            className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                          >
                            {sub.badge && (
                              <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                {sub.badge}
                              </span>
                            )}
                            <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                              {sub.icon || '🛠️'}
                            </div>
                            <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight line-clamp-2">
                              {sub.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Grouped items */}
                    {groups.map((group) => (
                      <div key={group.header} className="space-y-2 pt-1">
                        <h4 className="text-[13px] font-bold text-[#4b5563]">
                          {group.header}
                        </h4>
                        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                          {group.items.map((sub) => (
                            <button
                              key={sub.id || sub.slug}
                              type="button"
                              onClick={() => handleSubCategoryClick(sub, category)}
                              className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                            >
                              {sub.badge && (
                                <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  {sub.badge}
                                </span>
                              )}
                              <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                                {sub.icon || '🛠️'}
                              </div>
                              <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight line-clamp-2">
                                {sub.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {catIndex < categories.length - 1 && (
                      <div className="h-[1px] bg-gray-100 w-full pt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
