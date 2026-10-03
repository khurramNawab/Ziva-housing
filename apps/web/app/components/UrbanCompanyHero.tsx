'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  isActive: boolean;
  order: number;
}

interface UrbanCompanyHeroProps {
  onSelectCategory: (categorySlug: string) => void;
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

const CATEGORY_STYLE_MAP: Record<string, { icon: string; imgUrl?: string; bg: string; defaultBadge?: string }> = {
  'instahelp': { 
    icon: 'restaurant', 
    imgUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#f5f3ff]' 
  },
  'womens-salon-spa': { 
    icon: 'spa', 
    imgUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#fdf2f8]' 
  },
  'mens-salon-massage': { 
    icon: 'face', 
    imgUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#eff6ff]' 
  },
  'cleaning': { 
    icon: 'cleaning_services', 
    imgUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#f0fdf4]', 
    defaultBadge: '44 mins' 
  },
  'ac-appliance-repair': { 
    icon: 'ac_unit', 
    imgUrl: '/services/ac-service.jpg',
    bg: 'bg-[#f0f9ff]', 
    defaultBadge: '25 mins' 
  },
  'electrician-plumber-carpenter': { 
    icon: 'build', 
    imgUrl: '/services/electrician-service.jpg',
    bg: 'bg-[#faf5ff]', 
    defaultBadge: '25 mins' 
  },
  'painting-waterproofing': { 
    icon: 'format_paint', 
    imgUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#fffbeb]' 
  },
  'pest-control': { 
    icon: 'pest_control', 
    imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#fef2f2]' 
  },
  'packers-movers': { 
    icon: 'local_shipping', 
    imgUrl: '/services/packers-movers.jpg', 
    bg: 'bg-[#fefce8]' 
  },
  'home-cleaning': { icon: 'cleaning_services', bg: 'bg-[#f0fdf4]' },
  'electrician': { icon: 'bolt', bg: 'bg-[#faf5ff]' },
  'plumber': { icon: 'plumbing', bg: 'bg-[#f0f9ff]' },
  'carpenter': { icon: 'carpenter', bg: 'bg-[#fefce8]' },
  'babysitting-childcare': { icon: 'child_care', imgUrl: '/services/babysitting.jpg', bg: 'bg-[#fef2f2]' },
  'elderly-care': { icon: 'elderly', imgUrl: '/services/elderly-care.jpg', bg: 'bg-[#fdf2f8]' },
  'solar-panels': {
    icon: 'solar_power',
    imgUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#fefce8]',
    defaultBadge: 'Subsidy',
  },
  'solar-panel': {
    icon: 'solar_power',
    imgUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#fefce8]',
    defaultBadge: 'Subsidy',
  },
  'native-smart-locks': {
    icon: 'lock',
    imgUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&h=300&q=80',
    bg: 'bg-[#f8fafc]',
    defaultBadge: 'Sale',
  },
  'native-water-purifier': {
    icon: 'water_drop',
    imgUrl: '/services/native-water-purifier.jpg',
    bg: 'bg-[#f0f9ff]',
    defaultBadge: 'Sale',
  },
};

const PRIMARY_HERO_SLUGS = [
  'cleaning',
  'womens-salon-spa',
  'mens-salon-massage',
  'ac-appliance-repair',
  'electrician-plumber-carpenter',
  'painting-waterproofing',
  'solar-panels',
  'instahelp',
];

const DEFAULT_HERO_CATEGORIES: ServiceCategory[] = [
  { id: 'c-clean', name: 'Cleaning & Pest Control', slug: 'cleaning', icon: 'cleaning_services', badge: '44 mins', isActive: true, order: 1 },
  { id: 'c-wsalon', name: "Women's Salon & Spa", slug: 'womens-salon-spa', icon: 'spa', badge: null, isActive: true, order: 2 },
  { id: 'c-msalon', name: "Men's Salon & Massage", slug: 'mens-salon-massage', icon: 'face', badge: null, isActive: true, order: 3 },
  { id: 'c-ac', name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', icon: 'ac_unit', badge: '25 mins', isActive: true, order: 4 },
  { id: 'c-epc', name: 'Electrician, Plumber & Carpenter', slug: 'electrician-plumber-carpenter', icon: 'build', badge: '25 mins', isActive: true, order: 5 },
  { id: 'c-paint', name: 'Painting & Waterproofing', slug: 'painting-waterproofing', icon: 'format_paint', badge: null, isActive: true, order: 6 },
  { id: 'c-solar', name: 'Solar Panels', slug: 'solar-panels', icon: 'solar_power', badge: 'Subsidy', isActive: true, order: 7 },
  { id: 'c-help', name: 'InstaHelp', slug: 'instahelp', icon: 'restaurant', badge: null, isActive: true, order: 8 },
];

export default function UrbanCompanyHero({ onSelectCategory }: UrbanCompanyHeroProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_HERO_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const fetchActiveCategories = useCallback(async () => {
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
        if (Array.isArray(data) && data.length > 0) {
          // Dynamically pick all active categories from backend
          const activeList = data.filter((c: any) => c.isActive !== false);

          if (activeList.length > 0) {
            activeList.sort((a: any, b: any) => {
              const idxA = PRIMARY_HERO_SLUGS.indexOf(a.slug);
              const idxB = PRIMARY_HERO_SLUGS.indexOf(b.slug);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return (a.order || 0) - (b.order || 0);
            });

            const formatted: ServiceCategory[] = activeList.map((c: any) => {
              const style = CATEGORY_STYLE_MAP[c.slug];
              return {
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon || style?.icon || '🛠️',
                badge: c.badge || style?.defaultBadge || null,
                isActive: true,
                order: c.order || 1,
              };
            });

            setCategories(formatted);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching active categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCategories();

    // Refetch when window gains focus or storage changes (instant Admin reflection)
    const handleRefresh = () => fetchActiveCategories();
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    
    // Broadcast channel for instant cross-tab synchronization with admin panel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ziva_admin_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'SERVICES_UPDATED') {
          fetchActiveCategories();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      if (bc) bc.close();
    };
  }, [fetchActiveCategories]);

  // Collage source pool: verified high-resolution images for 2x2 hero grid
  const COLLAGE_POOL = [
    {
      slug: 'womens-salon-spa',
      title: 'Salon for Women',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'mens-salon-massage',
      title: 'Spa & Massage',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'cleaning',
      title: 'Kitchen & Deep Clean',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'ac-appliance-repair',
      title: 'AC & Appliance Repair',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'electrician-plumber-carpenter',
      title: 'Electrician & Carpenter',
      image: '/services/electrician-service.jpg',
    },
    {
      slug: 'painting-waterproofing',
      title: 'Painting & Waterproofing',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'solar-panels',
      title: 'Solar Panels & Rooftop',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=700&q=80',
    },
    {
      slug: 'instahelp',
      title: 'InstaHelp & Daily Cook',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80',
    },
  ];

  // Guaranteed 4 full cards in hero collage (never empty space)
  const matchingCollage = COLLAGE_POOL.filter((item) =>
    categories.some((c) => c.slug === item.slug || item.slug.startsWith(c.slug))
  );
  const activeCollage = [
    ...matchingCollage,
    ...COLLAGE_POOL.filter((p) => !matchingCollage.some((m) => m.slug === p.slug)),
  ].slice(0, 4);

  return (
    <section className="bg-white py-6 md:py-10 border-b border-gray-100 font-[Rubik]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Heading, Services Grid & Native Products (6 Columns) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h1 className="text-[32px] md:text-[44px] font-extrabold text-[#111827] tracking-tight leading-tight">
                Home services at your doorstep
              </h1>
            </div>

            {/* Service Category Box */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4 md:p-6 min-h-[220px]">
              <div className="grid grid-cols-4 gap-2.5 md:gap-3.5">
                {categories.slice(0, 7).map((item) => {
                  const styleInfo = CATEGORY_STYLE_MAP[item.slug] || { icon: item.icon || '🛠️', bg: 'bg-[#f8fafc]' };
                  const badgeText = item.badge || styleInfo.defaultBadge;

                  return (
                    <button
                      suppressHydrationWarning
                      key={item.id || item.slug}
                      type="button"
                      onClick={() => onSelectCategory(item.slug)}
                      className="flex flex-col items-center justify-between p-2 md:p-2.5 rounded-xl hover:bg-gray-50/90 hover:shadow-xs transition-all text-center group cursor-pointer border border-transparent hover:border-gray-200 min-h-[96px]"
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="w-13 h-13 md:w-14 md:h-14 rounded-2xl overflow-hidden shadow-xs border border-gray-100 bg-gray-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          {styleInfo.imgUrl ? (
                            <img
                              src={styleInfo.imgUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent && !parent.querySelector('.fallback-icon')) {
                                  const span = document.createElement('span');
                                  span.className = 'fallback-icon material-symbols-outlined text-2xl md:text-3xl text-[#5e23dc]';
                                  span.innerText = styleInfo.icon || 'home_repair_service';
                                  parent.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-2xl md:text-3xl text-[#5e23dc]">{styleInfo.icon || 'home_repair_service'}</span>
                          )}
                        </div>

                        {/* Pill Badge (e.g. 44 mins, 19 mins, Subsidy) */}
                        {badgeText && (
                          <span className="absolute -bottom-1.5 bg-white border border-[#93c5fd] text-[#1d4ed8] text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap">
                            {badgeText}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] md:text-[12px] font-semibold text-[#1f2937] leading-[14px] mt-2 group-hover:text-[#5e23dc] transition-colors line-clamp-2">
                        {item.name}
                      </span>
                    </button>
                  );
                })}

                {/* All Services Button */}
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => onSelectCategory('all')}
                  className="flex flex-col items-center justify-between p-2 md:p-2.5 rounded-xl hover:bg-gray-50/90 hover:shadow-xs transition-all text-center group cursor-pointer border border-transparent hover:border-gray-200 min-h-[96px]"
                >
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="w-12 h-12 md:w-13 md:h-13 rounded-2xl bg-[#f8fafc] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <svg className="w-6 h-6 text-[#374151]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[11px] md:text-[12px] font-semibold text-[#1f2937] leading-[14px] mt-2 group-hover:text-[#5e23dc] transition-colors line-clamp-2">
                    All services
                  </span>
                </button>
              </div>

              {/* Native Smart Products */}
              <div className="mt-7 pt-5 border-t border-gray-100">
                <h3 className="text-xs md:text-sm font-bold text-[#374151] uppercase tracking-wider mb-3">
                  Native Smart Products
                </h3>
                <div className="flex gap-3">
                  {[
                    {
                      id: 'water-purifier',
                      name: 'Native Water Purifier',
                      category: 'native-water-purifier',
                      imgUrl: '/services/native-water-purifier.jpg',
                      icon: 'water_drop',
                      badge: 'Sale',
                    },
                    {
                      id: 'smart-locks',
                      name: 'Native Smart Locks',
                      category: 'native-smart-locks',
                      imgUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&h=300&q=80',
                      icon: 'lock',
                      badge: 'Sale',
                    },
                  ].map((prod) => (
                    <button
                      suppressHydrationWarning
                      key={prod.id}
                      type="button"
                      onClick={() => onSelectCategory(prod.category)}
                      className="flex items-center gap-3 p-2.5 px-3 rounded-xl border border-gray-200/90 hover:border-[#5e23dc] hover:bg-purple-50/40 transition-all text-left group cursor-pointer bg-[#fafafa]"
                    >
                      <div className="relative w-11 h-11 rounded-xl bg-white border border-gray-100 shadow-xs overflow-hidden flex items-center justify-center p-0.5">
                        <img
                          src={prod.imgUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent && !parent.querySelector('.fallback-prod-icon')) {
                              const span = document.createElement('span');
                              span.className = 'fallback-prod-icon material-symbols-outlined text-xl text-[#5e23dc]';
                              span.innerText = prod.icon;
                              parent.appendChild(span);
                            }
                          }}
                        />
                        <span className="absolute -top-1 -right-1 bg-[#16a34a] text-white text-[8px] font-bold px-1 rounded-full uppercase tracking-tighter z-10">
                          {prod.badge}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827] group-hover:text-[#5e23dc] transition-colors block">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">Warranty &amp; Installation</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Collage (6 Columns) - Guaranteed 4 Complete Tiles */}
          <div className="lg:col-span-6 h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3.5 md:gap-4.5 h-full">
              {activeCollage.map((item, idx) => (
                <div 
                  key={item.slug}
                  onClick={() => onSelectCategory(item.slug)}
                  className={`relative ${idx < 2 ? 'h-48 md:h-60' : 'h-48 md:h-64'} rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                    <span className="text-xs font-bold text-white tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                      {item.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
