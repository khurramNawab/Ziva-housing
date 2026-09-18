'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface UrbanModalCategoryProps {
  initialCategory?: string; // 'all' | 'instahelp' | 'womens-salon-spa' | 'mens-salon-massage' | 'cleaning' | 'ac-appliance-repair' | 'electrician-plumber-carpenter' | 'painting-waterproofing'
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (serviceName: string, categorySlug: string) => void;
}

export default function UrbanCompanyModal({
  initialCategory = 'all',
  isOpen,
  onClose,
  onSelectService,
}: UrbanModalCategoryProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to initialCategory smoothly upon opening
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialCategory && initialCategory !== 'all') {
        setTimeout(() => {
          const targetEl = document.getElementById(`section-${initialCategory}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleItemClick = (serviceName: string, targetSlug: string) => {
    onClose();
    if (onSelectService) {
      onSelectService(serviceName, targetSlug);
    }
    // Route directly to service booking / detail page
    router.push(`/services/${targetSlug}?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-[540px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scaleUp border border-gray-100 font-[Rubik]">
        
        {/* Floating Circular Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-[#191c1e] text-white flex items-center justify-center hover:bg-black transition-transform hover:scale-110 shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] font-bold">close</span>
        </button>

        {/* Scrollable Content Body - ALL SECTIONS CLEANLY RENDERED */}
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto px-6 py-7 space-y-7 scrollbar-thin scrollbar-thumb-gray-200"
        >
          
          {/* ════════════════════ 1. INSTAHELP ════════════════════ */}
          <div id="section-instahelp" className="space-y-3 scroll-mt-4">
            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
              InstaHelp
            </h2>
            <div className="flex gap-4">
              <div
                onClick={() => handleItemClick('InstaHelp Daily Helper', 'cook-chef')}
                className="w-24 h-24 sm:w-26 sm:h-26 bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all hover:scale-105 group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  👩‍🍳
                </div>
                <span className="text-[11px] font-semibold text-[#1f2937] leading-tight">
                  InstaHelp
                </span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* ════════════════════ 2. WOMEN'S SALON & SPA ════════════════════ */}
          <div id="section-womens-salon-spa" className="space-y-3 scroll-mt-4">
            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
              Women's Salon &amp; Spa
            </h2>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {/* Salon for Women */}
              <div
                onClick={() => handleItemClick('Salon for Women', 'beautician')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  🧖‍♀️
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Salon for Women
                </span>
              </div>

              {/* Spa for Women */}
              <div
                onClick={() => handleItemClick('Spa for Women', 'womens-spa')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  💆‍♀️
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Spa for Women
                </span>
              </div>

              {/* Hair Studio */}
              <div
                onClick={() => handleItemClick('Hair Studio for Women', 'beautician')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  💇‍♀️
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Hair Studio for Women
                </span>
              </div>

              {/* Makeup, Saree & Styling */}
              <div
                onClick={() => handleItemClick('Makeup, Saree & Styling', 'beautician')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  💄
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Makeup, Saree &amp; Styling
                </span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* ════════════════════ 3. MEN'S SALON & MASSAGE ════════════════════ */}
          <div id="section-mens-salon-massage" className="space-y-3 scroll-mt-4">
            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
              Men's Salon &amp; Massage
            </h2>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {/* Salon for Men */}
              <div
                onClick={() => handleItemClick('Salon for Men', 'mens-spa')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  🧔‍♂️
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Salon for Men
                </span>
              </div>

              {/* Massage for Men */}
              <div
                onClick={() => handleItemClick('Massage for Men', 'mens-spa')}
                className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                  💆‍♂️
                </div>
                <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                  Massage for Men
                </span>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* ════════════════════ 4. CLEANING & PEST CONTROL ════════════════════ */}
          <div id="section-cleaning" className="space-y-6 scroll-mt-4">
            <div className="space-y-4">
              <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
                Cleaning &amp; Pest Control
              </h2>

              {/* Sub-header: Cleaning */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#374151]">Cleaning</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Bathroom Cleaning */}
                  <div
                    onClick={() => handleItemClick('Bathroom Cleaning', 'cleaning')}
                    className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                      44 mins
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform mt-2">
                      🚽
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Bathroom Cleaning
                    </span>
                  </div>

                  {/* Kitchen Cleaning */}
                  <div
                    onClick={() => handleItemClick('Kitchen Cleaning', 'cleaning')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🍳
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Kitchen Cleaning
                    </span>
                  </div>

                  {/* Living & Bedroom Cleaning */}
                  <div
                    onClick={() => handleItemClick('Living & Bedroom Cleaning', 'cleaning')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🛋️
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Living &amp; Bedroom Cleaning
                    </span>
                  </div>

                  {/* Full Home / By Room */}
                  <div
                    onClick={() => handleItemClick('Full Home / By Room Cleaning', 'cleaning')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🏡
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Full Home/ By Room Cleaning
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-header: Pest Control */}
              <div className="space-y-2 pt-1">
                <h3 className="text-sm font-bold text-[#374151]">Pest Control</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  <div
                    onClick={() => handleItemClick('Cockroach Control', 'pest-control')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🪳
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Cockroach Control
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Ants & Bed Bugs Control', 'pest-control')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🐜
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Ants &amp; Bed Bugs Control
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-gray-100 w-full" />

            {/* Painting & Water-proofing */}
            <div id="section-painting-waterproofing" className="space-y-3 scroll-mt-4">
              <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
                Painting &amp; Water - proofing
              </h2>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                <div
                  onClick={() => handleItemClick('Painting & Water - proofing', 'painting')}
                  className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                >
                  <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                    🖌️
                  </div>
                  <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                    Painting &amp; Water - proofing
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* ════════════════════ 5. AC & APPLIANCE REPAIR ════════════════════ */}
          <div id="section-ac-appliance-repair" className="space-y-6 scroll-mt-4">
            <div className="space-y-4">
              <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
                AC &amp; Appliance Repair
              </h2>

              {/* Large appliances */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#374151]">Large appliances</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  {/* AC */}
                  <div
                    onClick={() => handleItemClick('AC Service & Repair', 'ac-repair')}
                    className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                      44 mins
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform mt-2">
                      ❄️
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      AC
                    </span>
                  </div>

                  {/* Washing Machine */}
                  <div
                    onClick={() => handleItemClick('Washing Machine Repair', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🧺
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Washing Machine
                    </span>
                  </div>

                  {/* Refrigerator */}
                  <div
                    onClick={() => handleItemClick('Refrigerator Repair', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🧊
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Refrigerator
                    </span>
                  </div>

                  {/* Television */}
                  <div
                    onClick={() => handleItemClick('Television Repair & Setup', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      📺
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Television
                    </span>
                  </div>
                </div>
              </div>

              {/* Other appliances */}
              <div className="space-y-2 pt-1">
                <h3 className="text-sm font-bold text-[#374151]">Other appliances</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  <div
                    onClick={() => handleItemClick('Chimney Repair & Clean', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🫕
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Chimney
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Microwave Repair', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      📟
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Microwave
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Stove & Gas Repair', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🔥
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Stove
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Laptop Repair & Diagnostic', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      💻
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Laptop
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('RO/Water Purifier Service', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🚰
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      RO/Water Purifier
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Geyser Repair & Service', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      ♨️
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Geyser
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Air Cooler Repair', 'ac-repair')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🌬️
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Air Cooler
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gray-100 w-full" />

          {/* ════════════════════ 6. ELECTRICIAN, PLUMBER & CARPENTER ════════════════════ */}
          <div id="section-electrician-plumber-carpenter" className="space-y-6 scroll-mt-4">
            <div className="space-y-4">
              <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">
                Electrician, Plumber &amp; Carpenter
              </h2>

              {/* Home repairs */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#374151]">Home repairs</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  <div
                    onClick={() => handleItemClick('Electrician Service', 'electrician')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🔌
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Electrician
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Plumber Service', 'plumbing')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🔧
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Plumber
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Carpenter Woodwork', 'carpenter')}
                    className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                      19 mins
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform mt-2">
                      🚪
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Carpenter
                    </span>
                  </div>
                </div>
              </div>

              {/* Home installation */}
              <div className="space-y-2 pt-1">
                <h3 className="text-sm font-bold text-[#374151]">Home installation</h3>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  <div
                    onClick={() => handleItemClick('Fan Installation', 'electrician')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      🪭
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Fan Installation
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Furniture Assembly', 'carpenter')}
                    className="relative bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <span className="absolute top-1.5 left-1.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                      25 mins
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform mt-2">
                      🪑
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Furniture Assembly
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Geyser Service & Repair', 'electrician')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      ♨️
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Geyser Service &amp; Repair
                    </span>
                  </div>

                  <div
                    onClick={() => handleItemClick('Festival Lights Installation', 'electrician')}
                    className="bg-[#f8f9fb] hover:bg-purple-50/70 border border-gray-100 hover:border-purple-200 rounded-2xl flex flex-col items-center justify-center p-2 sm:p-2.5 text-center cursor-pointer transition-all hover:scale-105 group h-28"
                  >
                    <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 group-hover:-translate-y-0.5 transition-transform">
                      💡
                    </div>
                    <span className="text-[10.5px] font-semibold text-[#1f2937] leading-tight">
                      Festival Lights Installation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
