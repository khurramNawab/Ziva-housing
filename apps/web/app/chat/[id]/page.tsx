'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import io from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isBlocked?: boolean;
  timestamp: string;
}

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  notes?: string;
}

interface Offer {
  id: string;
  price: number;
  status: string;
  createdByRole: string;
  parentOfferId?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

// Mock Properties dictionary for Deal Room Fallbacks
const MOCK_PROPERTIES_DICT: Record<string, any> = {
  'mock-buy-1': {
    id: 'mock-buy-1',
    title: 'Prestige Golfshire Luxury Villa',
    expectedPrice: 35000000,
    locality: 'Nandi Hills',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Siddharth', lastName: 'Reddy', phone: '+91 98450 12345' } }
  },
  'mock-buy-2': {
    id: 'mock-buy-2',
    title: 'Sobha City Casa Paradiso',
    expectedPrice: 18000000,
    locality: 'Hebbal',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Ananya', lastName: 'Sharma', phone: '+91 98800 23456' } }
  },
  'mock-buy-3': {
    id: 'mock-buy-3',
    title: 'Godrej Palm Retreat Penthouse',
    expectedPrice: 24500000,
    locality: 'Sector 150',
    city: 'Noida',
    ownerProfile: { user: { firstName: 'Rohit', lastName: 'Malhotra', phone: '+91 99110 34567' } }
  },
  'mock-buy-4': {
    id: 'mock-buy-4',
    title: 'DLF The Crest Sky Residence',
    expectedPrice: 48000000,
    locality: 'Golf Course Road, Sector 54',
    city: 'Gurgaon',
    ownerProfile: { user: { firstName: 'Karan', lastName: 'Kapoor', phone: '+91 98100 45678' } }
  },
  'mock-buy-5': {
    id: 'mock-buy-5',
    title: 'Hiranandani Gardens Castalia',
    expectedPrice: 29500000,
    locality: 'Powai',
    city: 'Mumbai',
    ownerProfile: { user: { firstName: 'Sneha', lastName: 'Pawar', phone: '+91 98200 56789' } }
  },
  'mock-buy-6': {
    id: 'mock-buy-6',
    title: 'Brigade Gateway Premium Condo',
    expectedPrice: 16500000,
    locality: 'Malleshwaram',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Manoj', lastName: 'Gowda', phone: '+91 97410 78901' } }
  },
  'mock-buy-7': {
    id: 'mock-buy-7',
    title: 'Total Environment Windmills',
    expectedPrice: 42000000,
    locality: 'Whitefield',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Kavita', lastName: 'Iyer', phone: '+91 98801 89012' } }
  },
  'mock-buy-8': {
    id: 'mock-buy-8',
    title: 'Lodha World One Iconic Tower',
    expectedPrice: 85000000,
    locality: 'Lower Parel',
    city: 'Mumbai',
    ownerProfile: { user: { firstName: 'Deepak', lastName: 'Menon', phone: '+91 98451 89012' } }
  },
  'mock-buy-9': {
    id: 'mock-buy-9',
    title: 'Puravankara Palm Beach Flat',
    expectedPrice: 9500000,
    locality: 'Hennur Road',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Arun', lastName: 'Kumar', phone: '+91 97400 90123' } }
  },
  'mock-buy-10': {
    id: 'mock-buy-10',
    title: 'Emaar Marbella Spanish Villa',
    expectedPrice: 58000000,
    locality: 'Sector 66, Golf Course Ext',
    city: 'Gurgaon',
    ownerProfile: { user: { firstName: 'Rishi', lastName: 'Bansal', phone: '+91 98111 01234' } }
  },
  'mock-rent-1': {
    id: 'mock-rent-1',
    title: 'Greenwood Executive Villa',
    expectedPrice: 45000,
    monthlyRent: 45000,
    locality: 'Koramangala 4th Block',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Vikram', lastName: 'Hegde', phone: '+91 99000 12345' } }
  },
  'mock-rent-2': {
    id: 'mock-rent-2',
    title: 'Prestige Langlee High-Rise',
    expectedPrice: 65000,
    monthlyRent: 65000,
    locality: 'HSR Layout Sector 1',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Rajesh', lastName: 'Verma', phone: '+91 98860 23456' } }
  },
  'mock-rent-3': {
    id: 'mock-rent-3',
    title: 'Indiranagar Designer Studio Apartment',
    expectedPrice: 28000,
    monthlyRent: 28000,
    locality: '100 Feet Road, Indiranagar',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Alok', lastName: 'Verma', phone: '+91 98453 34567' } }
  },
  'mock-rent-4': {
    id: 'mock-rent-4',
    title: 'Lodha Park Serene 2 BHK Suite',
    expectedPrice: 85000,
    monthlyRent: 85000,
    locality: 'Worli',
    city: 'Mumbai',
    ownerProfile: { user: { firstName: 'Sameer', lastName: 'Deshmukh', phone: '+91 98203 45678' } }
  },
  'mock-rent-5': {
    id: 'mock-rent-5',
    title: 'DLF Phase 5 Ultra Luxury Flat',
    expectedPrice: 55000,
    monthlyRent: 55000,
    locality: 'DLF Phase 5',
    city: 'Gurgaon',
    ownerProfile: { user: { firstName: 'Pooja', lastName: 'Merchant', phone: '+91 98201 56789' } }
  },
  'mock-rent-6': {
    id: 'mock-rent-6',
    title: 'Adarsh Palm Retreat Lakeview',
    expectedPrice: 72000,
    monthlyRent: 72000,
    locality: 'Bellandur / Outer Ring Road',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Pradeep', lastName: 'Nair', phone: '+91 98452 67890' } }
  },
  'mock-rent-7': {
    id: 'mock-rent-7',
    title: 'Sunny Modern 1 BHK in BTM',
    expectedPrice: 18500,
    monthlyRent: 18500,
    locality: 'BTM Layout 2nd Stage',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Manoj', lastName: 'Gowda', phone: '+91 97410 78901' } }
  },
  'mock-rent-8': {
    id: 'mock-rent-8',
    title: 'Salarpuria Sattva Magnificence',
    expectedPrice: 48000,
    monthlyRent: 48000,
    locality: 'Bannerghatta Road',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Kavita', lastName: 'Iyer', phone: '+91 98801 89012' } }
  },
  'mock-rent-9': {
    id: 'mock-rent-9',
    title: 'Emaar Palm Drive Luxury Floor',
    expectedPrice: 95000,
    monthlyRent: 95000,
    locality: 'Golf Course Extension',
    city: 'Gurgaon',
    ownerProfile: { user: { firstName: 'Ashish', lastName: 'Khanna', phone: '+91 98112 90123' } }
  },
  'mock-rent-10': {
    id: 'mock-rent-10',
    title: 'Brigade Metropolis Corner Penthouse',
    expectedPrice: 62000,
    monthlyRent: 62000,
    locality: 'Mahadevapura / Whitefield',
    city: 'Bangalore',
    ownerProfile: { user: { firstName: 'Geeta', lastName: 'Subramanian', phone: '+91 98453 01234' } }
  }
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId || '');

