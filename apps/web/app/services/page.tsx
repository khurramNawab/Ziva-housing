'use client';

import Link from 'next/link';
import Navbar from '../components/Navbar';

const ALL_SERVICES = [
  // Cleaning
  {
    slug: 'home-cleaning',
    title: 'Full House Deep Cleaning',
    desc: 'Top-to-bottom sanitize, kitchen, bathroom & upholstery jet wash.',
    price: '₹1,499',
    icon: 'cleaning_services',
    badge: 'Most Popular',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Cleaning & Hygiene',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'pest-control',
    title: 'Termite & Pest Control',
    desc: 'Odorless chemical spray against cockroaches, termites & bugs.',
    price: '₹899',
    icon: 'pest_control',
    badge: '30-day Guarantee',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Cleaning & Hygiene',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
  },
  // Repairs
  {
    slug: 'ac-repair',
    title: 'AC Service & Gas Charge',
    desc: 'High-pressure foam wash, cooling diagnosis & gas refill.',
    price: '₹699',
    icon: 'ac_unit',
    badge: 'Summer Special',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Appliance & Repair',
    img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'electrician',
    title: 'Electrician & Safety Audit',
    desc: 'Wiring inspection, short circuit fixes, switchboard & fan installs.',
    price: '₹299',
    icon: 'bolt',
    badge: 'Instant 30min',
    badgeColor: 'bg-[#fff8e6] text-[#92400e]',
    category: 'Appliance & Repair',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'plumbing',
    title: 'Plumbing & Pipe Fixes',
    desc: 'Leak repairs, tap installation, drainage unblocking & geyser setup.',
    price: '₹349',
    icon: 'plumbing',
    badge: 'Certified Plumber',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Appliance & Repair',
    img: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'carpenter',
    title: 'Carpentry & Furniture Repair',
    desc: 'Lock replacement, door fixing, custom shelving & bed assembly.',
    price: '₹399',
    icon: 'carpenter',
    badge: 'Master Woodwork',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Appliance & Repair',
    img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'painting',
    title: 'Interior & Exterior Painting',
    desc: 'Premium paint finish for walls, ceilings, doors & grills.',
    price: '₹8/sqft',
    icon: 'format_paint',
    badge: 'Waterproof Paint',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Appliance & Repair',
    img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
  },
  // Care
  {
    slug: 'baby-sitting',
    title: 'Baby Sitting & Child Care',
    desc: 'Verified, trained nannies for infant care, playtime, and child supervision.',
    price: '₹499/hr',
    icon: 'child_care',
    badge: 'Vetted Nannies',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Care Services',
    img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'elderly-care',
    title: 'Elderly Care & Assistance',
    desc: 'Dedicated daily health support, mobility assistance, and companionship.',
    price: '₹799/day',
    icon: 'elderly',
    badge: 'Certified Care',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Care Services',
    img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'cook-chef',
    title: 'Personal Cook / Chef',
    desc: 'Experienced home cooks for daily meals, tiffin or special occasions.',
    price: '₹599/day',
    icon: 'restaurant',
    badge: 'Background Verified',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Care Services',
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'driver',
    title: 'Personal Driver',
    desc: 'Verified full-time or part-time drivers for daily commute & outstation.',
    price: '₹699/day',
    icon: 'drive_eta',
    badge: 'Licensed Driver',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Care Services',
    img: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80',
  },
  // Moving
  {
    slug: 'packers-movers',
    title: 'Packers & Movers',
    desc: 'Hassle-free household relocation with bubble wrapping & transport.',
    price: '₹4,999',
    icon: 'local_shipping',
    badge: 'Verified Truck',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Shifting & Relocation',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  },
  // Gardening
  {
    slug: 'gardening',
    title: 'Garden Maintenance',
    desc: 'Lawn mowing, pruning, plant care & landscape design for homes.',
    price: '₹799',
    icon: 'yard',
    badge: 'Seasonal Care',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Outdoor & Garden',
    img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
  },
  // Solar
  {
    slug: 'solar-installation',
    title: 'Solar Panel Installation',
    desc: 'Rooftop solar panels with grid connection & PM Surya Ghar subsidy support.',
    price: '₹45,000+',
    icon: 'solar_power',
    badge: 'Govt. Subsidy',
    badgeColor: 'bg-[#fff8e6] text-[#92400e]',
    category: 'Solar & Energy',
    img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
  },
  // Beauty & Wellness
  {
    slug: 'beautician',
    title: 'Beautician at Home',
    desc: 'Facial, waxing, threading, makeup & bridal packages at your doorstep.',
    price: '₹499',
    icon: 'face_retouching_natural',
    badge: 'At Home',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Beauty & Wellness',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'womens-spa',
    title: "Women's Spa at Home",
    desc: 'Relaxing full-body massage, aromatherapy & de-stress spa treatments for women.',
    price: '₹1,199',
    icon: 'spa',
    badge: 'Women Only',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Beauty & Wellness',
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'mens-spa',
    title: "Men's Spa & Grooming",
    desc: 'Deep tissue massage, face cleanup, beard grooming & de-stress sessions for men.',
    price: '₹999',
    icon: 'self_improvement',
    badge: 'Men Only',
    badgeColor: 'bg-[#e8ddff] text-[#4500b4]',
    category: 'Beauty & Wellness',
    img: 'https://images.unsplash.com/photo-1591019052241-e4d84ee73c4e?auto=format&fit=crop&w=600&q=80',
  },
  {
    slug: 'yoga-at-home',
    title: 'Yoga & Wellness Instructor',
    desc: 'Certified yoga instructors for morning sessions, meditation & breathing.',
    price: '₹399/session',
    icon: 'self_improvement',
    badge: 'Certified Trainer',
    badgeColor: 'bg-[#e8faf4] text-[#065f46]',
    category: 'Beauty & Wellness',
    img: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=600&q=80',
  },
];

const CATEGORIES = [...new Set(ALL_SERVICES.map((s) => s.category))];

export default function HomeServicesPage() {
  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-12">

        {/* Hero Banner */}
        <section className="bg-[#191919] text-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-[#191919]/40 z-0" />
          <div className="space-y-4 max-w-xl z-10">
            <span className="bg-[#5e23dc] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Ziva Guaranteed Home Services
            </span>
            <h1 className="text-[32px] md:text-[44px] leading-[40px] md:leading-[52px] font-bold">
              Professional Home Care, <span className="text-[#cebdff]">Simplified.</span>
            </h1>
            <p className="text-[14px] leading-[20px] text-[#c9c7c6]">
              Book background-verified professionals instantly. 18 services across 7 categories.
            </p>
          </div>
          <div className="z-10 flex gap-3 shrink-0">
            <Link href="/services/home-cleaning" className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md">
              Book Deep Cleaning
            </Link>
            <Link href="/services/ac-repair" className="border border-[#545353] text-[#e0e3e5] hover:bg-[#3d3c3c] font-bold px-6 py-3 rounded-xl text-xs transition-all">
              AC Servicing
            </Link>
          </div>
        </section>

        {/* Services by Category */}
        {CATEGORIES.map((cat) => {
          const services = ALL_SERVICES.filter((s) => s.category === cat);
          return (
            <section key={cat} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#191c1e]">{cat}</h2>
                <span className="text-xs text-[#7a7487] font-medium">{services.length} service{services.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {services.map((svc) => (
                  <Link
                    key={svc.slug}
                    href={`/services/${svc.slug}`}
                    className="bg-white rounded-2xl overflow-hidden border border-[#eceef0] hover:border-[#5e23dc] shadow-sm hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={svc.img}
                        alt={svc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-3 left-3 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${svc.badgeColor}`}>
                        {svc.badge}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#5e23dc] text-lg flex-shrink-0 mt-0.5">{svc.icon}</span>
                        <h3 className="font-bold text-sm text-[#191c1e] group-hover:text-[#4500b4] transition-colors leading-tight">{svc.title}</h3>
                      </div>
                      <p className="text-[11px] text-[#7a7487] leading-relaxed flex-1">{svc.desc}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#eceef0]">
                        <span className="text-sm font-bold text-[#006c47]">Starting {svc.price}</span>
                        <span className="text-[#5e23dc] text-xs font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Book <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

      </main>

      <footer className="bg-[#2d3133] text-[#eff1f3] mt-auto border-t border-[#3d3c3c]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 text-center text-xs text-[#c9c7c6]">
          © 2026 Ziva Housing Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
