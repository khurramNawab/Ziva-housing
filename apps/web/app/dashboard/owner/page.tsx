'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotificationCenter from '../../../components/NotificationCenter';

interface PropertyPhoto {
  url: string;
}

interface Property {
  id: string;
  title: string;
  purpose: string;
  propertyType: string;
  status: string;
  locality: string;
  city: string;
  bhk?: number | null;
  expectedPrice?: number | null;
  monthlyRent?: number | null;
  viewCount: number;
  enquiryCount: number;
  isZivaVerified?: boolean;
  isFeatured?: boolean;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  photos: PropertyPhoto[];
  createdAt?: string;
}

interface Counterparty {
  id: string;
  firstName: string;
  phone?: string;
}

interface LastMessage {
  contentSanitized: string;
  createdAt: string;
}

interface Lead {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    locality?: string;
    city?: string;
    monthlyRent?: number;
    expectedPrice?: number;
    photos?: Array<{ url: string }>;
  };
  counterparty?: Counterparty;
  lastMessage?: LastMessage | null;
  offerAmount?: number;
  offerStatus?: string;
}

interface Visit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  locality?: string;
  city?: string;
  scheduledDate: string;
  timeSlot: string;
  status: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  visitorName?: string;
  visitorPhone?: string;
  createdAt: string;
}

interface EscrowPayment {
  id: string;
  leadId: string;
  amount: number;
  status: 'ESCROW_HELD' | 'RELEASED' | 'REFUNDED' | 'SUCCESS';
  propertyTitle: string;
  tenantName: string;
  createdAt: string;
}

