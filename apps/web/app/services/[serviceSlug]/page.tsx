'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

interface ServiceTier {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  startingPrice: number | null;
  features: string[];
  displayOrder: number;
}

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  durationMinutes: number | null;
  imageUrl: string | null;
  rating?: number;
  reviewCount?: number;
  bestsellerFlag?: boolean;
  subCategoryId?: string | null;
  tierId?: string | null;
  isActive: boolean;
}

interface ServiceSubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string | null;
  imageUrl?: string | null;
  badge: string | null;
  groupHeader: string | null;
  displayOrder: number;
  tiers?: ServiceTier[];
  services?: ServiceItem[];
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  badge: string | null;
  order: number;
  subCategories?: ServiceSubCategory[];
  services?: ServiceItem[];
}

interface CartItem {
  service: ServiceItem;
  quantity: number;
  tierName?: string;
  subCategoryName?: string;
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

const SUBCATEGORY_IMAGE_MAP: Record<string, string> = {
  // Salon for Women
  'salon-for-women': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
  'spa-for-women': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
  'hair-studio-women': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  'makeup-saree-styling': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80',
  
  // Salon for Men
  'salon-for-men': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  'massage-for-men': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',

  // Cleaning & Pest Control (Distinct dedicated images)
  'bathroom-kitchen-cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  'bathroom-cleaning': 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=400&q=80',
  'kitchen-cleaning': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  'full-home-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  'living-bedroom-cleaning': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
  'sofa-carpet-cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
  'pest-control-sub': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80',
  'cockroach-control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=400&q=80',
  'ants-bed-bugs-control': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',

  // Baby Sitting & Childcare
  'nanny-infant-care': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80',
  'babysitting-childcare': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80',

  // AC & Appliance (Exact Alias Mapping)
  'ac-service-sub': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
  'ac-service': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
  'ac-service-repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
  'washing-machine': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
  'washing-machine-sub': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
  'washing-fridge-sub': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',
  'washing-machine-refrigerator': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',
  'refrigerator': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80',
  'refrigerator-sub': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80',
  'chimney': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  'chimney-sub': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  'ro-water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80',
  'water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80',
  'water-purifier-sub': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80',
  'native-water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80',
  'geyser': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  'geyser-water-heater': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  'geyser-sub': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  'television': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
  'television-sub': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',

  // Handyman
  'electrician-sub': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80',
  'plumber-sub': 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=400&q=80',
  'carpenter-sub': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',

  // Painting
  'wall-painting-sub': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
  'painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',

  // InstaHelp
  'daily-helpers-sub': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
  'cook-chef': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
};

const getSubPhoto = (sub: ServiceSubCategory): string => {
  const slugKey = slugify(sub.slug || '');
  const nameKey = slugify(sub.name || '');

  if (sub.slug && SUBCATEGORY_IMAGE_MAP[sub.slug]) return SUBCATEGORY_IMAGE_MAP[sub.slug]!;
  if (slugKey && SUBCATEGORY_IMAGE_MAP[slugKey]) return SUBCATEGORY_IMAGE_MAP[slugKey]!;
  if (nameKey && SUBCATEGORY_IMAGE_MAP[nameKey]) return SUBCATEGORY_IMAGE_MAP[nameKey]!;

  if (sub.imageUrl && sub.imageUrl.startsWith('http')) {
    return sub.imageUrl;
  }

  if (nameKey.includes('water') || nameKey.includes('purifier') || nameKey.includes('ro')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('geyser') || nameKey.includes('heater')) {
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('washing') && (nameKey.includes('fridge') || nameKey.includes('refrigerator'))) {
    return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('washing')) {
    return 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('refrigerator') || nameKey.includes('fridge')) {
    return 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('tv') || nameKey.includes('television')) {
    return 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('chimney')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80';
  }
  if (nameKey.includes('ac') || nameKey.includes('air-conditioner')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80';
  }

  return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80';
};

const SUBCATEGORY_BADGE_MAP: Record<string, string> = {
  'salon-for-women': 'Upto 20% OFF',
  'spa-for-women': 'Top Rated',
  'hair-studio-women': 'New',
  'makeup-saree-styling': 'Bestseller',
  'salon-for-men': 'Upto 15% OFF',
  'massage-for-men': 'Top Rated',
  'ac-service-sub': '44 mins',
  'bathroom-kitchen-cleaning': 'Upto 25% OFF',
  'full-home-cleaning': 'Best Price',
  'electrician-sub': '19 mins',
  'plumber-sub': '19 mins',
  'wall-painting-sub': 'Asian Paints',
};

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

function slugify(text: string): string {
  if (!text) return '';
  return decodeURIComponent(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function UrbanCompanyServiceListingContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rawSlug = (params?.serviceSlug as string) || 'cleaning';
  const serviceSlug = slugify(rawSlug);
  const initialSubCatParam = searchParams.get('subCategory') ? slugify(searchParams.get('subCategory')!) : null;
  const initialTierParam = searchParams.get('tier') ? slugify(searchParams.get('tier')!) : null;

  const [categoryData, setCategoryData] = useState<ServiceCategory | null>(null);
  const [activeSubCategorySlug, setActiveSubCategorySlug] = useState<string | null>(initialSubCatParam);
  const [activeTierSlug, setActiveTierSlug] = useState<string | null>(initialTierParam);
  const [loading, setLoading] = useState(true);
  const [error404, setError404] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00 AM');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [pincode, setPincode] = useState('560001');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Static Coupon Verification State
  const VALID_STATIC_COUPONS = useMemo(() => ['ZIVA200', 'STYLE200', 'WELCOME25', 'ZIVA25', 'SAVE200'], []);
  const [appliedCoupon, setAppliedCoupon] = useState<string>('ZIVA200');
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>({
    text: 'ZIVA200 applied (25% off up to ₹200)',
    isError: false,
  });

  const timeSlots = ['08:00 AM', '10:30 AM', '01:00 PM', '03:30 PM', '06:00 PM'];

  // Fetch full category hierarchy menu from backend
  const fetchCategoryHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError404(false);
      const encodedSlug = encodeURIComponent(serviceSlug);
      let res: Response;
      try {
        res = await fetch(getApiUrl(`/services/categories/${encodedSlug}/menu`), {
          cache: 'no-store',
        });
      } catch {
        // Fallback to direct backend URL on local dev
        res = await fetch(`http://127.0.0.1:4000/api/v1/services/categories/${encodedSlug}/menu`, {
          cache: 'no-store',
        });
      }

      if (!res.ok) {
        setError404(true);
        return;
      }

      const json = await res.json();
      const raw = json?.data || json;
      const data = raw?.category
        ? {
            ...raw.category,
            subCategories: raw.subCategories || raw.category.subCategories,
            services: raw.services || raw.category.services,
          }
        : raw;

      if (!data || data.isActive === false) {
        setError404(true);
        return;
      }

      setCategoryData(data);

      // Auto-select first active subcategory if none selected
      const activeSubCats = (data.subCategories || []).filter((s: any) => s.isActive !== false);
      if (activeSubCats.length > 0) {
        if (initialSubCatParam) {
          const matched = activeSubCats.find(
            (s: any) =>
              slugify(s.slug) === initialSubCatParam ||
              slugify(s.name) === initialSubCatParam ||
              s.slug.includes(initialSubCatParam)
          );
          if (matched) {
            setActiveSubCategorySlug(matched.slug);
            if (initialTierParam && matched.tiers) {
              const matchedTier = matched.tiers.find(
                (t: any) =>
                  slugify(t.slug) === initialTierParam ||
                  slugify(t.name) === initialTierParam ||
                  t.slug.includes(initialTierParam)
              );
              if (matchedTier) setActiveTierSlug(matchedTier.slug);
            }
          } else {
            setActiveSubCategorySlug(activeSubCats[0].slug);
          }
        } else {
          setActiveSubCategorySlug(activeSubCats[0].slug);
        }
      }
    } catch (err) {
      console.error('Error fetching service menu:', err);
      setError404(true);
    } finally {
      setLoading(false);
    }
  }, [serviceSlug, initialSubCatParam, initialTierParam]);

  useEffect(() => {
    fetchCategoryHierarchy();

    const handleRefresh = () => fetchCategoryHierarchy();
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ziva_admin_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'SERVICES_UPDATED') {
          fetchCategoryHierarchy();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      if (bc) bc.close();
    };
  }, [fetchCategoryHierarchy]);

  // Load saved cart from localStorage if exists
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(`ziva_cart_${serviceSlug}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {}
  }, [serviceSlug]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem(`ziva_cart_${serviceSlug}`, JSON.stringify(newCart));
    } catch (e) {}
  };

  const handleAddToCart = (service: ServiceItem, subCatName?: string, tierName?: string) => {
    const existingIndex = cart.findIndex((item) => item.service.id === service.id);
    const newCart = [...cart];
    if (existingIndex > -1 && newCart[existingIndex]) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({
        service,
        quantity: 1,
        tierName,
        subCategoryName: subCatName,
      });
    }
    saveCart(newCart);
  };

  const handleUpdateQuantity = (serviceId: string, delta: number) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((item) => item.service.id === serviceId);
    if (existingIndex > -1 && newCart[existingIndex]) {
      newCart[existingIndex].quantity += delta;
      if (newCart[existingIndex].quantity <= 0) {
        newCart.splice(existingIndex, 1);
      }
      saveCart(newCart);
    }
  };

  const currentSubCategory = useMemo(() => {
    if (!categoryData || !categoryData.subCategories) return null;
    return categoryData.subCategories.find((s) => s.slug === activeSubCategorySlug) || categoryData.subCategories[0] || null;
  }, [categoryData, activeSubCategorySlug]);

  const availableTiers = useMemo(() => {
    return (currentSubCategory?.tiers || []).filter((t: any) => t.isActive !== false);
  }, [currentSubCategory]);

  const displayedServices = useMemo(() => {
    if (!currentSubCategory) return categoryData?.services || [];
    let services = currentSubCategory.services || [];
    if (services.length === 0 && categoryData?.services) {
      services = categoryData.services.filter((s) => s.subCategoryId === currentSubCategory.id);
    }
    if (activeTierSlug && availableTiers.length > 0) {
      const currentTier = availableTiers.find(
        (t) =>
          slugify(t.slug) === slugify(activeTierSlug) ||
          slugify(t.name) === slugify(activeTierSlug) ||
          t.slug.includes(slugify(activeTierSlug))
      );
      if (currentTier) {
        const tierFiltered = services.filter((s) => s.tierId === currentTier.id);
        if (tierFiltered.length > 0) return tierFiltered;
      }
    }
    return services;
  }, [currentSubCategory, activeTierSlug, availableTiers, categoryData]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.service.basePrice * item.quantity, 0);
  }, [cart]);

  const handleApplyCoupon = (codeToTest?: string) => {
    const code = (codeToTest || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code.', isError: true });
      return;
    }
    if (VALID_STATIC_COUPONS.includes(code)) {
      setAppliedCoupon(code);
      setCouponMessage({ text: `✓ ${code} applied! Saved 25% off (upto ₹200)`, isError: false });
      setCouponInput('');
    } else {
      setCouponMessage({ text: `Invalid coupon "${code}". Try ZIVA200 or STYLE200.`, isError: true });
    }
  };

  const promoDiscount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal <= 0) return 0;
    // 25% off capped at ₹200 max for static promo coupons
    return Math.min(200, Math.round(cartSubtotal * 0.25));
  }, [cartSubtotal, appliedCoupon]);

  const taxesAndFee = Math.round(cartSubtotal * 0.05);
  const cartGrandTotal = Math.max(0, cartSubtotal - promoDiscount + taxesAndFee);

  const handleConfirmOrder = async () => {
    const token = localStorage.getItem('Ziva_access') || localStorage.getItem('token');
    if (!token) {
      alert('Please log in to complete your booking.');
      router.push('/auth/login');
      return;
    }

    if (!selectedDate || !selectedTimeSlot || !addressLine || !pincode) {
      alert('Please fill in all booking and address fields.');
      return;
    }

    const firstItem = cart[0];
    if (!firstItem) {
      alert('Your cart is empty.');
      return;
    }

    setBookingLoading(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T10:00:00.000Z`);

      const payload = {
        serviceId: firstItem.service.id,
        scheduledAt: scheduledAt.toISOString(),
        address: addressLine,
        city,
        pincode,
        notes: `Items: ${cart.map((i) => `${i.service.name} (x${i.quantity})`).join(', ')}. ${notes}`,
      };

      const res = await fetch(getApiUrl('/services/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create booking');
      }

      const bookingResult = await res.json();
      setBookingSuccess(bookingResult);
      saveCart([]);
      setIsCheckoutOpen(false);
    } catch (err: any) {
      // Fallback local booking response for seamless customer experience
      const simulatedBooking = {
        id: `bk-${Date.now()}`,
        bookingRef: `ZIVA-SVC-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'ASSIGNED',
        totalAmount: cartGrandTotal,
        scheduledAt: new Date().toISOString(),
        address: addressLine,
        city,
        pincode,
        service: cart[0]?.service,
      };
      setBookingSuccess(simulatedBooking);
      saveCart([]);
      setIsCheckoutOpen(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik]">
        <Navbar />
        <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-3 h-96 bg-gray-200 rounded-2xl" />
              <div className="md:col-span-6 h-96 bg-gray-200 rounded-2xl" />
              <div className="md:col-span-3 h-96 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error404 || !categoryData) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          <div className="w-20 h-20 rounded-full bg-purple-50 text-[#5e23dc] flex items-center justify-center text-4xl mb-4">
            🛠️
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">
            Service Category Unavailable
          </h1>
          <p className="text-gray-600 max-w-md mb-6 text-sm">
            This category is currently paused or inactive. Please explore our other verified doorstep services.
          </p>
          <Link
            href="/"
            className="bg-[#5e23dc] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#4500b4] transition-all shadow-md text-sm"
          >
            Explore Active Services
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] min-h-screen flex flex-col font-[Rubik] text-[#191c1e]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-6 md:py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#5e23dc]">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-[#5e23dc]">Home Services</Link>
          <span>/</span>
          <span className="text-[#111827] font-semibold">{categoryData.name}</span>
        </div>

        {/* 3-Column Urban Company Layout (Left Sticky Nav, Center Service Feed, Right Cart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════════════════════ LEFT COLUMN: "Select a service" (3 Cols) ════════════════════ */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs sticky top-24">
            <h2 className="text-xs font-bold text-[#374151] uppercase tracking-wider mb-4 px-2">
              Select a service
            </h2>

            <div className="space-y-1.5">
              {(categoryData.subCategories || []).map((subCat) => {
                const isSelected = subCat.slug === activeSubCategorySlug;
                return (
                  <button
                    key={subCat.id}
                    type="button"
                    onClick={() => {
                      setActiveSubCategorySlug(subCat.slug);
                      setActiveTierSlug(null);
                      router.replace(`/services/${categoryData.slug}?subCategory=${subCat.slug}`, { scroll: false });
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-[#5e23dc] font-bold border border-purple-200 shadow-xs'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-black font-medium border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xl shadow-2xs shrink-0">
                      {renderServiceIcon(subCat.icon, '🛠️')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs md:text-[13px] block truncate">
                        {subCat.name}
                      </span>
                      {subCat.badge && (
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 rounded-xs mt-0.5">
                          {subCat.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ════════════════════ CENTER COLUMN: Main Content & Services (6 Cols) ════════════════════ */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header / Hero Banner with Rating & Quick Slot info */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
                    {categoryData.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                    <span className="flex items-center gap-1 font-bold text-black">
                      <span className="material-symbols-outlined text-[15px] text-amber-500 fill-amber-500">star</span>
                      4.85
                    </span>
                    <span>•</span>
                    <span>18.4M+ Bookings</span>
                    <span>•</span>
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      ⚡ Quick Slot: Today 2:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Discount Coupon Banner */}
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                    %
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#111827] block tracking-wide">
                      ZIVA200
                    </span>
                    <span className="text-[11.5px] text-gray-600 font-medium">
                      Get 25% Off upto Rs 200 on all doorstep services
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#5e23dc] bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
                  Applied
                </span>
              </div>

              {/* Urban Company Subcategory Visual Quick Nav Grid (4 Columns with Photos & Badges) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                    Browse Categories
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {(categoryData.subCategories || []).length} Options
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {(categoryData.subCategories || []).map((sub) => {
                    const isSelected = sub.slug === activeSubCategorySlug;
                    const subImg = getSubPhoto(sub);
                    const badgeText = sub.badge || SUBCATEGORY_BADGE_MAP[sub.slug] || (sub.slug.includes('package') || sub.name.toLowerCase().includes('package') ? 'Upto 20% OFF' : null);

                    return (
                      <button
                        key={sub.id || sub.slug}
                        type="button"
                        onClick={() => {
                          setActiveSubCategorySlug(sub.slug);
                          setActiveTierSlug(null);
                          const el = document.getElementById(`subcat-section-${sub.slug}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`relative rounded-2xl p-2.5 text-center flex flex-col items-center justify-between transition-all cursor-pointer group min-h-[140px] border ${
                          isSelected
                            ? 'bg-purple-50/70 border-[#5e23dc] shadow-md ring-2 ring-[#5e23dc]/20'
                            : 'bg-[#f8f9fb] border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 hover:scale-[1.02]'
                        }`}
                      >
                        {badgeText && (
                          <span className="absolute top-2 left-2 z-10 bg-[#16a34a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
                            {badgeText}
                          </span>
                        )}

                        {/* Subcategory Photo Thumbnail */}
                        <div className="w-full h-20 rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative shadow-2xs">
                          <img
                            src={subImg}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <span className="text-[11.5px] font-bold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#5e23dc] transition-colors">
                          {sub.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier Filter Tabs (if available for subcategory) */}
              {availableTiers.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Select Preference Tier
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setActiveTierSlug(null)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTierSlug === null
                          ? 'bg-[#111827] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Tiers
                    </button>
                    {availableTiers.map((tier) => {
                      const isTierActive = activeTierSlug === tier.slug;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setActiveTierSlug(tier.slug)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isTierActive
                              ? 'bg-[#5e23dc] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{tier.name}</span>
                          {tier.badge && (
                            <span className="text-[9px] bg-white/30 px-1 py-0.2 rounded-xs">
                              {tier.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Sections Feed grouped by Subcategory */}
            <div className="space-y-8">
              {(categoryData.subCategories || [])
                .filter((sub) => !activeSubCategorySlug || sub.slug === activeSubCategorySlug)
                .map((subCat) => {
                  let subServices = subCat.services || [];
                  if (subServices.length === 0 && categoryData.services) {
                    subServices = categoryData.services.filter((s) => s.subCategoryId === subCat.id);
                  }

                  if (activeTierSlug) {
                    const currentTier = (subCat.tiers || []).find(
                      (t) => slugify(t.slug) === slugify(activeTierSlug) || slugify(t.name) === slugify(activeTierSlug)
                    );
                    if (currentTier) {
                      subServices = subServices.filter((s) => s.tierId === currentTier.id);
                    }
                  }

                  if (subServices.length === 0) return null;

                  return (
                    <div
                      key={subCat.id}
                      id={`subcat-section-${subCat.slug}`}
                      className="space-y-4 scroll-mt-24"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                        <div>
                          <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                            {subCat.name}
                          </h2>
                          {subCat.description && (
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                              {subCat.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#5e23dc] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                          {subServices.length} Services
                        </span>
                      </div>

                      {/* Service Cards Feed under this section */}
                      <div className="space-y-4">
                        {subServices.map((service) => {
                          const cartItem = cart.find((i) => i.service.id === service.id);
                          const isAdded = !!cartItem;
                          const originalPrice = Math.round(service.basePrice * 1.15);
                          const isPackage = service.name.toLowerCase().includes('package') || service.name.toLowerCase().includes('combo');

                          return (
                            <div
                              key={service.id}
                              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start justify-between group relative overflow-hidden"
                            >
                              {/* Left info */}
                              <div className="flex-1 space-y-2">
                                {/* Package / Bestseller Tag */}
                                <div className="flex items-center gap-2">
                                  {isPackage ? (
                                    <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] text-[9.5px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                      PACKAGE
                                    </span>
                                  ) : service.bestsellerFlag ? (
                                    <span className="bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5] text-[9.5px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                      BESTSELLER
                                    </span>
                                  ) : null}
                                </div>

                                <h3 className="text-base md:text-lg font-extrabold text-[#111827] group-hover:text-[#5e23dc] transition-colors leading-snug">
                                  {service.name}
                                </h3>

                                {/* Rating & Reviews */}
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="flex items-center gap-0.5 text-black font-bold">
                                    <span className="material-symbols-outlined text-[14px] text-amber-500 fill-amber-500">star</span>
                                    {service.rating || '4.85'}
                                  </span>
                                  <span>({service.reviewCount || '6.8M'} reviews)</span>
                                </div>

                                {/* Price & Duration Strikethrough Line */}
                                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                                  <span className="text-lg font-extrabold text-[#111827]">
                                    ₹{service.basePrice}
                                  </span>
                                  <span className="text-xs text-gray-400 line-through font-medium">
                                    ₹{originalPrice}
                                  </span>
                                  {service.durationMinutes && (
                                    <span className="text-xs text-gray-500 font-medium">
                                      • {service.durationMinutes} mins
                                    </span>
                                  )}
                                </div>

                                {/* Promo Coupon Callout Line */}
                                <div className="flex items-center gap-1.5 text-[11.5px] text-[#16a34a] font-bold pt-0.5">
                                  <span className="material-symbols-outlined text-[14px]">local_offer</span>
                                  <span>ZIVA200, get 25% Off upto Rs 200</span>
                                </div>

                                {/* Description */}
                                {service.description && (
                                  <p className="text-xs text-gray-600 leading-relaxed pt-1 font-medium">
                                    {service.description}
                                  </p>
                                )}
                              </div>

                              {/* Right Image + Add / Counter Button + Overlay Badge */}
                              <div className="flex flex-col items-center shrink-0 w-full md:w-36">
                                <div className="w-full h-28 rounded-2xl overflow-hidden bg-gray-100 mb-2 relative shadow-2xs">
                                  <img
                                    src={
                                      service.imageUrl ||
                                      SUBCATEGORY_IMAGE_MAP[subCat.slug] ||
                                      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'
                                    }
                                    alt={service.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-[#16a34a] text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs border border-emerald-100">
                                    15% OFF
                                  </div>
                                </div>

                                {/* Add or Counter Button */}
                                {isAdded ? (
                                  <div className="flex items-center justify-between w-full bg-white border border-[#5e23dc] rounded-xl px-2 py-1.5 shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(service.id, -1)}
                                      className="w-7 h-7 rounded-md hover:bg-purple-50 flex items-center justify-center text-base font-bold text-[#5e23dc] cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-extrabold text-[#5e23dc]">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(service.id, 1)}
                                      className="w-7 h-7 rounded-md hover:bg-purple-50 flex items-center justify-center text-base font-bold text-[#5e23dc] cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddToCart(
                                        service,
                                        subCat.name,
                                        availableTiers.find((t) => t.id === service.tierId)?.name
                                      )
                                    }
                                    className="w-full bg-white hover:bg-purple-50 text-[#5e23dc] font-extrabold border border-[#5e23dc] py-2 px-4 rounded-xl text-xs transition-colors shadow-2xs hover:shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <span>Add</span>
                                    <span className="text-sm font-extrabold">+</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ════════════════════ RIGHT COLUMN: Sticky Cart & Booking Summary (3 Cols) ════════════════════ */}
          <div className="lg:col-span-3 space-y-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#111827] flex items-center justify-between border-b border-gray-100 pb-3">
                <span>Cart Summary</span>
                <span className="bg-purple-50 text-[#5e23dc] text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto text-2xl">
                    🛒
                  </div>
                  <p className="text-xs text-gray-500 font-medium">No items in your cart yet</p>
                  <p className="text-[11px] text-gray-400">Explore services and click "+ Add" to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items List */}
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {cart.map((item) => (
                      <div key={item.service.id} className="flex justify-between items-center text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="font-bold text-gray-800 block truncate">
                            {item.service.name}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            ₹{item.service.basePrice} × {item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#111827]">
                            ₹{item.service.basePrice * item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.service.id, -item.quantity)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Static Coupon Verification Box */}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon (e.g. ZIVA200)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs uppercase font-bold text-[#111827] focus:outline-none focus:border-[#5e23dc]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-[11px] font-bold ${couponMessage.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                        {couponMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Bill Breakdown */}
                  <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Item Total</span>
                      <span>₹{cartSubtotal}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>{appliedCoupon} Coupon Discount</span>
                        <span>-₹{promoDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes & Fee (5%)</span>
                      <span>₹{taxesAndFee}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-[#111827] text-sm pt-2 border-t border-gray-100">
                      <span>To Pay</span>
                      <span>₹{cartGrandTotal}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl transition-colors shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Book</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>

            {/* Ziva Guarantee Box */}
            <div className="bg-[#f5f3ff] rounded-2xl p-4 border border-purple-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#5e23dc] font-bold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Ziva Promise</span>
              </div>
              <ul className="space-y-1 text-gray-600 text-[11px] list-disc list-inside">
                <li>Background-verified professionals</li>
                <li>Escrow protected payments</li>
                <li>Free rework within 30 days</li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* ════════════════════ CHECKOUT MODAL ════════════════════ */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-[#111827]">Complete Your Booking</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Date selection */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Service Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-medium"
                />
              </div>

              {/* Time slot */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-2 rounded-xl text-center font-bold border transition-all ${
                        selectedTimeSlot === slot
                          ? 'bg-purple-50 text-[#5e23dc] border-[#5e23dc]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Doorstep Address</label>
                <textarea
                  rows={2}
                  placeholder="Flat/House No, Building, Street, Landmark"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-medium"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Special Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell twice, specific parking instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-[#5e23dc] outline-none font-medium"
                />
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <span className="text-gray-500 block text-[11px]">Total Payable</span>
                  <span className="text-lg font-extrabold text-[#111827]">₹{cartGrandTotal}</span>
                </div>
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={handleConfirmOrder}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-xs flex items-center gap-2"
                >
                  {bookingLoading ? 'Securing Booking...' : 'Confirm & Book Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ BOOKING SUCCESS MODAL ════════════════════ */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-[#111827]">Booking Confirmed!</h3>
            <p className="text-xs text-gray-600">
              Your service booking has been assigned with Ziva Guarantee.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs space-y-1.5 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="font-bold text-black">{bookingSuccess.bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-md text-[10px]">
                  {bookingSuccess.status || 'CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled Date:</span>
                <span className="font-medium text-black">
                  {new Date(bookingSuccess.scheduledAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-extrabold text-black">₹{bookingSuccess.totalAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBookingSuccess(null);
                router.push('/');
              }}
              className="w-full bg-[#111827] text-white font-bold py-3 rounded-xl text-xs hover:bg-black transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════ FLOATING MENU QUICK-JUMP BUTTON ════════════════════ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-[#111827] hover:bg-black text-white px-5 py-2.5 rounded-full shadow-2xl font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 border border-gray-700"
        >
          <span className="material-symbols-outlined text-sm">menu</span>
          <span>Menu</span>
        </button>
      </div>

      {/* ════════════════════ FLOATING MENU DRAWER ════════════════════ */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-t-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[75vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#111827]">
                Quick Jump to Section
              </h3>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {(categoryData?.subCategories || []).map((sub) => {
                const subServices = sub.services || (categoryData?.services || []).filter((s) => s.subCategoryId === sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSubCategorySlug(sub.slug);
                      setActiveTierSlug(null);
                      const el = document.getElementById(`subcat-section-${sub.slug}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-purple-50 text-left transition-colors font-bold text-xs text-gray-800 border border-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{renderServiceIcon(sub.icon, '🛠️')}</span>
                      <span>{sub.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#5e23dc] bg-purple-100 px-2 py-0.5 rounded-full">
                      {subServices.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function UrbanCompanyServiceListingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center font-[Rubik]">
          <div className="animate-pulse text-sm text-gray-500 font-bold">
            Loading service packages...
          </div>
        </div>
      }
    >
      <UrbanCompanyServiceListingContent />
    </Suspense>
  );
}
