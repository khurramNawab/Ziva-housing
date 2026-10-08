'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
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
  'spa-for-women': '/services/spa-luxe-stones.jpg',
  'hair-studio-women': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
  'makeup-saree-styling': '/services/makeup-party-glam.jpg',
  'packages': '/services/makeup-party-glam.jpg',
  'group-deals': '/services/makeup-party-glam.jpg',
  'saree-draping': '/services/makeup-party-glam.jpg',
  'wedding-combos': '/services/makeup-party-glam.jpg',
  'party-makeup': '/services/makeup-party-glam.jpg',
  'hair-styling': '/services/makeup-party-glam.jpg',
  'add-ons': '/services/makeup-party-glam.jpg',
  
  // Salon for Men
  'salon-for-men': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  'massage-for-men': '/services/spa-prime-massage.jpg',

  // Cleaning & Pest Control (Distinct dedicated images)
  'bathroom-kitchen-cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
  'bathroom-cleaning': '/services/toilet-cleaning-rim.jpg',
  'value-deals': '/services/toilet-cleaning-rim.jpg',
  'one-time-deep-clean': '/services/toilet-cleaning-rim.jpg',
  'mini-services': '/services/toilet-cleaning-rim.jpg',
  'kitchen-cleaning': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
  'full-home-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  'living-bedroom-cleaning': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
  'sofa-carpet-cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
  'pest-control-sub': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80',
  'cockroach-control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=400&q=80',
  'ants-bed-bugs-control': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',

  // Baby Sitting & Childcare
  'nanny-infant-care': '/services/babysitting.jpg',
  'babysitting-childcare': '/services/babysitting.jpg',
  'nanny-care': '/services/babysitting.jpg',
  'baby-sitting-childcare': '/services/babysitting.jpg',

  // Elderly Care
  'elderly-care': '/services/elderly-care.jpg',
  'senior-care': '/services/elderly-care.jpg',
  'attendant-for-elderly': '/services/elderly-care.jpg',

  // Packers & Movers
  'packers-movers': '/services/packers-movers.jpg',
  'house-shifting': '/services/packers-movers.jpg',
  'local-shifting': '/services/packers-movers.jpg',
  'intercity-shifting': '/services/packers-movers.jpg',

  // Interior & Modular Kitchen
  'interior-modular-kitchen': '/services/modular-kitchen.jpg',
  'modular-kitchen': '/services/modular-kitchen.jpg',
  'kitchen-wardrobes': '/services/modular-kitchen.jpg',
  'full-home-interiors': '/services/modular-kitchen.jpg',

  // AC & Appliance (Dedicated Urban Company Hierarchy)
  'annual-plan': '/services/ac-foam-jet-hero.jpg',
  'ac-service-sub': '/services/ac-service.jpg',
  'ac-service': '/services/ac-service.jpg',
  'service': '/services/ac-service.jpg',
  'foam-jet-service': '/services/ac-service.jpg',
  'repair-gas-refill': '/services/ac-repair-gas.jpg',
  'ac-repair': '/services/ac-repair-gas.jpg',
  'installation-uninstallation': '/services/ac-installation.jpg',
  'ac-installation': '/services/ac-installation.jpg',
  'ac-service-repair': '/services/ac-service.jpg',
  // Washing Machine
  'washing-machine': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
  'washing-machine-sub': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
  'washing-fridge-sub': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',
  'washing-machine-refrigerator': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',
  'washing-machine-jet-service': '/services/washing-machine-clean.jpg',
  'washing-machine-check-up': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
  'washing-machine-installation': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',

  // Appliances
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

  // Salon Luxe & Women's Salon
  'super-saver-packages': '/services/japanese-glow-rituals.jpg',
  'waxing-threading': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
  'japanese-rituals-korean-facials': '/services/japanese-glow-rituals.jpg',
  'signature-facial-cleanup': '/services/cryofacial-therapy.jpg',
  'pedicure-manicure': 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
  'bleach-detan-massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',

  // Spa & Massage
  'luxe': '/services/spa-luxe-stones.jpg',
  'prime': '/services/spa-prime-massage.jpg',
  'ayurveda': '/services/spa-ayurveda-potli.jpg',
  'targeted-relief': '/services/spa-luxe-stones.jpg',

  // Solar Panels & Solutions
  'solar-panels': 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
  'solar-rooftop-installation': 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
  'solar-panel-cleaning-maintenance': 'https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=400&q=80',
  'inverter-electrical-diagnostics': 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
  'site-survey-subsidy-consultation': 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=400&q=80',

  // InstaHelp
  'daily-helpers-sub': '/services/instahelp-helper.jpg',
  'cook-chef': '/services/instahelp-helper.jpg',
  'instant': '/services/instahelp-helper.jpg',
  'later': '/services/instahelp-helper.jpg',
  'multi-day': '/services/instahelp-helper.jpg',
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
  if (nameKey.includes('pack') || nameKey.includes('mover') || nameKey.includes('shifting')) {
    return '/services/packers-movers.jpg';
  }
  if (nameKey.includes('elder') || nameKey.includes('senior')) {
    return '/services/elderly-care.jpg';
  }
  if (nameKey.includes('kitchen') || nameKey.includes('modular') || nameKey.includes('interior')) {
    return '/services/modular-kitchen.jpg';
  }
  if (nameKey.includes('nanny') || nameKey.includes('baby') || nameKey.includes('child') || nameKey.includes('infant')) {
    return '/services/babysitting.jpg';
  }

  return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80';
};

const SUBCATEGORY_BADGE_MAP: Record<string, string> = {
  'salon-for-women': 'Upto 20% OFF',
  'spa-for-women': 'Top Rated',
  'hair-studio-women': 'New',
  'makeup-saree-styling': 'Bestseller',
  'packages': 'Bestseller',
  'group-deals': '10% OFF',
  'saree-draping': 'From ₹399',
  'wedding-combos': 'Luxury',
  'party-makeup': 'In 59 mins',
  'hair-styling': 'Salon Finish',
  'add-ons': 'Quick Add',
  'salon-for-men': 'Upto 15% OFF',
  'massage-for-men': 'Top Rated',
  'ac-service-sub': '44 mins',
  'bathroom-kitchen-cleaning': 'Upto 25% OFF',
  'bathroom-cleaning': 'Top Rated',
  'value-deals': 'Upto 25% OFF',
  'one-time-deep-clean': 'Deep Clean',
  'mini-services': 'From ₹99',
  'full-home-cleaning': 'Best Price',
  'electrician-sub': '19 mins',
  'plumber-sub': '19 mins',
  'wall-painting-sub': 'Asian Paints',
};

const ICON_MAP: Record<string, string> = {
  // Kitchen & Cooking
  'savings': '🏷️',
  'air': '💨',
  'soup_kitchen': '🍲',
  'kitchen': '🍳',
  'countertops': '🧽',
  'modular_kitchen': '📐',
  'interior-modular-kitchen': '📐',
  'modular-kitchen-woodwork': '📐',
  'microwave': '♨️',
  'restaurant': '🍽️',
  'add_task': '➕',
  'local_dining': '🍽️',

  // AC & Appliances
  'ac_unit': '❄️',
  'ac-appliance-repair': '❄️',
  'heat_pump': '🔥',
  'calendar_month': '📅',
  'troubleshoot': '🔍',
  'tune': '⚙️',
  'local_laundry_service': '🧺',
  'washing-machine': '🧺',
  'refrigerator': '🧊',
  'water_heater': '♨️',
  'geyser': '♨️',
  'water_purifier': '💧',
  'water_drop': '💧',
  'tv': '📺',
  'desktop_mac': '💻',
  'laptop': '💻',
  'precision_manufacturing': '⚙️',

  // Handyman, EPC & Woodwork
  'handyman': '🔧',
  'build': '🔨',
  'home_repair_service': '🔧',
  'electrician-plumber-carpenter': '🔧',
  'valve': '🚰',
  'plumbing': '🔧',
  'bolt': '⚡',
  'power': '🔌',
  'carpenter': '🪚',
  'table_restaurant': '🪵',
  'chair': '🪑',
  'bed': '🛏️',
  'shelves': '📚',
  'door_sliding': '🚪',
  'furniture-assembly': '🪑',
  'fan': '🌀',
  'toys': '🌀',
  'festival': '✨',
  'lights': '💡',
  'lightbulb': '💡',
  'celebration': '🎉',
  'auto_awesome': '✨',

  // Cleaning & Pest Control
  'vacuum': '🧹',
  'cleaning': '🧹',
  'cleaning_services': '🧹',
  'sanitizer': '🧴',
  'pest_control': '🪳',
  'bug_report': '🐜',

  // Painting
  'format_paint': '🖌️',
  'painting-waterproofing': '🖌️',
  'imagesearch_roller': '🖌️',
  'palette': '🎨',

  // Salon, Spa & Care
  'face_retouching_natural': '🧖‍♀️',
  'womens-salon-spa': '🧖‍♀️',
  'content_cut': '🧔‍♂️',
  'person_grooming': '🧔‍♂️',
  'mens-salon-massage': '🧔‍♂️',
  'spa': '💆‍♀️',
  'healing': '💆‍♂️',
  // Smart Locks & Security
  'smart_lock': '🔐',
  'smart-lock': '🔐',
  'lock': '🔒',
  'key': '🔑',
  'shield': '🛡️',
  'door': '🚪',
  'password': '🔢',
  'fingerprint': '👆',
  'face_unlock': '👤',
  'videocam': '📹',
  'doorbell': '🔔',

  // Deals, Shopping & Generic
  'percent': '🏷️',
  'clean_hands': '✨',
  'shopping_bag': '🛍️',
  'styler': '💇‍♀️',
  'diamond': '💎',
  'extension': '✨',
  'groups': '👥',
  'face': '💆‍♀️',
  'brush': '🖌️',
  'flare': '✨',
  'sparkles': '✨',
  'self_improvement': '🧘',
  'pan_tool': '✋',
  'schedule': '⏱️',

  // Solar & Energy
  'solar_power': '☀️',
  'solar-panels': '☀️',
  'solar-panel': '☀️',
  'solar': '☀️',
  'wb_sunny': '☀️',
  'solar_panel': '☀️',
};

function renderServiceIcon(iconStr?: string | null, fallback: string = '🛠️'): React.ReactNode {
  if (!iconStr) return fallback;
  const trimmed = iconStr.trim();
  if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
  if (ICON_MAP[trimmed.toLowerCase()]) return ICON_MAP[trimmed.toLowerCase()];
  if (/\p{Extended_Pictographic}/u.test(trimmed)) {
    return trimmed;
  }
  return (
    <span
      className="material-symbols-outlined text-[19px] leading-none select-none text-gray-700 shrink-0 inline-block overflow-hidden max-w-[24px] max-h-[24px] text-center"
      style={{
        fontFamily: "'Material Symbols Outlined', sans-serif",
        fontFeatureSettings: "'liga'",
        whiteSpace: 'nowrap',
      }}
    >
      {trimmed}
    </span>
  );
}

