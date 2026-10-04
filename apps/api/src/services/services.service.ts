import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const BACKGROUND_CHECK_CATEGORIES = [
  'Babysitting',
  'Babysitter',
  'Elderly Caregiver',
  'Caregiver',
  'Cook',
  'Cook / Chef',
  'Driver',
  'Beautician',
  'Nanny / Care',
  'nanny',
];

const SEED_CATEGORIES = [
  {
    id: 'cat-clean',
    name: 'Cleaning & Pest Control',
    slug: 'cleaning',
    icon: '🧹',
    order: 1,
    isActive: true,
    subCategories: [
      { id: 'sub-c-bk', name: 'Bathroom & Kitchen Cleaning', slug: 'bathroom-kitchen-cleaning', icon: '🧼', badge: '44 mins', displayOrder: 1, isActive: true },
      { id: 'sub-c-full', name: 'Full Home Deep Cleaning', slug: 'full-home-cleaning', icon: '🏠', badge: null, displayOrder: 2, isActive: true },
      { id: 'sub-c-sofa', name: 'Sofa & Carpet Cleaning', slug: 'sofa-carpet-cleaning', icon: '🛋️', badge: null, displayOrder: 3, isActive: true },
      { id: 'sub-c-pest', name: 'Pest Control', slug: 'pest-control-sub', icon: '🐜', badge: null, displayOrder: 4, isActive: true },
    ],
  },
  {
    id: 'cat-wsalon',
    name: "Women's Salon & Spa",
    slug: 'womens-salon-spa',
    icon: '🧖‍♀️',
    order: 2,
    isActive: true,
    subCategories: [
      { id: 'sub-w-salon', name: 'Salon for Women', slug: 'salon-for-women', icon: '💇‍♀️', badge: '30 mins', displayOrder: 1, isActive: true },
      {
        id: 'sub-w-spa',
        name: 'Spa for Women',
        slug: 'spa-for-women',
        icon: '🧖‍♀️',
        badge: '45 mins',
        displayOrder: 2,
        isActive: true,
        tiers: [
          { id: 'tier-w-luxe', name: 'Luxe', slug: 'luxe', startingPrice: 898, badge: 'Top rated', description: 'Curated therapies with only Highly rated therapists & oils', isActive: true },
          { id: 'tier-w-prime', name: 'Prime', slug: 'prime', startingPrice: 699, description: 'Quality experience with branded aroma oils by verified therapists', isActive: true },
          { id: 'tier-w-ayurveda', name: 'Ayurveda', slug: 'ayurveda', startingPrice: 699, badge: 'Herbal', description: 'Healing Ayurvedic therapies with authentic herbal tailam and oils', isActive: true },
        ],
      },
      { id: 'sub-w-hair', name: 'Hair Studio for Women', slug: 'hair-studio-women', icon: '💆‍♀️', badge: '45 mins', displayOrder: 3, isActive: true },
      { id: 'sub-w-makeup', name: 'Makeup, Saree & Styling', slug: 'makeup-saree-styling', icon: '💄', badge: '60 mins', displayOrder: 4, isActive: true },
    ],
  },
  {
    id: 'cat-msalon',
    name: "Men's Salon & Massage",
    slug: 'mens-salon-massage',
    icon: '🧔‍♂️',
    order: 3,
    isActive: true,
    subCategories: [
      { id: 'sub-m-salon', name: 'Salon for Men', slug: 'salon-for-men', icon: '💈', badge: '30 mins', displayOrder: 1, isActive: true },
      {
        id: 'sub-m-massage',
        name: 'Massage for Men',
        slug: 'massage-for-men',
        icon: '💆‍♂️',
        badge: '45 mins',
        displayOrder: 2,
        isActive: true,
        tiers: [
          { id: 'tier-m-luxe', name: 'Luxe Deep Tissue', slug: 'luxe-deep-tissue', startingPrice: 999, badge: 'Top rated', description: 'Intensive muscle recovery with hot oil & acupressure points', isActive: true },
          { id: 'tier-m-prime', name: 'Prime Relaxation', slug: 'prime-relaxation', startingPrice: 999, badge: 'Popular', description: 'Swedish & reflexology blend designed to melt away stress', isActive: true },
          { id: 'tier-m-classic', name: 'Classic Relax', slug: 'classic-relax', startingPrice: 699, description: 'Head, neck, shoulder and back express destress therapy', isActive: true },
          { id: 'tier-m-ayurveda', name: 'Stress Relief Ayurvedic', slug: 'stress-relief-ayurvedic', startingPrice: 799, badge: 'Herbal', description: 'Traditional herbal tailam oil therapies', isActive: true },
        ],
      },
    ],
  },
  {
    id: 'cat-ac',
    name: 'AC & Appliance Repair',
    slug: 'ac-appliance-repair',
    icon: '❄️',
    order: 4,
    isActive: true,
    subCategories: [
      {
        id: 'sub-ac-annual',
        name: 'Annual plan',
        slug: 'annual-plan',
        icon: 'calendar_month',
        badge: '30% OFF',
        displayOrder: 1,
        isActive: true,
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
            subCategoryId: 'sub-ac-annual',
          },
        ],
      },
      {
        id: 'sub-ac-1',
        name: 'Service',
        slug: 'ac-service-sub',
        icon: 'ac_unit',
        badge: 'Most Booked',
        displayOrder: 2,
        isActive: true,
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
            subCategoryId: 'sub-ac-1',
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
            subCategoryId: 'sub-ac-1',
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
            subCategoryId: 'sub-ac-1',
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
            subCategoryId: 'sub-ac-1',
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
            subCategoryId: 'sub-ac-1',
          },
        ],
      },
      {
        id: 'sub-ac-repair',
        name: 'Repair & gas refill',
        slug: 'repair-gas-refill',
        icon: 'build',
        badge: 'Quick Visit',
        displayOrder: 3,
        isActive: true,
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
            subCategoryId: 'sub-ac-repair',
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
            subCategoryId: 'sub-ac-repair',
          },
        ],
      },
      {
        id: 'sub-ac-install',
        name: 'Installation/uninstallation',
        slug: 'installation-uninstallation',
        icon: 'home_repair_service',
        badge: 'Precision',
        displayOrder: 4,
        isActive: true,
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
            subCategoryId: 'sub-ac-install',
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
            subCategoryId: 'sub-ac-install',
          },
        ],
      },
      { id: 'sub-ac-2', name: 'Washing Machine', slug: 'washing-machine', icon: '🧺', displayOrder: 5, isActive: true },
      { id: 'sub-ac-3', name: 'Refrigerator', slug: 'refrigerator', icon: '🧊', displayOrder: 6, isActive: true },
      { id: 'sub-ac-4', name: 'Chimney', slug: 'chimney', icon: '🍳', displayOrder: 7, isActive: true },
      { id: 'sub-ac-5', name: 'RO/Water Purifier', slug: 'ro-water-purifier', icon: '💧', displayOrder: 8, isActive: true },
      { id: 'sub-ac-6', name: 'Geyser', slug: 'geyser', icon: '♨️', displayOrder: 9, isActive: true },
      { id: 'sub-ac-7', name: 'Television', slug: 'television', icon: '📺', displayOrder: 10, isActive: true },
      { id: 'sub-ac-8', name: 'Air Cooler', slug: 'air-cooler', icon: '❄️', displayOrder: 11, isActive: true },
      { id: 'sub-ac-9', name: 'Laptop Repair', slug: 'laptop-repair', icon: '💻', displayOrder: 12, isActive: true },
      { id: 'sub-ac-10', name: 'Stove/Hob', slug: 'stove-service-repair', icon: '🔥', displayOrder: 13, isActive: true },
      { id: 'sub-ac-11', name: 'Microwave', slug: 'microwave-repair', icon: '📻', badge: '60 mins', displayOrder: 14, isActive: true },
      { id: 'sub-ac-12', name: 'Native Water Purifier', slug: 'native-water-purifier', icon: '💧', badge: 'Sale', displayOrder: 15, isActive: true },
    ],
  },
  {
    id: 'cat-handy',
    name: 'Electrician, Plumber & Carpenter',
    slug: 'electrician-plumber-carpenter',
    icon: '🔧',
    order: 5,
    isActive: true,
    subCategories: [
      { id: 'sub-e-1', name: 'Electrician', slug: 'electrician-sub', icon: '⚡', badge: '25 mins', displayOrder: 1, isActive: true },
      { id: 'sub-e-2', name: 'Plumber', slug: 'plumber-sub', icon: '🔧', badge: '25 mins', displayOrder: 2, isActive: true },
      { id: 'sub-e-3', name: 'Carpenter', slug: 'carpenter-sub', icon: '🪚', badge: '25 mins', displayOrder: 3, isActive: true },
      { id: 'sub-e-4', name: 'Fan Installation', slug: 'fan-installation', icon: '🌀', badge: '25 mins', displayOrder: 4, isActive: true },
      { id: 'sub-e-5', name: 'Furniture Assembly', slug: 'furniture-assembly', icon: '🪑', displayOrder: 5, isActive: true },
      { id: 'sub-e-6', name: 'Geyser Service & Repair', slug: 'geyser-service-repair', icon: '♨️', badge: '25 mins', displayOrder: 6, isActive: true },
      { id: 'sub-e-7', name: 'Festival Lights Installation', slug: 'festival-lights-installation', icon: '💡', badge: '25 mins', displayOrder: 7, isActive: true },
      { id: 'sub-e-8', name: 'Native Smart Locks', slug: 'native-smart-locks', icon: '🔐', badge: 'Sale', displayOrder: 8, isActive: true },
    ],
  },
  {
    id: 'cat-paint',
    name: 'Painting & Waterproofing',
    slug: 'painting-waterproofing',
    icon: '🖌️',
    order: 6,
    isActive: true,
    subCategories: [
      { id: 'sub-p-1', name: 'Full home painting', slug: 'full-home-painting', icon: '🏠', badge: '1/2/3/4 BHK', displayOrder: 1, isActive: true },
      { id: 'sub-p-2', name: 'Few walls & rooms', slug: 'walls-rooms-painting', icon: '🎨', badge: '1/2/3 rooms', displayOrder: 2, isActive: true },
      { id: 'sub-p-3', name: 'Wall Painting & Waterproofing', slug: 'wall-painting-sub', icon: '🖌️', displayOrder: 3, isActive: true },
    ],
  },
  {
    id: 'cat-help',
    name: 'InstaHelp',
    slug: 'instahelp',
    icon: '👩‍🍳',
    order: 7,
    isActive: true,
    subCategories: [
      { id: 'sub-ih-1', name: 'Daily Helpers & Cooks', slug: 'daily-helpers-sub', icon: '👩‍🍳', displayOrder: 1, isActive: true },
      { id: 'sub-ih-2', name: 'InstaHelp Daily Helper', slug: 'cook-chef', icon: '🧹', badge: 'Instant', displayOrder: 2, isActive: true },
    ],
  },
  {
    id: 'cat-pest',
    name: 'Pest Control',
    slug: 'pest-control',
    icon: '🐜',
    order: 8,
    isActive: true,
    subCategories: [
      { id: 'sub-pest-1', name: 'Cockroach & Ant Control', slug: 'cockroach-control', icon: '🐜', displayOrder: 1, isActive: true },
      { id: 'sub-pest-2', name: 'Bed Bugs & Termite Control', slug: 'ants-bedbugs-control', icon: '🪲', displayOrder: 2, isActive: true },
    ],
  },
  {
    id: 'cat-solar',
    name: 'Solar Panels',
    slug: 'solar-panels',
    icon: '☀️',
    badge: 'Govt Subsidy',
    order: 10,
    isActive: true,
    subCategories: [
      {
        id: 'sub-solar-install',
        name: 'Solar Rooftop Installation',
        slug: 'solar-rooftop-installation',
        icon: 'roofing',
        badge: 'PM Surya Ghar',
        displayOrder: 1,
        isActive: true,
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
            description: 'Complete 1kW rooftop mono-PERC panels, grid-tied inverter, MC4 wiring & net-metering assistance with up to ₹30,000 subsidy support.',
            imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
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
            description: 'High-efficiency bifacial monocrystalline solar panels, 3kW smart MPPT inverter, lightning arrester & structural mounting.',
            imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
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
            description: '5kW solar plant with lithium battery storage support for 24/7 backup during power cuts.',
            imageUrl: 'https://images.unsplash.com/photo-1545208942-e1c9c916524b?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
          },
        ],
      },
      {
        id: 'sub-solar-clean',
        name: 'Solar Panel Cleaning & Maintenance',
        slug: 'solar-panel-cleaning',
        icon: 'water_drop',
        badge: 'Boosts 25% Output',
        displayOrder: 2,
        isActive: true,
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
            description: 'TDS-free water jet cleaning, micro-fiber soft brush scrubbing & bird dropping stain removal to restore maximum sunlight absorption.',
            imageUrl: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-clean',
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
            description: 'Hydrophobic anti-dust nano coating with high-pressure soft wash for 90-day dust repellence.',
            imageUrl: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-clean',
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
            description: 'Quarterly deep cleaning, inverter diagnostics, voltage inspection and generation audit.',
            imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-clean',
          },
        ],
      },
      {
        id: 'sub-solar-inv',
        name: 'Inverter & Electrical Diagnostics',
        slug: 'solar-inverter-repair',
        icon: 'electric_meter',
        badge: 'In 30 mins',
        displayOrder: 3,
        isActive: true,
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
            description: 'Complete AC/DC voltage check, MPPT tracking testing, thermal imaging for hot spots & earthing resistance test.',
            imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-inv',
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
            description: 'Weatherproof MC4 crimping, DC surge protector (SPD) replacement & short-circuit protection.',
            imageUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-inv',
          },
        ],
      },
      {
        id: 'sub-solar-srv',
        name: 'Site Survey & Subsidy Consultation',
        slug: 'solar-site-survey',
        icon: 'analytics',
        badge: '₹99 Consultation',
        displayOrder: 4,
        isActive: true,
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
            description: 'Expert rooftop measurement, shadow simulation, DISCOM net-metering eligibility and PM-Surya Ghar subsidy approval roadmap.',
            imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-srv',
          },
        ],
      },
    ],
  },
  {
    id: 'cat-smart-locks',
    name: 'Native Smart Locks',
    slug: 'native-smart-locks',
    icon: '🔐',
    badge: 'Sale Live',
    order: 11,
    isActive: true,
    subCategories: [
      {
        id: 'sub-lock-feature',
        name: 'Smart Door Locks',
        slug: 'feature-lock',
        icon: 'lock',
        badge: 'Sale Live',
        displayOrder: 1,
        isActive: true,
        services: [
          {
            id: 'srv-lock-pro',
            name: 'Native Lock Pro (Biometric + Doorbell Video)',
            slug: 'native-lock-pro',
            basePrice: 17299,
            durationMinutes: 90,
            bestsellerFlag: true,
            rating: 4.88,
            reviewCount: 14200,
            description: '7 ways to unlock, doorbell camera snapshot on phone, stainless steel body & 25-year motor warranty.',
            imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-lock-feature',
          },
          {
            id: 'srv-lock-ultra',
            name: 'Native Lock Ultra (3D Face Recognition)',
            slug: 'native-lock-ultra',
            basePrice: 24999,
            durationMinutes: 120,
            bestsellerFlag: false,
            rating: 4.94,
            reviewCount: 8900,
            description: '9 ways to unlock including infrared 3D face unlock, visitor photo stream and emergency physical key.',
            imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-lock-feature',
          },
          {
            id: 'srv-lock-s',
            name: 'Native Lock S (Compact Smart Keyless)',
            slug: 'native-lock-s',
            basePrice: 8999,
            durationMinutes: 60,
            bestsellerFlag: false,
            rating: 4.79,
            reviewCount: 4900,
            description: '5 ways to unlock, fits on existing wooden & metal doors, 1-year battery life.',
            imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-lock-feature',
          },
        ],
      },
    ],
  },
  {
    id: 'cat-water-purifier',
    name: 'Native Water Purifier',
    slug: 'native-water-purifier',
    icon: '💧',
    badge: 'Sale Live',
    order: 12,
    isActive: true,
    subCategories: [
      {
        id: 'sub-wp-models',
        name: 'Native Purifiers',
        slug: 'models',
        icon: 'water_drop',
        badge: '2-Yr Filter Life',
        displayOrder: 1,
        isActive: true,
        services: [
          {
            id: 'srv-wp-m1',
            name: 'Native M1 Water Purifier (RO+UV+UF+Copper)',
            slug: 'native-m1',
            basePrice: 15499,
            durationMinutes: 60,
            bestsellerFlag: true,
            rating: 4.86,
            reviewCount: 182000,
            description: 'Needs zero service for 2 full years, 10-stage purification with active copper infusion & smart app tracking.',
            imageUrl: '/services/native-water-purifier.jpg',
            isActive: true,
            subCategoryId: 'sub-wp-models',
          },
          {
            id: 'srv-wp-m0',
            name: 'Native M0 Water Purifier (RO+UV)',
            slug: 'native-m0',
            basePrice: 11799,
            durationMinutes: 60,
            bestsellerFlag: false,
            rating: 4.81,
            reviewCount: 48000,
            description: 'Compact 8-stage RO+UV purifier with 2-year filter warranty and zero service hassle.',
            imageUrl: '/services/native-water-purifier.jpg',
            isActive: true,
            subCategoryId: 'sub-wp-models',
          },
          {
            id: 'srv-wp-m2-pro',
            name: 'Native M2 Pro Water Purifier (IoT Smart Dispense)',
            slug: 'native-m2-pro',
            basePrice: 18699,
            durationMinutes: 60,
            bestsellerFlag: false,
            rating: 4.91,
            reviewCount: 65000,
            description: 'Real-time TDS monitor, automatic filter health tracking via WiFi and touchless preset glass dispensing.',
            imageUrl: '/services/native-water-purifier.jpg',
            isActive: true,
            subCategoryId: 'sub-wp-models',
          },
          {
            id: 'srv-wp-m1-pro',
            name: 'Native M1 Pro Water Purifier (Alkaline Infusion)',
            slug: 'native-m1-pro',
            basePrice: 16699,
            durationMinutes: 60,
            bestsellerFlag: false,
            rating: 4.88,
            reviewCount: 39000,
            description: 'Alkaline mineralizer for pH 8.0+ hydration, 10-stage RO purification & 2-year filter guarantee.',
            imageUrl: '/services/native-water-purifier.jpg',
            isActive: true,
            subCategoryId: 'sub-wp-models',
          },
          {
            id: 'srv-wp-m3-pro',
            name: 'Native M3 Pro Water Purifier (Instant Hot & Cold Dispense)',
            slug: 'native-m3-pro',
            basePrice: 25199,
            durationMinutes: 75,
            bestsellerFlag: false,
            rating: 4.95,
            reviewCount: 21000,
            description: 'Instant boiling hot & chilled water dispensing with dual thermal compressors, RO+UV+Copper.',
            imageUrl: '/services/native-water-purifier.jpg',
            isActive: true,
            subCategoryId: 'sub-wp-models',
          },
        ],
      },
    ],
  },
  {
    id: 'cat-solar-panels',
    name: 'Solar Panels',
    slug: 'solar-panels',
    icon: '☀️',
    badge: 'Govt Subsidy',
    order: 13,
    isActive: true,
    subCategories: [
      {
        id: 'sub-solar-install',
        name: 'Solar Rooftop Installation',
        slug: 'solar-rooftop-installation',
        icon: 'roofing',
        badge: 'PM Surya Ghar',
        displayOrder: 1,
        isActive: true,
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
            imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
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
            imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
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
            imageUrl: 'https://images.unsplash.com/photo-1545208942-e1c9c916524b?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-install',
          },
        ],
      },
      {
        id: 'sub-solar-clean',
        name: 'Solar Panel Cleaning & Maintenance',
        slug: 'solar-panel-cleaning',
        icon: 'water_drop',
        badge: 'Boosts 25% Output',
        displayOrder: 2,
        isActive: true,
        services: [
          {
            id: 'srv-solar-deion',
            name: 'De-ionized Pure Water Panel Jet Wash (Up to 10 Panels)',
            slug: 'solar-panel-deionized-wash',
            basePrice: 699,
            durationMinutes: 45,
            bestsellerFlag: true,
            rating: 4.89,
            reviewCount: 2250,
            description: '• Soft-bristle non-scratch telescopic brush cleaning\n• De-mineralized spot-free water wash to prevent scaling\n• Instant 15-25% solar generation efficiency boost',
            imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-clean',
          },
        ],
      },
      {
        id: 'sub-solar-inv',
        name: 'Inverter & Electrical Diagnostics',
        slug: 'solar-inverter-repair',
        icon: 'electric_meter',
        badge: 'In 30 mins',
        displayOrder: 3,
        isActive: true,
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
            imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-inv',
          },
        ],
      },
      {
        id: 'sub-solar-srv',
        name: 'Site Survey & Subsidy Consultation',
        slug: 'solar-site-survey',
        icon: 'analytics',
        badge: '₹99 Consultation',
        displayOrder: 4,
        isActive: true,
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
            imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
            subCategoryId: 'sub-solar-srv',
          },
        ],
      },
    ],
  },
];

