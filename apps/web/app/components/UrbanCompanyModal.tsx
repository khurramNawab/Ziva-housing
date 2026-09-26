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

const SUBCATEGORY_PHOTO_MAP: Record<string, string> = {
  // Cleaning & Pest Control (Dedicated distinct images)
  'bathroom-kitchen-cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=300&q=80',
  'bathroom-cleaning': 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&h=300&q=80',
  'kitchen-cleaning': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
  'full-home-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&h=300&q=80',
  'living-bedroom-cleaning': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=300&h=300&q=80',
  'sofa-carpet-cleaning': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&h=300&q=80',
  'pest-control-sub': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=300&h=300&q=80',
  'pest-control': 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=300&h=300&q=80',
  'cockroach-control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=300&h=300&q=80',
  'ants-bed-bugs-control': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&h=300&q=80',

  // Baby Sitting & Childcare
  'nanny-infant-care': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&h=300&q=80',
  'babysitting-childcare': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&h=300&q=80',

  // Women's Salon & Spa
  'salon-for-women': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=300&q=80',
  'spa-for-women': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&h=300&q=80',
  'hair-studio-women': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&h=300&q=80',
  'makeup-saree-styling': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&h=300&q=80',

  // Men's Salon & Massage
  'salon-for-men': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80',
  'massage-for-men': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&h=300&q=80',

  // AC & Appliance Repair (Exact Alias Mapping)
  'ac-service-sub': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=300&q=80',
  'ac-service': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=300&q=80',
  'ac-service-repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=300&q=80',
  'washing-machine': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&h=300&q=80',
  'washing-machine-sub': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&h=300&q=80',
  'washing-fridge-sub': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&h=300&q=80',
  'washing-machine-refrigerator': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&h=300&q=80',
  'refrigerator': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&h=300&q=80',
  'refrigerator-sub': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&h=300&q=80',
  'chimney': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
  'chimney-sub': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
  'ro-water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=300&h=300&q=80',
  'water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=300&h=300&q=80',
  'water-purifier-sub': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=300&h=300&q=80',
  'native-water-purifier': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=300&h=300&q=80',
  'geyser': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=300&q=80',
  'geyser-water-heater': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=300&q=80',
  'geyser-sub': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=300&q=80',
  'television': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=300&h=300&q=80',
  'television-sub': 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=300&h=300&q=80',

  // Electrician, Plumber & Carpenter
  'electrician-sub': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&h=300&q=80',
  'plumber-sub': 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=300&h=300&q=80',
  'carpenter-sub': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&h=300&q=80',

  // Painting & Waterproofing
  'wall-painting-sub': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&h=300&q=80',
  'painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&h=300&q=80',

  // InstaHelp
  'daily-helpers-sub': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&h=300&q=80',
  'cook-chef': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80',
};

const getSubPhoto = (sub: ServiceSubCategory): string => {
  const slugKey = slugify(sub.slug || '');
  const nameKey = slugify(sub.name || '');

  if (sub.slug && SUBCATEGORY_PHOTO_MAP[sub.slug]) return SUBCATEGORY_PHOTO_MAP[sub.slug]!;
  if (slugKey && SUBCATEGORY_PHOTO_MAP[slugKey]) return SUBCATEGORY_PHOTO_MAP[slugKey]!;
  if (nameKey && SUBCATEGORY_PHOTO_MAP[nameKey]) return SUBCATEGORY_PHOTO_MAP[nameKey]!;

  if ((sub as any).imageUrl && typeof (sub as any).imageUrl === 'string' && (sub as any).imageUrl.startsWith('http')) {
    return (sub as any).imageUrl;
  }

  if (nameKey.includes('water') || nameKey.includes('purifier') || nameKey.includes('ro')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4e?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('geyser') || nameKey.includes('heater')) {
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('washing') && (nameKey.includes('fridge') || nameKey.includes('refrigerator'))) {
    return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('washing')) {
    return 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('refrigerator') || nameKey.includes('fridge')) {
    return 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('tv') || nameKey.includes('television')) {
    return 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('chimney')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('ac') || nameKey.includes('air-conditioner')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('cockroach')) {
    return 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=300&h=300&q=80';
  }
  if (nameKey.includes('ant') || nameKey.includes('bed-bug')) {
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=300&h=300&q=80';
  }

  return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=300&q=80';
};

