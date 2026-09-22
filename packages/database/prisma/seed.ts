import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Load DATABASE_URL from .env files if not already set in environment
if (!process.env.DATABASE_URL) {
  const cwd = process.cwd();
  const initCwd = process.env.INIT_CWD || cwd;
  const envCandidates = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, 'packages/database/.env'),
    path.resolve(cwd, 'apps/api/.env'),
    path.resolve(cwd, '../.env'),
    path.resolve(cwd, '../../.env'),
    path.resolve(cwd, '../apps/api/.env'),
    path.resolve(initCwd, '.env'),
    path.resolve(initCwd, 'packages/database/.env'),
    path.resolve(initCwd, 'apps/api/.env'),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            let val = v.join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        if (process.env.DATABASE_URL) break;
      } catch {}
    }
  }
}

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

  // ─── Service Categories, SubCategories, Tiers & Services (Urban Company Model) ──────────────
  const multiLevelServiceData = [
    // 1. Cleaning & Pest Control (ACTIVE)
    {
      name: 'Cleaning & Pest Control',
      slug: 'cleaning',
      icon: 'vacuum',
      badge: '44 mins',
      isActive: true,
      order: 1,
      description: 'Professional deep cleaning, bathroom sanitization, sofa and carpet care with industrial equipment.',
      subCategories: [
        {
          name: 'Bathroom & Kitchen Cleaning',
          slug: 'bathroom-kitchen-cleaning',
          icon: '🧼',
          badge: '44 mins',
          displayOrder: 1,
          isActive: true,
          description: 'Intensive tile scrubbing, tap descaling, and grease removal.',
          services: [
            { name: 'Bathroom Deep Cleaning (1 Bathroom)', slug: 'bathroom-deep-cleaning', basePrice: 499, durationMinutes: 44, bestsellerFlag: true, rating: 4.86, reviewCount: 240, description: 'Intense tile scrubbing, descaling of taps, shower glass & toilet sanitization.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Bathroom Descaling & Stain Removal', slug: 'bathroom-descaling', basePrice: 699, durationMinutes: 60, bestsellerFlag: false, rating: 4.79, reviewCount: 110, description: 'Hard water stain removal from tiles, mirrors, and glass partitions.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Kitchen Degreasing & Deep Clean', slug: 'kitchen-degreasing', basePrice: 699, durationMinutes: 60, bestsellerFlag: true, rating: 4.88, reviewCount: 310, description: 'Oil & grease removal from tiles, slab, sink, gas stove & cabinets exterior.', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Full Home Deep Cleaning',
          slug: 'full-home-cleaning',
          icon: '🏠',
          badge: null,
          displayOrder: 2,
          isActive: true,
          description: 'Top-to-bottom complete sanitized deep cleaning.',
          services: [
            { name: '1 BHK Full Home Deep Cleaning', slug: '1bhk-deep-cleaning', basePrice: 1999, durationMinutes: 240, bestsellerFlag: true, rating: 4.82, reviewCount: 520, description: 'Thorough cleaning of living room, bedroom, kitchen, bathroom & balcony.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
            { name: '2 BHK Full Home Deep Cleaning', slug: '2bhk-deep-cleaning', basePrice: 2899, durationMinutes: 300, bestsellerFlag: true, rating: 4.85, reviewCount: 780, description: 'Mechanized floor scrubbing, dusting, kitchen degreasing & 2 bathroom washes.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
            { name: '3 BHK Full Home Deep Cleaning', slug: '3bhk-deep-cleaning', basePrice: 3899, durationMinutes: 360, bestsellerFlag: false, rating: 4.87, reviewCount: 430, description: 'Complete sanitization and mechanized polishing for 3 BHK apartments.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Sofa & Carpet Cleaning',
          slug: 'sofa-carpet-cleaning',
          icon: '🛋️',
          badge: null,
          displayOrder: 3,
          isActive: true,
          description: 'Foam shampoo and moisture extraction for upholstery.',
          services: [
            { name: '3-Seater Sofa Fabric Shampoo & Vacuum', slug: 'sofa-shampoo-3seater', basePrice: 699, durationMinutes: 60, bestsellerFlag: true, rating: 4.79, reviewCount: 290, description: 'Dry vacuuming, foam shampoo & moisture extraction for fabric sofas.', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
            { name: 'Living Room Carpet Deep Shampoo', slug: 'carpet-deep-shampoo', basePrice: 799, durationMinutes: 60, bestsellerFlag: false, rating: 4.75, reviewCount: 160, description: 'Industrial extraction wash for large carpets and rugs.', imageUrl: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Pest Control',
          slug: 'pest-control-sub',
          icon: '🐜',
          badge: null,
          displayOrder: 4,
          isActive: true,
          description: 'Odorless chemical and herbal gel treatments.',
          services: [
            { name: 'Cockroach & Ant Herbal Gel Control', slug: 'cockroach-control', basePrice: 599, durationMinutes: 45, bestsellerFlag: true, rating: 4.81, reviewCount: 380, description: 'Bayer herbal gel treatment with 6 months warranty.', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' },
            { name: 'Ants & Bed Bugs Odorless Spray Control', slug: 'ants-bedbugs-control', basePrice: 799, durationMinutes: 60, bestsellerFlag: false, rating: 4.78, reviewCount: 140, description: 'Odorless spray treatment in joints & mattresses.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 2. Women's Salon & Spa (ACTIVE)
    {
      name: "Women's Salon & Spa",
      slug: 'womens-salon-spa',
      icon: 'face_retouching_natural',
      badge: null,
      isActive: true,
      order: 2,
      description: 'Salon and luxury spa at home with single-use kits, certified beauticians and top brands.',
      subCategories: [
        {
          name: 'Salon for Women',
          slug: 'salon-for-women',
          icon: '🧖‍♀️',
          badge: '44 mins',
          displayOrder: 1,
          isActive: true,
          description: 'RICA waxing, facial cleanup, threading & mani-pedi with single-use kits.',
          services: [
            { name: 'Full Arms + Full Legs + Underarms (Rica Wax)', slug: 'rica-wax-combo', basePrice: 899, durationMinutes: 60, bestsellerFlag: true, rating: 4.89, reviewCount: 920, description: 'Painless Italian Rica wax for gentle hair removal & skin brightening.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
            { name: 'Eyebrow + Upper Lip + Forehead Threading', slug: 'threading-combo', basePrice: 99, durationMinutes: 20, bestsellerFlag: false, rating: 4.75, reviewCount: 450, description: 'Precision facial hair threading and aloe vera soothing massage.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
            { name: 'O3+ Bridal Glow Facial', slug: 'o3-bridal-facial', basePrice: 1699, durationMinutes: 75, bestsellerFlag: true, rating: 4.92, reviewCount: 610, description: 'Multi-step radiant facial with peeling, brightening serum and mask.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
            { name: 'Sara Luxury Pedicure', slug: 'sara-luxury-pedicure', basePrice: 599, durationMinutes: 45, bestsellerFlag: false, rating: 4.82, reviewCount: 340, description: 'Foot soak, cuticle care, dead skin scrubbing and relaxing massage.', imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Spa for Women',
          slug: 'spa-for-women',
          icon: '💆‍♀️',
          badge: null,
          displayOrder: 2,
          isActive: true,
          description: 'Aromatherapy full body relaxation massages and traditional Ayurvedic therapies.',
          tiers: [
            {
              name: 'Luxe',
              slug: 'spa-women-luxe',
              tag: 'AROMA OIL',
              badge: 'Top rated',
              startingPrice: 898,
              displayOrder: 1,
              isActive: true,
              description: 'Curated therapies with only Highly rated therapists & oils',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
              services: [
                { name: 'Sublime Swedish Massage (60 mins)', slug: 'sublime-swedish-massage', basePrice: 898, durationMinutes: 60, bestsellerFlag: true, rating: 4.91, reviewCount: 540, description: 'Long gliding strokes with lavender aroma oil for deep mental & muscular relaxation.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' },
                { name: 'Deep Tissue Aromatherapy Spa (90 mins)', slug: 'deep-tissue-aroma-90', basePrice: 1399, durationMinutes: 90, bestsellerFlag: true, rating: 4.94, reviewCount: 380, description: 'Intensive firm pressure targeting chronic knots and shoulder stiffness.', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
              ],
            },
            {
              name: 'Prime',
              slug: 'spa-women-prime',
              tag: 'RELAXING OIL',
              badge: null,
              startingPrice: 699,
              displayOrder: 2,
              isActive: true,
              description: 'Regular oil massages with standard techniques & therapist',
              imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
              services: [
                { name: 'Prime Full Body Relaxation Massage (60 mins)', slug: 'prime-full-body-massage', basePrice: 699, durationMinutes: 60, bestsellerFlag: false, rating: 4.79, reviewCount: 220, description: 'Soothing mineral oil massage for everyday body fatigue.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80' },
                { name: 'Head, Neck & Shoulder Stress Buster (30 mins)', slug: 'head-shoulder-massage-women', basePrice: 399, durationMinutes: 30, bestsellerFlag: false, rating: 4.77, reviewCount: 180, description: 'Targeted acupressure relief for desk workers and cervical tension.', imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80' },
              ],
            },
            {
              name: 'Ayurveda',
              slug: 'spa-women-ayurveda',
              tag: 'HERBAL OIL',
              badge: null,
              startingPrice: 699,
              displayOrder: 3,
              isActive: true,
              description: 'Therapist trained in traditional massage techniques & oils',
              imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
              services: [
                { name: 'Ayurvedic Abhyanga Herbal Massage (60 mins)', slug: 'ayurvedic-abhyanga-massage', basePrice: 799, durationMinutes: 60, bestsellerFlag: true, rating: 4.88, reviewCount: 310, description: 'Traditional warm herbal oil rhythmic full body therapy.', imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80' },
                { name: 'Kizhi Warm Herbal Pouch Therapy (75 mins)', slug: 'kizhi-herbal-pouch', basePrice: 1099, durationMinutes: 75, bestsellerFlag: false, rating: 4.84, reviewCount: 140, description: 'Warm medicated herbal boluses applied to relieve joint stiffness.', imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80' },
              ],
            },
          ],
        },
        {
          name: 'Hair Studio for Women',
          slug: 'hair-studio-women',
          icon: '💇‍♀️',
          badge: null,
          displayOrder: 3,
          isActive: true,
          description: 'L’Oréal hair spa, keratin, botox, global colouring & styling.',
          services: [
            { name: 'L’Oréal Hair Spa + Split End Trim + Blowdry Combo', slug: 'hair-spa-trim-combo', basePrice: 899, durationMinutes: 60, bestsellerFlag: true, rating: 4.93, reviewCount: 880, description: 'Deep nourishing hair spa, split end trimming and salon blowdry.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
            { name: 'Glam Blow Dry & Party Styling', slug: 'glam-blowdry-styling', basePrice: 399, durationMinutes: 45, bestsellerFlag: false, rating: 4.8, reviewCount: 290, description: 'Out-curls, straight sleek finish or bouncy beach waves.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
            { name: 'Advanced Layered Haircut & Wash', slug: 'layered-haircut-women', basePrice: 499, durationMinutes: 45, bestsellerFlag: true, rating: 4.86, reviewCount: 420, description: 'Personalized face-framing cut, shampoo wash and styling.', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
            { name: 'Brazilian Keratin Smoothing Treatment', slug: 'keratin-smoothing-women', basePrice: 3499, durationMinutes: 180, bestsellerFlag: false, rating: 4.91, reviewCount: 190, description: 'Frizz-free silky smooth hair for up to 6 months.', imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80' },
            { name: 'Global Hair Colour (Ammonia-Free Inoa)', slug: 'global-hair-colour-women', basePrice: 2199, durationMinutes: 120, bestsellerFlag: false, rating: 4.84, reviewCount: 260, description: '100% grey coverage with premium ammonia-free L’Oréal Inoa.', imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Makeup, Saree & Styling',
          slug: 'makeup-saree-styling',
          icon: '💄',
          badge: null,
          displayOrder: 4,
          isActive: true,
          description: 'Party makeup, saree draping & hairstyle for weddings and functions.',
          services: [
            { name: 'HD Party Makeup & Eyelashes', slug: 'hd-party-makeup', basePrice: 1499, durationMinutes: 90, bestsellerFlag: true, rating: 4.9, reviewCount: 310, description: 'Flawless HD base, eye makeup, lashes and long-lasting setting spray.', imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
            { name: 'Designer Saree Draping & Box Pleating', slug: 'saree-draping-service', basePrice: 299, durationMinutes: 25, bestsellerFlag: false, rating: 4.82, reviewCount: 190, description: 'Expert pin-up, box pleats and drape for any saree style.', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 3. Men's Salon & Massage (ACTIVE)
    {
      name: "Men's Salon & Massage",
      slug: 'mens-salon-massage',
      icon: 'content_cut',
      badge: null,
      isActive: true,
      order: 3,
      description: "Men's grooming, styled haircuts, beard shaping, charcoal cleanups & head/body massages at home.",
      subCategories: [
        {
          name: 'Salon for Men',
          slug: 'salon-for-men',
          icon: '🧔‍♂️',
          badge: '44 mins',
          displayOrder: 1,
          isActive: true,
          description: 'Haircut, beard grooming & de-tan cleanups.',
          services: [
            { name: "Men's Haircut + Beard Styling", slug: 'mens-haircut-beard', basePrice: 349, durationMinutes: 45, bestsellerFlag: true, rating: 4.85, reviewCount: 650, description: 'Trendy scissor/clipper haircut, beard styling & neck cleanup.', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
            { name: 'Beard Trimming & Hot Towel Shave', slug: 'beard-hot-towel', basePrice: 199, durationMinutes: 30, bestsellerFlag: false, rating: 4.76, reviewCount: 280, description: 'Razor precision lining, herbal balm and hot towel hydration.', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80' },
            { name: 'Activated Charcoal Pollution De-Tan Cleanup', slug: 'mens-charcoal-cleanup', basePrice: 549, durationMinutes: 40, bestsellerFlag: true, rating: 4.88, reviewCount: 420, description: 'Pore cleansing, dirt extraction, blackhead removal and mask.', imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Massage for Men',
          slug: 'massage-for-men',
          icon: '💆‍♂️',
          badge: null,
          displayOrder: 2,
          isActive: true,
          description: 'Therapeutic muscle relief and stress reduction.',
          tiers: [
            {
              name: 'Luxe Deep Tissue',
              slug: 'massage-men-luxe',
              tag: 'STRESS RELIEF',
              badge: 'Top rated',
              startingPrice: 999,
              displayOrder: 1,
              isActive: true,
              description: 'Deep muscle release with premium mineral oils',
              imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
              services: [
                { name: 'Deep Tissue Back & Spine Relief (60 min)', slug: 'mens-deep-tissue-massage', basePrice: 999, durationMinutes: 60, bestsellerFlag: true, rating: 4.92, reviewCount: 390, description: 'Firm pressure muscle relief massage for back pain and fatigue.', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
              ],
            },
            {
              name: 'Classic Relax',
              slug: 'massage-men-classic',
              tag: 'SWEDISH',
              badge: null,
              startingPrice: 699,
              displayOrder: 2,
              isActive: true,
              description: 'Full body relaxing oil massage',
              imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80',
              services: [
                { name: 'Stress Relief Head, Neck & Shoulder Massage (30 min)', slug: 'mens-head-shoulder-massage', basePrice: 399, durationMinutes: 30, bestsellerFlag: false, rating: 4.81, reviewCount: 210, description: 'Ayurvedic cooling oil head massage with shoulder relaxation.', imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80' },
              ],
            },
          ],
        },
      ],
    },

    // 4. AC & Appliance Repair (DISABLED)
    {
      name: 'AC & Appliance Repair',
      slug: 'ac-appliance-repair',
      icon: 'ac_unit',
      badge: '44 mins',
      isActive: false,
      order: 4,
      description: 'Expert servicing, foam jet wash, refrigerant recharge & motherboard fix.',
      subCategories: [
        {
          name: 'AC Service & Repair',
          slug: 'ac-service-sub',
          icon: '❄️',
          badge: '44 mins',
          displayOrder: 1,
          isActive: true,
          description: 'Power jet wash of indoor and outdoor units.',
          services: [
            { name: 'AC Service & Power Jet (44 mins)', slug: 'ac-power-jet', basePrice: 499, durationMinutes: 44, bestsellerFlag: true, rating: 4.83, reviewCount: 510, description: 'Power jet wash of filters, cooling coils & outdoor unit.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
            { name: 'AC Gas Refill & Leak Inspection', slug: 'ac-gas-leak-check', basePrice: 1499, durationMinutes: 60, bestsellerFlag: false, rating: 4.79, reviewCount: 220, description: 'Complete Freon/R32 gas charging and leak braze repair.', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Washing Machine & Refrigerator',
          slug: 'washing-fridge-sub',
          icon: '🧺',
          badge: null,
          displayOrder: 2,
          isActive: true,
          description: 'Motor spin check, drain valve fix & drum diagnosis.',
          services: [
            { name: 'Washing Machine Repair & Checkup', slug: 'washing-machine-repair', basePrice: 299, durationMinutes: 45, bestsellerFlag: false, rating: 4.77, reviewCount: 180, description: 'Motor spin check, drain valve fix & drum diagnosis.', imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80' },
            { name: 'Refrigerator Cooling Repair', slug: 'refrigerator-repair', basePrice: 349, durationMinutes: 45, bestsellerFlag: false, rating: 4.74, reviewCount: 140, description: 'Gas check, thermostat relay replacement & cooling audit.', imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 5. Electrician, Plumber & Carpenter (DISABLED)
    {
      name: 'Electrician, Plumber & Carpenter',
      slug: 'electrician-plumber-carpenter',
      icon: 'handyman',
      badge: '19 mins',
      isActive: false,
      order: 5,
      description: 'Certified technicians for wiring, MCBs, pipe leakage, locks & furniture assembly.',
      subCategories: [
        {
          name: 'Electrician',
          slug: 'electrician-sub',
          icon: '⚡',
          badge: '19 mins',
          displayOrder: 1,
          isActive: true,
          description: 'Switchboard repair, fan installation & short circuit fixes.',
          services: [
            { name: 'Switchboard / Socket Repair & Install', slug: 'switchboard-repair', basePrice: 149, durationMinutes: 30, bestsellerFlag: true, rating: 4.87, reviewCount: 620, description: 'Fix faulty modular switches, MCB trips and socket replacements.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
            { name: 'Ceiling Fan Installation / Repair', slug: 'fan-install-repair-handy', basePrice: 249, durationMinutes: 45, bestsellerFlag: false, rating: 4.8, reviewCount: 310, description: 'Assembly, regulator wiring and ceiling fan mount.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Plumber',
          slug: 'plumber-sub',
          icon: '🔧',
          badge: '19 mins',
          displayOrder: 2,
          isActive: true,
          description: 'Tap repair, drain unblocking & flush valve fixing.',
          services: [
            { name: 'Tap / Faucet Leak Repair', slug: 'tap-leak-repair', basePrice: 199, durationMinutes: 30, bestsellerFlag: true, rating: 4.82, reviewCount: 440, description: 'Spindle change, washer replacement and faucet fixing.', imageUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Drainage & Pipe Blockage Clearing', slug: 'drain-block-clearing', basePrice: 399, durationMinutes: 45, bestsellerFlag: false, rating: 4.79, reviewCount: 270, description: 'Mechanical unclogging of kitchen sink, floor traps & bathroom drains.', imageUrl: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=600&q=80' },
          ],
        },
        {
          name: 'Carpenter',
          slug: 'carpenter-sub',
          icon: '🪚',
          badge: null,
          displayOrder: 3,
          isActive: true,
          description: 'Door locks, drill & hang, and furniture assembly.',
          services: [
            { name: 'Door Lock Repair & Handle Fitting', slug: 'door-lock-fitting', basePrice: 299, durationMinutes: 45, bestsellerFlag: false, rating: 4.78, reviewCount: 190, description: 'Mortise lock, latch replacement and hinges realignment.', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Drill & Hang (Shelves, Curtains, TV)', slug: 'drill-hang-service', basePrice: 199, durationMinutes: 30, bestsellerFlag: true, rating: 4.85, reviewCount: 380, description: 'Wall mounting of frames, mirrors, rods and brackets.', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 6. Painting & Waterproofing (DISABLED)
    {
      name: 'Painting & Waterproofing',
      slug: 'painting-waterproofing',
      icon: 'format_paint',
      badge: null,
      isActive: false,
      order: 6,
      description: 'Dustless sanding, waterproof primer & Asian Paints color finish.',
      subCategories: [
        {
          name: 'Wall Painting & Waterproofing',
          slug: 'wall-painting-sub',
          icon: '🖌️',
          badge: null,
          displayOrder: 1,
          isActive: true,
          description: 'Interior repainting and bathroom leakage waterproofing.',
          services: [
            { name: 'Full Home Interior Painting Consultation', slug: 'interior-painting-consult', basePrice: 499, durationMinutes: 60, bestsellerFlag: true, rating: 4.9, reviewCount: 150, description: 'Laser wall measurement, color visualization and detailed quotation.', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },

    // 7. InstaHelp (DISABLED)
    {
      name: 'InstaHelp',
      slug: 'instahelp',
      icon: 'support_agent',
      badge: null,
      isActive: false,
      order: 7,
      description: 'Instant and verified on-demand helpers, daily cooks, babysitters & caregivers.',
      subCategories: [
        {
          name: 'Daily Helpers & Cooks',
          slug: 'daily-helpers-sub',
          icon: '👩‍💼',
          badge: null,
          displayOrder: 1,
          isActive: true,
          description: 'Same-day on-demand cooks and housekeeping maids.',
          services: [
            { name: 'Cook for 1 Meal (Up to 4 Persons)', slug: 'cook-single-meal', basePrice: 399, durationMinutes: 90, bestsellerFlag: true, rating: 4.88, reviewCount: 410, description: 'Freshly prepared home-style food (Roti, Sabzi, Dal, Rice).', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80' },
            { name: 'Emergency Housekeeper / Maid (2 Hours)', slug: 'emergency-maid-2hr', basePrice: 349, durationMinutes: 120, bestsellerFlag: false, rating: 4.8, reviewCount: 230, description: 'Vetted helper for utensil washing, sweeping and mopping.', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' },
          ],
        },
      ],
    },
  ];

  for (const catData of multiLevelServiceData) {
    const { subCategories, ...categoryFields } = catData;
    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {
        name: catData.name,
        icon: catData.icon,
        badge: catData.badge,
        isActive: catData.isActive,
        order: catData.order,
        description: catData.description,
      },
      create: {
        ...categoryFields,
      },
    });

    for (const subCat of subCategories) {
      const { tiers, services: directServices, ...subCatFields } = subCat as any;
      const subCategory = await prisma.serviceSubCategory.upsert({
        where: { slug: subCat.slug },
        update: {
          name: subCat.name,
          icon: subCat.icon,
          badge: subCat.badge,
          displayOrder: subCat.displayOrder,
          isActive: subCat.isActive,
          description: subCat.description,
          categoryId: category.id,
        },
        create: {
          ...subCatFields,
          categoryId: category.id,
        },
      });

      // If subcategory has tiers (e.g. Luxe, Prime, Ayurveda under Spa for Women)
      if (Array.isArray(tiers) && tiers.length > 0) {
        for (const tierData of tiers) {
          const { services: tierServices, ...tierFields } = tierData;
          const tier = await prisma.serviceTier.upsert({
            where: { slug: tierData.slug },
            update: {
              name: tierData.name,
              tag: tierData.tag,
              badge: tierData.badge,
              startingPrice: tierData.startingPrice,
              displayOrder: tierData.displayOrder,
              isActive: tierData.isActive,
              description: tierData.description,
              imageUrl: tierData.imageUrl,
              subCategoryId: subCategory.id,
            },
            create: {
              ...tierFields,
              subCategoryId: subCategory.id,
            },
          });

          if (Array.isArray(tierServices)) {
            for (const svc of tierServices) {
              await prisma.service.upsert({
                where: { slug: svc.slug },
                update: {
                  name: svc.name,
                  basePrice: svc.basePrice,
                  durationMinutes: svc.durationMinutes,
                  bestsellerFlag: svc.bestsellerFlag || false,
                  rating: svc.rating || 4.8,
                  reviewCount: svc.reviewCount || 100,
                  description: svc.description,
                  imageUrl: svc.imageUrl,
                  isActive: catData.isActive && subCat.isActive && tierData.isActive,
                  categoryId: category.id,
                  subCategoryId: subCategory.id,
                  tierId: tier.id,
                },
                create: {
                  ...svc,
                  categoryId: category.id,
                  subCategoryId: subCategory.id,
                  tierId: tier.id,
                  isActive: catData.isActive && subCat.isActive && tierData.isActive,
                },
              });
            }
          }
        }
      }

      // Direct services under subcategory
      if (Array.isArray(directServices)) {
        for (const svc of directServices) {
          await prisma.service.upsert({
            where: { slug: svc.slug },
            update: {
              name: svc.name,
              basePrice: svc.basePrice,
              durationMinutes: svc.durationMinutes,
              bestsellerFlag: svc.bestsellerFlag || false,
              rating: svc.rating || 4.8,
              reviewCount: svc.reviewCount || 100,
              description: svc.description,
              imageUrl: svc.imageUrl,
              isActive: catData.isActive && subCat.isActive,
              categoryId: category.id,
              subCategoryId: subCategory.id,
            },
            create: {
              ...svc,
              categoryId: category.id,
              subCategoryId: subCategory.id,
              isActive: catData.isActive && subCat.isActive,
            },
          });
        }
      }
    }
  }
  console.log(`✅ Seeded ${multiLevelServiceData.length} Urban Company multi-level service categories`);

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