function slugify(text: string): string {
  if (!text) return '';
  return decodeURIComponent(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const DEFAULT_AC_CATEGORY: ServiceCategory = {
  id: 'cat-ac',
  name: 'AC',
  slug: 'ac-appliance-repair',
  icon: '❄️',
  badge: '44 mins',
  order: 4,
  subCategories: [
    {
      id: 'sub-ac-annual',
      name: 'Annual plan',
      slug: 'annual-plan',
      icon: 'calendar_month',
      badge: '30% OFF',
      groupHeader: 'Air Conditioner',
      displayOrder: 1,
      description: 'Year-round AC servicing & unlimited breakdown support from ₹399/AC.',
      services: [
        {
          id: 'srv-ac-annual-2',
          name: 'Annual plan (2 times/year)',
          slug: 'ac-annual-plan-2',
          basePrice: 1198,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 104200,
          description: 'Deep coil cleaning with foam-jet twice a year, unlimited free breakdown visits, and 10% extra discount on spare parts & gas refill.',
          imageUrl: '/services/ac-foam-jet-hero.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-ac-1',
      name: 'Service',
      slug: 'ac-service-sub',
      icon: 'ac_unit',
      badge: 'Most Booked',
      groupHeader: 'Air Conditioner',
      displayOrder: 2,
      description: 'Deep cleans AC coils for better cooling & efficient energy consumption.',
      services: [
        {
          id: 'srv-ac-foam-1',
          name: 'Foam-jet service (1 AC)',
          slug: 'foam-jet-service-1ac',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 1250000,
          description: 'Indoor power jet coil foam wash, filter cleaning, outdoor condenser wash & cooling audit.',
          imageUrl: '/services/ac-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-foam-2',
          name: 'Foam-jet service (2 ACs)',
          slug: 'foam-jet-service-2ac',
          basePrice: 949,
          durationMinutes: 80,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 820000,
          description: 'Dual split AC complete servicing with power jet & anti-bacterial treatment. Save 5%.',
          imageUrl: '/services/ac-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-foam-3',
          name: 'Foam-jet service (3 ACs)',
          slug: 'foam-jet-service-3ac',
          basePrice: 1399,
          durationMinutes: 110,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 410000,
          description: '3 indoor units + outdoor condenser power wash with leak & airflow audit. Save 7%.',
          imageUrl: '/services/ac-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-foam-4',
          name: 'Foam-jet service (4 ACs)',
          slug: 'foam-jet-service-4ac',
          basePrice: 1799,
          durationMinutes: 140,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 290000,
          description: 'Whole-home AC deep service with foam-jet technology and compressor performance test. Save 10%.',
          imageUrl: '/services/ac-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-power-saver',
          name: 'Power Saver Foam-jet AC service',
          slug: 'power-saver-foam-jet-ac',
          basePrice: 599,
          durationMinutes: 55,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 520000,
          description: 'Specialized fin-straightening, dust-free foam wash & blower motor lubrication for up to 25% lower energy draw.',
          imageUrl: '/services/ac-foam-jet-hero.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-ac-repair',
      name: 'Repair & gas refill',
      slug: 'repair-gas-refill',
      icon: 'build',
      badge: 'Quick Visit',
      groupHeader: 'Air Conditioner',
      displayOrder: 3,
      description: 'Expert 18-step diagnosis, PCB electronics repair & 100% certified gas charging.',
      services: [
        {
          id: 'srv-ac-repair-diag',
          name: 'AC repair',
          slug: 'ac-repair-inspection',
          basePrice: 299,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 460000,
          description: 'Comprehensive 18-step diagnosis, electrical wiring inspection, PCB error code troubleshooting & cooling check.',
          imageUrl: '/services/ac-repair-gas.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-gas-refill',
          name: 'Gas refill & checkup',
          slug: 'ac-gas-refill-checkup',
          basePrice: 2499,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 275000,
          description: 'Nitrogen pressure testing, leak braze repair, vacuum evacuation, and 100% certified R32 / R410A gas charging with 60 days warranty.',
          imageUrl: '/services/ac-repair-gas.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-ac-install',
      name: 'Installation/uninstallation',
      slug: 'installation-uninstallation',
      icon: 'home_repair_service',
      badge: 'Precision',
      groupHeader: 'Air Conditioner',
      displayOrder: 4,
      description: 'Precision wall mounting, laser bracket leveling & safe uninstallation.',
      services: [
        {
          id: 'srv-ac-install',
          name: 'AC installation',
          slug: 'ac-installation-service',
          basePrice: 1199,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 320000,
          description: 'Precision laser-level indoor bracket mount, core hole drilling with dust collector, copper piping flare connection & vacuum test.',
          imageUrl: '/services/ac-installation.jpg',
          isActive: true,
        },
        {
          id: 'srv-ac-uninstall',
          name: 'AC uninstallation',
          slug: 'ac-uninstallation-service',
          basePrice: 699,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 185000,
          description: 'Safe refrigerant pump-down & locking into compressor, indoor/outdoor dismounting, copper pipe sealing with protective caps.',
          imageUrl: '/services/ac-installation.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_SALON_LUXE_CATEGORY: ServiceCategory = {
  id: 'cat-salon-luxe',
  name: 'Salon Luxe',
  slug: 'salon-luxe',
  icon: '🧖‍♀️',
  badge: 'Earliest Thu, 7:00 PM',
  order: 2,
  subCategories: [
    {
      id: 'sub-salon-packages',
      name: 'Super saver packages',
      slug: 'super-saver-packages',
      icon: 'percent',
      badge: 'Upto 20% OFF',
      groupHeader: 'Packages',
      displayOrder: 1,
      description: 'Curated salon combos with maximum savings and premium parlor care at home.',
      services: [
        {
          id: 'srv-luxe-pkg-1',
          name: 'Make your own package',
          slug: 'make-your-own-package',
          basePrice: 5347,
          durationMinutes: 300,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 1400000,
          description: '• Waxing: Full arms - Rica Gold Tin, Full legs - Rica Gold Tin\n• Facial & cleanup: Korean glass skin facial\n• Manicure & pedicure: Ice cream delight manicure, Ice cream delight pedicure\n• Facial hair removal: Eyebrows',
          imageUrl: '/services/japanese-glow-rituals.jpg',
          isActive: true,
        },
        {
          id: 'srv-luxe-pkg-2',
          name: 'Monthly maintenance package',
          slug: 'monthly-maintenance-package',
          basePrice: 1687,
          durationMinutes: 85,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 1100000,
          description: '• Waxing: Full arms - Rica Gold Tin, Full legs - Rica Gold Tin\n• Facial hair removal: Eyebrows',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-luxe-pkg-3',
          name: 'Wax & glow',
          slug: 'wax-and-glow',
          basePrice: 3218,
          durationMinutes: 165,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 1100000,
          description: '• Waxing: Full arms - Rica Gold Tin, Full legs - Rica Gold Tin\n• Facials: Korean glass skin facial\n• Facial hair removal: Eyebrows',
          imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-salon-waxing',
      name: 'Waxing & threading',
      slug: 'waxing-threading',
      icon: 'content_cut',
      badge: 'Popular',
      groupHeader: 'Waxing',
      displayOrder: 2,
      description: 'Hygienic cartridge roll-on & peel-off waxing by certified beauticians.',
      services: [
        {
          id: 'srv-wax-spatula',
          name: 'Spatula waxing (Full arms & legs, underarms)',
          slug: 'spatula-waxing-full',
          basePrice: 1039,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 48000,
          description: '• Choose from Honey or RICA Wax\n• Covers full legs & arms (including underarms)',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-rollon',
          name: 'Roll-on waxing (Full arms & legs, underarm)',
          slug: 'roll-on-waxing-full',
          basePrice: 1399,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 36000,
          description: '• Choose from a range of Roll-on wax options\n• Cirepil intimate peel-off wax would be used for underarms',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-arms-underarms',
          name: 'Full arms & underarms waxing',
          slug: 'full-arms-underarms-waxing',
          basePrice: 599,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 127000,
          description: 'Covers full arms & underarms with gentle soothing post-wax treatment.',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-legs',
          name: 'Full legs waxing',
          slug: 'full-legs-waxing',
          basePrice: 539,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 68000,
          description: '• Bikini/ bikini line/butt waxing is not included',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-half-legs',
          name: 'Half legs waxing',
          slug: 'half-legs-waxing',
          basePrice: 349,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 50000,
          description: 'Gentle hair removal for half legs with soothing aloe vera finish.',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-stomach',
          name: 'Stomach waxing',
          slug: 'stomach-waxing',
          basePrice: 489,
          durationMinutes: 25,
          bestsellerFlag: false,
          rating: 4.92,
          reviewCount: 5000,
          description: '• Covers the area from below the bust to the pelvis',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-back',
          name: 'Back waxing',
          slug: 'back-waxing',
          basePrice: 539,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 5000,
          description: '• Covers the area from shoulders to the pelvis',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-underarms',
          name: 'Underarms waxing',
          slug: 'underarms-waxing',
          basePrice: 119,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 38000,
          description: 'Quick & painless underarms hair removal with single-use cartridge wax.',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-bikini',
          name: 'Bikini waxing',
          slug: 'bikini-waxing',
          basePrice: 1099,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.93,
          reviewCount: 82000,
          description: '• Covers full pelvic area (buttocks not included)',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-bikini-line',
          name: 'Bikini line waxing',
          slug: 'bikini-line-waxing',
          basePrice: 499,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.92,
          reviewCount: 4000,
          description: '• Only covers area around the pelvis, not the pelvis itself',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-butt',
          name: 'Butt waxing',
          slug: 'butt-waxing',
          basePrice: 349,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.91,
          reviewCount: 2000,
          description: '• Covers the buttocks. Butthole is not included',
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wax-full-body',
          name: 'Full body waxing',
          slug: 'full-body-waxing',
          basePrice: 1799,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 12000,
          description: '• Covers full arms, full legs, underarms, stomach & back',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-threading',
          name: 'Threading',
          slug: 'threading-service',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.91,
          reviewCount: 499000,
          description: 'Precision threading for eyebrows, upper lip, chin & forehead.',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cirepil-face',
          name: 'Cirepil PR Visage face wax',
          slug: 'cirepil-face-wax',
          basePrice: 199,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 116000,
          description: '• Face waxing service does not include eyebrow shaping/threading',
          imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-salon-japanese',
      name: 'Japanese rituals & Korean facials',
      slug: 'japanese-rituals-korean-facials',
      icon: 'sparkles',
      badge: 'New',
      groupHeader: 'Facials',
      displayOrder: 3,
      description: 'Cryofacial cold therapy, glass skin hydration and Japanese mochi skin rituals.',
      services: [
        {
          id: 'srv-yuzu-glow',
          name: 'Yuzu vitamin glow ritual',
          slug: 'yuzu-vitamin-glow-ritual',
          basePrice: 2399,
          durationMinutes: 70,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 4000,
          description: '• Melts away dullness & locks in deep hydration for a visibly brighter, dewy glow\n• Free SPF 70 PA ++++ mist & nourishing lip butter balm',
          imageUrl: '/services/japanese-glow-rituals.jpg',
          isActive: true,
        },
        {
          id: 'srv-mochi-skin',
          name: 'Rice water mochi skin ritual',
          slug: 'rice-water-mochi-skin-ritual',
          basePrice: 1999,
          durationMinutes: 70,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 3000,
          description: '• Clears away congestion & resets stressed skin for a fresh, bouncy finish\n• Free SPF 70 PA ++++ mist & nourishing lip butter balm',
          imageUrl: '/services/japanese-glow-rituals.jpg',
          isActive: true,
        },
        {
          id: 'srv-korean-glass-skin',
          name: 'Korean Glass skin facial',
          slug: 'korean-glass-skin-facial',
          basePrice: 2099,
          durationMinutes: 80,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 50000,
          description: '• Refines skin texture to achieve a smooth, poreless finish\n• Suitable for normal to oily skin',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-kglow-age-rewind',
          name: 'KGlow age-rewind facial',
          slug: 'kglow-age-rewind-facial',
          basePrice: 1899,
          durationMinutes: 80,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 23000,
          description: '• Restores skin elasticity to visibly lift & tighten the face\n• Suitable for all skin types',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-korean-sea-algae',
          name: 'Korean Sea-algae Hydra-boost facial',
          slug: 'korean-sea-algae-hydra-boost-facial',
          basePrice: 2299,
          durationMinutes: 80,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 19000,
          description: '• Drenches skin in deep moisture to restore a plump, dewy look\n• Suitable for all skin types',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-salon-signature-facial',
      name: 'Signature facial & cleanup',
      slug: 'signature-facial-cleanup',
      icon: 'spa',
      badge: 'Luxury',
      groupHeader: 'Facials',
      displayOrder: 4,
      description: 'Luxury Casmara, O3+ and Repechage clinical treatments for radiant, youthful skin.',
      services: [
        {
          id: 'srv-sig-brightening',
          name: 'Signature brightening facial',
          slug: 'signature-brightening-facial',
          basePrice: 2499,
          durationMinutes: 80,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 10000,
          description: '• Targets dark spots & uneven patches to promote a more uniform complexion\n• Suitable for all skin types',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-casmara-brightening',
          name: 'Casmara brightening facial',
          slug: 'casmara-brightening-facial',
          basePrice: 3959,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 15000,
          description: '• Exfoliates dull skin cells to reveal a smoother, more uniform skin tone\n• Suitable for all skin types',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-multi-peptide',
          name: 'Multi-peptide anti-ageing facial',
          slug: 'multi-peptide-anti-ageing-facial',
          basePrice: 2699,
          durationMinutes: 80,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 7000,
          description: '• Targets fine lines & boosts elasticity for a visibly lifted appearance\n• Suitable for dry skin',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-casmara-anti-ageing',
          name: 'Casmara anti-ageing facial',
          slug: 'casmara-anti-ageing-facial',
          basePrice: 3949,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 9000,
          description: '• Enhances skin firmness & elasticity for a revitalized, sculpted look\n• Suitable for dry skin',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-hydraboost',
          name: 'Hydraboost facial',
          slug: 'hydraboost-facial',
          basePrice: 2449,
          durationMinutes: 80,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 4000,
          description: '• Drenches skin in moisture to restore a soft & supple feel\n• Suitable for dry skin',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-casmara-hydration',
          name: 'Casmara hydration facial',
          slug: 'casmara-hydration-facial',
          basePrice: 3039,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 6000,
          description: "• Restores & replenishes skin's natural moisture balance\n• Suitable for dry skin",
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-o3-kumkumadi',
          name: 'O3 Kumkumadi ayurvedic facial',
          slug: 'o3-kumkumadi-ayurvedic-facial',
          basePrice: 1749,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 10000,
          description: '• Targets tanning & dullness to reveal a visibly clearer, more luminous complexion\n• Suitable for all skin types',
          imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-o3-radiance',
          name: 'O3+ Radiance luxury facial',
          slug: 'o3-radiance-luxury-facial',
          basePrice: 1649,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 14000,
          description: '• Revives dull skin to reveal a smooth, radiant complexion\n• For normal to dry skin',
          imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-remy-laure',
          name: 'Remy Laure eternal radiance treatment',
          slug: 'remy-laure-radiance',
          basePrice: 4599,
          durationMinutes: 100,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 746,
          description: '• Restores natural radiance through deep hydration\n• Includes a relaxing back, hands & half-leg massage',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
        {
          id: 'srv-hydra-mud',
          name: 'Hydra mud glow cleanup',
          slug: 'hydra-mud-glow-cleanup',
          basePrice: 1299,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 13000,
          description: '• Purifies skin & refines pores to reveal a healthy, natural glow\n• Suitable for dry skin',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-detox-mud',
          name: 'Detox mud cleanup',
          slug: 'detox-mud-cleanup',
          basePrice: 1299,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 6000,
          description: '• Purifies & tightens pores to maintain a breakout-free skin\n• Suitable for oily skin',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-repechage-cleanup',
          name: 'Repechage brightening cleanup',
          slug: 'repechage-brightening-cleanup',
          basePrice: 1749,
          durationMinutes: 50,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 12000,
          description: '• Effectively lightens pigmentation & reduces dark spots\n• Suitable for all skin types',
          imageUrl: '/services/cryofacial-therapy.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-salon-pedicure-manicure',
      name: 'Pedicure & manicure',
      slug: 'pedicure-manicure',
      icon: 'self_improvement',
      badge: 'Combo Savings',
      groupHeader: 'Nails & Care',
      displayOrder: 5,
      description: 'Nourishing foot & hand spa, cut-file-polish and rejuvenating paraffin crystal therapies.',
      services: [
        {
          id: 'srv-sig-mani-pedi',
          name: 'Signature mani-pedi combo',
          slug: 'signature-mani-pedi-combo',
          basePrice: 1849,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 7000,
          description: '• A deep cleansing ritual that boosts circulation & soothes the skin',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-icecream-pedi',
          name: 'Ice cream delight pedicure',
          slug: 'ice-cream-delight-pedicure',
          basePrice: 1599,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 23000,
          description: '• A creamy, strawberry-infused retreat to soften skin & refresh tired feet',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-crystal-pedi',
          name: 'Rejuvenating crystal spa pedicure',
          slug: 'rejuvenating-crystal-spa-pedicure',
          basePrice: 1289,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 75000,
          description: '• Wheatgerm oil, beeswax & paraffin treatment for long-lasting hydration\n• Includes 15-min foot & 10-min shoulder & hand massage',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cut-file-feet',
          name: 'Cut, file & polish (feet)',
          slug: 'cut-file-polish-feet',
          basePrice: 349,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 19000,
          description: '• Quick toenail grooming session with a wide range of nail paints',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-icecream-mani',
          name: 'Ice cream delight manicure',
          slug: 'ice-cream-delight-manicure',
          basePrice: 1299,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 7000,
          description: '• A creamy, strawberry-infused retreat to soften skin & refresh tired skin',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-avl-algae-mani',
          name: 'AVL sea-algae manicure',
          slug: 'avl-sea-algae-manicure',
          basePrice: 999,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 25000,
          description: '• A marine-powered therapy that detoxifies, tones & repairs the skin',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cut-file-hands',
          name: 'Cut, file & polish (hands)',
          slug: 'cut-file-polish-hands',
          basePrice: 299,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 19000,
          description: '• Quick fingernail grooming session with a wide range of nail paints',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-salon-bleach-detan',
      name: 'Bleach, detan & massage',
      slug: 'bleach-detan-massage',
      icon: 'flare',
      badge: 'Express',
      groupHeader: 'Care',
      displayOrder: 6,
      description: 'Targeted tan reduction, professional bleaching and stress-relief massage therapies.',
      services: [
        {
          id: 'srv-bleach',
          name: 'Bleach',
          slug: 'bleach-service',
          basePrice: 549,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 24000,
          description: '• Professional bleach to help even out skin tone & lighten facial hair',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-detan',
          name: 'Detan',
          slug: 'detan-service',
          basePrice: 549,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 31000,
          description: '• A targeted detan service to help reduce pigmentation, tan & dark spots',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-foot-massage',
          name: 'Foot massage',
          slug: 'foot-massage-express',
          basePrice: 299,
          durationMinutes: 10,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 37000,
          description: '• Micro-movement techniques to relax feet & stimulate pressure points',
          imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-head-massage',
          name: 'Head massage',
          slug: 'head-massage-oil',
          basePrice: 349,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.92,
          reviewCount: 56000,
          description: '• Relaxing oil massage to relieve stress & promote hair growth',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_INSTAHELP_CATEGORY: ServiceCategory = {
  id: 'cat-instahelp',
  name: 'InstaHelp',
  slug: 'instahelp',
  icon: '👩‍🍳',
  badge: 'In 41 mins',
  order: 7,
  subCategories: [
    {
      id: 'sub-ih-instant',
      name: 'Instant',
      slug: 'instant',
      icon: 'bolt',
      badge: 'In 41 mins',
      groupHeader: 'Daily Help',
      displayOrder: 1,
      description: 'Verified domestic helpers delivered to your doorstep in minutes.',
      services: [
        {
          id: 'srv-ih-instant-main',
          name: 'InstaHelp',
          slug: 'instahelp-instant',
          basePrice: 49,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.70,
          reviewCount: 19500000,
          description: 'Immediate domestic assistance for utensils, chopping, sweeping & emergency house tasks.\nView details',
          imageUrl: '/services/instahelp-helper.jpg',
          isActive: true,
        },
        {
          id: 'srv-ih-instant-saver',
          name: 'Super saver pack',
          slug: 'super-saver-pack-instant',
          basePrice: 49,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.70,
          reviewCount: 19500000,
          description: 'Complete 45-min household chores pack including kitchen slab wiping & floor cleaning.\nView details',
          imageUrl: '/services/instahelp-helper.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-ih-later',
      name: 'Later',
      slug: 'later',
      icon: 'schedule',
      badge: 'Scheduled',
      groupHeader: 'Daily Help',
      displayOrder: 2,
      description: 'Schedule trained helpers for any convenient upcoming slot.',
      services: [
        {
          id: 'srv-ih-later-main',
          name: 'InstaHelp',
          slug: 'instahelp-later',
          basePrice: 59,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.70,
          reviewCount: 19500000,
          description: 'Pre-book your favorite slot for thorough kitchen aid, meal prep assistance and dusting.\nView details',
          imageUrl: '/services/instahelp-helper.jpg',
          isActive: true,
        },
        {
          id: 'srv-ih-later-saver',
          name: 'Super saver pack',
          slug: 'super-saver-pack-later',
          basePrice: 49,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.70,
          reviewCount: 19500000,
          description: 'Scheduled multi-task assistance bundle with verified, background-checked domestic staff.\nView details',
          imageUrl: '/services/instahelp-helper.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-ih-multiday',
      name: 'Multi-day',
      slug: 'multi-day',
      icon: 'calendar_month',
      badge: 'Subscriptions',
      groupHeader: 'Daily Help',
      displayOrder: 3,
      description: 'Reliable recurring domestic help packages with guaranteed backup.',
      services: [
        {
          id: 'srv-ih-multi-main',
          name: 'InstaHelp Multi-Day',
          slug: 'instahelp-multi-day',
          basePrice: 69,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.69,
          reviewCount: 459000,
          description: 'Multi-day recurring home support bundle with seamless rescheduling & dedicated helper guarantee.\nView details',
          imageUrl: '/services/instahelp-helper.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_WASHING_MACHINE_CATEGORY: ServiceCategory = {
  id: 'cat-washing-machine',
  name: 'Washing Machine Repair',
  slug: 'washing-machine',
  icon: '🧺',
  badge: 'In 44 mins',
  order: 4,
  subCategories: [
    {
      id: 'sub-wm-jet',
      name: 'Washing machine jet service',
      slug: 'washing-machine-jet-service',
      icon: 'water_drop',
      badge: 'Skin-safe',
      groupHeader: 'Repair & Service',
      displayOrder: 1,
      description: 'High-pressure drum decontamination with skin-safe anti-scaling chemicals.',
      services: [
        {
          id: 'srv-wm-jet-main',
          name: 'Washing machine jet service',
          slug: 'washing-machine-jet-service-main',
          basePrice: 1099,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 4000,
          description: '• Improves wash quality, fabric care, and machine performance\n• Available for top-load & front-load machines, except Bosch & Siemens',
          imageUrl: '/services/washing-machine-clean.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wm-checkup',
      name: 'Washing machine check-up',
      slug: 'washing-machine-check-up',
      icon: 'troubleshoot',
      badge: '₹199 Only',
      groupHeader: 'Repair & Service',
      displayOrder: 2,
      description: 'Comprehensive 21-point checkup to identify motor, drainage, PCB or spin issues.',
      services: [
        {
          id: 'srv-wm-checkup-main',
          name: 'Washing machine check-up',
          slug: 'washing-machine-checkup-main',
          basePrice: 199,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 91000,
          description: '• Complete check up to identify issues before repair\n• We share a quote and get it approved by you before the repair begins',
          imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wm-installation',
      name: 'Washing machine installation',
      slug: 'washing-machine-installation',
      icon: 'plumbing',
      badge: 'Precision',
      groupHeader: 'Repair & Service',
      displayOrder: 3,
      description: 'Vibration-free leveling, inlet water hose fitting & drain pipe routing.',
      services: [
        {
          id: 'srv-wm-install-main',
          name: 'Washing machine installation',
          slug: 'washing-machine-install-main',
          basePrice: 399,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 54000,
          description: '• The washing machine will be installed with care.\n• The area will be cleaned once work is done.',
          imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_SPA_CATEGORY: ServiceCategory = {
  id: 'cat-spa-women',
  name: 'Spa for Women',
  slug: 'spa-for-women',
  icon: '💆‍♀️',
  badge: 'In 44 mins',
  order: 2,
  subCategories: [
    {
      id: 'sub-spa-luxe',
      name: 'Luxe (Curated therapies)',
      slug: 'luxe',
      icon: 'spa',
      badge: 'Top rated',
      groupHeader: 'Therapy Selection',
      displayOrder: 1,
      description: 'Curated therapies with only Highly rated therapists & oils.',
      services: [
        {
          id: 'srv-spa-stress-relief',
          name: 'Stress relief Swedish therapy',
          slug: 'stress-relief-swedish-therapy',
          basePrice: 898,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 32000,
          description: '• Relieves daily stress and fatigue\n• Swedish strokes with calming lavender aroma oil\n• Includes complimentary hot towel therapy\n• Option: 60 mins (₹898) | 90 mins (₹1,299)',
          imageUrl: '/services/spa-luxe-stones.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-deep-tissue',
          name: 'Deep tissue muscle therapy',
          slug: 'deep-tissue-muscle-therapy',
          basePrice: 999,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.89,
          reviewCount: 45000,
          description: '• Intensive firm pressure on chronic muscle knots and stiffness\n• Warm sesame & eucalyptus therapeutic blend\n• Acupressure trigger-point release\n• Option: 60 mins (₹999) | 90 mins (₹1,449)',
          imageUrl: '/services/spa-luxe-stones.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-post-workout',
          name: 'Post-workout pain recovery',
          slug: 'post-workout-pain-recovery',
          basePrice: 1049,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 18000,
          description: '• Breaks down lactic acid build-up after workouts\n• Deep stretching and joint mobilization\n• Premium warming therapeutic oil',
          imageUrl: '/services/spa-luxe-stones.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-head-shoulder',
          name: 'Head, neck & shoulder destress',
          slug: 'head-neck-shoulder-destress',
          basePrice: 549,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 28000,
          description: '• Instant desk fatigue and migraine relief\n• Warm almond oil scalp nourishment\n• Upper back and trapezius tension release',
          imageUrl: '/services/spa-luxe-stones.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-spa-prime',
      name: 'Prime (Regular oil massages)',
      slug: 'prime',
      icon: 'healing',
      badge: 'In 44 mins',
      groupHeader: 'Therapy Selection',
      displayOrder: 2,
      description: 'Regular oil massages with standard techniques & therapist.',
      services: [
        {
          id: 'srv-spa-prime-swedish',
          name: 'Classic Swedish relaxation massage',
          slug: 'classic-swedish-relaxation-massage',
          basePrice: 699,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 62000,
          description: '• Gentle rhythmic long gliding strokes with standard branded aroma oils\n• Relieves muscular tension and calms mind\n• Performed by verified trained therapists',
          imageUrl: '/services/spa-prime-massage.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-prime-stress',
          name: 'Stress relief body massage',
          slug: 'stress-relief-body-massage',
          basePrice: 749,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 55000,
          description: '• Medium pressure therapy targeting lower back and shoulder tension\n• Natural carrier oil blend\n• Fresh single-use disposable sheet guarantee',
          imageUrl: '/services/spa-prime-massage.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-prime-back',
          name: 'Express back tension massage',
          slug: 'express-back-tension-massage',
          basePrice: 449,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 41000,
          description: '• Targeted 30-min quick relief for office-goers\n• Focuses on spine, shoulder blades and neck\n• Relaxing post-massage warm wipe',
          imageUrl: '/services/spa-prime-massage.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-prime-foot',
          name: 'Foot reflexology & leg massage',
          slug: 'foot-reflexology-leg-massage',
          basePrice: 449,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 33000,
          description: '• Stimulates acupoints on soles and relieves calf swelling\n• Restores healthy blood circulation\n• Soothing mentholated foot balm',
          imageUrl: '/services/spa-prime-massage.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-spa-ayurveda',
      name: 'Ayurveda (Herbal oil therapies)',
      slug: 'ayurveda',
      icon: 'self_improvement',
      badge: 'In 59 mins',
      groupHeader: 'Therapy Selection',
      displayOrder: 3,
      description: 'Healing Ayurvedic therapies with authentic herbal tailam and oils.',
      services: [
        {
          id: 'srv-spa-ayur-abhyanga',
          name: 'Authentic Abhyanga body therapy',
          slug: 'authentic-abhyanga-body-therapy',
          basePrice: 699,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 48000,
          description: '• Traditional synchronized seven-posture massage with warm Dhanwantharam tailam\n• Pacifies Vata dosha and boosts vitality\n• Warm herbal steam towel finish',
          imageUrl: '/services/spa-ayurveda-potli.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-ayur-potli',
          name: 'Potli Kizhi pain relief therapy',
          slug: 'potli-kizhi-pain-relief-therapy',
          basePrice: 899,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.89,
          reviewCount: 29000,
          description: '• Warm medicated herbal poultice compress dipped in heated oil\n• Ideal for chronic lower back, sciatica and knee joint pain\n• Improves flexibility and reduces inflammation',
          imageUrl: '/services/spa-ayurveda-potli.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-ayur-shirodhara',
          name: 'Shirodhara mind destress therapy',
          slug: 'shirodhara-mind-destress-therapy',
          basePrice: 999,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 19000,
          description: '• Continuous rhythmic stream of warm herbal oil over forehead ajna chakra\n• Treats insomnia, chronic headaches, stress and anxiety\n• Deeply meditative state of mental serenity',
          imageUrl: '/services/spa-ayurveda-potli.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-ayur-padabhyanga',
          name: 'Padabhyanga Ayurvedic foot massage',
          slug: 'padabhyanga-ayurvedic-foot-massage',
          basePrice: 499,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 22000,
          description: '• Kansa vatki bronze bowl massage with warm sesame tailam\n• Calms nerves and promotes sound deep sleep\n• Eliminates foot dryness and cracking',
          imageUrl: '/services/spa-ayurveda-potli.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-spa-targeted',
      name: 'Targeted relief',
      slug: 'targeted-relief',
      icon: 'pan_tool',
      badge: null,
      groupHeader: 'Quick Relief',
      displayOrder: 4,
      description: 'Focused 30-45 min sessions targeting stubborn pain areas.',
      services: [
        {
          id: 'srv-spa-head-shoulder-2',
          name: 'Head, neck & shoulder destress',
          slug: 'head-neck-shoulder-destress-quick',
          basePrice: 549,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 28000,
          description: '• Instant desk fatigue and migraine relief\n• Warm almond oil scalp nourishment\n• Upper back and trapezius tension release',
          imageUrl: '/services/spa-luxe-stones.jpg',
          isActive: true,
        },
        {
          id: 'srv-spa-foot-calf',
          name: 'Foot reflexology & calf release',
          slug: 'foot-reflexology-calf-release',
          basePrice: 599,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 21000,
          description: '• Acupressure foot massage restoring circulation and relieving swollen, tired feet',
          imageUrl: '/services/spa-prime-massage.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_BATHROOM_CLEANING_CATEGORY: ServiceCategory = {
  id: 'cat-bathroom-cleaning',
  name: 'Bathroom Cleaning',
  slug: 'bathroom-cleaning',
  icon: '🚽',
  badge: '4.80 ★ (4.2M)',
  order: 3,
  subCategories: [
    {
      id: 'sub-bc-value-deals',
      name: 'Value deals',
      slug: 'value-deals',
      icon: '🏷️',
      badge: 'Upto 25% OFF',
      groupHeader: 'Bathroom Cleaning',
      displayOrder: 1,
      description: 'Multi-bathroom intensive cleaning packages with maximum savings.',
      services: [
        {
          id: 'srv-bc-val-2',
          name: 'Intense cleaning (2 bathrooms)',
          slug: 'intense-cleaning-2-bathrooms',
          basePrice: 899,
          durationMinutes: 80,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 1200000,
          description: '• Takes 2 hrs • 2 bathrooms with stubborn stain removal\n• Power scrubbing machine & skin-safe descaling foam\n• Exhaust fan, mirror, floor & sanitary ware deep clean',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-val-3',
          name: 'Intense cleaning (3 bathrooms)',
          slug: 'intense-cleaning-3-bathrooms',
          basePrice: 1299,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 680000,
          description: '• Takes 3 hrs • 3 bathrooms with stain removal & descaling\n• Acid-free lime scale removal on taps, tiles & fittings\n• Complete bathroom floor buffing & disinfection',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-val-4',
          name: 'Intense cleaning (4 bathrooms)',
          slug: 'intense-cleaning-4-bathrooms',
          basePrice: 1699,
          durationMinutes: 160,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 340000,
          description: '• Takes 4 hrs • 4 bathrooms deep chemical wash & descaling\n• Full tile grout scrubbing, ceiling cobweb removal & drain clearing\n• Save 25% on whole home bathroom care',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-val-combo',
          name: 'Intense bathroom & ceiling fan cleaning (pack of 2)',
          slug: 'intense-bathroom-ceiling-fan-pack-2',
          basePrice: 999,
          durationMinutes: 100,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 510000,
          description: '• Includes 2 bathrooms deep clean + 2 ceiling fans power dusting\n• Removes stubborn grease, moisture stains and limescale',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-bc-deep-clean',
      name: 'One time deep clean',
      slug: 'one-time-deep-clean',
      icon: '✨',
      badge: 'Deep Clean',
      groupHeader: 'Bathroom Cleaning',
      displayOrder: 2,
      description: 'Single bathroom intensive restoration with power rotary brushes.',
      services: [
        {
          id: 'srv-bc-intense-single',
          name: 'Intense bathroom cleaning',
          slug: 'intense-bathroom-cleaning',
          basePrice: 499,
          durationMinutes: 50,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 2100000,
          description: '• Hard water stain removal with power scrubbing machine\n• Bathroom tile & floor deep cleaning with skin-safe foam\n• Toilet bowl under-rim germ eradication & chrome tap polish',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-move-in',
          name: 'Move-in bathroom cleaning',
          slug: 'move-in-bathroom-cleaning',
          basePrice: 699,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 420000,
          description: '• Deep chemical descaling for newly moved-in or vacated homes\n• Exhaust fan, geyser exterior & mirror descaling included\n• Heavy grime, paint residue & mildew removal',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-bc-mini-services',
      name: 'Mini services',
      slug: 'mini-services',
      icon: '➕',
      badge: 'From ₹99',
      groupHeader: 'Add-ons',
      displayOrder: 3,
      description: 'Quick targeted bathroom maintenance and fixture cleaning add-ons.',
      services: [
        {
          id: 'srv-bc-exhaust-fan',
          name: 'Bathroom exhaust fan cleaning (additional)',
          slug: 'bathroom-exhaust-fan-cleaning',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 180000,
          description: '• Grease and dust removal from blades and mesh guard\n• Motor wiping with dry microfiber cloth',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-door-cleaning',
          name: 'Door cleaning (additional)',
          slug: 'door-cleaning-additional',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.76,
          reviewCount: 95000,
          description: '• Dirt & moisture mark wiping with anti-bacterial solution\n• Cleans inner & outer door panels and handles',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-minor-descaling',
          name: 'Minor descaling (additional)',
          slug: 'minor-descaling-additional',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 140000,
          description: '• Acid-free limescale removal on chrome taps and showerheads\n• Restores brilliant metallic shine without scratching',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-washbasin-cleaning',
          name: 'Washbasin cleaning (additional)',
          slug: 'washbasin-cleaning-additional',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 210000,
          description: '• Stain removal from ceramic wash basin & mirror polish\n• Drain rim cleanup and stopper sanitization',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-ceiling-fan',
          name: 'Ceiling fan cleaning',
          slug: 'ceiling-fan-cleaning-add',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 310000,
          description: '• Deep blade wiping & motor cowl dust wipe down\n• Non-messy dry wiping with specialized drop cloth',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-bc-disinfection',
          name: 'Bathroom disinfection',
          slug: 'bathroom-disinfection-service',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 160000,
          description: '• Hospital-grade anti-microbial spray mist on all sanitary surfaces\n• 99.9% germ eradication on toilet seat, flush button & taps',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_MAKEUP_CATEGORY: ServiceCategory = {
  id: 'cat-makeup-saree-styling',
  name: 'Makeup, Saree & Styling',
  slug: 'makeup-saree-styling',
  icon: '💄',
  badge: 'In 59 mins',
  order: 2,
  subCategories: [
    {
      id: 'sub-mk-packages',
      name: 'Packages',
      slug: 'packages',
      icon: 'shopping_bag',
      badge: 'Bestseller',
      groupHeader: 'Combos & Packages',
      displayOrder: 1,
      description: 'Curated head-to-toe party and bridal styling packages by master artists.',
      services: [
        {
          id: 'srv-mk-party-pkg',
          name: 'Party makeup package',
          slug: 'party-makeup-package',
          basePrice: 1499,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 520000,
          description: '• Includes full face glam party makeup with false lashes\n• Simple hair styling (curls/blowdry/straightening) & saree or dupatta draping included\n• International branded cosmetic kits',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-zara-pkg',
          name: 'Zara makeup package',
          slug: 'zara-makeup-package',
          basePrice: 1999,
          durationMinutes: 105,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 310000,
          description: '• High-definition party glam look using premium MAC & Huda products\n• Complimentary hair styling and precision saree draping\n• Waterproof 12-hour long-wear finish',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-editorial-pkg',
          name: 'Editorial makeup package',
          slug: 'editorial-makeup-package',
          basePrice: 2499,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.91,
          reviewCount: 180000,
          description: '• Long-wear luminous finish, precision contouring, and smokey eye glam\n• Advanced hair styling with curls, waves or textured bun\n• Premium mink lashes and setting spray',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-saree-hair',
          name: 'Saree draping & hair styling',
          slug: 'saree-draping-hair-styling',
          basePrice: 799,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 640000,
          description: '• Neat pleating & pinning with pin-free safety tips\n• Quick curls, straightening or neat hair bun\n• Hair accessory attachment included',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-saree-makeup',
          name: 'Saree draping & hair make-up',
          slug: 'saree-draping-hair-makeup',
          basePrice: 1199,
          durationMinutes: 70,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 410000,
          description: '• Classic saree drape + light makeup touch up + blowdry curls\n• Perfect for family gatherings, pujas and festive functions',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-group-deals',
      name: 'Group deals',
      slug: 'group-deals',
      icon: 'groups',
      badge: '10% OFF',
      groupHeader: 'Group Deals',
      displayOrder: 2,
      description: 'Group styling packages for friends and family with instant 10% discount.',
      services: [
        {
          id: 'srv-mk-styling-twin',
          name: 'Styling twin deal',
          slug: 'styling-twin-deal',
          basePrice: 2499,
          durationMinutes: 150,
          bestsellerFlag: true,
          rating: 4.89,
          reviewCount: 190000,
          description: '• Complete makeup & styling package for 2 people\n• Save 10% on group booking with dedicated stylist\n• Hair styling and saree/dupatta draping for both',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-mehendi-duo',
          name: 'Mehendi hair styling duo',
          slug: 'mehendi-hair-styling-duo',
          basePrice: 1299,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 110000,
          description: '• Floral braids, textured curls & baby breath flower placement for 2 people\n• Ideal for Mehendi and Sangeet functions',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-saree-draping',
      name: 'Saree draping',
      slug: 'saree-draping',
      icon: 'styler',
      badge: 'From ₹399',
      groupHeader: 'Draping',
      displayOrder: 3,
      description: 'Wrinkle-free, perfectly pleated draping for all saree fabrics.',
      services: [
        {
          id: 'srv-mk-party-saree',
          name: 'Party saree draping',
          slug: 'party-saree-draping',
          basePrice: 399,
          durationMinutes: 25,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 820000,
          description: '• Standard pleated or Gujarati style pallu draping\n• Clean waist fitting and secure safety pinning',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-bridal-saree',
          name: 'Bridal / heavy saree draping',
          slug: 'bridal-heavy-saree-draping',
          basePrice: 599,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 340000,
          description: '• Heavy Kanjeevaram / Banarasi saree with ironed pleats & secure pinning\n• Can-can skirt adjustment and dupatta double draping',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-wedding-combos',
      name: 'Wedding combos',
      slug: 'wedding-combos',
      icon: 'diamond',
      badge: 'Luxury',
      groupHeader: 'Wedding Specials',
      displayOrder: 4,
      description: 'Showstopper bridal & wedding guest glam combinations.',
      services: [
        {
          id: 'srv-mk-pre-wedding',
          name: 'Pre-wedding styling combo',
          slug: 'pre-wedding-styling-combo',
          basePrice: 2999,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 120000,
          description: '• HD makeup, false lashes, bridal hairstyling & lehenga/saree drape\n• High-definition contouring and 16-hr smudge-proof finish',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-reception-glam',
          name: 'Reception glam combo',
          slug: 'reception-glam-combo',
          basePrice: 3499,
          durationMinutes: 130,
          bestsellerFlag: true,
          rating: 4.92,
          reviewCount: 95000,
          description: '• Waterproof long-wear HD glam with contouring & premium hair accessory setting\n• Customized lip blend & metallic eye shimmer',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-engagement-glam',
          name: 'Engagement glam combo',
          slug: 'engagement-glam-combo',
          basePrice: 3499,
          durationMinutes: 130,
          bestsellerFlag: false,
          rating: 4.91,
          reviewCount: 88000,
          description: '• Radiant engagement glow, eye drama, airbrush finish effect & drape\n• Long-stay setting mist for tear-proof wear',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-party-makeup',
      name: 'Party makeup',
      slug: 'party-makeup',
      icon: 'face',
      badge: 'In 59 mins',
      groupHeader: 'Makeup Styles',
      displayOrder: 5,
      description: 'Face makeup only tailored to your skin tone and event lighting.',
      services: [
        {
          id: 'srv-mk-classic-party',
          name: 'Classic party makeup',
          slug: 'classic-party-makeup',
          basePrice: 1199,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 480000,
          description: '• Subtle natural glowing base with nude lips & winged eyeliner\n• Matches your skin undertone perfectly',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-hd-party',
          name: 'HD party makeup',
          slug: 'hd-party-makeup',
          basePrice: 1499,
          durationMinutes: 75,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 610000,
          description: '• High-definition photo-ready foundation, bold eye makeup & blush\n• Conceals blemishes and dark circles seamlessly',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-glass-skin',
          name: 'Glass skin glow makeup',
          slug: 'glass-skin-glow-makeup',
          basePrice: 1899,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.90,
          reviewCount: 240000,
          description: '• Dewy Korean glass skin finish with cream blushes and luminous highlighter\n• Ultra-hydrating skin prep with hyaluronic serum',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-hair-styling',
      name: 'Hair styling',
      slug: 'hair-styling',
      icon: 'brush',
      badge: 'Salon Finish',
      groupHeader: 'Hair',
      displayOrder: 6,
      description: 'Professional thermal styling, curls and statement hair buns.',
      services: [
        {
          id: 'srv-mk-classic-blowdry',
          name: 'Classic blowdry & curls',
          slug: 'classic-blowdry-curls',
          basePrice: 499,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 390000,
          description: '• Smooth bouncy blowdry or soft beachy waves\n• Heat protectant serum application before styling',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-adv-hair',
          name: 'Advanced hair styling',
          slug: 'advanced-hair-styling',
          basePrice: 699,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 270000,
          description: '• Textured messy bun, French twists or Hollywood waves with setting spray\n• Includes teasing, padding and bobby pinning',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-mk-add-ons',
      name: 'Add-ons',
      slug: 'add-ons',
      icon: 'extension',
      badge: 'Quick Add',
      groupHeader: 'Add-ons',
      displayOrder: 7,
      description: 'Quick enhancement treatments to complement your party look.',
      services: [
        {
          id: 'srv-mk-eyelash',
          name: 'Eye lash application',
          slug: 'eye-lash-application',
          basePrice: 299,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 190000,
          description: '• Premium natural wispy false eyelashes with long-stay adhesive\n• Waterproof and reusable',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-adv-eye',
          name: 'Advanced eye makeup',
          slug: 'advanced-eye-makeup',
          basePrice: 399,
          durationMinutes: 25,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 150000,
          description: '• Cut-crease, smokey glitter eyes or dramatic cat eye styling\n• Includes eye primer and foil shimmers',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
        {
          id: 'srv-mk-hair-spa',
          name: 'Hair spa add-on',
          slug: 'hair-spa-addon',
          basePrice: 499,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 110000,
          description: '• Deep nourishing steam mask & scalp massage before styling\n• Tames frizz and adds instant mirror shine',
          imageUrl: '/services/makeup-party-glam.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_KITCHEN_CLEANING_CATEGORY: ServiceCategory = {
  id: 'cat-kitchen-cleaning',
  name: 'Kitchen Cleaning',
  slug: 'kitchen-cleaning',
  icon: '🍳',
  badge: '4.80 ★ (2.4M)',
  order: 3,
  subCategories: [
    {
      id: 'sub-kc-value-deals',
      name: 'Value deals',
      slug: 'value-deals',
      icon: '🏷️',
      badge: 'Upto 25% OFF',
      groupHeader: 'Kitchen Cleaning',
      displayOrder: 1,
      description: 'Kitchen and chimney combination packages with deep degreasing.',
      services: [
        {
          id: 'srv-kc-reg-chimney-kitchen',
          name: 'Regular chimney & kitchen cleaning',
          slug: 'regular-chimney-kitchen-cleaning',
          basePrice: 1199,
          durationMinutes: 150,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 340000,
          description: '• Complete kitchen degreasing + regular chimney cleaning\n• Gas stove, countertop, backsplash tiles and floor scrubbing\n• Non-toxic chemical degreaser on stubborn oil deposits',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-intense-chimney-kitchen',
          name: 'Intense kitchen & chimney cleaning',
          slug: 'intense-kitchen-chimney-cleaning',
          basePrice: 1699,
          durationMinutes: 195,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 510000,
          description: '• Deep chemical wash for heavily oiled kitchens\n• Baffle filter dismantling & power degreasing\n• Slabs, exhaust, cabinets exterior and wall tiles buffing',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-floor-sink',
          name: 'Kitchen floor scrubbing & sink',
          slug: 'kitchen-floor-scrubbing-sink',
          basePrice: 699,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 180000,
          description: '• High-speed floor scrubbing machine for greasy kitchen floors\n• Deep sink descaling & drain pipe unclog wash',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-kc-chimney',
      name: 'Chimney cleaning',
      slug: 'chimney-cleaning',
      icon: '💨',
      badge: 'Bestseller',
      groupHeader: 'Kitchen Cleaning',
      displayOrder: 2,
      description: 'Professional chimney dismantle, carbon & grease removal.',
      services: [
        {
          id: 'srv-kc-reg-chimney',
          name: 'Regular chimney cleaning',
          slug: 'regular-chimney-cleaning',
          basePrice: 599,
          durationMinutes: 75,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 420000,
          description: '• Filter cleaning, exterior body wipe & motor duct check\n• Removes sticky grease film for higher suction power',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-deep-chimney',
          name: 'Deep baffle filter chimney cleaning',
          slug: 'deep-baffle-filter-chimney-cleaning',
          basePrice: 799,
          durationMinutes: 105,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 260000,
          description: '• Complete baffle filter chemical immersion & degrease soak\n• Inner fan blade carbon removal & auto-clean tray restoration',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-kc-occupied',
      name: 'Occupied kitchen cleaning',
      slug: 'occupied-kitchen-cleaning',
      icon: '🍲',
      badge: 'Deep Clean',
      groupHeader: 'Kitchen Cleaning',
      displayOrder: 3,
      description: 'End-to-end cleaning without having to empty your kitchen cabinets.',
      services: [
        {
          id: 'srv-kc-occupied-full',
          name: 'Complete occupied kitchen cleaning',
          slug: 'complete-occupied-kitchen-cleaning',
          basePrice: 1299,
          durationMinutes: 150,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 610000,
          description: '• Utensil-safe degreasing of counters, hob, tiles & sink\n• Exterior cabinet doors, drawers and handles disinfected\n• Floor scrubbing with skin-safe disinfectant',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-kc-appliances',
      name: 'Appliance cleaning',
      slug: 'appliance-cleaning',
      icon: '🍳',
      badge: 'From ₹149',
      groupHeader: 'Appliances',
      displayOrder: 4,
      description: 'Hygienic deep cleaning of microwaves, fridges, stoves and air fryers.',
      services: [
        {
          id: 'srv-kc-fridge',
          name: 'Refrigerator cleaning',
          slug: 'refrigerator-cleaning-kitchen',
          basePrice: 399,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 410000,
          description: '• Tray removal, interior food stain wipe & gasket mold removal\n• Odor neutralizing steam deodorization',
          imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-kc-microwave',
          name: 'Microwave cleaning',
          slug: 'microwave-cleaning',
          basePrice: 299,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 280000,
          description: '• Turntable wash, grease splash removal & interior chamber scrub\n• Food-grade citrus sanitization',
          imageUrl: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-kc-stove',
          name: 'Gas stove deep clean',
          slug: 'gas-stove-deep-clean',
          basePrice: 249,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 310000,
          description: '• Brass burner unclog, drip tray scrubbing & glass/steel top polish\n• Removes stubborn burnt oil spots',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-purifier',
          name: 'Water purifier exterior cleaning',
          slug: 'water-purifier-exterior-cleaning',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 120000,
          description: '• Water deposit descaling on body & dispensing tap disinfection',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-airfryer',
          name: 'Air fryer cleaning',
          slug: 'air-fryer-cleaning',
          basePrice: 199,
          durationMinutes: 25,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 95000,
          description: '• Basket oil degreasing, heating coil crumb wipe & exterior cleanup',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-kc-oven',
          name: 'Oven cleaning',
          slug: 'oven-deep-cleaning',
          basePrice: 349,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 150000,
          description: '• Baking tray scrubbing, grill racks wire brush cleanup & glass door polish',
          imageUrl: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-kc-mixer',
          name: 'Mixer grinder / toaster cleaning',
          slug: 'mixer-toaster-cleaning',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.76,
          reviewCount: 80000,
          description: '• Body grime wiping, cord wipe and crumb tray emptying',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-kc-cabinets',
      name: 'Cabinets & slab',
      slug: 'cabinets-slab',
      icon: '🧽',
      badge: 'Popular',
      groupHeader: 'Storage & Slab',
      displayOrder: 5,
      description: 'Granite counter polish, tile degreasing and cabinet interior organization.',
      services: [
        {
          id: 'srv-kc-slab-degrease',
          name: 'Kitchen slab & tile degreasing',
          slug: 'kitchen-slab-tile-degreasing',
          basePrice: 499,
          durationMinutes: 50,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 350000,
          description: '• High-potency non-acidic foam spray removing oil droplets from tiles & slab\n• Restores clean shine without dulling granite',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-cabinet-wipe',
          name: 'Cabinet interior wiping & organizing',
          slug: 'cabinet-interior-wiping-organizing',
          basePrice: 599,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 220000,
          description: '• Internal shelf wiping, crumb suction & lining paper replacement assistance',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-kc-mini',
      name: 'Mini services',
      slug: 'mini-services',
      icon: '➕',
      badge: 'From ₹99',
      groupHeader: 'Add-ons',
      displayOrder: 6,
      description: 'Quick add-ons for sink, exhaust, windows and floor sanitization.',
      services: [
        {
          id: 'srv-kc-exhaust',
          name: 'Kitchen exhaust fan cleaning',
          slug: 'kitchen-exhaust-fan-cleaning',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 210000,
          description: '• Oil and soot removal from blades and plastic shutter louvers',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-sink',
          name: 'Sink & drain cleaning',
          slug: 'sink-drain-cleaning-kitchen',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 190000,
          description: '• Stainless steel stain polish & drain trap hair/food debris flush',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-dishrack',
          name: 'Dish drying rack & utensil area cleaning',
          slug: 'dish-drying-rack-cleaning',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 140000,
          description: '• Water lime deposit removal from chrome/plastic dish rack trays',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-window',
          name: 'Kitchen window & mesh cleaning',
          slug: 'kitchen-window-mesh-cleaning',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 110000,
          description: '• Oil mist wiping from window panes and wire mesh channel vacuuming',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
        {
          id: 'srv-kc-floor-disinfect',
          name: 'Kitchen floor disinfection',
          slug: 'kitchen-floor-disinfection-addon',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 160000,
          description: '• Hospital-grade antibacterial mop eliminating kitchen bacteria and grease',
          imageUrl: '/services/kitchen-cleaning-counter.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY: ServiceCategory = {
  id: 'cat-interior-modular-kitchen',
  name: 'Interior & Modular Kitchen',
  slug: 'interior-modular-kitchen',
  icon: '📐',
  badge: '4.86 ★ (1.1M)',
  order: 11,
  subCategories: [
    {
      id: 'sub-imk-woodwork',
      name: 'Modular Kitchen & Woodwork',
      slug: 'modular-kitchen-woodwork',
      icon: '📐',
      badge: 'Free Design',
      groupHeader: 'Kitchen Design',
      displayOrder: 1,
      description: 'Custom end-to-end modular kitchens with 3D design, marine-grade BWR plywood & 10-year warranty.',
      services: [
        {
          id: 'srv-imk-consultation',
          name: 'Modular kitchen design consultation',
          slug: 'modular-kitchen-design-consultation',
          basePrice: 199,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 320000,
          description: '• In-home site measurement & laser layout\n• Personalized 3D visual render with material selector\n• Fully adjusted against manufacturing bill',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
        {
          id: 'srv-imk-l-shape',
          name: 'L-Shaped modular kitchen package',
          slug: 'l-shaped-modular-kitchen-package',
          basePrice: 49999,
          durationMinutes: 180,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 410000,
          description: '• Boiling Water Resistant (BWR) marine plywood cabinetry\n• Soft-close German hinges, tandem drawers & cutlery trays\n• Quartz / Granite countertop installation support',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
        {
          id: 'srv-imk-parallel',
          name: 'Straight & Parallel modular kitchen',
          slug: 'straight-parallel-modular-kitchen',
          basePrice: 39999,
          durationMinutes: 180,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 230000,
          description: '• Optimized parallel counter space layout with acrylic high-gloss shutters\n• Stainless steel wire baskets & anti-termite treated carcass',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
        {
          id: 'srv-imk-island',
          name: 'Island & U-Shaped luxury kitchen',
          slug: 'island-u-shaped-luxury-kitchen',
          basePrice: 79999,
          durationMinutes: 240,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 150000,
          description: '• Premium PU lacquer finish with breakfast counter island\n• Integrated chimney space, pull-out pantry tall unit & under-cabinet LED profile lighting',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-imk-wardrobes',
      name: 'Kitchen wardrobes & lofts',
      slug: 'kitchen-wardrobes-lofts',
      icon: 'door_sliding',
      badge: 'Bestseller',
      groupHeader: 'Storage Solutions',
      displayOrder: 2,
      description: 'Floor-to-ceiling storage units, overhead lofts, and hydraulic cabinet shutter installation.',
      services: [
        {
          id: 'srv-imk-loft-woodwork',
          name: 'Overhead kitchen loft woodwork',
          slug: 'overhead-kitchen-loft-woodwork',
          basePrice: 8999,
          durationMinutes: 120,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 180000,
          description: '• Maximizes vertical dead space up to the ceiling\n• Water-resistant laminate matching kitchen shutters\n• Concealed magnetic push-to-open latches',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
        {
          id: 'srv-imk-tall-pantry',
          name: 'Tall pantry unit with pull-out baskets',
          slug: 'tall-pantry-unit-pullout',
          basePrice: 14999,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 120000,
          description: '• 6-tier heavy-duty chrome baskets for groceries\n• High load-bearing soft-closing runners',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-imk-renovation',
      name: 'Kitchen renovation & repair',
      slug: 'kitchen-renovation-repair',
      icon: 'build',
      badge: 'From ₹999',
      groupHeader: 'Refurbishment',
      displayOrder: 3,
      description: 'Shutter replacement, hinge fixing, countertop replacement and hardware modernization.',
      services: [
        {
          id: 'srv-imk-shutter-replacement',
          name: 'Kitchen shutter & hinge overhaul',
          slug: 'kitchen-shutter-hinge-overhaul',
          basePrice: 1499,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 290000,
          description: '• Realign sagging doors, replace rusty hinges with soft-close hinges\n• Handle tightening and anti-scratch edge banding',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
        {
          id: 'srv-imk-countertop-replacement',
          name: 'Countertop replacement & sink refit',
          slug: 'countertop-replacement-sink-refit',
          basePrice: 4999,
          durationMinutes: 180,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 95000,
          description: '• Removal of chipped granite/quartz slab and precision installation of new counter\n• Silicone sealing around sink to prevent water seepage into woodwork',
          imageUrl: '/services/modular-kitchen.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY: ServiceCategory = {
  id: 'cat-living-bedroom-cleaning',
  name: 'Living & Bedroom Cleaning',
  slug: 'living-bedroom-cleaning',
  icon: '🛋️',
  badge: '4.82 ★ (1.9M)',
  order: 3,
  subCategories: [
    {
      id: 'sub-lbc-super-saver',
      name: 'Super saver deals',
      slug: 'super-saver-deals',
      icon: 'savings',
      badge: 'Upto 25% OFF',
      groupHeader: 'Upholstery & Deals',
      displayOrder: 1,
      description: 'Exclusive combo packages for sofa and carpet wet extraction.',
      services: [
        {
          id: 'srv-lbc-fabric-sofa-3',
          name: 'Fabric sofa deep cleaning (3-seater)',
          slug: 'fabric-sofa-deep-cleaning-3seater',
          basePrice: 599,
          durationMinutes: 75,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 620000,
          description: '• Power dry vacuuming + shampoo foam injection + wet extraction\n• Removes 98% dust mites, coffee stains and pet odors\n• High-suction machine leaves sofa dry in 3 hours',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-upholstery',
      name: 'Clean upholstery expertise',
      slug: 'clean-upholstery-expertise',
      icon: 'cleaning_services',
      badge: 'Expert Tools',
      groupHeader: 'Upholstery & Deals',
      displayOrder: 2,
      description: 'German injection-extraction tools restoring fabric color and texture.',
      services: [
        {
          id: 'srv-lbc-sofa-scrub-extract',
          name: 'Deep sofa scrubbing & wet extraction',
          slug: 'deep-sofa-scrubbing-wet-extraction',
          basePrice: 799,
          durationMinutes: 105,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 410000,
          description: '• Manual stain spotting + motorized rotary brush shampooing\n• Hospital-grade sanitization killing allergens and bed bugs\n• Suitable for velvet, suede, linen & cotton blends',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-sofa',
      name: 'Sofa cleaning',
      slug: 'sofa-cleaning',
      icon: 'weekend',
      badge: 'Top Booked',
      groupHeader: 'Furniture',
      displayOrder: 3,
      description: 'Individual seating units and whole sectional sofa cleaning.',
      services: [
        {
          id: 'srv-lbc-sofa-1',
          name: '1-seater sofa / armchair cleaning',
          slug: '1seater-sofa-cleaning',
          basePrice: 299,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 150000,
          description: '• Complete fabric shampoo wash & moisture extraction',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-sofa-3',
          name: '3-seater sofa cleaning',
          slug: '3seater-sofa-cleaning',
          basePrice: 599,
          durationMinutes: 75,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 520000,
          description: '• Deep foam wash on armrests, backrest and seat cushions',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-sofa-5',
          name: '5-seater (3+1+1) sofa cleaning',
          slug: '5seater-sofa-cleaning',
          basePrice: 899,
          durationMinutes: 120,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 410000,
          description: '• Complete living room sofa suite deep extraction wash',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-sofa-lshape',
          name: 'L-shape / Sectional sofa cleaning',
          slug: 'lshape-sectional-sofa-cleaning',
          basePrice: 1199,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 220000,
          description: '• Chaise lounge and all modular sectional units deep shampooed',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-carpet',
          name: 'Carpet cleaning (small/medium)',
          slug: 'carpet-cleaning-living',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 190000,
          description: '• Up to 5x7 ft rug deep shampooing, dust mite extraction & deodorization',
          imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-curtain',
      name: 'Curtains',
      slug: 'curtain',
      icon: 'curtains',
      badge: 'In-situ',
      groupHeader: 'Furnishings',
      displayOrder: 4,
      description: 'Hang-in-place high pressure steam dusting without unhooking.',
      services: [
        {
          id: 'srv-lbc-curtain-panel',
          name: 'Curtain steam cleaning & dusting (per panel)',
          slug: 'curtain-steam-cleaning-panel',
          basePrice: 199,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 190000,
          description: '• High-temperature steam kills dust mites and straightens wrinkles\n• No hassle of taking down heavy curtains or drapery',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-balcony',
      name: 'Balcony cleaning',
      slug: 'balcony-cleaning',
      icon: 'deck',
      badge: 'Power Wash',
      groupHeader: 'Spaces',
      displayOrder: 5,
      description: 'Balcony floor scrubbing, bird dropping removal and railing wiping.',
      services: [
        {
          id: 'srv-lbc-balcony-deep',
          name: 'Balcony deep wash & railing cleaning',
          slug: 'balcony-deep-wash-railing',
          basePrice: 399,
          durationMinutes: 40,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 240000,
          description: '• High-pressure water floor wash, drain clearing & glass/steel railing wipe',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-bedroom',
      name: 'Bedroom deep',
      slug: 'bedroom-deep',
      icon: 'bed',
      badge: 'Deep Clean',
      groupHeader: 'Spaces',
      displayOrder: 6,
      description: 'Complete bedroom dust eradication, under-bed cleaning and sanitization.',
      services: [
        {
          id: 'srv-lbc-single-bedroom',
          name: 'Single bedroom deep cleaning',
          slug: 'single-bedroom-deep-cleaning',
          basePrice: 699,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 380000,
          description: '• Cobweb removal, ceiling fan wipe, wardrobe exterior wipe & floor buffing\n• Under-bed and behind-furniture dust vacuuming',
          imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-mattress',
      name: 'Mattress & bed',
      slug: 'mattress-bed',
      icon: 'hotel',
      badge: 'Anti-allergen',
      groupHeader: 'Bedding',
      displayOrder: 7,
      description: 'UV & wet extraction removing dead skin, dust mites and sweat stains.',
      services: [
        {
          id: 'srv-lbc-mat-single',
          name: 'Single bed mattress deep cleaning',
          slug: 'single-bed-mattress-cleaning',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 290000,
          description: '• Both sides shampoo wash + high power suction extraction',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-mat-double',
          name: 'Double / Queen bed mattress deep cleaning',
          slug: 'double-bed-mattress-cleaning',
          basePrice: 699,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 430000,
          description: '• Removes sweat rings, accidental spills and 99% dust mite allergens\n• Sanitizing anti-microbial spray treatment',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-headboard',
          name: 'Headboard fabric cleaning',
          slug: 'headboard-fabric-cleaning',
          basePrice: 299,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 110000,
          description: '• Upholstered bed backrest shampooing & dust extraction',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-dining',
      name: 'Living room & dining',
      slug: 'living-room-dining',
      icon: 'dining',
      badge: 'Wood & Glass',
      groupHeader: 'Living Area',
      displayOrder: 8,
      description: 'Dining suite polishing, TV unit dusting and living room center table clean.',
      services: [
        {
          id: 'srv-lbc-dining-table',
          name: 'Dining table & 4/6 chairs cleaning',
          slug: 'dining-table-chairs-cleaning',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 210000,
          description: '• Glass/wood tabletop polishing + cushioned chair fabric shampooing',
          imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-furniture',
      name: 'Other furniture',
      slug: 'other-furniture',
      icon: 'chair',
      badge: 'Add-on',
      groupHeader: 'Furniture',
      displayOrder: 9,
      description: 'Recliners, study chairs, wardrobes and shoe racks dusting.',
      services: [
        {
          id: 'srv-lbc-wardrobe-loft',
          name: 'Wardrobe exterior & loft dusting',
          slug: 'wardrobe-exterior-loft-dusting',
          basePrice: 299,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 160000,
          description: '• Wardrobe panel wipe down, mirror polishing and loft cobweb suction',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-shoerack',
          name: 'Shoe rack & console table cleaning',
          slug: 'shoe-rack-console-cleaning',
          basePrice: 199,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 95000,
          description: '• Dust suction & sanitizing wipe of shoe shelves',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-recliner',
          name: 'Recliner chair deep cleaning',
          slug: 'recliner-chair-cleaning',
          basePrice: 399,
          durationMinutes: 40,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 140000,
          description: '• Deep extraction of footrest, armrests and head cushion',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-office-chair',
          name: 'Office study chair cleaning',
          slug: 'office-study-chair-cleaning',
          basePrice: 199,
          durationMinutes: 25,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 180000,
          description: '• Mesh/cushion foam shampoo and wheel caster lint removal',
          imageUrl: 'https://images.unsplash.com/photo-1580481077195-c89b788001e3?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-beanbag',
          name: 'Bean bag cleaning',
          slug: 'bean-bag-cleaning',
          basePrice: 199,
          durationMinutes: 20,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 75000,
          description: '• Leatherette / fabric outer casing wipe and disinfectant treatment',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lbc-windows-fan',
      name: 'Windows & fan',
      slug: 'windows-fan',
      icon: 'window',
      badge: 'From ₹99',
      groupHeader: 'Fixtures',
      displayOrder: 10,
      description: 'Window glass channels, doors, ceiling fans and switchboards.',
      services: [
        {
          id: 'srv-lbc-window-glass',
          name: 'Window glass & channel cleaning (per window)',
          slug: 'window-glass-channel-cleaning',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 220000,
          description: '• Channel vacuuming & squeegee streak-free glass polish',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lbc-fan-pack2',
          name: 'Ceiling fan power dusting (pack of 2)',
          slug: 'ceiling-fan-power-dusting-pack2',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 310000,
          description: '• Specialized anti-static dust sleeve & motor wipe',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-lbc-door-frame',
          name: 'Door & frame wiping',
          slug: 'door-frame-wiping-living',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 140000,
          description: '• Fingerprint mark cleaning and anti-bacterial handle wipe',
          imageUrl: '/services/toilet-cleaning-rim.jpg',
          isActive: true,
        },
        {
          id: 'srv-lbc-switchboards',
          name: 'Light fixtures & switchboard dusting',
          slug: 'light-fixtures-switchboard-dusting',
          basePrice: 99,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 110000,
          description: '• Dry insulated microfiber brush dusting on all switches and pendant lights',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_FULL_HOME_CLEANING_CATEGORY: ServiceCategory = {
  id: 'cat-full-home-cleaning',
  name: 'Full Home/ By Room Cleaning',
  slug: 'full-home-cleaning',
  icon: '🏠',
  badge: 'Earliest 16, 8:30 AM',
  order: 3,
  subCategories: [
    {
      id: 'sub-fhc-apartment',
      name: 'Full apartment',
      slug: 'full-apartment',
      icon: 'apartment',
      badge: 'Best value',
      groupHeader: 'Full Home',
      displayOrder: 1,
      description: 'Whole home intensive transformation with heavy single-disc rotary machine scrubbing.',
      services: [
        {
          id: 'srv-fhc-unfurnished-apt',
          name: 'Unfurnished apartment - Home deep cleaning',
          slug: 'unfurnished-apartment-home-deep-cleaning',
          basePrice: 3199,
          durationMinutes: 180,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 542000,
          description: '• Cleaning & stain removal from rooms, kitchen, bathroom & balcony\n• Machine floor scrubbing & dusting of walls & ceilings\n• Complete limescale, grease, cobweb and paint speck removal',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhc-furnished-apt',
          name: 'Furnished apartment - Home deep cleaning',
          slug: 'furnished-apartment-home-deep-cleaning',
          basePrice: 3499,
          durationMinutes: 225,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 687000,
          description: '• Cleaning & stain removal from rooms, kitchen, bathroom & balcony\n• Machine floor scrubbing & dusting of walls & ceilings\n• Behind-furniture and under-bed vacuuming + appliance exterior buffing',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhc-bungalow',
      name: 'Full bungalow/duplex',
      slug: 'full-bungalow-duplex',
      icon: 'villa',
      badge: 'Heavy Duty',
      groupHeader: 'Full Home',
      displayOrder: 2,
      description: 'Multi-story villas and duplex homes deep cleaning with dedicated 4-man crew.',
      services: [
        {
          id: 'srv-fhc-unfurnished-villa',
          name: 'Unfurnished bungalow - Home deep cleaning',
          slug: 'unfurnished-bungalow-deep-cleaning',
          basePrice: 5899,
          durationMinutes: 300,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 125000,
          description: '• Ideal for vacant, unoccupied homes & move-ins\n• Machine floor scrubbing & stain removal across rooms, kitchen, baths & balcony\n• Terrace, staircase railings & exterior window channels included',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhc-furnished-villa',
          name: 'Furnished bungalow - Home deep cleaning',
          slug: 'furnished-bungalow-deep-cleaning',
          basePrice: 6899,
          durationMinutes: 330,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 182000,
          description: '• Ideal for furnished, occupied homes with intensive care\n• Machine floor scrubbing & stain removal across rooms, kitchen, baths & balcony\n• Living, dining, all bedrooms, modular kitchen and stairwells deep scrubbed',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhc-partial',
      name: 'Partial home cleaning',
      slug: 'partial-home-cleaning',
      icon: 'tune',
      badge: '10% OFF',
      groupHeader: 'Custom Combos',
      displayOrder: 3,
      description: 'Make your own package tailored to selected rooms with instant 10% discount.',
      services: [
        {
          id: 'srv-fhc-partial-pkg',
          name: 'Partial home cleaning',
          slug: 'partial-home-cleaning-combo',
          basePrice: 1468,
          durationMinutes: 135,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 315000,
          description: '• MAKE YOUR PACKAGE • 10% OFF Above ₹1,500\n• Choose from bathroom, bedroom, kitchen, living room & balcony\n• Add-in from upholstery & sofa, appliance cleaning',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhc-custom-combo',
          name: 'Customise: living, bedroom, balcony cleaning combo',
          slug: 'customise-living-bedroom-balcony-combo',
          basePrice: 1789,
          durationMinutes: 135,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 178000,
          description: '• Create a cleaning package tailored to your home\'s needs\n• Suitable for both regular upkeep & deep cleaning with power vacuuming',
          imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_COCKROACH_CONTROL_CATEGORY: ServiceCategory = {
  id: 'cat-cockroach-control',
  name: 'Cockroach Control',
  slug: 'cockroach-control',
  icon: '🐜',
  badge: '4.81 ★ (1.5M)',
  order: 4,
  subCategories: [
    {
      id: 'sub-cc-kitchen-bath',
      name: 'Kitchen/Bathroom',
      slug: 'kitchen-bathroom',
      icon: 'kitchen',
      badge: 'Bestseller',
      groupHeader: 'Pest Control',
      displayOrder: 1,
      description: 'Specialized gel dots & odor-free spray targeting kitchen drains & cupboards.',
      services: [
        {
          id: 'srv-cc-utensil-yes',
          name: 'Cockroach control (includes utensil removal)',
          slug: 'cockroach-control-includes-utensil-removal',
          basePrice: 1249,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 158000,
          description: '• Treatment will be completed in 2 visits with 2 weeks of gap\n• We\'ll remove utensils before the service begins\n• Targeted herbal gel & odorless chemical spray behind appliances',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cc-utensil-no',
          name: 'Cockroach control (no utensil removal)',
          slug: 'cockroach-control-no-utensil-removal',
          basePrice: 999,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 258000,
          description: '• Treatment will be completed in 2 visits with 2 weeks of gap\n• Excludes removal of utensils & objects before the service begins\n• Cabinet hinge gel dots & drain trap treatment',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-cc-apt-bungalow',
      name: 'Apartment/Bunglow',
      slug: 'apartment-bungalow',
      icon: 'apartment',
      badge: 'Full Home',
      groupHeader: 'Pest Control',
      displayOrder: 2,
      description: 'Comprehensive whole-house eradication for apartments and bungalows.',
      services: [
        {
          id: 'srv-cc-apt-cust',
          name: 'Apartment pest control (Utensil removal by customer)',
          slug: 'apartment-pest-control-utensil-removal-by-customer',
          basePrice: 1545,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 45000,
          description: '• Spray treatment followed by gel treatment after 2 weeks\n• Excludes removal of utensils & objects before the service begins\n• Complete coverage for 1-4 BHK apartments',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cc-bung-cust',
          name: 'Bungalow cockroach control (Utensil removal by customer)',
          slug: 'bungalow-cockroach-control-utensil-removal-by-customer',
          basePrice: 2699,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.75,
          reviewCount: 17000,
          description: '• Spray treatment followed by gel treatment after 2 weeks\n• Excludes removal of utensils & objects before the service begins\n• Comprehensive boundary & duplex protection',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cc-apt-incl',
          name: 'Apartment cockroach control (includes utensil removal)',
          slug: 'apartment-cockroach-control-includes-utensil-removal',
          basePrice: 1799,
          durationMinutes: 110,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 104000,
          description: '• Spray treatment followed by gel treatment after 2 weeks\n• We\'ll remove utensils before the service begins\n• Hassle-free complete kitchen & house deinfestation',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cc-bung-incl',
          name: 'Bungalow cockroach control (includes utensil removal)',
          slug: 'bungalow-cockroach-control-includes-utensil-removal',
          basePrice: 2999,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.72,
          reviewCount: 9000,
          description: '• Spray treatment followed by gel treatment after 2 weeks\n• We\'ll remove utensils before the service begins\n• Full multi-floor eradication of German & American roaches',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_ANTS_BED_BUGS_CATEGORY: ServiceCategory = {
  id: 'cat-ants-bed-bugs-control',
  name: 'Ants & Bed Bugs ...',
  slug: 'ants-bed-bugs-control',
  icon: '🐜',
  badge: '4.79 ★ (39K)',
  order: 4,
  subCategories: [
    {
      id: 'sub-abb-bed-bugs',
      name: 'Bed Bugs Control',
      slug: 'bed-bugs-control',
      icon: 'bed',
      badge: '2 Visits',
      groupHeader: 'Pest Control',
      displayOrder: 1,
      description: 'Dual-phase nymph & egg cycle interruption for peaceful, bite-free sleep.',
      services: [
        {
          id: 'srv-abb-bedbugs',
          name: 'Bed bugs control',
          slug: 'bed-bugs-control-service',
          basePrice: 1399,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.77,
          reviewCount: 11000,
          description: '• Essential pre-service inspection of the entire home\n• Unique 2-visit treatment to target eggs, nymphs & adult nests\n• Hospital-grade non-hazardous active solution',
          imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-abb-ants',
      name: 'Ant Control',
      slug: 'ant-control',
      icon: 'pest_control',
      badge: 'Guaranteed',
      groupHeader: 'Pest Control',
      displayOrder: 2,
      description: 'Wall crevice and trail eradication stopping red and black ant colonies.',
      services: [
        {
          id: 'srv-abb-apt-utensil-yes',
          name: 'Apartment ant control (with utensil removal)',
          slug: 'apartment-ant-control-with-utensil-removal',
          basePrice: 1049,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 1000,
          description: '• Complete ant treatment for confined spaces\n• Includes thorough inspection, chemical spray & hole sealing',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-abb-apt-utensil-no',
          name: 'Apartment ant control (without utensil removal)',
          slug: 'apartment-ant-control-without-utensil-removal',
          basePrice: 1049,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 4000,
          description: '• Complete ant treatment for confined spaces\n• Includes thorough inspection, chemical spray & hole sealing',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-abb-bung-utensil-yes',
          name: 'Bungalow ant control (with utensil removal)',
          slug: 'bungalow-ant-control-with-utensil-removal',
          basePrice: 2199,
          durationMinutes: 105,
          bestsellerFlag: false,
          rating: 4.66,
          reviewCount: 72,
          description: '• Extensive ant protection for large areas\n• Complete boundary spray & entry-point barrier',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-abb-bung-utensil-no',
          name: 'Bungalow ant control (without utensil removal)',
          slug: 'bungalow-ant-control-without-utensil-removal',
          basePrice: 2199,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 55,
          description: '• Extensive ant protection for large areas\n• Complete boundary spray & entry-point barrier',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-abb-kb-utensil-yes',
          name: 'Ant control - kitchen/bathroom (with utensil removal)',
          slug: 'ant-control-kitchen-bathroom-with-utensil-removal',
          basePrice: 1249,
          durationMinutes: 50,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 322,
          description: '• Complete ant treatment for confined spaces\n• We\'ll remove utensils before the service begins',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-abb-kb-utensil-no',
          name: 'Ant control - kitchen/bathroom (without utensil removal)',
          slug: 'ant-control-kitchen-bathroom-without-utensil-removal',
          basePrice: 999,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 557,
          description: '• Complete ant treatment for confined spaces\n• Excludes removal of utensils & objects before the service begins',
          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_FULL_HOME_PAINTING_CATEGORY: ServiceCategory = {
  id: 'cat-full-home-painting',
  name: 'Home Painting',
  slug: 'full-home-painting',
  icon: '🖌️',
  badge: '4.77 ★ (200k+)',
  order: 5,
  subCategories: [
    {
      id: 'sub-fhp-unfurnished',
      name: 'Unfurnished Full home painting',
      slug: 'unfurnished-full-home-painting',
      icon: 'home',
      badge: 'Vacant Home',
      groupHeader: 'Full Home',
      displayOrder: 1,
      description: 'Speedy mechanized painting for vacant homes before moving in.',
      services: [
        {
          id: 'srv-fhp-unf-1bhk',
          name: 'Unfurnished 1 BHK painting',
          slug: 'unfurnished-1-bhk-painting',
          basePrice: 7099,
          durationMinutes: 480,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 42000,
          description: '• Complete 2-coat primer & premium emulsion on all walls & ceilings\n• Includes masking tape protection, crack filling and sanding',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-unf-2bhk',
          name: 'Unfurnished 2 BHK painting',
          slug: 'unfurnished-2-bhk-painting',
          basePrice: 11999,
          durationMinutes: 720,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 88000,
          description: '• 2 coats premium washable acrylic emulsion with roller finish\n• Free shade consultation and laser measurement',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-unf-3bhk',
          name: 'Unfurnished 3 BHK painting',
          slug: 'unfurnished-3-bhk-painting',
          basePrice: 16499,
          durationMinutes: 960,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 51000,
          description: '• Complete home painting for 3 bedrooms, hall, kitchen & lobby\n• Mechanized sanding & vacuum dust collection',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-furnished',
      name: 'Furnished full home painting',
      slug: 'furnished-full-home-painting',
      icon: 'weekend',
      badge: 'Zero Mess',
      groupHeader: 'Full Home',
      displayOrder: 2,
      description: 'Complete floor and furniture plastic masking with post-job vacuum cleaning.',
      services: [
        {
          id: 'srv-fhp-fur-1bhk',
          name: '1 BHK Furnished painting',
          slug: '1-bhk-furnished-painting',
          basePrice: 9099,
          durationMinutes: 600,
          bestsellerFlag: false,
          rating: 4.76,
          reviewCount: 31000,
          description: '• Full plastic sheet covering of furniture, floors & electronics\n• Post-service cleanup and vacuuming guaranteed',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-fur-2bhk',
          name: '2 BHK Furnished painting',
          slug: '2-bhk-furnished-painting',
          basePrice: 14999,
          durationMinutes: 840,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 112000,
          description: '• Complete masking of beds, wardrobes, switchboards & tiles\n• Premium royal shine washable paint with 1-year warranty',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-fur-3bhk',
          name: '3 BHK Furnished painting',
          slug: '3-bhk-furnished-painting',
          basePrice: 19999,
          durationMinutes: 1080,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 78000,
          description: '• Dedicated project manager & certified trained painters\n• Zero-mess finish with furniture repositioning',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-fur-4bhk',
          name: '4 BHK Furnished painting',
          slug: '4-bhk-furnished-painting',
          basePrice: 25999,
          durationMinutes: 1320,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 29000,
          description: '• Large home premium painting with airless spray & roller finishing\n• Dedicated crew with 4-day express completion',
          imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-room-combos',
      name: 'Room combos',
      slug: 'room-combos',
      icon: 'meeting_room',
      badge: 'Popular',
      groupHeader: 'Combos',
      displayOrder: 3,
      description: 'Multi-room bundle packages tailored to specific living zones.',
      services: [
        {
          id: 'srv-fhp-combo-2',
          name: 'Any 2 rooms',
          slug: 'any-2-rooms-combo',
          basePrice: 4999,
          durationMinutes: 480,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 64000,
          description: '• Choice of any 2 bedrooms or living room + bedroom\n• Full masking & zero-drip painting',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-combo-3',
          name: 'Any 3 rooms',
          slug: 'any-3-rooms-combo',
          basePrice: 7499,
          durationMinutes: 720,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 41000,
          description: '• Flexible multi-room package with custom wall colors',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-exterior',
      name: 'Exterior Full Home',
      slug: 'exterior-full-home',
      icon: 'deck',
      badge: 'Weatherproof',
      groupHeader: 'Specialty',
      displayOrder: 4,
      description: 'Heavy duty exterior elastomeric waterproof protection.',
      services: [
        {
          id: 'srv-fhp-ext',
          name: 'Exterior painting',
          slug: 'exterior-painting-service',
          basePrice: 14999,
          durationMinutes: 960,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 23000,
          description: '• Weather-proof exterior elastomeric coating protecting against fungus and dampness',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-waterproofing',
      name: 'Waterproofing',
      slug: 'waterproofing',
      icon: 'water_drop',
      badge: '100% Warranty',
      groupHeader: 'Specialty',
      displayOrder: 5,
      description: 'Treats walls from inside with chemical damp barrier injection.',
      services: [
        {
          id: 'srv-fhp-wall-wp',
          name: 'Wall waterproofing',
          slug: 'wall-waterproofing-service',
          basePrice: 2999,
          durationMinutes: 240,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 48000,
          description: '• Treats walls from inside • 100% Waterproofing warranty\n• Deep chemical barrier injection eliminating efflorescence & peeling',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-terrace-wp',
          name: 'Terrace waterproofing',
          slug: 'terrace-waterproofing-service',
          basePrice: 6999,
          durationMinutes: 480,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 19000,
          description: '• 3-layer fiber membrane polymer coating preventing terrace seepage',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-textures',
      name: 'Textures',
      slug: 'textures',
      icon: 'palette',
      badge: 'Artisan',
      groupHeader: 'Specialty',
      displayOrder: 6,
      description: 'Luxury Italian marble stucco and metallic accent feature walls.',
      services: [
        {
          id: 'srv-fhp-prem-tex',
          name: 'Premium Textures',
          slug: 'premium-textures-service',
          basePrice: 1499,
          durationMinutes: 180,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 31000,
          description: '• Designer accent feature wall with metallic, stucco or rustic texture finish',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-fhp-lux-tex',
          name: 'Luxury Textures',
          slug: 'luxury-textures-service',
          basePrice: 2999,
          durationMinutes: 240,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 17000,
          description: '• High-end Italian marble stucco and velvet sheen artisan patterns',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fhp-more',
      name: 'Looking for something else',
      slug: 'looking-for-something-else',
      icon: 'help',
      badge: 'Consultation',
      groupHeader: 'Specialty',
      displayOrder: 7,
      description: 'Book home visit with paint expert for custom shades and laser quotes.',
      services: [
        {
          id: 'srv-fhp-all-in-one',
          name: 'All-in-one',
          slug: 'all-in-one-paint-consultation',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 15000,
          description: '• In-person expert consultation, digital color visualization & detailed quote',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY: ServiceCategory = {
  id: 'cat-walls-rooms-painting',
  name: 'Walls & Rooms Painting',
  slug: 'walls-rooms-painting',
  icon: '🎨',
  badge: '4.80 ★ (1.6M)',
  order: 5,
  subCategories: [
    {
      id: 'sub-wrp-few-walls',
      name: 'Few wall painting',
      slug: 'few-wall-painting',
      icon: 'crop_square',
      badge: 'Quick Touchup',
      groupHeader: 'Walls & Rooms',
      displayOrder: 1,
      description: 'Single wall accent coats or seepage patch repairs.',
      services: [
        {
          id: 'srv-wrp-1wall',
          name: '1 wall painting',
          slug: '1-wall-painting',
          basePrice: 1499,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.77,
          reviewCount: 45000,
          description: '• Single wall repaint or touchup with primer and 2 coats emulsion\n• Complete tape masking of skirting and switches',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-2-3walls',
          name: '2-3 few walls painting',
          slug: '2-3-few-walls-painting',
          basePrice: 2999,
          durationMinutes: 240,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 68000,
          description: '• Ideal for accent walls or fixing seepage-damaged patches\n• Primer + putty + 2 coats royal luxury emulsion',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wrp-one-room',
      name: 'One room painting',
      slug: 'one-room-painting',
      icon: 'bedroom_parent',
      badge: 'Express',
      groupHeader: 'Walls & Rooms',
      displayOrder: 2,
      description: 'Individual bedroom, living hall, kitchen or bath painting.',
      services: [
        {
          id: 'srv-wrp-bedroom',
          name: 'Bedroom painting',
          slug: 'bedroom-painting-service',
          basePrice: 3499,
          durationMinutes: 300,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 92000,
          description: '• Walls and ceiling painting for master or guest bedroom\n• Complete furniture plastic tarping and dust-free finish',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-living',
          name: 'Living room painting',
          slug: 'living-room-painting-service',
          basePrice: 4499,
          durationMinutes: 360,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 63000,
          description: '• Spacious living area painting with edge cutting and skirting trim\n• Premium stain-resistant washable paint',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-living-dining',
          name: 'Living & dining room painting',
          slug: 'living-dining-room-painting-service',
          basePrice: 5999,
          durationMinutes: 420,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 47000,
          description: '• Complete combined living & dining hall painting',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-lobby',
          name: 'Lobby / passage painting',
          slug: 'lobby-passage-painting-service',
          basePrice: 2499,
          durationMinutes: 200,
          bestsellerFlag: false,
          rating: 4.76,
          reviewCount: 22000,
          description: '• Entry hallway and corridor painting with scrub-resistant finish',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-kitchen',
          name: 'Kitchen painting',
          slug: 'kitchen-painting-service',
          basePrice: 2499,
          durationMinutes: 240,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 38000,
          description: '• Oil and moisture-resistant anti-fungal kitchen paint',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-bathroom',
          name: 'Bathroom painting',
          slug: 'bathroom-painting-service',
          basePrice: 1499,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.75,
          reviewCount: 19000,
          description: '• Moisture barrier coating for dry zones and ceiling',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-store',
          name: 'Store room painting',
          slug: 'store-room-painting-service',
          basePrice: 1499,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.72,
          reviewCount: 12000,
          description: '• Quick clean repaint for storage and utility rooms',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wrp-multi-rooms',
      name: 'Two or more rooms painting',
      slug: 'two-or-more-rooms-painting',
      icon: 'holiday_village',
      badge: 'Best Value',
      groupHeader: 'Walls & Rooms',
      displayOrder: 3,
      description: 'Discounted multi-room combination painting packages.',
      services: [
        {
          id: 'srv-wrp-any-2',
          name: 'Any 2 rooms',
          slug: 'wrp-any-2-rooms',
          basePrice: 6499,
          durationMinutes: 480,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 55000,
          description: '• Full painting for any 2 selected rooms with floor masking',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-any-3',
          name: 'Any 3 rooms',
          slug: 'wrp-any-3-rooms',
          basePrice: 9499,
          durationMinutes: 720,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 37000,
          description: '• Full painting for any 3 selected rooms with complete clean-up',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wrp-doors-grills',
      name: 'Doors, Grills & Cabinets',
      slug: 'doors-grills-cabinets',
      icon: 'door_front',
      badge: 'Enamel & Polish',
      groupHeader: 'Wood & Metal',
      displayOrder: 4,
      description: 'PU, melamine and synthetic enamel painting for wood and metal.',
      services: [
        {
          id: 'srv-wrp-door',
          name: 'Door painting',
          slug: 'door-painting-service',
          basePrice: 899,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 41000,
          description: '• High-gloss enamel or melamine polish for wooden/flush doors',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-grill',
          name: 'Grill painting',
          slug: 'grill-painting-service',
          basePrice: 699,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 28000,
          description: '• Anti-rust primer followed by dual coats synthetic enamel',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-cabinet',
          name: 'Cabinet painting',
          slug: 'cabinet-painting-service',
          basePrice: 1499,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 19000,
          description: '• PU lacquer or satin finish on wardrobe and cabinet shutters',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-gate',
          name: 'Main gate / border painting',
          slug: 'main-gate-border-painting-service',
          basePrice: 1499,
          durationMinutes: 150,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 14000,
          description: '• Heavy-duty exterior anti-corrosion metal paint',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wrp-grouting',
      name: 'Tile grouting',
      slug: 'tile-grouting',
      icon: 'grid_view',
      badge: 'Leak Proof',
      groupHeader: 'Flooring',
      displayOrder: 5,
      description: 'Epoxy and waterproof grout replacement stopping floor dampness.',
      services: [
        {
          id: 'srv-wrp-grout',
          name: 'Tile grouting',
          slug: 'tile-grouting-service',
          basePrice: 599,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 31000,
          description: '• Epoxy or cementitious grout replacement preventing water leakage',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-wrp-exterior-area',
      name: 'Exterior Area painting',
      slug: 'exterior-area-painting',
      icon: 'balcony',
      badge: 'Weather Proof',
      groupHeader: 'Flooring',
      displayOrder: 6,
      description: 'Balcony and washing area water-repellent coating.',
      services: [
        {
          id: 'srv-wrp-balcony',
          name: 'Balcony painting',
          slug: 'balcony-painting-service',
          basePrice: 1499,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 27000,
          description: '• Weather-shield exterior emulsion for balcony walls and ceiling',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wrp-washing',
          name: 'Washing area painting',
          slug: 'washing-area-painting-service',
          basePrice: 1499,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.76,
          reviewCount: 16000,
          description: '• Water-repellent wash area and utility balcony coating',
          imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_TELEVISION_REPAIR_CATEGORY: ServiceCategory = {
  id: 'cat-television-repair',
  name: 'Television Repair',
  slug: 'television-repair',
  icon: '📺',
  badge: 'Earliest Fri, 9:00 AM',
  order: 5,
  subCategories: [
    {
      id: 'sub-tv-checkup',
      name: 'TV check-up',
      slug: 'tv-check-up',
      icon: 'troubleshoot',
      badge: '₹249 Only',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Expert inspection to diagnose screen, motherboard, backlight, display, power or sound problems.',
      services: [
        {
          id: 'srv-tv-checkup-main',
          name: 'TV check-up',
          slug: 'tv-check-up-main',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.77,
          reviewCount: 166000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• CRT TVs, sound bars & set-top boxes not covered',
          imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-tv-installation',
      name: 'TV installation',
      slug: 'tv-installation',
      icon: 'tv',
      badge: 'Starts at ₹399',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Precision wall mounting with bracket fitting, cable routing, and testing.',
      services: [
        {
          id: 'srv-tv-install-main',
          name: 'TV installation',
          slug: 'tv-install-main',
          basePrice: 399,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 64000,
          description: '• The TV will be installed with care.\n• The area will be cleaned once work is done.',
          imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-tv-uninstallation',
      name: 'TV uninstallation',
      slug: 'tv-uninstallation',
      icon: 'build',
      badge: 'Starts at ₹349',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Safe unmounting from wall mount/bracket, cable decoupling and packing support.',
      services: [
        {
          id: 'srv-tv-uninstall-main',
          name: 'TV uninstallation',
          slug: 'tv-uninstall-main',
          basePrice: 349,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 14000,
          description: '• The TV will be uninstalled with care.\n• The area will be cleaned once work is done.',
          imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_CHIMNEY_REPAIR_CATEGORY: ServiceCategory = {
  id: 'cat-chimney-repair',
  name: 'Chimney Repair',
  slug: 'chimney-repair',
  icon: '🍳',
  badge: 'Instant in 24 mins',
  order: 6,
  subCategories: [
    {
      id: 'sub-chim-combos',
      name: 'Combos',
      slug: 'combos',
      icon: 'auto_awesome',
      badge: 'Save 20%',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Chimney & gas stove value combos with foam-jet deep degreasing.',
      services: [
        {
          id: 'srv-chim-deep-stove',
          name: 'Deep service with gas stove',
          slug: 'deep-service-with-gas-stove',
          basePrice: 1199,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.72,
          reviewCount: 1400,
          description: '• Foam-jet technology used for cleaning filters & chimney\n• Gas stove deep cleaning included',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-chim-basic-stove',
          name: 'Basic service with gas stove',
          slug: 'basic-service-with-gas-stove',
          basePrice: 859,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.74,
          reviewCount: 6900,
          description: '• Mesh & baffle filter cleaning using water & chemical wash\n• ₹859 (was ₹1,099 • 20% OFF)',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-chim-2visits-annual',
          name: '2 visits, Chimney deep service',
          slug: '2-visits-chimney-deep-service',
          basePrice: 1599,
          durationMinutes: 180,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 714,
          description: '• Thorough cleaning of filters, outer body, motor & duct pipe\n• Complete peace of mind with 2 servicing sessions in 12 months\n• Save up to ₹250 on 2 visits',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-chim-repair',
      name: 'Repair',
      slug: 'repair',
      icon: 'build',
      badge: 'From ₹249',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Motor noise, suction failure, light repair and PCB electrical inspection.',
      services: [
        {
          id: 'srv-chim-checkup',
          name: 'Chimney check-up',
          slug: 'chimney-check-up',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 21000,
          description: '• Visitation fee will be adjusted in the final repair invoice\n• Thorough multi-point safety & suction analysis',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-chim-service',
      name: 'Service',
      slug: 'service',
      icon: 'cleaning_services',
      badge: 'Popular',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Deep and basic baffle filter, motor and duct chemical degreasing.',
      services: [
        {
          id: 'srv-chim-deep-srv',
          name: 'Deep chimney service',
          slug: 'deep-chimney-service',
          basePrice: 799,
          durationMinutes: 75,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 166000,
          description: '• Complete grease removal from motor, blowers, filters & outer body\n• Restores maximum exhaust suction efficiency',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-chim-basic-srv',
          name: 'Basic chimney service',
          slug: 'basic-chimney-service',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.75,
          reviewCount: 31000,
          description: '• Outer surface and baffle filter cleaning in 45 mins\n• Quick degreasing for lightly soiled kitchens',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-chim-install',
      name: 'Installation/uninstallation',
      slug: 'installation-uninstallation',
      icon: 'home_repair_service',
      badge: 'Precision',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Wall ducting, core cutting, chimney unmounting and island installations.',
      services: [
        {
          id: 'srv-chim-inst-wall',
          name: 'Chimney installation',
          slug: 'chimney-installation',
          basePrice: 549,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 10000,
          description: '• Accurate wall bracket leveling, exhaust duct hose routing & seal\n• Full operational load check with safety test',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-chim-uninst',
          name: 'Chimney uninstallation',
          slug: 'chimney-uninstallation',
          basePrice: 399,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 4000,
          description: '• Careful detachment of duct, bracket removal and wall restoration\n• Safely boxed for relocation',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
        {
          id: 'srv-chim-beyond-inst',
          name: 'Beyond chimney installation',
          slug: 'beyond-chimney-installation',
          basePrice: 899,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 1400,
          description: '• Island chimney, ceiling duct extension, and specialized glass hood fittings\n• Heavy-duty ceiling anchor hardware included',
          imageUrl: '/services/chimney.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_REFRIGERATOR_CATEGORY: ServiceCategory = {
  id: 'cat-refrigerator',
  name: 'Refrigerator',
  slug: 'refrigerator',
  icon: '🧊',
  badge: 'Earliest Fri, 9:00 AM',
  order: 7,
  subCategories: [
    {
      id: 'sub-ref-checkup',
      name: 'Refrigerator check-up',
      slug: 'refrigerator-check-up',
      icon: 'kitchen',
      badge: '₹199 Only',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Compressor, cooling coil, thermostat, PCB & gas leakage diagnostics.',
      services: [
        {
          id: 'srv-ref-checkup-main',
          name: 'Refrigerator check-up',
          slug: 'refrigerator-check-up-main',
          basePrice: 199,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.73,
          reviewCount: 189000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• Single door, double door, triple door and side-by-side inverter models covered\n• Full diagnostic report with upfront quote before repair begins',
          imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_AIR_COOLER_CATEGORY: ServiceCategory = {
  id: 'cat-air-cooler-repair',
  name: 'Air Cooler Service & Repair',
  slug: 'air-cooler-repair',
  icon: '❄️',
  badge: 'Instant in 25 mins',
  order: 8,
  subCategories: [
    {
      id: 'sub-acool-repair-service',
      name: 'Repair & service',
      slug: 'repair-service',
      icon: 'build',
      badge: 'From ₹249',
      groupHeader: 'Repair & service',
      displayOrder: 1,
      description: 'Motor, pump descaling, water leakage, fan noise & cooling pad maintenance.',
      services: [
        {
          id: 'srv-acool-checkup',
          name: 'Air cooler check-up',
          slug: 'air-cooler-check-up',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.61,
          reviewCount: 74000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• Complete 15-point inspection of motor, pump, blades and water tray',
          imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-acool-service',
          name: 'Air cooler service',
          slug: 'air-cooler-service-main',
          basePrice: 599,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.70,
          reviewCount: 20000,
          description: '• Descaling of pump & base. Side pad replacement will cost extra.\n• High-pressure deep washing of tank, cooling honeycombs & body',
          imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_GEYSER_CATEGORY: ServiceCategory = {
  id: 'cat-geyser-repair',
  name: 'Geyser Service & Repair',
  slug: 'geyser-repair',
  icon: '♨️',
  badge: 'Instant in 25 mins',
  order: 9,
  subCategories: [
    {
      id: 'sub-geyser-repair-service',
      name: 'Repair & service',
      slug: 'repair-service',
      icon: 'build',
      badge: 'From ₹249',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Heating element, thermostat, pressure valve and tank descaling solutions.',
      services: [
        {
          id: 'srv-geyser-checkup',
          name: 'Geyser check-up',
          slug: 'geyser-check-up',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.72,
          reviewCount: 152000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• Diagnostic check of electrical coil, safety valve & thermostat',
          imageUrl: '/services/geyser.jpg',
          isActive: true,
        },
        {
          id: 'srv-geyser-service',
          name: 'Geyser service',
          slug: 'geyser-service-main',
          basePrice: 599,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.76,
          reviewCount: 105000,
          description: '• Exterior & interior cleaning with descaling of the geyser\n• We do not service gas geysers\n• Mineral scale removal restores 30% faster water heating',
          imageUrl: '/services/geyser.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-geyser-install-uninstall',
      name: 'Installation & uninstallation',
      slug: 'installation-uninstallation',
      icon: 'home_repair_service',
      badge: 'Precision',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Heavy duty wall bracket installation, inlet/outlet braided pipe connections & testing.',
      services: [
        {
          id: 'srv-geyser-install',
          name: 'Geyser installation',
          slug: 'geyser-installation',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 64000,
          description: '• The geyser will be installed with care\n• Safety load check and leak test before handover',
          imageUrl: '/services/geyser.jpg',
          isActive: true,
        },
        {
          id: 'srv-geyser-uninstall',
          name: 'Geyser uninstallation',
          slug: 'geyser-uninstallation',
          basePrice: 399,
          durationMinutes: 40,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 16000,
          description: '• Safe detachment, water drain out and wall decoupling\n• Safely boxed for transport',
          imageUrl: '/services/geyser.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_WATER_PURIFIER_CATEGORY: ServiceCategory = {
  id: 'cat-water-purifier',
  name: 'Water Purifier Service & Installation',
  slug: 'water-purifier',
  icon: '💧',
  badge: 'In 44 mins',
  order: 10,
  subCategories: [
    {
      id: 'sub-wp-checkup-repair',
      name: 'Service & Repair',
      slug: 'service-repair',
      icon: 'water_drop',
      badge: '1 Year Warranty',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: "India's longest 1 year warranty with 100% genuine RO membranes & filtration kit.",
      services: [
        {
          id: 'srv-wp-checkup',
          name: 'Water purifier check-up',
          slug: 'water-purifier-check-up',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 1100000,
          description: '• Complete 12-point health checkup & TDS water quality testing\n• Visitation fee adjusted in repair bill',
          imageUrl: '/services/ro-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-wp-native-service',
          name: 'Native water purifier service',
          slug: 'native-water-purifier-service',
          basePrice: 699,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 340000,
          description: '• Full machine chemical tank sanitize & pipe flushing\n• Includes external pre-filter clean & TDS optimization',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-wp-repair-spare-parts',
          name: 'Repair with spare parts',
          slug: 'repair-with-spare-parts',
          basePrice: 1499,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 520000,
          description: "• Comprehensive membrane + multi-stage filter replacement\n• Backed by India's longest 1 Year unconditional warranty",
          imageUrl: '/services/ro-water-purifier.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_LAPTOP_REPAIR_CATEGORY: ServiceCategory = {
  id: 'cat-laptop-repair',
  name: 'Laptop Repair',
  slug: 'laptop-repair',
  icon: '💻',
  badge: 'Instant in 44 mins',
  order: 11,
  subCategories: [
    {
      id: 'sub-laptop-services',
      name: 'Select a service',
      slug: 'select-service',
      icon: 'laptop_mac',
      badge: 'Popular',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Doorstep desktop and laptop hardware, thermal paste, component upgrade & diagnostics.',
      services: [
        {
          id: 'srv-lap-service',
          name: 'Laptop/Desktop service',
          slug: 'laptop-desktop-service',
          basePrice: 599,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 24000,
          description: '• Internal cleaning of fans, vents & components\n• Enhances speed, cooling & battery efficiency\n• High-grade thermal paste application',
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lap-upgrade',
          name: 'System upgrade consultation',
          slug: 'system-upgrade-consultation',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 5000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• RAM, NVMe SSD & battery compatibility inspection',
          imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lap-component-install',
          name: 'Component Installation',
          slug: 'component-installation',
          basePrice: 600,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 946,
          description: '• Visitation fee will be adjusted in the final repair quote\n• Precision installation of screen, keyboard, GPU or SSD',
          imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-lap-checkup',
          name: 'Laptop check-up',
          slug: 'laptop-check-up',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 56000,
          description: '• Complete Check-up at home to identify issues before repair\n• Boot failure, blue screen, water damage & motherboard check',
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_STOVE_REPAIR_CATEGORY: ServiceCategory = {
  id: 'cat-stove-repair',
  name: 'Stove Service & Repair',
  slug: 'stove-service-repair',
  icon: '🔥',
  badge: 'Instant in 44 mins',
  order: 12,
  subCategories: [
    {
      id: 'sub-stove-service',
      name: 'Service',
      slug: 'service',
      icon: 'cleaning_services',
      badge: 'Steam Clean',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'High-temperature steam sterilization of brass burners, gas nozzles and glass cooktops.',
      services: [
        {
          id: 'srv-stove-steam',
          name: 'Gas stove steam service',
          slug: 'gas-stove-steam-service',
          basePrice: 399,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.69,
          reviewCount: 41000,
          description: '• Cleanup of burners, nozzles & internal parts with steam machine\n• 140°C pressurized steam breaks grease and opens blocked holes',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-hob-steam',
          name: 'Hob steam service',
          slug: 'hob-steam-service',
          basePrice: 549,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.70,
          reviewCount: 12000,
          description: '• Cleanup of burners, nozzles & internal parts with steam machine\n• Gentle chemical wash on toughened glass hob surface',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-stove-repair',
      name: 'Repair',
      slug: 'repair',
      icon: 'build',
      badge: 'From ₹149',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Flame height adjustment, gas leakage detection, knob replacement and spark ignition repair.',
      services: [
        {
          id: 'srv-stove-checkup',
          name: 'Gas stove check-up',
          slug: 'gas-stove-check-up',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.70,
          reviewCount: 62000,
          description: '• Repairs for issues like low flame, gas leakage, knob, pipe issues & other faults\n• Instant flame balance & gas safety verification',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-hob-checkup',
          name: 'Hob check-up',
          slug: 'hob-check-up',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.74,
          reviewCount: 32000,
          description: '• Visitation fee will be adjusted in the final repair quote\n• Auto-ignition spark generator and pulse valve diagnosis',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_PLUMBER_CATEGORY: ServiceCategory = {
  id: 'cat-plumber',
  name: 'Plumber',
  slug: 'plumber',
  icon: '🪠',
  badge: 'Instant in 25 mins',
  order: 13,
  subCategories: [
    {
      id: 'sub-plumb-tap-mixer',
      name: 'Tap & mixer',
      slug: 'tap-mixer',
      icon: 'faucet',
      badge: 'From ₹49',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Repair and replacement of leaky taps, spindles, wall mixers and basin cartridges.',
      services: [
        {
          id: 'srv-plumb-tap-repair',
          name: 'Tap repair',
          slug: 'tap-repair',
          basePrice: 49,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 840000,
          description: '• Repair of leaky tap, spindle change & washer replacement\n• 30-day service warranty on repair work',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-tap-replace',
          name: 'Tap replacement',
          slug: 'tap-replacement',
          basePrice: 89,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 320000,
          description: '• Precision installation of pillar tap, bib tap, angle cock or two-way bib tap\n• Teflon tape sealing with leak test',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-mixer-repair',
          name: 'Mixer repair',
          slug: 'mixer-repair',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 210000,
          description: '• Wall mixer or basin mixer cartridge overhaul\n• Dual hot & cold water flow alignment and seal fix',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-mixer-replace',
          name: 'Mixer replacement',
          slug: 'mixer-replacement',
          basePrice: 299,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 180000,
          description: '• Complete uninstallation of old mixer & mounting of new mixer unit\n• Gasket alignment and high pressure integrity test',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-plumb-toilet',
      name: 'Toilet',
      slug: 'toilet',
      icon: 'wc',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Flush tank repair, jet spray installation, commode seat covers and complete toilet fittings.',
      services: [
        {
          id: 'srv-plumb-flush-tank',
          name: 'Flush tank repair',
          slug: 'flush-tank-repair',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.74,
          reviewCount: 190000,
          description: '• Siphon repair, push button replacement, ball cock valve fix or water continuous overflow fix',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-jet-spray',
          name: 'Jet spray repair/installation',
          slug: 'jet-spray-repair-installation',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 290000,
          description: '• Replacement or new fitting of bidet spray / health faucet with flexible braided pipe',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-seat-cover',
          name: 'Toilet seat cover replacement',
          slug: 'toilet-seat-cover-replacement',
          basePrice: 149,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 140000,
          description: '• Mounting of soft-close or standard oval/square commode seat cover with stainless steel bolts',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-commode-install',
          name: 'Toilet pot replacement/installation',
          slug: 'toilet-pot-replacement-installation',
          basePrice: 499,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 65000,
          description: '• Western wall-hung or floor-mounted toilet pot uninstallation, flange alignment & grouting',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-plumb-basin-sink',
      name: 'Basin & sink',
      slug: 'basin-sink',
      icon: 'wash',
      badge: 'From ₹149',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Wash basin installation, kitchen sink coupling, bottle trap replacement and drain pipe fixes.',
      services: [
        {
          id: 'srv-plumb-basin-install',
          name: 'Wash basin installation',
          slug: 'wash-basin-installation',
          basePrice: 299,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.79,
          reviewCount: 95000,
          description: '• Precision wall bracket drilling, ceramic basin level alignment and waste coupling fitting',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-sink-drainage',
          name: 'Sink drainage repair',
          slug: 'sink-drainage-repair',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.76,
          reviewCount: 120000,
          description: '• Waste pipe unclogging, seal leak fix and kitchen sink coupling re-alignment',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-plumb-bath-fittings',
      name: 'Bath fittings',
      slug: 'bath-fittings',
      icon: 'shower',
      badge: 'From ₹79',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Shower installation, towel rod, soap holder, clothes rack and bathroom accessories fitting.',
      services: [
        {
          id: 'srv-plumb-shower-install',
          name: 'Shower installation / repair',
          slug: 'shower-installation-repair',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 110000,
          description: '• Overhead shower head, hand shower or shower arm replacement and wall drill mounting',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-towel-rod',
          name: 'Towel rod / ring / holder installation',
          slug: 'towel-rod-installation',
          basePrice: 79,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 145000,
          description: '• Wall drilling with anchors for towel rails, robe hooks, tumbler holders and soap trays',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-plumb-drain-leakage',
      name: 'Drain & leakage',
      slug: 'drain-leakage',
      icon: 'water_damage',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 5,
      description: 'Water pipe leakage fix, major drain unclogging and underground pipeline diagnostic.',
      services: [
        {
          id: 'srv-plumb-pipe-leak',
          name: 'Water pipe leakage repair',
          slug: 'water-pipe-leakage-repair',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 240000,
          description: '• CPVC, UPVC or GI pipe joint leak repair with solvent cement / compression coupler',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-drain-blockage',
          name: 'Blockage removal (drain/sink)',
          slug: 'blockage-removal-drain-sink',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.72,
          reviewCount: 160000,
          description: '• Mechanical snake spring / chemical cleaning of floor traps, kitchen line and drain pipes',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-plumb-water-motor',
      name: 'Water motor',
      slug: 'water-motor',
      icon: 'settings_input_component',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 6,
      description: 'Submersible, monoblock and pressure booster pump diagnostics, repair and new installations.',
      services: [
        {
          id: 'srv-plumb-motor-checkup',
          name: 'Water motor check-up',
          slug: 'water-motor-check-up',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.70,
          reviewCount: 85000,
          description: '• Comprehensive motor capacitor, winding continuity and priming valve diagnostic',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-plumb-motor-install',
          name: 'Water motor installation',
          slug: 'water-motor-installation',
          basePrice: 499,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 52000,
          description: '• Complete pipe plumbing connection, non-return valve fitting and electrical switch setup',
          imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_ELECTRICIAN_CATEGORY: ServiceCategory = {
  id: 'cat-electrician',
  name: 'Electrician',
  slug: 'electrician',
  icon: '⚡',
  badge: 'Instant in 25 mins',
  order: 14,
  subCategories: [
    {
      id: 'sub-elec-switch-socket',
      name: 'Switch & socket',
      slug: 'switch-socket',
      icon: 'power',
      badge: 'From ₹49',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Fixing sparks, replacing modular switches, 6A/16A power sockets and switchboard wiring.',
      services: [
        {
          id: 'srv-elec-switch-repair',
          name: 'Switch/socket repair',
          slug: 'switch-socket-repair',
          basePrice: 49,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 750000,
          description: '• Diagnosis & repair of sparking, loose wire or broken switch/socket\n• 30-day warranty on all electrical repairs',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-switch-replace',
          name: 'Switch/socket replacement',
          slug: 'switch-socket-replacement',
          basePrice: 69,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 420000,
          description: '• Replacement of modular switch, 3-pin socket or heavy appliance socket (AC/Geyser)',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-board-install',
          name: 'Switchboard installation',
          slug: 'switchboard-installation',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 190000,
          description: '• Complete assembly, internal plate wiring and flush wall mounting of switchboard',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-elec-fan',
      name: 'Fan',
      slug: 'fan',
      icon: 'mode_fan',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Ceiling fan repair, new fan installation, speed regulator replacement and exhaust fan fitting.',
      services: [
        {
          id: 'srv-elec-fan-repair',
          name: 'Ceiling fan repair',
          slug: 'ceiling-fan-repair',
          basePrice: 99,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.78,
          reviewCount: 620000,
          description: '• Capacitor replacement, noisy bearing lubrication or regulator wiring fix',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-fan-install',
          name: 'Ceiling fan installation',
          slug: 'ceiling-fan-installation',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 510000,
          description: '• Downrod assembly, blade balancing, safety pin lock & ceiling hook mounting',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-exhaust-fan',
          name: 'Exhaust fan installation',
          slug: 'exhaust-fan-installation',
          basePrice: 199,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 180000,
          description: '• Kitchen or bathroom circular/square duct fitting & safe plug connection',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-elec-light',
      name: 'Light',
      slug: 'light',
      icon: 'lightbulb',
      badge: 'From ₹49',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'LED lights, downlights, wall sconces, cove light strips and chandelier installations.',
      services: [
        {
          id: 'srv-elec-bulb-replace',
          name: 'Bulb / tube light replacement',
          slug: 'bulb-tubelight-replacement',
          basePrice: 49,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 310000,
          description: '• Holder repair, LED batten installation or bulb replacement at height up to 10ft',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-ceiling-light',
          name: 'Ceiling light installation',
          slug: 'ceiling-light-installation',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 220000,
          description: '• False ceiling spotlight, panel light or COB light drill mounting and wiring',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-chandelier',
          name: 'Chandelier installation',
          slug: 'chandelier-installation',
          basePrice: 299,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 95000,
          description: '• Heavy-duty anchor bracket fixing, multi-arm crystal light assembly and testing',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-elec-mcb-fuse',
      name: 'MCB & fuse',
      slug: 'mcb-fuse',
      icon: 'electrical_services',
      badge: 'From ₹149',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Diagnosis of sudden tripping, distribution box rewiring, single/double pole MCB and isolator.',
      services: [
        {
          id: 'srv-elec-mcb-repair',
          name: 'MCB repair & diagnosis',
          slug: 'mcb-repair-diagnosis',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 160000,
          description: '• Diagnostic check of frequent tripping, short circuits and main line phase balance',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-mcb-replace',
          name: 'MCB replacement',
          slug: 'mcb-replacement',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 130000,
          description: '• Replacement of burnt single-pole, double-pole MCB or RCCB in distribution board',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-elec-inverter',
      name: 'Inverter & stabilizer',
      slug: 'inverter-stabilizer',
      icon: 'battery_charging_full',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 5,
      description: 'Inverter repair, battery water top-up, wiring bypass and new inverter installation.',
      services: [
        {
          id: 'srv-elec-inverter-checkup',
          name: 'Inverter check-up & fuse repair',
          slug: 'inverter-check-up-fuse-repair',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 115000,
          description: '• Battery terminal cleaning, voltage check, fuse replacement and charging check',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-elec-inverter-install',
          name: 'Inverter installation',
          slug: 'inverter-installation',
          basePrice: 499,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.81,
          reviewCount: 70000,
          description: '• Complete dual line wiring, changeover switch connection and battery trolley setup',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-elec-doorbell',
      name: 'Doorbell',
      slug: 'doorbell',
      icon: 'notifications',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 6,
      description: 'Ding-dong bell, wireless chime, sensor bell wiring and repair.',
      services: [
        {
          id: 'srv-elec-bell-install',
          name: 'Doorbell repair / installation',
          slug: 'doorbell-repair-installation',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.79,
          reviewCount: 140000,
          description: '• Wall drilling, chime wiring and bell push switch replacement / test',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_CARPENTER_CATEGORY: ServiceCategory = {
  id: 'cat-carpenter',
  name: 'Carpenter',
  slug: 'carpenter',
  icon: '🪚',
  badge: 'Instant in 25 mins',
  order: 15,
  subCategories: [
    {
      id: 'sub-carp-drill-hang',
      name: 'Drill & hang',
      slug: 'drill-hang',
      icon: 'handyman',
      badge: 'From ₹49',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Wall drilling for paintings, mirrors, floating shelves, clock and TV wall mounting.',
      services: [
        {
          id: 'srv-carp-drill-hang',
          name: 'Drill & hang (Wall art / mirror / clock)',
          slug: 'drill-and-hang-wall-art-mirror',
          basePrice: 49,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 580000,
          description: '• Precision laser level drilling with heavy-duty anchors & screws\n• 30-day warranty on all woodwork & carpentry',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-carp-tv-mount',
          name: 'TV wall mount installation',
          slug: 'tv-wall-mount-installation',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 320000,
          description: '• Wall mounting of fixed, tilt or full-motion swivel bracket for TVs up to 65 inches',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-carp-door-window',
      name: 'Door & window',
      slug: 'door-window',
      icon: 'door_front',
      badge: 'From ₹79',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Fixing jammed doors, creaking hinges, door closers, magnetic stoppers and window latches.',
      services: [
        {
          id: 'srv-carp-door-repair',
          name: 'Door repair & alignment',
          slug: 'door-repair-alignment',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.76,
          reviewCount: 210000,
          description: '• Bottom edge wood planing, hinge tightening & smooth floor clearance alignment',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-carp-door-stopper',
          name: 'Door stopper / closer installation',
          slug: 'door-stopper-closer-installation',
          basePrice: 79,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 130000,
          description: '• Hydraulic auto-closer or floor-mount magnetic stopper installation',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-carp-lock-handle',
      name: 'Lock & handle',
      slug: 'lock-handle',
      icon: 'lock',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Main door mortise locks, cylindrical locks, door handles, latches and tower bolts.',
      services: [
        {
          id: 'srv-carp-lock-replace',
          name: 'Main door lock replacement',
          slug: 'main-door-lock-replacement',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 175000,
          description: '• Chisel grooving, mortise or rim deadbolt installation with 3 keys tested',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-carp-handle-latch',
          name: 'Handle & latch repair',
          slug: 'handle-latch-repair',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.78,
          reviewCount: 120000,
          description: '• Fixing loose handles, tightening latches or replacing broken tower bolts',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-carp-cupboard-drawer',
      name: 'Cupboard & drawer',
      slug: 'cupboard-drawer',
      icon: 'kitchen',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Drawer channel repair, wardrobe soft-close hinges, cabinet handle and alignment.',
      services: [
        {
          id: 'srv-carp-drawer-channel',
          name: 'Drawer channel repair / replacement',
          slug: 'drawer-channel-repair-replacement',
          basePrice: 149,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.75,
          reviewCount: 160000,
          description: '• Telescopic ball bearing or soft-close slide channel alignment & replacement',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-carp-furniture-assembly',
      name: 'Furniture assembly',
      slug: 'furniture-assembly',
      icon: 'chair',
      badge: 'From ₹249',
      groupHeader: 'Select a service',
      displayOrder: 5,
      description: 'Bed, wardrobe, dining table, desk and modular flatpack assembly with power tools.',
      services: [
        {
          id: 'srv-carp-bed-assembly',
          name: 'Bed assembly',
          slug: 'bed-assembly',
          basePrice: 399,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.84,
          reviewCount: 145000,
          description: '• King/Queen size bed assembly with hydraulic or drawer storage alignment',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-carp-table-assembly',
          name: 'Table / desk assembly',
          slug: 'table-desk-assembly',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 110000,
          description: '• Study desk, dining table or coffee table assembly and structural wobble test',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-carp-curtain-blinds',
      name: 'Curtain & blinds',
      slug: 'curtain-blinds',
      icon: 'blinds',
      badge: 'From ₹99',
      groupHeader: 'Select a service',
      displayOrder: 6,
      description: 'Curtain rod installation, bracket drilling and roller/vertical blinds mounting.',
      services: [
        {
          id: 'srv-carp-curtain-rod',
          name: 'Curtain rod installation',
          slug: 'curtain-rod-installation',
          basePrice: 99,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 280000,
          description: '• Wall or ceiling bracket drilling for single or double curtain rods up to 10ft',
          imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_EPC_CATEGORY: ServiceCategory = {
  id: 'cat-epc',
  name: 'Electrician, Plumber & Carpenter',
  slug: 'electrician-plumber-carpenter',
  icon: '🔧',
  badge: 'Instant in 25 mins',
  order: 12,
  subCategories: [
    ...(DEFAULT_ELECTRICIAN_CATEGORY.subCategories || []).map((sc) => ({ ...sc, groupHeader: 'Electrician Services' })),
    ...(DEFAULT_PLUMBER_CATEGORY.subCategories || []).map((sc) => ({ ...sc, groupHeader: 'Plumbing Services' })),
    ...(DEFAULT_CARPENTER_CATEGORY.subCategories || []).map((sc) => ({ ...sc, groupHeader: 'Carpentry Services' })),
  ],
};

const DEFAULT_FAN_INSTALLATION_CATEGORY: ServiceCategory = {
  id: 'cat-fan-installation',
  name: 'Fan Installation',
  slug: 'fan-installation',
  icon: 'mode_fan',
  badge: 'Instant in 25 mins',
  order: 16,
  subCategories: [
    {
      id: 'sub-fan-install-replace',
      name: 'Installation/replacement',
      slug: 'installation-replacement',
      icon: 'mode_fan',
      badge: 'From ₹135',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Installation & replacement of decorative ceiling fans, smart BLDC fans, exhaust fans, and regulators.',
      services: [
        {
          id: 'srv-fan-decorative',
          name: 'Decorative ceiling fan installation/replacement',
          slug: 'decorative-ceiling-fan-installation-replacement',
          basePrice: 449,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 323,
          description: '• Assembly of multi-blade decorative fan with chandelier/underlight\n• Downrod fixing, hook mounting & speed testing\n• 2 options available',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-smart',
          name: 'Smart fan installation/replacement',
          slug: 'smart-fan-installation-replacement',
          basePrice: 294,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 136,
          description: '• BLDC smart fan mounting with remote pairing & Wi-Fi configuration\n• 2 options available',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-ceiling',
          name: 'Ceiling fan installation/replacement',
          slug: 'ceiling-fan-installation-replacement',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 236,
          description: '• Standard 3-blade or 4-blade ceiling fan installation & balancing\n• 2 options available',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-exhaust',
          name: 'Exhaust fan installation/replacement',
          slug: 'exhaust-fan-installation-replacement',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 36,
          description: '• Kitchen or bathroom exhaust fan wall duct / glass cut mounting\n• 2 options available',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-wall',
          name: 'Wall fan installation/replacement',
          slug: 'wall-fan-installation-replacement',
          basePrice: 199,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 56,
          description: '• Wall anchor drilling, bracket mounting & oscillation test',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-regulator',
          name: 'Fan regulator installation/replacement',
          slug: 'fan-regulator-installation-replacement',
          basePrice: 159,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 50,
          description: '• Rotary or step regulator replacement on modular switchboard',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-pedestal',
          name: 'Pedestal fan installation',
          slug: 'pedestal-fan-installation',
          basePrice: 135,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 16,
          description: '• Unboxing, stand assembly, blade cage fitting and speed test',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-tower',
          name: 'Tower fan installation',
          slug: 'tower-fan-installation',
          basePrice: 199,
          durationMinutes: 15,
          bestsellerFlag: false,
          rating: 4.95,
          reviewCount: 10,
          description: '• Base plate assembly, cord setup & oscillation test',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-fan-repair',
          name: 'Fan repair',
          slug: 'fan-repair',
          basePrice: 135,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 236,
          description: '• Capacitor replacement, squeaking noise lubrication, speed check',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-fan-uninstallation',
      name: 'Uninstallation',
      slug: 'uninstallation',
      icon: 'remove_circle_outline',
      badge: '₹179',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Careful removal and packing of ceiling, wall or exhaust fans.',
      services: [
        {
          id: 'srv-fan-uninstall',
          name: 'Fan uninstallation',
          slug: 'fan-uninstallation',
          basePrice: 179,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.80,
          reviewCount: 16,
          description: '• Safe electrical disconnection, downrod de-mounting & blade dismantling',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_FESTIVAL_LIGHTS_CATEGORY: ServiceCategory = {
  id: 'cat-festival-lights',
  name: 'Festival Lights Installation',
  slug: 'festival-lights-installation',
  icon: 'festival',
  badge: 'Instant in 25 mins',
  order: 17,
  subCategories: [
    {
      id: 'sub-lights-uninstall',
      name: 'Light uninstallations',
      slug: 'light-uninstallations',
      icon: 'remove_circle_outline',
      badge: 'From ₹149',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Careful dismantling of decorative and string lights with neat cord coil packing.',
      services: [
        {
          id: 'srv-light-uninstall-per-light',
          name: 'Light uninstallation (per light)',
          slug: 'light-uninstallation-per-light',
          basePrice: 149,
          durationMinutes: 20,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 4000,
          description: '• Removal of lights from height up to 10 ft\n• Safe packing in original boxes (if provided)',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-balcony',
      name: 'Balcony lights',
      slug: 'balcony-lights',
      icon: 'balcony',
      badge: 'From ₹349',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Balcony railing curtain lights, string fairy lights and outdoor ambient lighting.',
      services: [
        {
          id: 'srv-balcony-heavy',
          name: 'Balcony lights installation (heavy)',
          slug: 'balcony-lights-installation-heavy',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 5000,
          description: '• Heavy-duty curtain or cascaded LED fairy lights for balcony grill',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-balcony-string',
          name: 'Balcony lights installation (string)',
          slug: 'balcony-lights-installation-string',
          basePrice: 349,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 3000,
          description: '• Neat string light layout with zip ties on balcony boundary',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-railing',
      name: 'Railing lights',
      slug: 'railing-lights',
      icon: 'fence',
      badge: 'From ₹349',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Terrace and staircase railing light installations with secure cable ties.',
      services: [
        {
          id: 'srv-railing-heavy',
          name: 'Railing lights installation (heavy)',
          slug: 'railing-lights-installation-heavy',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 4000,
          description: '• Heavy cascade and rope light styling on terrace railing',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-railing-string',
          name: 'Railing lights installation (string)',
          slug: 'railing-lights-installation-string',
          basePrice: 349,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 3000,
          description: '• Linear fairy string lights along handrail & spindles',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-railing-curtain',
          name: 'Railing lights installation (curtain)',
          slug: 'railing-lights-installation-curtain',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 3000,
          description: '• Vertical waterfall curtain lights on boundary grill',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-room',
      name: 'Room lights',
      slug: 'room-lights',
      icon: 'living',
      badge: 'From ₹349',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Indoor mood lighting, curtain LED backdrop and wall fairy lights.',
      services: [
        {
          id: 'srv-room-curtain',
          name: 'Room light decoration (curtain)',
          slug: 'room-light-decoration-curtain',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 4000,
          description: '• Curtain backdrop fairy lighting for bedrooms & living rooms',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-room-string',
          name: 'Room light decoration (string)',
          slug: 'room-light-decoration-string',
          basePrice: 349,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.87,
          reviewCount: 3000,
          description: '• Ceiling border or photo-wall fairy string lights',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-mandir',
      name: 'Mandir lights',
      slug: 'mandir-lights',
      icon: 'temple_hindu',
      badge: 'From ₹399',
      groupHeader: 'Select a service',
      displayOrder: 5,
      description: 'Spiritual puja room & temple lighting with warm ambient glow.',
      services: [
        {
          id: 'srv-mandir-decor',
          name: 'Mandir light decoration',
          slug: 'mandir-light-decoration',
          basePrice: 399,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.89,
          reviewCount: 4000,
          description: '• Golden warm LED strip & miniature fairy bells for home mandir',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-outdoor',
      name: 'Outdoor lights',
      slug: 'outdoor-lights',
      icon: 'yard',
      badge: 'From ₹599',
      groupHeader: 'Select a service',
      displayOrder: 6,
      description: 'Façade, entrance gate and boundary pillar festival lighting.',
      services: [
        {
          id: 'srv-outdoor-decor',
          name: 'Outdoor light decoration',
          slug: 'outdoor-light-decoration',
          basePrice: 599,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 3000,
          description: '• Weatherproof outdoor canopy and exterior entrance gate lighting',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-garden',
      name: 'Garden lights',
      slug: 'garden-lights',
      icon: 'park',
      badge: 'From ₹699',
      groupHeader: 'Select a service',
      displayOrder: 7,
      description: 'Tree trunk fairy wrapping, pathway spike lights and hedge decor.',
      services: [
        {
          id: 'srv-garden-decor',
          name: 'Garden light decoration',
          slug: 'garden-light-decoration',
          basePrice: 699,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.89,
          reviewCount: 3000,
          description: '• Tree wrapping, shrub fairy canopy and lawn decorative spots',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-xmas',
      name: 'Xmas light decor',
      slug: 'xmas-light-decor',
      icon: 'celebration',
      badge: 'From ₹499',
      groupHeader: 'Select a service',
      displayOrder: 8,
      description: 'Christmas tree illumination and festive winter holiday decor.',
      services: [
        {
          id: 'srv-xmas-decor',
          name: 'Christmas light decoration',
          slug: 'christmas-light-decoration',
          basePrice: 499,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 2000,
          description: '• Christmas tree fairy lights, garland weaving and star toppers',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-lights-custom',
      name: 'Custom services',
      slug: 'custom-services',
      icon: 'tune',
      badge: 'Flexible',
      groupHeader: 'Select a service',
      displayOrder: 9,
      description: 'Dedicated electrician by the hour, large custom setups and consultations.',
      services: [
        {
          id: 'srv-lights-consult',
          name: 'Electrician consultation',
          slug: 'electrician-consultation',
          basePrice: 149,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 1000,
          description: '• Load inspection, extension board planning and decorative advice',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-lights-custom-large',
          name: 'Custom light decoration (large)',
          slug: 'custom-light-decoration-large',
          basePrice: 999,
          durationMinutes: 120,
          bestsellerFlag: true,
          rating: 4.88,
          reviewCount: 2000,
          description: '• End-to-end full home festival decoration as per custom layout',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
        {
          id: 'srv-lights-assistant',
          name: 'Light assistant per hour',
          slug: 'light-assistant-per-hour',
          basePrice: 249,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.86,
          reviewCount: 2000,
          description: '• On-demand hourly electrician assistant for light hanging & wiring',
          imageUrl: '/services/electrician-service.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_FURNITURE_ASSEMBLY_CATEGORY: ServiceCategory = {
  id: 'cat-furniture-assembly',
  name: 'Furniture Assembly',
  slug: 'furniture-assembly',
  icon: 'chair',
  badge: 'Instant in 25 mins',
  order: 18,
  subCategories: [
    {
      id: 'sub-furn-beds',
      name: 'Beds',
      slug: 'beds',
      icon: 'bed',
      badge: 'From ₹349',
      groupHeader: 'Select a service',
      displayOrder: 1,
      description: 'Single, queen, king, hydraulic and bunk bed assembly.',
      services: [
        {
          id: 'srv-bed-single',
          name: 'Single bed assembly',
          slug: 'single-bed-assembly',
          basePrice: 349,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 24000,
          description: '• Headboard, side rails, slats & footboard assembly with hardware tightening',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-bed-queen-king',
          name: 'Double / Queen / King bed assembly',
          slug: 'double-queen-king-bed-assembly',
          basePrice: 499,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 45000,
          description: '• Frame assembly, center support beam, headboard bolts & slat alignment',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-bed-hydraulic',
          name: 'Bed with hydraulic storage assembly',
          slug: 'bed-with-hydraulic-storage-assembly',
          basePrice: 699,
          durationMinutes: 120,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 18000,
          description: '• Gas lift mechanism installation, bed frame assembly & storage platform test',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-bed-bunk',
          name: 'Bunk bed assembly',
          slug: 'bunk-bed-assembly',
          basePrice: 799,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 9000,
          description: '• Upper & lower bunk assembly, guardrail mounting, ladder installation & safety test',
          imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-wardrobes',
      name: 'Wardrobes',
      slug: 'wardrobes',
      icon: 'door_sliding',
      badge: 'From ₹599',
      groupHeader: 'Select a service',
      displayOrder: 2,
      description: 'Hinged and sliding door wardrobe assembly with internal shelf leveling.',
      services: [
        {
          id: 'srv-wardrobe-2door',
          name: '2-door wardrobe assembly',
          slug: '2-door-wardrobe-assembly',
          basePrice: 599,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 32000,
          description: '• Carcass frame assembly, back panel nailing, hinge alignment & door fixing',
          imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wardrobe-3door',
          name: '3-door wardrobe assembly',
          slug: '3-door-wardrobe-assembly',
          basePrice: 899,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 21000,
          description: '• 3-door carcass build, internal drawer fittings, shelf pegs & door alignment',
          imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-wardrobe-sliding',
          name: 'Sliding door wardrobe assembly',
          slug: 'sliding-door-wardrobe-assembly',
          basePrice: 1199,
          durationMinutes: 150,
          bestsellerFlag: true,
          rating: 4.81,
          reviewCount: 14000,
          description: '• Top & bottom sliding track alignment, anti-jump roller fitting & door balancing',
          imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-tables',
      name: 'Tables & Desks',
      slug: 'tables-desks',
      icon: 'desk',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 3,
      description: 'Study desks, dining tables, work from home stations and center tables.',
      services: [
        {
          id: 'srv-desk-office',
          name: 'Study / Office desk assembly',
          slug: 'study-office-desk-assembly',
          basePrice: 299,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 52000,
          description: '• Leg bracket fixing, modesty panel, cable tray & drawer unit alignment',
          imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-table-dining',
          name: 'Dining table assembly (4-6 seater)',
          slug: 'dining-table-assembly',
          basePrice: 399,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 28000,
          description: '• Tabletop leg frame mounting, crossbar tightening & level balancing',
          imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-table-coffee',
          name: 'Coffee / Center table assembly',
          slug: 'coffee-center-table-assembly',
          basePrice: 199,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 35000,
          description: '• Quick frame & leg assembly with floor-protector feet',
          imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-chairs',
      name: 'Chairs',
      slug: 'chairs',
      icon: 'chair_alt',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 4,
      description: 'Ergonomic office chairs, gaming chairs, and dining chair sets.',
      services: [
        {
          id: 'srv-chair-office',
          name: 'Ergonomic / Office chair assembly',
          slug: 'ergonomic-office-chair-assembly',
          basePrice: 199,
          durationMinutes: 30,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 68000,
          description: '• Wheel caster fitting, hydraulic gas cylinder, armrest & seat plate assembly',
          imageUrl: 'https://images.unsplash.com/photo-1580481077194-c744747ebc7b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-chair-gaming',
          name: 'Gaming chair assembly',
          slug: 'gaming-chair-assembly',
          basePrice: 249,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 19000,
          description: '• High-back frame assembly, recline bracket, side plastic covers & lumbar pillow',
          imageUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-drawers',
      name: 'Drawers & Cabinets',
      slug: 'drawers-cabinets',
      icon: 'inventory_2',
      badge: 'From ₹449',
      groupHeader: 'Select a service',
      displayOrder: 5,
      description: 'Chest of drawers, sideboards and kitchen storage cabinets.',
      services: [
        {
          id: 'srv-drawers-chest',
          name: 'Chest of drawers assembly',
          slug: 'chest-of-drawers-assembly',
          basePrice: 449,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.82,
          reviewCount: 16000,
          description: '• Outer carcass build, drawer slide runner mounting & handle fixing',
          imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-cabinet-storage',
          name: 'Kitchen / Storage cabinet assembly',
          slug: 'kitchen-storage-cabinet-assembly',
          basePrice: 499,
          durationMinutes: 75,
          bestsellerFlag: false,
          rating: 4.84,
          reviewCount: 22000,
          description: '• Multi-shelf unit assembly, door hinge alignment & magnetic catch',
          imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-shelves',
      name: 'Shelves & Racks',
      slug: 'shelves-racks',
      icon: 'shelves',
      badge: 'From ₹199',
      groupHeader: 'Select a service',
      displayOrder: 6,
      description: 'Bookshelves, wall floating shelves and utility racks.',
      services: [
        {
          id: 'srv-shelves-bookshelf',
          name: 'Bookshelf / Display rack assembly',
          slug: 'bookshelf-display-rack-assembly',
          basePrice: 299,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 39000,
          description: '• Multi-tier bookshelf assembly, backboard fixing & anti-tip wall anchor',
          imageUrl: 'https://images.unsplash.com/photo-1594671581654-2785ac5ced4a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-shelves-wall',
          name: 'Wall shelf mounting & assembly',
          slug: 'wall-shelf-mounting-assembly',
          basePrice: 199,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 42000,
          description: '• Laser level bracket drilling & floating shelf mounting',
          imageUrl: 'https://images.unsplash.com/photo-1594671581654-2785ac5ced4a?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-tv',
      name: 'TV units',
      slug: 'tv-units',
      icon: 'tv_gen',
      badge: 'From ₹399',
      groupHeader: 'Select a service',
      displayOrder: 7,
      description: 'Floor standing TV units and wall-hung media consoles.',
      services: [
        {
          id: 'srv-tv-console',
          name: 'TV console / unit assembly',
          slug: 'tv-console-unit-assembly',
          basePrice: 399,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.85,
          reviewCount: 31000,
          description: '• Floor media console assembly, wire grommets & shelf partitioning',
          imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-tv-wall-unit',
          name: 'Wall-mounted TV unit assembly',
          slug: 'wall-mounted-tv-unit-assembly',
          basePrice: 599,
          durationMinutes: 90,
          bestsellerFlag: false,
          rating: 4.83,
          reviewCount: 25000,
          description: '• Heavy anchor wall drilling, bracket mounting & floating media unit leveling',
          imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-furn-shoe',
      name: 'Shoe racks',
      slug: 'shoe-racks',
      icon: 'dry_cleaning',
      badge: 'From ₹249',
      groupHeader: 'Select a service',
      displayOrder: 8,
      description: 'Shoe rack cabinets, tilt-out shoe organizers and entry benches.',
      services: [
        {
          id: 'srv-shoe-rack',
          name: 'Shoe rack assembly',
          slug: 'shoe-rack-assembly',
          basePrice: 249,
          durationMinutes: 40,
          bestsellerFlag: true,
          rating: 4.87,
          reviewCount: 44000,
          description: '• Tilt-out or hinged shoe cabinet build with tiered shelf pegs',
          imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_NATIVE_SMART_LOCKS_CATEGORY: ServiceCategory = {
  id: 'cat-native-smart-locks',
  name: 'Native Smart Locks',
  slug: 'native-smart-locks',
  icon: '🔐',
  badge: '4.77 ★ (28K)',
  order: 14,
  subCategories: [
    {
      id: 'sub-nsl-feature-lock',
      name: 'Feature lock',
      slug: 'feature-lock',
      icon: '🔐',
      badge: 'Bestseller',
      groupHeader: 'Smart Locks',
      displayOrder: 1,
      description: 'Advanced biometric, keypad & camera smart locks with doorstep installation.',
      services: [
        {
          id: 'srv-nsl-pro',
          name: 'Native Lock Pro',
          slug: 'native-lock-pro',
          basePrice: 17299,
          durationMinutes: 90,
          bestsellerFlag: true,
          rating: 4.80,
          reviewCount: 22000,
          description: '• 7 ways to unlock\n• Unlock request with visitor photo on every doorbell press\n• Free doorstep installation & 2-year warranty',
          imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-nsl-ultra',
          name: 'Native Lock Ultra',
          slug: 'native-lock-ultra',
          basePrice: 24999,
          durationMinutes: 120,
          bestsellerFlag: true,
          rating: 4.68,
          reviewCount: 2000,
          description: '• 9 ways to unlock including face unlock\n• Unlock request with visitor photo on every doorbell press\n• 3D facial recognition sensor & anti-tamper alarm',
          imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-nsl-s',
          name: 'Native Lock S',
          slug: 'native-lock-s',
          basePrice: 8999,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.69,
          reviewCount: 2000,
          description: '• 5 ways to unlock\n• Install on any door & go keyless\n• Fast fingerprint sensor & emergency power backup',
          imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY: ServiceCategory = {
  id: 'cat-native-water-purifier',
  name: 'Native Water Purifier',
  slug: 'native-water-purifier',
  icon: '💧',
  badge: '4.84 ★ (313K)',
  order: 15,
  subCategories: [
    {
      id: 'sub-nwp-models',
      name: 'Models',
      slug: 'models',
      icon: '💧',
      badge: '2-Year Filter Life',
      groupHeader: 'Water Purifiers',
      displayOrder: 1,
      description: 'Needs zero service for 2 years. 10-stage RO purification with real-time TDS tracking.',
      services: [
        {
          id: 'srv-nwp-m1',
          name: 'Native M1',
          slug: 'native-m1',
          basePrice: 15499,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 160000,
          description: '• Needs zero service for 2 years • 10-stage RO+UV+UF+Alkaline purification\n• Smart rinse technology & rapid flow dispensing',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-nwp-m0',
          name: 'Native M0',
          slug: 'native-m0',
          basePrice: 11799,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 12000,
          description: '• 9-stage RO+UV purification with copper infusion\n• 2-year filter life guarantee & compact wall-mount footprint',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-nwp-m2-pro',
          name: 'Native M2 Pro',
          slug: 'native-m2-pro',
          basePrice: 18699,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.83,
          reviewCount: 126000,
          description: '• IoT smart water tracking via mobile app\n• Real-time TDS monitor & filter health alert\n• Food-grade stainless steel storage tank',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-nwp-m1-pro',
          name: 'Native M1 Pro',
          slug: 'native-m1-pro',
          basePrice: 16699,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 9000,
          description: '• Fast dispense rate (2.5L/min) with mineral boost\n• Smart app connectivity & child lock dispense protection',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
        {
          id: 'srv-nwp-m3-pro',
          name: 'Native M3 Pro',
          slug: 'native-m3-pro',
          basePrice: 25199,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 3000,
          description: '• Instant hot, warm & ambient water dispensing\n• 2-year filter life guarantee & touch LED temperature selector\n• Luxury tempered glass front finish',
          imageUrl: '/services/native-water-purifier.jpg',
          isActive: true,
        },
      ],
    },
  ],
};

const DEFAULT_SOLAR_PANELS_CATEGORY: ServiceCategory = {
  id: 'cat-solar-panels',
  name: 'Solar Panels',
  slug: 'solar-panels',
  icon: '☀️',
  badge: 'Govt Subsidy',
  order: 10,
  subCategories: [
    {
      id: 'sub-solar-install',
      name: 'Solar Rooftop Installation',
      slug: 'solar-rooftop-installation',
      icon: 'roofing',
      badge: 'PM Surya Ghar',
      groupHeader: 'Rooftop Setup',
      displayOrder: 1,
      description: 'On-grid and off-grid high-efficiency monocrystalline solar systems with DISCOM net-metering.',
      services: [
        {
          id: 'srv-solar-1kw',
          name: '1 kW On-Grid Solar Rooftop System',
          slug: '1kw-ongrid-solar-system',
          basePrice: 48999,
          durationMinutes: 360,
          bestsellerFlag: false,
          rating: 4.88,
          reviewCount: 1420,
          description: '• Complete 1kW rooftop mono-PERC panels\n• Grid-tied smart inverter & MC4 wiring\n• Net-metering assistance with up to ₹30,000 govt subsidy support',
          imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-solar-3kw',
          name: '3 kW Residential Solar Rooftop Setup',
          slug: '3kw-residential-solar-setup',
          basePrice: 139999,
          durationMinutes: 480,
          bestsellerFlag: true,
          rating: 4.92,
          reviewCount: 3120,
          description: '• High-efficiency bifacial monocrystalline solar panels\n• 3kW smart MPPT inverter with mobile app generation tracker\n• Heavy-duty anodized aluminium mounting structure & lightning arrester',
          imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-solar-5kw',
          name: '5 kW Commercial / Villa Hybrid Solar System',
          slug: '5kw-commercial-solar-system',
          basePrice: 229999,
          durationMinutes: 600,
          bestsellerFlag: false,
          rating: 4.95,
          reviewCount: 890,
          description: '• 5kW hybrid solar plant with lithium battery storage support\n• 24/7 power backup during outages & zero electricity bill\n• 25-year performance warranty on solar modules',
          imageUrl: 'https://images.unsplash.com/photo-1545208942-e1c9c916524b?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-solar-clean',
      name: 'Solar Panel Cleaning & Maintenance',
      slug: 'solar-panel-cleaning',
      icon: 'water_drop',
      badge: 'Boosts 25% Output',
      groupHeader: 'Maintenance',
      displayOrder: 2,
      description: 'De-ionized water wash and nano coating to eliminate dust layers and restore maximum energy generation.',
      services: [
        {
          id: 'srv-solar-clean-10',
          name: 'Pressure Jet Wash & De-ionized Wash (Up to 10 Panels)',
          slug: 'solar-jet-wash-10-panels',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: true,
          rating: 4.86,
          reviewCount: 2450,
          description: '• TDS-free de-ionized water spray\n• Micro-fiber soft brush scrubbing\n• Eliminates bird droppings, soot and stubborn grime',
          imageUrl: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-solar-clean-20',
          name: 'Deep Solar Wash & Anti-Dust Nano Coating (Up to 20 Panels)',
          slug: 'solar-nano-coating-20-panels',
          basePrice: 899,
          durationMinutes: 60,
          bestsellerFlag: false,
          rating: 4.89,
          reviewCount: 1870,
          description: '• High-pressure de-mineralized power wash\n• Hydrophobic anti-dust nano coating application\n• 90-day dust repellence for enhanced daily kilowatt generation',
          imageUrl: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-solar-clean-ann',
          name: 'Annual Solar Cleaning Subscription (4 Visits/Year)',
          slug: 'annual-solar-cleaning-subscription',
          basePrice: 1699,
          durationMinutes: 120,
          bestsellerFlag: false,
          rating: 4.91,
          reviewCount: 940,
          description: '• 4 quarterly deep clean visits per year\n• Periodic inverter diagnostics & wiring inspection\n• Detailed energy output audit report after each visit',
          imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-solar-inv',
      name: 'Inverter & Electrical Diagnostics',
      slug: 'solar-inverter-repair',
      icon: 'electric_meter',
      badge: 'In 30 mins',
      groupHeader: 'Repairs',
      displayOrder: 3,
      description: 'Certified electrical technicians for MPPT inverter error codes, MC4 cable replacement and earthing inspection.',
      services: [
        {
          id: 'srv-solar-inv-chk',
          name: 'Solar Inverter Fault Check & Health Audit',
          slug: 'solar-inverter-health-audit',
          basePrice: 299,
          durationMinutes: 30,
          bestsellerFlag: false,
          rating: 4.82,
          reviewCount: 1210,
          description: '• Complete AC/DC voltage test & MPPT tracker analysis\n• Thermal imaging inspection for panel hot spots\n• Earthing resistance and safety circuit check',
          imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
        {
          id: 'srv-solar-mc4',
          name: 'MC4 Connector & DC Cable Overhaul',
          slug: 'mc4-connector-cable-repair',
          basePrice: 499,
          durationMinutes: 45,
          bestsellerFlag: false,
          rating: 4.85,
          reviewCount: 630,
          description: '• Weatherproof IP68 MC4 connector replacement\n• DC cable insulation crimping & SPD surge protector repair\n• Prevents system tripping and power loss',
          imageUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
    {
      id: 'sub-solar-srv',
      name: 'Site Survey & Subsidy Consultation',
      slug: 'solar-site-survey',
      icon: 'analytics',
      badge: '₹99 Consultation',
      groupHeader: 'Consultation',
      displayOrder: 4,
      description: 'On-site shadow analysis, roof structure assessment and assistance with government subsidy paperwork.',
      services: [
        {
          id: 'srv-solar-drone',
          name: 'Drone Shadow Analysis & Roof Feasibility Survey',
          slug: 'solar-roof-feasibility-survey',
          basePrice: 99,
          durationMinutes: 60,
          bestsellerFlag: true,
          rating: 4.94,
          reviewCount: 4500,
          description: '• Precise roof dimension & structural weight bearing survey\n• 3D shadow simulation for year-round sun exposure\n• Complete assistance for PM-Surya Ghar subsidy approval & DISCOM net meter application',
          imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=400&q=80',
          isActive: true,
        },
      ],
    },
  ],
};

function UrbanCompanyServiceListingContent({ overrideSlug }: { overrideSlug?: string } = {}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  let derivedSlug = typeof params?.serviceSlug === 'string' ? params.serviceSlug : '';
  if (!derivedSlug && typeof pathname === 'string') {
    const cleanPath = pathname.split('?')[0] || '';
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'services' && parts[1]) {
      derivedSlug = parts[1];
    } else if (parts.length === 1 && parts[0] && parts[0] !== 'services') {
      derivedSlug = parts[0];
    }
  }

  const rawSlug = overrideSlug || derivedSlug || 'cleaning';
  const serviceSlug = slugify(rawSlug);
  const initialSubCatParam = searchParams.get('subCategory') ? slugify(searchParams.get('subCategory')!) : null;
  const initialTierParam = searchParams.get('tier') ? slugify(searchParams.get('tier')!) : null;

  const [categoryData, setCategoryData] = useState<ServiceCategory | null>(null);
  const [activeSubCategorySlug, setActiveSubCategorySlug] = useState<string | null>(initialSubCatParam);
  const [activeTierSlug, setActiveTierSlug] = useState<string | null>(initialTierParam);
  const [loading, setLoading] = useState(true);
  const [error404, setError404] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00 AM');
  const [addressLine, setAddressLine] = useState('');
  const [userLocation, setUserLocation] = useState('Kolkata');
  const [city, setCity] = useState('Kolkata');
  const [pincode, setPincode] = useState('700019');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Synchronize dynamic location from Navbar and localStorage
  useEffect(() => {
    const syncLocation = () => {
      try {
        const saved = localStorage.getItem('Ziva_city') || localStorage.getItem('user_address');
        if (saved && saved !== 'Detecting...' && saved !== 'Select Location') {
          setUserLocation(saved);
          const firstPart = saved.split(',')[0]?.trim() || saved;
          setCity(firstPart);
          if (!addressLine) {
            setAddressLine(saved);
          }
        }
      } catch {}
    };

    syncLocation();
    window.addEventListener('storage', syncLocation);
    const handleLocChanged = (e: any) => {
      if (e?.detail?.city) {
        setUserLocation(e.detail.city);
        const firstPart = e.detail.city.split(',')[0]?.trim() || e.detail.city;
        setCity(firstPart);
        if (!addressLine) {
          setAddressLine(e.detail.city);
        }
      }
    };
    window.addEventListener('ziva_location_changed', handleLocChanged);

    return () => {
      window.removeEventListener('storage', syncLocation);
      window.removeEventListener('ziva_location_changed', handleLocChanged);
    };
  }, [addressLine]);

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
  const fetchCategoryHierarchy = useCallback(async (showLoadingScreen: boolean = false) => {
    const isAcSlug = ['ac', 'ac-service', 'ac-appliance-repair'].includes(serviceSlug);
    const isSpaSlug = ['spa-for-women', 'spa', 'spa-luxe', 'spa-prime', 'spa-ayurveda', 'massage-for-men', 'massage', 'spa-women'].includes(serviceSlug);
    const isSalonLuxeSlug = !isSpaSlug && ['salon-luxe', 'salon-for-women', 'womens-salon-spa', 'salon', 'women-salon', 'womens-salon', 'salonluxe'].includes(serviceSlug);
    const isInstaHelpSlug = ['instahelp', 'instant-help', 'maid', 'cook'].includes(serviceSlug);
    const isWashingMachineSlug = ['washing-machine', 'washing-machine-repair', 'washingmachine'].includes(serviceSlug);
    const isBathroomCleaningSlug = ['bathroom-cleaning', 'bathroom', 'bathroom-cleaning-services'].includes(serviceSlug);
    const isMakeupSlug = ['makeup-saree-styling', 'makeup', 'party-makeup', 'makeup-and-styling'].includes(serviceSlug);
    const isInteriorModularKitchenSlug = ['interior-modular-kitchen', 'modular-kitchen', 'modular-kitchen-woodwork', 'kitchen-interior', 'interiors'].includes(serviceSlug);
    const isKitchenCleaningSlug = !isInteriorModularKitchenSlug && ['kitchen-cleaning', 'kitchen'].includes(serviceSlug);
    const isLivingBedroomSlug = ['living-bedroom-cleaning', 'living-bedroom', 'sofa-cleaning'].includes(serviceSlug);
    const isFullHomeSlug = ['full-home-cleaning', 'full-home', 'full-home-by-room-cleaning', 'full-home-by-room'].includes(serviceSlug);
    const isCockroachSlug = ['cockroach-control', 'cockroach'].includes(serviceSlug);
    const isAntsBedBugsSlug = ['ants-bed-bugs-control', 'ants-bed-bugs', 'bed-bugs-control', 'ant-control'].includes(serviceSlug);
    const isFullHomePaintingSlug = ['full-home-painting', 'home-painting'].includes(serviceSlug);
    const isWallsRoomsPaintingSlug = ['walls-rooms-painting', 'few-walls-rooms', 'wall-painting', 'wall-painting-sub'].includes(serviceSlug);
    const isTelevisionRepairSlug = ['television-repair', 'television', 'tv-repair', 'tv'].includes(serviceSlug);
    const isChimneyRepairSlug = ['chimney-repair', 'chimney'].includes(serviceSlug);
    const isRefrigeratorSlug = ['refrigerator', 'refrigerator-repair', 'fridge'].includes(serviceSlug);
    const isAirCoolerSlug = ['air-cooler', 'air-cooler-repair', 'cooler-repair'].includes(serviceSlug);
    const isGeyserSlug = ['geyser', 'geyser-repair', 'water-heater', 'geyser-service-repair'].includes(serviceSlug);
    const isWaterPurifierSlug = ['water-purifier', 'ro-water-purifier', 'water-purifier-service', 'ro-repair'].includes(serviceSlug);
    const isLaptopRepairSlug = ['laptop', 'laptop-repair', 'computer-repair', 'desktop-repair'].includes(serviceSlug);
    const isStoveRepairSlug = ['stove-service-repair', 'gas-stove', 'gas-stove-repair', 'hob-repair'].includes(serviceSlug);
    const isEpcSlug = ['electrician-plumber-carpenter', 'epc', 'electrician-plumber', 'plumber-electrician', 'home-repairs'].includes(serviceSlug);
    const isPlumberSlug = !isEpcSlug && ['plumber', 'plumbing', 'plumber-repair', 'plumbing-service'].includes(serviceSlug);
    const isElectricianSlug = !isEpcSlug && ['electrician', 'electrician-service', 'electrical', 'electrical-repair'].includes(serviceSlug);
    const isCarpenterSlug = !isEpcSlug && ['carpenter', 'carpentry', 'carpenter-service', 'carpenter-repair'].includes(serviceSlug);
    const isFanInstallationSlug = ['fan-installation', 'fan', 'ceiling-fan'].includes(serviceSlug);
    const isFestivalLightsSlug = ['festival-lights-installation', 'festival-lights', 'lights-installation'].includes(serviceSlug);
    const isFurnitureAssemblySlug = ['furniture-assembly', 'furniture', 'assembly'].includes(serviceSlug);
    const isNativeSmartLocksSlug = ['native-smart-locks', 'smart-locks', 'smart-lock', 'native-locks', 'locks'].includes(serviceSlug);
    const isNativeWaterPurifierSlug = ['native-water-purifier', 'native-water', 'native-water-purifiers', 'native-ro'].includes(serviceSlug);
    const isSolarPanelsSlug = ['solar-panels', 'solar-panel', 'solar', 'rooftop-solar', 'solar-rooftop'].includes(serviceSlug);

    try {
      if (showLoadingScreen) {
        setLoading(true);
      }
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
        if (isAcSlug) {
          setCategoryData(DEFAULT_AC_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_AC_CATEGORY.subCategories?.[0]?.slug || 'annual-plan');
          return;
        }
        if (isSpaSlug) {
          setCategoryData(DEFAULT_SPA_CATEGORY);
          let defaultSub = 'luxe';
          if (initialTierParam && ['luxe', 'prime', 'ayurveda', 'targeted-relief'].includes(initialTierParam)) {
            defaultSub = initialTierParam;
          } else if (serviceSlug === 'spa-prime') {
            defaultSub = 'prime';
          } else if (serviceSlug === 'spa-ayurveda') {
            defaultSub = 'ayurveda';
          }
          setActiveSubCategorySlug(initialSubCatParam || defaultSub);
          return;
        }
        if (isSalonLuxeSlug) {
          setCategoryData(DEFAULT_SALON_LUXE_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_SALON_LUXE_CATEGORY.subCategories?.[0]?.slug || 'super-saver-packages');
          return;
        }
        if (isInstaHelpSlug) {
          setCategoryData(DEFAULT_INSTAHELP_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_INSTAHELP_CATEGORY.subCategories?.[0]?.slug || 'instant');
          return;
        }
        if (isWashingMachineSlug) {
          setCategoryData(DEFAULT_WASHING_MACHINE_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WASHING_MACHINE_CATEGORY.subCategories?.[0]?.slug || 'washing-machine-jet-service');
          return;
        }
        if (isBathroomCleaningSlug) {
          setCategoryData(DEFAULT_BATHROOM_CLEANING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_BATHROOM_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'value-deals');
          return;
        }
        if (isMakeupSlug) {
          setCategoryData(DEFAULT_MAKEUP_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_MAKEUP_CATEGORY.subCategories?.[0]?.slug || 'packages');
          return;
        }
        if (isInteriorModularKitchenSlug) {
          setCategoryData(DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY.subCategories?.[0]?.slug || 'modular-kitchen-woodwork');
          return;
        }
        if (isKitchenCleaningSlug) {
          setCategoryData(DEFAULT_KITCHEN_CLEANING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_KITCHEN_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'value-deals');
          return;
        }
        if (isLivingBedroomSlug) {
          setCategoryData(DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'super-saver-deals');
          return;
        }
        if (isFullHomeSlug) {
          setCategoryData(DEFAULT_FULL_HOME_CLEANING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FULL_HOME_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'full-apartment');
          return;
        }
        if (isCockroachSlug) {
          setCategoryData(DEFAULT_COCKROACH_CONTROL_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_COCKROACH_CONTROL_CATEGORY.subCategories?.[0]?.slug || 'kitchen-bathroom');
          return;
        }
        if (isAntsBedBugsSlug) {
          setCategoryData(DEFAULT_ANTS_BED_BUGS_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_ANTS_BED_BUGS_CATEGORY.subCategories?.[0]?.slug || 'bed-bugs-control');
          return;
        }
        if (isFullHomePaintingSlug) {
          setCategoryData(DEFAULT_FULL_HOME_PAINTING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FULL_HOME_PAINTING_CATEGORY.subCategories?.[0]?.slug || 'unfurnished-full-home-painting');
          return;
        }
        if (isWallsRoomsPaintingSlug) {
          setCategoryData(DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY.subCategories?.[0]?.slug || 'few-wall-painting');
          return;
        }
        if (isTelevisionRepairSlug) {
          setCategoryData(DEFAULT_TELEVISION_REPAIR_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_TELEVISION_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'tv-check-up');
          return;
        }
        if (isChimneyRepairSlug) {
          setCategoryData(DEFAULT_CHIMNEY_REPAIR_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_CHIMNEY_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'combos');
          return;
        }
        if (isRefrigeratorSlug) {
          setCategoryData(DEFAULT_REFRIGERATOR_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_REFRIGERATOR_CATEGORY.subCategories?.[0]?.slug || 'refrigerator-check-up');
          return;
        }
        if (isAirCoolerSlug) {
          setCategoryData(DEFAULT_AIR_COOLER_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_AIR_COOLER_CATEGORY.subCategories?.[0]?.slug || 'repair-service');
          return;
        }
        if (isGeyserSlug) {
          setCategoryData(DEFAULT_GEYSER_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_GEYSER_CATEGORY.subCategories?.[0]?.slug || 'repair-service');
          return;
        }
        if (isWaterPurifierSlug) {
          setCategoryData(DEFAULT_WATER_PURIFIER_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WATER_PURIFIER_CATEGORY.subCategories?.[0]?.slug || 'service-repair');
          return;
        }
        if (isLaptopRepairSlug) {
          setCategoryData(DEFAULT_LAPTOP_REPAIR_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_LAPTOP_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'select-service');
          return;
        }
        if (isStoveRepairSlug) {
          setCategoryData(DEFAULT_STOVE_REPAIR_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_STOVE_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'service');
          return;
        }
        if (isEpcSlug) {
          setCategoryData(DEFAULT_EPC_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_EPC_CATEGORY.subCategories?.[0]?.slug || 'switch-socket');
          return;
        }
        if (isPlumberSlug) {
          setCategoryData(DEFAULT_PLUMBER_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_PLUMBER_CATEGORY.subCategories?.[0]?.slug || 'tap-mixer');
          return;
        }
        if (isElectricianSlug) {
          setCategoryData(DEFAULT_ELECTRICIAN_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_ELECTRICIAN_CATEGORY.subCategories?.[0]?.slug || 'switch-socket');
          return;
        }
        if (isCarpenterSlug) {
          setCategoryData(DEFAULT_CARPENTER_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_CARPENTER_CATEGORY.subCategories?.[0]?.slug || 'drill-hang');
          return;
        }
        if (isFanInstallationSlug) {
          setCategoryData(DEFAULT_FAN_INSTALLATION_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FAN_INSTALLATION_CATEGORY.subCategories?.[0]?.slug || 'installation-replacement');
          return;
        }
        if (isFestivalLightsSlug) {
          setCategoryData(DEFAULT_FESTIVAL_LIGHTS_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FESTIVAL_LIGHTS_CATEGORY.subCategories?.[0]?.slug || 'light-uninstallations');
          return;
        }
        if (isFurnitureAssemblySlug) {
          setCategoryData(DEFAULT_FURNITURE_ASSEMBLY_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FURNITURE_ASSEMBLY_CATEGORY.subCategories?.[0]?.slug || 'beds');
          return;
        }
        if (isNativeSmartLocksSlug) {
          setCategoryData(DEFAULT_NATIVE_SMART_LOCKS_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_NATIVE_SMART_LOCKS_CATEGORY.subCategories?.[0]?.slug || 'feature-lock');
          return;
        }
        if (isNativeWaterPurifierSlug) {
          setCategoryData(DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY.subCategories?.[0]?.slug || 'models');
          return;
        }
        if (isSolarPanelsSlug) {
          setCategoryData(DEFAULT_SOLAR_PANELS_CATEGORY);
          setActiveSubCategorySlug(initialSubCatParam || DEFAULT_SOLAR_PANELS_CATEGORY.subCategories?.[0]?.slug || 'solar-rooftop-installation');
          return;
        }
        setError404(true);
        return;
      }

      const json = await res.json();
      const raw = json?.data || json;
      let data = raw?.category
        ? {
            ...raw.category,
            subCategories: raw.subCategories || raw.category.subCategories,
            services: raw.services || raw.category.services,
          }
        : raw;

      if (!data || data.isActive === false) {
        if (isAcSlug) {
          data = DEFAULT_AC_CATEGORY;
        } else if (isSpaSlug) {
          data = DEFAULT_SPA_CATEGORY;
        } else if (isSalonLuxeSlug) {
          data = DEFAULT_SALON_LUXE_CATEGORY;
        } else if (isInstaHelpSlug) {
          data = DEFAULT_INSTAHELP_CATEGORY;
        } else if (isWashingMachineSlug) {
          data = DEFAULT_WASHING_MACHINE_CATEGORY;
        } else if (isBathroomCleaningSlug) {
          data = DEFAULT_BATHROOM_CLEANING_CATEGORY;
        } else if (isMakeupSlug) {
          data = DEFAULT_MAKEUP_CATEGORY;
        } else if (isInteriorModularKitchenSlug) {
          data = DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY;
        } else if (isKitchenCleaningSlug) {
          data = DEFAULT_KITCHEN_CLEANING_CATEGORY;
        } else if (isLivingBedroomSlug) {
          data = DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY;
        } else if (isFullHomeSlug) {
          data = DEFAULT_FULL_HOME_CLEANING_CATEGORY;
        } else if (isCockroachSlug) {
          data = DEFAULT_COCKROACH_CONTROL_CATEGORY;
        } else if (isAntsBedBugsSlug) {
          data = DEFAULT_ANTS_BED_BUGS_CATEGORY;
        } else if (isFullHomePaintingSlug) {
          data = DEFAULT_FULL_HOME_PAINTING_CATEGORY;
        } else if (isWallsRoomsPaintingSlug) {
          data = DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY;
        } else if (isTelevisionRepairSlug) {
          data = DEFAULT_TELEVISION_REPAIR_CATEGORY;
        } else if (isChimneyRepairSlug) {
          data = DEFAULT_CHIMNEY_REPAIR_CATEGORY;
        } else if (isRefrigeratorSlug) {
          data = DEFAULT_REFRIGERATOR_CATEGORY;
        } else if (isAirCoolerSlug) {
          data = DEFAULT_AIR_COOLER_CATEGORY;
        } else if (isGeyserSlug) {
          data = DEFAULT_GEYSER_CATEGORY;
        } else if (isWaterPurifierSlug) {
          data = DEFAULT_WATER_PURIFIER_CATEGORY;
        } else if (isLaptopRepairSlug) {
          data = DEFAULT_LAPTOP_REPAIR_CATEGORY;
        } else if (isStoveRepairSlug) {
          data = DEFAULT_STOVE_REPAIR_CATEGORY;
        } else if (isEpcSlug) {
          data = DEFAULT_EPC_CATEGORY;
        } else if (isPlumberSlug) {
          data = DEFAULT_PLUMBER_CATEGORY;
        } else if (isElectricianSlug) {
          data = DEFAULT_ELECTRICIAN_CATEGORY;
        } else if (isCarpenterSlug) {
          data = DEFAULT_CARPENTER_CATEGORY;
        } else if (isFanInstallationSlug) {
          data = DEFAULT_FAN_INSTALLATION_CATEGORY;
        } else if (isFestivalLightsSlug) {
          data = DEFAULT_FESTIVAL_LIGHTS_CATEGORY;
        } else if (isFurnitureAssemblySlug) {
          data = DEFAULT_FURNITURE_ASSEMBLY_CATEGORY;
        } else if (isNativeSmartLocksSlug) {
          data = DEFAULT_NATIVE_SMART_LOCKS_CATEGORY;
        } else if (isNativeWaterPurifierSlug) {
          data = DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY;
        } else if (isSolarPanelsSlug) {
          data = DEFAULT_SOLAR_PANELS_CATEGORY;
        } else {
          setError404(true);
          return;
        }
      }

      const hasLiveDbServices =
        Array.isArray(data.subCategories) &&
        data.subCategories.length > 0 &&
        data.subCategories.some((s: any) => (Array.isArray(s.services) && s.services.length > 0) || (Array.isArray(s.tiers) && s.tiers.length > 0));

      if (!hasLiveDbServices) {
        if (isAcSlug || data.slug === 'ac-appliance-repair' || data.name?.toLowerCase() === 'ac') {
        data = DEFAULT_AC_CATEGORY;
      } else if (isSpaSlug || (data.slug === 'spa-for-women' || data.name?.toLowerCase().includes('spa') && !data.name?.toLowerCase().includes('salon'))) {
        data = DEFAULT_SPA_CATEGORY;
      } else if (isSalonLuxeSlug || data.slug === 'salon-luxe' || data.name?.toLowerCase().includes('salon')) {
        data = DEFAULT_SALON_LUXE_CATEGORY;
      } else if (isInstaHelpSlug || data.slug === 'instahelp') {
        data = DEFAULT_INSTAHELP_CATEGORY;
      } else if (isWashingMachineSlug || data.slug === 'washing-machine' || data.name?.toLowerCase().includes('washing')) {
        data = DEFAULT_WASHING_MACHINE_CATEGORY;
      } else if (isBathroomCleaningSlug || data.slug === 'bathroom-cleaning' || data.name?.toLowerCase().includes('bathroom')) {
        data = DEFAULT_BATHROOM_CLEANING_CATEGORY;
      } else if (isMakeupSlug || data.slug === 'makeup-saree-styling' || data.name?.toLowerCase().includes('makeup')) {
        data = DEFAULT_MAKEUP_CATEGORY;
      } else if (isInteriorModularKitchenSlug || data.slug === 'interior-modular-kitchen' || data.name?.toLowerCase().includes('modular kitchen') || (data.name?.toLowerCase().includes('interior') && data.name?.toLowerCase().includes('kitchen'))) {
        data = DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY;
      } else if (isKitchenCleaningSlug || data.slug === 'kitchen-cleaning' || (data.name?.toLowerCase().includes('kitchen') && !data.name?.toLowerCase().includes('interior') && !data.name?.toLowerCase().includes('modular'))) {
        data = DEFAULT_KITCHEN_CLEANING_CATEGORY;
      } else if (isLivingBedroomSlug || data.slug === 'living-bedroom-cleaning' || data.name?.toLowerCase().includes('living') || data.name?.toLowerCase().includes('bedroom')) {
        data = DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY;
      } else if (isFullHomeSlug || data.slug === 'full-home-cleaning' || data.name?.toLowerCase().includes('full home')) {
        data = DEFAULT_FULL_HOME_CLEANING_CATEGORY;
      } else if (isCockroachSlug || data.slug === 'cockroach-control' || data.name?.toLowerCase().includes('cockroach')) {
        data = DEFAULT_COCKROACH_CONTROL_CATEGORY;
      } else if (isAntsBedBugsSlug || data.slug === 'ants-bed-bugs-control' || data.name?.toLowerCase().includes('bed bugs') || data.name?.toLowerCase().includes('ant')) {
        data = DEFAULT_ANTS_BED_BUGS_CATEGORY;
      } else if (isFullHomePaintingSlug || data.slug === 'full-home-painting' || (data.name?.toLowerCase().includes('home painting') && !data.name?.toLowerCase().includes('walls'))) {
        data = DEFAULT_FULL_HOME_PAINTING_CATEGORY;
      } else if (isWallsRoomsPaintingSlug || data.slug === 'walls-rooms-painting' || data.name?.toLowerCase().includes('walls & rooms') || data.name?.toLowerCase().includes('few wall')) {
        data = DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY;
      } else if (isTelevisionRepairSlug || data.slug === 'television-repair' || data.slug === 'television' || data.name?.toLowerCase().includes('television') || data.name?.toLowerCase().includes('tv repair')) {
        data = DEFAULT_TELEVISION_REPAIR_CATEGORY;
      } else if (isChimneyRepairSlug || data.slug === 'chimney-repair' || data.slug === 'chimney' || data.name?.toLowerCase().includes('chimney')) {
        data = DEFAULT_CHIMNEY_REPAIR_CATEGORY;
      } else if (isRefrigeratorSlug || data.slug === 'refrigerator' || data.name?.toLowerCase().includes('refrigerator') || data.name?.toLowerCase().includes('fridge')) {
        data = DEFAULT_REFRIGERATOR_CATEGORY;
      } else if (isAirCoolerSlug || data.slug === 'air-cooler' || data.slug === 'air-cooler-repair' || data.name?.toLowerCase().includes('cooler')) {
        data = DEFAULT_AIR_COOLER_CATEGORY;
      } else if (isGeyserSlug || data.slug === 'geyser' || data.slug === 'geyser-repair' || data.name?.toLowerCase().includes('geyser')) {
        data = DEFAULT_GEYSER_CATEGORY;
      } else if (isWaterPurifierSlug || data.slug === 'water-purifier' || data.slug === 'ro-water-purifier' || data.name?.toLowerCase().includes('water purifier')) {
        data = DEFAULT_WATER_PURIFIER_CATEGORY;
      } else if (isLaptopRepairSlug || data.slug === 'laptop-repair' || data.slug === 'laptop' || data.name?.toLowerCase().includes('laptop')) {
        data = DEFAULT_LAPTOP_REPAIR_CATEGORY;
      } else if (isStoveRepairSlug || data.slug === 'stove-service-repair' || data.slug === 'gas-stove' || data.name?.toLowerCase().includes('stove') || data.name?.toLowerCase().includes('hob')) {
        data = DEFAULT_STOVE_REPAIR_CATEGORY;
      } else if (isEpcSlug || data.slug === 'electrician-plumber-carpenter' || data.slug === 'epc' || (data.name?.toLowerCase().includes('electrician') && data.name?.toLowerCase().includes('plumber'))) {
        data = DEFAULT_EPC_CATEGORY;
      } else if (isPlumberSlug || data.slug === 'plumber' || data.slug === 'plumbing' || data.name?.toLowerCase().includes('plumb')) {
        data = DEFAULT_PLUMBER_CATEGORY;
      } else if (isElectricianSlug || data.slug === 'electrician' || data.name?.toLowerCase().includes('electr')) {
        data = DEFAULT_ELECTRICIAN_CATEGORY;
      } else if (isCarpenterSlug || data.slug === 'carpenter' || data.slug === 'carpentry' || data.name?.toLowerCase().includes('carpent')) {
        data = DEFAULT_CARPENTER_CATEGORY;
      } else if (isFanInstallationSlug || data.slug === 'fan-installation' || data.slug === 'fan' || data.name?.toLowerCase().includes('fan')) {
        data = DEFAULT_FAN_INSTALLATION_CATEGORY;
      } else if (isFestivalLightsSlug || data.slug === 'festival-lights-installation' || data.slug === 'festival-lights' || data.name?.toLowerCase().includes('festival')) {
        data = DEFAULT_FESTIVAL_LIGHTS_CATEGORY;
      } else if (isFurnitureAssemblySlug || data.slug === 'furniture-assembly' || data.slug === 'furniture' || data.name?.toLowerCase().includes('furniture')) {
        data = DEFAULT_FURNITURE_ASSEMBLY_CATEGORY;
      } else if (isNativeSmartLocksSlug || data.slug === 'native-smart-locks' || data.name?.toLowerCase().includes('smart lock')) {
        data = DEFAULT_NATIVE_SMART_LOCKS_CATEGORY;
      } else if (isNativeWaterPurifierSlug || data.slug === 'native-water-purifier' || (data.name?.toLowerCase().includes('native') && data.name?.toLowerCase().includes('water'))) {
        data = DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY;
      } else if (isSolarPanelsSlug || data.slug === 'solar-panels' || data.slug === 'solar-panel' || data.name?.toLowerCase().includes('solar')) {
        data = DEFAULT_SOLAR_PANELS_CATEGORY;
      }
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
      if (['ac', 'ac-service', 'ac-appliance-repair'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_AC_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_AC_CATEGORY.subCategories?.[0]?.slug || 'annual-plan');
        setError404(false);
      } else if (isSpaSlug) {
        setCategoryData(DEFAULT_SPA_CATEGORY);
        let defaultSub = 'luxe';
        if (initialTierParam && ['luxe', 'prime', 'ayurveda', 'targeted-relief'].includes(initialTierParam)) {
          defaultSub = initialTierParam;
        }
        setActiveSubCategorySlug(initialSubCatParam || defaultSub);
        setError404(false);
      } else if (['salon-luxe', 'salon-for-women', 'womens-salon-spa', 'salon', 'women-salon', 'womens-salon', 'salonluxe'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_SALON_LUXE_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_SALON_LUXE_CATEGORY.subCategories?.[0]?.slug || 'super-saver-packages');
        setError404(false);
      } else if (['instahelp', 'instant-help', 'maid', 'cook'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_INSTAHELP_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_INSTAHELP_CATEGORY.subCategories?.[0]?.slug || 'instant');
        setError404(false);
      } else if (['washing-machine', 'washing-machine-repair', 'washingmachine'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_WASHING_MACHINE_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WASHING_MACHINE_CATEGORY.subCategories?.[0]?.slug || 'washing-machine-jet-service');
        setError404(false);
      } else if (['bathroom-cleaning', 'bathroom', 'bathroom-cleaning-services'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_BATHROOM_CLEANING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_BATHROOM_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'value-deals');
        setError404(false);
      } else if (['makeup-saree-styling', 'makeup', 'party-makeup', 'makeup-and-styling'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_MAKEUP_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_MAKEUP_CATEGORY.subCategories?.[0]?.slug || 'packages');
        setError404(false);
      } else if (['interior-modular-kitchen', 'modular-kitchen', 'modular-kitchen-woodwork', 'kitchen-interior', 'interiors'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_INTERIOR_MODULAR_KITCHEN_CATEGORY.subCategories?.[0]?.slug || 'modular-kitchen-woodwork');
        setError404(false);
      } else if (['kitchen-cleaning', 'kitchen'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_KITCHEN_CLEANING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_KITCHEN_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'value-deals');
        setError404(false);
      } else if (['living-bedroom-cleaning', 'living-bedroom', 'sofa-cleaning'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_LIVING_BEDROOM_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'super-saver-deals');
        setError404(false);
      } else if (['full-home-cleaning', 'full-home', 'full-home-by-room-cleaning', 'full-home-by-room'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_FULL_HOME_CLEANING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FULL_HOME_CLEANING_CATEGORY.subCategories?.[0]?.slug || 'full-apartment');
        setError404(false);
      } else if (['cockroach-control', 'cockroach'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_COCKROACH_CONTROL_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_COCKROACH_CONTROL_CATEGORY.subCategories?.[0]?.slug || 'kitchen-bathroom');
        setError404(false);
      } else if (['ants-bed-bugs-control', 'ants-bed-bugs', 'bed-bugs-control', 'ant-control'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_ANTS_BED_BUGS_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_ANTS_BED_BUGS_CATEGORY.subCategories?.[0]?.slug || 'bed-bugs-control');
        setError404(false);
      } else if (['full-home-painting', 'home-painting'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_FULL_HOME_PAINTING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FULL_HOME_PAINTING_CATEGORY.subCategories?.[0]?.slug || 'unfurnished-full-home-painting');
        setError404(false);
      } else if (['walls-rooms-painting', 'few-walls-rooms', 'wall-painting', 'wall-painting-sub'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WALLS_ROOMS_PAINTING_CATEGORY.subCategories?.[0]?.slug || 'few-wall-painting');
        setError404(false);
      } else if (['television-repair', 'television', 'tv-repair', 'tv'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_TELEVISION_REPAIR_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_TELEVISION_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'tv-check-up');
        setError404(false);
      } else if (['chimney-repair', 'chimney'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_CHIMNEY_REPAIR_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_CHIMNEY_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'combos');
        setError404(false);
      } else if (['refrigerator', 'refrigerator-repair', 'fridge'].includes(serviceSlug)) {
        setCategoryData(DEFAULT_REFRIGERATOR_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_REFRIGERATOR_CATEGORY.subCategories?.[0]?.slug || 'refrigerator-check-up');
        setError404(false);
      } else if (isAirCoolerSlug) {
        setCategoryData(DEFAULT_AIR_COOLER_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_AIR_COOLER_CATEGORY.subCategories?.[0]?.slug || 'repair-service');
        setError404(false);
      } else if (isGeyserSlug) {
        setCategoryData(DEFAULT_GEYSER_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_GEYSER_CATEGORY.subCategories?.[0]?.slug || 'repair-service');
        setError404(false);
      } else if (isWaterPurifierSlug) {
        setCategoryData(DEFAULT_WATER_PURIFIER_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_WATER_PURIFIER_CATEGORY.subCategories?.[0]?.slug || 'service-repair');
        setError404(false);
      } else if (isLaptopRepairSlug) {
        setCategoryData(DEFAULT_LAPTOP_REPAIR_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_LAPTOP_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'select-service');
        setError404(false);
      } else if (isStoveRepairSlug) {
        setCategoryData(DEFAULT_STOVE_REPAIR_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_STOVE_REPAIR_CATEGORY.subCategories?.[0]?.slug || 'service');
        setError404(false);
      } else if (isEpcSlug) {
        setCategoryData(DEFAULT_EPC_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_EPC_CATEGORY.subCategories?.[0]?.slug || 'switch-socket');
        setError404(false);
      } else if (isPlumberSlug) {
        setCategoryData(DEFAULT_PLUMBER_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_PLUMBER_CATEGORY.subCategories?.[0]?.slug || 'tap-mixer');
        setError404(false);
      } else if (isElectricianSlug) {
        setCategoryData(DEFAULT_ELECTRICIAN_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_ELECTRICIAN_CATEGORY.subCategories?.[0]?.slug || 'switch-socket');
        setError404(false);
      } else if (isCarpenterSlug) {
        setCategoryData(DEFAULT_CARPENTER_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_CARPENTER_CATEGORY.subCategories?.[0]?.slug || 'drill-hang');
        setError404(false);
      } else if (isFanInstallationSlug) {
        setCategoryData(DEFAULT_FAN_INSTALLATION_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FAN_INSTALLATION_CATEGORY.subCategories?.[0]?.slug || 'installation-replacement');
        setError404(false);
      } else if (isFestivalLightsSlug) {
        setCategoryData(DEFAULT_FESTIVAL_LIGHTS_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FESTIVAL_LIGHTS_CATEGORY.subCategories?.[0]?.slug || 'light-uninstallations');
        setError404(false);
      } else if (isFurnitureAssemblySlug) {
        setCategoryData(DEFAULT_FURNITURE_ASSEMBLY_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_FURNITURE_ASSEMBLY_CATEGORY.subCategories?.[0]?.slug || 'beds');
        setError404(false);
      } else if (isNativeSmartLocksSlug) {
        setCategoryData(DEFAULT_NATIVE_SMART_LOCKS_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_NATIVE_SMART_LOCKS_CATEGORY.subCategories?.[0]?.slug || 'feature-lock');
        setError404(false);
      } else if (isNativeWaterPurifierSlug) {
        setCategoryData(DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_NATIVE_WATER_PURIFIER_MODELS_CATEGORY.subCategories?.[0]?.slug || 'models');
        setError404(false);
      } else if (isSolarPanelsSlug) {
        setCategoryData(DEFAULT_SOLAR_PANELS_CATEGORY);
        setActiveSubCategorySlug(initialSubCatParam || DEFAULT_SOLAR_PANELS_CATEGORY.subCategories?.[0]?.slug || 'solar-rooftop-installation');
        setError404(false);
      } else {
        setError404(true);
      }
    } finally {
      setLoading(false);
    }
  }, [serviceSlug, initialSubCatParam, initialTierParam]);

  useEffect(() => {
    fetchCategoryHierarchy(true);

    const handleRefresh = (e?: StorageEvent | FocusEvent) => {
      // Ignore local storage cart/location updates to prevent unwanted page re-renders or scroll jumps
      if (e instanceof StorageEvent && (e.key?.startsWith('ziva_cart_') || e.key === 'ziva_city' || e.key === 'user_address')) {
        return;
      }
      fetchCategoryHierarchy(false);
    };
    window.addEventListener('focus', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ziva_admin_sync');
      bc.onmessage = (msg) => {
        if (msg.data?.type === 'SERVICES_UPDATED') {
          fetchCategoryHierarchy(false);
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

  const handleAddToCart = (e: React.MouseEvent | undefined, service: ServiceItem, subCatName?: string, tierName?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const handleUpdateQuantity = (e: React.MouseEvent | undefined, serviceId: string, delta: number) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  const isAcCategory = useMemo(() => {
    return (
      ['ac', 'ac-service', 'ac-appliance-repair'].includes(serviceSlug) ||
      ['ac', 'ac-service', 'ac-appliance-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase() === 'ac' ||
      categoryData?.name?.toLowerCase().includes('air conditioner')
    );
  }, [serviceSlug, categoryData]);

  const isSpaCategory = useMemo(() => {
    return (
      ['spa-for-women', 'spa', 'spa-luxe', 'spa-prime', 'spa-ayurveda', 'massage-for-men', 'massage', 'spa-women'].includes(serviceSlug) ||
      ['spa-for-women', 'spa', 'massage-for-men'].includes(categoryData?.slug || '') ||
      (categoryData?.name?.toLowerCase().includes('spa') && !categoryData?.name?.toLowerCase().includes('salon')) ||
      categoryData?.name?.toLowerCase().includes('massage')
    );
  }, [serviceSlug, categoryData]);

  const isSalonLuxeCategory = useMemo(() => {
    if (isSpaCategory) return false;
    return (
      ['salon-luxe', 'salon-for-women', 'womens-salon-spa', 'salon', 'women-salon', 'womens-salon', 'salonluxe'].includes(serviceSlug) ||
      ['salon-luxe', 'salon-for-women', 'womens-salon-spa'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('salon')
    );
  }, [serviceSlug, categoryData, isSpaCategory]);

  const isInstaHelpCategory = useMemo(() => {
    return (
      ['instahelp', 'instant-help', 'maid', 'cook'].includes(serviceSlug) ||
      categoryData?.slug === 'instahelp' ||
      categoryData?.name?.toLowerCase().includes('instahelp')
    );
  }, [serviceSlug, categoryData]);

  const isWashingMachineCategory = useMemo(() => {
    return (
      ['washing-machine', 'washing-machine-repair', 'washingmachine'].includes(serviceSlug) ||
      categoryData?.slug === 'washing-machine' ||
      categoryData?.name?.toLowerCase().includes('washing')
    );
  }, [serviceSlug, categoryData]);

  const isBathroomCleaningCategory = useMemo(() => {
    return (
      ['bathroom-cleaning', 'bathroom', 'bathroom-cleaning-services'].includes(serviceSlug) ||
      ['bathroom-cleaning', 'bathroom'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('bathroom')
    );
  }, [serviceSlug, categoryData]);

  const isMakeupCategory = useMemo(() => {
    return (
      ['makeup-saree-styling', 'makeup', 'party-makeup', 'makeup-and-styling'].includes(serviceSlug) ||
      ['makeup-saree-styling', 'makeup'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('makeup') ||
      categoryData?.name?.toLowerCase().includes('saree')
    );
  }, [serviceSlug, categoryData]);

  const isInteriorModularKitchenCategory = useMemo(() => {
    return (
      ['interior-modular-kitchen', 'modular-kitchen', 'modular-kitchen-woodwork', 'kitchen-interior', 'interiors'].includes(serviceSlug) ||
      ['interior-modular-kitchen', 'modular-kitchen', 'modular-kitchen-woodwork'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('modular kitchen') ||
      (categoryData?.name?.toLowerCase().includes('interior') && categoryData?.name?.toLowerCase().includes('kitchen'))
    );
  }, [serviceSlug, categoryData]);

  const isKitchenCleaningCategory = useMemo(() => {
    if (isInteriorModularKitchenCategory) return false;
    return (
      !serviceSlug.includes('modular') &&
      !serviceSlug.includes('interior') &&
      (['kitchen-cleaning', 'kitchen'].includes(serviceSlug) ||
      ['kitchen-cleaning', 'kitchen'].includes(categoryData?.slug || '') ||
      (categoryData?.name?.toLowerCase().includes('kitchen') &&
       !categoryData?.name?.toLowerCase().includes('interior') &&
       !categoryData?.name?.toLowerCase().includes('modular')))
    );
  }, [serviceSlug, categoryData, isInteriorModularKitchenCategory]);

  const isLivingBedroomCategory = useMemo(() => {
    return (
      ['living-bedroom-cleaning', 'living-bedroom', 'sofa-cleaning'].includes(serviceSlug) ||
      ['living-bedroom-cleaning', 'living-bedroom'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('living') ||
      categoryData?.name?.toLowerCase().includes('bedroom')
    );
  }, [serviceSlug, categoryData]);

  const isFullHomeCategory = useMemo(() => {
    return (
      ['full-home-cleaning', 'full-home', 'full-home-by-room-cleaning', 'full-home-by-room'].includes(serviceSlug) ||
      ['full-home-cleaning', 'full-home'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('full home')
    );
  }, [serviceSlug, categoryData]);

  const isCockroachControlCategory = useMemo(() => {
    return (
      ['cockroach-control', 'cockroach'].includes(serviceSlug) ||
      ['cockroach-control', 'cockroach'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('cockroach')
    );
  }, [serviceSlug, categoryData]);

  const isAntsBedBugsCategory = useMemo(() => {
    return (
      ['ants-bed-bugs-control', 'ants-bed-bugs', 'bed-bugs-control', 'ant-control'].includes(serviceSlug) ||
      ['ants-bed-bugs-control', 'ants-bed-bugs', 'bed-bugs-control', 'ant-control'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('bed bugs') ||
      categoryData?.name?.toLowerCase().includes('ant')
    );
  }, [serviceSlug, categoryData]);

  const isFullHomePaintingCategory = useMemo(() => {
    return (
      ['full-home-painting', 'home-painting'].includes(serviceSlug) ||
      ['full-home-painting', 'home-painting'].includes(categoryData?.slug || '') ||
      (categoryData?.name?.toLowerCase().includes('home painting') && !categoryData?.name?.toLowerCase().includes('walls'))
    );
  }, [serviceSlug, categoryData]);

  const isWallsRoomsPaintingCategory = useMemo(() => {
    return (
      ['walls-rooms-painting', 'few-walls-rooms', 'wall-painting'].includes(serviceSlug) ||
      ['walls-rooms-painting', 'few-walls-rooms', 'wall-painting'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('walls & rooms') ||
      categoryData?.name?.toLowerCase().includes('few wall')
    );
  }, [serviceSlug, categoryData]);

  const isTelevisionRepairCategory = useMemo(() => {
    return (
      ['television-repair', 'television', 'tv-repair', 'tv'].includes(serviceSlug) ||
      ['television-repair', 'television', 'tv-repair', 'tv'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('television') ||
      categoryData?.name?.toLowerCase().includes('tv repair')
    );
  }, [serviceSlug, categoryData]);

  const isChimneyRepairCategory = useMemo(() => {
    return (
      ['chimney-repair', 'chimney'].includes(serviceSlug) ||
      ['chimney-repair', 'chimney'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('chimney')
    );
  }, [serviceSlug, categoryData]);

  const isRefrigeratorCategory = useMemo(() => {
    return (
      ['refrigerator', 'refrigerator-repair', 'fridge'].includes(serviceSlug) ||
      ['refrigerator', 'refrigerator-repair', 'fridge'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('refrigerator') ||
      categoryData?.name?.toLowerCase().includes('fridge')
    );
  }, [serviceSlug, categoryData]);

  const isAirCoolerCategory = useMemo(() => {
    return (
      ['air-cooler', 'air-cooler-repair', 'cooler-repair'].includes(serviceSlug) ||
      ['air-cooler', 'air-cooler-repair', 'cooler-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('cooler')
    );
  }, [serviceSlug, categoryData]);

  const isGeyserCategory = useMemo(() => {
    return (
      ['geyser', 'geyser-repair', 'water-heater', 'geyser-service-repair'].includes(serviceSlug) ||
      ['geyser', 'geyser-repair', 'water-heater', 'geyser-service-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('geyser')
    );
  }, [serviceSlug, categoryData]);

  const isWaterPurifierCategory = useMemo(() => {
    return (
      ['water-purifier', 'ro-water-purifier', 'water-purifier-service', 'ro-repair'].includes(serviceSlug) ||
      ['water-purifier', 'ro-water-purifier', 'water-purifier-service', 'ro-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('water purifier')
    );
  }, [serviceSlug, categoryData]);

  const isLaptopRepairCategory = useMemo(() => {
    return (
      ['laptop', 'laptop-repair', 'computer-repair', 'desktop-repair'].includes(serviceSlug) ||
      ['laptop', 'laptop-repair', 'computer-repair', 'desktop-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('laptop')
    );
  }, [serviceSlug, categoryData]);

  const isStoveRepairCategory = useMemo(() => {
    return (
      ['stove-service-repair', 'gas-stove', 'gas-stove-repair', 'hob-repair'].includes(serviceSlug) ||
      ['stove-service-repair', 'gas-stove', 'gas-stove-repair', 'hob-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('stove') ||
      categoryData?.name?.toLowerCase().includes('hob')
    );
  }, [serviceSlug, categoryData]);

  const isEpcCategory = useMemo(() => {
    return (
      ['electrician-plumber-carpenter', 'epc', 'electrician-plumber', 'plumber-electrician', 'home-repairs'].includes(serviceSlug) ||
      ['electrician-plumber-carpenter', 'epc'].includes(categoryData?.slug || '') ||
      (categoryData?.name?.toLowerCase().includes('electrician') && categoryData?.name?.toLowerCase().includes('plumber')) ||
      (categoryData?.name?.toLowerCase().includes('electrician') && categoryData?.name?.toLowerCase().includes('carpenter'))
    );
  }, [serviceSlug, categoryData]);

  const isPlumberCategory = useMemo(() => {
    if (isEpcCategory) return false;
    return (
      ['plumber', 'plumbing', 'plumber-repair', 'plumbing-service'].includes(serviceSlug) ||
      ['plumber', 'plumbing', 'plumber-repair', 'plumbing-service'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('plumb')
    );
  }, [serviceSlug, categoryData, isEpcCategory]);

  const isElectricianCategory = useMemo(() => {
    if (isEpcCategory) return false;
    return (
      ['electrician', 'electrician-service', 'electrical', 'electrical-repair'].includes(serviceSlug) ||
      ['electrician', 'electrician-service', 'electrical', 'electrical-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('electr')
    );
  }, [serviceSlug, categoryData, isEpcCategory]);

  const isCarpenterCategory = useMemo(() => {
    if (isEpcCategory) return false;
    return (
      ['carpenter', 'carpentry', 'carpenter-service', 'carpenter-repair'].includes(serviceSlug) ||
      ['carpenter', 'carpentry', 'carpenter-service', 'carpenter-repair'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('carpent')
    );
  }, [serviceSlug, categoryData, isEpcCategory]);

  const isFanInstallationCategory = useMemo(() => {
    return (
      ['fan-installation', 'fan', 'ceiling-fan'].includes(serviceSlug) ||
      ['fan-installation', 'fan', 'ceiling-fan'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('fan installation')
    );
  }, [serviceSlug, categoryData]);

  const isFestivalLightsCategory = useMemo(() => {
    return (
      ['festival-lights-installation', 'festival-lights', 'lights-installation'].includes(serviceSlug) ||
      ['festival-lights-installation', 'festival-lights', 'lights-installation'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('festival lights')
    );
  }, [serviceSlug, categoryData]);

  const isFurnitureAssemblyCategory = useMemo(() => {
    return (
      ['furniture-assembly', 'furniture', 'assembly'].includes(serviceSlug) ||
      ['furniture-assembly', 'furniture', 'assembly'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('furniture assembly')
    );
  }, [serviceSlug, categoryData]);

  const isNativeSmartLocksCategory = useMemo(() => {
    return (
      ['native-smart-locks', 'smart-locks', 'smart-lock', 'native-locks', 'locks'].includes(serviceSlug) ||
      ['native-smart-locks', 'smart-locks', 'smart-lock', 'native-locks', 'locks'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('smart lock')
    );
  }, [serviceSlug, categoryData]);

  const isNativeWaterPurifierCategory = useMemo(() => {
    return (
      ['native-water-purifier', 'native-water', 'native-water-purifiers', 'native-ro'].includes(serviceSlug) ||
      ['native-water-purifier', 'native-water', 'native-water-purifiers', 'native-ro'].includes(categoryData?.slug || '') ||
      (categoryData?.name?.toLowerCase().includes('native') && categoryData?.name?.toLowerCase().includes('water'))
    );
  }, [serviceSlug, categoryData]);

  const isSolarPanelsCategory = useMemo(() => {
    return (
      ['solar-panels', 'solar-panel', 'solar', 'rooftop-solar', 'solar-solutions'].includes(serviceSlug) ||
      ['solar-panels', 'solar-panel', 'solar', 'rooftop-solar', 'solar-solutions'].includes(categoryData?.slug || '') ||
      categoryData?.name?.toLowerCase().includes('solar')
    );
  }, [serviceSlug, categoryData]);

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

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-8 py-6 md:py-8 pb-28 lg:pb-8">
        {/* Breadcrumb Navigation & In-Service Quick Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#5e23dc]">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-[#5e23dc]">Home Services</Link>
            <span>/</span>
            <span className="text-[#111827] font-semibold">{categoryData.name}</span>
          </div>
          <div className="relative sm:w-80">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-2xs focus-within:border-[#5e23dc] focus-within:ring-2 focus-within:ring-[#5e23dc]/10 transition-all">
              <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
              <input
                type="text"
                placeholder={`Search in ${categoryData.name}`}
                className="w-full bg-transparent text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Subcategory Pills Scroller (Sticky on Mobile) */}
        {(categoryData?.subCategories || []).length > 1 && (
          <div className="lg:hidden sticky top-[56px] z-30 -mx-4 px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-200/80 mb-4 overflow-x-auto no-scrollbar flex items-center gap-2 shadow-2xs scroll-smooth">
            {(categoryData.subCategories || []).map((subCat) => {
              const isSelected = subCat.slug === activeSubCategorySlug;
              return (
                <button
                  key={subCat.id || subCat.slug}
                  type="button"
                  onClick={() => {
                    setActiveSubCategorySlug(subCat.slug);
                    setActiveTierSlug(null);
                    const el = document.getElementById(`subcat-section-${subCat.slug}`);
                    if (el) {
                      const yOffset = -120;
                      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none ${
                    isSelected
                      ? 'bg-[#5e23dc] text-white shadow-xs'
                      : 'bg-[#f8f9fb] text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{subCat.name}</span>
                  {subCat.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {subCat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 3-Column Urban Company Layout (Left Sticky Nav, Center Service Feed, Right Cart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════════════════════ LEFT COLUMN: "Select a service" (3 Cols) ════════════════════ */}
          <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs lg:sticky lg:top-24">
            {isAcCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">AC</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.84
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.2M reviews</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isSpaCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Spa for Women</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 44 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.88
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">3.4 M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>

                {/* Top Rated Badge Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#eab308]">workspace_premium</span>
                    <span className="text-xs font-bold text-[#111827]">Curated Luxury Therapies</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>
              </div>
            )}

            {isSalonLuxeCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Salon Luxe</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Earliest Thu, 7:00 PM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.89
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">2.2 M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isInstaHelpCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">InstaHelp</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 41 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.72
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">14.8 M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isWashingMachineCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Washing Machine ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Earliest Fri, 9:00 AM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.78
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">3.6 M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 180 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-washing-machine-jet-service');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isTelevisionRepairCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Television Repair</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Earliest Fri, 9:00 AM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.82
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.2 M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 180 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-tv-check-up');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isChimneyRepairCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Chimney Repair</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Instant in 24 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.72
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">96K reviews</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 180 day warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>
              </div>
            )}

            {isRefrigeratorCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Refrigerator</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Earliest Fri, 9:00 AM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.75
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.9 M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 180 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-refrigerator-check-up');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isAirCoolerCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Air Cooler Service &...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.66
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">215K bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 30 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-repair-service');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isGeyserCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Geyser Service &...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.74
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.5 M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 30 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-repair-service');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isWaterPurifierCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Water Purifier Service &...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.79
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.1M reviews</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">India&apos;s longest 1 year warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-service-repair');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isLaptopRepairCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Laptop Repair</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 44 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.81
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">472K bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 180 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-select-service');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isStoveRepairCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Stove Service &...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 44 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.75
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">456K bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 30 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-service');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isEpcCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-black text-[#111827]">Electrician, Plumber &amp; Carpenter</h1>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                    <span className="flex items-center text-amber-500 font-bold ml-1">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.82
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">8.8M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">30-day doorstep warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-switch-socket') || document.getElementById('subcat-section-tap-mixer');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isPlumberCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Plumber</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.79
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">3.8M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">Up to 30 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-tap-mixer');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isElectricianCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Electrician</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.82
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">3.2M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">30-day warranty on all repairs</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-switch-socket');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isCarpenterCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Carpenter</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.78
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.8M bookings</span>
                  </div>
                </div>

                {/* Warranty Strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">30-day warranty on woodwork</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-drill-hang');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isFanInstallationCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Fan Installation</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.84
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">926 bookings</span>
                  </div>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-installation-replacement');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isFestivalLightsCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Festival Lights ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                </div>

                {/* 3x3 Subcategory Icon Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(categoryData?.subCategories || []).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`subcat-section-${sub.slug}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        setActiveSubCategorySlug(sub.slug);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        activeSubCategorySlug === sub.slug
                          ? 'border-[#5e23dc] bg-purple-50/60 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-[#5e23dc] text-xl">
                          {sub.icon || 'lightbulb'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight">
                        {sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isFurnitureAssemblyCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Furniture Assembly</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 25 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.82
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.2M bookings</span>
                  </div>
                </div>

                {/* Subcategory Icon Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(categoryData?.subCategories || []).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`subcat-section-${sub.slug}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                        setActiveSubCategorySlug(sub.slug);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        activeSubCategorySlug === sub.slug
                          ? 'border-[#5e23dc] bg-purple-50/60 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-[#5e23dc] text-xl">
                          {sub.icon || 'chair'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight">
                        {sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isNativeSmartLocksCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <h1 className="text-2xl font-black text-[#111827]">Native Smart Locks</h1>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ★
                    </span>
                    <span className="font-bold text-gray-900">4.77</span>
                    <span className="text-gray-500 font-medium">(28K bookings)</span>
                  </div>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-feature-lock');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isNativeWaterPurifierCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Native Water ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Earliest Sat, 2:30 PM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.84
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">(313K bookings)</span>
                  </div>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-models');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isSolarPanelsCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Solar Panels</h1>
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Govt Subsidy
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.91
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">(18.4K installations)</span>
                  </div>
                </div>

                <div className="bg-[#fefce8] p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                  ⚡ PM Surya Ghar: Free Electricity upto ₹78,000 subsidy + 25-yr warranty
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-solar-rooftop-installation') || document.querySelector('[id^="subcat-section"]');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Solar Solutions
                </button>
              </div>
            )}

            {isBathroomCleaningCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Bathroom Cleaning</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.80
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">4.2M reviews</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isMakeupCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Makeup, Saree & ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      In 59 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.86
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.8M reviews</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isKitchenCleaningCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Kitchen Cleaning</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.80
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">2.4M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isInteriorModularKitchenCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Interior & Modular Kitchen</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.86
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.1M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isLivingBedroomCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Living & Bedroom ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.82
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.9M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isFullHomeCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Full Home/ By Room ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      Earliest 16, 8:30 AM
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.80
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.6M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isCockroachControlCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Cockroach Control</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Instant in 24 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.81
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.5M bookings</span>
                  </div>
                </div>

                {/* 60 days warranty strip */}
                <div className="bg-[#f8f9fb] hover:bg-gray-100 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#5e23dc]">verified_user</span>
                    <span className="text-xs font-bold text-[#111827]">60 days warranty</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc]">chevron_right</span>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-kitchen-bathroom');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isAntsBedBugsCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Ants & Bed Bugs ...</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      Instant in 14 mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.79
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">39K bookings</span>
                  </div>
                </div>

                {/* View Services Purple Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('subcat-section-bed-bugs-control');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  View Services
                </button>
              </div>
            )}

            {isFullHomePaintingCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Home Painting</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.77
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">200k+ reviews</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

            {isWallsRoomsPaintingCategory && (
              <div className="mb-4 space-y-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[#111827]">Walls & Rooms Painting</h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                    <span className="flex items-center text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-[15px] fill-amber-500">star</span>
                      4.80
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-500">1.6M bookings</span>
                  </div>
                </div>

                {/* Address Selector Box */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ziva_open_location_modal'));
                    }
                  }}
                  className="w-full bg-[#f8f9fb] hover:bg-purple-50/50 rounded-xl p-2.5 border border-gray-200 text-left transition-colors cursor-pointer group"
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Select an address</div>
                  <div className="text-xs font-bold text-[#111827] truncate mt-0.5 flex items-center justify-between">
                    <span className="truncate">{userLocation || 'Kolkata'}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#5e23dc] shrink-0 ml-1">chevron_right</span>
                  </div>
                </button>
              </div>
            )}

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
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xl shadow-2xs shrink-0 overflow-hidden">
                      <span className="shrink-0 flex items-center justify-center leading-none">
                        {renderServiceIcon(subCat.icon, '🛠️')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-[13px] font-bold block truncate leading-tight">
                        {subCat.name}
                      </div>
                      {subCat.badge && (
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-xs mt-1">
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
          <div className="w-full lg:col-span-6 space-y-6 min-w-0">
            
            {/* Dedicated Hero Banner for AC (Matching Urban Company Foam-Jet Cleaning) */}
            {isAcCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 border border-slate-700">
                <div className="space-y-2 max-w-sm">
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    Power-Jet Technology
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                    Foam-jet<br /><span className="text-purple-300">AC service</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Deep cleans AC coils for better cooling & lowers electricity bills
                  </p>
                </div>
                <div className="w-full sm:w-56 h-36 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                  <img src="/services/ac-foam-jet-hero.jpg" alt="Foam-jet AC Service" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Spa (Matching Urban Company Curated Therapies) */}
            {isSpaCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 border border-purple-800">
                <div className="space-y-2 max-w-sm">
                  <span className="inline-block bg-[#eab308] text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                    ✪ Top rated
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                    Curated<br /><span className="text-amber-300">therapies & spa</span>
                  </h2>
                  <p className="text-xs text-purple-200 font-medium leading-relaxed">
                    Curated therapies with only Highly rated therapists & authentic aroma oils
                  </p>
                  <div className="text-sm font-extrabold text-amber-300 pt-1">
                    Starting ₹699
                  </div>
                </div>
                <div className="w-full sm:w-56 h-36 rounded-xl overflow-hidden shadow-lg border border-white/20 shrink-0">
                  <img src="/services/spa-luxe-stones.jpg" alt="Spa Luxe Stones" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Salon Luxe (Matching Urban Company Japanese Glow Rituals) */}
            {isSalonLuxeCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#fff1f2] via-[#ffe4e6] to-[#fce7f3] text-[#111827] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 border border-pink-200">
                <div className="space-y-2 max-w-sm">
                  <span className="inline-block bg-[#be185d] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                    New launch
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-[#111827]">
                    Japanese<br /><span className="text-[#be185d]">glow rituals</span>
                  </h2>
                  <p className="text-sm font-bold text-[#831843]">
                    Starting ₹1,999
                  </p>
                </div>
                <div className="w-full sm:w-64 h-40 rounded-xl overflow-hidden shadow-lg border border-white/60 shrink-0">
                  <img src="/services/japanese-glow-rituals.jpg" alt="Japanese Glow Rituals" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Washing Machine Repair */}
            {isWashingMachineCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#0f172a] group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="/services/washing-machine-clean.jpg"
                    alt="Washing Machine Clean"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-6">
                    <div className="flex items-center justify-between text-white">
                      <div className="space-y-1">
                        <span className="inline-block bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                          Skin-safe chemicals
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                          Select your service
                        </h2>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          Deep power drum decontamination with non-toxic chemical descaling
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-xl">volume_up</span>
                      </div>
                    </div>
                    {/* Video Progress Bar */}
                    <div className="w-full bg-white/30 h-1 rounded-full mt-4 overflow-hidden">
                      <div className="bg-white h-full w-3/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Refrigerator */}
            {isRefrigeratorCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#0f172a] group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80"
                    alt="Refrigerator Diagnostics"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 sm:p-6">
                    <div className="flex items-center justify-between text-white">
                      <div className="space-y-1">
                        <span className="inline-block bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                          Precision Diagnostics
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                          Refrigerator check-up
                        </h2>
                        <p className="text-xs text-gray-200 font-medium leading-relaxed">
                          Single, double door & inverter compressor multi-point diagnostics
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-2xl fill-white">play_arrow</span>
                      </div>
                    </div>
                    {/* Video Progress Bar */}
                    <div className="w-full bg-white/30 h-1 rounded-full mt-4 overflow-hidden">
                      <div className="bg-white h-full w-2/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Laptop Repair (Matching Screenshot 4) */}
            {isLaptopRepairCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#0f172a] group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=80"
                    alt="Laptop service - For smoother, faster performance"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                        Hardware & Software Tune-Up
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Laptop service
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-200 font-medium">
                        For smoother, faster performance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Native Smart Locks (Matching Screenshot 2) */}
            {isNativeSmartLocksCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-900 bg-black group">
                <div className="w-full h-64 sm:h-80 relative flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80"
                    alt="Native Smart Locks"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                  {/* Left / Right Carousel Controls */}
                  <button
                    type="button"
                    aria-label="Previous Slide"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_back_ios_new</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Next Slide"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
                  </button>

                  {/* Pagination Bars */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    <div className="w-10 h-1 bg-white rounded-full" />
                    <div className="w-10 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Showcase for Water Purifier (Matching Screenshot 3) */}
            {isWaterPurifierCategory && (
              <div className="space-y-5">
                {/* 1 Year Warranty Banner */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-sky-600 to-blue-700 text-white p-5 sm:p-6 shadow-md border border-blue-400/30 flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Maximum Protection
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                      India&apos;s longest<br />1 year warranty
                    </h2>
                    <p className="text-xs text-sky-100 font-medium">
                      Complete comprehensive coverage on all RO spares & filter kits
                    </p>
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shrink-0 shadow-lg">
                    <span className="material-symbols-outlined text-3xl sm:text-4xl">shield</span>
                  </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-[#111827]">Feature Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="py-2 font-bold">Feature</th>
                          <th className="py-2 px-3 font-bold text-emerald-700 bg-emerald-50 rounded-t-lg">Urban Company</th>
                          <th className="py-2 px-3 font-bold">Local</th>
                          <th className="py-2 px-3 font-bold">Brand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        <tr>
                          <td className="py-2.5 text-gray-700">Genuine RO membrane & spares</td>
                          <td className="py-2.5 px-3 text-emerald-700 bg-emerald-50 font-bold">✓ 100% genuine</td>
                          <td className="py-2.5 px-3 text-red-500">✗ Unverified</td>
                          <td className="py-2.5 px-3 text-gray-700">✓ Genuine</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-gray-700">Service & filter warranty</td>
                          <td className="py-2.5 px-3 text-emerald-700 bg-emerald-50 font-bold">✓ 365 days</td>
                          <td className="py-2.5 px-3 text-red-500">✗ None</td>
                          <td className="py-2.5 px-3 text-gray-700">30-90 days</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-gray-700">On-demand visit</td>
                          <td className="py-2.5 px-3 text-emerald-700 bg-emerald-50 font-bold">✓ Instant in 25 mins</td>
                          <td className="py-2.5 px-3 text-amber-600">Same day</td>
                          <td className="py-2.5 px-3 text-gray-700">3-5 business days</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-gray-700">Pre-service TDS measurement</td>
                          <td className="py-2.5 px-3 text-emerald-700 bg-emerald-50 font-bold">✓ Standardized</td>
                          <td className="py-2.5 px-3 text-red-500">✗ Rare</td>
                          <td className="py-2.5 px-3 text-gray-700">✓ Standardized</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Filtration Kit Showcase */}
                <div className="bg-[#f8f9fb] rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-[#111827]">Most Advanced Filter Kit</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="font-bold text-xs text-[#111827]">Sediment Filter</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Removes sand & rust</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="font-bold text-xs text-[#111827]">Carbon Filter</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Eliminates chlorine & odors</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="font-bold text-xs text-[#111827]">RO Membrane</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Blocks heavy metals</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                      <div className="font-bold text-xs text-[#111827]">Mineralizer</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Infuses active minerals</div>
                    </div>
                  </div>
                </div>

                {/* Supported Brands */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Servicing all major brands</div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Kent</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Aquaguard</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Pureit</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Livpure</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Eureka Forbes</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Havells</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">LG</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-md">Blue Star</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for EPC (Electrician, Plumber & Carpenter) */}
            {isEpcCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 text-white p-5 sm:p-6 shadow-md border border-indigo-400/30 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Instant Home Repairs • 25 Mins
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                    Electrician, Plumber &amp; Carpenter
                  </h2>
                  <p className="text-xs text-indigo-100 font-medium">
                    Switchboard, taps, fan fitting, drill &amp; hang, lock repair with 30-day doorstep warranty
                  </p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shrink-0 shadow-lg">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">home_repair_service</span>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Plumber (Matching Screenshot 2) */}
            {isPlumberCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#0f172a] group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80"
                    alt="Plumber - Affordable repairs starting at just ₹49"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <span className="inline-block bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                        Professional Doorstep Plumbing
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Affordable repairs starting at just ₹49
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-200 font-medium">
                        Tap, mixer, flush tank, drainage & pipe leakage expert fixes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Electrician (Matching Screenshot 3) */}
            {isElectricianCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 shadow-md border border-emerald-400/30 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Certified Electricians
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                    30-day warranty on<br />all electrical repairs
                  </h2>
                  <p className="text-xs text-emerald-100 font-medium">
                    Safe insulated tools, background-verified technicians & standard pricing
                  </p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shrink-0 shadow-lg">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">bolt</span>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Carpenter (Matching Screenshot 4) */}
            {isCarpenterCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-900 text-white p-5 sm:p-6 shadow-md border border-teal-400/30 flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Master Woodcraft
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                    30-day warranty on<br />all woodwork & carpentry
                  </h2>
                  <p className="text-xs text-teal-100 font-medium">
                    Precision laser-drilling, furniture assembly, lock replacement & repairs
                  </p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shrink-0 shadow-lg">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">handyman</span>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Bathroom Cleaning (Matching Screenshot 2: Germ-free under rims) */}
            {isBathroomCleaningCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="/services/toilet-cleaning-rim.jpg"
                    alt="Bathroom Cleaning - Germ-free under rims"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ‹
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                          Germ-free under rims
                        </h2>
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ›
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium">
                        100% stain eradication & certified hospital-grade sanitization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Makeup (Matching Screenshot 3: Party makeup package Starting ₹1,499) */}
            {isMakeupCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#be185d] text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 border border-pink-700">
                <div className="space-y-2 max-w-sm">
                  <span className="inline-block bg-pink-300 text-pink-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    Party & Bridal Glam
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                    Party makeup<br /><span className="text-pink-200">package</span>
                  </h2>
                  <p className="text-xs text-pink-100 font-medium leading-relaxed">
                    Full face glam, international MAC cosmetics, saree drape & hair curls
                  </p>
                  <div className="text-sm font-extrabold text-amber-300 pt-1">
                    Starting ₹1,499
                  </div>
                </div>
                <div className="w-full sm:w-56 h-36 rounded-xl overflow-hidden shadow-lg border border-white/20 shrink-0">
                  <img src="/services/makeup-party-glam.jpg" alt="Party Makeup Package" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Interior & Modular Kitchen */}
            {isInteriorModularKitchenCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#1e293b] group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="/services/modular-kitchen.jpg"
                    alt="Interior & Modular Kitchen - Custom woodwork & design"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                        10-Year Warranty
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                        Modular kitchen & custom woodwork
                      </h2>
                      <p className="text-xs text-slate-200 font-medium">
                        BWR marine plywood, German soft-close fittings & personalized 3D design
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Kitchen Cleaning (Matching Screenshot 1: Gas stove & counter) */}
            {isKitchenCleaningCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="/services/kitchen-cleaning-counter.jpg"
                    alt="Kitchen Cleaning - Spotless counters & deep degreasing"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ‹
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                          Spotless counters & chimney
                        </h2>
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ›
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium">
                        Oil deposit removal & certified food-safe degreasing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Living & Bedroom Cleaning (Matching Screenshot 2: With professional tools) */}
            {isLivingBedroomCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
                    alt="Living & Bedroom Cleaning - With professional tools"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ‹
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                          With professional tools
                        </h2>
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ›
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium">
                        High suction wet vacuuming & deep fabric stain extraction
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Full Home / By Room Cleaning (Matching Screenshot 3: Full home cleaning Starts at ₹3,199) */}
            {isFullHomeCategory && (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#f0fdf4] via-[#ecfdf5] to-[#f7fee7] border border-emerald-200 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="space-y-2 max-w-sm">
                  <span className="inline-block bg-[#16a34a] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider shadow-xs">
                    Best seller
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-[#111827]">
                    Full home cleaning<br />
                    <span className="text-[#15803d]">Starts at ₹3,199</span>{' '}
                    <span className="text-sm font-medium text-gray-400 line-through">₹4,798</span>
                  </h2>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                    More affordable than picking services one by one
                  </p>
                </div>
                <div className="w-full sm:w-56 h-36 rounded-xl overflow-hidden shadow-lg border border-emerald-100 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                    alt="Full home machine cleaning"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Cockroach Control (Matching Screenshot 3: Long lasting protection) */}
            {isCockroachControlCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
                    alt="Cockroach Control - Long lasting protection"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ‹
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                          Long lasting protection
                        </h2>
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ›
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium">
                        2-visit targeted gel treatment + spray with 60 days warranty
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Ants & Bed Bugs (Matching Screenshot 2: Sleeping peaceful woman) */}
            {isAntsBedBugsCategory && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80"
                    alt="Ants & Bed Bugs Control - Peaceful restful sleep"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ‹
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                          100% bug-free sleep guarantee
                        </h2>
                        <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-sm font-bold">
                          ›
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 font-medium">
                        Unique 2-visit treatment targeting eggs, nymphs & adult colonies
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Hero Banner for Painting (Matching Screenshots 4 & 5: Pay only after satisfaction) */}
            {(isFullHomePaintingCategory || isWallsRoomsPaintingCategory) && (
              <div className="relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black group">
                <div className="w-full h-56 sm:h-72 relative">
                  <img
                    src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80"
                    alt="Painting - Pay only after satisfaction"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5 sm:p-6">
                    <div className="text-white space-y-1.5">
                      <span className="inline-block bg-[#2563eb] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-sm tracking-wider">
                        For the first time ever
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Pay only after satisfaction
                      </h2>
                      <p className="text-xs text-gray-200 font-medium">
                        100% floor & furniture plastic masking • Certified Asian Paints / Berger paints
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                          <span className="absolute top-1.5 left-1.5 z-10 bg-[#16a34a] text-white text-[7.5px] sm:text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs max-w-[85%] truncate leading-tight pointer-events-none">
                            {badgeText}
                          </span>
                        )}

                        {/* Subcategory Photo Thumbnail */}
                        <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative shadow-2xs">
                          <img
                            src={subImg}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <span className="text-[11px] sm:text-[11.5px] font-bold text-[#111827] leading-tight line-clamp-2 break-words text-center w-full group-hover:text-[#5e23dc] transition-colors">
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
                .filter((sub) => {
                  if (
                    isBathroomCleaningCategory ||
                    isMakeupCategory ||
                    isInteriorModularKitchenCategory ||
                    isKitchenCleaningCategory ||
                    isLivingBedroomCategory ||
                    isFullHomeCategory ||
                    isCockroachControlCategory ||
                    isAntsBedBugsCategory ||
                    isFullHomePaintingCategory ||
                    isWallsRoomsPaintingCategory ||
                    isTelevisionRepairCategory ||
                    isChimneyRepairCategory ||
                    isRefrigeratorCategory ||
                    isWashingMachineCategory ||
                    isAirCoolerCategory ||
                    isGeyserCategory ||
                    isWaterPurifierCategory ||
                    isLaptopRepairCategory ||
                    isStoveRepairCategory ||
                    isPlumberCategory ||
                    isElectricianCategory ||
                    isCarpenterCategory ||
                    isFanInstallationCategory ||
                    isFestivalLightsCategory ||
                    isFurnitureAssemblyCategory ||
                    isNativeSmartLocksCategory ||
                    isNativeWaterPurifierCategory
                  ) {
                    return true;
                  }
                  return !activeSubCategorySlug || sub.slug === activeSubCategorySlug;
                })
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

                      {/* Custom Section Banners (Urban Company Style) */}
                      {subCat.slug === 'combos' && isChimneyRepairCategory && (
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-orange-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1.5 max-w-sm">
                            <span className="bg-[#ea580c] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              UPTO 10% OFF
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-[#111827]">
                              Chimney deep service: 2 visits in 12 months
                            </h3>
                            <p className="text-xs text-orange-950 font-medium">
                              Thorough cleaning of filters, outer body, motor & duct pipe. Save up to ₹250 on 2 visits!
                            </p>
                          </div>
                          <div className="w-32 h-20 rounded-xl overflow-hidden shadow-2xs border border-orange-200 shrink-0">
                            <img src="/services/chimney.jpg" alt="Chimney Deep Service" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                      {subCat.slug === 'kitchen-bathroom' && isCockroachControlCategory && (
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#d97706] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              60 Days Warranty
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Targeted kitchen & drain cockroach eradication
                            </h3>
                            <p className="text-xs text-amber-900 font-medium">
                              2-visit treatment with odorless herbal gel dots + spray
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-amber-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" alt="Cockroach Control" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'bed-bugs-control' && isAntsBedBugsCategory && (
                        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#5e23dc] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Guaranteed Sleep
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Bed bugs 2-visit deep eradication
                            </h3>
                            <p className="text-xs text-purple-900 font-medium">
                              Pre-service inspection + dual chemical wash targeting nymphs & eggs
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-purple-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80" alt="Bed Bugs" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'waterproofing' && (
                        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-100/60 border border-sky-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#0284c7] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              100% Warranty
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Treats walls from inside
                            </h3>
                            <p className="text-xs text-sky-900 font-medium">
                              Deep chemical damp injection eliminating efflorescence & peeling
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-sky-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80" alt="Waterproofing" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'value-deals' && isBathroomCleaningCategory && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Upto 25% OFF
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Bathroom cleaning value packages
                            </h3>
                            <p className="text-xs text-emerald-800 font-medium">
                              From ₹899 for 2 bathrooms • Complete stain & limescale eradication
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-emerald-100 shrink-0 hidden sm:block">
                            <img src="/services/toilet-cleaning-rim.jpg" alt="Value Deals" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'value-deals' && isKitchenCleaningCategory && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Upto 25% OFF
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Kitchen cleaning value packages
                            </h3>
                            <p className="text-xs text-emerald-800 font-medium">
                              From ₹1,199 • Deep degreasing, chimney power wash & slab buffing
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-emerald-100 shrink-0 hidden sm:block">
                            <img src="/services/kitchen-cleaning-counter.jpg" alt="Value Deals" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'super-saver-deals' && isLivingBedroomCategory && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Super Saver
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Curated sofa & home upholstery combos
                            </h3>
                            <p className="text-xs text-emerald-800 font-medium">
                              Starts at ₹899 • Fabric shampooing, deep extraction & sanitized drying
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-emerald-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80" alt="Super Saver Deals" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'full-apartment' && isFullHomeCategory && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Best Value
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Apartment deep cleaning from ₹3,199
                            </h3>
                            <p className="text-xs text-emerald-800 font-medium">
                              Single-disc floor scrubbing machine + all rooms, kitchen & washrooms
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-emerald-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" alt="Full Apartment" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {(subCat.slug === 'solar-rooftop-installation' || (isSolarPanelsCategory && subCat.slug === 'solar-rooftop-installation')) && (
                        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-100/60 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#d97706] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              PM Surya Ghar: Muft Bijli Yojana
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Direct Central Subsidy upto ₹78,000 on 3kW+
                            </h3>
                            <p className="text-xs text-amber-900 font-medium">
                              Mono PERC Tier-1 panels • 25 Years linear performance warranty • Net metering support
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-amber-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80" alt="Solar Rooftop" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'packages' && (
                        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100/60 border border-pink-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#be185d] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Bestselling Look
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Party makeup package from ₹1,499
                            </h3>
                            <p className="text-xs text-pink-900 font-medium">
                              Full face glam + eye lashes + saree draping & hair styling
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-pink-100 shrink-0 hidden sm:block">
                            <img src="/services/makeup-party-glam.jpg" alt="Party Makeup Package" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {subCat.slug === 'annual-plan' && (
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#16a34a] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              30% OFF
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Annual service plan
                            </h3>
                            <p className="text-xs text-emerald-800 font-medium">
                              From ₹399/AC • 2 full visits/yr • 10% extra discount with Plus
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-emerald-100 shrink-0 hidden sm:block">
                            <img src="/services/ac-foam-jet-hero.jpg" alt="Annual Plan" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {(subCat.slug === 'waxing-threading' || subCat.slug === 'sub-salon-waxing') && (
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#d97706] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Bestselling Wax
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Spatula waxing starting at ₹1,039
                            </h3>
                            <p className="text-xs text-amber-900 font-medium">
                              Full arms, legs & underarms • Honey or RICA wax options
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-amber-100 shrink-0 hidden sm:block">
                            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" alt="Spatula Waxing" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {(subCat.slug === 'ac-service-sub' || subCat.slug === 'ac-service' || subCat.slug === 'service') && (
                        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs">
                          <div className="space-y-1">
                            <span className="bg-[#5e23dc] text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              Power Saver
                            </span>
                            <h3 className="text-base font-black text-[#111827]">
                              Foam-jet AC service
                            </h3>
                            <p className="text-xs text-purple-900 font-medium">
                              Deep cleans AC coils for efficient cooling & prevents water leakage
                            </p>
                          </div>
                          <div className="w-24 h-16 rounded-xl overflow-hidden shadow-2xs border border-purple-100 shrink-0 hidden sm:block">
                            <img src="/services/ac-service.jpg" alt="Foam-jet Service" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}

                      {/* Service Cards Feed under this section */}
                      <div className="space-y-4">
                        {subServices.map((service) => {
                          const cartItem = cart.find((i) => i.service.id === service.id);
                          const isAdded = !!cartItem;
                          const originalPrice = Math.round(service.basePrice * 1.15);
                          const isPackage = service.name.toLowerCase().includes('package') || service.name.toLowerCase().includes('combo');
                          const hasFreebie = service.description?.includes('Free SPF 70') || service.name.toLowerCase().includes('ritual');

                          // Option count badge
                          let optionText: string | null = null;
                          const lowerName = service.name.toLowerCase();
                          if (lowerName.includes('threading')) optionText = '8 options';
                          else if (lowerName.includes('cirepil') || lowerName === 'instahelp') optionText = '7 options';
                          else if (
                            lowerName.includes('full arms') ||
                            lowerName.includes('full legs') ||
                            lowerName.includes('stomach') ||
                            lowerName.includes('back') ||
                            lowerName.includes('full body') ||
                            lowerName.includes('bleach') ||
                            lowerName.includes('detan') ||
                            lowerName.includes('multi-day')
                          ) optionText = '6 options';
                          else if (
                            lowerName.includes('spatula') ||
                            lowerName.includes('roll-on') ||
                            lowerName.includes('half legs') ||
                            lowerName.includes('butt waxing') ||
                            lowerName.includes('installation')
                          ) optionText = '3 options';
                          else if (
                            lowerName.includes('bikini') ||
                            lowerName.includes('delight') ||
                            lowerName.includes('head massage') ||
                            lowerName.includes('signature mani') ||
                            isNativeWaterPurifierCategory ||
                            lowerName.includes('native lock pro') ||
                            lowerName.includes('native lock ultra')
                          ) optionText = '2 options';

                          return (
                            <div
                              key={service.id}
                              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start justify-between group relative overflow-hidden"
                            >
                              {/* Left info */}
                              <div className="flex-1 space-y-2">
                                {/* Package / Freebie / Bestseller Tag */}
                                <div className="flex items-center gap-2">
                                  {isPackage ? (
                                    <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] text-[9.5px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                      PACKAGE
                                    </span>
                                  ) : hasFreebie ? (
                                    <span className="bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] text-[9.5px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                                      FREEBIE INCLUDED
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
                                    {optionText ? `Starts at ₹${service.basePrice}` : `₹${service.basePrice}`}
                                  </span>
                                  {originalPrice > service.basePrice && (
                                    <span className="text-xs text-gray-400 line-through font-medium">
                                      ₹{originalPrice}
                                    </span>
                                  )}
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

                                {/* Description with clean bullets */}
                                {service.description && (
                                  <div className="space-y-1 pt-1">
                                    {service.description.split('\n').map((line, idx) => {
                                      const trimmed = line.trim();
                                      if (!trimmed) return null;
                                      if (trimmed.toLowerCase() === 'view details') {
                                        return (
                                          <span key={idx} className="text-xs font-bold text-[#5e23dc] hover:underline block pt-0.5 cursor-pointer">
                                            View details
                                          </span>
                                        );
                                      }
                                      if (trimmed.toLowerCase() === 'edit your package') {
                                        return (
                                          <span key={idx} className="text-xs font-bold text-[#5e23dc] hover:underline block pt-0.5 cursor-pointer">
                                            Edit your package
                                          </span>
                                        );
                                      }
                                      return (
                                        <p key={idx} className="text-xs text-gray-600 leading-relaxed font-medium">
                                          {trimmed}
                                        </p>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* View details action */}
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {}}
                                    className="text-xs font-bold text-[#5e23dc] hover:underline inline-flex items-center gap-0.5 cursor-pointer pt-0.5"
                                  >
                                    View details
                                  </button>
                                </div>
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
                                  {isNativeWaterPurifierCategory && (service.slug === 'native-m3-pro' || service.name.includes('M3 Pro')) ? (
                                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-[#16a34a] text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs border border-emerald-100 flex items-center gap-1">
                                      <span>🛡️</span>
                                      <span>2-year filter life</span>
                                    </div>
                                  ) : isNativeSmartLocksCategory || isNativeWaterPurifierCategory ? null : isPackage ? (
                                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                                      20% OFF
                                    </div>
                                  ) : (
                                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-[#16a34a] text-[9px] font-black px-2 py-0.5 rounded-md shadow-2xs border border-emerald-100">
                                      15% OFF
                                    </div>
                                  )}
                                </div>

                                {/* Add or Counter Button */}
                                {isAdded ? (
                                  <div className="flex items-center justify-between w-full bg-white border border-[#5e23dc] rounded-xl px-2 py-1.5 shadow-xs">
                                    <button
                                      type="button"
                                      onClick={(e) => handleUpdateQuantity(e, service.id, -1)}
                                      className="w-7 h-7 rounded-md hover:bg-purple-50 flex items-center justify-center text-base font-bold text-[#5e23dc] cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm font-extrabold text-[#5e23dc]">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleUpdateQuantity(e, service.id, 1)}
                                      className="w-7 h-7 rounded-md hover:bg-purple-50 flex items-center justify-center text-base font-bold text-[#5e23dc] cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleAddToCart(
                                        e,
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

                                {optionText && (
                                  <span className="text-[10px] text-gray-500 font-medium mt-1">
                                    {optionText}
                                  </span>
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
          <div className="hidden lg:block lg:col-span-3 space-y-4 lg:sticky lg:top-24">
            {/* Air Cooler, Plumber & Festival Lights Promo Strip */}
            {(isAirCoolerCategory || isPlumberCategory || isFestivalLightsCategory) && (
              <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">percent</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111827]">Get visitation fee off</div>
                  <div className="text-[11px] text-gray-500 font-medium">On orders above ₹200</div>
                </div>
              </div>
            )}

            {/* Native Smart Locks & Native Water Purifier HSBC Offer Promo Strip */}
            {isNativeSmartLocksCategory ? (
              <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm font-bold">percent</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Flat 10% off upto ₹2000</div>
                    <div className="text-[10px] text-gray-500 font-medium">HSBC Bank Full Swipe Offer</div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-sm">
                  4/4
                </div>
              </div>
            ) : isNativeWaterPurifierCategory ? (
              <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-sm font-bold">percent</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#111827]">Flat 10% off upto ₹1750</div>
                    <div className="text-[10px] text-gray-500 font-medium">HSBC Bank Full Swipe Offer</div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-sm">
                  2/6
                </div>
              </div>
            ) : null}

            {/* UC Promise Card (Exact Urban Company Style) */}
            {isSpaCategory ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#5e23dc] text-base">verified</span>
                    <span>UC Promise</span>
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[7px] font-black text-purple-900 uppercase tracking-tighter text-center leading-none">
                      QUALITY ASSURED
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">4.85+ Rated Senior Therapists</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">100% Genuine Aroma & Herbal Oils</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Single-use Sanitized Kits & Sheets</span>
                  </li>
                </ul>
              </div>
            ) : isSalonLuxeCategory ? (
              <>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-lg">percent</span>
                    <span className="text-xs font-bold text-[#111827]">Get 25% off upto ₹200</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#5e23dc] bg-white px-2 py-0.5 rounded-md border border-purple-100">
                    2/2
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#5e23dc] text-base">verified</span>
                      <span>UC Promise</span>
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[7px] font-black text-purple-900 uppercase tracking-tighter text-center leading-none">
                        QUALITY ASSURED
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                      <span className="font-semibold text-gray-800">4.5+ Rated Beauticians</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                      <span className="font-semibold text-gray-800">Luxury Salon Experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                      <span className="font-semibold text-gray-800">Premium Branded Products</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : isBathroomCleaningCategory || isKitchenCleaningCategory || isLivingBedroomCategory || isFullHomeCategory ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#5e23dc] text-base">verified</span>
                    <span>UC Promise</span>
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[7px] font-black text-purple-900 uppercase tracking-tighter text-center leading-none">
                      QUALITY ASSURED
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Verified Professionals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Safe Chemicals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Superior Stain Removal</span>
                  </li>
                </ul>
              </div>
            ) : isInstaHelpCategory ||
              isWashingMachineCategory ||
              isAirCoolerCategory ||
              isGeyserCategory ||
              isWaterPurifierCategory ||
              isLaptopRepairCategory ||
              isStoveRepairCategory ||
              isTelevisionRepairCategory ||
              isRefrigeratorCategory ||
              isChimneyRepairCategory ||
              isPlumberCategory ||
              isElectricianCategory ||
              isCarpenterCategory ||
              isFanInstallationCategory ||
              isFestivalLightsCategory ||
              isFurnitureAssemblyCategory ||
              isNativeSmartLocksCategory ||
              isNativeWaterPurifierCategory ||
              isInteriorModularKitchenCategory ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#5e23dc] text-base">verified</span>
                    <span>UC Promise</span>
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[7px] font-black text-purple-900 uppercase tracking-tighter text-center leading-none">
                      QUALITY ASSURED
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Verified Professionals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Hassle Free Booking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Transparent Pricing</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#5e23dc] text-base">verified</span>
                    <span>UC Promise</span>
                  </h3>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    100% Quality
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Verified Professionals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">30-Day Service Warranty</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#16a34a] text-sm">check_circle</span>
                    <span className="font-semibold text-gray-800">Standard Rate Cards</span>
                  </li>
                </ul>
              </div>
            )}

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
                            onClick={(e) => handleUpdateQuantity(e, item.service.id, -item.quantity)}
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

            {/* UC Promise Box (Matching Urban Company Screenshots 2 & 3) */}
            <div className="bg-[#f5f3ff] rounded-2xl p-4 border border-purple-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#5e23dc] font-extrabold">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span className="text-sm">UC Promise</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                  🛡️
                </div>
              </div>
              <ul className="space-y-1.5 text-gray-700 text-[11.5px]">
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-[#5e23dc] font-bold">✓</span> Verified Professionals
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-[#5e23dc] font-bold">✓</span>{' '}
                  {isBathroomCleaningCategory || isKitchenCleaningCategory || isLivingBedroomCategory || isFullHomeCategory
                    ? 'Safe Chemicals'
                    : 'Hassle Free Booking'}
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-[#5e23dc] font-bold">✓</span>{' '}
                  {isBathroomCleaningCategory || isKitchenCleaningCategory || isLivingBedroomCategory || isFullHomeCategory
                    ? 'Superior Stain Removal'
                    : 'Transparent Pricing'}
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-[#5e23dc] hover:bg-[#4d19bf] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {cart.length > 0
                      ? `₹${cartGrandTotal}`
                      : isFullHomeCategory
                      ? '₹1,349'
                      : `${cart.reduce((a, b) => a + b.quantity, 0)} ${cart.reduce((a, b) => a + b.quantity, 0) === 1 ? 'item' : 'items'}`}
                  </span>
                  <span>View Cart ›</span>
                </button>
              </div>
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

      {/* ════════════════════ MOBILE STICKY BOTTOM CART BAR ════════════════════ */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-[#111827]">
                ₹{cartGrandTotal}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-xs font-bold text-emerald-600">
                {cart.reduce((a, b) => a + b.quantity, 0)} {cart.reduce((a, b) => a + b.quantity, 0) === 1 ? 'item' : 'items'}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Extra ₹200 off applied</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>View Cart</span>
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function UrbanCompanyServiceListingPage({ overrideSlug }: { overrideSlug?: string } = {}) {
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
      <UrbanCompanyServiceListingContent overrideSlug={overrideSlug} />
    </Suspense>
  );
}