const DEFAULT_TAXONOMY: Record<string, ServiceSubCategory[]> = {
  'mens-salon-massage': [
    {
      id: 'sub-m-salon',
      name: 'Salon for Men',
      slug: 'salon-for-men',
      icon: '💈',
      badge: '30 mins',
      groupHeader: null,
      displayOrder: 1,
    },
    {
      id: 'sub-m-massage',
      name: 'Massage for Men',
      slug: 'massage-for-men',
      icon: '💆‍♂️',
      badge: '45 mins',
      groupHeader: null,
      displayOrder: 2,
      tiers: [
        {
          id: 'tier-m-luxe',
          name: 'Luxe Deep Tissue',
          slug: 'luxe-deep-tissue',
          description: 'Intensive muscle recovery with hot oil & acupressure points by senior therapists',
          badge: 'Top rated',
          startingPrice: 999,
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          features: ['Deep muscle relief', 'Warm lavender aromatics', 'Certified senior masseurs'],
          displayOrder: 1,
        },
        {
          id: 'tier-m-prime',
          name: 'Prime Relaxation',
          slug: 'prime-relaxation',
          description: 'Swedish & reflexology blend designed to melt away corporate stress & fatigue',
          badge: 'Popular',
          startingPrice: 999,
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80',
          features: ['Swedish rhythmic strokes', 'Organic carrier oils', 'Post-session hot towel wipe'],
          displayOrder: 2,
        },
        {
          id: 'tier-m-classic',
          name: 'Classic Relax',
          slug: 'classic-relax',
          description: 'Head, neck, shoulder and back express destress therapy for quick relief',
          badge: null,
          startingPrice: 699,
          imageUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=400&q=80',
          features: ['Quick stress relief', 'Almond oil scalp nourish', '30-min targeted session'],
          displayOrder: 3,
        },
        {
          id: 'tier-m-ayurveda',
          name: 'Stress Relief Ayurvedic',
          slug: 'stress-relief-ayurvedic',
          description: 'Traditional herbal tailam oil therapies for joint comfort and rejuvenation',
          badge: 'Herbal',
          startingPrice: 799,
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          features: ['Ayurvedic medicated oils', 'Joint mobility strokes', 'Detoxifying relaxation'],
          displayOrder: 4,
        },
      ],
    },
  ],
  'womens-salon-spa': [
    {
      id: 'sub-w-salon',
      name: 'Salon for Women',
      slug: 'salon-for-women',
      icon: '💇‍♀️',
      badge: '30 mins',
      groupHeader: null,
      displayOrder: 1,
    },
    {
      id: 'sub-w-spa',
      name: 'Spa for Women',
      slug: 'spa-for-women',
      icon: '🧖‍♀️',
      badge: '45 mins',
      groupHeader: null,
      displayOrder: 2,
      tiers: [
        {
          id: 'tier-w-luxe',
          name: 'Luxe',
          slug: 'luxe',
          description: 'Curated therapies with only Highly rated therapists & oils',
          badge: 'Top rated',
          startingPrice: 898,
          imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
          features: ['Top 1% rated therapists', 'Cold-pressed almond & sesame oils', 'Calming ambient aroma & music'],
          displayOrder: 1,
        },
        {
          id: 'tier-w-prime',
          name: 'Prime',
          slug: 'prime',
          description: 'Quality experience with branded aroma oils by verified therapists',
          badge: null,
          startingPrice: 699,
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
          features: ['Background-verified therapists', 'Pure organic essential oils', 'Single-use hygienic kit'],
          displayOrder: 2,
        },
        {
          id: 'tier-w-ayurveda',
          name: 'Ayurveda',
          slug: 'ayurveda',
          description: 'Healing Ayurvedic therapies with authentic herbal tailam and oils',
          badge: 'Herbal',
          startingPrice: 699,
          imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=400&q=80',
          features: ['Classical Ayurvedic oils', 'Pressure-point marmas therapy', 'Muscle fatigue relief'],
          displayOrder: 3,
        },
      ],
    },
    {
      id: 'sub-w-hair',
      name: 'Hair Studio for Women',
      slug: 'hair-studio-women',
      icon: '💆‍♀️',
      badge: '45 mins',
      groupHeader: null,
      displayOrder: 3,
    },
    {
      id: 'sub-w-makeup',
      name: 'Makeup, Saree & Styling',
      slug: 'makeup-saree-styling',
      icon: '💄',
      badge: '60 mins',
      groupHeader: null,
      displayOrder: 4,
    },
  ],
  'cleaning': [
    {
      id: 'sub-c-bk',
      name: 'Bathroom & Kitchen Cleaning',
      slug: 'bathroom-kitchen-cleaning',
      icon: '🧼',
      badge: '44 mins',
      groupHeader: null,
      displayOrder: 1,
    },
    {
      id: 'sub-c-full',
      name: 'Full Home Deep Cleaning',
      slug: 'full-home-cleaning',
      icon: '🏠',
      badge: null,
      groupHeader: null,
      displayOrder: 2,
    },
    {
      id: 'sub-c-sofa',
      name: 'Sofa & Carpet Cleaning',
      slug: 'sofa-carpet-cleaning',
      icon: '🛋️',
      badge: null,
      groupHeader: null,
      displayOrder: 3,
    },
    {
      id: 'sub-c-pest',
      name: 'Pest Control',
      slug: 'pest-control-sub',
      icon: '🐜',
      badge: null,
      groupHeader: null,
      displayOrder: 4,
    },
  ],
  'cleaning-pest-control': [
    {
      id: 'sub-c-bk-2',
      name: 'Bathroom & Kitchen Cleaning',
      slug: 'bathroom-kitchen-cleaning',
      icon: '🧼',
      badge: '44 mins',
      groupHeader: null,
      displayOrder: 1,
    },
    {
      id: 'sub-c-full-2',
      name: 'Full Home Deep Cleaning',
      slug: 'full-home-cleaning',
      icon: '🏠',
      badge: null,
      groupHeader: null,
      displayOrder: 2,
    },
    {
      id: 'sub-c-sofa-2',
      name: 'Sofa & Carpet Cleaning',
      slug: 'sofa-carpet-cleaning',
      icon: '🛋️',
      badge: null,
      groupHeader: null,
      displayOrder: 3,
    },
    {
      id: 'sub-c-pest-2',
      name: 'Pest Control',
      slug: 'pest-control-sub',
      icon: '🐜',
      badge: null,
      groupHeader: null,
      displayOrder: 4,
    },
  ],
  'ac-appliance-repair': [
    { id: 'sub-ac-1', name: 'AC Service & Repair', slug: 'ac-service-sub', icon: '❄️', badge: '44 mins', groupHeader: null, displayOrder: 1 },
    { id: 'sub-ac-2', name: 'Washing Machine', slug: 'washing-machine', icon: '🧺', badge: null, groupHeader: null, displayOrder: 2 },
    { id: 'sub-ac-3', name: 'Refrigerator', slug: 'refrigerator', icon: '🧊', badge: null, groupHeader: null, displayOrder: 3 },
    { id: 'sub-ac-4', name: 'Chimney', slug: 'chimney', icon: '🍳', badge: null, groupHeader: null, displayOrder: 4 },
    { id: 'sub-ac-5', name: 'RO/Water Purifier', slug: 'ro-water-purifier', icon: '💧', badge: null, groupHeader: null, displayOrder: 5 },
    { id: 'sub-ac-6', name: 'Geyser', slug: 'geyser', icon: '♨️', badge: null, groupHeader: null, displayOrder: 6 },
    { id: 'sub-ac-7', name: 'Television', slug: 'television', icon: '📺', badge: null, groupHeader: null, displayOrder: 7 },
  ],
  'electrician-plumber-carpenter': [
    { id: 'sub-e-1', name: 'Electrician', slug: 'electrician-sub', icon: '⚡', badge: '19 mins', groupHeader: null, displayOrder: 1 },
    { id: 'sub-e-2', name: 'Plumber', slug: 'plumber-sub', icon: '🔧', badge: '19 mins', groupHeader: null, displayOrder: 2 },
    { id: 'sub-e-3', name: 'Carpenter', slug: 'carpenter-sub', icon: '🪚', badge: '19 mins', groupHeader: null, displayOrder: 3 },
    { id: 'sub-e-4', name: 'Fan Installation', slug: 'fan-installation', icon: '🌀', badge: null, groupHeader: null, displayOrder: 4 },
    { id: 'sub-e-5', name: 'Furniture Assembly', slug: 'furniture-assembly', icon: '🪑', badge: null, groupHeader: null, displayOrder: 5 },
  ],
  'painting-waterproofing': [
    { id: 'sub-p-1', name: 'Painting & Waterproofing', slug: 'painting', icon: '🖌️', badge: null, groupHeader: null, displayOrder: 1 },
    { id: 'sub-p-2', name: 'Wall Painting & Waterproofing', slug: 'wall-painting-sub', icon: '🎨', badge: null, groupHeader: null, displayOrder: 2 },
  ],
  'instahelp': [
    { id: 'sub-ih-1', name: 'Daily Helpers & Cooks', slug: 'daily-helpers-sub', icon: '👩‍🍳', badge: null, groupHeader: null, displayOrder: 1 },
    { id: 'sub-ih-2', name: 'InstaHelp Daily Helper', slug: 'cook-chef', icon: '🧹', badge: 'Instant', groupHeader: null, displayOrder: 2 },
  ],
  'baby-sitting-childcare': [
    { id: 'sub-b-1', name: 'Nanny & Infant Care', slug: 'nanny-infant-care', icon: '👶', badge: 'Verified', groupHeader: null, displayOrder: 1 },
  ],
  'elderly-care': [
    { id: 'sub-el-1', name: 'Senior Living Assistance', slug: 'senior-living-assistance', icon: '👵', badge: 'Trained', groupHeader: null, displayOrder: 1 },
  ],
  'packers-movers': [
    { id: 'sub-pm-1', name: 'Home Shifting', slug: 'home-shifting', icon: '📦', badge: null, groupHeader: null, displayOrder: 1 },
  ],
  'interior-modular-kitchen': [
    { id: 'sub-imk-1', name: 'Modular Kitchen & Woodwork', slug: 'modular-kitchen-woodwork', icon: '📐', badge: null, groupHeader: null, displayOrder: 1 },
  ],
};

