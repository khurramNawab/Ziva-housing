import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedFullDemo() {
  console.log('🚀 Seeding full rich demo data for Buy, Rent, PG, Projects & Services...');

  // 1. Ensure test owner exists
  const ownerEmail = 'owner.demo@zivahousing.com';
  let owner = await prisma.user.findFirst({
    where: { OR: [{ email: ownerEmail }, { phone: '9876543210' }] },
  });

  if (!owner) {
    const passwordHash = await bcrypt.hash('password123', 10);
    owner = await prisma.user.create({
      data: {
        phone: '9876543210',
        email: ownerEmail,
        firstName: 'Rajesh',
        lastName: 'Sharma',
        role: 'OWNER',
        passwordHash,
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });
  }

  let ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: owner.id },
  });

  if (!ownerProfile) {
    ownerProfile = await prisma.ownerProfile.create({
      data: { userId: owner.id, isVerified: true },
    });
  }

  // 2. Fetch or create standard amenities
  const dbAmenities = await prisma.amenity.findMany();
  const amenityIds = dbAmenities.map(a => ({ amenityId: a.id }));

  // 3. Clear older demo properties if needed or add new
  const demoProperties = [
    // BUY 1 - Bangalore
    {
      title: 'Prestige Golfshire Luxury 4 BHK Villa',
      description: 'Ultra-luxury 4 BHK golf-side villa overlooking Nandi Hills. Private swimming pool, designer modular kitchen, Italian marble flooring, and smart home automation.',
      purpose: 'SELL' as const,
      propertyType: 'VILLA' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: 'Golfshire Avenue, Villa #24',
      locality: 'Nandi Hills',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '562110',
      latitude: 13.3702,
      longitude: 77.6835,
      bhk: 4,
      bathrooms: 5,
      balconies: 3,
      totalFloors: 2,
      floorNumber: 1,
      builtUpArea: 4200,
      carpetArea: 3800,
      furnishing: 'FULLY_FURNISHED' as const,
      expectedPrice: 45000000,
      pricePerSqft: 10714,
      photos: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // BUY 2 - Bangalore
    {
      title: 'Sobha City Casa 3 BHK Lakefront Apartment',
      description: 'Stunning 3 BHK lakefront apartment in Hebbal with uninterrupted water views. 100% Vastu compliant, clubhouse, Olympic swimming pool, and badminton courts.',
      purpose: 'SELL' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: 'Tower B, Sobha City, Thanisandra Main Road',
      locality: 'Hebbal',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560024',
      latitude: 13.0358,
      longitude: 77.5970,
      bhk: 3,
      bathrooms: 3,
      balconies: 2,
      totalFloors: 18,
      floorNumber: 12,
      builtUpArea: 1950,
      carpetArea: 1680,
      furnishing: 'SEMI_FURNISHED' as const,
      expectedPrice: 18500000,
      pricePerSqft: 9487,
      photos: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // BUY 3 - Bangalore Indiranagar
    {
      title: 'Spacious 3 BHK Penthouse with Private Terrace',
      description: 'Exclusive 3 BHK Penthouse in prime 100ft Road Indiranagar. Private 800 sqft landscaped terrace garden, dedicated 2 car parking slots, and imported wooden flooring.',
      purpose: 'SELL' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: '12th Main, 100ft Road',
      locality: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9784,
      longitude: 77.6408,
      bhk: 3,
      bathrooms: 3,
      balconies: 2,
      totalFloors: 6,
      floorNumber: 6,
      builtUpArea: 2400,
      carpetArea: 2100,
      furnishing: 'FULLY_FURNISHED' as const,
      expectedPrice: 27500000,
      pricePerSqft: 11458,
      photos: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // RENT 1 - Koramangala
    {
      title: 'Greenwood Luxury 2 BHK Furnished Residence',
      description: 'Designer 2 BHK fully furnished apartment in Koramangala 4th Block. Walking distance from top cafes, restaurants, and IT tech parks. Includes high-speed fiber internet and power backup.',
      purpose: 'RENT' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: '80 Feet Road, 4th Block',
      locality: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      bhk: 2,
      bathrooms: 2,
      balconies: 1,
      totalFloors: 5,
      floorNumber: 3,
      builtUpArea: 1250,
      carpetArea: 1100,
      furnishing: 'FULLY_FURNISHED' as const,
      monthlyRent: 45000,
      securityDeposit: 90000,
      maintenanceCharges: 3000,
      photos: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // RENT 2 - HSR Layout
    {
      title: 'Prestige Langlee 3 BHK Gated Community Home',
      description: 'Modern 3 BHK apartment in HSR Layout Sector 1. Gated society with clubhouse, gym, power backup, covered parking, and children play park.',
      purpose: 'RENT' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: '27th Main Road, Sector 1',
      locality: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
      latitude: 12.9121,
      longitude: 77.6446,
      bhk: 3,
      bathrooms: 3,
      balconies: 2,
      totalFloors: 10,
      floorNumber: 4,
      builtUpArea: 1650,
      carpetArea: 1420,
      furnishing: 'SEMI_FURNISHED' as const,
      monthlyRent: 65000,
      securityDeposit: 150000,
      maintenanceCharges: 4000,
      photos: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // RENT 3 - Whitefield
    {
      title: 'Sun City Palm 1 BHK Studio for Bachelors/Couples',
      description: 'Cozy and modern 1 BHK flat near ITPL Whitefield. Fully loaded with AC, TV, Fridge, Washing Machine, and modular kitchen. 24/7 security.',
      purpose: 'RENT' as const,
      propertyType: 'STUDIO' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: 'ITPL Main Road, Palm Meadows Road',
      locality: 'Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      latitude: 12.9698,
      longitude: 77.7499,
      bhk: 1,
      bathrooms: 1,
      balconies: 1,
      totalFloors: 4,
      floorNumber: 2,
      builtUpArea: 650,
      carpetArea: 580,
      furnishing: 'FULLY_FURNISHED' as const,
      monthlyRent: 22000,
      securityDeposit: 44000,
      maintenanceCharges: 1500,
      photos: [
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // PG 1
    {
      title: 'Stanza Living Kyoto House (Co-Living & PG)',
      description: 'Premium boys & girls co-living in Koramangala. 3 times buffet meals, daily housekeeping, 100 Mbps WiFi, gaming zone, and biometric security.',
      purpose: 'PG' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: '5th Block, near Jyoti Nivas College',
      locality: 'Koramangala Block 5',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560095',
      latitude: 12.9340,
      longitude: 77.6180,
      bhk: 2,
      bathrooms: 2,
      builtUpArea: 500,
      furnishing: 'FULLY_FURNISHED' as const,
      monthlyRent: 12500,
      securityDeposit: 12500,
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
      ],
    },
    // PG 2
    {
      title: 'Zolo Grace Executive Luxury PG',
      description: 'Exclusive luxury PG with AC rooms, attached washrooms, spring mattresses, washing machines, and refrigerator. Prime HSR Layout location.',
      purpose: 'PG' as const,
      propertyType: 'APARTMENT' as const,
      status: 'ACTIVE' as const,
      isZivaVerified: true,
      addressLine1: 'Sector 2, 14th Main Road',
      locality: 'HSR Layout Sector 2',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
      latitude: 12.9080,
      longitude: 77.6520,
      bhk: 1,
      bathrooms: 1,
      builtUpArea: 400,
      furnishing: 'FULLY_FURNISHED' as const,
      monthlyRent: 18000,
      securityDeposit: 18000,
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  for (const prop of demoProperties) {
    const existing = await prisma.property.findFirst({
      where: { title: prop.title },
    });

    if (!existing) {
      await prisma.property.create({
        data: {
          ownerProfileId: ownerProfile.id,
          title: prop.title,
          description: prop.description,
          purpose: prop.purpose,
          propertyType: prop.propertyType,
          status: prop.status,
          isZivaVerified: prop.isZivaVerified,
          addressLine1: prop.addressLine1,
          locality: prop.locality,
          city: prop.city,
          state: prop.state,
          pincode: prop.pincode,
          latitude: prop.latitude,
          longitude: prop.longitude,
          bhk: prop.bhk,
          bathrooms: prop.bathrooms,
          balconies: prop.balconies,
          totalFloors: prop.totalFloors,
          floorNumber: prop.floorNumber,
          builtUpArea: prop.builtUpArea,
          carpetArea: prop.carpetArea,
          furnishing: prop.furnishing,
          expectedPrice: prop.expectedPrice,
          monthlyRent: prop.monthlyRent,
          securityDeposit: prop.securityDeposit,
          maintenanceCharges: prop.maintenanceCharges,
          photos: {
            create: prop.photos.map((url, idx) => ({
              url,
              isPrimary: idx === 0,
              order: idx,
            })),
          },
          amenities: {
            create: amenityIds.slice(0, 5),
          },
        },
      });
      console.log(`✅ Seeded property: ${prop.title} (${prop.purpose})`);
    }
  }

  console.log('🎉 Full demo dataset seeded successfully!');
}

seedFullDemo()
  .catch((e) => {
    console.error('❌ Error seeding demo:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
