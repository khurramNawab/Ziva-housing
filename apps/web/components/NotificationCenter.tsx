'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export interface AppNotification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'ENQUIRY_CREATED',
    title: 'New Tenant Enquiry',
    body: 'Ananya Sharma initiated a deal room for Modern 3BHK Penthouse with Skyline View.',
    isRead: false,
    link: '/chat/lead-mock-rent-1',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'OFFER_RECEIVED',
    title: 'New Offer Submitted: ₹62,000/mo',
    body: 'Tenant submitted a negotiated rent offer for Indiranagar Penthouse.',
    isRead: false,
    link: '/chat/lead-mock-rent-1',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'VISIT_REQUESTED',
    title: 'Site Visit Requested',
    body: 'Vikram Malhotra requested a property walkthrough for Luxury 4BHK Villa.',
    isRead: false,
    link: '/dashboard/owner',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'PAYMENT_RECEIVED',
    title: 'Escrow Deposit Held: ₹15,000',
    body: 'Token booking deposit received and protected under Ziva Escrow Shield.',
    isRead: false,
    link: '/dashboard/owner',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'notif-5',
    type: 'PROPERTY_APPROVED',
    title: 'Listing Verified & Live',
    body: 'Ziva Legal Desk approved your Modern 3BHK Penthouse listing.',
    isRead: true,
    link: '/dashboard/owner',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

export default function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'ENQUIRIES' | 'VISITS' | 'PAYMENTS' | 'SERVICES' | 'SYSTEM'>('ENQUIRIES');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();

    // Refresh every 20 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    let localNotifs: AppNotification[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('Ziva_notifications');
        if (stored) {
          localNotifs = JSON.parse(stored);
        } else {
          localNotifs = DEFAULT_NOTIFICATIONS;
          localStorage.setItem('Ziva_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
        }
      } catch {
        localNotifs = DEFAULT_NOTIFICATIONS;
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('Ziva_access') : null;
    if (token) {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const apiNotifs = data.data || data || [];
          if (Array.isArray(apiNotifs) && apiNotifs.length > 0) {
            const merged = [...apiNotifs, ...localNotifs.filter(ln => !apiNotifs.some((an: any) => an.id === ln.id))];
            setNotifications(merged);
            setUnreadCount(merged.filter((n) => !n.isRead).length);
            return;
          }
        }
      } catch {}
    }

    setNotifications(localNotifs);
    setUnreadCount(localNotifs.filter((n) => !n.isRead).length);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('Ziva_notifications', JSON.stringify(updated));
      }
      return updated;
    });
    setUnreadCount(0);

    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/api/v1/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
    } catch {}
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n));
        if (typeof window !== 'undefined') {
          localStorage.setItem('Ziva_notifications', JSON.stringify(updated));
        }
        return updated;
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const token = localStorage.getItem('Ziva_access');
      if (token) {
        try {
          const apiBase = getApiBaseUrl();
          fetch(`${apiBase}/api/v1/notifications/${notification.id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
        } catch {}
      }
    }

    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  // Group notifications into tabs
  const getFilteredNotifications = () => {
    return notifications.filter((n) => {
      const type = n.type;
      if (activeSubTab === 'ENQUIRIES') {
        return type === 'ENQUIRY_CREATED' || type === 'NEW_MESSAGE' || type === 'OFFER_RECEIVED';
      }
      if (activeSubTab === 'VISITS') {
        return type === 'VISIT_REQUESTED' || type === 'VISIT_ACCEPTED' || type === 'VISIT_REJECTED' || type === 'VISIT_COMPLETED';
      }
      if (activeSubTab === 'PAYMENTS') {
        return type === 'PAYMENT_RECEIVED' || type === 'ESCROW_HELD' || type === 'ESCROW_RELEASED';
      }
      if (activeSubTab === 'SERVICES') {
        return type === 'BOOKING_CONFIRMED' || type === 'JOB_ASSIGNED' || type === 'REVIEW_REQUESTED';
      }
      if (activeSubTab === 'SYSTEM') {
        return type === 'PROPERTY_APPROVED' || type === 'PROPERTY_REJECTED' || type === 'ACCOUNT_VERIFIED' || type === 'ACCOUNT_SUSPENDED' || type === 'MESSAGE_FLAGGED';
      }
      return false;
    });
  };

  const filtered = getFilteredNotifications();

  return (
    <div className="relative font-sans text-xs" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-gray-100 text-gray-700 hover:bg-[#ede9fe] hover:text-[#5e23dc] flex items-center justify-center transition cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ba1a1a] text-white text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white border border-[#eceef0] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-[#eceef0] flex justify-between items-center bg-[#f8f9fb]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#191c1e]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#5e23dc]/10 text-[#5e23dc] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-[#5e23dc] hover:text-[#4500b4] font-bold hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Sub-tabs header */}
          <div className="flex bg-[#f2f4f6] p-1 border-b border-[#eceef0] overflow-x-auto shrink-0 gap-1">
            {(['ENQUIRIES', 'VISITS', 'PAYMENTS', 'SERVICES', 'SYSTEM'] as const).map((tab) => {
              const countInTab = notifications.filter((n) => {
                if (tab === 'ENQUIRIES') return (n.type === 'ENQUIRY_CREATED' || n.type === 'NEW_MESSAGE' || n.type === 'OFFER_RECEIVED') && !n.isRead;
                if (tab === 'VISITS') return (n.type === 'VISIT_REQUESTED' || n.type === 'VISIT_ACCEPTED') && !n.isRead;
                if (tab === 'PAYMENTS') return (n.type === 'PAYMENT_RECEIVED' || n.type === 'ESCROW_HELD') && !n.isRead;
                if (tab === 'SERVICES') return (n.type === 'BOOKING_CONFIRMED' || n.type === 'JOB_ASSIGNED') && !n.isRead;
                if (tab === 'SYSTEM') return (n.type === 'PROPERTY_APPROVED') && !n.isRead;
                return false;
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition shrink-0 flex items-center gap-1 cursor-pointer ${
                    activeSubTab === tab
                      ? 'bg-white text-[#5e23dc] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.toLowerCase()}
                  {countInTab > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5e23dc]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* List panel body */}
          <div className="overflow-y-auto flex-grow p-2.5 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 space-y-1">
                <span className="material-symbols-outlined text-3xl block text-gray-300">notifications_off</span>
                <p className="text-xs font-semibold">No notifications in this tab.</p>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    n.isRead
                      ? 'bg-white border-[#eceef0] hover:bg-gray-50'
                      : 'bg-[#5e23dc]/5 border-[#5e23dc]/25 hover:bg-[#5e23dc]/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type.startsWith('PAYMENT') ? 'bg-emerald-100 text-emerald-700' :
                    n.type.startsWith('VISIT') ? 'bg-amber-100 text-amber-700' :
                    n.type.startsWith('PROPERTY') ? 'bg-purple-100 text-[#5e23dc]' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="material-symbols-outlined text-base">
                      {n.type.startsWith('PAYMENT') ? 'payments' :
                       n.type.startsWith('VISIT') ? 'calendar_month' :
                       n.type.startsWith('PROPERTY') ? 'verified' : 'chat'}
                    </span>
                  </div>

                  <div className="flex-grow min-w-0 space-y-0.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className={`font-bold text-xs truncate ${n.isRead ? 'text-gray-900' : 'text-[#5e23dc]'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#5e23dc] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{n.body}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-gray-400 font-medium">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.link && (
                        <span className="text-[9px] font-bold text-[#5e23dc] flex items-center gap-0.5">
                          Open <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