const ICON_MAP: Record<string, string> = {
  // Category & Subcategory Material / Slug names -> Vibrant Emojis
  'vacuum': '🧹',
  'cleaning': '🧹',
  'cleaning-pest-control': '🧹',
  'home-cleaning': '🧹',
  'full-home-cleaning': '🏠',
  'bathroom-kitchen-cleaning': '🧼',
  'sofa-carpet-cleaning': '🛋️',
  'face_retouching_natural': '🧖‍♀️',
  'womens-salon-spa': '🧖‍♀️',
  'womens_salon_spa': '🧖‍♀️',
  'women_salon': '🧖‍♀️',
  'salon-for-women': '🧖‍♀️',
  'spa-for-women': '💆‍♀️',
  'hair-studio-women': '💇‍♀️',
  'makeup-saree-styling': '💄',
  'content_cut': '🧔‍♂️',
  'person_grooming': '🧔‍♂️',
  'mens-salon-massage': '🧔‍♂️',
  'mens_salon_massage': '🧔‍♂️',
  'men_salon': '🧔‍♂️',
  'salon-for-men': '🧔‍♂️',
  'massage-for-men': '💆‍♂️',
  'ac_unit': '❄️',
  'ac-appliance-repair': '❄️',
  'ac_appliance_repair': '❄️',
  'ac-service-sub': '❄️',
  'washing-fridge-sub': '🧺',
  'washing-machine': '🧺',
  'refrigerator': '🧊',
  'chimney': '🍳',
  'ro-water-purifier': '💧',
  'geyser': '♨️',
  'television': '📺',
  'handyman': '🔧',
  'home_repair_service': '🔧',
  'electrician-plumber-carpenter': '🔧',
  'electrician_plumber_carpenter': '🔧',
  'electrician-sub': '⚡',
  'electrician': '⚡',
  'plumber-sub': '🔧',
  'plumber': '🔧',
  'carpenter-sub': '🪚',
  'carpenter': '🪚',
  'fan-installation': '🌀',
  'furniture-assembly': '🪑',
  'format_paint': '🖌️',
  'painting-waterproofing': '🖌️',
  'painting_waterproofing': '🖌️',
  'painting': '🖌️',
  'wall-painting-sub': '🎨',
  'support_agent': '👩‍🍳',
  'instahelp': '👩‍🍳',
  'daily-helpers-sub': '👩‍🍳',
  'cook-chef': '🧹',
  'child_care': '👶',
  'baby-sitting-childcare': '👶',
  'baby_sitting_childcare': '👶',
  'nanny-infant-care': '👶',
  'elderly': '👵',
  'elderly-care': '👵',
  'elderly_care': '👵',
  'senior-living-assistance': '👵',
  'local_shipping': '📦',
  'packers-movers': '📦',
  'packers_movers': '📦',
  'home-shifting': '📦',
  'countertops': '📐',
  'interior-modular-kitchen': '📐',
  'interior_modular_kitchen': '📐',
  'modular-kitchen-woodwork': '📐',
  'spa': '💆‍♀️',
  'healing': '💆‍♂️',
  'brush': '🖌️',
  'palette': '🎨',
  'plumbing': '🔧',
  'bolt': '⚡',
  'electric_bolt': '⚡',
  'soap': '🧼',
  'pest_control': '🐜',
  'pest-control-sub': '🐜',
  'pest-control': '🐜',
  'cockroach-control': '🐜',
  'ants-bedbugs-control': '🐜',
  'bug_report': '🐜',
  'dry_cleaning': '🛋️',
  'home': '🏠',
  'chair': '🪑',
  'kitchen': '🍳',
  'mode_fan': '🌀',
  'wash': '🧺',
  'local_laundry_service': '🧺',
  'face_3': '💄',
  'content_cut_women': '💇‍♀️',
};

