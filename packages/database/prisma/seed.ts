import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Ziva Housing database seed...');

  // ─── Amenities ─────────────────────────────────────────────────────────────
  const amenities = [
    // Basic
    { name: 'Lift/Elevator', category: 'basic' },
    { name: 'Power Backup', category: 'basic' },
    { name: 'Water Supply 24/7', category: 'basic' },
    { name: 'Car Parking', category: 'basic' },
    { name: 'Two Wheeler Parking', category: 'basic' },
    // Security
    { name: 'Security/Guard', category: 'security' },
    { name: 'CCTV', category: 'security' },
    { name: 'Intercom', category: 'security' },
    { name: 'Gated Community', category: 'security' },
    { name: 'Video Door Phone', category: 'security' },
    // Recreational
    { name: 'Swimming Pool', category: 'recreational' },
    { name: 'Gym/Fitness Center', category: 'recreational' },
    { name: 'Clubhouse', category: 'recreational' },
    { name: 'Children Play Area', category: 'recreational' },
    { name: 'Garden/Park', category: 'recreational' },
    { name: 'Sports Court', category: 'recreational' },
    // Connectivity
    { name: 'High-Speed Internet', category: 'connectivity' },
    { name: 'DTH/Cable TV', category: 'connectivity' },
    // Green
    { name: 'Solar Power', category: 'green' },
    { name: 'Rainwater Harvesting', category: 'green' },
    { name: 'Waste Management', category: 'green' },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity,
    });
  }
  console.log(`✅ Seeded ${amenities.length} amenities`);

  // ─── Service Categories, Groups & Services (Urban Company Model) ──────────────
  const serviceData = [
    // 1. Cleaning (ACTIVE)
    {
      name: 'Cleaning',
      slug: 'cleaning',
      icon: 'vacuum',
      isActive: true,
      order: 1,
      description: 'Professional deep cleaning, bathroom sanitization, sofa and carpet care with industrial equipment.',
      groups: [
        {
          groupName: 'Bathroom & Toilet Cleaning',
          displayOrder: 1,
          services: [
            { name: 'Bathroom Deep Cleaning (1 Bathroom)', slug: 'bathroom-deep-cleaning', basePrice: 499, durationMinutes: 60, description: 'Intense tile scrubbing, descaling of taps, shower glass & toilet sanitization.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Bathroom Descaling & Stain Removal', slug: 'bathroom-descaling', basePrice: 699, durationMinutes: 75, description: 'Hard water stain removal from tiles, mirrors, and glass partitions.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Full Bathroom + Toilet Combo (2 Bathrooms)', slug: 'bathroom-combo-cleaning', basePrice: 899, durationMinutes: 110, description: 'Complete deep cleaning and odor treatment for 2 bathrooms.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Full Home Deep Cleaning',
          displayOrder: 2,
          services: [
            { name: '1 BHK Full Home Deep Cleaning', slug: '1bhk-deep-cleaning', basePrice: 1999, durationMinutes: 240, description: 'Thorough cleaning of living room, bedroom, kitchen, bathroom & balcony.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
            { name: '2 BHK Full Home Deep Cleaning', slug: '2bhk-deep-cleaning', basePrice: 2899, durationMinutes: 300, description: 'Mechanized floor scrubbing, dusting, kitchen degreasing & 2 bathroom washes.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
            { name: '3 BHK Full Home Deep Cleaning', slug: '3bhk-deep-cleaning', basePrice: 3899, durationMinutes: 360, description: 'Complete sanitization and mechanized polishing for 3 BHK apartments.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
            { name: 'Move-in / Vacant House Cleaning', slug: 'move-in-cleaning', basePrice: 2499, durationMinutes: 300, description: 'Deep dusting, vacuuming of cabinets, windows & intensive sanitization.', imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Sofa & Carpet Cleaning',
          displayOrder: 3,
          services: [
            { name: '3-Seater Sofa Fabric Shampoo & Vacuum', slug: 'sofa-shampoo-3seater', basePrice: 699, durationMinutes: 60, description: 'Dry vacuuming, foam shampoo & moisture extraction for fabric sofas.', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
            { name: '5-Seater Sofa Deep Spa Treatment', slug: 'sofa-shampoo-5seater', basePrice: 1099, durationMinutes: 90, description: 'Stain treatment and sanitization for 5-seater sofas & cushions.', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
            { name: 'Living Room Carpet Deep Shampoo', slug: 'carpet-deep-shampoo', basePrice: 799, durationMinutes: 60, description: 'Industrial extraction wash for large carpets and rugs.', imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Kitchen Deep Cleaning',
          displayOrder: 4,
          services: [
            { name: 'Kitchen Degreasing & Deep Clean', slug: 'kitchen-degreasing', basePrice: 999, durationMinutes: 120, description: 'Oil & grease removal from tiles, slab, sink, gas stove & cabinets exterior.', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
            { name: 'Chimney & Exhaust Fan Deep Cleaning', slug: 'chimney-cleaning', basePrice: 599, durationMinutes: 60, description: 'Filter mesh dismantling, caustic degreasing and motor baffle cleanup.', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Balcony & Glass Cleaning',
          displayOrder: 5,
          services: [
            { name: 'Balcony Jet Wash & Floor Scrubbing', slug: 'balcony-jet-wash', basePrice: 399, durationMinutes: 45, description: 'High pressure wash of balcony floor, railings and drainage clearance.', imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 2. Women's Salon & Spa (ACTIVE)
    {
      name: "Women's Salon & Spa",
      slug: 'womens-salon-spa',
      icon: 'face_retouching_natural',
      isActive: true,
      order: 2,
      description: 'Salon and luxury spa at home with single-use kits, certified beauticians and top brands.',
      groups: [
        {
          groupName: 'Waxing & Threading',
          displayOrder: 1,
          services: [
            { name: 'Full Arms + Full Legs + Underarms (Rica Wax)', slug: 'rica-wax-combo', basePrice: 899, durationMinutes: 60, description: 'Painless Italian Rica wax for gentle hair removal & skin brightening.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
            { name: 'Eyebrow + Upper Lip + Forehead Threading', slug: 'threading-combo', basePrice: 99, durationMinutes: 20, description: 'Precision facial hair threading and aloe vera soothing massage.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Facial & Cleanup',
          displayOrder: 2,
          services: [
            { name: "O3+ Bridal Glow Facial", slug: 'o3-bridal-facial', basePrice: 1699, durationMinutes: 75, description: 'Multi-step radiant facial with peeling, brightening serum and mask.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
            { name: 'Sara Fruit Detox Cleanup', slug: 'sara-detox-cleanup', basePrice: 699, durationMinutes: 45, description: 'Fruit scrub, blackhead extraction, massage & hydration pack.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Manicure & Pedicure',
          displayOrder: 3,
          services: [
            { name: 'Sara Luxury Pedicure', slug: 'sara-luxury-pedicure', basePrice: 599, durationMinutes: 45, description: 'Foot soak, cuticle care, dead skin scrubbing and relaxing massage.', imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80' },
            { name: 'Spa Manicure & Pedicure Duo', slug: 'spa-mani-pedi-duo', basePrice: 999, durationMinutes: 80, description: 'Complete hand and feet pampering package with organic scrub.', imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Hair Care & Styling',
          displayOrder: 4,
          services: [
            { name: "L'Oreal Deep Conditioning Hair Spa", slug: 'loreal-hair-spa', basePrice: 899, durationMinutes: 60, description: 'Intensive scalp massage, steam treatment and split end repair.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Spa & Body Massage',
          displayOrder: 5,
          services: [
            { name: 'Aroma Oil Full Body Relaxation Massage (60 min)', slug: 'aroma-full-body-massage', basePrice: 1299, durationMinutes: 60, description: 'Calming lavender oil massage with pressure point therapy.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 3. Men's Salon & Massage (ACTIVE)
    {
      name: "Men's Salon & Massage",
      slug: 'mens-salon-massage',
      icon: 'person_grooming',
      isActive: true,
      order: 3,
      description: "Men's grooming, styled haircuts, beard shaping, charcoal cleanups & head/body massages at home.",
      groups: [
        {
          groupName: 'Haircut & Beard Grooming',
          displayOrder: 1,
          services: [
            { name: "Men's Haircut + Beard Styling", slug: 'mens-haircut-beard', basePrice: 349, durationMinutes: 45, description: 'Trendy scissor/clipper haircut, beard styling & neck cleanup.', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
            { name: 'Beard Trimming & Hot Towel Shave', slug: 'beard-hot-towel', basePrice: 199, durationMinutes: 30, description: 'Razor precision lining, herbal balm and hot towel hydration.', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: "Men's Facial & Cleanup",
          displayOrder: 2,
          services: [
            { name: 'Activated Charcoal Pollution De-Tan Cleanup', slug: 'mens-charcoal-cleanup', basePrice: 549, durationMinutes: 40, description: 'Pore cleansing, dirt extraction, blackhead removal and mask.', imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Relaxing Head & Body Massage',
          displayOrder: 3,
          services: [
            { name: 'Stress Relief Head, Neck & Shoulder Massage (30 min)', slug: 'mens-head-shoulder-massage', basePrice: 399, durationMinutes: 30, description: 'Ayurvedic cooling oil head massage with shoulder relaxation.', imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80' },
            { name: 'Full Body Deep Tissue Massage for Men (60 min)', slug: 'mens-deep-tissue-massage', basePrice: 1199, durationMinutes: 60, description: 'Firm pressure muscle relief massage for back pain and fatigue.', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 4. AC & Appliance Repair (DISABLED - Phase 2)
    {
      name: 'AC & Appliance Repair',
      slug: 'ac-appliance-repair',
      icon: 'ac_unit',
      isActive: false,
      order: 4,
      description: 'Expert diagnostics, servicing, gas recharge & PCB repair for household appliances.',
      groups: [
        {
          groupName: 'AC Service & Repair',
          displayOrder: 1,
          services: [
            { name: 'Split AC Power Jet Service', slug: 'split-ac-power-jet', basePrice: 499, durationMinutes: 60, description: 'Deep water foam jet cleaning of indoor cooling coil & outdoor unit.', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80' },
            { name: 'AC Gas Refill & Leak Inspection', slug: 'ac-gas-leak-check', basePrice: 1499, durationMinutes: 60, description: 'Complete Freon/R32 gas charging and leak braze repair.', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Washing Machine & Fridge Repair',
          displayOrder: 2,
          services: [
            { name: 'Washing Machine Checkup & Repair', slug: 'washing-machine-checkup', basePrice: 299, durationMinutes: 45, description: 'Diagnosis of motor, spin cycle, drainage or PCB motherboard error.', imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80' },
            { name: 'Refrigerator Cooling Repair', slug: 'refrigerator-cooling-repair', basePrice: 349, durationMinutes: 45, description: 'Thermostat, compressor relay and gas circulation diagnostic.', imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 5. Electrician, Plumber & Carpenter (DISABLED - Phase 2)
    {
      name: 'Electrician, Plumber & Carpenter',
      slug: 'electrician-plumber-carpenter',
      icon: 'home_repair_service',
      isActive: false,
      order: 5,
      description: 'Doorstep certified handymen for home electrical, plumbing and woodwork repairs.',
      groups: [
        {
          groupName: 'Electrician Services',
          displayOrder: 1,
          services: [
            { name: 'Switchboard / Socket Repair & Install', slug: 'switchboard-repair', basePrice: 149, durationMinutes: 30, description: 'Fix faulty modular switches, MCB trips and socket replacements.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
            { name: 'Ceiling Fan Installation / Repair', slug: 'fan-install-repair-handy', basePrice: 249, durationMinutes: 45, description: 'Assembly, regulator wiring and ceiling fan mount.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Plumbing Services',
          displayOrder: 2,
          services: [
            { name: 'Tap / Faucet Leak Repair', slug: 'tap-leak-repair', basePrice: 199, durationMinutes: 30, description: 'Spindle change, washer replacement and faucet fixing.', imageUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Drainage & Pipe Blockage Clearing', slug: 'drain-block-clearing', basePrice: 399, durationMinutes: 45, description: 'Mechanical unclogging of kitchen sink, floor traps & bathroom drains.', imageUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          groupName: 'Carpentry Services',
          displayOrder: 3,
          services: [
            { name: 'Door Lock Repair & Handle Fitting', slug: 'door-lock-fitting', basePrice: 299, durationMinutes: 45, description: 'Mortise lock, latch replacement and hinges realignment.', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Drill & Hang (Shelves, Curtains, TV)', slug: 'drill-hang-service', basePrice: 199, durationMinutes: 30, description: 'Wall mounting of frames, mirrors, rods and brackets.', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 6. Painting & Waterproofing (DISABLED - Phase 2)
    {
      name: 'Painting & Waterproofing',
      slug: 'painting-waterproofing',
      icon: 'format_paint',
      isActive: false,
      order: 6,
      description: 'Complete interior & exterior home painting with laser measurement and waterproofing solutions.',
      groups: [
        {
          groupName: 'Home Painting',
          displayOrder: 1,
          services: [
            { name: 'Full Home Interior Painting Consultation', slug: 'interior-painting-consult', basePrice: 499, durationMinutes: 60, description: 'Laser wall measurement, color visualization and detailed quotation.', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 7. InstaHelp (Cooks, Maids & Care) (DISABLED - Phase 2)
    {
      name: 'InstaHelp',
      slug: 'instahelp',
      icon: 'support_agent',
      isActive: false,
      order: 7,
      description: 'Instant and verified on-demand helpers, daily cooks, babysitters & elderly caregivers.',
      groups: [
        {
          groupName: 'Daily Home Help',
          displayOrder: 1,
          services: [
            { name: 'Cook for 1 Meal (Up to 4 Persons)', slug: 'cook-single-meal', basePrice: 399, durationMinutes: 90, description: 'Freshly prepared home-style food (Roti, Sabzi, Dal, Rice).', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80' },
            { name: 'Emergency Housekeeper / Maid (2 Hours)', slug: 'emergency-maid-2hr', basePrice: 349, durationMinutes: 120, description: 'Vetted helper for utensil washing, sweeping and mopping.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 8. Pest Control (DISABLED - Phase 2)
    {
      name: 'Pest Control',
      slug: 'pest-control',
      icon: 'pest_control',
      isActive: false,
      order: 8,
      description: 'Odorless chemical and gel treatments with government approved safe chemicals.',
      groups: [
        {
          groupName: 'Pest Extermination',
          displayOrder: 1,
          services: [
            { name: 'Cockroach & Ant Gel Treatment', slug: 'cockroach-gel-treatment', basePrice: 599, durationMinutes: 45, description: 'Bayer herbal gel spots in kitchen and bathrooms with 6-month warranty.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 9. Packers & Movers (DISABLED - Phase 2)
    {
      name: 'Packers & Movers',
      slug: 'packers-movers',
      icon: 'local_shipping',
      isActive: false,
      order: 9,
      description: 'Hassle-free household goods relocation with 3-layer bubble packaging and dedicated trucks.',
      groups: [
        {
          groupName: 'Home Shifting',
          displayOrder: 1,
          services: [
            { name: 'Local Within-City Moving Consultation', slug: 'local-moving-survey', basePrice: 299, durationMinutes: 45, description: 'Free inventory evaluation and confirmed flat quotation.', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },
  ];

  for (const catData of serviceData) {
    const { groups, ...categoryFields } = catData;
    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        icon: catData.icon,
        isActive: catData.isActive,
        order: catData.order,
        description: catData.description,
      },
      create: {
        ...categoryFields,
      },
    });

    for (const grp of groups) {
      let group = await prisma.serviceGroup.findFirst({
        where: { categoryId: category.id, groupName: grp.groupName },
      });

      if (!group) {
        group = await prisma.serviceGroup.create({
          data: {
            categoryId: category.id,
            groupName: grp.groupName,
            displayOrder: grp.displayOrder,
          },
        });
      } else {
        await prisma.serviceGroup.update({
          where: { id: group.id },
          data: { displayOrder: grp.displayOrder },
        });
      }

      for (const svc of grp.services) {
        const createdSvc = await prisma.service.upsert({
          where: { slug: svc.slug },
          update: {
            name: svc.name,
            basePrice: svc.basePrice,
            durationMinutes: svc.durationMinutes,
            description: svc.description,
            imageUrl: svc.imageUrl,
            isActive: catData.isActive,
            categoryId: category.id,
          },
          create: {
            ...svc,
            categoryId: category.id,
            isActive: catData.isActive,
          },
        });

        const existingSubOpt = await prisma.serviceSubOption.findFirst({
          where: { serviceId: createdSvc.id, name: 'Standard Service' },
        });

        if (!existingSubOpt) {
          await prisma.serviceSubOption.create({
            data: {
              serviceId: createdSvc.id,
              groupId: group.id,
              name: 'Standard Service',
              description: 'Standard verified professional delivery with safety kit',
              priceAdjust: 0,
              isActive: true,
              displayOrder: 1,
            },
          });
        }
      }
    }
  }
  console.log(`✅ Seeded ${serviceData.length} Urban Company service categories with groups & services`);

  // ─── Commission Rules ───────────────────────────────────────────────────────
  const commissionRules = [
    {
      name: 'Property Sale Commission',
      type: 'PERCENTAGE' as const,
      rate: 2.5,
      applicableTo: 'PROPERTY_SELL',
      minAmount: 1000,
    },
    {
      name: 'Property Rent Commission',
      type: 'PERCENTAGE' as const,
      rate: 8.33, // 1 month rent = 1/12 of annual = ~8.33%
      applicableTo: 'PROPERTY_RENT',
      minAmount: 500,
    },
    {
      name: 'Service Booking Commission',
      type: 'PERCENTAGE' as const,
      rate: 15,
      applicableTo: 'SERVICE_BOOKING',
      minAmount: 50,
    },
  ];

  for (const rule of commissionRules) {
    await prisma.commissionRule.create({ data: rule }).catch(() => { });
  }
  console.log(`✅ Seeded ${commissionRules.length} commission rules`);

  // ─── System Settings ────────────────────────────────────────────────────────
  await prisma.systemSetting.upsert({
    where: { key: 'bypassPolicy' },
    update: {},
    create: { key: 'bypassPolicy', value: 'MASK' },
  });
  console.log('✅ Seeded bypassPolicy setting (value: MASK)');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPhone = '9999999999';
  const adminPasswordHash = await bcrypt.hash('Password@123', 12);
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      email: 'admin@zivahousing.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
    create: {
      phone: adminPhone,
      email: 'admin@zivahousing.com',
      firstName: 'Ziva',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash: adminPasswordHash,
    },
  });
  console.log('✅ Upserted admin user (id: admin@zivahousing.com, pass: Password@123)');

  // ─── Owner User & Profile ──────────────────────────────────────────────────
  const ownerPhone = '9876543210';
  let owner = await prisma.user.findUnique({ where: { phone: ownerPhone } });
  if (!owner) {
    const passwordHash = await bcrypt.hash('Owner@Ziva2024!', 12);
    owner = await prisma.user.create({
      data: {
        phone: ownerPhone,
        email: 'amit.sharma@example.com',
        firstName: 'Amit',
        lastName: 'Sharma',
        role: 'OWNER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        passwordHash,
      },
    });
    console.log('✅ Created owner user (phone: 9876543210)');
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({ where: { userId: owner.id } });
  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: {
        userId: owner.id,
        isVerified: true,
      },
    });
    console.log('✅ Created owner profile');
  }

  // ─── Active Properties ──────────────────────────────────────────────────────
  const propertyCount = await prisma.property.count();
  if (propertyCount === 0) {
    const dbAmenities = await prisma.amenity.findMany();
    const liftAmenity = dbAmenities.find(a => a.name === 'Lift/Elevator');
    const backupAmenity = dbAmenities.find(a => a.name === 'Power Backup');
    const parkingAmenity = dbAmenities.find(a => a.name === 'Car Parking');
    const cctvAmenity = dbAmenities.find(a => a.name === 'CCTV');

    const amenityConnections = [liftAmenity, backupAmenity, parkingAmenity, cctvAmenity]
      .filter(Boolean)
      .map(a => ({ amenityId: a!.id }));

    // Property 1: 3 BHK Apartment in Noida (For Sell)
    await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Luxurious 3 BHK Apartment with Park View',
        description: 'Spacious 3 BHK apartment with modern amenities, large balconies, and beautiful park view in Noida Sector 62. Safe gated community with 24/7 security.',
        purpose: 'SELL',
        propertyType: 'APARTMENT',
        status: 'ACTIVE',
        isZivaVerified: true,
        addressLine1: 'Tower A, Green Meadows',
        addressLine2: 'Sector 62',
        locality: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        bhk: 3,
        bathrooms: 3,
        balconies: 2,
        totalFloors: 12,
        floorNumber: 5,
        builtUpArea: 1650,
        carpetArea: 1450,
        furnishing: 'SEMI_FURNISHED',
        expectedPrice: 13500000, // 1.35 Cr
        pricePerSqft: 8181,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
              order: 0,
            },
            {
              url: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
              isPrimary: false,
              order: 1,
            }
          ]
        },
        amenities: {
          create: amenityConnections
        }
      }
    });

    // Property 2: 2 BHK Apartment in Noida (For Rent)
    await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Fully Furnished 2 BHK Flat Near Metro Station',
        description: 'Perfect for working professionals. Beautifully furnished 2 BHK apartment in a prime location near Noida Sector 62 metro station. Fully functional kitchen and air conditioners in all rooms.',
        purpose: 'RENT',
        propertyType: 'APARTMENT',
        status: 'ACTIVE',
        isZivaVerified: true,
        addressLine1: 'B-45, Metro Heights',
        addressLine2: 'Sector 62',
        locality: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        bhk: 2,
        bathrooms: 2,
        balconies: 1,
        totalFloors: 8,
        floorNumber: 3,
        builtUpArea: 1100,
        carpetArea: 950,
        furnishing: 'FULLY_FURNISHED',
        monthlyRent: 28000,
        securityDeposit: 56000,
        maintenanceCharges: 2500,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
              order: 0,
            }
          ]
        },
        amenities: {
          create: amenityConnections
        }
      }
    });

    // Property 3: 4 BHK Villa in Noida (For Sell)
    await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Premium 4 BHK Independent Villa',
        description: 'Exquisite 4 BHK villa with private lawn, personal parking space, and modern modular kitchen. Located in a high-end posh locality of Sector 44 Noida.',
        purpose: 'SELL',
        propertyType: 'VILLA',
        status: 'ACTIVE',
        isZivaVerified: true,
        addressLine1: 'Villa 12, Posh Enclave',
        addressLine2: 'Sector 44',
        locality: 'Sector 44',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201303',
        bhk: 4,
        bathrooms: 4,
        balconies: 3,
        totalFloors: 2,
        floorNumber: 1,
        builtUpArea: 3200,
        carpetArea: 2800,
        furnishing: 'FULLY_FURNISHED',
        expectedPrice: 42500000, // 4.25 Cr
        pricePerSqft: 13281,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
              order: 0,
            }
          ]
        },
        amenities: {
          create: amenityConnections
        }
      }
    });

    console.log('✅ Seeded 3 active properties');
  }

  // ─── Pending Properties for Admin Review Queue ──────────────────────────────
  const pendingProp = await prisma.property.findFirst({ where: { status: 'PENDING_REVIEW' } });
  if (!pendingProp) {
    await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Modern 3 BHK High-Rise in Golf City (Pending Approval)',
        description: 'Brand new luxury apartment awaiting admin verification. Premium modular kitchen with granite tops, wooden flooring in master bedroom, and panoramic city views.',
        purpose: 'SELL',
        propertyType: 'APARTMENT',
        status: 'PENDING_REVIEW',
        isZivaVerified: false,
        addressLine1: 'Tower C-402, Golf City Heights',
        addressLine2: 'Sector 150',
        locality: 'Sector 150',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201310',
        bhk: 3,
        bathrooms: 3,
        balconies: 3,
        totalFloors: 24,
        floorNumber: 4,
        builtUpArea: 1850,
        carpetArea: 1550,
        furnishing: 'SEMI_FURNISHED',
        expectedPrice: 16500000,
        pricePerSqft: 8918,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
              order: 0,
            },
            {
              url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
              isPrimary: false,
              order: 1,
            },
          ],
        },
      },
    });

    await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Spacious 2 BHK Builder Floor near Cyber Hub',
        description: 'Independent builder floor with separate terrace access and 24/7 dedicated security guard. Ready for immediate move-in.',
        purpose: 'RENT',
        propertyType: 'INDEPENDENT_HOUSE',
        status: 'PENDING_REVIEW',
        isZivaVerified: false,
        addressLine1: 'Plot 45-B, DLF Phase 2',
        locality: 'DLF Phase 2',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122002',
        bhk: 2,
        bathrooms: 2,
        balconies: 2,
        totalFloors: 4,
        floorNumber: 2,
        builtUpArea: 1200,
        carpetArea: 1050,
        furnishing: 'FULLY_FURNISHED',
        monthlyRent: 35000,
        securityDeposit: 70000,
        photos: {
          create: [
            {
              url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
              isPrimary: true,
              order: 0,
            },
          ],
        },
      },
    });
    console.log('✅ Seeded 2 PENDING_REVIEW properties for admin approval queue');
  }

  // ─── Additional Mock Users (Customer, Agent, Providers) ────────────────────
  const customerPhone = '9711223344';
  let customer = await prisma.user.findUnique({ where: { phone: customerPhone } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        phone: customerPhone,
        email: 'rahul.kapoor@example.com',
        firstName: 'Rahul',
        lastName: 'Kapoor',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        customerProfile: { create: {} },
      },
    });
    console.log('✅ Created mock customer user (Rahul Kapoor)');
  }

  const providerPhone = '9411223344';
  let providerUser = await prisma.user.findUnique({ where: { phone: providerPhone } });
  if (!providerUser) {
    providerUser = await prisma.user.create({
      data: {
        phone: providerPhone,
        email: 'ramesh.cleaner@example.com',
        firstName: 'Ramesh',
        lastName: 'Kumar',
        role: 'SERVICE_PROVIDER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        serviceProviderProfile: {
          create: {
            categoryName: 'Cleaning',
            serviceArea: ['Noida', 'Greater Noida', 'Delhi NCR'],
            isVerified: true,
            verificationStatus: 'APPROVED',
            rating: 4.9,
            totalJobs: 142,
          },
        },
      },
    });
    console.log('✅ Created mock service provider (Ramesh Kumar - Cleaning)');
  }

  const providerUser2Phone = '9311223344';
  let providerUser2 = await prisma.user.findUnique({ where: { phone: providerUser2Phone } });
  if (!providerUser2) {
    providerUser2 = await prisma.user.create({
      data: {
        phone: providerUser2Phone,
        email: 'sunita.beauty@example.com',
        firstName: 'Sunita',
        lastName: 'Mehra',
        role: 'SERVICE_PROVIDER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        serviceProviderProfile: {
          create: {
            categoryName: "Women's Salon & Spa",
            serviceArea: ['Lucknow', 'Gomti Nagar', 'Aliganj'],
            isVerified: false,
            verificationStatus: 'PENDING',
            rating: 4.8,
            totalJobs: 48,
          },
        },
      },
    });
    console.log('✅ Created mock service provider (Sunita Mehra - Salon)');
  }

  // ─── KYC Verification Documents ───────────────────────────────────────────
  const provProf = await prisma.serviceProviderProfile.findUnique({ where: { userId: providerUser.id } });
  if (provProf) {
    const kycDoc = await prisma.providerVerificationDocument.findFirst({ where: { providerId: provProf.id } });
    if (!kycDoc) {
      await prisma.providerVerificationDocument.create({
        data: {
          providerId: provProf.id,
          docType: 'AADHAAR',
          fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          submittedAt: new Date(),
        },
      });
      await prisma.providerVerificationDocument.create({
        data: {
          providerId: provProf.id,
          docType: 'TRADE_CERTIFICATE',
          fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          status: 'APPROVED',
          submittedAt: new Date(),
        },
      });
    }
  }

  const provProf2 = await prisma.serviceProviderProfile.findUnique({ where: { userId: providerUser2.id } });
  if (provProf2) {
    const kycDoc2 = await prisma.providerVerificationDocument.findFirst({ where: { providerId: provProf2.id } });
    if (!kycDoc2) {
      await prisma.providerVerificationDocument.create({
        data: {
          providerId: provProf2.id,
          docType: 'AADHAAR',
          fileUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
      console.log('✅ Seeded provider KYC verification documents for Admin review');
    }
  }

  // ─── Mock CRM Leads & Support Tickets ─────────────────────────────────────
  const firstProperty = await prisma.property.findFirst({ where: { status: 'ACTIVE' } });
  if (firstProperty && customer && owner) {
    const existingLead = await prisma.lead.findFirst({ where: { customerId: customer.id } });
    if (!existingLead) {
      const createdLead = await prisma.lead.create({
        data: {
          id: 'JVH-NOI-2026-00001',
          customerId: customer.id,
          ownerId: owner.id,
          propertyId: firstProperty.id,
          status: 'CONTACTED',
          notes: 'Customer looking for urgent site visit on Saturday',
        },
      });

      await prisma.leadMessage.create({
        data: {
          leadId: createdLead.id,
          senderId: customer.id,
          contentRaw: 'Can we schedule a visit on Saturday at 4 PM?',
          contentSanitized: 'Can we schedule a visit on Saturday at 4 PM?',
        },
      });

      await prisma.leadMessage.create({
        data: {
          leadId: createdLead.id,
          senderId: owner.id,
          contentRaw: 'Yes sure Rahul, please feel free to come over.',
          contentSanitized: 'Yes sure Rahul, please feel free to come over.',
        },
      });
      console.log('✅ Seeded mock lead & chat messages for CRM');
    }
  }

  // ─── Support Tickets ───────────────────────────────────────────────────────
  const existingTicket = await prisma.supportTicket.findFirst();
  if (!existingTicket && customer) {
    await prisma.supportTicket.create({
      data: {
        userId: customer.id,
        subject: 'Inquiry regarding token payment guarantee',
        description: 'I want to make a token booking on a property. How is my advance protected under Ziva Escrow policy?',
        category: 'PROPERTY',
        status: 'OPEN',
        priority: 'HIGH',
      },
    });

    await prisma.supportTicket.create({
      data: {
        userId: customer.id,
        subject: 'Service slot reschedule request',
        description: 'Need to move my bathroom deep cleaning appointment by 2 hours tomorrow.',
        category: 'SERVICES',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      },
    });
    console.log('✅ Seeded support tickets for Admin CRM');
  }

  // ─── Admin Alerts ──────────────────────────────────────────────────────────
  const existingAlert = await prisma.adminAlert.findFirst();
  if (!existingAlert) {
    await prisma.adminAlert.create({
      data: {
        type: 'PRICE_OUTLIER',
        severity: 'MEDIUM',
        details: 'Sector 62 Noida 3 BHK listed at ₹1.35 Cr is 12% below average locality index.',
        entityType: 'Property',
      },
    });

    await prisma.adminAlert.create({
      data: {
        type: 'DUPLICATE_PHONE',
        severity: 'LOW',
        details: 'Vendor phone registered in 2 different sub-categories.',
        entityType: 'User',
      },
    });
    console.log('✅ Seeded admin compliance alerts');
  }

  // ─── Premium Listing Plans ──────────────────────────────────────────────────
  const premiumPlans = [
    {
      name: 'Basic',
      price: 999,
      durationDays: 30,
      boostScore: 10,
      features: ['Featured badge', 'Top placement in search', 'Priority support'],
    },
    {
      name: 'Pro',
      price: 1999,
      durationDays: 60,
      boostScore: 25,
      features: ['Featured badge', 'Top placement in search', 'Homepage banner slot', 'Priority support', 'Analytics dashboard'],
    },
    {
      name: 'Elite',
      price: 4999,
      durationDays: 90,
      boostScore: 50,
      features: ['Featured badge', '#1 search placement', 'Homepage banner slot', 'Dedicated account manager', 'Analytics dashboard', 'Social media promotion'],
    },
  ];

  for (const plan of premiumPlans) {
    const existing = await prisma.premiumListingPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.premiumListingPlan.create({ data: plan });
    }
  }
  console.log(`✅ Seeded ${premiumPlans.length} premium listing plans`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