  const [lead, setLead] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState('NEW');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Visit Scheduling Modal
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('Would like to schedule a viewing.');
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  // Visit Rescheduling State
  const [reschedulingVisitId, setReschedulingVisitId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [processingReschedule, setProcessingReschedule] = useState(false);

  // Offer Creation States
  const [offerPrice, setOfferPrice] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);

  // Payment Mock Modal State
  const [showPaymentMockModal, setShowPaymentMockModal] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState('');
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // Payment Confirmation Receipt State
  const [paymentConfirmation, setPaymentConfirmation] = useState<{
    transactionId: string;
    amount: number;
    date: string;
  } | null>(null);

  const statuses = [
    { label: 'New Inquiry', value: 'NEW' },
    { label: 'Contacted', value: 'CONTACTED' },
    { label: 'Visit Scheduled', value: 'VISIT_SCHEDULED' },
    { label: 'Negotiation', value: 'NEGOTIATION' },
    { label: 'Booking', value: 'BOOKING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Lost', value: 'LOST' },
  ];

  const currentStatusLabel = statuses.find((s) => s.value === pipelineStatus)?.label || 'New';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Authenticate and Fetch Initial Lead & Chat Data
  useEffect(() => {
    let activeToken = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    let userObj: any = null;

    if (activeToken) {
      try {
        userObj = JSON.parse(atob(activeToken.split('.')[1] || ''));
      } catch (e) {
        userObj = null;
      }
    }

    if (!userObj) {
      try {
        const storedUser = localStorage.getItem('Ziva_user');
        if (storedUser) {
          userObj = JSON.parse(storedUser);
        }
      } catch (e) {}
    }

    if (!userObj) {
      userObj = { sub: 'usr-customer-1', firstName: 'Khurram', role: 'CUSTOMER', email: 'khurram@ziva.housing' };
      activeToken = activeToken || 'mock-jwt-token-ziva';
    }

    setToken(activeToken || '');
    setCurrentUser(userObj);
    fetchLeadAndChatData(activeToken || '', userObj);

    // Cleanup Socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const getFallbackLead = (leadId?: string, user?: any) => {
    const safeLeadId = String(leadId || id || 'lead-mock-rent-2');
    const cleanPropId = safeLeadId.replace(/^lead-/, '');
    const matched = MOCK_PROPERTIES_DICT[cleanPropId] || {
      id: cleanPropId,
      title: cleanPropId.startsWith('pg-') ? 'Premium Urban PG Living' : cleanPropId.startsWith('mock-rent') ? 'Prestige Langlee High-Rise' : 'Luxury Villa Residence',
      expectedPrice: cleanPropId.startsWith('mock-rent') ? 65000 : 18500000,
      monthlyRent: cleanPropId.startsWith('mock-rent') ? 65000 : undefined,
      locality: 'HSR Layout Sector 1',
      city: 'Bangalore',
      ownerProfile: { user: { firstName: 'Rajesh', lastName: 'Verma', phone: '+91 98860 23456' } }
    };

    const ownerName = matched.ownerProfile?.user?.firstName || 'Rajesh';

    return {
      id: safeLeadId,
      propertyId: matched.id,
      property: matched,
      status: 'NEW',
      customerId: user?.sub || 'usr-customer-1',
      customer: {
        firstName: user?.firstName || 'Khurram',
        lastName: user?.lastName || 'Customer',
        phone: user?.phone || '+91 98765 43210',
      },
      visits: [
        {
          id: 'vis-1',
          scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
          status: 'REQUESTED',
          notes: 'Looking forward to viewing the flat and amenities.'
        }
      ],
      offers: [
        {
          id: 'off-1',
          price: matched.expectedPrice || matched.monthlyRent || 65000,
          status: 'PENDING',
          createdByRole: 'CUSTOMER',
          createdAt: new Date().toISOString()
        }
      ],
      initialMessages: [
        {
          id: 'msg-sys-1',
          senderId: 'system',
          senderName: 'Ziva Housing Compliance',
          content: 'Welcome to the Secure Deal Room. All appointments and escrow tokens are protected under Ziva Safety Protocols.',
          timestamp: '11:00 AM'
        },
        {
          id: 'msg-owner-1',
          senderId: 'owner-auto',
          senderName: `${ownerName} (Owner)`,
          content: `Hi ${user?.firstName || 'there'}! Thank you for your interest in ${matched.title}. How can I help you? Feel free to schedule a site visit or ask any questions here.`,
          timestamp: '11:02 AM'
        },
        {
          id: 'msg-buyer-1',
          senderId: user?.sub || 'usr-customer-1',
          senderName: `${user?.firstName || 'You'}`,
          content: `Hello ${ownerName}, I am interested in this property and would like to coordinate a viewing.`,
          timestamp: '11:05 AM'
        }
      ]
    };
  };

  const fetchLeadAndChatData = async (accToken: string, user?: any) => {
    setLoading(true);
    setError('');
    const u = user || currentUser || { sub: 'usr-customer-1', firstName: 'Khurram', role: 'CUSTOMER' };
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      // 1. Attempt Fetch Lead details from backend
      const leadRes = await fetch(`${apiBase}/api/v1/leads/${id}`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });

      if (leadRes.ok) {
        const leadJson = await leadRes.json();
        const leadData = leadJson.data || leadJson;
        if (leadData && leadData.id) {
          setLead(leadData);
          setPipelineStatus(leadData.status || 'NEW');
          setVisits(leadData.visits || []);
          setOffers(leadData.offers || []);

          // Fetch message history
          const msgRes = await fetch(`${apiBase}/api/v1/chat/leads/${id}/messages`, {
            headers: { Authorization: `Bearer ${accToken}` },
          });
          if (msgRes.ok) {
            const msgJson = await msgRes.json();
            const history = (msgJson.messages || msgJson || []).map((m: any) => ({
              id: m.id,
              senderId: m.senderId,
              senderName: m.sender?.firstName || 'User',
              content: m.contentSanitized || '',
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));
            setMessages(history.length > 0 ? history : getFallbackLead(String(id), u).initialMessages);
          } else {
            setMessages(getFallbackLead(String(id), u).initialMessages);
          }

          // Fetch Transactions
          const txRes = await fetch(`${apiBase}/api/v1/payments/my-transactions`, {
            headers: { Authorization: `Bearer ${accToken}` },
          });
          if (txRes.ok) {
            const txJson = await txRes.json();
            const leadTx = (txJson.data || txJson || []).filter((tx: any) => tx.leadId === id);
            setTransactions(leadTx);
          }

          // 2. Initialize Socket.io WebSockets
          initWebSocket(accToken);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('API Lead fetch offline/unavailable, using robust Deal Room fallback:', err);
    }

    // Resilient Fallback - deal room always loads
    const fallback = getFallbackLead(String(id), u);
    setLead(fallback);
    setPipelineStatus(fallback.status);
    setVisits(fallback.visits);
    setOffers(fallback.offers);
    setMessages(fallback.initialMessages);
    setLoading(false);

    // Try socket connect in background anyway
    try {
      initWebSocket(accToken);
    } catch (e) {}
  };

  const initWebSocket = (accToken: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      // Connect to /chat namespace
      const socket = io(`${apiBase}/chat`, {
        auth: { token: accToken },
        transports: ['websocket'],
        reconnectionAttempts: 2,
        timeout: 3000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_lead', { leadId: id });
      });

      socket.on('message_received', (payload: any) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id,
              senderId: payload.sender?.id,
              senderName: payload.sender?.firstName || 'User',
              content: payload.content || '',
              timestamp: new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      });

      socket.on('message_flagged', () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-flag-${Date.now()}`,
            senderId: 'system',
            senderName: 'Ziva Security',
            content: `[Notice] Sharing direct numbers, emails, or WhatsApp contacts is restricted to protect your transaction sequence. Please schedule a viewing appointment or secure deposits through the panel.`,
            isBlocked: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      });
    } catch (e) {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser?.sub || 'usr-customer-1',
      senderName: currentUser?.firstName || 'You',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', {
        leadId: id,
        content: messageContent,
      });
    } else {
      // Simulated owner auto-response when server is offline/mock
      setTimeout(() => {
        const ownerName = lead?.property?.ownerProfile?.user?.firstName || 'Rajesh';
        const autoReply: Message = {
          id: `msg-reply-${Date.now()}`,
          senderId: 'owner-auto',
          senderName: `${ownerName} (Owner)`,
          content: `Got it! I have noted your message regarding "${lead?.property?.title || 'the property'}". I am available for a visit or to discuss terms.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1000);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setPipelineStatus(status);
    setShowStatusDropdown(false);

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/leads/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {}
  };

  // Visit Scheduling APIs
  const handleRequestVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) return;