function renderCategoryIcon(iconStr?: string | null, fallback: string = '🛠️') {
  if (!iconStr) return fallback;
  const trimmed = iconStr.trim();

  if (ICON_MAP[trimmed]) return ICON_MAP[trimmed];
  const normalized = trimmed.toLowerCase().replace(/_/g, '-');
  if (ICON_MAP[normalized]) return ICON_MAP[normalized];
  const underscored = trimmed.toLowerCase().replace(/-/g, '_');
  if (ICON_MAP[underscored]) return ICON_MAP[underscored];

  // If it's an image URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return <img src={trimmed} alt="icon" className="w-8 h-8 object-contain" />;
  }

  // Heuristic keyword matching for any material symbol strings
  const lower = trimmed.toLowerCase();
  if (lower.includes('retouch') || (lower.includes('women') && lower.includes('salon'))) return '🧖‍♀️';
  if (lower.includes('spa')) return '💆‍♀️';
  if (lower.includes('cut') || lower.includes('men') || lower.includes('groom')) return '🧔‍♂️';
  if (lower.includes('ac') || lower.includes('cool') || lower.includes('unit')) return '❄️';
  if (lower.includes('clean') || lower.includes('vacuum')) return '🧹';
  if (lower.includes('pest') || lower.includes('bug')) return '🐜';
  if (lower.includes('handy') || lower.includes('repair') || lower.includes('tool')) return '🔧';
  if (lower.includes('paint')) return '🖌️';
  if (lower.includes('cook') || lower.includes('help') || lower.includes('maid')) return '👩‍🍳';
  if (lower.includes('baby') || lower.includes('nanny') || lower.includes('child')) return '👶';
  if (lower.includes('elder') || lower.includes('senior')) return '👵';
  if (lower.includes('pack') || lower.includes('mover') || lower.includes('shift')) return '📦';
  if (lower.includes('kitchen') || lower.includes('woodwork') || lower.includes('interior')) return '📐';
  if (lower.includes('hair')) return '💇‍♀️';
  if (lower.includes('makeup') || lower.includes('saree')) return '💄';
  if (lower.includes('wash') || lower.includes('laundry')) return '🧺';
  if (lower.includes('electric') || lower.includes('volt') || lower.includes('bolt')) return '⚡';
  if (lower.includes('plumb')) return '🔧';
  if (lower.includes('carpenter') || lower.includes('saw')) return '🪚';

  // If it contains an underscore or is an ASCII identifier, NEVER render raw text with underscore!
  if (trimmed.includes('_') || /^[a-z0-9_-]+$/i.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

function cleanText(text?: string | null): string {
  if (!text) return '';
  return text.replace(/_/g, ' ');
}

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: 'c-clean', name: 'Cleaning & Pest Control', slug: 'cleaning', icon: '🧹', badge: '44 mins', order: 1, subCategories: DEFAULT_TAXONOMY['cleaning'] },
  { id: 'c-wsalon', name: "Women's Salon & Spa", slug: 'womens-salon-spa', icon: '🧖‍♀️', badge: null, order: 2, subCategories: DEFAULT_TAXONOMY['womens-salon-spa'] },
  { id: 'c-msalon', name: "Men's Salon & Massage", slug: 'mens-salon-massage', icon: '🧔‍♂️', badge: null, order: 3, subCategories: DEFAULT_TAXONOMY['mens-salon-massage'] },
  { id: 'c-ac', name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', icon: '❄️', badge: '44 mins', order: 4, subCategories: DEFAULT_TAXONOMY['ac-appliance-repair'] },
  { id: 'c-epc', name: 'Electrician, Plumber & Carpenter', slug: 'electrician-plumber-carpenter', icon: '🔧', badge: '19 mins', order: 5, subCategories: DEFAULT_TAXONOMY['electrician-plumber-carpenter'] },
  { id: 'c-paint', name: 'Painting & Waterproofing', slug: 'painting-waterproofing', icon: '🖌️', badge: null, order: 6, subCategories: DEFAULT_TAXONOMY['painting-waterproofing'] },
  { id: 'c-help', name: 'InstaHelp', slug: 'instahelp', icon: '👩‍🍳', badge: null, order: 7, subCategories: DEFAULT_TAXONOMY['instahelp'] },
  { id: 'c-baby', name: 'Baby Sitting & Childcare', slug: 'baby-sitting-childcare', icon: '👶', badge: null, order: 8, subCategories: DEFAULT_TAXONOMY['baby-sitting-childcare'] },
  { id: 'c-elder', name: 'Elderly Care', slug: 'elderly-care', icon: '👵', badge: null, order: 9, subCategories: DEFAULT_TAXONOMY['elderly-care'] },
  { id: 'c-movers', name: 'Packers & Movers', slug: 'packers-movers', icon: '📦', badge: null, order: 10, subCategories: DEFAULT_TAXONOMY['packers-movers'] },
  { id: 'c-interior', name: 'Interior & Modular Kitchen', slug: 'interior-modular-kitchen', icon: '📐', badge: null, order: 11, subCategories: DEFAULT_TAXONOMY['interior-modular-kitchen'] },
];

