'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '../../components/Footer';

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  durationMinutes?: number;
  description?: string;
}

interface ProviderMock {
  name: string;
  rating: number;
  jobsCompleted: number;
  distance: string;
  bio: string;
  avatar: string;
}

// Exact base starting prices map for all 18 services to eliminate price mismatches
const serviceBasePrices: Record<string, number> = {
  'home-cleaning': 1499,
  'pest-control': 899,
  'ac-repair': 699,
  'electrician': 299,
  'plumbing': 349,
  'carpenter': 399,
  'painting': 799,
  'baby-sitting': 499,
  'elderly-care': 799,
  'cook-chef': 599,
  'driver': 699,
  'packers-movers': 4999,
  'gardening': 799,
  'solar-installation': 45000,
  'beautician': 499,
  'womens-spa': 1199,
  'mens-spa': 999,
  'yoga-at-home': 399,
};

// Service metadata for hero images, icons, descriptions, and inclusions for all 18 services
const serviceMetadata: Record<string, {
  title: string;
  icon: string;
  tagline: string;
  duration: string;
  team: string;
  heroImg: string;
  badges: string[];
  includes: { icon: string; title: string; desc: string }[];
}> = {
  'home-cleaning': {
    title: 'Full House Deep Cleaning',
    icon: 'cleaning_services',
    tagline: 'Comprehensive, top-to-bottom cleaning for your entire home. Includes kitchen, bathroom sanitization, and upholstery jet wash.',
    duration: '3-4 hrs',
    team: '2-3 Pros',
    heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    badges: ['Most Popular', 'Ziva Guaranteed'],
    includes: [
      { icon: 'cleaning_services', title: 'Dusting & Deep Wiping', desc: 'All surfaces, baseboards, ceiling fans, blinds, and light fixtures.' },
      { icon: 'floor', title: 'Floor Scrubbing & Mopping', desc: 'Deep vacuuming of carpets, tile scrubbing, and hard floor polishing.' },
      { icon: 'countertops', title: 'Kitchen Heavy Degreasing', desc: 'Exterior/interior of cabinets, heavy grease removal, sink scrubbing.' },
      { icon: 'bathtub', title: 'Bathroom Disinfection', desc: 'Tile grout, toilet bowl, shower glass, sink, and mirrors sanitized.' },
    ],
  },
  'pest-control': {
    title: 'Termite & Pest Control',
    icon: 'pest_control',
    tagline: 'Odorless, herbal chemical spray treatment against cockroaches, termites, bedbugs, and mosquitoes.',
    duration: '1-2 hrs',
    team: '1 Pro',
    heroImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    badges: ['30-Day Guarantee', 'Odorless & Safe'],
    includes: [
      { icon: 'bug_report', title: 'Cockroach & Ant Spray', desc: 'Herbal gel formulation applied in kitchen cabinets, drains, and nooks.' },
      { icon: 'shield', title: 'Termite Defense Barrier', desc: 'Deep chemical injection into wood surfaces and wall joints.' },
      { icon: 'verified', title: 'Odorless Formula', desc: 'Non-toxic spray safe for children, seniors, and pets.' },
      { icon: 'history', title: 'Free Re-service', desc: 'Complimentary revisit within 30 days if pest activity persists.' },
    ],
  },
  'ac-repair': {
    title: 'AC Service & Gas Charge',
    icon: 'ac_unit',
    tagline: 'High-pressure jet wash, refrigerant cooling check, and electrical diagnostic for all split & window ACs.',
    duration: '1-2 hrs',
    team: '1 Technician',
    heroImg: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=80',
    badges: ['Summer Special', 'Certified Tech'],
    includes: [
      { icon: 'air', title: 'High-Pressure Foam Wash', desc: 'Deep washing of air filters, cooling coils, and drain tray.' },
      { icon: 'thermostat', title: 'Gas Refill & Check', desc: 'R32/R410a refrigerant level check and recharge.' },
      { icon: 'electrical_services', title: 'Electrical Safety Audit', desc: 'Capacitor, PCB, and wiring load check.' },
      { icon: 'star_rate', title: 'Cooling Test', desc: 'Temperature drop verification post service.' },
    ],
  },
  'electrician': {
    title: 'Electrician & Safety Audit',
    icon: 'bolt',
    tagline: 'Certified electrician for wiring repairs, short circuits, switchboard fixes, and appliance installation.',
    duration: '45 mins',
    team: '1 Pro',
    heroImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    badges: ['Instant 30m', 'Safety First'],
    includes: [
      { icon: 'bolt', title: 'Wiring & Short Circuit', desc: 'Fault diagnosis, MCB tripping fix, and load balance.' },
      { icon: 'outlet', title: 'Switch & Socket Setup', desc: 'Modular switchboard installation and smart plug setup.' },
      { icon: 'light_mode', title: 'Lighting & Fan Mounts', desc: 'Ceiling fan, chandelier, and LED panel installation.' },
      { icon: 'shield', title: '30-Day Work Warranty', desc: 'Free re-visit if any electrical issue reoccurs.' },
    ],
  },
  'plumbing': {
    title: 'Plumbing & Pipe Fixes',
    icon: 'plumbing',
    tagline: 'Expert plumbing solutions for leaking taps, pipe installations, drain unblocking, and sanitary fittings.',
    duration: '1 hr',
    team: '1 Plumber',
    heroImg: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=1200&q=80',
    badges: ['Certified Plumber', 'Express Arrival'],
    includes: [
      { icon: 'water_drop', title: 'Tap & Leak Repair', desc: 'Fix dripping faucets, concealed pipe leaks, and flush valves.' },
      { icon: 'plumbing', title: 'Drain Unblocking', desc: 'Clearing clogged sinks, shower drains, and main lines.' },
      { icon: 'bathtub', title: 'Sanitary Fittings', desc: 'Basin, health faucet, shower head, and toilet installation.' },
      { icon: 'verified', title: 'Quality Parts', desc: 'Genuine brass and PVC fittings with manufacturer warranty.' },
    ],
  },
  'carpenter': {
    title: 'Carpentry & Furniture Repair',
    icon: 'carpenter',
    tagline: 'Master carpenters for door alignment, lock repair, custom wooden shelves, and bed assembly.',
    duration: '1-2 hrs',
    team: '1 Carpenter',
    heroImg: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    badges: ['Master Woodwork', 'Precision Fit'],
    includes: [
      { icon: 'lock', title: 'Door & Lock Fix', desc: 'Godrej lock installation, handle replacement, and hinge oiling.' },
      { icon: 'chair', title: 'Furniture Assembly', desc: 'IKEA/Nilkamal bed, wardrobe, and study table assembly.' },
      { icon: 'grid_view', title: 'Custom Shelving', desc: 'Precision wall mounting of wooden cabinets and racks.' },
    ],
  },
  'painting': {
    title: 'Interior & Exterior Painting',
    icon: 'format_paint',
    tagline: 'Dustless sanding, waterproof primer coating, and premium Asian Paints finish for your home.',
    duration: '2-4 days',
    team: '2-4 Painters',
    heroImg: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    badges: ['Waterproof Paint', 'Asian Paints'],
    includes: [
      { icon: 'brush', title: 'Dustless Wall Sanding', desc: 'Machine sanding for smooth, bump-free wall surface.' },
      { icon: 'format_paint', title: '2 Coat Premium Paint', desc: 'Washable emulsion paint in custom shade selection.' },
      { icon: 'shield', title: 'Furniture Covering', desc: 'Plastic sheet masking for floors, sofa, and TV unit.' },
    ],
  },
  'baby-sitting': {
    title: 'Baby Sitting & Child Care',
    icon: 'child_care',
    tagline: 'Police-verified, CPR-trained nannies for infant care, feeding, homework help, and active supervision.',
    duration: '4-8 hrs',
    team: '1 Nanny',
    heroImg: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80',
    badges: ['Vetted Nannies', 'CPR Trained'],
    includes: [
      { icon: 'child_care', title: 'Infant Supervision', desc: 'Diaper changing, bottle feeding, and nap routine management.' },
      { icon: 'sports_esports', title: 'Creative Playtime', desc: 'Reading stories, puzzle games, and cognitive engagement.' },
      { icon: 'verified', title: 'Background Checked', desc: 'Aadhaar, address, and criminal record verified nanny.' },
    ],
  },
  'elderly-care': {
    title: 'Elderly Care & Assistance',
    icon: 'elderly',
    tagline: 'Compassionate medical & daily living assistants for seniors. Mobility support and medication tracking.',
    duration: 'Full Day',
    team: '1 Caregiver',
    heroImg: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
    badges: ['Certified Nurse', 'Compassionate'],
    includes: [
      { icon: 'medication', title: 'Medication Management', desc: 'Timely dosage reminders, BP & sugar level recording.' },
      { icon: 'elderly', title: 'Mobility Support', desc: 'Assistance in walking, bathing, dressing, and outdoor strolls.' },
      { icon: 'favorite', title: 'Companionship', desc: 'Warm conversation, book reading, and emotional well-being.' },
    ],
  },
  'cook-chef': {
    title: 'Personal Cook / Chef',
    icon: 'restaurant',
    tagline: 'Hygenic, background-verified home cooks for North Indian, South Indian, or custom diet meals.',
    duration: '2 hrs / meal',
    team: '1 Chef',
    heroImg: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
    badges: ['Hygienic Cook', 'Custom Menu'],
    includes: [
      { icon: 'restaurant_menu', title: '3-Course Meal Preparation', desc: 'Roti, rice, dal, sabzi, and salad freshly prepared.' },
      { icon: 'soap', title: 'Kitchen Counter Cleanup', desc: 'Washing utensils used in cooking and wiping stove tops.' },
      { icon: 'local_dining', title: 'Dietary Customization', desc: 'Low-oil, Jain, or protein-rich meal customization.' },
    ],
  },
  'driver': {
    title: 'Personal Driver',
    icon: 'drive_eta',
    tagline: 'Experienced, licensed drivers for city commutes, office pickups, or safe outstation road trips.',
    duration: '8-12 hrs',
    team: '1 Driver',
    heroImg: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
    badges: ['Licensed Driver', 'Punctual'],
    includes: [
      { icon: 'minor_crash', title: 'Safe Driving Record', desc: 'Minimum 5 years clean driving record verified.' },
      { icon: 'navigation', title: 'GPS Route Navigation', desc: 'Punctual pickup and efficient traffic route management.' },
      { icon: 'car_rental', title: 'Manual & Automatic', desc: 'Skilled in driving luxury sedans, SUVs, and automatics.' },
    ],
  },
  'packers-movers': {
    title: 'Packers & Movers',
    icon: 'local_shipping',
    tagline: 'End-to-end home shifting with multi-layer bubble wrap, closed container trucks, and unloading.',
    duration: '1 Day',
    team: '4 Crew Members',
    heroImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    badges: ['Zero Damage', 'Insurance Cover'],
    includes: [
      { icon: 'inventory_2', title: 'Multi-layer Packing', desc: 'Bubble wrap, corrugated boxes, and stretch film for electronics.' },
      { icon: 'local_shipping', title: 'Covered Container Truck', desc: 'Waterproof enclosed transport truck with GPS tracking.' },
      { icon: 'unarchive', title: 'Unpacking & Placement', desc: 'Furniture re-assembly and room-wise box placement.' },
    ],
  },
  'gardening': {
    title: 'Garden Maintenance',
    icon: 'yard',
    tagline: 'Professional gardeners for plant trimming, lawn mowing, soil fertilization, and pest protection.',
    duration: '2 hrs',
    team: '1 Gardener',
    heroImg: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    badges: ['Organic Care', 'Green Thumb'],
    includes: [
      { icon: 'grass', title: 'Lawn Mowing & Pruning', desc: 'Trimming overgrown grass, hedges, and dead leaves.' },
      { icon: 'compost', title: 'Soil Nutrition & Manure', desc: 'Organic vermicompost and root nourishment application.' },
      { icon: 'water_drop', title: 'Potted Plant Care', desc: 'Repotting, pot cleaning, and drip setup advice.' },
    ],
  },
  'solar-installation': {
    title: 'Solar Panel Installation',
    icon: 'solar_power',
    tagline: 'Rooftop solar installation with grid net-metering and government PM Surya Ghar subsidy support.',
    duration: '2 Days',
    team: '3 Engineers',
    heroImg: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    badges: ['Govt. Subsidy', '25yr Panel Life'],
    includes: [
      { icon: 'solar_power', title: 'Tier-1 Mono PERC Panels', desc: 'High-efficiency solar panels with 25-year performance warranty.' },
      { icon: 'electrical_services', title: 'Grid Inverter & Meter', desc: 'Bi-directional net metering installation and DISCOM approval.' },
      { icon: 'savings', title: 'PM Surya Ghar Subsidy', desc: 'Complete paperwork and subsidy claim processing.' },
    ],
  },
  'beautician': {
    title: 'Beautician at Home',
    icon: 'face_retouching_natural',
    tagline: 'Doorstep salon services: O3+ facials, RICA waxing, threading, manicure, and pedicure by top beauticians.',
    duration: '1-2 hrs',
    team: '1 Beautician',
    heroImg: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    badges: ['Single-Use Kits', 'Top Salon Pro'],
    includes: [
      { icon: 'face', title: 'O3+ Brightening Facial', desc: 'Deep cleansing, gentle scrub, detox mask, and face glow massage.' },
      { icon: 'spa', title: 'RICA Liposoluble Waxing', desc: 'Painless hair removal using disposable wooden spatulas and strips.' },
      { icon: 'dry_cleaning', title: 'Sanitized Equipment', desc: 'Single-use aprons, towels, and sealed cosmetic products.' },
    ],
  },
  'womens-spa': {
    title: "Women's Spa at Home",
    icon: 'spa',
    tagline: 'Luxury full-body Swedish massage, aromatherapy, and hot candle spa therapy exclusively for women.',
    duration: '60-90 mins',
    team: '1 Female Therapist',
    heroImg: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    badges: ['Women Only', 'Essential Oils'],
    includes: [
      { icon: 'spa', title: 'Swedish De-stress Massage', desc: 'Rhythmic strokes with warm sesame and lavender essential oils.' },
      { icon: 'nature_people', title: 'Aromatherapy Session', desc: 'Calming diffuser aroma and soothing background music.' },
      { icon: 'sanitizer', title: 'Disposable Spa Bed Covers', desc: 'Hygienic single-use bed linen, towels, and massage shorts.' },
    ],
  },
  'mens-spa': {
    title: "Men's Spa & Grooming",
    icon: 'self_improvement',
    tagline: 'Deep tissue sports massage, head relaxation, facial cleanup, and beard styling for men at home.',
    duration: '60-90 mins',
    team: '1 Male Therapist',
    heroImg: 'https://images.unsplash.com/photo-1591019052241-e4d84ee73c4e?auto=format&fit=crop&w=1200&q=80',
    badges: ['Men Only', 'Deep Tissue'],
    includes: [
      { icon: 'fitness_center', title: 'Deep Tissue Muscle Release', desc: 'Targeted pressure on sore shoulders, lower back, and legs.' },
      { icon: 'face', title: 'Men Charcoal Detox Cleanup', desc: 'Pore unclogging, blackhead removal, and cooling mint mask.' },
      { icon: 'sanitizer', title: 'Hygienic Disposable Kit', desc: 'Sealed massage oils, fresh sheets, and sanitized tools.' },
    ],
  },
  'yoga-at-home': {
    title: 'Yoga & Wellness Instructor',
    icon: 'self_improvement',
    tagline: 'Personal certified yoga trainer for morning Asanas, Pranayama breathing, and stress relief sessions.',
    duration: '60 mins',
    team: '1 Trainer',
    heroImg: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=1200&q=80',
    badges: ['Certified Trainer', 'Personalized'],
    includes: [
      { icon: 'self_improvement', title: 'Custom Asana Routine', desc: 'Postural correction, flexibility exercises, and core strength.' },
      { icon: 'air', title: 'Pranayama & Meditation', desc: 'Breathing techniques for anxiety reduction and mental clarity.' },
      { icon: 'verified', title: 'Ayush Certified Guru', desc: 'Qualified trainer with 5+ years of personal teaching experience.' },
    ],
  },
};