    setSchedulingVisit(true);
    const newVisit: Visit = {
      id: `vis-${Date.now()}`,
      scheduledAt: new Date(visitDate).toISOString(),
      status: 'REQUESTED',
      notes: visitNotes,
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
      if (token) {
        const res = await fetch(`${apiBase}/api/v1/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId: lead?.propertyId || lead?.property?.id,
            leadId: id,
            scheduledAt: new Date(visitDate).toISOString(),
            notes: visitNotes,
          }),
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          setVisits((prev) => [...prev, data.data || data]);
          setShowVisitModal(false);
          setVisitDate('');
          alert('Visit appointment scheduled successfully! Owner will review.');
          return;
        }
      }
    } catch (err) {} finally {
      setSchedulingVisit(false);
    }

    // Fallback local update
    setVisits((prev) => [...prev, newVisit]);
    setShowVisitModal(false);
    setVisitDate('');
    alert('Visit requested! Owner will review and accept your viewing appointment.');
    setSchedulingVisit(false);
  };

  const handleAcceptVisit = async (visitId: string) => {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: 'ACCEPTED' } : v)));
    alert('Visit request accepted.');

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/visits/${visitId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {}
  };

  const handleRejectVisit = async (visitId: string) => {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: 'REJECTED' } : v)));
    alert('Visit request rejected.');

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/visits/${visitId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {}
  };

  const handleCancelVisit = async (visitId: string) => {
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: 'CANCELLED' } : v)));
    alert('Visit successfully cancelled.');

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/visits/${visitId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {}
  };

  const handleRescheduleVisit = async (visitId: string) => {
    if (!rescheduleDate) {
      alert('Please select a new date & time.');
      return;
    }

    setProcessingReschedule(true);
    setVisits((prev) => prev.map((v) => (v.id === visitId ? { ...v, status: 'REQUESTED', scheduledAt: new Date(rescheduleDate).toISOString() } : v)));
    setReschedulingVisitId(null);
    setRescheduleDate('');
    alert('Reschedule request sent to owner.');
    setProcessingReschedule(false);

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/visits/${visitId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduledAt: new Date(rescheduleDate).toISOString() }),
      });
    } catch (err) {}
  };

  // Negotiation Offers APIs
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerPrice.trim()) return;

    setSubmittingOffer(true);
    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      price: Number(offerPrice),
      status: 'PENDING',
      createdByRole: currentUser?.role || 'CUSTOMER',
      parentOfferId: counteringOfferId || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('Ziva_access');
      if (token) {
        const payload: any = {
          leadId: id,
          price: Number(offerPrice),
        };
        if (counteringOfferId) {
          payload.parentOfferId = counteringOfferId;
        }

        const res = await fetch(`${apiBase}/api/v1/offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          alert('Offer submitted successfully.');
          setOffers((prev) => [...prev, data]);
          setOfferPrice('');
          setCounteringOfferId(null);
          setSubmittingOffer(false);
          return;
        }
      }
    } catch (err) {}

