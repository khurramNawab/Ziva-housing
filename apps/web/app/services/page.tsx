'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UrbanCompanyHero from '../components/UrbanCompanyHero';
import UrbanCompanyModal from '../components/UrbanCompanyModal';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  order: number;
  isActive: boolean;
  subCategories?: any[];
}

function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const cleanBase = base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  return `${cleanBase}${path.startsWith('/') ? path : `/${path}`}`;
}

const ICON_MAP: Record<string, string> = {
  'cleaning': 'cleaning_services',
  'womens-salon-spa': 'spa',
  'mens-salon-massage': 'face',
  'ac-appliance-repair': 'ac_unit',
  'electrician-plumber-carpenter': 'build',
  'painting-waterproofing': 'format_paint',
  'instahelp': 'restaurant',
  'baby-sitting-childcare': 'child_care',
  'elderly-care': 'elderly',
  'packers-movers': 'local_shipping',
  'interior-modular-kitchen': 'countertops',
  'pest-control': 'pest_control',
};

function renderCategoryIcon(iconStr?: string | null, slug?: string, fallback = 'home_repair_service') {
  if (slug && ICON_MAP[slug]) return ICON_MAP[slug];
  if (iconStr && ICON_MAP[iconStr]) return ICON_MAP[iconStr];
  if (iconStr && /^[a-z0-9_]+$/i.test(iconStr)) return iconStr;
  return fallback;
}

const TRUST_STATS = [
  { value: '2,500+', label: 'Happy Customers', icon: 'sentiment_very_satisfied' },
  { value: '4.8★', label: 'Average Rating', icon: 'star' },
  { value: '250+', label: 'Verified Partners', icon: 'verified_user' },
  { value: '₹10,000', label: 'Damage Cover', icon: 'shield' },
];

const REDUNDANT_CHILD_SLUGS = ['home-cleaning', 'electrician', 'plumber', 'carpenter', 'pest-control'];

const CATEGORY_IMAGE_MAP: Record<string, { image: string; startingPrice: string; highlight: string }> = {
  'ac-appliance-repair': {
    image: '/services/ac-service.jpg',
    startingPrice: '₹499',
    highlight: 'Power Jet Wash & Repair',
  },
  'cleaning': {
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    startingPrice: '₹399',
    highlight: 'Deep Home & Bathroom Clean',
  },
  'womens-salon-spa': {
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    startingPrice: '₹299',
    highlight: 'Waxing, Facial & Manicure',
  },
  'mens-salon-massage': {
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    startingPrice: '₹249',
    highlight: 'Haircut, Grooming & Massage',
  },
  'electrician-plumber-carpenter': {
    image: '/services/electrician-service.jpg',
    startingPrice: '₹149',
    highlight: 'Wiring, Tap Repair & Fittings',
  },
  'painting-waterproofing': {
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    startingPrice: '₹999',
    highlight: 'Interior & Exterior Painting',
  },
  'packers-movers': {
    image: '/services/packers-movers.jpg',
    startingPrice: '₹1,999',
    highlight: 'Local & Intercity Shifting',
  },
  'instahelp': {
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    startingPrice: '₹199',
    highlight: 'Daily Cooks, Maids & Helpers',
  },
  'baby-sitting-childcare': {
    image: '/services/babysitting.jpg',
    startingPrice: '₹499',
    highlight: 'Certified Nannies & Caretakers',
  },
  'elderly-care': {
    image: '/services/elderly-care.jpg',
    startingPrice: '₹599',
    highlight: 'Compassionate In-home Care',
  },
  'interior-modular-kitchen': {
    image: '/services/modular-kitchen.jpg',
    startingPrice: '₹4,999',
    highlight: 'Custom Cabinets & Renovations',
  },
};