export default function UrbanCompanyModal({
  initialCategory = 'all',
  isOpen,
  onClose,
  onSelectService,
}: UrbanModalCategoryProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
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
        if (Array.isArray(data) && data.length > 0) {
          // STRICT DYNAMIC FILTER: ONLY active categories from backend
          const activeCategories = data
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => {
              const fallbackSubs = DEFAULT_TAXONOMY[c.slug] || DEFAULT_TAXONOMY[slugify(c.slug)] || [];
              const rawSubs = Array.isArray(c.subCategories) && c.subCategories.length > 0 ? c.subCategories : fallbackSubs;
              
              return {
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon || '🛠️',
                badge: c.badge || null,
                order: c.order || 1,
                subCategories: (rawSubs || [])
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
                        startingPrice: (() => {
                          const srvs = t.services || [];
                          if (Array.isArray(srvs) && srvs.length > 0) {
                            const minP = Math.min(...srvs.map((sv: any) => Number(sv.basePrice || 0)).filter((p: number) => p > 0));
                            if (minP && isFinite(minP)) return minP;
                          }
                          return t.startingPrice ? Number(t.startingPrice) : null;
                        })(),
                        features: t.features || [],
                        displayOrder: t.displayOrder || 1,
                      })),
                  })),
              };
            });

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
              {(() => {
                const targetSlug = initialCategory ? slugify(initialCategory) : 'all';
                const matched = (targetSlug && targetSlug !== 'all')
                  ? categories.filter(
                      (c) =>
                        c.slug === initialCategory ||
                        slugify(c.slug) === targetSlug ||
                        slugify(c.name) === targetSlug ||
                        slugify(c.name).includes(targetSlug) ||
                        targetSlug.includes(slugify(c.name))
                    )
                  : categories;
                const activeList = matched.length > 0 ? matched : categories;

                return activeList.map((category, catIndex) => {
                  const subCats = category.subCategories || DEFAULT_TAXONOMY[category.slug] || DEFAULT_TAXONOMY[slugify(category.slug)] || [];
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
                      <h3 className="text-[18px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2.5">
                        <span className="flex items-center justify-center text-2xl">
                          {renderCategoryIcon(category.icon, '🛠️')}
                        </span>
                        <span>{cleanText(category.name)}</span>
                      </h3>
                      {category.badge && (
                        <span className="bg-purple-50 text-[#5e23dc] text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          {cleanText(category.badge)}
                        </span>
                      )}
                    </div>

                    {/* Ungrouped items */}
                    {ungrouped.length > 0 && (
                      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                        {ungrouped.map((sub) => {
                          const subPhoto = getSubPhoto(sub);

                          return (
                            <button
                              key={sub.id || sub.slug}
                              type="button"
                              onClick={() => handleSubCategoryClick(sub, category)}
                              className="relative bg-white hover:bg-purple-50/50 border border-gray-200/80 hover:border-[#5e23dc] rounded-2xl flex flex-col items-center justify-between p-2 text-center cursor-pointer transition-all hover:scale-[1.03] group shadow-2xs hover:shadow-md min-h-[125px]"
                            >
                              {sub.badge && (
                                <span className="absolute top-1.5 left-1.5 z-10 bg-[#16a34a] text-white text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
                                  {cleanText(sub.badge)}
                                </span>
                              )}

                              {/* Realistic Photo Thumbnail */}
                              <div className="w-full h-16 sm:h-18 rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative shadow-2xs">
                                <img
                                  src={subPhoto}
                                  alt={sub.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    if (!img.dataset.failed) {
                                      img.dataset.failed = 'true';
                                      img.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&h=300&q=80';
                                    }
                                  }}
                                />
                              </div>

                              <span className="text-[11px] font-extrabold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#5e23dc] transition-colors pb-0.5">
                                {cleanText(sub.name)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Grouped items */}
                    {groups.map((group) => (
                      <div key={group.header} className="space-y-2 pt-1">
                        <h4 className="text-[13px] font-bold text-[#4b5563]">
                          {cleanText(group.header)}
                        </h4>
                        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                          {group.items.map((sub) => {
                            const subPhoto = getSubPhoto(sub);

                            return (
                              <button
                                key={sub.id || sub.slug}
                                type="button"
                                onClick={() => handleSubCategoryClick(sub, category)}
                                className="relative bg-white hover:bg-purple-50/50 border border-gray-200/80 hover:border-[#5e23dc] rounded-2xl flex flex-col items-center justify-between p-2 text-center cursor-pointer transition-all hover:scale-[1.03] group shadow-2xs hover:shadow-md min-h-[125px]"
                              >
                                {sub.badge && (
                                  <span className="absolute top-1.5 left-1.5 z-10 bg-[#16a34a] text-white text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
                                    {cleanText(sub.badge)}
                                  </span>
                                )}

                                {/* Realistic Photo Thumbnail */}
                                <div className="w-full h-16 sm:h-18 rounded-xl overflow-hidden bg-gray-100 mb-1.5 relative shadow-2xs">
                                  <img
                                    src={subPhoto}
                                    alt={sub.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      if (!img.dataset.failed) {
                                        img.dataset.failed = 'true';
                                        img.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&h=300&q=80';
                                      }
                                    }}
                                  />
                                </div>

                                <span className="text-[11px] font-extrabold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#5e23dc] transition-colors pb-0.5">
                                  {cleanText(sub.name)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {catIndex < activeList.length - 1 && (
                      <div className="h-[1px] bg-gray-100 w-full pt-2" />
                    )}
                  </div>
                );
              });
            })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