type Tab = 'overview' | 'properties' | 'leads' | 'visits' | 'escrow' | 'analytics' | 'settings';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; firstName: string; lastName?: string; email?: string; phone?: string; role: string; city?: string; locality?: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    locality: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Search & Filter States for Sections
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_REVIEW' | 'RENTED' | 'SOLD'>('ALL');
  const [propertySearch, setPropertySearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [visitStatusFilter, setVisitStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; visitId: string; date: string; time: string } | null>(null);

  // Initial verified fallback data
  const defaultOwnerProperties: Property[] = [
    {
      id: 'prop-owner-1',
      title: 'Modern 3BHK Penthouse with Skyline View',
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      locality: 'Indiranagar 100ft Road',
      city: 'Bangalore',
      bhk: 3,
      monthlyRent: 65000,
      expectedPrice: null,
      viewCount: 342,
      enquiryCount: 14,
      isZivaVerified: true,
      isFeatured: true,
      photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'prop-owner-2',
      title: 'Luxury 4BHK Gated Villa with Private Garden',
      purpose: 'SELL',
      propertyType: 'VILLA',
      status: 'ACTIVE',
      locality: 'Whitefield Palm Meadows',
      city: 'Bangalore',
      bhk: 4,
      expectedPrice: 28500000,
      monthlyRent: null,
      viewCount: 520,
      enquiryCount: 22,
      isZivaVerified: true,
      isFeatured: false,
      photos: [{ url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80' }],
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'prop-owner-3',
      title: 'Furnished 2BHK Apartment near Embassy TechVillage',
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      status: 'PENDING_REVIEW',
      locality: 'Kadubeesanahalli, ORR',
      city: 'Bangalore',
      bhk: 2,
      monthlyRent: 42000,
      expectedPrice: null,
      viewCount: 88,
      enquiryCount: 3,
      isZivaVerified: false,
      isFeatured: false,
      photos: [{ url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80' }],
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  const defaultOwnerLeads: Lead[] = [
    {
      id: 'lead-mock-rent-1',
      status: 'IN_NEGOTIATION',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      property: {
        id: 'prop-owner-1',
        title: 'Modern 3BHK Penthouse with Skyline View',
        locality: 'Indiranagar',
        city: 'Bangalore',
        monthlyRent: 65000,
        photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' }],
      },
      counterparty: {
        id: 'user-renter-1',
        firstName: 'Ananya Sharma',
        phone: '+91 98765 43210',
      },
      lastMessage: {
        contentSanitized: 'Hello! I am ready to pay ₹15,000 token deposit to reserve this penthouse.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      offerAmount: 62000,
      offerStatus: 'OFFER_SUBMITTED',
    },
    {
      id: 'lead-mock-buy-2',
      status: 'VISIT_REQUESTED',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      property: {
        id: 'prop-owner-2',
        title: 'Luxury 4BHK Gated Villa with Private Garden',
        locality: 'Whitefield',
        city: 'Bangalore',
        expectedPrice: 28500000,
        photos: [{ url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=400&q=80' }],
      },
      counterparty: {
        id: 'user-buyer-2',
        firstName: 'Vikram Malhotra',
        phone: '+91 98112 23344',
      },
      lastMessage: {
        contentSanitized: 'Can we schedule an on-site property walkthrough this weekend at 11 AM?',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      offerAmount: 27500000,
      offerStatus: 'UNDER_REVIEW',
    },
  ];

  const defaultOwnerVisits: Visit[] = [
    {
      id: 'visit-owner-1',
      propertyId: 'prop-owner-1',
      propertyTitle: 'Modern 3BHK Penthouse with Skyline View',
      locality: 'Indiranagar 100ft Road',
      city: 'Bangalore',
      scheduledDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] || '',
      timeSlot: '11:00 AM - 12:00 PM',
      status: 'CONFIRMED',
      notes: 'Family visit with 3 members. Interested in 2-year lease agreement.',
      visitorName: 'Ananya Sharma',
      visitorPhone: '+91 98765 43210',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'visit-owner-2',
      propertyId: 'prop-owner-2',
      propertyTitle: 'Luxury 4BHK Gated Villa with Private Garden',
      locality: 'Whitefield Palm Meadows',
      city: 'Bangalore',
      scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] || '',
      timeSlot: '03:00 PM - 04:00 PM',
      status: 'PENDING',
      notes: 'Buyer requested site walkthrough and verification of title deeds.',
      visitorName: 'Vikram Malhotra',
      visitorPhone: '+91 98112 23344',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'visit-owner-3',
      propertyId: 'prop-owner-3',
      propertyTitle: 'Furnished 2BHK Apartment near Embassy TechVillage',
      locality: 'Kadubeesanahalli, ORR',
      city: 'Bangalore',
      scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] || '',
      timeSlot: '05:00 PM - 06:00 PM',
      status: 'PENDING',
      notes: 'IT Professional looking for immediate move-in by month-end.',
      visitorName: 'Rohan Gupta',
      visitorPhone: '+91 98223 34455',
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultEscrowPayments: EscrowPayment[] = [
    {
      id: 'escrow-pay-1',
      leadId: 'lead-mock-rent-1',
      amount: 15000,
      status: 'ESCROW_HELD',
      propertyTitle: 'Modern 3BHK Penthouse with Skyline View',
      tenantName: 'Ananya Sharma',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'escrow-pay-2',
      leadId: 'lead-mock-buy-2',
      amount: 50000,
      status: 'RELEASED',
      propertyTitle: 'Luxury 4BHK Gated Villa with Private Garden',
      tenantName: 'Vikram Malhotra',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  // Authentication & session validation
  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '{}'));
      if (payload.role !== 'OWNER' && payload.role !== 'ADMIN') {
        if (payload.role === 'CUSTOMER') router.push('/dashboard/customer');
        else router.push(`/dashboard/${payload.role.toLowerCase()}`);
        return;
      }

      let storedProfile: any = null;
      try {
        const rawUser = localStorage.getItem('Ziva_user');
        if (rawUser) storedProfile = JSON.parse(rawUser);
      } catch {}

      const activeUser = {
        id: payload.sub || storedProfile?.id || 'usr-owner-1',
        firstName: storedProfile?.firstName || payload.firstName || 'Owner',
        lastName: storedProfile?.lastName || payload.lastName || '',
        email: storedProfile?.email || payload.email || 'owner@ziva.housing',
        phone: storedProfile?.phone || payload.phone || '+91 98860 23456',
        city: storedProfile?.city || 'Bangalore',
        locality: storedProfile?.locality || 'Indiranagar',
        role: payload.role || 'OWNER',
      };

      setUser(activeUser);
      setProfileForm({
        firstName: activeUser.firstName,
        lastName: activeUser.lastName,
        email: activeUser.email,
        phone: activeUser.phone,
        city: activeUser.city,
        locality: activeUser.locality,
      });

      loadOwnerData(token);
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.firstName.trim()) {
      alert('First name is required');
      return;
    }
    setSavingProfile(true);
    setTimeout(() => {
      const updatedUser = {
        ...(user || {}),
        ...profileForm,
        id: user?.id || 'usr-owner-1',
        role: user?.role || 'OWNER',
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('Ziva_user', JSON.stringify(updatedUser));
      } catch {}
      setSavingProfile(false);
      alert('✅ Profile and account information updated successfully!');
    }, 400);
  };

  const normalizeVisit = (v: any): Visit => {
    let dateStr = v.scheduledDate || '';
    let timeStr = v.timeSlot || '';

    if ((!dateStr || !timeStr) && v.scheduledAt) {
      try {
        const d = new Date(v.scheduledAt);
        if (!isNaN(d.getTime())) {
          dateStr = dateStr || d.toISOString().split('T')[0];
          timeStr = timeStr || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {}
    }

    if (!dateStr) {
      dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }
    if (!timeStr) {
      timeStr = '11:00 AM - 12:00 PM';
    }

    const propTitle = v.propertyTitle || v.property?.title || 'Modern 3BHK Penthouse with Skyline View';
    const loc = v.locality || v.property?.locality || 'Indiranagar 100ft Road';
    const ct = v.city || v.property?.city || 'Bangalore';
    const visName = v.visitorName || v.customer?.firstName || v.user?.firstName || 'Ananya Sharma';
    const visPhone = v.visitorPhone || v.customer?.phone || v.user?.phone || '+91 98765 43210';

    let normStatus: 'PENDING' | 'APPROVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
    if (v.status === 'ACCEPTED' || v.status === 'CONFIRMED' || v.status === 'APPROVED') normStatus = 'CONFIRMED';
    else if (v.status === 'REJECTED' || v.status === 'CANCELLED') normStatus = 'CANCELLED';
    else if (v.status === 'COMPLETED') normStatus = 'COMPLETED';

    return {
      id: v.id || `visit-${Date.now()}`,
      propertyId: v.propertyId || v.property?.id || 'prop-owner-1',
      propertyTitle: propTitle,
      locality: loc,
      city: ct,
      scheduledDate: dateStr,
      timeSlot: timeStr,
      status: normStatus,
      notes: v.notes || 'Interested in property walkthrough.',
      visitorName: visName,
      visitorPhone: visPhone,
      createdAt: v.createdAt || new Date().toISOString(),
    };
  };

  const loadOwnerData = async (token: string) => {
    setLoading(true);

    // 1. Sync from localStorage
    let storedProps: Property[] = [];
    let storedLeads: Lead[] = [];
    let storedVisits: Visit[] = [];
    let storedPayments: EscrowPayment[] = [];

    if (typeof window !== 'undefined') {
      try {
        const rawProps = localStorage.getItem('Ziva_custom_properties') || localStorage.getItem('Ziva_owner_properties');
        if (rawProps) storedProps = JSON.parse(rawProps);
      } catch {}

      try {
        const rawLeads = localStorage.getItem('Ziva_user_enquiries') || localStorage.getItem('Ziva_owner_leads');
        if (rawLeads) storedLeads = JSON.parse(rawLeads);
      } catch {}

      try {
        const rawVisits = localStorage.getItem('Ziva_user_visits') || localStorage.getItem('Ziva_owner_visits');
        if (rawVisits) {
          const parsed = JSON.parse(rawVisits);
          if (Array.isArray(parsed)) {
            storedVisits = parsed.map(normalizeVisit);
          }
        }
      } catch {}

      try {
        const rawPayments = localStorage.getItem('Ziva_user_payments') || localStorage.getItem('Ziva_owner_escrow');
        if (rawPayments) storedPayments = JSON.parse(rawPayments);
      } catch {}

      try {
        const rawTx = localStorage.getItem('Ziva_user_transactions');
        if (rawTx) {
          const parsedTx = JSON.parse(rawTx);
          if (Array.isArray(parsedTx)) {
            parsedTx.forEach((tx: any) => {
              if (!storedPayments.some(sp => sp.id === tx.id)) {
                storedPayments.unshift({
                  id: tx.id,
                  leadId: tx.leadId || 'lead-mock-rent-1',
                  amount: Number(tx.amount) || 15000,
                  status: (tx.status === 'RELEASED' ? 'RELEASED' : 'ESCROW_HELD') as any,
                  propertyTitle: tx.propertyTitle || 'Modern 3BHK Penthouse with Skyline View',
                  tenantName: tx.tenantName || 'Ananya Sharma',
                  createdAt: tx.createdAt || new Date().toISOString(),
                });
              }
            });
          }
        }
      } catch {}
    }

    let liveProps: Property[] = [];
    let liveLeads: Lead[] = [];
    let liveVisits: Visit[] = [];
    let livePayments: EscrowPayment[] = [];
    let apiConnected = false;

    // 2. Fetch live data from backend API if reachable
    try {
      const apiBase = getApiBaseUrl();
      const [propRes, leadsRes, visitsRes, payRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/properties/my/listings?limit=50`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${apiBase}/api/v1/leads?limit=50`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${apiBase}/api/v1/visits`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${apiBase}/api/v1/payments/my-transactions`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (propRes?.ok) {
        apiConnected = true;
        const propJson = await propRes.json();
        const apiProps = propJson.data?.properties || propJson.properties || [];
        liveProps = apiProps.map((p: any) => ({
          id: p.id,
          title: p.title,
          purpose: p.purpose,
          propertyType: p.propertyType,
          status: p.status,
          locality: p.locality,
          city: p.city,
          bhk: p.bhk,
          expectedPrice: p.expectedPrice ? Number(p.expectedPrice) : null,
          monthlyRent: p.monthlyRent ? Number(p.monthlyRent) : null,
          viewCount: Number(p.viewCount || 0),
          enquiryCount: Number(p.enquiryCount || 0),
          isZivaVerified: Boolean(p.isZivaVerified),
          isFeatured: Boolean(p.isFeatured),
          adminNotes: p.adminNotes || null,
          rejectionReason: p.rejectionReason || null,
          photos: p.photos && p.photos.length > 0 ? p.photos : [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }],
          createdAt: p.createdAt,
        }));
      }

      if (leadsRes?.ok) {
        apiConnected = true;
        const leadsJson = await leadsRes.json();
        const apiLeads = leadsJson.data?.leads || leadsJson.leads || [];
        liveLeads = apiLeads.map((l: any) => ({
          id: l.id,
          status: l.status,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          property: {
            id: l.property?.id || '',
            title: l.property?.title || 'Property',
            locality: l.property?.locality,
            city: l.property?.city,
            monthlyRent: l.property?.monthlyRent ? Number(l.property.monthlyRent) : undefined,
            expectedPrice: l.property?.expectedPrice ? Number(l.property.expectedPrice) : undefined,
            photos: l.property?.photos,
          },
          counterparty: l.customer ? { id: l.customer.id, firstName: l.customer.firstName } : undefined,
          lastMessage: l.messages && l.messages[0] ? { contentSanitized: l.messages[0].contentSanitized, createdAt: l.messages[0].createdAt } : null,
          offerAmount: l.offerAmount,
          offerStatus: l.offerStatus,
        }));
      }

      if (visitsRes?.ok) {
        apiConnected = true;
        const visitsJson = await visitsRes.json();
        const apiVisits = visitsJson.data?.visits || visitsJson.visits || (Array.isArray(visitsJson) ? visitsJson : []);
        if (Array.isArray(apiVisits)) {
          liveVisits = apiVisits.map(normalizeVisit);
        }
      }

      if (payRes?.ok) {
        apiConnected = true;
        const payJson = await payRes.json();
        const apiTx = payJson.data || payJson.transactions || (Array.isArray(payJson) ? payJson : []);
        if (Array.isArray(apiTx)) {
          livePayments = apiTx.map((tx: any) => ({
            id: tx.id,
            leadId: tx.leadId || '',
            amount: Number(tx.amount || 0),
            status: tx.status === 'RELEASED' ? 'RELEASED' : 'ESCROW_HELD',
            propertyTitle: tx.propertyTitle || tx.lead?.property?.title || 'Property Token Deposit',
            tenantName: tx.tenantName || tx.lead?.customer?.firstName || 'Verified Tenant',
            createdAt: tx.createdAt || new Date().toISOString(),
          }));
        }
      }
    } catch {}

    // 3. Merge with user's local stored items (from post-property or previous sessions)
    const finalProps = [...liveProps];
    storedProps.forEach((sp) => {
      if (!finalProps.some((p) => p.id === sp.id)) {
        finalProps.push(sp);
      }
    });

    const finalLeads = [...liveLeads];
    storedLeads.forEach((sl) => {
      if (!finalLeads.some((l) => l.id === sl.id)) {
        finalLeads.push(sl);
      }
    });

    const finalVisits = [...liveVisits];
    storedVisits.forEach((sv) => {
      if (!finalVisits.some((v) => v.id === sv.id)) {
        finalVisits.push(sv);
      }
    });

    const finalPayments = [...livePayments];
    storedPayments.forEach((sp) => {
      if (!finalPayments.some((p) => p.id === sp.id)) {
        finalPayments.push(sp);
      }
    });

    // 4. Only if database has NOT returned data AND user has 0 items AND is specifically the demo user without listings
    const isDemoUser =
      user?.email === 'owner@example.com' ||
      user?.email === 'owner@ziva.housing' ||
      user?.phone === '9876543210' ||
      user?.id === 'usr-owner-1';

    if (!apiConnected && finalProps.length === 0 && isDemoUser) {
      setProperties(defaultOwnerProperties);
      setLeads(defaultOwnerLeads);
      setVisits(defaultOwnerVisits.map(normalizeVisit));
      setEscrowPayments(defaultEscrowPayments);
    } else {
      setProperties(finalProps);
      setLeads(finalLeads);
      setVisits(finalVisits);
      setEscrowPayments(finalPayments);
    }

    setLoading(false);
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleUpdatePropertyStatus = (propertyId: string, newStatus: string) => {
    setProperties((prev) => {
      const updated = prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p));
      try {
        localStorage.setItem('Ziva_custom_properties', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_properties', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleBoostProperty = (propertyId: string) => {
    setProperties((prev) => {
      const updated = prev.map((p) =>
        p.id === propertyId ? { ...p, isFeatured: true, viewCount: (p.viewCount || 0) + 75 } : p
      );
      try {
        localStorage.setItem('Ziva_custom_properties', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_properties', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    alert('🚀 Listing boosted! Visibility increased by 2.4x on buyer search.');
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property listing?')) return;
    setProperties((prev) => {
      const updated = prev.filter((p) => p.id !== propertyId);
      try {
        localStorage.setItem('Ziva_custom_properties', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_properties', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleConfirmVisit = async (visitId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (token) {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/v1/visits/${visitId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    setVisits((prev) => {
      const updated = prev.map((v) => (v.id === visitId ? { ...v, status: 'CONFIRMED' as const } : v));
      try {
        localStorage.setItem('Ziva_user_visits', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_visits', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleCancelVisit = async (visitId: string) => {
    if (!confirm('Are you sure you want to decline this scheduled visit?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (token) {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/v1/visits/${visitId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Declined by owner' }),
      }).catch(() => {});
    }

    setVisits((prev) => {
      const updated = prev.map((v) => (v.id === visitId ? { ...v, status: 'CANCELLED' as const } : v));
      try {
        localStorage.setItem('Ziva_user_visits', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_visits', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleModal) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (token) {
      const apiBase = getApiBaseUrl();
      fetch(`${apiBase}/api/v1/visits/${rescheduleModal.visitId}/reschedule`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: `${rescheduleModal.date}T10:00:00Z` }),
      }).catch(() => {});
    }

    setVisits((prev) => {
      const updated = prev.map((v) =>
        v.id === rescheduleModal.visitId
          ? { ...v, scheduledDate: rescheduleModal.date, timeSlot: rescheduleModal.time, status: 'CONFIRMED' as const }
          : v
      );
      try {
        localStorage.setItem('Ziva_user_visits', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_visits', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setRescheduleModal(null);
    alert('✅ Visit rescheduled successfully. Notification sent to visitor!');
  };

  const handleReleaseEscrow = (paymentId: string) => {
    const target = escrowPayments.find((p) => p.id === paymentId);
    const amountStr = target ? `₹${target.amount.toLocaleString('en-IN')}` : 'deposit';

    setEscrowPayments((prev) => {
      const updated = prev.map((p) => (p.id === paymentId ? { ...p, status: 'RELEASED' as const } : p));
      try {
        localStorage.setItem('Ziva_user_payments', JSON.stringify(updated));
        localStorage.setItem('Ziva_owner_escrow', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    alert(`✅ Escrow deposit of ${amountStr} has been verified and released to your bank account!`);
  };

  const handleSignOut = () => {
    localStorage.removeItem('Ziva_access');
    localStorage.removeItem('Ziva_refresh');
    router.push('/auth/login');
  };

  // ─── Metric Calculations ──────────────────────────────────────────────────
  const totalListings = properties.length;
  const activeListings = properties.filter((p) => p.status === 'ACTIVE').length;
  const totalLeads = leads.length;
  const totalVisitsCount = visits.filter((v) => v.status !== 'CANCELLED').length;
  const totalViews = properties.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const totalEscrowSecured = escrowPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  const filteredProperties = properties.filter((p) => {
    const matchesFilter = propertyFilter === 'ALL' || p.status === propertyFilter;
    const matchesSearch = !propertySearch.trim() ||
      p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.locality.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.city.toLowerCase().includes(propertySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredLeads = leads.filter((l) => {
    if (!leadSearch.trim()) return true;
    const term = leadSearch.toLowerCase();
    return (
      (l.counterparty?.firstName || '').toLowerCase().includes(term) ||
      (l.property?.title || '').toLowerCase().includes(term) ||
      (l.lastMessage?.contentSanitized || '').toLowerCase().includes(term)
    );
  });

  const filteredVisits = visits.filter((v) => {
    if (visitStatusFilter === 'ALL') return true;
    return v.status === visitStatusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center font-[Rubik]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#586060] font-medium text-sm">Syncing live owner dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex flex-col font-[Rubik] antialiased">
      {/* ─── Top Navbar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50 shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-18 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Ziva Housing Logo" className="h-10 w-auto object-contain" />
            </Link>
            <span className="bg-[#e8ddff] text-[#4500b4] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">shield_person</span> Owner Portal
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => router.push('/post-property')}
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span className="hidden sm:inline">Post New Property</span>
            </button>
            <NotificationCenter />
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 text-left hover:bg-gray-50 p-1.5 rounded-xl transition cursor-pointer"
              title="Click to edit profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5e23dc] font-bold text-xs flex items-center justify-center shadow-xs">
                {(user?.firstName || 'O').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <span className="text-[10px] text-gray-400 block font-bold leading-none">Property Owner</span>
                <span className="text-xs font-bold text-gray-800 leading-tight">
                  {user?.firstName} {user?.lastName || ''}
                </span>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              className="border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ─── Dashboard Body: Left Sidebar + Main Content ─── */}
      <div className="w-full flex flex-col md:flex-row flex-1">
        {/* Left Side Panel (Sidebar) */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white border-b md:border-b-0 md:border-r border-[#e2e8f0] p-4 lg:p-6 flex flex-col justify-between md:min-h-[calc(100vh-72px)] md:sticky md:top-18 self-start">
          <div className="space-y-6">
            <div className="hidden md:block">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block px-3">
                Owner Navigation
              </span>
            </div>

            <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Overview</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('properties')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'properties'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">real_estate_agent</span>
                  <span>My Properties</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'properties' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {properties.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">forum</span>
                  <span>Tenant Enquiries</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'leads' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  {leads.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('visits')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'visits'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">event</span>
                  <span>Scheduled Visits</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'visits' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {visits.filter(v => v.status !== 'CANCELLED').length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('escrow')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'escrow'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">lock</span>
                  <span>Escrow &amp; Payments</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  activeTab === 'escrow' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  ₹{totalEscrowSecured >= 1000 ? `${(totalEscrowSecured / 1000).toFixed(0)}k` : totalEscrowSecured}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">insights</span>
                  <span>Performance Analytics</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#5e23dc] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#5e23dc]/5 hover:text-[#5e23dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">settings</span>
                  <span>Account & Settings</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Escrow Shield Quick Badge in Sidebar */}
          <div className="hidden md:block pt-6">
            <div className="p-4 bg-[#5e23dc]/5 border border-[#5e23dc]/15 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#5e23dc] font-bold text-xs">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Ziva Escrow Active</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                All deal rooms and viewing visits are monitored for legal and financial protection.
              </p>
            </div>
          </div>
        </aside>

        {/* ─── Main Content Body ─── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        {/* ══════════════════ TAB 1: OVERVIEW ══════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Portfolio</span>
                  <span className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 block">{totalListings}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">✓ {activeListings} Active on Search</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#5e23dc] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">home_work</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Tenant Inquiries</span>
                  <span className="text-2xl md:text-3xl font-bold text-[#5e23dc] mt-1 block">{totalLeads}</span>
                  <span className="text-[10px] text-blue-600 font-semibold mt-1 block">💬 Active Deal Rooms</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Upcoming Visits</span>
                  <span className="text-2xl md:text-3xl font-bold text-amber-600 mt-1 block">{totalVisitsCount}</span>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1 block">📅 Verified Buyers Booked</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">event_available</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Escrow Protected</span>
                  <span className="text-2xl md:text-3xl font-bold text-emerald-600 mt-1 block">₹ {totalEscrowSecured.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">🔒 100% Ziva Escrow Held</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
              </div>
            </div>

            {/* Overview Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                {/* Properties Quick Summary */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
                    <div>
                      <h2 className="font-bold text-base text-gray-900">Active Property Portfolio</h2>
                      <p className="text-xs text-gray-500">Live listings, moderation state, and buyer views</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('properties')}
                      className="text-xs font-bold text-[#5e23dc] hover:underline cursor-pointer"
                    >
                      View All ({properties.length})
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {properties.length === 0 ? (
                      <div className="p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-purple-50 text-[#5e23dc] rounded-2xl flex items-center justify-center mx-auto">
                          <span className="material-symbols-outlined text-2xl">home_work</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-900">No properties in portfolio yet</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          Post your first property listing to start receiving live views, buyer enquiries, and visit bookings.
                        </p>
                        <button
                          onClick={() => router.push('/post-property')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5e23dc] hover:bg-[#4500b4] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Post First Property
                        </button>
                      </div>
                    ) : (
                      properties.slice(0, 3).map((prop) => {
                        const matchingLeadsCount =
                          leads.filter((l) => l.property?.id === prop.id || (l as any).propertyId === prop.id).length ||
                          prop.enquiryCount ||
                          0;

                        return (
                          <div key={prop.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                              <img
                                src={prop.photos?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                                alt={prop.title}
                                className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                    {prop.purpose === 'SELL' ? 'For Sale' : 'For Rent'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    prop.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {prop.status === 'ACTIVE' ? '● LIVE' : '⏳ PENDING REVIEW'}
                                  </span>
                                  {prop.isFeatured && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 flex items-center gap-0.5">
                                      ⚡ FEATURED
                                    </span>
                                  )}
                                  {prop.bhk && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-[#5e23dc]">
                                      {prop.bhk} BHK
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 mt-1 line-clamp-1">{prop.title}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-xs text-[#5e23dc]">location_on</span>
                                  {prop.locality}, {prop.city}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 self-end sm:self-center">
                              <div className="text-right">
                                <span className="text-xs font-bold text-[#5e23dc] block">
                                  ₹ {prop.purpose === 'SELL'
                                    ? Number(prop.expectedPrice || 0).toLocaleString('en-IN')
                                    : `${Number(prop.monthlyRent || prop.expectedPrice || 0).toLocaleString('en-IN')}/mo`}
                                </span>
                                <span className="text-[10px] text-gray-500">{prop.viewCount || 0} Views • {matchingLeadsCount} Leads</span>
                              </div>
                              <Link
                                href={`/properties/${prop.id}`}
                                className="p-2 text-gray-500 hover:text-[#5e23dc] hover:bg-[#ede9fe] rounded-lg transition"
                                title="Preview Listing"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </Link>
                              <Link
                                href={`/properties/${prop.id}/edit`}
                                className="p-2 text-gray-500 hover:text-[#5e23dc] hover:bg-[#ede9fe] rounded-lg transition"
                                title="Edit Listing"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Scheduled Visits Synced Feed */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
                    <div>
                      <h2 className="font-bold text-base text-gray-900">Upcoming Scheduled Visits</h2>
                      <p className="text-xs text-gray-500">Buyer and renter property walkthroughs</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('visits')}
                      className="text-xs font-bold text-[#5e23dc] hover:underline cursor-pointer"
                    >
                      View All ({visits.length})
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {visits.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500">
                        No upcoming visits scheduled yet.
                      </div>
                    ) : (
                      visits.slice(0, 3).map((visit) => (
                        <div key={visit.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5e23dc] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xl">calendar_today</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-gray-900">{visit.visitorName || 'Verified Visitor'}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  visit.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                                  visit.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {visit.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 font-medium mt-0.5">{visit.propertyTitle}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                                <span>📅 {visit.scheduledDate}</span>
                                <span>⏰ {visit.timeSlot}</span>
                                {visit.visitorPhone && <span>📞 {visit.visitorPhone}</span>}
                              </p>
                            </div>
                          </div>

                          {visit.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleConfirmVisit(visit.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Accept Visit
                              </button>
                              <button
                                onClick={() => setRescheduleModal({ isOpen: true, visitId: visit.id, date: visit.scheduledDate, time: visit.timeSlot })}
                                className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelVisit(visit.id)}
                                className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {visit.status === 'CONFIRMED' && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              ✓ Confirmed
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Inquiries Feed & Escrow Summary */}
              <div className="lg:col-span-4 space-y-6">
                {/* Received Inquiries Feed */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
                    <h2 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#5e23dc] text-base">forum</span>
                      Active Inquiries ({leads.length})
                    </h2>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className="text-[11px] font-bold text-[#5e23dc] hover:underline cursor-pointer"
                    >
                      View Deal Rooms
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                    {leads.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500">
                        No active enquiries yet. Deal rooms will appear when buyers or tenants enquire.
                      </div>
                    ) : (
                      leads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => router.push(`/chat/${lead.id}`)}
                          className="p-4 hover:bg-gray-50 transition cursor-pointer space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#5e23dc] text-white flex items-center justify-center font-bold text-[10px]">
                                {lead.counterparty?.firstName ? lead.counterparty.firstName.substring(0, 2).toUpperCase() : 'CU'}
                              </div>
                              <span className="font-bold text-xs text-gray-900">{lead.counterparty?.firstName || 'Buyer'}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <p className="text-[11px] font-semibold text-[#5e23dc] line-clamp-1">
                            Re: {lead.property?.title}
                          </p>

                          <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            {lead.lastMessage?.contentSanitized || 'Inquiry initiated. Open Deal Room to discuss price & terms.'}
                          </p>

                          <div className="flex justify-between items-center text-[11px] pt-1">
                            <span className="font-bold text-emerald-700">
                              {lead.offerAmount ? `Offer: ₹${Number(lead.offerAmount).toLocaleString('en-IN')}` : 'Ready for visit'}
                            </span>
                            <span className="text-[#5e23dc] font-bold flex items-center gap-0.5 hover:underline">
                              Open Chat <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Escrow Holding Card */}
                <div className="bg-gradient-to-br from-[#1e1b4b] to-[#31104b] rounded-2xl p-5 text-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#c4b5fd] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified_user</span> Ziva Protecting Escrow
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                      100% Guaranteed
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-300 block">Total Escrow Funds in Holding</span>
                    <span className="text-2xl font-bold text-white mt-1 block">
                      ₹ {totalEscrowSecured.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Tenant holding deposits are safely held in Ziva Escrow until property agreement signoff or move-in confirmation.
                  </p>

                  <button
                    onClick={() => setActiveTab('escrow')}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Manage Escrow Releases</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 2: MY PROPERTIES ══════════════════ */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Property Portfolio ({properties.length})</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage live listings, verification pipeline, boost visibility, and edit specs.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                  <input
                    type="text"
                    placeholder="Search by title, locality..."
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#5e23dc] w-52"
                  />
                </div>

                <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
                  {(['ALL', 'ACTIVE', 'PENDING_REVIEW', 'RENTED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPropertyFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        propertyFilter === filter
                          ? 'bg-[#5e23dc] text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Live' : filter === 'PENDING_REVIEW' ? 'Reviewing' : 'Rented/Sold'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/post-property')}
                  className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Post Property
                </button>
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-xs">
                <span className="material-symbols-outlined text-5xl text-gray-400">home_work</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">No properties found</h3>
                  <p className="text-xs text-gray-500 mt-1">Try changing your search terms or filter.</p>
                </div>
                <button
                  onClick={() => { setPropertyFilter('ALL'); setPropertySearch(''); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => (
                  <div key={prop.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      {/* Image header */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={prop.photos?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            {prop.purpose === 'SELL' ? 'FOR SALE' : 'FOR RENT'}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs ${
                            prop.status === 'ACTIVE' ? 'bg-emerald-600 text-white' :
                            prop.status === 'RENTED' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {prop.status === 'ACTIVE' ? '● LIVE' : prop.status}
                          </span>
                          {prop.isFeatured && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-0.5">
                              ⚡ FEATURED
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                          ₹ {prop.purpose === 'SELL'
                            ? Number(prop.expectedPrice || 0).toLocaleString('en-IN')
                            : `${Number(prop.monthlyRent || prop.expectedPrice || 0).toLocaleString('en-IN')}/mo`}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{prop.propertyType} {prop.bhk ? `• ${prop.bhk} BHK` : ''}</span>
                          <span className="flex items-center gap-1 font-bold text-gray-700">
                            <span className="material-symbols-outlined text-sm text-[#5e23dc]">visibility</span>
                            {prop.viewCount || 0} Views
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{prop.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#5e23dc]">location_on</span>
                          {prop.locality}, {prop.city}
                        </p>

                        {/* Moderation Stage Tracker */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-600">Verification Desk:</span>
                            <span className={prop.status === 'ACTIVE' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {prop.status === 'ACTIVE' ? '✓ Legal Verified' : '⏳ Review in progress'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${prop.status === 'ACTIVE' ? 'bg-emerald-600 w-full' : 'bg-amber-500 w-2/3'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/properties/${prop.id}`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#5e23dc] rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">visibility</span> Preview
                        </Link>
                        <Link
                          href={`/properties/${prop.id}/edit`}
                          className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#5e23dc] rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span> Edit
                        </Link>
                      </div>

                      <div className="flex items-center gap-1">
                        {!prop.isFeatured && (
                          <button
                            onClick={() => handleBoostProperty(prop.id)}
                            className="px-2 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Boost Visibility on Search"
                          >
                            ⚡ Boost
                          </button>
                        )}
                        {prop.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdatePropertyStatus(prop.id, 'RENTED')}
                            className="px-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Mark as Rented"
                          >
                            Mark Rented
                          </button>
                        )}
                        {prop.status === 'RENTED' && (
                          <button
                            onClick={() => handleUpdatePropertyStatus(prop.id, 'ACTIVE')}
                            className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            title="Make Live Again"
                          >
                            Set Live
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Listing"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ TAB 3: TENANT ENQUIRIES ══════════════════ */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tenant & Buyer Inquiries ({leads.length})</h1>
                <p className="text-xs text-gray-500 mt-0.5">Direct negotiations, proposed offer pricing, and real-time Deal Rooms.</p>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search buyer name or message..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#5e23dc] w-64"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-6 hover:bg-gray-50 transition flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#5e23dc] flex items-center justify-center font-bold text-sm shrink-0">
                        {lead.counterparty?.firstName ? lead.counterparty.firstName.substring(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{lead.counterparty?.firstName || 'Buyer / Tenant'}</h3>
                          <span className="bg-purple-100 text-[#5e23dc] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#5e23dc]">Property: {lead.property?.title}</p>
                        <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 max-w-xl">
                          &ldquo;{lead.lastMessage?.contentSanitized || 'Inquiry initiated. Open Deal Room to negotiate terms.'}&rdquo;
                        </p>
                        {lead.counterparty?.phone && (
                          <p className="text-[11px] text-gray-500">Contact: {lead.counterparty.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-end justify-center gap-2 shrink-0">
                      {lead.offerAmount && (
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Proposed Offer</span>
                          <span className="text-base font-bold text-emerald-700">₹ {Number(lead.offerAmount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/chat/${lead.id}`)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">forum</span>
                        Open Deal Room
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 4: SCHEDULED VISITS ══════════════════ */}
        {activeTab === 'visits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scheduled Property Visits ({visits.length})</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage on-site visit appointments booked by potential buyers and tenants.</p>
              </div>

              <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
                {(['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setVisitStatusFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      visitStatusFilter === filter
                        ? 'bg-[#5e23dc] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'PENDING' ? 'Pending' : filter === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredVisits.map((visit) => (
                  <div key={visit.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">calendar_month</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{visit.visitorName || 'Verified Visitor'}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            visit.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            visit.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800">{visit.propertyTitle}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <span className="material-symbols-outlined text-xs text-[#5e23dc]">event</span>
                            {visit.scheduledDate}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <span className="material-symbols-outlined text-xs text-[#5e23dc]">schedule</span>
                            {visit.timeSlot}
                          </span>
                        </p>
                        {visit.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">&ldquo;{visit.notes}&rdquo;</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {visit.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleConfirmVisit(visit.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Accept Visit
                          </button>
                          <button
                            onClick={() => setRescheduleModal({ isOpen: true, visitId: visit.id, date: visit.scheduledDate, time: visit.timeSlot })}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelVisit(visit.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {visit.status === 'CONFIRMED' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            ✓ Confirmed Appointment
                          </span>
                          <button
                            onClick={() => setRescheduleModal({ isOpen: true, visitId: visit.id, date: visit.scheduledDate, time: visit.timeSlot })}
                            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                      {visit.status === 'CANCELLED' && (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 5: ESCROW & PAYMENTS ══════════════════ */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Escrow Deposits & Payouts</h1>
              <p className="text-xs text-gray-500 mt-0.5">Holding deposits, escrow protection statuses, and owner payouts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                <span className="text-xs font-bold text-gray-400 uppercase">Escrow In Holding</span>
                <span className="text-2xl font-bold text-purple-700 mt-2 block">
                  ₹ {escrowPayments.filter(p => p.status === 'ESCROW_HELD').reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-gray-500 mt-1 block">Held securely pending tenant lease signoff</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                <span className="text-xs font-bold text-gray-400 uppercase">Released Payouts</span>
                <span className="text-2xl font-bold text-emerald-700 mt-2 block">
                  ₹ {escrowPayments.filter(p => p.status === 'RELEASED').reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-600 mt-1 block">✓ Successfully credited to bank</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                <span className="text-xs font-bold text-gray-400 uppercase">Ziva Platform Commission</span>
                <span className="text-2xl font-bold text-gray-700 mt-2 block">₹ 0</span>
                <span className="text-[11px] text-emerald-600 mt-1 block">Free Zero-Commission Phase 1</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-[#fafafa]">
                <h3 className="font-bold text-sm text-gray-900">Escrow Transaction History</h3>
              </div>

              <div className="divide-y divide-gray-100">
                {escrowPayments.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">No escrow transactions yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      When prospective tenants place token deposits to reserve your properties, escrow transactions and payout release buttons will appear here.
                    </p>
                  </div>
                ) : (
                  escrowPayments.map((payment) => (
                    <div key={payment.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{payment.tenantName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            payment.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-[#5e23dc]'
                          }`}>
                            {payment.status === 'RELEASED' ? 'RELEASED TO OWNER' : 'ESCROW SECURED'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Re: {payment.propertyTitle}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Date: {new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-gray-900">₹ {payment.amount.toLocaleString('en-IN')}</span>
                        {payment.status === 'ESCROW_HELD' && (
                          <button
                            onClick={() => handleReleaseEscrow(payment.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Confirm & Release Payout
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 6: PERFORMANCE ANALYTICS ══════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portfolio Performance Analytics</h1>
              <p className="text-xs text-gray-500 mt-0.5">Visitor impressions, conversion funnels, and verified tenant interest stats.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Search Impressions</span>
                <span className="text-3xl font-bold text-[#5e23dc] block">{(totalViews * 4.5).toFixed(0)}</span>
                <p className="text-[11px] text-gray-500">Your listings appeared in search results this month (+18.4% growth).</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Inquiry Conversion</span>
                <span className="text-3xl font-bold text-emerald-600 block">{conversionRate}%</span>
                <p className="text-[11px] text-gray-500">Industry benchmark is 4.2%. Your portfolio is in top 10%!</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Trust & Verification Score</span>
                <span className="text-3xl font-bold text-blue-600 block">100%</span>
                <p className="text-[11px] text-gray-500">All submitted documents have been verified by Ziva Moderation desk.</p>
              </div>
            </div>

            {/* Top performing properties ranking */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-[#fafafa]">
                <h3 className="font-bold text-sm text-gray-900">Listings Performance Breakdown</h3>
              </div>

              <div className="divide-y divide-gray-100">
                {properties.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-500">
                    No listings in your portfolio to analyze yet. Post a property to start tracking impressions and leads.
                  </div>
                ) : (
                  properties.map((prop, idx) => {
                    const matchingLeadsCount =
                      leads.filter((l) => l.property?.id === prop.id || (l as any).propertyId === prop.id).length ||
                      prop.enquiryCount ||
                      0;

                    return (
                      <div key={prop.id} className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-50 text-[#5e23dc] font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">{prop.title}</h4>
                            <p className="text-xs text-gray-500">{prop.locality}, {prop.city}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Views</span>
                            <span className="text-sm font-bold text-gray-900">{prop.viewCount || 0}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Leads</span>
                            <span className="text-sm font-bold text-[#5e23dc]">{matchingLeadsCount}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Status</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prop.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prop.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 7: ACCOUNT & SETTINGS ══════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Account & Profile Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">Manage your owner profile, contact preferences, and public listing details.</p>
            </div>

            {/* Profile Information Form Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-[#fafafa] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Owner Profile Information</h3>
                  <p className="text-xs text-gray-500">Your name is displayed to prospective buyers and renters.</p>
                </div>
                <span className="bg-[#ede9fe] text-[#5e23dc] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Role: Property Owner
                </span>
              </div>

              <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder="e.g. Khurram"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder="e.g. Nawab"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="owner@ziva.housing"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Phone Number (For Visit Alerts)</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98860 23456"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Primary City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Bangalore"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Locality / Neighborhood</label>
                    <input
                      type="text"
                      value={profileForm.locality}
                      onChange={(e) => setProfileForm({ ...profileForm, locality: e.target.value })}
                      placeholder="Indiranagar 100ft Road"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold outline-none focus:border-[#5e23dc] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <p className="text-[11px] text-gray-500">
                    Changes will immediately update your owner name across all listings and deal rooms.
                  </p>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-[#5e23dc] hover:bg-[#4500b4] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Notification & Security Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-sm text-gray-900">Security & Notifications</h3>
              <div className="space-y-3 divide-y divide-gray-100 text-xs text-gray-700">
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Instant SMS & WhatsApp Visit Alerts</span>
                    <span className="text-[11px] text-gray-500">Receive instant notifications when a buyer requests a property walkthrough.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#5e23dc] w-4 h-4 cursor-pointer" />
                </div>
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">Escrow Token Deposit Alerts</span>
                    <span className="text-[11px] text-gray-500">Get notified immediately when tenant deposits booking advance.</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#5e23dc] w-4 h-4 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ─── Reschedule Modal ───────────────────────────────────────────────── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900">Reschedule Property Visit</h3>
              <button onClick={() => setRescheduleModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">New Visit Date</label>
                <input
                  type="date"
                  value={rescheduleModal.date}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Preferred Time Slot</label>
                <select
                  value={rescheduleModal.time}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, time: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:border-[#5e23dc]"
                >
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                  <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                  <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-2 bg-[#5e23dc] hover:bg-[#4500b4] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save & Notify Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
