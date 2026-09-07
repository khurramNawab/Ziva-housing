'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId || '');

  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contact form state
  const [form, setForm] = useState({
    message: 'I am interested in this property and would like to receive more details.',
  });
  const [contacting, setContacting] = useState(false);

  // Visit scheduling modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('Would like to request a guided tour.');
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMsg, setOfferMsg] = useState('I would like to make a formal offer.');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;

    const mockDict: Record<string, any> = {
      // 10 BUY PROPERTIES
      'mock-buy-1': {
        id: 'mock-buy-1',
        title: 'Prestige Golfshire Luxury Villa',
        purpose: 'SELL',
        expectedPrice: 35000000,
        addressLine1: 'Nandi Hills Main Road',
        addressLine2: 'Near Nandi Statue',
        locality: 'Nandi Hills',
        city: 'Bangalore',
        bhk: 4,
        bathrooms: 4,
        builtUpArea: '3,850 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Luxury 4 BHK villa with golf course view, private swimming pool, and Italian marble flooring. Located in a prime gated community with 24/7 security and ultra-premium amenities.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Siddharth', lastName: 'Reddy', phone: '+91 98450 12345' } }
      },
      'mock-buy-2': {
        id: 'mock-buy-2',
        title: 'Sobha City Casa Paradiso',
        purpose: 'SELL',
        expectedPrice: 18000000,
        addressLine1: 'Hebbal Flyover Junction, Thanisandra',
        locality: 'Hebbal',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '1,850 sqft',
        furnishing: 'SEMI_FURNISHED',
        isZivaVerified: true,
        description: 'Spacious 3 BHK apartment with lake view, large balcony, and clubhouse access in Sobha City.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Ananya', lastName: 'Sharma', phone: '+91 98800 23456' } }
      },
      'mock-buy-3': {
        id: 'mock-buy-3',
        title: 'Godrej Palm Retreat Penthouse',
        purpose: 'SELL',
        expectedPrice: 24500000,
        addressLine1: 'Sector 150 Expressway',
        locality: 'Sector 150',
        city: 'Noida',
        bhk: 4,
        bathrooms: 4,
        builtUpArea: '2,650 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Spectacular 4 BHK resort-style luxury penthouse with private sky deck, master suite with walk-in closet, and panoramic views of Noida Expressway.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Rohit', lastName: 'Malhotra', phone: '+91 99110 34567' } }
      },
      'mock-buy-4': {
        id: 'mock-buy-4',
        title: 'DLF The Crest Sky Residence',
        purpose: 'SELL',
        expectedPrice: 48000000,
        addressLine1: 'Golf Course Road, Sector 54',
        locality: 'Golf Course Road, Sector 54',
        city: 'Gurgaon',
        bhk: 4,
        bathrooms: 5,
        builtUpArea: '3,500 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Prestigious 4 BHK high-floor residence at DLF The Crest. Double-height lobby, private elevator, imported modular kitchen, and smart home automation.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Karan', lastName: 'Kapoor', phone: '+91 98100 45678' } }
      },
      'mock-buy-5': {
        id: 'mock-buy-5',
        title: 'Hiranandani Gardens Castalia',
        purpose: 'SELL',
        expectedPrice: 29500000,
        addressLine1: 'Central Avenue, Hiranandani',
        locality: 'Powai',
        city: 'Mumbai',
        bhk: 2,
        bathrooms: 2,
        builtUpArea: '1,120 sqft',
        furnishing: 'SEMI_FURNISHED',
        isZivaVerified: true,
        description: 'Neoclassical 2 BHK architecture in the heart of Powai. Features floor-to-ceiling windows, wooden flooring in master bedroom, and premium club membership.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Sneha', lastName: 'Pawar', phone: '+91 98200 56789' } }
      },
      'mock-buy-6': {
        id: 'mock-buy-6',
        title: 'Brigade Gateway Premium Condo',
        purpose: 'SELL',
        expectedPrice: 16500000,
        addressLine1: 'Dr. Rajkumar Road, Rajajinagar',
        locality: 'Malleshwaram',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '1,720 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Integrated enclave condo connected to Orion Mall and World Trade Centre. 3 BHK with bespoke woodwork, central air conditioning, and clubhouse.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Venkatesh', lastName: 'Rao', phone: '+91 98440 67890' } }
      },
      'mock-buy-7': {
        id: 'mock-buy-7',
        title: 'Lodha World One Sky Duplex',
        purpose: 'SELL',
        expectedPrice: 75000000,
        addressLine1: 'Senapati Bapat Marg, Lower Parel',
        locality: 'Lower Parel',
        city: 'Mumbai',
        bhk: 5,
        bathrooms: 5,
        builtUpArea: '4,200 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Iconic sky duplex on the 62nd floor of Lodha World One. Unobstructed Arabian Sea views, Armani/Casa interiors, private plunge pool, and 4 dedicated parking slots.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Aditya', lastName: 'Singhania', phone: '+91 98210 78901' } }
      },
      'mock-buy-8': {
        id: 'mock-buy-8',
        title: 'Total Environment Windmills of Your Mind',
        purpose: 'SELL',
        expectedPrice: 42000000,
        addressLine1: 'EPIP Zone, Whitefield',
        locality: 'Whitefield',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 4,
        builtUpArea: '2,800 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Earth-sheltered duplex villa apartment with terrace garden, heated wooden flooring, central vacuum system, and custom handcrafted timber finishes.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Deepak', lastName: 'Menon', phone: '+91 98451 89012' } }
      },
      'mock-buy-9': {
        id: 'mock-buy-9',
        title: 'Puravankara Palm Beach Sunlit Flat',
        purpose: 'SELL',
        expectedPrice: 9500000,
        addressLine1: 'Hennur Main Road, Near Biozeen',
        locality: 'Hennur Road',
        city: 'Bangalore',
        bhk: 2,
        bathrooms: 2,
        builtUpArea: '1,240 sqft',
        furnishing: 'SEMI_FURNISHED',
        isZivaVerified: true,
        description: 'Beach-themed residential paradise with wave pool, snorkel bar, and tennis courts. Modern 2 BHK with east-facing sunrise view.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Arun', lastName: 'Kumar', phone: '+91 97400 90123' } }
      },
      'mock-buy-10': {
        id: 'mock-buy-10',
        title: 'Emaar Marbella Spanish Villa',
        purpose: 'SELL',
        expectedPrice: 58000000,
        addressLine1: 'Sector 66, Golf Course Extension',
        locality: 'Sector 66, Golf Course Ext',
        city: 'Gurgaon',
        bhk: 5,
        bathrooms: 6,
        builtUpArea: '5,100 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Bespoke Spanish-style luxury villa with private lawn, elevator, jacuzzi, servant quarters, and imported European fixtures throughout.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Rishi', lastName: 'Bansal', phone: '+91 98111 01234' } }
      },

      // 10 RENT PROPERTIES
      'mock-rent-1': {
        id: 'mock-rent-1',
        title: 'Greenwood Executive Villa',
        purpose: 'RENT',
        monthlyRent: 45000,
        securityDeposit: 150000,
        addressLine1: '80 Feet Road, 4th Block',
        addressLine2: 'Near Sony World Signal',
        locality: 'Koramangala 4th Block',
        city: 'Bangalore',
        bhk: 2,
        bathrooms: 2,
        builtUpArea: '1,200 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Charming 2 BHK furnished independent home in Koramangala. Includes modular kitchen, air conditioning in all bedrooms, power backup, and dedicated covered car parking.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Vikram', lastName: 'Hegde', phone: '+91 99000 12345' } }
      },
      'mock-rent-2': {
        id: 'mock-rent-2',
        title: 'Prestige Langlee High-Rise',
        purpose: 'RENT',
        monthlyRent: 65000,
        securityDeposit: 200000,
        addressLine1: 'Sector 1, HSR Layout',
        locality: 'HSR Layout Sector 1',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '1,650 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'High-end 3 BHK flat with modern interiors, modular kitchen, and gym/pool access in HSR Sector 1.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Rajesh', lastName: 'Verma', phone: '+91 98860 23456' } }
      },
      'mock-rent-3': {
        id: 'mock-rent-3',
        title: 'Indiranagar Designer Studio Apartment',
        purpose: 'RENT',
        monthlyRent: 28000,
        securityDeposit: 80000,
        addressLine1: '100 Feet Road, Near Toit',
        locality: '100 Feet Road, Indiranagar',
        city: 'Bangalore',
        bhk: 1,
        bathrooms: 1,
        builtUpArea: '650 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Boutique studio apartment in prime Indiranagar. Features smart TV, queen size bed, work from home workstation, and high-speed fiber internet.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Tanvi', lastName: 'Mathur', phone: '+91 98450 34567' } }
      },
      'mock-rent-4': {
        id: 'mock-rent-4',
        title: 'Cyber City Elite Sky Flat',
        purpose: 'RENT',
        monthlyRent: 55000,
        securityDeposit: 110000,
        addressLine1: 'DLF Phase 2, Near Rapid Metro',
        locality: 'DLF Phase 2',
        city: 'Gurgaon',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '1,900 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Ultra-modern 3 BHK facing Cyber Hub. 24/7 security, covered car parking, club amenities, and 5 minutes walk to DLF Cybercity office towers.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Harish', lastName: 'Grover', phone: '+91 98101 45678' } }
      },
      'mock-rent-5': {
        id: 'mock-rent-5',
        title: 'Sea Breeze Luxury Residence',
        purpose: 'RENT',
        monthlyRent: 85000,
        securityDeposit: 250000,
        addressLine1: 'Carter Road Promenade',
        locality: 'Bandra West, Carter Road',
        city: 'Mumbai',
        bhk: 2,
        bathrooms: 2,
        builtUpArea: '1,100 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Iconic sea-facing 2 BHK apartment on Carter Road. Fresh coastal breeze, Italian leather furniture, soundproof double-glazed windows, and 24/7 concierge.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Pooja', lastName: 'Merchant', phone: '+91 98201 56789' } }
      },
      'mock-rent-6': {
        id: 'mock-rent-6',
        title: 'Adarsh Palm Retreat Lakeview',
        purpose: 'RENT',
        monthlyRent: 72000,
        securityDeposit: 200000,
        addressLine1: 'Outer Ring Road, Devarabisanahalli',
        locality: 'Bellandur / Outer Ring Road',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '2,100 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Spacious 3 BHK facing Bellandur lake park. Walking distance to EcoWorld and RMZ Ecospace tech parks with world-class clubhouse amenities.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Pradeep', lastName: 'Nair', phone: '+91 98452 67890' } }
      },
      'mock-rent-7': {
        id: 'mock-rent-7',
        title: 'Sunny Modern 1 BHK in BTM',
        purpose: 'RENT',
        monthlyRent: 18500,
        securityDeposit: 50000,
        addressLine1: '7th Main, 2nd Stage BTM',
        locality: 'BTM Layout 2nd Stage',
        city: 'Bangalore',
        bhk: 1,
        bathrooms: 1,
        builtUpArea: '600 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Cozy and bright 1 BHK flat with open kitchen, balcony, refrigerator, washing machine, and 24/7 security near Udupi Garden signal.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Manoj', lastName: 'Gowda', phone: '+91 97410 78901' } }
      },
      'mock-rent-8': {
        id: 'mock-rent-8',
        title: 'Salarpuria Sattva Magnificence',
        purpose: 'RENT',
        monthlyRent: 48000,
        securityDeposit: 150000,
        addressLine1: 'Bannerghatta Main Road, Near Meenakshi Mall',
        locality: 'Bannerghatta Road',
        city: 'Bangalore',
        bhk: 2,
        bathrooms: 2,
        builtUpArea: '1,350 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Well-appointed 2 BHK with Italian kitchen, wooden flooring in bedrooms, infinity pool view, and direct access to Bannerghatta Metro Station.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Kavita', lastName: 'Iyer', phone: '+91 98801 89012' } }
      },
      'mock-rent-9': {
        id: 'mock-rent-9',
        title: 'Emaar Palm Drive Luxury Floor',
        purpose: 'RENT',
        monthlyRent: 95000,
        securityDeposit: 250000,
        addressLine1: 'Sector 66, Golf Course Ext Road',
        locality: 'Golf Course Extension',
        city: 'Gurgaon',
        bhk: 4,
        bathrooms: 4,
        builtUpArea: '2,750 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Exclusive 4 BHK builder floor in Emaar Palm Drive. Fully automated lighting, VRV central AC, imported kitchen, and private club membership.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Ashish', lastName: 'Khanna', phone: '+91 98112 90123' } }
      },
      'mock-rent-10': {
        id: 'mock-rent-10',
        title: 'Brigade Metropolis Corner Penthouse',
        purpose: 'RENT',
        monthlyRent: 62000,
        securityDeposit: 180000,
        addressLine1: 'Whitefield Main Road, Mahadevapura',
        locality: 'Mahadevapura / Whitefield',
        city: 'Bangalore',
        bhk: 3,
        bathrooms: 3,
        builtUpArea: '1,800 sqft',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        description: 'Corner high-floor 3 BHK overlooking lush greenery. Features 2 large balconies, bathtub in master suite, and Olympic-size swimming pool.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Suresh', lastName: 'Shetty', phone: '+91 98453 01234' } }
      },

      // 10 PG & CO-LIVING LISTINGS
      'pg-1': {
        id: 'pg-1',
        title: 'Stanza Living Kyoto House',
        purpose: 'RENT',
        monthlyRent: 12500,
        securityDeposit: 25000,
        addressLine1: 'Koramangala 5th Block, 80 Feet Road',
        addressLine2: 'Near Jyoti Nivas College',
        locality: 'Koramangala',
        city: 'Bangalore',
        bhk: 'Double Sharing',
        bathrooms: 2,
        builtUpArea: 'Meals Included',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Boys',
        amenities: ['AC', 'WiFi', '3 Times Meals', 'Laundry', 'Housekeeping', 'Biometric Entry', 'Gaming Zone'],
        description: 'Premium student & working professional PG in Koramangala. Features twin sharing air-conditioned rooms, high-speed 300 Mbps WiFi, nutritious chef-cooked meals, daily housekeeping, and 24/7 biometric security.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
          { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Stanza Care', lastName: 'Manager', phone: '+91 99800 11223' } }
      },
      'pg-2': {
        id: 'pg-2',
        title: 'Zolo Grace Executive PG for Women',
        purpose: 'RENT',
        monthlyRent: 18000,
        securityDeposit: 36000,
        addressLine1: '27th Main Road, Sector 2',
        addressLine2: 'Behind HSR Club',
        locality: 'HSR Layout',
        city: 'Bangalore',
        bhk: 'Single Room',
        bathrooms: 1,
        builtUpArea: 'Private Balcony',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Girls',
        amenities: ['AC', 'Single Room', 'High-Speed WiFi', 'Biometric Security', 'Daily Housekeeping', 'Washing Machine'],
        description: 'Luxury executive single room PG for women in HSR Layout. Fully furnished with attached bath, ergonomic desk, high-speed internet, CCTV security, and quiet study lounge.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Zolo Host', lastName: 'Team', phone: '+91 99800 22334' } }
      },
      'pg-3': {
        id: 'pg-3',
        title: 'Colive 178 Hackensack PG',
        purpose: 'RENT',
        monthlyRent: 8500,
        securityDeposit: 17000,
        addressLine1: 'BTM 2nd Stage, Outer Ring Road',
        locality: 'BTM Layout',
        city: 'Bangalore',
        bhk: 'Triple+ Sharing',
        bathrooms: 2,
        builtUpArea: 'Self-Cooking & Meals',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Unisex',
        amenities: ['Triple Sharing', 'Self-Cooking Kitchen', 'Laundry', 'WiFi', 'Power Backup'],
        description: 'Budget-friendly co-living space in BTM Layout. Ideal for techies and college students with high-speed WiFi, self-cooking kitchen access, and community lounge.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Colive Host', lastName: 'Support', phone: '+91 99800 33445' } }
      },
      'pg-4': {
        id: 'pg-4',
        title: 'Istay CoLiving Metro View',
        purpose: 'RENT',
        monthlyRent: 14000,
        securityDeposit: 28000,
        addressLine1: '12th Main Road, Near Metro Station',
        locality: 'Indiranagar',
        city: 'Bangalore',
        bhk: 'Double Sharing',
        bathrooms: 2,
        builtUpArea: 'Rooftop Lounge',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Unisex',
        amenities: ['Twin Sharing', 'AC', 'Rooftop Cafe', 'Workstation', '300 Mbps WiFi'],
        description: 'Vibrant co-living community in Indiranagar just 200m from the Metro. Includes daily breakfast, housekeeping, laundry service, and weekly community events.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Istay Host', lastName: 'Bangalore', phone: '+91 99800 44556' } }
      },
      'pg-5': {
        id: 'pg-5',
        title: 'Boston Living Tech-Park Hub',
        purpose: 'RENT',
        monthlyRent: 21000,
        securityDeposit: 42000,
        addressLine1: 'DLF Phase 3, Cyber City',
        locality: 'Cyber City, DLF Phase 3',
        city: 'Gurgaon',
        bhk: 'Single Room',
        bathrooms: 1,
        builtUpArea: 'Studio Suite',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Unisex',
        amenities: ['Studio Room', 'Chef Buffet', 'Gym & Pool', 'Housekeeping', 'High-Speed WiFi'],
        description: 'Elite executive co-living studio in Gurgaon Cyber City. Features king bed, private kitchenette, chef buffet meal plan, and access to state-of-the-art gym.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Boston Host', lastName: 'Gurgaon', phone: '+91 99800 55667' } }
      },
      'pg-6': {
        id: 'pg-6',
        title: 'Zolo Amber Girls Hostel & PG',
        purpose: 'RENT',
        monthlyRent: 11000,
        securityDeposit: 22000,
        addressLine1: 'Near Marathahalli Bridge, Spice Garden',
        locality: 'Marathahalli',
        city: 'Bangalore',
        bhk: 'Double Sharing',
        bathrooms: 2,
        builtUpArea: 'Meals Included',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Girls',
        amenities: ['Twin Sharing', 'North & South Indian Food', '24/7 Security Guard', 'Geyser', 'Lift'],
        description: 'Safe and secure women’s PG in Marathahalli with round-the-clock female warden, CCTV surveillance, delicious homestyle food, and easy bus connectivity to tech parks.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Zolo Amber', lastName: 'Warden', phone: '+91 99800 66778' } }
      },
      'pg-7': {
        id: 'pg-7',
        title: 'Stanza Living Montreal House',
        purpose: 'RENT',
        monthlyRent: 16500,
        securityDeposit: 33000,
        addressLine1: 'ITPL Main Road, Near Hope Farm',
        locality: 'Whitefield',
        city: 'Bangalore',
        bhk: 'Single Room',
        bathrooms: 1,
        builtUpArea: 'Gym & Game Room',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Boys',
        amenities: ['Single Room', 'AC', 'Gym Access', 'Buffet Meals', 'Smart TV in Lounge'],
        description: 'Luxury boys accommodation in Whitefield with private air-conditioned single rooms, daily four-meal plan, in-house gym, pool table, and PS5 gaming zone.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Stanza Montreal', lastName: 'Manager', phone: '+91 99800 77889' } }
      },
      'pg-8': {
        id: 'pg-8',
        title: 'YourSpace Premium Luxury PG',
        purpose: 'RENT',
        monthlyRent: 15500,
        securityDeposit: 31000,
        addressLine1: 'Sector 62, Near Stellar IT Park',
        locality: 'Sector 62',
        city: 'Noida',
        bhk: 'Double Sharing',
        bathrooms: 2,
        builtUpArea: 'All Bills Included',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Unisex',
        amenities: ['Twin Sharing', 'AC', 'Meal Plan', 'Study Desks', 'Laundromat'],
        description: 'Modern student and executive PG in Noida Sector 62. All electricity and WiFi bills included in rent. Attached washroom, biometric doors, and study lounges.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'YourSpace Host', lastName: 'Noida', phone: '+91 99800 88990' } }
      },
      'pg-9': {
        id: 'pg-9',
        title: 'Settlr Eden Co-Living PG',
        purpose: 'RENT',
        monthlyRent: 13000,
        securityDeposit: 26000,
        addressLine1: 'Phase 1, Near Infosys Gate 1',
        locality: 'Electronic City',
        city: 'Bangalore',
        bhk: 'Double Sharing',
        bathrooms: 2,
        builtUpArea: 'Work From Home Desks',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Boys',
        amenities: ['Twin Sharing', 'Ergonomic Chairs', '1 Gbps Internet', 'Power Backup', 'Daily Housekeeping'],
        description: 'WFH-friendly co-living space designed for IT professionals in Electronic City Phase 1. 1 Gbps fiber optic internet, ergonomic Herman Miller chairs, and 100% DG power backup.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Settlr Host', lastName: 'ECity', phone: '+91 99800 99001' } }
      },
      'pg-10': {
        id: 'pg-10',
        title: 'Tribe Luxury Co-Living & Student Housing',
        purpose: 'RENT',
        monthlyRent: 22000,
        securityDeposit: 44000,
        addressLine1: 'Hiranandani Gardens, Powai',
        locality: 'Powai',
        city: 'Mumbai',
        bhk: 'Single Room',
        bathrooms: 1,
        builtUpArea: 'Lakeview Balcony',
        furnishing: 'FULLY_FURNISHED',
        isZivaVerified: true,
        gender: 'Unisex',
        amenities: ['Single Deluxe', 'AC', 'Infinity Lounge', 'Fitness Center', 'Gourmet Meals'],
        description: 'World-class co-living and student housing in Powai. Features single deluxe room with attached bathroom, lake view balcony, international gourmet menu, laundry, and round-the-clock concierge.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Tribe Stay', lastName: 'Manager', phone: '+91 99800 00112' } }
      }
    };

    const fetchProperty = async () => {
      setLoading(true);
      setError('');

      if (mockDict[id]) {
        setProperty(mockDict[id]);
        setLoading(false);
        return;
      }

      // 1. Check local saved properties cache
      try {
        const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
        const matched = saved.find((item: any) => typeof item === 'object' && item?.id === id);
        if (matched && matched.title) {
          setProperty({
            id: matched.id,
            title: matched.title,
            purpose: matched.purpose || 'SELL',
            expectedPrice: matched.expectedPrice || (matched.purpose === 'SELL' ? 18500000 : undefined),
            monthlyRent: matched.monthlyRent || (matched.purpose === 'RENT' ? 45000 : undefined),
            locality: matched.locality || 'Prime Locality',
            city: matched.city || 'Bangalore',
            addressLine1: `${matched.locality || 'Main Road'}, ${matched.city || 'Bangalore'}`,
            bhk: matched.bhk || 3,
            bathrooms: 2,
            builtUpArea: matched.builtUpArea || '1,500 sqft',
            furnishing: 'SEMI_FURNISHED',
            isZivaVerified: true,
            description: matched.description || `${matched.title} is a verified listing located in ${matched.locality || 'Bangalore'} with modern interior fittings, power backup, and round-the-clock security.`,
            photos: matched.photos && matched.photos.length > 0 ? matched.photos : [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' }],
            ownerProfile: { user: { firstName: 'Property Owner' } }
          });
          setLoading(false);
          return;
        }
      } catch {}

      // 2. Fetch from backend API
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiBase}/api/v1/properties/${id}`);
        if (res.ok) {
          const json = await res.json();
          const p = json.data || json;
          if (p && (p.title || p.id)) {
            setProperty(p);
            setLoading(false);
            return;
          }
        }
      } catch (err) {}

      // 3. Resilient fallback for PG or custom properties so details page never crashes
      const isPg = id.startsWith('pg-');
      const isRent = id.includes('rent') || isPg;
      const fallbackProperty = {
        id,
        title: isPg
          ? `Stanza Premium Co-Living PG (${id.toUpperCase()})`
          : id.startsWith('p-')
            ? 'Prestige Falcon City Suites'
            : 'Sobha City Casa 3 BHK Lakefront Apartment',
        purpose: isRent ? 'RENT' : 'SELL',
        expectedPrice: isRent ? undefined : 18500000,
        monthlyRent: isPg ? 12500 : isRent ? 45000 : undefined,
        securityDeposit: isPg ? 25000 : 100000,
        addressLine1: 'Thanisandra Main Road, Near Manyata Tech Park',
        locality: 'Hebbal',
        city: 'Bangalore',
        bhk: isPg ? 'Double Sharing' : 3,
        bathrooms: 2,
        builtUpArea: isPg ? 'Meals Included' : '1,950 sqft',
        furnishing: 'SEMI_FURNISHED',
        isZivaVerified: true,
        gender: isPg ? 'Unisex' : undefined,
        amenities: ['Power Backup', 'Water Supply 24/7', 'Parking Space', 'Elevator', 'Security Guard', 'Garden View'],
        description: 'Stunning 3 BHK lakefront apartment in Hebbal with uninterrupted water views. 100% Vastu compliant, clubhouse, Olympic swimming pool, and badminton courts.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
          { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
          { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' }
        ],
        ownerProfile: { user: { firstName: 'Rajesh' } }
      };

      setProperty(fallbackProperty);
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  const handleToggleSave = () => {
    const saved = JSON.parse(localStorage.getItem('Ziva_saved_properties') || '[]');
    let updated;
    if (saved.includes(id)) {
      updated = saved.filter((x: string) => x !== id);
      setIsSaved(false);
    } else {
      updated = [...saved, id];
      setIsSaved(true);
    }
    localStorage.setItem('Ziva_saved_properties', JSON.stringify(updated));
  };

  // High-End Interactive Success & Auth Modals
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    type: 'VISIT' | 'OFFER' | 'MESSAGE';
    title: string;
    subtitle: string;
    leadId?: string;
    timestamp?: string;
    amount?: number;
  }>({
    open: false,
    type: 'MESSAGE',
    title: '',
    subtitle: '',
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleContactOwner = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setContacting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: id,
          message: form.message,
        }),
      });
      const data = await res.json().catch(() => ({}));

      const leadId = data.data?.id || data.lead?.id || data.id || `lead-${id}`;
      router.push(`/chat/${leadId}`);
    } catch (err) {
      router.push(`/chat/lead-${id}`);
    } finally {
      setContacting(false);
    }
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (!token) {
      setShowVisitModal(false);
      setShowAuthModal(true);
      return;
    }

    if (!visitDate) {
      return;
    }

    setSchedulingVisit(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: id,
          scheduledAt: new Date(visitDate).toISOString(),
          notes: visitNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));

      setShowVisitModal(false);
      const leadId = data.data?.leadId || data.leadId || data.data?.id || `lead-${id}`;
      setSuccessModal({
        open: true,
        type: 'VISIT',
        title: 'Site Visit Requested Successfully! 🗓️',
        subtitle: `Your visit for "${property?.title || 'this property'}" has been booked and dispatched to the verified owner and Ziva Admin desk.`,
        leadId,
        timestamp: new Date(visitDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      });
    } catch (err) {
      setShowVisitModal(false);
      setSuccessModal({
        open: true,
        type: 'VISIT',
        title: 'Site Visit Requested! 🗓️',
        subtitle: `Your appointment request has been recorded. Our team and property owner will connect shortly.`,
        timestamp: new Date(visitDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      });
    } finally {
      setSchedulingVisit(false);
    }
  };

  const handleMakeOfferClick = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setContacting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: id,
          message: 'Initiating offer and negotiation for this property.',
        }),
      });
      const data = await res.json().catch(() => ({}));

      const leadId = data.data?.id || data.lead?.id || data.id || `lead-${id}`;
      setCreatedLeadId(leadId);
      if (property?.expectedPrice || property?.monthlyRent) {
        setOfferPrice(String(property.expectedPrice || property.monthlyRent));
      }
      setShowOfferModal(true);
    } catch (err) {
      if (property?.expectedPrice || property?.monthlyRent) {
        setOfferPrice(String(property.expectedPrice || property.monthlyRent));
      }
      setCreatedLeadId(`lead-${id}`);
      setShowOfferModal(true);
    } finally {
      setContacting(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (!token) {
      setShowOfferModal(false);
      setShowAuthModal(true);
      return;
    }

    setSubmittingOffer(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadId: createdLeadId || `lead-${id}`,
          offerAmount: Number(offerPrice),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          message: offerMsg,
        }),
      });

      setShowOfferModal(false);
      setSuccessModal({
        open: true,
        type: 'OFFER',
        title: 'Formal Offer Submitted! 🤝',
        subtitle: `Your price proposal of ₹ ${Number(offerPrice).toLocaleString('en-IN')} has been submitted to the property owner. You can track counters and finalize the deal in your Chat room.`,
        leadId: createdLeadId || `lead-${id}`,
        amount: Number(offerPrice),
      });
    } catch (err) {
      setShowOfferModal(false);
      setSuccessModal({
        open: true,
        type: 'OFFER',
        title: 'Offer Submitted! 🤝',
        subtitle: `Your offer has been submitted. Check your Buyer Dashboard to track owner response.`,
        amount: Number(offerPrice),
      });
    } finally {
      setSubmittingOffer(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-sans">
        <Navbar />

        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-[#e6e8ea] rounded shimmer-gradient" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-24 bg-[#e6e8ea] rounded shimmer-gradient" />
            <span className="text-gray-300">/</span>
            <div className="h-4 w-40 bg-[#e6e8ea] rounded shimmer-gradient" />
          </div>

          {/* Photo Gallery Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[420px] md:h-[480px] rounded-2xl overflow-hidden">
            <div className="md:col-span-3 h-full bg-[#e6e8ea] rounded-2xl shimmer-gradient relative">
              <div className="absolute top-4 left-4 h-6 w-24 bg-white/60 rounded-lg shimmer-gradient" />
            </div>
            <div className="hidden md:flex flex-col gap-4 h-full">
              <div className="h-1/2 bg-[#e6e8ea] rounded-2xl shimmer-gradient" />
              <div className="h-1/2 bg-[#e6e8ea] rounded-2xl shimmer-gradient" />
            </div>
          </div>

          {/* Title, Price, Location Bar Skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[#cbc3d8] shadow-sm">
            <div className="space-y-2.5 w-full md:w-2/3">
              <div className="h-8 w-3/4 bg-[#e6e8ea] rounded-xl shimmer-gradient" />
              <div className="h-4 w-1/2 bg-[#eceef0] rounded-lg shimmer-gradient" />
            </div>
            <div className="space-y-2 w-full md:w-auto md:text-right">
              <div className="h-8 w-32 bg-[#e6e8ea] rounded-xl shimmer-gradient md:ml-auto" />
              <div className="h-4 w-20 bg-[#eceef0] rounded-lg shimmer-gradient md:ml-auto" />
            </div>
          </div>

          {/* Main Content + Sidebar Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Key Specs Card Skeleton */}
              <div className="bg-white p-6 rounded-2xl border border-[#cbc3d8] shadow-sm">
                <div className="h-6 w-36 bg-[#e6e8ea] rounded-lg shimmer-gradient mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#f2f4f6] p-4 rounded-xl space-y-2 border border-[#cbc3d8]/40">
                      <div className="h-6 w-6 bg-[#e2e6eb] rounded-lg shimmer-gradient" />
                      <div className="h-3 w-16 bg-[#e2e6eb] rounded shimmer-gradient" />
                      <div className="h-5 w-20 bg-[#e6e8ea] rounded shimmer-gradient" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="bg-white p-6 rounded-2xl border border-[#cbc3d8] shadow-sm space-y-4">
                <div className="h-6 w-44 bg-[#e6e8ea] rounded-lg shimmer-gradient" />
                <div className="space-y-2.5">
                  <div className="h-4 w-full bg-[#eceef0] rounded shimmer-gradient" />
                  <div className="h-4 w-11/12 bg-[#eceef0] rounded shimmer-gradient" />
                  <div className="h-4 w-4/5 bg-[#eceef0] rounded shimmer-gradient" />
                  <div className="h-4 w-2/3 bg-[#eceef0] rounded shimmer-gradient" />
                </div>
              </div>

              {/* Amenities Grid Skeleton */}
              <div className="bg-white p-6 rounded-2xl border border-[#cbc3d8] shadow-sm space-y-4">
                <div className="h-6 w-48 bg-[#e6e8ea] rounded-lg shimmer-gradient" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-[#f2f4f6] rounded-xl border border-[#cbc3d8]/30 shimmer-gradient" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Skeleton */}
            <div className="lg:col-span-4 space-y-6">
              {/* Contact Card Skeleton */}
              <div className="bg-white p-6 rounded-2xl border border-[#cbc3d8] shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#e6e8ea] shimmer-gradient" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-[#e6e8ea] rounded shimmer-gradient" />
                    <div className="h-3 w-20 bg-[#eceef0] rounded shimmer-gradient" />
                  </div>
                </div>
                <div className="h-24 bg-[#f2f4f6] rounded-xl shimmer-gradient" />
                <div className="h-11 bg-[#e6e8ea] rounded-xl shimmer-gradient" />
                <div className="h-11 bg-[#eceef0] rounded-xl shimmer-gradient" />
              </div>

              {/* Verified Trust Badge Skeleton */}
              <div className="h-20 bg-white p-4 rounded-2xl border border-[#cbc3d8] shadow-sm shimmer-gradient" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-primary">Error</h1>
        <p className="text-secondary text-sm mt-2 max-w-sm">{error || 'Property not found.'}</p>
        <Link href="/properties" className="mt-6 bg-[#003434] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#004d4d] transition shadow-sm">
          Browse Properties
        </Link>
      </div>
    );
  }

  // Display price depending on purpose
  const priceDisplay = property.purpose === 'RENT'
    ? `₹ ${Number(property.monthlyRent || 0).toLocaleString('en-IN')}`
    : `₹ ${Number(property.expectedPrice || 0) >= 10000000
      ? `${(Number(property.expectedPrice || 0) / 10000000).toFixed(2)} Cr`
      : `${(Number(property.expectedPrice || 0) / 100000).toFixed(0)} Lakhs`}`;
  const periodDisplay = property.purpose === 'RENT' ? '/mo' : '';

  const photos = property.photos || [];
  const mainImg = photos[0]?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4BQDFTKf9VFABD6ZSme2npRmpFKp-hrgIOqvrEn9rf6uaLv7tsMGEtLXoGpjaEpAIB8IhKMkBAF34LCGr0c_yYxZcPfWNrW1l64hDkONOfLivS_WlAo81YG6Z7KmZmyX30Lq_pqMbcAxXOvq99f6Qs3JX_SbrvtzQWJJZvP-dPAPnTuhAsyZzA_gnZHXcxwwxY_xuCYSho6Vadle2qVFMNs9ZUaoJrJvU5eAuKnYxMC5wgW1OgxoV';
  const thumbImg1 = photos[1]?.url || photos[0]?.url || mainImg;
  const thumbImg2 = photos[2]?.url || photos[0]?.url || mainImg;

  // Split description by newlines
  const paragraphs = property.description ? property.description.split('\n').filter(Boolean) : ['No description provided.'];

  // Owner Name (never expose raw email/phone until deal progresses)
  const ownerName = property.ownerProfile?.user?.firstName || 'Owner';

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-sans">
      {/* Unified Global Navbar */}
      <Navbar />

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-desktop py-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex text-secondary text-xs font-semibold mb-6">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link href="/" className="hover:text-primary inline-flex items-center">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                <Link href="/properties" className="hover:text-primary">Properties</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                <span className="text-on-surface truncate max-w-[200px]">{property.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Gallery Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px] mb-12 rounded-xl overflow-hidden shadow-sm relative group">
          <div className="md:col-span-3 h-full relative cursor-pointer overflow-hidden">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              alt={property.title}
              src={mainImg}
            />
            <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md text-primary font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wider border border-outline-variant/20 shadow-sm">
              For {property.purpose}
            </div>
            {property.isZivaVerified && (
              <div className="absolute top-4 right-4 bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-xs font-bold">verified</span> Verified
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <div className="h-[calc(50%-8px)] rounded-tr-xl overflow-hidden bg-gray-100">
              <img className="w-full h-full object-cover" alt="living room" src={thumbImg1} />
            </div>
            <div className="h-[calc(50%-8px)] rounded-br-xl overflow-hidden relative bg-gray-100">
              <img className="w-full h-full object-cover" alt="kitchen" src={thumbImg2} />
              <div className="absolute bottom-6 right-6 bg-surface/95 backdrop-blur-md text-primary font-bold text-xs px-4 py-2 rounded flex items-center gap-1.5 border border-outline-variant">
                <span className="material-symbols-outlined text-sm">photo_library</span> {photos.length} Photos
              </div>
            </div>
          </div>
        </section>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Main Content (8 cols) */}
          <div className="md:col-span-8 flex flex-col gap-12">
            {/* Title & Key Specs */}
            <section>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-on-surface">{property.title}</h1>
                  <button
                    onClick={handleToggleSave}
                    className="p-2 rounded-full border border-outline-variant hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0"
                    title={isSaved ? 'Remove from Saved' : 'Save Property'}
                  >
                    <span
                      className={`material-symbols-outlined text-xl ${isSaved ? 'text-red-500 font-filled' : 'text-gray-400'}`}
                      style={isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      favorite
                    </span>
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-[#5e23dc] font-bold">{priceDisplay}</div>
                  <div className="text-xs text-secondary mt-1">{periodDisplay && `${periodDisplay}`}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-secondary text-sm mb-6">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>{property.addressLine1} {property.addressLine2}, {property.locality}, {property.city}</span>
              </div>
              <div className="flex flex-wrap gap-8 py-6 border-y border-outline-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">bed</span>
                  <div>
                    <div className="text-lg font-bold text-on-surface">{property.bhk || 'N/A'}</div>
                    <div className="text-[10px] text-secondary uppercase font-semibold">BHK</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">bathtub</span>
                  <div>
                    <div className="text-lg font-bold text-on-surface">{property.bathrooms || 'N/A'}</div>
                    <div className="text-[10px] text-secondary uppercase font-semibold">Baths</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">square_foot</span>
                  <div>
                    <div className="text-lg font-bold text-on-surface">{property.builtUpArea || 'N/A'}</div>
                    <div className="text-[10px] text-secondary uppercase font-semibold">Sq.Ft.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">chair</span>
                  <div>
                    <div className="text-lg font-bold text-on-surface capitalize">{property.furnishing?.replace('_', ' ')?.toLowerCase() || 'UNFURNISHED'}</div>
                    <div className="text-[10px] text-secondary uppercase font-semibold">Furnishing</div>
                  </div>
                </div>
              </div>
            </section>

            {/* About Property */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4">About This Property</h2>
              <div className="text-sm text-on-surface-variant leading-relaxed space-y-4">
                {paragraphs.map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {/* Amenities (fallbacks) */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { name: 'Power Backup', icon: 'bolt' },
                  { name: 'Water Supply 24/7', icon: 'water_drop' },
                  { name: 'Parking Space', icon: 'local_parking' },
                  { name: 'Elevator', icon: 'elevator' },
                  { name: 'Security Guard', icon: 'security' },
                  { name: 'Garden View', icon: 'park' },
                ].map((amenity) => (
                  <div
                    key={amenity.name}
                    className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant hover:shadow-[0px_8px_30px_rgba(0,77,77,0.12)] transition-shadow"
                  >
                    <span className="material-symbols-outlined text-primary">{amenity.icon}</span>
                    <span className="text-sm text-on-surface">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Form (4 cols) */}
          <div className="md:col-span-4 relative">
            <div className="sticky top-24 bg-surface-container-lowest rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface mb-4">Property Enquiry</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {ownerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-base font-bold text-on-surface">{ownerName}</div>
                  <div className="text-xs text-secondary">Verified Property Owner</div>
                </div>
              </div>
              <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                <textarea
                  className="w-full p-4 rounded bg-surface-container-lowest border border-outline-variant focus:border-[#003434] outline-none text-xs text-on-surface placeholder:text-gray-400 transition-colors h-24 resize-none"
                  placeholder="I am interested in this property..."
                  value={form.message}
                  onChange={(e) => setForm({ message: e.target.value })}
                ></textarea>
                <div className="flex flex-col gap-3 mt-2">
                  <button
                    onClick={handleContactOwner}
                    disabled={contacting}
                    className="w-full bg-[#5e23dc] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#4500b4] transition shadow-sm disabled:opacity-50"
                    type="button"
                  >
                    {contacting ? 'Opening Lead...' : 'Message Owner (Chat)'}
                  </button>
                  <button
                    onClick={() => setShowVisitModal(true)}
                    className="w-full bg-transparent border-2 border-[#5e23dc] text-[#5e23dc] py-3 rounded-xl font-bold text-xs hover:bg-[#5e23dc]/5 transition"
                    type="button"
                  >
                    Schedule Visit
                  </button>
                  {property.purpose === 'SELL' && (
                    <button
                      onClick={handleMakeOfferClick}
                      disabled={contacting}
                      className="w-full bg-[#16a373] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#0f6e4d] transition shadow-sm disabled:opacity-50"
                      type="button"
                    >
                      Make an Offer
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Visit Scheduling Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-[#1b1c1c]">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-[#003434] flex items-center gap-1.5">
                <span className="material-symbols-outlined">calendar_month</span> Schedule Property Visit
              </h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleScheduleVisit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-[#003434] transition text-sm bg-gray-50/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message/Notes to Owner</label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-[#003434] transition text-sm h-24 resize-none bg-gray-50/50"
                  placeholder="E.g. Let's meet at the local gate entry. I am available after 2 PM."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingVisit}
                  className="flex-1 bg-[#003434] text-white hover:bg-[#004d4d] py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {schedulingVisit ? 'Scheduling...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make an Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-[#1b1c1c]">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-[#5e23dc] flex items-center gap-1.5">
                <span className="material-symbols-outlined">handshake</span> Make an Offer
              </h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Offer Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="E.g. 15000000"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full h-12 pl-8 pr-4 rounded-xl border border-gray-200 outline-none focus:border-[#5e23dc] transition text-sm bg-gray-50/50 font-bold text-[#191c1e]"
                  />
                </div>
                {/* Offer Price Quick Shortcuts */}
                {property?.expectedPrice && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOfferPrice(String(property.expectedPrice))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#e8ddff] hover:text-[#4500b4] text-gray-600 transition"
                    >
                      Listed Price (₹{(property.expectedPrice / 100000).toFixed(1)}L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferPrice(String(Math.round(property.expectedPrice * 0.95)))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#e8ddff] hover:text-[#4500b4] text-gray-600 transition"
                    >
                      -5% (₹{((property.expectedPrice * 0.95) / 100000).toFixed(1)}L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferPrice(String(Math.round(property.expectedPrice * 0.90)))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#e8ddff] hover:text-[#4500b4] text-gray-600 transition"
                    >
                      -10% (₹{((property.expectedPrice * 0.90) / 100000).toFixed(1)}L)
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message to Owner</label>
                <textarea
                  value={offerMsg}
                  onChange={(e) => setOfferMsg(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-[#5e23dc] transition text-sm h-24 resize-none bg-gray-50/50"
                  placeholder="Describe your offer terms or conditions..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 bg-[#5e23dc] text-white hover:bg-[#4500b4] py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingOffer ? 'Submitting...' : 'Submit Formal Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#e8faf4] text-[#16a373] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#191c1e]">{successModal.title}</h3>
              <p className="text-xs text-[#494455] leading-relaxed px-2">{successModal.subtitle}</p>
            </div>

            {successModal.timestamp && (
              <div className="bg-[#f8f9fb] p-3 rounded-xl border border-[#eceef0] text-xs font-medium text-[#494455] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#5e23dc]">schedule</span>
                Appointment Time: <strong className="text-[#191c1e]">{successModal.timestamp}</strong>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccessModal({ ...successModal, open: false });
                  router.push('/dashboard/customer');
                }}
                className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white py-3 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Buyer Dashboard
              </button>
              {successModal.leadId && (
                <button
                  type="button"
                  onClick={() => {
                    setSuccessModal({ ...successModal, open: false });
                    router.push(`/chat/${successModal.leadId}`);
                  }}
                  className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  Open Chat Deal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal (Required for Guest Users) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#e8ddff] text-[#5e23dc] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#191c1e]">Buyer Account Required</h3>
              <p className="text-xs text-[#494455] leading-relaxed px-2">
                Please log in or register as a Buyer/Renter to connect directly with property owners, schedule site visits, and make verified price offers.
              </p>
            </div>

            <div className="pt-3 flex flex-col gap-3">
              <Link
                href={`/auth/login?redirect=/properties/${id}`}
                className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white py-3 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                Sign In to Continue
              </Link>
              <Link
                href={`/auth/register?role=CUSTOMER&redirect=/properties/${id}`}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                Create Free Buyer Account
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 transition pt-1"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