const SEED_SERVICES = [
  // Cleaning
  { id: 'svc-clean-1', categoryId: 'cat-clean', name: 'Bathroom Deep Cleaning (1 Bathroom)', slug: 'bathroom-deep-cleaning', description: 'Intense tile scrubbing, descaling of taps & toilet sanitization.', basePrice: 499, durationMinutes: 60, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-2', categoryId: 'cat-clean', name: '1 BHK Full Home Deep Cleaning', slug: '1bhk-deep-cleaning', description: 'Thorough mechanized scrubbing of all rooms, kitchen, and bathroom.', basePrice: 1999, durationMinutes: 240, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-3', categoryId: 'cat-clean', name: '3-Seater Sofa Fabric Shampoo & Vacuum', slug: 'sofa-shampoo-3seater', description: 'Foam shampoo & moisture extraction for fabric sofas.', basePrice: 699, durationMinutes: 60, isActive: true, order: 3, imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-clean-4', categoryId: 'cat-clean', name: 'Kitchen Degreasing & Deep Clean', slug: 'kitchen-degreasing', description: 'Oil & grease removal from tiles, slab, gas stove & cabinets.', basePrice: 999, durationMinutes: 120, isActive: true, order: 4, imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
  // Women's Salon
  { id: 'svc-wsalon-1', categoryId: 'cat-wsalon', name: 'Full Arms + Full Legs Rica Wax Combo', slug: 'rica-wax-combo', description: 'Painless Italian Rica wax for gentle hair removal.', basePrice: 899, durationMinutes: 60, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-wsalon-2', categoryId: 'cat-wsalon', name: 'O3+ Bridal Glow Facial', slug: 'o3-bridal-facial', description: 'Multi-step radiant facial with peeling & brightening serum.', basePrice: 1699, durationMinutes: 75, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
  // Men's Salon
  { id: 'svc-msalon-1', categoryId: 'cat-msalon', name: "Men's Haircut + Beard Styling", slug: 'mens-haircut-beard', description: 'Trendy scissor/clipper haircut, beard styling & neck cleanup.', basePrice: 349, durationMinutes: 45, isActive: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
  { id: 'svc-msalon-2', categoryId: 'cat-msalon', name: 'Activated Charcoal Pollution De-Tan Cleanup', slug: 'mens-charcoal-cleanup', description: 'Pore cleansing, dirt extraction, blackhead removal and mask.', basePrice: 549, durationMinutes: 40, isActive: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80' },
];

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  // Resilient in-memory fallback stores
  private inMemoryCategories = [...SEED_CATEGORIES];
  private inMemoryServices = [...SEED_SERVICES];
  private inMemoryProfiles: Map<string, any> = new Map();
  private inMemoryBookings: any[] = [
    {
      id: 'bk-seed-1',
      bookingRef: 'JVH-SVC-20260308-00001',
      serviceId: 'svc-1',
      customerId: 'user-c1',
      serviceProviderId: 'prof-v1',
      scheduledAt: new Date(Date.now() + 86400000),
      address: 'Prestige Golfshire Villa 12, Nandi Hills Road',
      city: 'Bangalore',
      pincode: '562110',
      totalAmount: 499,
      notes: 'Please check the solar inverter connection and main MCB panel.',
      status: 'ASSIGNED',
      createdAt: new Date('2026-03-08T09:00:00Z'),
      service: SEED_SERVICES[0],
      serviceProvider: {
        id: 'prof-v1',
        categoryName: 'Electrician',
        user: { firstName: 'Ramesh', lastName: 'Kumar', phone: '9845123456' },
      },
    },
    {
      id: 'bk-seed-2',
      bookingRef: 'JVH-SVC-20260308-00002',
      serviceId: 'svc-4',
      customerId: 'user-c1',
      serviceProviderId: 'prof-v2',
      scheduledAt: new Date(Date.now() + 172800000),
      address: 'Flat 402, Sobha City Casa Paradiso',
      city: 'Bangalore',
      pincode: '560077',
      totalAmount: 3499,
      notes: 'Tenant moving in. Deep sanitize bathrooms and kitchen.',
      status: 'PENDING',
      createdAt: new Date('2026-03-08T10:30:00Z'),
      service: SEED_SERVICES[3],
      serviceProvider: null,
    },
  ];

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {
    // Pre-populate demo provider profiles
    this.inMemoryProfiles.set('vendor-user-1', {
      id: 'prof-v1',
      userId: 'vendor-user-1',
      categoryName: 'Electrician',
      serviceArea: ['North Bangalore', 'Hebbal', 'Yelahanka'],
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'NOT_REQUIRED',
      isVerified: true,
      rating: 4.8,
      totalJobs: 142,
      bankAccountName: 'Ramesh Kumar',
      bankAccountNo: '918237461928',
      bankIfscCode: 'HDFC0001234',
      user: { id: 'vendor-user-1', firstName: 'Ramesh', lastName: 'Kumar', phone: '9845123456', email: 'ramesh.electric@example.com', profilePictureUrl: null },
    });
    this.inMemoryProfiles.set('vendor-user-2', {
      id: 'prof-v2',
      userId: 'vendor-user-2',
      categoryName: 'Deep Cleaning',
      serviceArea: ['Whitefield', 'Bellandur', 'Marathahalli'],
      verificationStatus: 'PENDING',
      requiresBackgroundCheck: true,
      backgroundCheckStatus: 'PENDING',
      isVerified: false,
      rating: 4.9,
      totalJobs: 52,
      bankAccountName: 'Sunita Devi',
      bankAccountNo: '123456789012',
      bankIfscCode: 'SBIN0004321',
      user: { id: 'vendor-user-2', firstName: 'Sunita', lastName: 'Devi', phone: '9876123489', email: 'sunita.cleaning@example.com', profilePictureUrl: null },
    });
    this.inMemoryProfiles.set('vendor-user-3', {
      id: 'prof-v3',
      userId: 'vendor-user-3',
      categoryName: 'Plumbing',
      serviceArea: ['Bangalore North', 'Hebbal', 'Yelahanka'],
      verificationStatus: 'APPROVED',
      requiresBackgroundCheck: false,
      backgroundCheckStatus: 'PASSED',
      isVerified: true,
      rating: 4.9,
      totalJobs: 98,
      bankAccountName: 'Mohammad Rafiq',
      bankAccountNo: '998877665544',
      bankIfscCode: 'ICIC0000999',
      user: { id: 'vendor-user-3', firstName: 'Mohammad', lastName: 'Rafiq', phone: '9988112233', email: 'rafiq.plumbing@example.com', profilePictureUrl: null },
    });
  }

  // ─── Service Category Listings ──────────────────────────────────────────
  async getCategories() {
    if (this.prisma.isDbAvailable()) {
      try {
        const categories = await this.prisma.serviceCategory.findMany({
          where: { isActive: true },
          include: {
            subCategories: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
              include: {
                tiers: {
                  where: { isActive: true },
                  orderBy: { displayOrder: 'asc' },
                  include: {
                    services: {
                      where: { isActive: true },
                      select: { id: true, basePrice: true },
                    },
                  },
                },
                services: {
                  where: { isActive: true },
                  select: { id: true, basePrice: true },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        });

        if (categories) {
          return categories.map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.map((sub) => ({
              ...sub,
              tiers: sub.tiers.map((t) => {
                const srvs = t.services || [];
                let startingPrice = t.startingPrice ? Number(t.startingPrice) : null;
                if (srvs.length > 0) {
                  const minPrice = Math.min(...srvs.map((s) => Number(s.basePrice || 0)).filter((p) => p > 0));
                  if (minPrice && isFinite(minPrice)) {
                    startingPrice = minPrice;
                  }
                }
                return {
                  ...t,
                  startingPrice,
                };
              }),
            })),
          }));
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getCategories: ${err?.message}`);
      }
    }
    return this.inMemoryCategories.filter((c) => c.isActive);
  }

  // ─── GET /subcategories?category=... ──────────────────────────────────────
  async getSubCategories(categoryIdOrSlug?: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const where: any = {
          isActive: true,
          category: { isActive: true },
        };
        if (categoryIdOrSlug) {
          where.category.OR = [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }];
        }

        const subCategories = await this.prisma.serviceSubCategory.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true, icon: true, badge: true, isActive: true } },
            tiers: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
            services: { where: { isActive: true }, orderBy: { order: 'asc' } },
          },
          orderBy: { displayOrder: 'asc' },
        });
        return subCategories;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getSubCategories: ${err?.message}`);
      }
    }
    return [];
  }

  // ─── GET /tiers/:subCategoryIdOrSlug ──────────────────────────────────────
  async getSubCategoryTiers(subCategoryIdOrSlug: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const tiers = await this.prisma.serviceTier.findMany({
          where: {
            subCategory: {
              OR: [{ id: subCategoryIdOrSlug }, { slug: subCategoryIdOrSlug }],
              isActive: true,
              category: { isActive: true },
            },
            isActive: true,
          },
          include: {
            subCategory: { select: { id: true, name: true, slug: true, categoryId: true } },
            services: { where: { isActive: true }, orderBy: { order: 'asc' } },
          },
          orderBy: { displayOrder: 'asc' },
        });
        return tiers;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getSubCategoryTiers: ${err?.message}`);
      }
    }
    return [];
  }

  // ─── GET /categories/:id/menu — Grouped Response ───────────────────────
  async getCategoryMenu(categoryIdOrSlug: string) {
    const rawParam = categoryIdOrSlug || '';
    const normalizedSlug = rawParam
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const cleanAlphaNum = rawParam.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (this.prisma.isDbAvailable()) {
      try {
        const isAcAlias = ['ac', 'ac-service', 'acservice', 'air-conditioner', 'ac-repair'].includes(normalizedSlug);
        let category = await this.prisma.serviceCategory.findFirst({
          where: {
            OR: [
              { id: rawParam },
              { slug: rawParam },
              { slug: normalizedSlug },
              { slug: normalizedSlug.replace(/-/g, '') },
              ...(isAcAlias ? [{ slug: 'ac-appliance-repair' }] : []),
              { name: { equals: rawParam, mode: 'insensitive' } },
            ],
          },
          include: {
            subCategories: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
              include: {
                tiers: {
                  where: { isActive: true },
                  orderBy: { displayOrder: 'asc' },
                  include: {
                    services: { where: { isActive: true }, orderBy: { order: 'asc' } },
                  },
                },
                services: { where: { isActive: true }, orderBy: { order: 'asc' } },
              },
            },
            services: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              include: {
                subCategory: true,
                tier: true,
              },
            },
          },
        });

        // If not found directly, do prioritized fuzzy match across all categories
        if (!category) {
          const allCategories = await this.prisma.serviceCategory.findMany({
            include: {
              subCategories: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
                include: {
                  tiers: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                      services: { where: { isActive: true }, orderBy: { order: 'asc' } },
                    },
                  },
                  services: { where: { isActive: true }, orderBy: { order: 'asc' } },
                },
              },
              services: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                include: {
                  subCategory: true,
                  tier: true,
                },
              },
            },
          });

          // Priority 1: Exact alphanumeric match
          category =
            allCategories.find((c) => {
              const catClean = c.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
              const nameClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
              return catClean === cleanAlphaNum || nameClean === cleanAlphaNum;
            }) || null;

          // Priority 2: Starts-with match
          if (!category) {
            category =
              allCategories.find((c) => {
                const catClean = c.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
                const nameClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return catClean.startsWith(cleanAlphaNum) || nameClean.startsWith(cleanAlphaNum);
              }) || null;
          }
        }

        // 🔒 STRICT INACTIVE CHECK: If category exists in DB and is inactive, return null immediately
        if (category) {
          if (category.isActive === false) {
            return null;
          }

          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            badge: category.badge,
            description: category.description,
            order: category.order,
            isActive: category.isActive,
            subCategories: category.subCategories,
            services: category.services,
          };
        }

        // Category was not found in DB
        return null;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getCategoryMenu: ${err?.message}`);
      }
    }

    // In-memory fallback only when database is completely disconnected
    const cat = this.inMemoryCategories.find((c) => {
      if (!c.isActive) return false;
      const cClean = c.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        c.id === rawParam ||
        c.slug === rawParam ||
        c.slug === normalizedSlug ||
        cClean === cleanAlphaNum ||
        nClean === cleanAlphaNum ||
        cClean.includes(cleanAlphaNum) ||
        cleanAlphaNum.includes(cClean)
      );
    });
    if (!cat) return null;
    const services = this.inMemoryServices.filter((s) => s.categoryId === cat.id && s.isActive);
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      badge: (cat as any).badge || null,
      description: null,
      order: cat.order,
      isActive: cat.isActive,
      subCategories: [
        {
          id: `sub-${cat.id}`,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          badge: null,
          groupHeader: null,
          displayOrder: 1,
          isActive: true,
          tiers: [],
          services,
        },
      ],
      services,
    };
  }

  // ─── GET /services — Filtered Services ───────────────────────────────────
  async getServices(categorySlug?: string, subCategorySlug?: string, tierSlug?: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const where: any = {
          isActive: true,
          category: { isActive: true },
        };
        if (categorySlug) {
          where.category.slug = categorySlug;
        }
        if (subCategorySlug) {
          where.subCategory = { slug: subCategorySlug, isActive: true };
        }
        if (tierSlug) {
          where.tier = { slug: tierSlug, isActive: true };
        }

        const services = await this.prisma.service.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, slug: true, icon: true, badge: true } },
            subCategory: { select: { id: true, name: true, slug: true, icon: true, badge: true } },
            tier: { select: { id: true, name: true, slug: true, tag: true, badge: true, startingPrice: true } },
          },
          orderBy: { order: 'asc' },
        });
        if (services) return services;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getServices: ${err?.message}`);
      }
    }

    if (categorySlug) {
      const cat = this.inMemoryCategories.find((c) => c.slug === categorySlug && c.isActive);
      if (!cat) return [];
      return this.inMemoryServices
        .filter((s) => s.categoryId === cat.id && s.isActive)
        .map((s) => ({ ...s, category: cat }));
    }

    return this.inMemoryServices
      .filter((s) => s.isActive)
      .map((s) => ({
        ...s,
        category: this.inMemoryCategories.find((c) => c.id === s.categoryId && c.isActive),
      }))
      .filter((s) => s.category);
  }

  // ─── GET /services/:idOrSlug — Strict Direct Fetch Check ──────────────────
  async getServiceByIdOrSlug(idOrSlug: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const service = await this.prisma.service.findFirst({
          where: {
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          },
          include: {
            category: true,
            subCategory: true,
            tier: true,
          },
        });

        if (!service) {
          throw new NotFoundException('Service not found');
        }

        // Strict cascading active check
        if (
          !service.isActive ||
          !service.category?.isActive ||
          (service.subCategory && !service.subCategory.isActive) ||
          (service.tier && !service.tier.isActive)
        ) {
          throw new NotFoundException('This service is currently disabled or unavailable.');
        }

        return service;
      } catch (err: any) {
        if (err instanceof NotFoundException) throw err;
        this.logger.warn(`Remote DB error in getServiceByIdOrSlug: ${err?.message}`);
      }
    }

    const service = this.inMemoryServices.find((s) => (s.id === idOrSlug || s.slug === idOrSlug) && s.isActive);
    if (!service) throw new NotFoundException('Service not found or unavailable');
    const cat = this.inMemoryCategories.find((c) => c.id === service.categoryId && c.isActive);
    if (!cat) throw new NotFoundException('Service parent category is disabled');
    return { ...service, category: cat };
  }

  // ─── Provider Onboarding / Profile ────────────────────────────────────────
  async getProviderProfile(userId: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        let profile = await this.prisma.serviceProviderProfile.findUnique({
          where: { userId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true },
            },
          },
        });

        if (!profile) {
          profile = await this.prisma.serviceProviderProfile.create({
            data: {
              userId,
              serviceArea: ['Bangalore'],
              categoryName: 'Electrician',
              requiresBackgroundCheck: false,
              verificationStatus: 'PENDING',
              backgroundCheckStatus: 'NOT_REQUIRED',
              isVerified: false,
            },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, profilePictureUrl: true },
              },
            },
          });
        }

        if (profile) return profile;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getProviderProfile: ${err?.message}`);
      }
    }

    let existing = this.inMemoryProfiles.get(userId);
    if (!existing) {
      existing = {
        id: `prof-${userId}`,
        userId,
        categoryName: 'Electrician',
        serviceArea: ['Bangalore'],
        requiresBackgroundCheck: false,
        verificationStatus: 'PENDING',
        backgroundCheckStatus: 'NOT_REQUIRED',
        isVerified: false,
        rating: 5.0,
        totalJobs: 0,
        bankAccountName: null,
        bankAccountNo: null,
        bankIfscCode: null,
        user: { id: userId, firstName: 'Vendor', lastName: 'Professional', email: `${userId}@zivahousing.com`, phone: '9876543210', profilePictureUrl: null },
      };
      this.inMemoryProfiles.set(userId, existing);
    }
    return existing;
  }

  async onboardProvider(
    userId: string,
    dto: {
      serviceArea: string[];
      categoryName?: string;
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
    },
  ) {
    const categoryName = dto.categoryName || 'Electrician';
    const requiresBackgroundCheck = BACKGROUND_CHECK_CATEGORIES.some(
      (c) => c.toLowerCase() === categoryName.toLowerCase(),
    );

    if (this.prisma.isDbAvailable()) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { role: 'SERVICE_PROVIDER', status: 'ACTIVE' },
        }).catch(() => {});

        const profile = await this.prisma.serviceProviderProfile.upsert({
          where: { userId },
          update: {
            serviceArea: dto.serviceArea,
            categoryName,
            requiresBackgroundCheck,
            verificationStatus: 'PENDING',
            backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
            verificationNotes: null,
            idProofUrl: dto.idProofUrl || null,
            addressProofUrl: dto.addressProofUrl || null,
            certificateUrl: dto.certificateUrl || null,
            isVerified: false,
          },
          create: {
            userId,
            serviceArea: dto.serviceArea,
            categoryName,
            requiresBackgroundCheck,
            verificationStatus: 'PENDING',
            backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
            verificationNotes: null,
            idProofUrl: dto.idProofUrl || null,
            addressProofUrl: dto.addressProofUrl || null,
            certificateUrl: dto.certificateUrl || null,
            isVerified: false,
          },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        });

        return profile;
      } catch (err: any) {
        this.logger.warn(`Remote DB error in onboardProvider: ${err?.message}`);
      }
    }

    const inMem = {
      id: `prof-${userId}`,
      userId,
      categoryName,
      serviceArea: dto.serviceArea,
      requiresBackgroundCheck,
      verificationStatus: 'PENDING',
      backgroundCheckStatus: requiresBackgroundCheck ? 'PENDING' : 'NOT_REQUIRED',
      verificationNotes: null,
      idProofUrl: dto.idProofUrl || null,
      addressProofUrl: dto.addressProofUrl || null,
      certificateUrl: dto.certificateUrl || null,
      isVerified: false,
      rating: 5.0,
      totalJobs: 0,
      user: { id: userId, firstName: 'Applicant', lastName: 'Vendor', email: '', phone: '9876543210' },
    };
    this.inMemoryProfiles.set(userId, inMem);
    return inMem;
  }

  async resubmitProviderProfile(
    userId: string,
    dto: {
      serviceArea?: string[];
      idProofUrl?: string;
      addressProofUrl?: string;
      certificateUrl?: string;
      notes?: string;
    },
  ) {
    if (this.prisma.isDbAvailable()) {
      try {
        const existing = await this.prisma.serviceProviderProfile.findUnique({
          where: { userId },
        });
        if (existing) {
          const updated = await this.prisma.serviceProviderProfile.update({
            where: { userId },
            data: {
              verificationStatus: 'PENDING',
              verificationNotes: 'Re-submitted by vendor. Awaiting admin re-verification.',
              serviceArea: dto.serviceArea || existing.serviceArea,
              idProofUrl: dto.idProofUrl || existing.idProofUrl,
              addressProofUrl: dto.addressProofUrl || existing.addressProofUrl,
              certificateUrl: dto.certificateUrl || existing.certificateUrl,
              isVerified: false,
            },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
          });
          return updated;
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in resubmitProviderProfile: ${err?.message}`);
      }
    }

    const inMem = await this.getProviderProfile(userId);
    inMem.verificationStatus = 'PENDING';
    inMem.verificationNotes = 'Re-submitted by vendor. Awaiting admin re-verification.';
    if (dto.serviceArea) inMem.serviceArea = dto.serviceArea;
    if (dto.idProofUrl) inMem.idProofUrl = dto.idProofUrl;
    if (dto.addressProofUrl) inMem.addressProofUrl = dto.addressProofUrl;
    if (dto.certificateUrl) inMem.certificateUrl = dto.certificateUrl;
    inMem.isVerified = false;
    this.inMemoryProfiles.set(userId, inMem);
    return inMem;
  }

  // ─── Public Bookable Providers (Strict Verification Enforcement) ───────────
  async getPublicBookableProviders(categoryName?: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        const where: any = {
          isVerified: true,
          verificationStatus: 'APPROVED',
        };

        if (categoryName) {
          where.categoryName = { equals: categoryName, mode: 'insensitive' };
        }

        const providers = await this.prisma.serviceProviderProfile.findMany({
          where,
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, profilePictureUrl: true },
            },
          },
          orderBy: { rating: 'desc' },
        });

        if (providers && providers.length > 0) {
          return providers.filter((p) => {
            if (p.requiresBackgroundCheck) {
              return p.backgroundCheckStatus === 'PASSED';
            }
            return true;
          });
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getPublicBookableProviders: ${err?.message}`);
      }
    }

    const all = Array.from(this.inMemoryProfiles.values()).filter(
      (p) => p.isVerified && p.verificationStatus === 'APPROVED',
    );
    if (!categoryName) return all;
    return all.filter((p) => p.categoryName.toLowerCase() === categoryName.toLowerCase());
  }

  // ─── Create Service Booking ───────────────────────────────────────────────
  async createBooking(
    customerId: string,
    dto: { serviceId: string; scheduledAt: string; address: string; city: string; pincode: string; notes?: string },
  ) {
    if (this.prisma.isDbAvailable()) {
      try {
        const service = await this.prisma.service.findUnique({
          where: { id: dto.serviceId },
        });
        if (service) {
          const seq = (await this.prisma.serviceBooking.count().catch(() => 10)) + 1;
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const bookingRef = `JVH-SVC-${dateStr}-${String(seq).padStart(5, '0')}`;

          const booking = await this.prisma.serviceBooking.create({
            data: {
              bookingRef,
              serviceId: dto.serviceId,
              customerId,
              scheduledAt: new Date(dto.scheduledAt),
              address: dto.address,
              city: dto.city,
              pincode: dto.pincode,
              totalAmount: service.basePrice,
              notes: dto.notes,
              status: 'PENDING',
            },
            include: { service: true },
          });

          this.notifications.sendNotification({
            userId: customerId,
            type: 'SERVICES',
            title: `Service Booking Confirmed! (${bookingRef})`,
            body: `Your booking for ${service.name} has been received for ${new Date(dto.scheduledAt).toLocaleDateString()}. We are matching a verified professional for you.`,
          }).catch(() => {});

          return booking;
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in createBooking: ${err?.message}`);
      }
    }

    const matchedService = this.inMemoryServices.find((s) => s.id === dto.serviceId) || SEED_SERVICES[0];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingRef = `JVH-SVC-${dateStr}-${String(this.inMemoryBookings.length + 1).padStart(5, '0')}`;
    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingRef,
      serviceId: dto.serviceId,
      customerId,
      serviceProviderId: null,
      scheduledAt: new Date(dto.scheduledAt),
      address: dto.address,
      city: dto.city,
      pincode: dto.pincode,
      totalAmount: matchedService.basePrice,
      notes: dto.notes,
      status: 'PENDING',
      createdAt: new Date(),
      service: matchedService,
      serviceProvider: null,
    };
    this.inMemoryBookings.unshift(newBooking);
    return newBooking;
  }

  // ─── Retrieve My Bookings ─────────────────────────────────────────────────
  async getMyBookings(userId: string, role: string) {
    if (this.prisma.isDbAvailable()) {
      try {
        if (role === 'SERVICE_PROVIDER') {
          const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
            where: { userId },
          });
          if (providerProfile) {
            return await this.prisma.serviceBooking.findMany({
              where: { serviceProviderId: providerProfile.id },
              include: { service: true },
              orderBy: { scheduledAt: 'desc' },
            });
          }
        } else {
          return await this.prisma.serviceBooking.findMany({
            where: { customerId: userId },
            include: { service: true, serviceProvider: { include: { user: { select: { firstName: true, phone: true } } } } },
            orderBy: { scheduledAt: 'desc' },
          });
        }
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getMyBookings: ${err?.message}`);
      }
    }

    if (role === 'SERVICE_PROVIDER') {
      const prof = this.inMemoryProfiles.get(userId);
      const profId = prof ? prof.id : `prof-${userId}`;
      return this.inMemoryBookings.filter((b) => b.serviceProviderId === profId);
    }
    return this.inMemoryBookings.filter((b) => b.customerId === userId || b.customerId === 'user-c1');
  }

  // Retrieve Open Unassigned Bookings
  async getOpenBookings() {
    if (this.prisma.isDbAvailable()) {
      try {
        return await this.prisma.serviceBooking.findMany({
          where: {
            status: 'PENDING',
            serviceProviderId: null,
          },
          include: { service: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err: any) {
        this.logger.warn(`Remote DB error in getOpenBookings: ${err?.message}`);
      }
    }

    return this.inMemoryBookings.filter((b) => b.status === 'PENDING' && !b.serviceProviderId);
  }

  // ─── Update Booking Status ───────────────────────────────────────────────
  async updateBookingStatus(userId: string, role: string, bookingId: string, status: string) {
    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid booking status: ${status}`);
    }

    if (this.prisma.isDbAvailable()) {
      try {
        const booking = await this.prisma.serviceBooking.findUnique({
          where: { id: bookingId },
          include: { service: true },
        });
        if (booking) {
          let updateData: any = { status };

          if (role === 'SERVICE_PROVIDER') {
            const providerProfile = await this.prisma.serviceProviderProfile.findUnique({
              where: { userId },
            });
            if (!providerProfile) throw new ForbiddenException('Not an onboarded provider');

            if (status === 'ASSIGNED') {
              updateData.serviceProviderId = providerProfile.id;
            } else if (booking.serviceProviderId !== providerProfile.id) {
              throw new ForbiddenException('You are not assigned to this job');
            }
          } else {
            if (booking.customerId !== userId) {
              throw new ForbiddenException('Unauthorized');
            }
            if (status !== 'CANCELLED') {
              throw new BadRequestException('Customers can only transition status to CANCELLED');
            }
          }

          const updated = await this.prisma.serviceBooking.update({
            where: { id: bookingId },
            data: updateData,
            include: { service: true },
          });

          return updated;
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
        this.logger.warn(`Remote DB error in updateBookingStatus: ${err?.message}`);
      }
    }

    const inMem = this.inMemoryBookings.find((b) => b.id === bookingId);
    if (!inMem) throw new NotFoundException('Booking not found');
    inMem.status = status;
    if (status === 'ASSIGNED' && role === 'SERVICE_PROVIDER') {
      const prof = this.inMemoryProfiles.get(userId);
      inMem.serviceProviderId = prof ? prof.id : `prof-${userId}`;
    }
    return inMem;
  }
}
