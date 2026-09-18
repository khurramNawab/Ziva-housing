'use client';

import React from 'react';

interface UrbanCompanyHeroProps {
  onSelectCategory: (categorySlug: string) => void;
}

export default function UrbanCompanyHero({ onSelectCategory }: UrbanCompanyHeroProps) {
  const serviceCategories = [
    {
      id: 'instahelp',
      name: 'InstaHelp',
      slug: 'instahelp',
      icon: '👩‍💼',
      badge: null,
      bg: 'bg-[#f5f3ff]',
    },
    {
      id: 'womens-salon-spa',
      name: "Women's Salon & Spa",
      slug: 'womens-salon-spa',
      icon: '🧖‍♀️',
      badge: null,
      bg: 'bg-[#fdf2f8]',
    },
    {
      id: 'mens-salon-massage',
      name: "Men's Salon & Massage",
      slug: 'mens-salon-massage',
      icon: '🧔‍♂️',
      badge: null,
      bg: 'bg-[#eff6ff]',
    },
    {
      id: 'cleaning-pest-control',
      name: 'Cleaning & Pest Control',
      slug: 'cleaning',
      icon: '🧹',
      badge: '44 mins',
      bg: 'bg-[#f0fdf4]',
    },
    {
      id: 'painting-waterproofing',
      name: 'Painting & Water - proofing',
      slug: 'painting-waterproofing',
      icon: '🖌️',
      badge: null,
      bg: 'bg-[#fffbeb]',
    },
    {
      id: 'ac-appliance-repair',
      name: 'AC & Appliance Repair',
      slug: 'ac-appliance-repair',
      icon: '❄️',
      badge: '44 mins',
      bg: 'bg-[#f0f9ff]',
    },
    {
      id: 'electrician-plumber-carpenter',
      name: 'Electrician, Plumber & Carpenter',
      slug: 'electrician-plumber-carpenter',
      icon: '🔧',
      badge: '19 mins',
      bg: 'bg-[#faf5ff]',
    },
    {
      id: 'all-services',
      name: 'All services',
      slug: 'cleaning',
      icon: '⠿',
      badge: null,
      bg: 'bg-[#f8fafc]',
      isDots: true,
    },
  ];

  const nativeProducts = [
    {
      id: 'water-purifier',
      name: 'Native Water Purifier',
      category: 'ac-appliance-repair',
      icon: '💧',
      badge: 'Sale',
    },
    {
      id: 'smart-locks',
      name: 'Native Smart Locks',
      category: 'electrician-plumber-carpenter',
      icon: '🔐',
      badge: 'Sale',
    },
  ];

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
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-4 md:p-6">
              <div className="grid grid-cols-4 gap-2.5 md:gap-3.5">
                {serviceCategories.map((item) => (
                  <button
                    suppressHydrationWarning
                    key={item.id}
                    type="button"
                    onClick={() => onSelectCategory(item.slug)}
                    className="flex flex-col items-center justify-between p-2 md:p-2.5 rounded-xl hover:bg-gray-50/90 hover:shadow-xs transition-all text-center group cursor-pointer border border-transparent hover:border-gray-200 min-h-[96px]"
                  >
                    <div className="relative flex flex-col items-center justify-center">
                      <div className={`w-12 h-12 md:w-13 md:h-13 rounded-2xl ${item.bg} flex items-center justify-center text-2xl md:text-3xl shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                        {item.isDots ? (
                          <span className="material-symbols-outlined text-[#374151] text-2xl">apps</span>
                        ) : (
                          <span>{item.icon}</span>
                        )}
                      </div>

                      {/* Pill Badge (e.g. 44 mins, 19 mins) */}
                      {item.badge && (
                        <span className="absolute -bottom-1.5 bg-white border border-[#93c5fd] text-[#1d4ed8] text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] md:text-[12px] font-semibold text-[#1f2937] leading-[14px] mt-2 group-hover:text-[#5e23dc] transition-colors line-clamp-2">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Native Smart Products */}
              <div className="mt-7 pt-5 border-t border-gray-100">
                <h3 className="text-xs md:text-sm font-bold text-[#374151] uppercase tracking-wider mb-3">
                  Native Smart Products
                </h3>
                <div className="flex gap-3">
                  {nativeProducts.map((prod) => (
                    <button
                      suppressHydrationWarning
                      key={prod.id}
                      type="button"
                      onClick={() => onSelectCategory(prod.category)}
                      className="flex items-center gap-3 p-2.5 px-3 rounded-xl border border-gray-200/90 hover:border-[#5e23dc] hover:bg-purple-50/40 transition-all text-left group cursor-pointer bg-[#fafafa]"
                    >
                      <div className="relative w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-xs flex items-center justify-center text-xl">
                        <span>{prod.icon}</span>
                        <span className="absolute -top-1.5 -right-1.5 bg-[#16a34a] text-white text-[8px] font-bold px-1 rounded-full uppercase tracking-tighter">
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

          {/* Right Column: Hero Collage (6 Columns) */}
          <div className="lg:col-span-6 h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3.5 md:gap-4.5 h-full">
              
              {/* Top Left: Salon / Spa Specialist */}
              <div 
                onClick={() => onSelectCategory('womens-salon-spa')}
                className="relative h-48 md:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80"
                  alt="Women's Salon & Spa Service"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-xs font-bold text-white tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    Salon for Women
                  </span>
                </div>
              </div>

              {/* Top Right: Relaxing Massage */}
              <div 
                onClick={() => onSelectCategory('mens-salon-massage')}
                className="relative h-48 md:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80"
                  alt="Men's Relaxation & Massage"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-xs font-bold text-white tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    Spa &amp; Massage
                  </span>
                </div>
              </div>

              {/* Bottom Left: Kitchen Chimney & Repair */}
              <div 
                onClick={() => onSelectCategory('cleaning')}
                className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80"
                  alt="Deep Cleaning & Repairs"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-xs font-bold text-white tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    Kitchen &amp; Deep Clean
                  </span>
                </div>
              </div>

              {/* Bottom Right: AC Technician Washer Repair */}
              <div 
                onClick={() => onSelectCategory('ac-appliance-repair')}
                className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80"
                  alt="AC & Appliance Service"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3.5">
                  <span className="text-xs font-bold text-white tracking-wide bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                    AC &amp; Appliance Repair
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