const defaultMeta = {
  title: 'Professional Home Service',
  icon: 'home_repair_service',
  tagline: 'Professional service by verified experts. Quality guaranteed.',
  duration: '2 hrs',
  team: '1-2 Pros',
  heroImg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  badges: ['Verified'],
  includes: [
    { icon: 'verified', title: 'Professional Service', desc: 'Delivered by background-verified, trained professionals.' },
    { icon: 'shield', title: 'Ziva Protected', desc: 'Payment secured in escrow, released only after service completion.' },
  ],
};

export default function DynamicServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceSlug = (params?.serviceSlug as string) || 'home-cleaning';

  const [token, setToken] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  const [bookingStep, setBookingStep] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Noida');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderMock | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const timeSlots = ['09:00 AM', '12:00 PM', '03:00 PM', '06:00 PM'];

  const [publicProviders, setPublicProviders] = useState<any[]>([]);

  const mockProviders: ProviderMock[] = [
    { name: 'Rajesh Kumar', rating: 4.9, jobsCompleted: 342, distance: '1.2 km', bio: 'Experienced in deep cleaning, sanitization, and post-construction cleanup. Uses eco-friendly products.', avatar: 'RK' },
    { name: 'Sunita Sharma', rating: 4.8, jobsCompleted: 215, distance: '2.5 km', bio: 'Specializes in move-in/move-out deep cleaning and intensive kitchen degreasing. Highly rated for punctuality.', avatar: 'SS' },
    { name: 'Amit Patel', rating: 4.6, jobsCompleted: 98, distance: '3.1 km', bio: 'Efficient team for large apartments. Focuses on bathroom descaling and floor polishing.', avatar: 'AP' },
  ];

  const meta = serviceMetadata[serviceSlug] || defaultMeta;

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (accToken) setToken(accToken);
    fetchServices();
  }, [serviceSlug]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const [res, provRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/services?category=${serviceSlug}`),
        fetch(`${apiBase}/api/v1/services/providers/public?category=${serviceSlug}`),
      ]);
      const json = await res.json();
      if (res.ok) {
        const list = json.data || json || [];
        setServices(list);
      } else { fallbackMockData(); }

      if (provRes.ok) {
        const provJson = await provRes.json();
        setPublicProviders(provJson.data || provJson || []);
      }
    } catch { fallbackMockData(); }
    finally { setLoading(false); }
    const rawName = serviceSlug.replace(/-/g, ' ');
    setCategoryName(rawName.charAt(0).toUpperCase() + rawName.slice(1));
  };

  const fallbackMockData = () => {
    const baseStartingPrice = serviceBasePrices[serviceSlug] || 499;
    const metaTitle = serviceMetadata[serviceSlug]?.title || serviceSlug.replace(/-/g, ' ');
    setServices([
      { id: 'svc-essential', name: `Standard ${metaTitle}`, slug: `basic-${serviceSlug}`, basePrice: baseStartingPrice, description: 'Essential service package covering all core requirements.' },
      { id: 'svc-deep', name: `Premium ${metaTitle} (Deep Care)`, slug: `premium-${serviceSlug}`, basePrice: Math.round(baseStartingPrice * 1.6), description: 'Enhanced package with specialized treatment and 30-day warranty.' },
      { id: 'svc-move', name: `Complete ${metaTitle} & Safety Audit`, slug: `complete-${serviceSlug}`, basePrice: Math.round(baseStartingPrice * 2.4), description: 'Full top-to-bottom service with premium products and expert team.' },
    ]);
  };

  const handleSelectPackage = (id: string) => {
    const matched = services.find((s) => s.id === id);
    if (matched) { setSelectedService(matched); setBookingStep(1); }
  };

  const handleConfirmBooking = async () => {
    if (!token) { alert('Please login to complete your booking.'); router.push('/auth/login'); return; }
    if (!selectedService || !selectedDate || !selectedTimeSlot || !addressLine || !pincode) { alert('Please fill all booking details.'); return; }
    setSubmittingBooking(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const hourMap: Record<string, string> = { '09:00 AM': '09:00:00', '12:00 PM': '12:00:00', '03:00 PM': '15:00:00', '06:00 PM': '18:00:00' };
      const scheduledAt = new Date(`${selectedDate}T${hourMap[selectedTimeSlot] || '09:00:00'}.000Z`);
      const res = await fetch(`${apiBase}/api/v1/services/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceId: selectedService.id, scheduledAt: scheduledAt.toISOString(), address: addressLine, city, pincode, notes: `${notes}${selectedProvider ? ` | Provider: ${selectedProvider.name}` : ''}` }),
      });
      const json = await res.json();
      if (res.ok) { setConfirmedBooking(json.data || json); setBookingStep(5); }
      else { alert(json.message || 'Booking failed.'); }
    } catch { alert('Failed to connect. Please check your internet connection.'); }
    finally { setSubmittingBooking(false); }
  };

  const getNext7Days = () => {
    const dates: string[] = [];
    for (let i = 1; i <= 7; i++) { const d = new Date(); d.setDate(d.getDate() + i); dates.push(d.toISOString().split('T')[0] as string); }
    return dates;
  };

  const costBase = selectedService?.basePrice || 0;
  const costGst = Math.round(Number(costBase) * 0.18);
  const costShield = 99;
  const costTotal = Number(costBase) + costGst + costShield;
  const basePrice = services.length > 0 ? Math.min(...services.map(s => s.basePrice)) : (serviceBasePrices[serviceSlug] || 499);

  return (
    <div className="bg-gradient-to-b from-[#f8f6ff] via-[#f8f9fb] to-[#f4f2fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">

      {/* ── Top Navigation (Light) ── */}
      <header className="flex justify-between items-center w-full px-4 md:px-10 max-w-[1280px] mx-auto py-4 relative z-10 bg-white/80 backdrop-blur-md border-b border-[#eceef0] sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[#f2f4f6] hover:bg-[#e8ddff] text-[#191c1e] hover:text-[#5e23dc] flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="text-[18px] font-extrabold text-[#4500b4] leading-tight">Ziva Services</div>
            <div className="text-[11px] font-semibold text-[#7a7487] hidden sm:block">Doorstep Verified Home Solutions</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#e8faf4] text-[#16a373] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:flex items-center gap-1 border border-[#16a373]/20">
            <span className="material-symbols-outlined text-xs">verified_user</span> Ziva Protected
          </span>
          <button className="w-9 h-9 rounded-full bg-[#f2f4f6] hover:bg-[#eceef0] text-[#191c1e] flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Container (Wide Layout) ── */}
      <main className="flex-grow w-full max-w-[1240px] mx-auto px-4 md:px-8 py-6 pb-32">

        {/* ══ STEP 0: Service Detail Landing Page (Rich 2-Column Design) ══ */}
        {bookingStep === 0 && (
          <div className="space-y-8">
            {/* Hero Banner Section */}
            <div className="w-full rounded-3xl overflow-hidden shadow-xl border border-[#eceef0] bg-white relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#e8ddff] text-[#4500b4] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">bolt</span> Instant Booking
                    </span>
                    <span className="bg-[#e8faf4] text-[#16a373] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">star</span> 4.9 Rating (1.2k+ Booked)
                    </span>
                  </div>

                  <h1 className="text-[28px] sm:text-[36px] md:text-[42px] font-black text-[#191c1e] leading-tight tracking-tight">
                    {meta.title || categoryName || 'Deep Cleaning Service'}
                  </h1>

                  <p className="text-[14px] sm:text-[16px] text-[#494455] leading-relaxed font-normal">
                    {meta.tagline}
                  </p>

                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    {meta.badges.map((badge, i) => (
                      <span key={i} className="bg-[#f2f4f6] text-[#191c1e] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#cbc3d8]/40">
                        <span className="material-symbols-outlined text-[#5e23dc] text-sm">check_circle</span>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full relative overflow-hidden">
                  <img
                    src={meta.heroImg}
                    alt={meta.title || categoryName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white lg:via-transparent lg:to-transparent" />
                </div>
              </div>
            </div>

            {/* 2-Column Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column (Main Features & Packages) */}
              <div className="lg:col-span-8 space-y-8">

                {/* 3 Metric Stat Highlight Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-[#eceef0] p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-[#e8ddff] text-[#4500b4] flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                    <span className="text-[11px] text-[#7a7487] font-semibold uppercase tracking-wider">Est. Price</span>
                    <span className="text-[18px] sm:text-[22px] font-black text-[#4500b4] mt-0.5">₹{basePrice}+</span>
                  </div>

                  <div className="bg-white border border-[#eceef0] p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-[#e8ddff] text-[#4500b4] flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-[22px]">schedule</span>
                    </div>
                    <span className="text-[11px] text-[#7a7487] font-semibold uppercase tracking-wider">Duration</span>
                    <span className="text-[16px] sm:text-[20px] font-black text-[#191c1e] mt-0.5">{meta.duration}</span>
                  </div>

                  <div className="bg-white border border-[#eceef0] p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-[#e8ddff] text-[#4500b4] flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-[22px]">groups</span>
                    </div>
                    <span className="text-[11px] text-[#7a7487] font-semibold uppercase tracking-wider">Assigned Team</span>
                    <span className="text-[16px] sm:text-[20px] font-black text-[#191c1e] mt-0.5">{meta.team}</span>
                  </div>
                </div>

                {/* What's Included Grid */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eceef0] shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#191c1e]">What&apos;s Included</h2>
                      <p className="text-xs text-[#7a7487] mt-0.5">Standard service deliverables for every booking</p>
                    </div>
                    <span className="bg-[#e8ddff] text-[#4500b4] text-[11px] font-bold px-3 py-1 rounded-full">Guaranteed Quality</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {meta.includes.map((item, i) => (
                      <div key={i} className="bg-[#f8f9fb] p-5 rounded-2xl flex items-start gap-4 border border-[#eceef0] hover:border-[#5e23dc]/30 transition-all hover:bg-white hover:shadow-md group">
                        <div className="w-11 h-11 rounded-2xl bg-[#e8ddff] flex items-center justify-center shrink-0 group-hover:bg-[#5e23dc] transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[#4500b4] group-hover:text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#191c1e] mb-1">{item.title}</h3>
                          <p className="text-[12px] text-[#494455] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Service Packages */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eceef0] shadow-sm space-y-6">
                  <div className="border-b border-[#eceef0] pb-4">
                    <h2 className="text-[20px] font-extrabold text-[#191c1e]">Available Packages &amp; Pricing</h2>
                    <p className="text-xs text-[#7a7487] mt-0.5">Choose the service package that best fits your requirement</p>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#f2f4f6] rounded-2xl h-24 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {services.map((svc) => (
                        <div key={svc.id} className="bg-[#f8f9fb] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between border border-[#eceef0] hover:border-[#5e23dc] transition-all hover:bg-white hover:shadow-md gap-4">
                          <div className="space-y-1 max-w-md">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[16px] font-bold text-[#191c1e]">{svc.name}</h3>
                              <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">VERIFIED</span>
                            </div>
                            <p className="text-[12px] text-[#494455] leading-relaxed">{svc.description}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#eceef0]">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-[#7a7487] uppercase font-bold block">Starting</span>
                              <span className="text-[22px] font-black text-[#16a373]">₹{Number(svc.basePrice).toLocaleString('en-IN')}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectPackage(svc.id)}
                              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                            >
                              Book Package
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ziva Quality & Safety Checklist */}
                <div className="bg-gradient-to-r from-[#4500b4] to-[#5e23dc] text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                    <h3 className="text-lg font-bold">The Ziva Safety Assurance</h3>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed max-w-2xl">
                    Every service professional undergoes mandatory background verification (Aadhaar + Police record check) and is trained to maintain strict hygiene standards.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] font-bold">
                    <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#37e09b]">check_circle</span>
                      <span>Aadhaar Verified</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#37e09b]">check_circle</span>
                      <span>Background Checked</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#37e09b]">check_circle</span>
                      <span>Sanitized Tools</span>
                    </div>
                    <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#37e09b]">check_circle</span>
                      <span>Post-Pay Escrow</span>
                    </div>
                  </div>
                </div>

                {/* Customer Reviews Section */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eceef0] shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#191c1e]">Verified Customer Reviews</h2>
                      <p className="text-xs text-[#7a7487] mt-0.5">Real feedback from Ziva Housing users</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#e8faf4] text-[#16a373] px-3 py-1 rounded-full font-bold text-xs border border-[#16a373]/20">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span>4.8 / 5.0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f8f9fb] p-5 rounded-2xl border border-[#eceef0] space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#5e23dc] text-white flex items-center justify-center font-bold text-xs">SM</div>
                          <div>
                            <div className="text-xs font-bold text-[#191c1e]">Sarah M.</div>
                            <div className="text-[10px] text-[#7a7487]">Bangalore • Verified Booking</div>
                          </div>
                        </div>
                        <div className="flex text-[#16a373]">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#494455] italic leading-relaxed">
                        &ldquo;Punctual, professional, and very thorough. The electrician identified an underlying MCB fault that two local guys missed. Highly recommended!&rdquo;
                      </p>
                    </div>

                    <div className="bg-[#f8f9fb] p-5 rounded-2xl border border-[#eceef0] space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#4500b4] text-white flex items-center justify-center font-bold text-xs">AK</div>
                          <div>
                            <div className="text-xs font-bold text-[#191c1e]">Amit Kumar</div>
                            <div className="text-[10px] text-[#7a7487]">Noida • Verified Booking</div>
                          </div>
                        </div>
                        <div className="flex text-[#16a373]">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#494455] italic leading-relaxed">
                        &ldquo;Super smooth booking process. The partner arrived right on schedule and carried all safety gear. Pay after service feature gives complete peace of mind.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (Sticky Booking Sidebar) */}
              <div className="lg:col-span-4 space-y-6 sticky top-24">

                {/* Instant Booking Action Card */}
                <div className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-xl space-y-5">
                  <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#7a7487] uppercase tracking-wider block">Starting Price</span>
                      <span className="text-[28px] font-black text-[#191c1e]">₹{basePrice}</span>
                    </div>
                    <span className="bg-[#e8faf4] text-[#16a373] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                      Best Value
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-[#494455]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#16a373]">bolt</span>
                      <span className="font-semibold">⚡ Slot Availability: Today at 3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-[#5e23dc]">shield</span>
                      <span className="font-semibold">Covered under Ziva Protection</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (services.length > 0) {
                        setSelectedService(services[0] || null);
                        setBookingStep(1);
                      }
                    }}
                    className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    Select Package &amp; Book
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                  </button>

                  <p className="text-[10px] text-center text-[#7a7487] leading-normal font-medium">
                    Free cancellation up to 3 hours before arrival. No advance needed.
                  </p>
                </div>

                {/* Customer Support Card */}
                <div className="bg-[#e8ddff]/40 border border-[#5e23dc]/15 p-5 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2 text-[#4500b4]">
                    <span className="material-symbols-outlined text-xl">headset_mic</span>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">Need Custom Assistance?</h4>
                  </div>
                  <p className="text-[11px] text-[#494455] leading-normal">
                    Have large commercial requirements or specific queries? Speak to our home services manager.
                  </p>
                  <Link href="/support" className="text-xs font-bold text-[#5e23dc] hover:underline inline-flex items-center gap-1">
                    Contact 24/7 Support <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ══ STEP 1: Date & Time ══ */}
        {bookingStep === 1 && (
          <div className="mt-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start font-sans text-xs">
            {/* Left Main Card: Schedule Selectors */}
            <div className="md:col-span-2 bg-white border border-[#eceef0] p-6 rounded-2xl shadow-sm space-y-6">
              {/* Wizard Progress Tracker */}
              <div className="flex items-center justify-between mb-4 border-b border-[#f2f4f6] pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#5e23dc] text-white flex items-center justify-center text-[10px] font-bold">1</div>
                  <span className="text-[11px] font-bold text-[#5e23dc]">Schedule</span>
                </div>
                <div className="flex-1 h-[2px] bg-[#f2f4f6] mx-2" />
                <div className="flex items-center gap-1.5 opacity-55">
                  <div className="w-5 h-5 rounded-full bg-[#cbc3d8] text-[#494455] flex items-center justify-center text-[10px] font-bold">2</div>
                  <span className="text-[11px] font-bold text-[#494455]">Address</span>
                </div>
                <div className="flex-1 h-[2px] bg-[#f2f4f6] mx-2" />
                <div className="flex items-center gap-1.5 opacity-55">
                  <div className="w-5 h-5 rounded-full bg-[#cbc3d8] text-[#494455] flex items-center justify-center text-[10px] font-bold">3</div>
                  <span className="text-[11px] font-bold text-[#494455]">Provider</span>
                </div>
                <div className="flex-1 h-[2px] bg-[#f2f4f6] mx-2" />
                <div className="flex items-center gap-1.5 opacity-55">
                  <div className="w-5 h-5 rounded-full bg-[#cbc3d8] text-[#494455] flex items-center justify-center text-[10px] font-bold">4</div>
                  <span className="text-[11px] font-bold text-[#494455]">Payment</span>
                </div>
              </div>

              <div>
                <h3 className="text-[18px] font-bold text-[#191c1e]">Choose Date & Time Slot</h3>
                <p className="text-[13px] text-[#494455] mt-1">Select when you want our verified professional to arrive.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase block">Available Dates</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {getNext7Days().map((d) => {
                    const dateObj = new Date(d);
                    const weekday = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                    const dayNum = dateObj.toLocaleDateString('en-IN', { day: 'numeric' });
                    const isSelected = selectedDate === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#5e23dc] bg-[#e8ddff] text-[#4500b4] shadow-sm scale-[1.02] ring-1 ring-[#5e23dc]/30'
                            : 'border-[#cbc3d8] bg-white hover:border-[#5e23dc]/50 hover:bg-[#f2f4f6]/50 text-[#191c1e]'
                        }`}
                      >
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-[#5e23dc]' : 'text-[#7a7487]'}`}>{weekday}</span>
                        <span className="text-base font-extrabold leading-none mt-1.5">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase block">Time Slots</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#5e23dc] bg-[#e8ddff] text-[#4500b4] shadow-sm scale-[1.02] ring-1 ring-[#5e23dc]/30'
                            : 'border-[#cbc3d8] bg-white hover:border-[#5e23dc]/50 hover:bg-[#f2f4f6]/50 text-[#191c1e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-xs font-bold">{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#eceef0] pt-5">
                <button
                  type="button"
                  onClick={() => setBookingStep(0)}
                  className="flex-1 border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#494455] font-bold py-3 rounded-xl text-xs transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedDate || !selectedTimeSlot) {
                      alert('Select date & time.');
                      return;
                    }
                    setBookingStep(2);
                  }}
                  className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Right Sidebar Card: Guarantees & Summary */}
            <div className="space-y-4">
              {/* Booking Summary Box */}
              <div className="bg-[#e8ddff]/30 border border-[#5e23dc]/15 p-5 rounded-2xl space-y-3">
                <h4 className="text-[11px] font-extrabold text-[#4500b4] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Booking Information
                </h4>
                <p className="text-[12px] text-[#494455] leading-normal font-semibold">
                  You are scheduling a booking for <span className="font-bold text-[#4500b4]">{categoryName || 'Home'} Service</span>.
                </p>
                <ul className="space-y-2 text-[11px] text-[#494455] font-medium pt-1">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#16A373]">check_circle</span>
                    <span>Instant confirmation with verified partner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#16A373]">check_circle</span>
                    <span>Secure payment protection via escrow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#16A373]">check_circle</span>
                    <span>Free cancellation up to 3 hours before</span>
                  </li>
                </ul>
              </div>

              {/* Ziva Protection Banner */}
              <div className="bg-white border border-[#eceef0] p-5 rounded-2xl shadow-sm space-y-2.5">
                <h4 className="text-[11px] font-extrabold text-[#191c1e] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#16A373]">shield</span>
                  Ziva Guarantee
                </h4>
                <p className="text-[11px] text-[#7a7487] leading-relaxed">
                  Every service booking is covered under our ₹10,000 damage protection guarantee. Only certified & fully background-checked partners are assigned.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Address ══ */}
        {bookingStep === 2 && (
          <div className="mt-6 bg-white border border-[#eceef0] p-6 rounded-2xl shadow-sm space-y-6 max-w-lg mx-auto">
            <div>
              <h3 className="text-[18px] font-bold text-[#191c1e]">Step 2: Delivery Address</h3>
              <p className="text-[14px] text-[#494455] mt-1">Provide service delivery address details.</p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase">Street Address</label>
                <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Apartment name, tower, sector..."
                  className="h-11 bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-3 outline-none text-[14px] text-[#191c1e] focus:border-[#5e23dc] placeholder-[#7a7487]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase">City</label>
                  <input type="text" value={city} disabled className="h-11 bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-3 text-[14px] text-[#494455] font-semibold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase">Pincode</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="201301" maxLength={6}
                    className="h-11 bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg px-3 outline-none text-[14px] text-[#191c1e] focus:border-[#5e23dc] placeholder-[#7a7487]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] tracking-wider font-bold text-[#494455] uppercase">Special Instructions</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any entry instructions..."
                  className="p-3 bg-[#f2f4f6] border border-[#cbc3d8] rounded-lg outline-none text-[14px] text-[#191c1e] focus:border-[#5e23dc] h-16 resize-none placeholder-[#7a7487]" />
              </div>
            </div>
            <div className="flex gap-3 border-t border-[#eceef0] pt-4">
              <button onClick={() => setBookingStep(1)} className="flex-1 border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#494455] font-bold py-2.5 rounded-lg text-[14px] transition">Back</button>
              <button onClick={() => { if (!addressLine || !pincode) { alert('Complete address.'); return; } setBookingStep(3); }}
                className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 rounded-lg text-[14px] transition shadow-sm">Continue</button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Provider Selector (Light Mode with Booking Summary) ══ */}
        {bookingStep === 3 && (
          <div className="mt-6">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-[#eceef0] rounded-full mb-6">
              <div className="h-full bg-[#16a373] w-[75%] rounded-full" />
            </div>
            <h2 className="text-[24px] font-bold text-[#191c1e] mb-1">Select a Provider</h2>
            <p className="text-[14px] text-[#494455] mb-6">{categoryName} Service</p>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Provider List */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[#494455]">Showing {mockProviders.length} providers near you</span>
                  <select className="border border-[#cbc3d8] text-[12px] font-bold rounded-lg px-3 py-2 text-[#191c1e] outline-none">
                    <option>Sort by Rating</option>
                    <option>Sort by Distance</option>
                    <option>Sort by Price</option>
                  </select>
                </div>
                {(publicProviders.length > 0
                  ? publicProviders.map((p: any) => ({
                      name: `${p.user?.firstName || 'Verified'} ${p.user?.lastName || 'Pro'}`,
                      rating: p.rating || 4.9,
                      jobsCompleted: p.totalJobs || 120,
                      distance: '1.5 km',
                      bio: `Certified ${p.categoryName || 'Home Care'} professional. Fully verified on Ziva Housing.`,
                      avatar: p.user?.firstName?.[0] || 'V',
                      requiresBackgroundCheck: p.requiresBackgroundCheck,
                      backgroundCheckStatus: p.backgroundCheckStatus,
                    }))
                  : mockProviders.map((mp) => ({
                      ...mp,
                      requiresBackgroundCheck: true,
                      backgroundCheckStatus: 'PASSED',
                    }))
                ).map((prov) => (
                  <div
                    key={prov.name}
                    className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      selectedProvider?.name === prov.name ? 'border-[#5e23dc] shadow-md' : 'border-[#eceef0]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#e8ddff] flex items-center justify-center text-[#4500b4] font-bold text-lg shrink-0">
                        {prov.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[16px] font-bold text-[#191c1e]">{prov.name}</h4>
                              {/* ── MINT SHIELD-CHECKMARK TRUST BADGE FOR BACKGROUND CHECK ── */}
                              {prov.requiresBackgroundCheck && prov.backgroundCheckStatus === 'PASSED' && (
                                <span className="bg-[#e8faf4] text-[#16a373] border border-[#16a373]/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">shield</span>
                                  Background Check Completed
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] text-[#494455] flex items-center gap-2 mt-0.5">
                              <span className="text-[#16a373]">★ {prov.rating}</span>
                              · {prov.jobsCompleted} jobs completed
                              · {prov.distance} away
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[16px] font-bold text-[#191c1e]">₹{Number(costBase).toLocaleString('en-IN')}</div>
                            <div className="text-[11px] text-[#494455]">Estimated</div>
                          </div>
                        </div>
                        <p className="text-[13px] text-[#494455] mt-2 leading-relaxed">{prov.bio}</p>
                        <button
                          onClick={() => setSelectedProvider(prov)}
                          className={`mt-3 px-5 py-2 rounded-lg text-[13px] font-bold transition border ${
                            selectedProvider?.name === prov.name
                              ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                              : 'border-[#5e23dc] text-[#5e23dc] hover:bg-[#e8ddff]'
                          }`}
                        >
                          {selectedProvider?.name === prov.name ? 'Selected ✓' : 'Select Provider'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setBookingStep(2)} className="flex-1 border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#494455] font-bold py-2.5 rounded-lg text-[14px] transition">Back</button>
                  <button onClick={() => { if (!selectedProvider) { alert('Select a provider.'); return; } setBookingStep(4); }}
                    className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 rounded-lg text-[14px] transition shadow-sm">Continue</button>
                </div>
              </div>

              {/* Booking Summary Sidebar */}
              <div className="lg:w-72 shrink-0">
                <div className="bg-white border border-[#eceef0] rounded-2xl p-5 shadow-sm sticky top-6">
                  <h3 className="text-[16px] font-bold text-[#191c1e] mb-4">Booking Summary</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-[#494455]">Service</span><span className="font-bold text-[#191c1e]">{categoryName}</span></div>
                    <div className="flex justify-between"><span className="text-[#494455]">Date & Time</span><span className="font-bold text-[#191c1e]">{selectedDate}, {selectedTimeSlot}</span></div>
                    <div className="flex justify-between"><span className="text-[#494455]">Address</span><span className="font-bold text-[#191c1e] text-right max-w-[120px] truncate">{addressLine || '—'}</span></div>
                  </div>
                  <div className="border-t border-[#eceef0] mt-4 pt-4 space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-[#494455]">Base Price estimate</span><span className="font-semibold">₹{Number(costBase).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-[#494455]">Taxes & Fees</span><span className="font-semibold">₹{costGst}</span></div>
                  </div>
                  <div className="border-t border-[#eceef0] mt-3 pt-3 flex justify-between">
                    <span className="text-[15px] font-bold text-[#191c1e]">Total Est.</span>
                    <span className="text-[15px] font-bold text-[#4500b4]">₹{(Number(costBase) + costGst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-4 bg-[#f2f4f6] border border-[#eceef0] p-3 rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#494455] text-[18px]">shield</span>
                    <div>
                      <p className="text-[11px] font-bold text-[#191c1e]">Ziva Protected</p>
                      <p className="text-[11px] text-[#494455] leading-relaxed">Your payment is held securely until the job is completed to satisfaction.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Checkout ══ */}
        {bookingStep === 4 && selectedService && (
          <div className="mt-6 bg-white border border-[#eceef0] p-6 rounded-2xl shadow-sm space-y-6 max-w-md mx-auto">
            <div>
              <h3 className="text-[18px] font-bold text-[#191c1e]">Step 4: Booking Summary</h3>
              <p className="text-[14px] text-[#494455] mt-1">Review details and complete payment.</p>
            </div>
            <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#eceef0] space-y-2 text-[14px]">
              <div className="flex justify-between"><span className="text-[#494455]">Service:</span><span className="font-bold text-[#191c1e]">{selectedService.name}</span></div>
              <div className="flex justify-between"><span className="text-[#494455]">Date/Time:</span><span className="font-bold text-[#191c1e]">{selectedDate} at {selectedTimeSlot}</span></div>
              <div className="flex justify-between"><span className="text-[#494455]">Professional:</span><span className="font-bold text-[#16a373]">{selectedProvider?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#494455]">Address:</span><span className="font-bold text-[#191c1e] truncate max-w-[200px]">{addressLine}</span></div>
            </div>
            <div className="space-y-2 pt-2 border-b border-[#eceef0] pb-4 text-[14px]">
              <div className="flex justify-between text-[#494455]"><span>Base cost:</span><span>₹{Number(costBase).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-[#494455]"><span>GST (18%):</span><span>₹{costGst.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-[#494455]"><span>Ziva Shield:</span><span>₹{costShield}</span></div>
              <div className="flex justify-between font-bold text-[16px] text-[#191c1e] pt-2 border-t border-dashed border-[#cbc3d8]">
                <span>Total:</span><span>₹{costTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="bg-[#E8FAF4] border border-[#16a373]/20 p-3.5 rounded-xl flex items-start gap-2">
              <span className="material-symbols-outlined text-[#16a373] text-base">shield</span>
              <div>
                <span className="text-[11px] font-bold text-[#16a373] uppercase tracking-wider block">Ziva Protected</span>
                <p className="text-[12px] text-[#006c47] leading-normal">Funds secured in escrow, released upon OTP verification.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBookingStep(3)} className="flex-1 border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#494455] font-bold py-3 rounded-lg text-[14px] transition">Back</button>
              <button onClick={handleConfirmBooking} disabled={submittingBooking}
                className="flex-grow bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-lg text-[14px] transition disabled:opacity-50 shadow-md uppercase tracking-wider">
                {submittingBooking ? 'Booking...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 5: Booking Confirmed ══ */}
        {bookingStep === 5 && confirmedBooking && (
          <div className="mt-6 bg-white border border-[#eceef0] p-8 rounded-2xl shadow-sm space-y-6 max-w-md mx-auto text-center">
            <span className="material-symbols-outlined text-[#16a373] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <div>
              <h3 className="text-xl font-bold text-[#191c1e]">Booking Confirmed!</h3>
              <p className="text-[13px] text-[#494455] mt-1">Your service professional is scheduled to arrive.</p>
            </div>
            <div className="bg-[#f2f4f6] p-5 rounded-xl border border-[#eceef0] space-y-3 text-left text-xs text-[#191c1e]">
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#494455]">Booking Reference:</span>
                <span className="font-mono font-bold text-[#4500b4]">{confirmedBooking.bookingRef}</span>
              </div>
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#494455]">Service Booked:</span>
                <span className="font-semibold">{confirmedBooking.service?.name || selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#494455]">Amount Paid:</span>
                <span className="font-extrabold text-[#16a373]">₹{Number(confirmedBooking.totalAmount || costTotal).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button onClick={() => router.push('/dashboard/customer')}
                className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs transition shadow-md uppercase tracking-wider">
                View in My Bookings
              </button>
              <button onClick={() => { setBookingStep(0); setSelectedService(null); setSelectedDate(''); setSelectedTimeSlot(''); setAddressLine(''); setPincode(''); setNotes(''); setSelectedProvider(null); setConfirmedBooking(null); }}
                className="w-full bg-transparent border border-[#cbc3d8] hover:bg-[#f2f4f6] text-[#494455] font-bold py-3 rounded-xl text-xs transition">
                Book Another Service
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky Bottom CTA (Step 0 only) ── */}
      {bookingStep === 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#eceef0] p-4 px-4 md:px-10 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] z-50">
          <div className="max-w-[800px] mx-auto flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#494455]">Starting at</p>
              <p className="text-[24px] font-bold text-[#191c1e]">₹{basePrice}</p>
            </div>
            <button
              onClick={() => { if (services.length > 0) { setSelectedService(services[0] || null); setBookingStep(1); } }}
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-8 py-3 rounded-lg text-[16px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              Book Now
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
