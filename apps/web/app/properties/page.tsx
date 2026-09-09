'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purposeParam = searchParams.get('purpose') || 'BUY'; // BUY, RENT, SELL, PG, NEW_PROJECTS
  const queryParam = searchParams.get('q') || '';

  // Filter & Sorting States
  const [sortOption, setSortOption] = useState('RELEVANCE');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceRangeValue, setPriceRangeValue] = useState(500); // 5 Cr max for sale
  const [viewMode, setViewMode] = useState<'GRID' | 'MAP'>('GRID');
  const [selectedBhk, setSelectedBhk] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [furnishing, setFurnishing] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Extended Filters
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [possession, setPossession] = useState('');

  // PG Specific Dynamic Filters
  const [pgGender, setPgGender] = useState<string>('');
  const [pgSharing, setPgSharing] = useState<string[]>([]);
  const [pgWithFood, setPgWithFood] = useState(false);
  const [pgWithAc, setPgWithAc] = useState(false);
  const [pgWithWifi, setPgWithWifi] = useState(false);
  const [pgWithLaundry, setPgWithLaundry] = useState(false);
  const [pgSearchQuery, setPgSearchQuery] = useState('');

  // New Projects Builder Filter
  const [builderFilter, setBuilderFilter] = useState('');

  // Interactive Map State & Coordinates
  const [selectedMapPinId, setSelectedMapPinId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [userLocationMarker, setUserLocationMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [mapToast, setMapToast] = useState<string | null>(null);

  const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
    koramangala: { lat: 12.9352, lng: 77.6245 },
    indiranagar: { lat: 12.9784, lng: 77.6408 },
    hsr: { lat: 12.9121, lng: 77.6446 },
    'hsr layout': { lat: 12.9121, lng: 77.6446 },
    whitefield: { lat: 12.9698, lng: 77.7500 },
    btm: { lat: 12.9166, lng: 77.6101 },
    'btm layout': { lat: 12.9166, lng: 77.6101 },
    hebbal: { lat: 13.0358, lng: 77.5970 },
    marathahalli: { lat: 12.9591, lng: 77.6974 },
    malleshwaram: { lat: 13.0031, lng: 77.5643 },
    bellandur: { lat: 12.9260, lng: 77.6762 },
    'electronic city': { lat: 12.8399, lng: 77.6770 },
    sarjapur: { lat: 12.9248, lng: 77.6853 },
    noida: { lat: 28.5355, lng: 77.3910 },
    gurgaon: { lat: 28.4595, lng: 77.0266 },
    'cyber city': { lat: 28.4950, lng: 77.0895 },
    mumbai: { lat: 19.0760, lng: 72.8777 },
  };

  const handleZoomIn = () => {
    setMapZoom((z) => Math.min(z + 1, 18));
  };

  const handleZoomOut = () => {
    setMapZoom((z) => Math.max(z - 1, 9));
  };

  const handleGpsLocate = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      setMapToast('Locating your GPS coordinates...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapCenter({ lat, lng });
          setUserLocationMarker({ lat, lng });
          setMapZoom(15);
          setIsLocating(false);
          setMapToast('📍 Centered on your current location');
          setTimeout(() => setMapToast(null), 3500);
        },
        () => {
          setIsLocating(false);
          setMapCenter({ lat: 12.9716, lng: 77.5946 });
          setMapToast('⚠️ GPS location unavailable, centered on Bangalore');
          setTimeout(() => setMapToast(null), 3500);
        },
        { timeout: 7000 }
      );
    } else {
      setMapToast('GPS not supported on your browser');
      setTimeout(() => setMapToast(null), 3000);
    }
  };

  const handleSelectMapProperty = (prop: any) => {
    setSelectedMapPinId(prop.id);
    const locKey = Object.keys(LOCALITY_COORDS).find((k) =>
      (prop.locality || '').toLowerCase().includes(k)
    );
    const coords =
      prop.latitude && prop.longitude
        ? { lat: Number(prop.latitude), lng: Number(prop.longitude) }
        : locKey
        ? LOCALITY_COORDS[locKey]
        : null;
    if (coords) {
      setMapCenter(coords);
      setMapZoom(14);
    }
  };

  // API Property states
  const [apiProperties, setApiProperties] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('Ziva_saved_properties');
      if (raw) {
        const parsed = JSON.parse(raw);
        const ids = parsed.map((item: any) => (typeof item === 'string' ? item : item.id));
        setSavedIds(ids);
      }
    } catch {}
  }, []);

  const toggleSaveProperty = (prop: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const raw = localStorage.getItem('Ziva_saved_properties');
      let list = raw ? JSON.parse(raw) : [];

      const isAlreadySaved = list.some((item: any) => (typeof item === 'string' ? item === prop.id : item.id === prop.id));

      if (isAlreadySaved) {
        list = list.filter((item: any) => (typeof item === 'string' ? item !== prop.id : item.id !== prop.id));
        setSavedIds((prev) => prev.filter((id) => id !== prop.id));
      } else {
        const saveObj = {
          id: prop.id,
          title: prop.title,
          expectedPrice: prop.priceNum || 0,
          monthlyRent: prop.priceNum || 0,
          locality: prop.locality,
          city: prop.city,
          purpose: prop.purpose || (purposeParam === 'RENT' ? 'RENT' : 'SELL'),
          bhk: prop.bhk,
          builtUpArea: prop.builtUpArea || '1,400',
          photos: [{ url: prop.img || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80' }],
        };
        list.push(saveObj);
        setSavedIds((prev) => [...prev, prop.id]);
      }

      localStorage.setItem('Ziva_saved_properties', JSON.stringify(list));
    } catch (err) {
      console.error('Error updating wishlist', err);
    }
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setPriceRangeValue(500);
    setSelectedBhk([]);
    setPropertyTypes([]);
    setFurnishing([]);
    setMinArea('');
    setMaxArea('');
    setSelectedAmenities([]);
    setPossession('');
    setPgGender('');
    setPgSharing([]);
    setPgWithFood(false);
    setPgWithAc(false);
    setPgWithWifi(false);
    setPgWithLaundry(false);
    setPgSearchQuery('');
    setBuilderFilter('');
    setSortOption('RELEVANCE');
  };

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleBhk = (bhk: string) => {
    setSelectedBhk((prev) =>
      prev.includes(bhk) ? prev.filter((b) => b !== bhk) : [...prev, bhk]
    );
  };

  const togglePgSharing = (sharing: string) => {
    setPgSharing((prev) =>
      prev.includes(sharing) ? prev.filter((s) => s !== sharing) : [...prev, sharing]
    );
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    setSelectedBhk([]);
    setPropertyTypes([]);
    setFurnishing([]);
    setPgGender('');
    setPgSharing([]);
    setPgWithFood(false);
    setPgWithAc(false);
    setPgWithWifi(false);
    setPgWithLaundry(false);
    setPgSearchQuery('');
    setBuilderFilter('');
  }, [purposeParam]);

  // Fetch standard properties from NestJS API with skeleton simulation
  useEffect(() => {
    if (purposeParam === 'PG' || purposeParam === 'NEW_PROJECTS') {
      return;
    }

    const fetchProperties = async () => {
      setApiLoading(true);
      try {
        const params = new URLSearchParams();
        const apiPurpose = purposeParam === 'RENT' ? 'RENT' : 'SELL';
        params.append('purpose', apiPurpose);

        if (queryParam) params.append('q', queryParam);
        if (purposeParam === 'RENT') {
          if (minPrice) params.append('minPrice', minPrice);
          if (maxPrice) params.append('maxPrice', maxPrice);
        } else {
          params.append('maxPrice', String(priceRangeValue * 100000));
        }

        selectedBhk.forEach((b) => {
          let val = '';
          if (b.includes('1')) val = '1';
          else if (b.includes('2')) val = '2';
          else if (b.includes('3')) val = '3';
          else if (b.includes('4')) val = '4';
          if (val) params.append('bhk', val);
        });

        propertyTypes.forEach((t) => {
          let val = '';
          if (t === 'Apartment') val = 'APARTMENT';
          else if (t === 'House/Villa' || t === 'Independent House') val = 'INDEPENDENT_HOUSE';
          else if (t === 'Villa') val = 'VILLA';
          else if (t === 'Plots') val = 'PLOT';
          if (val) params.append('propertyType', val);
        });

        if (minArea) params.append('minArea', minArea);
        if (maxArea) params.append('maxArea', maxArea);
        selectedAmenities.forEach((a) => {
          params.append('amenities', a);
        });
        if (possession) params.append('possession', possession);

        params.append('page', '1');
        params.append('limit', '20');

        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiBase}/api/v1/properties?${params.toString()}`).catch(() => null);
        if (res && res.ok) {
          const json = await res.json().catch(() => null);
          if (json) {
            setApiProperties(json.data?.properties || json.properties || []);
          }
        }
      } catch (err) {
        // Safe fallback
      } finally {
        setTimeout(() => setApiLoading(false), 250);
      }
    };

    fetchProperties();
  }, [purposeParam, queryParam, minPrice, maxPrice, priceRangeValue, selectedBhk, propertyTypes, furnishing, minArea, maxArea, selectedAmenities, possession]);

  const buySellMockListings = [
    {
      id: 'mock-buy-1',
      title: 'Prestige Golfshire Luxury Villa',
      priceNum: 35000000,
      price: '₹3.5 Cr',
      period: '',
      locality: 'Nandi Hills',
      city: 'Bangalore',
      bhk: '4 BHK',
      propertyType: 'House/Villa',
      builtUpArea: '3,850 sqft',
      isZivaVerified: true,
      isFeatured: true,
      img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-2',
      title: 'Sobha City Casa Paradiso',
      priceNum: 18000000,
      price: '₹1.8 Cr',
      period: '',
      locality: 'Hebbal',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,850 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-3',
      title: 'Godrej Palm Retreat Penthouse',
      priceNum: 24500000,
      price: '₹2.45 Cr',
      period: '',
      locality: 'Sector 150',
      city: 'Noida',
      bhk: '4 BHK',
      propertyType: 'Apartment',
      builtUpArea: '2,650 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-4',
      title: 'DLF The Crest Sky Residence',
      priceNum: 48000000,
      price: '₹4.8 Cr',
      period: '',
      locality: 'Golf Course Road, Sector 54',
      city: 'Gurgaon',
      bhk: '4 BHK',
      propertyType: 'Apartment',
      builtUpArea: '3,500 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-5',
      title: 'Hiranandani Gardens Castalia',
      priceNum: 29500000,
      price: '₹2.95 Cr',
      period: '',
      locality: 'Powai',
      city: 'Mumbai',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,120 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-6',
      title: 'Brigade Gateway Premium Condo',
      priceNum: 16500000,
      price: '₹1.65 Cr',
      period: '',
      locality: 'Malleshwaram',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,720 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-7',
      title: 'Lodha World One Sky Duplex',
      priceNum: 75000000,
      price: '₹7.5 Cr',
      period: '',
      locality: 'Lower Parel',
      city: 'Mumbai',
      bhk: '4+ BHK',
      propertyType: 'Apartment',
      builtUpArea: '4,200 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-8',
      title: 'Total Environment Windmills of Your Mind',
      priceNum: 42000000,
      price: '₹4.2 Cr',
      period: '',
      locality: 'Whitefield',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'House/Villa',
      builtUpArea: '2,800 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-9',
      title: 'Puravankara Palm Beach Sunlit Flat',
      priceNum: 9500000,
      price: '₹95 Lakhs',
      period: '',
      locality: 'Hennur Road',
      city: 'Bangalore',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,240 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-buy-10',
      title: 'Emaar Marbella Spanish Villa',
      priceNum: 58000000,
      price: '₹5.8 Cr',
      period: '',
      locality: 'Sector 66, Golf Course Ext',
      city: 'Gurgaon',
      bhk: '4+ BHK',
      propertyType: 'House/Villa',
      builtUpArea: '5,100 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const rentMockListings = [
    {
      id: 'mock-rent-1',
      title: 'Greenwood Executive Villa',
      priceNum: 45000,
      price: '₹45,000',
      period: '/mo',
      locality: 'Koramangala 4th Block',
      city: 'Bangalore',
      bhk: '2 BHK',
      propertyType: 'House/Villa',
      builtUpArea: '1,200 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-2',
      title: 'Prestige Langlee High-Rise',
      priceNum: 65000,
      price: '₹65,000',
      period: '/mo',
      locality: 'HSR Layout Sector 1',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,650 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-3',
      title: 'Indiranagar Designer Studio Apartment',
      priceNum: 28000,
      price: '₹28,000',
      period: '/mo',
      locality: '100 Feet Road, Indiranagar',
      city: 'Bangalore',
      bhk: '1 BHK',
      propertyType: 'Apartment',
      builtUpArea: '650 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-4',
      title: 'Cyber City Elite Sky Flat',
      priceNum: 55000,
      price: '₹55,000',
      period: '/mo',
      locality: 'DLF Phase 2',
      city: 'Gurgaon',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,900 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-5',
      title: 'Sea Breeze Luxury Residence',
      priceNum: 85000,
      price: '₹85,000',
      period: '/mo',
      locality: 'Bandra West, Carter Road',
      city: 'Mumbai',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,100 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-6',
      title: 'Adarsh Palm Retreat Lakeview',
      priceNum: 72000,
      price: '₹72,000',
      period: '/mo',
      locality: 'Bellandur / Outer Ring Road',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '2,100 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-7',
      title: 'Sunny Modern 1 BHK in BTM',
      priceNum: 18500,
      price: '₹18,500',
      period: '/mo',
      locality: 'BTM Layout 2nd Stage',
      city: 'Bangalore',
      bhk: '1 BHK',
      propertyType: 'Apartment',
      builtUpArea: '600 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-8',
      title: 'Salarpuria Sattva Magnificence',
      priceNum: 48000,
      price: '₹48,000',
      period: '/mo',
      locality: 'Bannerghatta Road',
      city: 'Bangalore',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,350 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-9',
      title: 'Emaar Palm Drive Luxury Floor',
      priceNum: 95000,
      price: '₹95,000',
      period: '/mo',
      locality: 'Golf Course Extension',
      city: 'Gurgaon',
      bhk: '4+ BHK',
      propertyType: 'Apartment',
      builtUpArea: '2,750 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-rent-10',
      title: 'Brigade Metropolis Corner Penthouse',
      priceNum: 62000,
      price: '₹62,000',
      period: '/mo',
      locality: 'Mahadevapura / Whitefield',
      city: 'Bangalore',
      bhk: '3 BHK',
      propertyType: 'Apartment',
      builtUpArea: '1,800 sqft',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const pgListings = [
    {
      id: 'pg-1',
      title: 'Stanza Living Kyoto House',
      priceNum: 12500,
      price: '₹12,500',
      period: '/mo onwards',
      locality: 'Koramangala Block 5',
      city: 'Bangalore',
      bhk: 'Double Sharing',
      builtUpArea: 'Meals Included',
      gender: 'Boys',
      isZivaVerified: true,
      amenities: ['Twin Sharing', 'AC', '3 Meals Included', '300 Mbps WiFi'],
      img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-2',
      title: 'Zolo Grace Executive PG for Women',
      priceNum: 18000,
      price: '₹18,000',
      period: '/mo onwards',
      locality: 'HSR Layout Sector 2',
      city: 'Bangalore',
      bhk: 'Single Room',
      builtUpArea: 'Private Balcony',
      gender: 'Girls',
      isZivaVerified: true,
      amenities: ['Private Room', 'AC', 'Biometric Entry', 'High-Speed WiFi'],
      img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-3',
      title: 'Colive 178 Hackensack PG',
      priceNum: 8500,
      price: '₹8,500',
      period: '/mo onwards',
      locality: 'BTM Layout Stage 2',
      city: 'Bangalore',
      bhk: 'Triple+ Sharing',
      builtUpArea: 'Self-Cooking',
      gender: 'Unisex',
      isZivaVerified: true,
      amenities: ['Triple Sharing', 'Self-Cooking Kitchen', 'Laundry Area'],
      img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-4',
      title: 'Istay CoLiving Metro View',
      priceNum: 14000,
      price: '₹14,000',
      period: '/mo onwards',
      locality: 'Indiranagar 12th Main',
      city: 'Bangalore',
      bhk: 'Double Sharing',
      builtUpArea: 'Rooftop Lounge',
      gender: 'Unisex',
      isZivaVerified: true,
      amenities: ['Twin Sharing', 'AC', 'Rooftop Cafe', 'Workstation'],
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-5',
      title: 'Boston Living Tech-Park Hub',
      priceNum: 21000,
      price: '₹21,000',
      period: '/mo onwards',
      locality: 'Cyber City, DLF Phase 3',
      city: 'Gurgaon',
      bhk: 'Single Room',
      builtUpArea: 'Studio Suite',
      gender: 'Unisex',
      isZivaVerified: true,
      amenities: ['Studio Room', 'Chef Buffet', 'Gym & Pool', 'Housekeeping'],
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-6',
      title: 'Zolo Amber Girls Hostel & PG',
      priceNum: 11000,
      price: '₹11,000',
      period: '/mo onwards',
      locality: 'Marathahalli Bridge',
      city: 'Bangalore',
      bhk: 'Double Sharing',
      builtUpArea: 'Meals Included',
      gender: 'Girls',
      isZivaVerified: true,
      amenities: ['Twin Sharing', 'North & South Food', '24/7 Security Guard'],
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-7',
      title: 'Stanza Living Montreal House',
      priceNum: 16500,
      price: '₹16,500',
      period: '/mo onwards',
      locality: 'Whitefield ITPL Main Road',
      city: 'Bangalore',
      bhk: 'Single Room',
      builtUpArea: 'Gym & Game Room',
      gender: 'Boys',
      isZivaVerified: true,
      amenities: ['Single Room', 'AC', 'Gym Access', 'Buffet Meals'],
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-8',
      title: 'YourSpace Premium Luxury PG',
      priceNum: 15500,
      price: '₹15,500',
      period: '/mo onwards',
      locality: 'Sector 62',
      city: 'Noida',
      bhk: 'Double Sharing',
      builtUpArea: 'All Bills Included',
      gender: 'Unisex',
      isZivaVerified: true,
      amenities: ['Twin Sharing', 'AC', 'Meal Plan', 'Study Desks'],
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-9',
      title: 'Settlr Eden Co-Living PG',
      priceNum: 13000,
      price: '₹13,000',
      period: '/mo onwards',
      locality: 'Electronic City Phase 1',
      city: 'Bangalore',
      bhk: 'Double Sharing',
      builtUpArea: 'Work From Home Desks',
      gender: 'Boys',
      isZivaVerified: true,
      amenities: ['Twin Sharing', 'Ergonomic Chairs', '1 Gbps Internet', 'Power Backup'],
      img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pg-10',
      title: 'Tribe Luxury Co-Living & Student Housing',
      priceNum: 22000,
      price: '₹22,000',
      period: '/mo onwards',
      locality: 'Powai Hiranandani',
      city: 'Mumbai',
      bhk: 'Single Room',
      builtUpArea: 'Lakeview Balcony',
      gender: 'Unisex',
      isZivaVerified: true,
      amenities: ['Single Deluxe', 'AC', 'Infinity Lounge', 'Fitness Center'],
      img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const newProjectsListings = [
    {
      id: 'proj-1',
      title: 'Prestige Falcon City',
      priceNum: 12500000,
      price: '₹1.25 Cr onwards',
      locality: 'Kanakapura Road',
      city: 'Bangalore',
      builder: 'Prestige Group',
      bhk: '2, 3, 4 BHK',
      builtUpArea: '41 Acres',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'proj-2',
      title: 'Sobha Dream Acres',
      priceNum: 8500000,
      price: '₹85 L onwards',
      locality: 'Panathur, Whitefield',
      city: 'Bangalore',
      builder: 'Sobha Developers',
      bhk: '1, 2 BHK Apts',
      builtUpArea: '81 Acres',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'proj-3',
      title: 'Godrej Woods Expressway',
      priceNum: 16000000,
      price: '₹1.60 Cr onwards',
      locality: 'Sector 43',
      city: 'Noida',
      builder: 'Godrej Properties',
      bhk: '3, 4 BHK Luxury',
      builtUpArea: '11 Acres Forest Park',
      isZivaVerified: true,
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const getRenderProperties = () => {
    let list: any[] = [];
    if (purposeParam === 'PG') {
      list = [...pgListings];

      // Live PG text search (title, locality, landmark)
      if (pgSearchQuery.trim()) {
        const q = pgSearchQuery.toLowerCase();
        list = list.filter((p) =>
          p.title.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.gender || '').toLowerCase().includes(q)
        );
      }

      // Gender filter (Boys / Girls / Unisex)
      if (pgGender) {
        list = list.filter((p) => {
          if (pgGender === 'Boys') return p.gender === 'Boys';
          if (pgGender === 'Girls') return p.gender === 'Girls';
          if (pgGender === 'Unisex') return p.gender === 'Unisex' || p.gender === 'Unisex / Co-ed';
          return true;
        });
      }

      // Room Occupancy / Sharing filter
      if (pgSharing.length > 0) {
        list = list.filter((p) =>
          pgSharing.some((s) => {
            const normalized = s.toLowerCase().replace('+', '').replace(' sharing', '').trim();
            return (p.bhk || '').toLowerCase().includes(normalized);
          })
        );
      }

      // With Food / Meal plan filter
      if (pgWithFood) {
        list = list.filter((p) =>
          (p.amenities || []).some((a: string) => /food|meal|buffet|dining|cooked/i.test(a)) ||
          /food|meal|buffet/i.test(p.builtUpArea || '')
        );
      }

      // AC Room filter
      if (pgWithAc) {
        list = list.filter((p) =>
          (p.amenities || []).some((a: string) => /ac|air condition/i.test(a))
        );
      }

      // WiFi filter
      if (pgWithWifi) {
        list = list.filter((p) =>
          (p.amenities || []).some((a: string) => /wifi|internet|fiber/i.test(a)) ||
          /wifi|internet/i.test(p.builtUpArea || '')
        );
      }

      // Laundry filter
      if (pgWithLaundry) {
        list = list.filter((p) =>
          (p.amenities || []).some((a: string) => /laundry|washing|laundromat/i.test(a))
        );
      }
    } else if (purposeParam === 'NEW_PROJECTS') {
      list = newProjectsListings.filter((p) => !builderFilter || p.builder === builderFilter);
    } else {
      const baseMock = purposeParam === 'RENT' ? rentMockListings : buySellMockListings;
      const mappedApi = apiProperties.map((p) => {
        const priceVal = (p.purpose === 'RENT' || p.purpose === 'PG') ? (p.monthlyRent || 0) : (p.expectedPrice || 0);
        const priceDisplay = (p.purpose === 'RENT' || p.purpose === 'PG')
          ? `₹ ${Number(priceVal).toLocaleString('en-IN')}`
          : `₹ ${Number(priceVal) >= 10000000
            ? `${(Number(priceVal) / 10000000).toFixed(2)} Cr`
            : `${(Number(priceVal) / 100000).toFixed(0)} Lakhs`}`;

        return {
          id: p.id,
          title: p.title,
          priceNum: priceVal,
          price: priceDisplay,
          period: (p.purpose === 'RENT' || p.purpose === 'PG') ? '/mo' : '',
          locality: p.locality || 'Bangalore',
          city: p.city || 'Bangalore',
          latitude: p.latitude || (p.locality?.includes('Koramangala') ? 12.9352 : p.locality?.includes('Indiranagar') ? 12.9784 : p.locality?.includes('Nandi') ? 13.3702 : p.locality?.includes('Hebbal') ? 13.0358 : 12.9716),
          longitude: p.longitude || (p.locality?.includes('Koramangala') ? 77.6245 : p.locality?.includes('Indiranagar') ? 77.6408 : p.locality?.includes('Nandi') ? 77.6835 : p.locality?.includes('Hebbal') ? 77.5970 : 77.5946),
          propertyType: p.propertyType || 'APARTMENT',
          bhk: p.bhk ? `${p.bhk} BHK` : '2 BHK',
          builtUpArea: p.builtUpArea ? `${Number(p.builtUpArea).toLocaleString()} sqft` : '1,400 sqft',
          isZivaVerified: p.isZivaVerified ?? true,
          isFeatured: !!(p.isFeatured || (p.adminNotes && p.adminNotes.includes('[FEATURED]'))),
          img: p.photos?.[0]?.url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
        };
      });
      list = mappedApi.length > 0 ? mappedApi : baseMock;
    }

    // Filter by selected BHKs
    if (selectedBhk.length > 0) {
      list = list.filter((p) => selectedBhk.some((b) => (p.bhk || '').toLowerCase().includes(b.toLowerCase().replace('+', ''))));
    }

    // Filter by Property Types
    if (propertyTypes.length > 0) {
      list = list.filter((p) => propertyTypes.some((t) =>
        (p.propertyType || '').toLowerCase() === t.toLowerCase().replace(' ', '_') ||
        (p.propertyType || '').toLowerCase().includes(t.toLowerCase()) ||
        p.title.toLowerCase().includes(t.toLowerCase())
      ));
    }

    // Filter by Budget
    if (minPrice) {
      list = list.filter((p) => (p.priceNum || 0) >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter((p) => (p.priceNum || 0) <= Number(maxPrice));
    }

    // Apply sorting with Featured Boost
    if (sortOption === 'PRICE_LOW_HIGH') {
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.priceNum || 0) - (b.priceNum || 0);
      });
    } else if (sortOption === 'PRICE_HIGH_LOW') {
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.priceNum || 0) - (a.priceNum || 0);
      });
    } else {
      // RELEVANCE default: Featured first
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
    }

    return list;
  };

  const getPageTitle = () => {
    if (purposeParam === 'RENT') return 'Properties for Rent';
    if (purposeParam === 'SELL') return 'Properties for Sale';
    if (purposeParam === 'PG') return 'Verified PGs & Hostels';
    if (purposeParam === 'NEW_PROJECTS') return 'Trending Residential Projects';
    return 'Properties for Sale';
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-[Rubik]">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* PG Top Search Header (Matches Design Image 4) */}
        {purposeParam === 'PG' && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#cbc3d8] flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/2 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7487]">search</span>
              <input
                className="w-full pl-12 pr-4 py-3 bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl text-xs text-[#191c1e] focus:ring-2 focus:ring-[#5e23dc] focus:bg-white outline-none transition-all font-medium"
                placeholder="Search PG/Hostels by location, landmark or name..."
                type="text"
                value={pgSearchQuery}
                onChange={(e) => setPgSearchQuery(e.target.value)}
              />
              {pgSearchQuery && (
                <button
                  onClick={() => setPgSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 items-center">
              <button
                onClick={() => setPgGender(prev => prev === 'Boys' ? '' : 'Boys')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  pgGender === 'Boys'
                    ? 'bg-[#5e23dc] text-white border border-[#5e23dc] ring-2 ring-[#5e23dc]/20'
                    : 'bg-white border border-[#cbc3d8] text-[#494455] hover:border-[#5e23dc] hover:text-[#5e23dc]'
                }`}
              >
                {pgGender === 'Boys' && <span className="material-symbols-outlined text-xs">check</span>}
                Boys Only
              </button>

              <button
                onClick={() => setPgGender(prev => prev === 'Girls' ? '' : 'Girls')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  pgGender === 'Girls'
                    ? 'bg-[#5e23dc] text-white border border-[#5e23dc] ring-2 ring-[#5e23dc]/20'
                    : 'bg-white border border-[#cbc3d8] text-[#494455] hover:border-[#5e23dc] hover:text-[#5e23dc]'
                }`}
              >
                {pgGender === 'Girls' && <span className="material-symbols-outlined text-xs">check</span>}
                Girls Only
              </button>

              <button
                onClick={() => setPgWithFood(prev => !prev)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  pgWithFood
                    ? 'bg-[#5e23dc] text-white border border-[#5e23dc] ring-2 ring-[#5e23dc]/20'
                    : 'bg-white border border-[#cbc3d8] text-[#494455] hover:border-[#5e23dc] hover:text-[#5e23dc]'
                }`}
              >
                {pgWithFood && <span className="material-symbols-outlined text-xs">check</span>}
                With Food
              </button>

              <button
                onClick={() => setPgWithAc(prev => !prev)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  pgWithAc
                    ? 'bg-[#5e23dc] text-white border border-[#5e23dc] ring-2 ring-[#5e23dc]/20'
                    : 'bg-white border border-[#cbc3d8] text-[#494455] hover:border-[#5e23dc] hover:text-[#5e23dc]'
                }`}
              >
                {pgWithAc && <span className="material-symbols-outlined text-xs">check</span>}
                AC Room
              </button>

              {(pgGender || pgWithFood || pgWithAc || pgSearchQuery || pgSharing.length > 0) && (
                <button
                  onClick={() => {
                    setPgGender('');
                    setPgWithFood(false);
                    setPgWithAc(false);
                    setPgWithWifi(false);
                    setPgWithLaundry(false);
                    setPgSearchQuery('');
                    setPgSharing([]);
                  }}
                  className="whitespace-nowrap px-3 py-2 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </section>
        )}

        {/* Title & Sorting Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#eceef0] pb-4">
          <div>
            <h1 className="text-[22px] sm:text-[28px] md:text-[32px] leading-tight font-bold text-[#191c1e]">
              {getPageTitle()}
            </h1>
            <p className="text-[13px] sm:text-[14px] leading-[20px] text-[#494455] mt-1">
              Showing 1-{getRenderProperties().length} of {getRenderProperties().length} verified {purposeParam === 'PG' ? 'PGs & Co-Living spaces' : purposeParam === 'RENT' ? 'rental properties' : purposeParam === 'NEW_PROJECTS' ? 'projects' : 'properties'} in Bangalore
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-1.5 bg-[#e8ddff] text-[#4500b4] border border-[#5e23dc]/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>{mobileFilterOpen ? 'Hide Filters' : 'Filter Properties'}</span>
            </button>

            {/* View Mode Toggle: Grid vs Map */}
            <div className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('GRID')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'GRID' ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-[#494455] hover:text-[#191c1e]'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
                Grid
              </button>
              <button
                onClick={() => setViewMode('MAP')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'MAP' ? 'bg-[#5e23dc] text-white shadow-sm' : 'text-[#494455] hover:text-[#191c1e]'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">map</span>
                Map
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#494455] hidden xs:inline">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white border border-[#cbc3d8] rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="RELEVANCE">Relevance</option>
                <option value="PRICE_LOW_HIGH">Price: Low-High</option>
                <option value="PRICE_HIGH_LOW">Price: High-Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-16">
          {/* Left Sidebar Filters */}
          <aside className={`md:col-span-3 ${mobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#cbc3d8] space-y-6 sticky top-24">
              <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
                <h2 className="text-[18px] leading-[26px] font-bold text-[#191c1e]">Filters</h2>
                <button onClick={handleReset} className="text-xs font-bold text-[#5e23dc] hover:underline">
                  Clear All
                </button>
              </div>

              {purposeParam === 'PG' ? (
                <>
                  {/* Tenant Type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#7a7487] uppercase tracking-wide">Tenant Type</label>
                    <div className="space-y-2 text-xs text-[#191c1e]">
                      {[
                        { label: 'All', value: '' },
                        { label: 'Boys Only', value: 'Boys' },
                        { label: 'Girls Only', value: 'Girls' },
                        { label: 'Unisex / Co-ed', value: 'Unisex' }
                      ].map((tenant) => (
                        <label key={tenant.label} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="tenantType"
                            checked={pgGender === tenant.value}
                            onChange={() => setPgGender(tenant.value)}
                            className="text-[#5e23dc] focus:ring-[#5e23dc]"
                          />
                          <span className={`font-semibold ${pgGender === tenant.value ? 'text-[#5e23dc] font-bold' : ''}`}>
                            {tenant.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Room Occupancy */}
                  <div className="space-y-2 border-t border-[#eceef0] pt-4">
                    <label className="block text-xs font-bold text-[#7a7487] uppercase tracking-wide">Room Occupancy</label>
                    <div className="space-y-2 text-xs text-[#191c1e]">
                      {['Single Room', 'Double Sharing', 'Triple+ Sharing'].map((occ) => (
                        <label key={occ} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pgSharing.includes(occ)}
                            onChange={() => togglePgSharing(occ)}
                            className="rounded border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                          />
                          <span className={pgSharing.includes(occ) ? 'font-bold text-[#5e23dc]' : 'font-semibold'}>
                            {occ}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Key Amenities Grid */}
                  <div className="space-y-2 border-t border-[#eceef0] pt-4">
                    <label className="block text-xs font-bold text-[#7a7487] uppercase tracking-wide">Key Amenities</label>
                    <div className="grid grid-cols-2 gap-2 text-xs text-[#191c1e]">
                      {[
                        { icon: 'ac_unit', label: 'AC', active: pgWithAc, toggle: () => setPgWithAc(prev => !prev) },
                        { icon: 'restaurant', label: 'Food', active: pgWithFood, toggle: () => setPgWithFood(prev => !prev) },
                        { icon: 'wifi', label: 'WiFi', active: pgWithWifi, toggle: () => setPgWithWifi(prev => !prev) },
                        { icon: 'local_laundry_service', label: 'Laundry', active: pgWithLaundry, toggle: () => setPgWithLaundry(prev => !prev) },
                      ].map((item) => (
                        <label
                          key={item.label}
                          onClick={item.toggle}
                          className={`flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all ${
                            item.active
                              ? 'bg-[#e8ddff] border-[#5e23dc] text-[#4500b4] font-bold shadow-sm'
                              : 'bg-[#f2f4f6] border-[#cbc3d8]/40 hover:bg-[#e8ddff]/40 text-[#494455]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={() => {}}
                            className="rounded border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                          />
                          <span className="material-symbols-outlined text-sm">{item.icon}</span>
                          <span className="text-[11px]">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Property Type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">Property Type</label>
                    <div className="space-y-2 text-xs text-[#494455]">
                      {['Apartment', 'House/Villa', 'Plots'].map((type) => (
                        <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={propertyTypes.includes(type)}
                            onChange={() => togglePropertyType(type)}
                            className="rounded border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* BHK Configuration Pills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">BHK Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['1', '2', '3', '4+'].map((bhk) => {
                        const active = selectedBhk.includes(bhk);
                        return (
                          <button
                            key={bhk}
                            onClick={() => toggleBhk(bhk)}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all border ${active
                              ? 'bg-[#5e23dc] text-white border-[#5e23dc]'
                              : 'bg-[#f2f4f6] text-[#494455] border-[#cbc3d8] hover:border-[#5e23dc]'
                              }`}
                          >
                            {bhk}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Budget Range */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">Budget</label>
                {purposeParam === 'RENT' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="range"
                      min="80"
                      max="500"
                      value={priceRangeValue}
                      onChange={(e) => setPriceRangeValue(Number(e.target.value))}
                      className="w-full accent-[#5e23dc]"
                    />
                    <div className="flex justify-between text-[10px] text-[#7a7487] font-bold mt-1">
                      <span>₹80L</span>
                      <span>₹{(priceRangeValue / 100).toFixed(1)}Cr</span>
                      <span>₹5Cr</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Built-Up Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">Area (sq.ft.)</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="number"
                    placeholder="Min Area"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                    className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none w-full"
                  />
                  <input
                    type="number"
                    placeholder="Max Area"
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                    className="bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 outline-none w-full"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">Amenities</label>
                <div className="space-y-2 text-xs text-[#494455]">
                  {['Power Backup', 'Lift', 'Gym', 'Parking', 'Security', 'Club House'].map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Possession Status */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#191c1e] uppercase tracking-wide">Possession Status</label>
                <div className="space-y-2 text-xs text-[#494455]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="possession"
                      checked={possession === 'READY_TO_MOVE'}
                      onChange={() => setPossession('READY_TO_MOVE')}
                      className="border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                    />
                    <span>Ready to Move</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="possession"
                      checked={possession === 'UNDER_CONSTRUCTION'}
                      onChange={() => setPossession('UNDER_CONSTRUCTION')}
                      className="border-[#cbc3d8] text-[#5e23dc] focus:ring-[#5e23dc]"
                    />
                    <span>Under Construction</span>
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-[#eceef0]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileFilterOpen(false);
                  }}
                  className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Apply Filters ({getRenderProperties().length} Results)
                </button>
              </div>
            </div>
          </aside>

          {/* Property Cards Grid with Skeleton Loader */}
          <div className="md:col-span-9 space-y-6">
            {apiLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-[#cbc3d8] shadow-sm flex flex-col justify-between">
                    <div className="relative h-48 w-full bg-[#e6e8ea] shimmer-gradient">
                      <div className="absolute top-3 left-3 h-5 w-20 bg-white/70 rounded-md shimmer-gradient" />
                      <div className="absolute top-3 right-3 h-8 w-8 bg-white/70 rounded-full shimmer-gradient" />
                    </div>
                    <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-6 w-28 bg-[#e6e8ea] rounded-lg shimmer-gradient" />
                          <div className="h-4 w-16 bg-[#eceef0] rounded shimmer-gradient" />
                        </div>
                        <div className="h-5 w-4/5 bg-[#e6e8ea] rounded-lg shimmer-gradient" />
                        <div className="h-4 w-1/2 bg-[#eceef0] rounded shimmer-gradient" />
                      </div>

                      {/* Specs Row Skeleton */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#eceef0]">
                        <div className="h-4 bg-[#f2f4f6] rounded shimmer-gradient" />
                        <div className="h-4 bg-[#f2f4f6] rounded shimmer-gradient" />
                        <div className="h-4 bg-[#f2f4f6] rounded shimmer-gradient" />
                      </div>

                      {/* Button Action Skeleton */}
                      <div className="flex gap-2 pt-1">
                        <div className="h-9 flex-1 bg-[#e6e8ea] rounded-xl shimmer-gradient" />
                        <div className="h-9 w-12 bg-[#eceef0] rounded-xl shimmer-gradient" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'MAP' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
                {/* Left Column: Property List (5 cols) */}
                <div className="lg:col-span-5 overflow-y-auto space-y-4 pr-1 max-h-[650px]">
                  {getRenderProperties().map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => {
                        handleSelectMapProperty(prop);
                        if (prop.id.startsWith('proj-')) {
                          router.push('/projects/p-prestige-falcon');
                        } else {
                          router.push(`/properties/${prop.id}`);
                        }
                      }}
                      className={`bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer group flex gap-3 p-3 shadow-sm hover:shadow-md ${
                        selectedMapPinId === prop.id
                          ? 'border-[#5e23dc] ring-2 ring-[#5e23dc]/20 bg-[#f5f1fd]/30'
                          : 'border-[#cbc3d8] hover:border-[#5e23dc]'
                      }`}
                    >
                      <div className="w-28 h-24 rounded-xl overflow-hidden bg-[#f2f4f6] shrink-0 relative">
                        <img src={prop.img} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {prop.isFeatured && (
                          <span className="absolute top-1 right-1 bg-amber-400 text-amber-950 text-[7px] font-black px-1 py-0.5 rounded shadow z-10">
                            ⭐ FEATURED
                          </span>
                        )}
                        {prop.isZivaVerified && (
                          <span className="absolute top-1 left-1 bg-[#e8faf4] text-[#16a373] text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div>
                          <div className="text-sm font-bold text-[#191c1e] truncate group-hover:text-[#4500b4] transition-colors">{prop.title}</div>
                          <p className="text-[10px] text-[#7a7487] truncate flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {prop.locality}, {prop.city}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-[#eceef0]">
                          <span className="text-[#006c47]">{prop.price}</span>
                          <span className="text-[10px] text-[#7a7487]">{prop.bhk}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Live OpenStreetMap with Interactive Pins */}
                {(() => {
                  const deltaLng = (360 / Math.pow(2, mapZoom)) * 0.45;
                  const deltaLat = deltaLng * 0.65;
                  const minLng = (mapCenter.lng - deltaLng).toFixed(5);
                  const maxLng = (mapCenter.lng + deltaLng).toFixed(5);
                  const minLat = (mapCenter.lat - deltaLat).toFixed(5);
                  const maxLat = (mapCenter.lat + deltaLat).toFixed(5);
                  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik${
                    userLocationMarker ? `&marker=${userLocationMarker.lat}%2C${userLocationMarker.lng}` : ''
                  }`;

                  return (
                    <div className="lg:col-span-7 bg-[#e8eaf6] rounded-2xl overflow-hidden border border-[#cbc3d8] relative shadow-inner flex flex-col min-h-[500px]">
                      <iframe
                        key={`${mapCenter.lat}-${mapCenter.lng}-${mapZoom}-${userLocationMarker?.lat || ''}`}
                        title="Live Discovery Map"
                        src={mapEmbedUrl}
                        className="w-full h-[calc(100%+38px)] border-none absolute inset-0 pointer-events-auto"
                        loading="lazy"
                      />

                      {/* Toast Notification */}
                      {mapToast && (
                        <div className="absolute top-4 left-4 right-18 z-30 pointer-events-none">
                          <div className="bg-[#191c1e]/95 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xl inline-flex items-center gap-2 border border-white/10">
                            <span>{mapToast}</span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Property Pins Overlay on Map */}
                      <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between z-10">
                        <div className="flex flex-wrap gap-2 pointer-events-auto max-w-full">
                          {getRenderProperties().slice(0, 6).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectMapProperty(p)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all flex items-center gap-1 cursor-pointer ${
                                selectedMapPinId === p.id
                                  ? 'bg-[#191c1e] text-white ring-2 ring-white scale-105'
                                  : 'bg-[#5e23dc] text-white hover:bg-[#4500b4]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              <span>{p.price} • {p.locality}</span>
                            </button>
                          ))}
                        </div>

                        <div className="self-end bg-white/95 backdrop-blur-md border border-[#cbc3d8] px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-[#191c1e] shadow-md pointer-events-auto flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#16a373] animate-ping" />
                          <span>{getRenderProperties().length} Live Properties Mapped</span>
                        </div>
                      </div>

                      {/* Map Control Overlay (+, -, GPS) */}
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-lg flex flex-col gap-1.5 border border-[#cbc3d8] pointer-events-auto z-20">
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          title="Zoom in (+)"
                          className="w-8 h-8 rounded-lg hover:bg-[#ede9fe] text-[#191c1e] hover:text-[#5e23dc] flex items-center justify-center transition active:scale-90 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base font-bold">add</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          title="Zoom out (-)"
                          className="w-8 h-8 rounded-lg hover:bg-[#ede9fe] text-[#191c1e] hover:text-[#5e23dc] flex items-center justify-center transition active:scale-90 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base font-bold">remove</span>
                        </button>
                        <div className="h-px bg-[#eceef0] my-0.5" />
                        <button
                          type="button"
                          onClick={handleGpsLocate}
                          title="Locate me (GPS)"
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-90 cursor-pointer ${
                            isLocating
                              ? 'bg-[#5e23dc] text-white animate-pulse'
                              : 'hover:bg-[#ede9fe] text-[#5e23dc]'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-base ${isLocating ? 'animate-spin' : ''}`}>
                            {isLocating ? 'progress_activity' : 'gps_fixed'}
                          </span>
                        </button>
                      </div>

                      {/* Bottom Map Info Footer */}
                      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-[#cbc3d8] flex justify-between items-center pointer-events-auto z-10">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#5e23dc]">map</span>
                          <span className="text-xs font-bold text-[#191c1e]">OpenStreetMap Area View</span>
                          <span className="text-[10px] bg-[#f2f4f6] text-[#494455] px-2 py-0.5 rounded-full font-semibold">
                            Zoom {mapZoom}x
                          </span>
                        </div>
                        <span className="text-[10px] text-[#7a7487] font-semibold">{getRenderProperties().length} Pins Loaded</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                {getRenderProperties().map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => {
                      if (prop.id.startsWith('proj-')) {
                        router.push('/projects/p-prestige-falcon');
                      } else {
                        router.push(`/properties/${prop.id}`);
                      }
                    }}
                    className="bg-white rounded-2xl overflow-hidden border border-[#cbc3d8] hover:border-[#5e23dc] shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Container with Badges */}
                      <div className="h-56 relative overflow-hidden bg-[#f2f4f6]">
                        <img
                          src={prop.img}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Featured Deal Gold Badge */}
                        {prop.isFeatured && (
                          <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider z-10">
                            <span className="material-symbols-outlined text-xs">star</span>
                            Featured Deal
                          </span>
                        )}
                        {/* Gender Tag for PG */}
                        {prop.gender && (
                          <div className={`absolute ${prop.isFeatured ? 'top-10' : 'top-3'} left-3 flex flex-col gap-1`}>
                            <span className="bg-white text-[#5e23dc] font-bold text-[11px] px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                {prop.gender === 'Boys' ? 'male' : prop.gender === 'Girls' ? 'female' : 'wc'}
                              </span>
                              {prop.gender}
                            </span>
                          </div>
                        )}
                        {/* Ziva Verified Mint Badge */}
                        {prop.isZivaVerified && (
                          <span className="absolute bottom-3 left-3 bg-[#E8FAF4] text-[#16A373] border border-[#16A373]/30 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Ziva Verified
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleSaveProperty(prop, e)}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-all z-10 hover:scale-110 ${
                            savedIds.includes(prop.id) ? 'text-[#ba1a1a]' : 'text-[#7a7487] hover:text-[#ba1a1a]'
                          }`}
                          title={savedIds.includes(prop.id) ? 'Remove from Saved' : 'Save Property'}
                        >
                          <span className={`material-symbols-outlined text-sm ${savedIds.includes(prop.id) ? 'font-fill text-red-500' : ''}`}>
                            favorite
                          </span>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-[16px] text-[#191c1e] group-hover:text-[#4500b4] transition-colors line-clamp-1">
                            {prop.title}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="text-[18px] font-bold text-[#5e23dc] leading-tight block">
                              {prop.price}
                            </span>
                            <span className="text-[10px] text-[#7a7487] font-semibold">{prop.period || '/mo'}</span>
                          </div>
                        </div>

                        <p className="text-[12px] text-[#7a7487] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-[#7a7487]">location_on</span>
                          {prop.locality}, {prop.city}
                        </p>

                        {/* Amenities Chips for PG */}
                        {prop.amenities && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {prop.amenities.map((am: string, idx: number) => (
                              <span key={idx} className="bg-[#f2f4f6] text-[#494455] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#cbc3d8]/40 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">
                                  {am.includes('AC') ? 'ac_unit' : am.includes('Meals') || am.includes('Food') ? 'restaurant' : am.includes('Single') || am.includes('Twin') || am.includes('Triple') ? 'bed' : 'check'}
                                </span>
                                {am}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="p-4 pt-0 border-t border-[#eceef0] bg-white flex gap-3 mt-2">
                      <button className="flex-1 bg-white border-2 border-[#5e23dc] text-[#5e23dc] hover:bg-[#e8ddff] font-bold text-xs py-2 rounded-xl transition-colors">
                        Details
                      </button>
                      <button className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-xs py-2 rounded-xl transition-colors shadow-sm">
                        {purposeParam === 'PG' ? 'Schedule Visit' : 'Contact Owner'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function PropertiesSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">Loading properties...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