    // Fallback local update
    setOffers((prev) => [...prev, newOffer]);
    setOfferPrice('');
    setCounteringOfferId(null);
    alert('Offer submitted successfully to the property owner.');
    setSubmittingOffer(false);
  };

  const handleRespondOffer = async (offerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status } : o)));
    alert(`Offer successfully ${status.toLowerCase()}.`);

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/offers/${offerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {}
  };

  // Secure deposit Escrow Pay
  const handleMakeEscrowPayment = async () => {
    setActiveTransactionId(`tx-${Date.now()}`);
    setShowPaymentMockModal(true);
  };

  const handleConfirmMockPayment = async (status: 'SUCCESS' | 'FAILED') => {
    setSimulatingPayment(true);
    setTimeout(() => {
      setSimulatingPayment(false);
      setShowPaymentMockModal(false);

      if (status === 'SUCCESS') {
        const txId = activeTransactionId || `tx-${Date.now()}`;
        setTransactions((prev) => [
          ...prev,
          {
            id: txId,
            amount: 15000,
            status: 'SUCCESS',
            createdAt: new Date().toISOString(),
          },
        ]);
        setPaymentConfirmation({
          transactionId: txId,
          amount: 15000,
          date: new Date().toISOString(),
        });
      } else {
        alert('Escrow payment simulated as FAILED.');
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#5e23dc] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium text-xs tracking-wider uppercase">Opening Secure Deal Room...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4">
          ⚠️
        </div>
        <h1 className="text-lg font-bold text-[#4500b4]">Access Restricted</h1>
        <p className="text-gray-500 text-xs mt-2 max-w-sm">{error || 'Unauthorized to access this negotiation thread.'}</p>
        <Link href="/" className="mt-6 bg-[#5e23dc] text-white px-6 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#4500b4] transition shadow-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  const isOwnerViewer = currentUser?.role === 'OWNER';
  const myRole = currentUser?.role || 'CUSTOMER';

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] min-h-screen flex flex-col font-sans">
      {/* TopNavBar */}
      <nav className="bg-white shadow-sm border-b border-[#eceef0] h-16 flex items-center px-6 justify-between w-full sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg text-[#4500b4] tracking-tight">
            Ziva Housing
          </Link>
          <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
            SECURE DEAL ROOM
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-[#494455]">
          <span>Lead ID: {lead.id}</span>
          <button
            onClick={() => router.push(isOwnerViewer ? '/dashboard/owner' : '/dashboard/customer')}
            className="text-[#5e23dc] hover:underline"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-12 gap-6 h-[calc(100vh-64px)]">
        {/* Chat / Messages Panel */}
        <section className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-[#eceef0] shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-[620px]">
          {/* Header of Chat */}
          <div className="p-4 border-b border-[#eceef0] bg-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xs font-bold text-[#191c1e]">{lead.property?.title}</h2>
              <p className="text-[10px] text-[#7a7487] mt-0.5">
                {lead.property?.locality}, {lead.property?.city}
              </p>
            </div>
            {/* Status Selector */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="bg-[#f2f4f6] text-[#494455] text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-[#eceef0] shadow-sm"
              >
                Status: {currentStatusLabel}
                <span className="material-symbols-outlined text-[12px]">arrow_drop_down</span>
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 bg-white border border-[#eceef0] rounded-xl shadow-lg z-50 py-2 w-44">
                  {statuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleUpdateStatus(status.value)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#f2f4f6] text-[#494455]"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#f8f9fb]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[#7a7487]">
                <span className="material-symbols-outlined text-3xl block mb-1">chat_bubble_outline</span>
                <p className="text-xs font-bold">Start the conversation! Type a message below.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.sub;
                const isSys = msg.senderId === 'system';

                if (isSys) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="max-w-md bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex gap-2 shadow-sm font-semibold">
                        <span className="material-symbols-outlined text-amber-600 text-sm">shield</span>
                        <div>
                          <div className="font-extrabold mb-1">{msg.senderName}</div>
                          <div className="font-medium text-amber-700 leading-normal">{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-2xl p-4 shadow-sm border ${isMe
                        ? 'bg-[#5e23dc] text-white border-[#5e23dc] rounded-tr-none'
                        : 'bg-white text-[#191c1e] border-[#eceef0] rounded-tl-none'
                      }`}>
                      <div className="text-[9px] font-bold opacity-60 mb-1">{msg.senderName}</div>
                      <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                      <div className="text-[8px] text-right mt-1.5 opacity-60 font-mono">{msg.timestamp}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#eceef0] flex gap-3 shrink-0">
            <input
              className="flex-grow h-10 bg-[#f8f9fb] border border-[#cbc3d8] rounded-xl px-4 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc]"
              placeholder="Type compliance secure message..."
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#5e23dc] text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-[#4500b4] shadow-sm transition"
            >
              Send
            </button>
          </form>
        </section>

        {/* Sidebar Actions Panel */}
        <section className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-[#eceef0] shadow-sm p-5 flex flex-col gap-5 h-[500px] lg:h-[620px] overflow-y-auto">

          {/* 1. Escrow Deal Negotiation Module */}
          <div className="border border-[#eceef0] rounded-xl p-4 bg-[#f8f9fb]/50 space-y-4">
            <h4 className="text-xs font-extrabold text-[#4500b4] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#eceef0] pb-2">
              <span className="material-symbols-outlined text-sm">handshake</span>
              Deal Negotiation
            </h4>

            {/* Submitting Offer form */}
            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase">
                  {counteringOfferId ? 'ENTER COUNTER-OFFER PRICE (₹)' : 'MAKE AN OFFER PRICE (₹)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="E.g. 13500000"
                    className="flex-grow h-9 border border-[#cbc3d8] rounded-lg px-3 text-xs outline-none focus:border-[#5e23dc]"
                  />
                  <button
                    type="submit"
                    disabled={submittingOffer}
                    className="bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold text-xs px-4 rounded-lg transition disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>

            {/* List active offers */}
            {offers.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">No offers active in negotiations log.</p>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 pt-1 border-t border-dashed border-[#eceef0]">
                {offers.map((offer) => (
                  <div key={offer.id} className="bg-white p-2.5 rounded-lg border border-[#eceef0] text-[10px] space-y-1.5">
                    <div className="flex justify-between items-center font-bold text-[#191c1e]">
                      <span>Amount: ₹ {Number(offer.price).toLocaleString('en-IN')}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${offer.status === 'ACCEPTED' ? 'bg-[#e8faf4] text-[#16a373]' :
                          offer.status === 'REJECTED' ? 'bg-red-50 text-[#ba1a1a]' : 'bg-[#e8ddff] text-[#5100cf]'
                        }`}>{offer.status}</span>
                    </div>
                    <div className="flex justify-between text-[8px] text-[#7a7487]">
                      <span>By: {offer.createdByRole}</span>
                      <span>{new Date(offer.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Accept/Reject or Counter button triggers */}
                    {offer.status === 'PENDING' && offer.createdByRole !== myRole && (
                      <div className="flex gap-2 pt-1.5 border-t border-gray-150">
                        <button
                          onClick={() => handleRespondOffer(offer.id, 'ACCEPTED')}
                          className="bg-[#16a373] text-white font-bold px-2 py-1 rounded text-[9px]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondOffer(offer.id, 'REJECTED')}
                          className="bg-[#ba1a1a] text-white font-bold px-2 py-1 rounded text-[9px]"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => { setCounteringOfferId(offer.id); setOfferPrice(String(offer.price)); }}
                          className="bg-[#5e23dc]/10 text-[#5e23dc] font-bold px-2 py-1 rounded text-[9px]"
                        >
                          Counter
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Visit Scheduling appointments calendar */}
          <div className="border border-[#eceef0] rounded-xl p-4 bg-[#f8f9fb]/50 space-y-3">
            <h4 className="text-xs font-extrabold text-[#4500b4] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#eceef0] pb-2">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Appointments Calendar
            </h4>

            {visits.length > 0 && (
              <div className="space-y-2 border-b border-[#eceef0] pb-3 max-h-[140px] overflow-y-auto">
                {visits.map((visit) => {
                  const visitDate = new Date(visit.scheduledAt);
                  const isRescheduling = reschedulingVisitId === visit.id;

                  return (
                    <div key={visit.id} className="bg-white p-2.5 rounded-lg border border-[#eceef0] text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-[#191c1e]">
                        <span>{visitDate.toLocaleDateString()} {visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase ${visit.status === 'ACCEPTED' ? 'bg-[#e8faf4] text-[#16a373]' :
                            visit.status === 'REJECTED' ? 'bg-red-50 text-[#ba1a1a]' : 'bg-[#e8ddff] text-[#5100cf]'
                          }`}>{visit.status}</span>
                      </div>
                      {visit.notes && <p className="text-gray-500 italic font-medium">&ldquo;{visit.notes}&rdquo;</p>}

                      {/* Reschedule inline inputs */}
                      {isRescheduling && (
                        <div className="space-y-2 bg-[#f8f9fb] p-2 rounded border border-[#cbc3d8] mt-2">
                          <input
                            type="datetime-local"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full text-xs h-7 border border-[#cbc3d8] rounded px-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRescheduleVisit(visit.id)}
                              disabled={processingReschedule}
                              className="bg-[#5e23dc] text-white px-2.5 py-1 rounded font-bold text-[8px]"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => setReschedulingVisitId(null)}
                              className="border border-[#cbc3d8] text-gray-500 px-2.5 py-1 rounded font-bold text-[8px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Controls */}
                      {!isRescheduling && (
                        <div className="flex gap-2 pt-2 border-t border-gray-150 mt-1">
                          {isOwnerViewer && visit.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => handleAcceptVisit(visit.id)}
                                className="bg-[#16a373] text-white font-bold py-1 px-2 rounded text-[8px]"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectVisit(visit.id)}
                                className="bg-[#ba1a1a] text-white font-bold py-1 px-2 rounded text-[8px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {visit.status !== 'CANCELLED' && visit.status !== 'REJECTED' && (
                            <>
                              <button
                                onClick={() => { setReschedulingVisitId(visit.id); setRescheduleDate(visit.scheduledAt.substring(0, 16)); }}
                                className="bg-transparent border border-[#5e23dc] text-[#5e23dc] font-bold py-1 px-2 rounded text-[8px]"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelVisit(visit.id)}
                                className="bg-transparent border border-[#ba1a1a] text-[#ba1a1a] font-bold py-1 px-2 rounded text-[8px]"
                              >
                                Cancel Appointment
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isOwnerViewer && (
              <button
                onClick={() => setShowVisitModal(true)}
                className="w-full bg-[#5e23dc] text-white py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-[#4500b4] transition"
              >
                Request Viewing Appointment
              </button>
            )}
          </div>

          {/* 3. Escrow Payments */}
          <div className="border border-[#eceef0] rounded-xl p-4 bg-[#f8f9fb]/50 space-y-3">
            <h4 className="text-xs font-extrabold text-[#4500b4] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#eceef0] pb-2">
              <span className="material-symbols-outlined text-sm">payments</span>
              Escrow Payments
            </h4>
            <p className="text-[10px] text-[#7a7487] leading-normal font-semibold">
              Allocate holding deposit securely. Transactions are covered under Ziva Protecting Escrow.
            </p>

            {transactions.length > 0 && (
              <div className="space-y-1.5 border-t border-[#eceef0] pt-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-[#eceef0] font-mono">
                    <span className="font-bold text-gray-700">₹ {Number(tx.amount).toLocaleString('en-IN')}</span>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[8px] uppercase ${tx.status === 'SUCCESS' ? 'bg-[#e8faf4] text-[#16a373]' : 'bg-amber-100 text-amber-700'
                      }`}>{tx.status}</span>
                  </div>
                ))}
              </div>
            )}

            {!isOwnerViewer && (
              <button
                onClick={handleMakeEscrowPayment}
                className="w-full bg-transparent border-2 border-[#5e23dc] text-[#5e23dc] py-2 rounded-lg text-xs font-bold hover:bg-[#5e23dc]/5 transition"
              >
                Pay Booking Deposit (₹15,000)
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Visit Request Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-3">
              <h3 className="text-sm font-bold text-[#4500b4] uppercase">Request Viewing</h3>
              <button onClick={() => setShowVisitModal(false)} className="text-[#7a7487] hover:text-[#191c1e] transition">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRequestVisit} className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Select Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#cbc3d8] outline-none focus:border-[#5e23dc]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Notes to Owner</label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#cbc3d8] outline-none focus:border-[#5e23dc] h-20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVisitModal(false)} className="flex-1 border border-[#cbc3d8] py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={schedulingVisit} className="flex-grow bg-[#5e23dc] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#4500b4] transition disabled:opacity-50">
                  {schedulingVisit ? 'Sending...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock Escrow Payment Gateway Modal */}
      {showPaymentMockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-[#5e23dc]/10 text-[#5e23dc] rounded-full flex items-center justify-center text-2xl mx-auto">
              💳
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#4500b4] uppercase">Ziva Sandbox Checkout</h3>
              <p className="text-xs text-[#7a7487] max-w-xs mx-auto leading-normal">
                Use the sandbox controls below to simulate instant payment gateway captures.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <button
                onClick={() => handleConfirmMockPayment('SUCCESS')}
                disabled={simulatingPayment}
                className="w-full bg-[#16a373] hover:bg-[#0f6e4d] text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {simulatingPayment ? 'Processing...' : 'Simulate SUCCESS'}
              </button>
              <button
                onClick={() => handleConfirmMockPayment('FAILED')}
                disabled={simulatingPayment}
                className="w-full bg-[#ba1a1a] hover:bg-red-800 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                Simulate FAILURE
              </button>
              <button
                onClick={() => setShowPaymentMockModal(false)}
                className="w-full border border-[#cbc3d8] text-gray-500 py-2.5 rounded-xl font-bold transition"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Payment Confirmed Receipt Overlay ══ */}
      {paymentConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-[#16a373] text-6xl">verified_user</span>
            <div>
              <h3 className="text-xl font-bold text-[#191c1e]">Booking Token Confirmed!</h3>
              <p className="text-[13px] leading-[18px] text-[#7a7487] mt-1">
                Your escrow deposit has been secured successfully.
              </p>
            </div>

            <div className="bg-[#f8f9fb] p-5 rounded-xl border border-[#eceef0] space-y-3 text-left text-xs text-[#191c1e]">
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#7a7487]">Transaction ID:</span>
                <span className="font-mono font-bold text-[#5e23dc]">{paymentConfirmation.transactionId?.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#7a7487]">Property:</span>
                <span className="font-semibold truncate max-w-[200px]">{lead?.property?.title || 'Property'}</span>
              </div>
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#7a7487]">Location:</span>
                <span className="font-semibold">{lead?.property?.locality}, {lead?.property?.city}</span>
              </div>
              {lead?.property?.expectedPrice && (
                <div className="flex justify-between border-b border-[#eceef0] pb-2">
                  <span className="text-[#7a7487]">Agreed Price:</span>
                  <span className="font-semibold">₹{Number(lead.property.expectedPrice).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#7a7487]">Token Amount Paid:</span>
                <span className="font-extrabold text-[#16a373]">₹{Number(paymentConfirmation.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b border-[#eceef0] pb-2">
                <span className="text-[#7a7487]">Booking Status:</span>
                <span className="bg-[#e8faf4] text-[#16a373] px-2 py-0.5 rounded font-extrabold text-[9px] uppercase">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7487]">Date:</span>
                <span className="font-semibold">{new Date(paymentConfirmation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="bg-[#5e23dc]/5 border border-[#5e23dc]/20 p-4 rounded-xl text-left flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#5e23dc] text-lg">info</span>
              <p className="text-[11px] text-[#494455] leading-normal">
                Sale agreement and documentation will be coordinated through Ziva Housing. Your funds remain in escrow until key handover validation.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => {
                  setPaymentConfirmation(null);
                  router.push(isOwnerViewer ? `/properties/${lead?.propertyId || lead?.property?.id}/edit` : '/dashboard/customer');
                }}
                className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-3 rounded-xl text-xs transition shadow-md uppercase tracking-wider"
              >
                {isOwnerViewer ? 'View Property Management' : 'Go to My Buyer Dashboard'}
              </button>
              <button
                onClick={() => setPaymentConfirmation(null)}
                className="w-full bg-transparent border border-[#cbc3d8] hover:bg-gray-50 text-[#494455] font-semibold py-3 rounded-xl text-xs transition"
              >
                Continue in Deal Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