const MOST_BOOKED_SERVICES = [
  {
    id: 'mb-1',
    title: 'AC Power Jet Servicing',
    categorySlug: 'ac-appliance-repair',
    rating: 4.86,
    reviews: '520+',
    price: 499,
    originalPrice: 699,
    duration: '45 mins',
    tag: 'Bestseller',
    image: '/services/ac-service.jpg',
    features: ['High-pressure jet flush', 'Cooling coil & filter wash', 'Drain pipe unclog'],
  },
  {
    id: 'mb-2',
    title: 'Intense Bathroom Cleaning',
    categorySlug: 'cleaning',
    rating: 4.82,
    reviews: '380+',
    price: 449,
    originalPrice: 599,
    duration: '60 mins',
    tag: 'Most Loved',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
    features: ['Hard water stain removal', 'Tile & grout scrub', 'Fitting descaling & buff'],
  },
  {
    id: 'mb-3',
    title: 'Classic Pedicure & Manicure',
    categorySlug: 'womens-salon-spa',
    rating: 4.91,
    reviews: '240+',
    price: 799,
    originalPrice: 1099,
    duration: '70 mins',
    tag: 'Top Rated',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    features: ['Cuticle care & shaping', 'Relaxing foot/hand massage', 'Premium gel polish'],
  },
  {
    id: 'mb-4',
    title: 'Switchboard & Socket Repair',
    categorySlug: 'electrician-plumber-carpenter',
    rating: 4.84,
    reviews: '310+',
    price: 149,
    originalPrice: 199,
    duration: '20 mins',
    tag: 'Quick 20-min',
    image: '/services/electrician-service.jpg',
    features: ['Circuit testing', 'Short-circuit fix', 'Spare replacement check'],
  },
  {
    id: 'mb-5',
    title: 'House Shifting & Relocation',
    categorySlug: 'packers-movers',
    rating: 4.79,
    reviews: '180+',
    price: 2499,
    originalPrice: 3200,
    duration: 'Door-to-Door',
    tag: 'Safe Move',
    image: '/services/packers-movers.jpg',
    features: ['3-layer bubble packing', 'Safe loading & transit', 'Furniture disassembly'],
  },
  {
    id: 'mb-6',
    title: 'Infant Nanny & Childcare',
    categorySlug: 'baby-sitting-childcare',
    rating: 4.92,
    reviews: '140+',
    price: 499,
    originalPrice: 700,
    duration: 'Hourly / Monthly',
    tag: 'Certified',
    image: '/services/babysitting.jpg',
    features: ['Background & medical verified', 'Feeding & hygiene care', 'Activity stimulation'],
  },
];

const POPULAR_COMBOS = [
  {
    title: 'Home Makeover Pack',
    services: ['Deep Cleaning', 'Wall Painting', 'AC Jet Service'],
    price: 3499,
    originalPrice: 5200,
    tag: 'Save 33%',
    icon: 'home',
    color: 'bg-purple-100 text-[#5e23dc]',
  },
  {
    title: 'Move-in Ready Pack',
    services: ['Deep Cleaning', 'Electrician Check', 'Pest Control'],
    price: 2199,
    originalPrice: 3100,
    tag: 'Save 29%',
    icon: 'local_shipping',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Glow Essentials Pack',
    services: ["Women's Salon", 'Spa Treatment', 'Hair Studio'],
    price: 1799,
    originalPrice: 2500,
    tag: 'Save 28%',
    icon: 'spa',
    color: 'bg-rose-100 text-rose-600',
  },
];

