import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test users and mock chat negotiation timelines...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 0. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@zivahousing.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
    create: {
      phone: '9000000000',
      email: 'admin@zivahousing.com',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash,
    },
  });

  // 1. Create Customer
  const customerUser = await prisma.user.upsert({
    where: { phone: '9111111111' },
    update: {},
    create: {
      phone: '9111111111',
      email: 'customer@example.com',
      firstName: 'Customer',
      lastName: 'User',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash,
    },
  });
  await prisma.customerProfile.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: { userId: customerUser.id, preferredCities: ['Noida'] },
  });

  // 2. Create Owner
  const ownerUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      email: 'owner@example.com',
      firstName: 'Owner',
      lastName: 'User',
      role: 'OWNER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash,
    },
  });
  const ownerProfile = await prisma.ownerProfile.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: { userId: ownerUser.id, isVerified: true },
  });

  // 3. Create Agent
  const agentUser = await prisma.user.upsert({
    where: { phone: '9222222222' },
    update: {},
    create: {
      phone: '9222222222',
      email: 'agent@example.com',
      firstName: 'Agent',
      lastName: 'User',
      role: 'AGENT',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash,
    },
  });
  await prisma.agentProfile.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: { userId: agentUser.id, agencyName: 'Ziva Realty', reraNumber: 'UPRERA12345' },
  });

  // 4. Create Vendor (Service Provider)
  const vendorUser = await prisma.user.upsert({
    where: { phone: '9333333333' },
    update: {},
    create: {
      phone: '9333333333',
      email: 'vendor@example.com',
      firstName: 'Vendor',
      lastName: 'User',
      role: 'SERVICE_PROVIDER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      passwordHash,
    },
  });
  await prisma.serviceProviderProfile.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      serviceArea: ['Noida', 'Delhi'],
      isVerified: true,
      bankAccountName: 'Vendor User',
      bankAccountNo: '1234567890',
      bankIfscCode: 'HDFC0001234',
    },
  });

  // 5. Create active property if none
  let property = await prisma.property.findFirst({
    where: { ownerProfileId: ownerProfile.id },
  });
  if (!property) {
    property = await prisma.property.create({
      data: {
        ownerProfileId: ownerProfile.id,
        title: 'Premium Test Property Noida',
        description: 'Excellent test property for visual audit passes.',
        purpose: 'SELL',
        propertyType: 'APARTMENT',
        status: 'ACTIVE',
        addressLine1: 'Test Block Noida',
        locality: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        bhk: 3,
        expectedPrice: 12500000,
        isZivaVerified: true,
      },
    });
  }

  // 6. Create Lead
  let lead = await prisma.lead.findFirst({
    where: { propertyId: property.id, customerId: customerUser.id },
  });
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        id: 'JVH-NOI-2026-00001',
        propertyId: property.id,
        customerId: customerUser.id,
        ownerId: ownerUser.id,
        status: 'NEGOTIATION',
      },
    });
  }

  // 7. Add messages
  await prisma.leadMessage.createMany({
    data: [
      { leadId: lead.id, senderId: customerUser.id, contentRaw: 'Hello, is this property still available?', contentSanitized: 'Hello, is this property still available?' },
      { leadId: lead.id, senderId: ownerUser.id, contentRaw: 'Yes, it is available. We can schedule a visit.', contentSanitized: 'Yes, it is available. We can schedule a visit.' },
    ],
  });

  // 8. Add visit
  await prisma.propertyVisit.upsert({
    where: { id: 'test-visit-id' },
    update: {},
    create: {
      id: 'test-visit-id',
      leadId: lead.id,
      propertyId: property.id,
      customerId: customerUser.id,
      ownerId: ownerUser.id,
      scheduledAt: new Date(Date.now() + 86400000 * 2), // 2 days later
      status: 'REQUESTED',
      notes: 'Initial walkthrough',
    },
  });

  // 9. Add offers
  await prisma.offer.create({
    data: {
      id: 'test-offer-1',
      leadId: lead.id,
      customerId: customerUser.id,
      offerAmount: 12000000,
      validUntil: new Date(Date.now() + 86400000 * 5),
      message: 'Initial proposal price',
    },
  });

  console.log('RESULTS:');
  console.log(`- Admin: admin@zivahousing.com (pass: Password123!)`);
  console.log(`- Customer: customer@example.com (pass: Password123!)`);
  console.log(`- Owner: owner@example.com (pass: Password123!)`);
  console.log(`- Agent: agent@example.com (pass: Password123!)`);
  console.log(`- Vendor: vendor@example.com (pass: Password123!)`);
  console.log(`- Lead ID: ${lead.id}`);
  console.log(`- Property ID: ${property.id}`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
