'use client';

import { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'ENQUIRIES' | 'VISITS' | 'PAYMENTS' | 'SERVICES' | 'SYSTEM'>('ENQUIRIES');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    fetchNotifications(token);
    fetchUnreadCount(token);

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => {
      fetchNotifications(token);
      fetchUnreadCount(token);
    }, 30000);

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

  const fetchNotifications = async (token: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || data || []);
      }
    } catch (err) {
      // Silent
    }
  };

  const fetchUnreadCount = async (token: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch (err) {
      // Silent
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      // Silent
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    const token = localStorage.getItem('Ziva_access');
    if (!token) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Silent
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
        return type === 'PAYMENT_RECEIVED';
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
        className="relative w-8 h-8 rounded-full bg-[#f2f4f6] text-[#494455] hover:bg-[#eceef0] flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-lg">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#ba1a1a] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#eceef0] rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[420px] animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-3 border-b border-[#eceef0] flex justify-between items-center bg-[#f8f9fb]">
            <span className="font-bold text-[#191c1e]">Inbox Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-[#5e23dc] hover:text-[#4500b4] font-bold"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Sub-tabs header */}
          <div className="flex bg-[#f2f4f6] p-1 border-b border-[#eceef0] overflow-x-auto shrink-0">
            {(['ENQUIRIES', 'VISITS', 'PAYMENTS', 'SERVICES', 'SYSTEM'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition shrink-0 ${activeSubTab === tab
                    ? 'bg-white text-[#5e23dc] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          {/* List panel body */}
          <div className="overflow-y-auto flex-grow p-2 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic">
                No new notifications in this category.
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                  className={`p-3 rounded-lg border text-left transition-colors flex gap-2 cursor-pointer ${n.isRead
                      ? 'bg-white border-[#eceef0] hover:bg-[#f8f9fb]'
                      : 'bg-[#e8ddff]/25 border-[#5e23dc]/20 hover:bg-[#e8ddff]/35'
                    }`}
                >
                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-[11px] ${n.isRead ? 'text-[#191c1e]' : 'text-[#4500b4]'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5e23dc]" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#494455] leading-normal">{n.body}</p>
                    <span className="text-[9px] text-[#7a7487] block mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