const REVIEWS = [
  {
    id: 'r1',
    name: 'Pooja Hegde',
    city: 'Bengaluru, Koramangala',
    service: 'AC Jet Cleaning & Repair',
    rating: 5,
    date: '3 days ago',
    comment: 'The technician Ramesh arrived exactly on time with a full jet cleaning kit. Cleaned both indoor and outdoor units without spilling a drop on the floor. Super satisfied!',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'r2',
    name: 'Vikram Mehta',
    city: 'Mumbai, Powai',
    service: 'Full Home Deep Cleaning',
    rating: 5,
    date: '1 week ago',
    comment: 'Booked for our 3BHK before housewarming. A team of 3 professionals came with industrial vacuum cleaners and single-disc scrubbers. Kitchen and bathrooms look brand new!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'r3',
    name: 'Neha Deshmukh',
    city: 'Pune, Viman Nagar',
    service: 'Mani-Pedi & Facial',
    rating: 5,
    date: '2 weeks ago',
    comment: 'The beautician was polite, carried a disposable sanitised kit, and the massage was heavenly. Urban Company standard right at doorstep!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
];

const FAQS = [
  {
    q: 'How does the Ziva 30-Day Service Guarantee work?',
    a: 'If you are dissatisfied with any part of the service provided, report it through your dashboard or support within 30 days. We will send another senior professional to re-do the service free of charge, or provide a 100% refund.',
  },
  {
    q: 'Are your service professionals background checked and verified?',
    a: 'Yes, 100%. Every professional undergoes government Aadhaar ID verification, police criminal background checks, skill competency testing, and hygienic protocol training before being onboarded.',
  },
  {
    q: 'What payment methods do you support? Can I pay after the service?',
    a: 'We support all major payment modes including UPI, Credit/Debit cards, Net Banking, and Pay After Service (Cash or UPI directly to the pro once you inspect and are completely satisfied).',
  },
  {
    q: 'Is there damage protection for my home appliances or property?',
    a: 'Yes. Every booking is covered under our Ziva Protection Plan with damage insurance up to ₹10,000 for any unintended accidental damage during the service.',
  },
  {
    q: 'What if I need to reschedule or cancel my booking?',
    a: 'You can reschedule or cancel your booking for free anytime up to 2 hours before the scheduled slot directly from your Bookings dashboard.',
  },
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/services/categories'), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setCategories(data.filter((c: any) => c.isActive !== false));
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadCategories();
    const handleRefresh = () => loadCategories();
    window.addEventListener('focus', handleRefresh);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ziva_admin_sync');
      bc.onmessage = (m) => {
        if (m.data?.type === 'SERVICES_UPDATED') loadCategories();
      };
    } catch {}
    return () => {
      window.removeEventListener('focus', handleRefresh);
      if (bc) bc.close();
    };
  }, [loadCategories]);

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) {
      setModalCategory(cat);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const openModal = (slug: string) => {
    setModalCategory(slug);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-[Rubik] text-[#191c1e]">
      <Navbar />

      <main className="flex-1">
        {/* URBAN COMPANY HERO — Category Grid + Collage */}
        <UrbanCompanyHero onSelectCategory={openModal} />

        {/* TRUST STATS BAR */}
        <div className="bg-[#f8f9fb] border-y border-[#eceef0] py-4">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e8ddff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#5e23dc] text-xl">{s.icon}</span>
                  </div>
                  <div>
                    <div className="text-[16px] font-extrabold text-[#111827]">{s.value}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* MOST BOOKED SERVICES (Instant Book Cards) */}
        <section className="py-12 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[22px] md:text-[28px] font-extrabold text-[#111827]">
                Most Booked Doorstep Services
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Highest rated by verified customers this month
              </p>
            </div>
            <button
              onClick={() => openModal('all')}
              className="text-[#5e23dc] font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer"
            >
              See all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOST_BOOKED_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-[#111827]/85 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                      {srv.tag}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[#111827] text-xs font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                      <span className="text-amber-500">★</span> {srv.rating} ({srv.reviews})
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#111827] group-hover:text-[#5e23dc] transition-colors">
                        {srv.title}
                      </h3>
                    </div>

                    <div className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span> {srv.duration}
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1 pt-1">
                      {srv.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-600 text-xs shrink-0">
                            check_circle
                          </span>
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-gray-100 flex items-center justify-between bg-[#fafbfc]">
                  <div>
                    <span className="text-lg font-black text-[#111827]">₹{srv.price}</span>
                    <span className="text-xs text-gray-400 line-through ml-2">₹{srv.originalPrice}</span>
                  </div>
                  <button
                    onClick={() => openModal(srv.categorySlug)}
                    className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow group-hover:scale-105 duration-200 cursor-pointer flex items-center gap-1"
                  >
                    <span>Book Now</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ALL CATEGORIES GRID */}
        {categories.length > 0 && (
          <section className="py-14 bg-gradient-to-b from-[#f8f9fb] to-[#f3f4f8] border-y border-[#eceef0]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8ddff] text-[#5e23dc] text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Verified Doorstep Services
                  </div>
                  <h2 className="text-[24px] md:text-[32px] font-extrabold text-[#111827] tracking-tight">
                    All Home Service Categories
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Explore curated categories with upfront transparent pricing and standard warranties
                  </p>
                </div>
                <button
                  onClick={() => openModal('all')}
                  className="hidden sm:flex text-[#5e23dc] hover:text-[#4500b4] font-bold text-sm items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-purple-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Explore all</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categories
                  .filter((c) => !REDUNDANT_CHILD_SLUGS.includes(c.slug))
                  .map((cat) => {
                    const meta = CATEGORY_IMAGE_MAP[cat.slug] || {
                      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
                      startingPrice: '₹199',
                      highlight: 'Doorstep Verified Experts',
                    };
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => openModal(cat.slug)}
                        className="group relative h-60 rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between p-4.5 hover:-translate-y-1 cursor-pointer bg-gray-900"
                      >
                        {/* Background Photo with Dark Gradient */}
                        <div className="absolute inset-0 z-0 overflow-hidden">
                          <img
                            src={meta.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 brightness-90 group-hover:brightness-95"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/45 to-black/20" />
                        </div>

                        {/* Top Bar: Icon Badge & Badge/Starts At */}
                        <div className="relative z-10 flex items-start justify-between">
                          <span className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-[#5e23dc] shadow-md flex items-center justify-center group-hover:bg-[#5e23dc] group-hover:text-white transition-colors duration-200">
                            <span className="material-symbols-outlined text-xl">
                              {renderCategoryIcon(cat.icon, cat.slug)}
                            </span>
                          </span>
                          {cat.badge ? (
                            <span className="bg-[#10b981] text-white text-[10.5px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">bolt</span>
                              {cat.badge}
                            </span>
                          ) : (
                            <span className="bg-black/60 backdrop-blur-xs text-white/95 text-[10.5px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                              Starts {meta.startingPrice}
                            </span>
                          )}
                        </div>

                        {/* Bottom Info: Title, Subtitle, CTA */}
                        <div className="relative z-10 text-white">
                          <h3 className="text-base font-extrabold leading-snug group-hover:text-amber-300 transition-colors drop-shadow-xs">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-white/80 font-medium mt-1 truncate">
                            {meta.highlight}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/20 text-xs font-semibold">
                            <span className="text-[11px] text-white/90 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-amber-400">verified</span>
                              {cat.subCategories?.length ? `${cat.subCategories.length} services` : 'Instant booking'}
                            </span>
                            <span className="text-amber-300 group-hover:text-white group-hover:translate-x-1 transition-all flex items-center gap-0.5 font-bold">
                              Book <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* POPULAR SERVICE COMBOS */}
        <section className="py-12 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="mb-6">
            <h2 className="text-[22px] md:text-[28px] font-extrabold text-[#111827]">
              Popular Service Bundles &amp; Combos
            </h2>
            <p className="text-sm text-gray-500 mt-1">Save up to 35% when you bundle services together</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {POPULAR_COMBOS.map((combo) => (
              <div
                key={combo.title}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl ${combo.color} flex items-center justify-center shadow-xs`}>
                    <span className="material-symbols-outlined text-2xl">{combo.icon}</span>
                  </div>
                  <span className="bg-[#fee2e2] text-red-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {combo.tag}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#111827] group-hover:text-[#5e23dc] transition-colors">
                  {combo.title}
                </h3>
                <div className="flex flex-wrap gap-1 my-2">
                  {combo.services.map((s) => (
                    <span key={s} className="text-[10px] font-bold bg-purple-50 text-[#5e23dc] px-2 py-0.5 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-lg font-extrabold text-[#111827]">₹{combo.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 line-through ml-2">₹{combo.originalPrice.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => openModal('all')}
                    className="bg-[#5e23dc] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#4500b4] transition-all cursor-pointer"
                  >
                    Book Pack
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⭐ ZIVA PLUS VIP CLUB MEMBERSHIP CARD */}
        <section className="pb-14 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170e2f] via-[#24134b] to-[#4500b4] border border-[#5e23dc]/40 p-6 md:p-8 shadow-xl text-white">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#7a3bf2]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-gray-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
                  <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider border border-amber-400/30 mb-1.5">
                    <span className="material-symbols-outlined text-xs">hotel_class</span>
                    VIP Club Membership
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Ziva Plus Membership — Save ₹150+ On Every Booking
                  </h3>
                  <p className="text-xs md:text-sm text-purple-200 mt-1 max-w-xl">
                    Get extra 10% instant discounts, guaranteed allocation of top-rated verified professionals, and free cancellation anytime.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-white/90">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                      <span>Extra 10% Off Every Service</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                      <span>Top 1% Senior Pros Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">check_circle</span>
                      <span>Free Reschedule &amp; Cancellation</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => openModal('all')}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-gray-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-98 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Member Benefits</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ZIVA GUARANTEE & SAFETY PILLARS */}
        <section className="py-14 bg-gradient-to-br from-[#0f0c1a] via-[#1a1233] to-[#251547] text-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <span className="inline-block bg-[#5e23dc] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  The Ziva Standard
                </span>
                <h2 className="text-[28px] md:text-[38px] font-black leading-tight">
                  100% Satisfaction<br />or Complete Free Redo
                </h2>
                <p className="text-sm text-purple-200 leading-relaxed">
                  Every service is protected by our comprehensive 4-pillar trust framework. Book with zero stress knowing you are covered end-to-end.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { title: 'Police Verified Pros', desc: '100% Aadhaar & background verified experts', icon: 'verified' },
                    { title: '₹10,000 Damage Cover', desc: 'Insurance protection on all service jobs', icon: 'shield' },
                    { title: '30-Day Guarantee', desc: 'Zero hassle free re-do if not satisfied', icon: 'published_with_changes' },
                    { title: 'Transparent Pricing', desc: 'Fixed upfront rate card, zero surprise fees', icon: 'payments' },
                  ].map((p) => (
                    <div key={p.title} className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-amber-400 text-lg">{p.icon}</span>
                        <span className="text-xs font-extrabold text-white">{p.title}</span>
                      </div>
                      <p className="text-[11px] text-purple-200">{p.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => openModal('cleaning')}
                    className="inline-flex items-center gap-2 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-lg text-sm cursor-pointer"
                  >
                    <span>Book with Guarantee</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80', label: 'Full Home Cleaning', tag: 'Deep Clean' },
                  { img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80', label: "Women's Salon", tag: 'Hygienic' },
                  { img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80', label: 'AC Power Jet', tag: '45 mins' },
                  { img: '/services/packers-movers.jpg', label: 'Packers & Movers', tag: '3-Layer Pack' },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    className="relative rounded-2xl overflow-hidden h-40 group cursor-pointer border border-white/15"
                    onClick={() => openModal('all')}
                  >
                    <img
                      src={tile.img}
                      alt={tile.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                      <span className="text-[10px] font-bold text-amber-300">{tile.tag}</span>
                      <span className="text-xs font-bold text-white">{tile.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOMER REVIEWS & STORIES */}
        <section className="py-14 max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold text-[#5e23dc] uppercase tracking-wider">
              Real Stories from Verified Users
            </span>
            <h2 className="text-[24px] md:text-[32px] font-black text-[#111827] mt-1">
              Loved by 2,500+ Happy Homes
            </h2>
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-500 font-extrabold text-sm">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              <span className="text-gray-600 font-semibold ml-1.5">4.8 out of 5 based on 1,200+ verified ratings</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.avatar}
                        alt={rev.name}
                        className="w-10 h-10 rounded-full object-cover border border-purple-200"
                      />
                      <div>
                        <div className="text-sm font-extrabold text-[#111827]">{rev.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{rev.city}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                    {'★★★★★'}
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">
                      Verified Booking
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#5e23dc] mb-2">{rev.service}</div>
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (Accordion) */}
        <section className="py-14 bg-[#f8f9fb] border-y border-[#eceef0]">
          <div className="max-w-[800px] mx-auto px-4 md:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-extrabold text-[#5e23dc] uppercase tracking-wider">Help & Answers</span>
              <h2 className="text-[24px] md:text-[30px] font-extrabold text-[#111827] mt-1">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={faq.q}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 md:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm md:text-base font-extrabold text-[#111827] pr-4">
                        {faq.q}
                      </span>
                      <span className="material-symbols-outlined text-gray-400 shrink-0 transition-transform duration-200">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BECOME A PARTNER CTA */}
        <section className="py-12 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="bg-gradient-to-r from-[#e8faf4] via-[#f0fdf9] to-[#dcfce7] rounded-3xl p-8 md:p-10 border border-[#16a373]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 text-center md:text-left">
                <span className="bg-[#16a373] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Partner with Ziva
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#064e3b]">
                  Are you a Service Professional?
                </h3>
                <p className="text-sm text-[#047857] max-w-xl">
                  Join 15,000+ verified professionals earning ₹40,000 to ₹75,000/month with regular bookings, flexible hours, and weekly direct bank payouts.
                </p>
              </div>
              <Link
                href="/become-professional/register"
                className="bg-[#006c47] hover:bg-[#064e3b] text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">handyman</span>
                <span>Register as Partner</span>
              </Link>
            </div>
          </div>
        </section>

        {/* REAL ESTATE CROSSLINK BANNER */}
        <section className="py-8 bg-[#f8f9fb] border-t border-[#eceef0]">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-extrabold text-[#191c1e]">Looking to Buy, Sell, or Rent a Home?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Explore 12,000+ verified listings across 40+ cities with escrow transaction safety.
              </p>
            </div>
            <Link
              href="/real-estate"
              className="bg-[#191c1e] text-white font-extrabold px-5 py-2.5 rounded-xl text-sm hover:bg-[#374151] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              <span>Explore Real Estate</span>
            </Link>
          </div>
        </section>
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

export default function ServicesHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-[Rubik]">Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
