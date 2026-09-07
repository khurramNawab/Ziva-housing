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

  // ─── Service Categories & Services ─────────────────────────────────────────
  const serviceData = [
    {
      name: 'Baby Sitting & Childcare',
      slug: 'babysitting-childcare',
      icon: '👶',
      order: 1,
      services: [
        { name: 'Full Day Babysitter', slug: 'full-day-babysitter', basePrice: 800, durationMinutes: 480 },
        { name: 'Half Day Babysitter', slug: 'half-day-babysitter', basePrice: 500, durationMinutes: 240 },
        { name: 'Night Care', slug: 'night-care', basePrice: 1000, durationMinutes: 600 },
        { name: 'Creche Service', slug: 'creche-service', basePrice: 6000 },
      ],
    },
    {
      name: 'Elderly Care',
      slug: 'elderly-care',
      icon: '🧓',
      order: 2,
      services: [
        { name: 'Day Caregiver', slug: 'day-caregiver', basePrice: 900, durationMinutes: 480 },
        { name: 'Night Caregiver', slug: 'night-caregiver', basePrice: 1100, durationMinutes: 600 },
        { name: '24/7 Home Nurse', slug: '24x7-home-nurse', basePrice: 15000 },
        { name: 'Physiotherapy at Home', slug: 'physiotherapy-home', basePrice: 700, durationMinutes: 60 },
      ],
    },
    {
      name: 'Home Cleaning',
      slug: 'home-cleaning',
      icon: '🧹',
      order: 3,
      services: [
        { name: 'Full House Deep Cleaning', slug: 'full-house-deep-cleaning', basePrice: 1999, durationMinutes: 300 },
        { name: 'Regular Home Cleaning', slug: 'regular-home-cleaning', basePrice: 599, durationMinutes: 120 },
        { name: 'Kitchen Deep Cleaning', slug: 'kitchen-deep-cleaning', basePrice: 799, durationMinutes: 180 },
        { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', basePrice: 399, durationMinutes: 60 },
        { name: 'Sofa Cleaning', slug: 'sofa-cleaning', basePrice: 699, durationMinutes: 90 },
        { name: 'Carpet Cleaning', slug: 'carpet-cleaning', basePrice: 899, durationMinutes: 120 },
        { name: 'Move-In/Move-Out Cleaning', slug: 'move-in-out-cleaning', basePrice: 2499, durationMinutes: 360 },
      ],
    },
    {
      name: 'Painting & Waterproofing',
      slug: 'painting-waterproofing',
      icon: '🎨',
      order: 4,
      services: [
        { name: 'Interior Painting', slug: 'interior-painting', basePrice: 8 },
        { name: 'Exterior Painting', slug: 'exterior-painting', basePrice: 12 },
        { name: 'Waterproofing', slug: 'waterproofing', basePrice: 25 },
        { name: 'Texture/Design Paint', slug: 'texture-paint', basePrice: 35 },
        { name: 'Wood Polish', slug: 'wood-polish', basePrice: 15 },
      ],
    },
    {
      name: 'Electrician',
      slug: 'electrician',
      icon: '⚡',
      order: 5,
      services: [
        { name: 'Switch/Socket Repair', slug: 'switch-socket-repair', basePrice: 199, durationMinutes: 30 },
        { name: 'Fan Installation/Repair', slug: 'fan-install-repair', basePrice: 299, durationMinutes: 45 },
        { name: 'Light/Tube Installation', slug: 'light-installation', basePrice: 149, durationMinutes: 30 },
        { name: 'MCB/Fuse Repair', slug: 'mcb-fuse-repair', basePrice: 299, durationMinutes: 45 },
        { name: 'Full Home Wiring', slug: 'full-home-wiring', basePrice: 15000 },
      ],
    },
    {
      name: 'Plumber',
      slug: 'plumber',
      icon: '🔧',
      order: 6,
      services: [
        { name: 'Tap/Faucet Repair', slug: 'tap-faucet-repair', basePrice: 199, durationMinutes: 30 },
        { name: 'Pipe Leak Repair', slug: 'pipe-leak-repair', basePrice: 299, durationMinutes: 45 },
        { name: 'Toilet Repair', slug: 'toilet-repair', basePrice: 349, durationMinutes: 60 },
        { name: 'Water Tank Cleaning', slug: 'water-tank-cleaning', basePrice: 799, durationMinutes: 120 },
        { name: 'Geyser Installation', slug: 'geyser-installation', basePrice: 499, durationMinutes: 60 },
        { name: 'Basin/Sink Installation', slug: 'basin-sink-install', basePrice: 599, durationMinutes: 90 },
      ],
    },
    {
      name: 'Carpenter',
      slug: 'carpenter',
      icon: '🪚',
      order: 7,
      services: [
        { name: 'Door Repair/Fitting', slug: 'door-repair-fitting', basePrice: 399, durationMinutes: 60 },
        { name: 'Furniture Assembly', slug: 'furniture-assembly', basePrice: 499, durationMinutes: 90 },
        { name: 'Wardrobe Installation', slug: 'wardrobe-installation', basePrice: 799, durationMinutes: 120 },
        { name: 'Window Repair', slug: 'window-repair', basePrice: 349, durationMinutes: 60 },
      ],
    },
    {
      name: 'AC & Appliance Repair',
      slug: 'ac-appliance-repair',
      icon: '❄️',
      order: 8,
      services: [
        { name: 'AC Servicing', slug: 'ac-servicing', basePrice: 499, durationMinutes: 90 },
        { name: 'AC Installation', slug: 'ac-installation', basePrice: 999, durationMinutes: 120 },
        { name: 'AC Gas Refill', slug: 'ac-gas-refill', basePrice: 1499, durationMinutes: 60 },
        { name: 'Washing Machine Repair', slug: 'washing-machine-repair', basePrice: 399, durationMinutes: 60 },
        { name: 'Refrigerator Repair', slug: 'refrigerator-repair', basePrice: 449, durationMinutes: 60 },
        { name: 'Microwave Repair', slug: 'microwave-repair', basePrice: 349, durationMinutes: 45 },
        { name: 'Geyser Repair', slug: 'geyser-repair', basePrice: 299, durationMinutes: 45 },
      ],
    },
    {
      name: 'Packers & Movers',
      slug: 'packers-movers',
      icon: '📦',
      order: 9,
      services: [
        { name: '1 BHK Moving (Local)', slug: '1bhk-local-move', basePrice: 3500 },
        { name: '2 BHK Moving (Local)', slug: '2bhk-local-move', basePrice: 5500 },
        { name: '3 BHK Moving (Local)', slug: '3bhk-local-move', basePrice: 8000 },
        { name: 'Office Relocation', slug: 'office-relocation', basePrice: 12000 },
        { name: 'Vehicle Transport', slug: 'vehicle-transport', basePrice: 4000 },
      ],
    },
    {
      name: 'Pest Control',
      slug: 'pest-control',
      icon: '🐛',
      order: 10,
      services: [
        { name: 'Cockroach Control', slug: 'cockroach-control', basePrice: 599, durationMinutes: 60 },
        { name: 'Mosquito Control', slug: 'mosquito-control', basePrice: 799, durationMinutes: 90 },
        { name: 'Termite Control', slug: 'termite-control', basePrice: 1999, durationMinutes: 180 },
        { name: 'Bed Bug Control', slug: 'bed-bug-control', basePrice: 1499, durationMinutes: 150 },
        { name: 'Rodent Control', slug: 'rodent-control', basePrice: 999, durationMinutes: 120 },
        { name: 'Full Home Pest Control', slug: 'full-home-pest-control', basePrice: 2999, durationMinutes: 240 },
      ],
    },
    {
      name: 'Interior & Modular Kitchen',
      slug: 'interior-modular-kitchen',
      icon: '🏠',
      order: 11,
      services: [
        { name: 'Home Interior Consultation', slug: 'interior-consultation', basePrice: 999, durationMinutes: 120 },
        { name: 'Modular Kitchen Design', slug: 'modular-kitchen-design', basePrice: 2999 },
        { name: 'False Ceiling (POP/Gypsum)', slug: 'false-ceiling', basePrice: 45 },
        { name: 'Wardrobe Design', slug: 'wardrobe-design', basePrice: 1999 },
        { name: 'TV Unit Design', slug: 'tv-unit-design', basePrice: 1499 },
      ],
    },
  ];

  for (const catData of serviceData) {
    const { services, ...categoryFields } = catData;
    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {},
      create: {
        ...categoryFields,
        description: `Professional ${catData.name} services`,
      },
    });

    for (const svc of services) {
      await prisma.service.upsert({
        where: { slug: svc.slug },
        update: {},
        create: { ...svc, categoryId: category.id },
      });
    }
  }
  console.log(`✅ Seeded ${serviceData.length} service categories`);

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
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@Ziva2024!', 12);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: 'admin@Zivahousing.com',
        firstName: 'Ziva',
        lastName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        passwordHash,
      },
    });
    console.log('✅ Created admin user (phone: 9999999999, pass: Admin@Ziva2024!)');
  }

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
