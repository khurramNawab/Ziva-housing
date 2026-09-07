'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportMessage {
  id: string;
  message: string;
  createdAt: string;
  isInternal: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function CustomerSupportPortal() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PROPERTY');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  // Details states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/auth/login');
      return;
    }
    setToken(accToken);
    fetchTickets(accToken);
  }, [router]);

  const fetchTickets = async (accToken: string) => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setTickets(json.data || json || []);
      }
    } catch (err) {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please fill out the ticket subject and description.');
      return;
    }

    setSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, description, category, priority }),
      });
      if (res.ok) {
        alert('Support ticket created successfully. Our team will review and reply shortly.');
        setSubject('');
        setDescription('');
        fetchTickets(token);
      } else {
        alert('Failed to raise ticket.');
      }
    } catch (err) {
      alert('Error creating support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewMessage('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setMessages(json.messages || json.data?.messages || []);
      }
    } catch (err) {
      alert('Failed to fetch ticket messages thread.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.data || data]);
        setNewMessage('');
      } else {
        alert('Failed to send reply.');
      }
    } catch (err) {
      alert('Error sending support reply message.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="bg-[#f8f9fb] text-[#191c1e] antialiased min-h-screen flex flex-col font-sans">
      {/* Unified Global Navbar */}
      <Navbar />

      {/* Main Grid Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8 flex-grow w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#191c1e]">Customer Help &amp; Support</h1>
          <p className="text-xs text-gray-500 mt-1">Raise support tickets regarding rental escrows, active listings, or home repair services.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Raise Ticket Form (Span 4) */}
          <div className="lg:col-span-4 bg-white border border-[#eceef0] p-6 rounded-2xl shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-xs text-[#191c1e] uppercase tracking-wider border-b border-[#eceef0] pb-2">Raise Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">SUBJECT</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summarize the issue..."
                  className="h-10 border border-[#cbc3d8] rounded-lg px-3 outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 border border-[#cbc3d8] rounded-lg px-2 outline-none text-[#191c1e]"
                  >
                    <option value="PROPERTY">PROPERTY</option>
                    <option value="SERVICES">SERVICES</option>
                    <option value="BILLING">BILLING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500">PRIORITY</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-10 border border-[#cbc3d8] rounded-lg px-2 outline-none text-[#191c1e]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500">DESCRIPTION</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="p-3 border border-[#cbc3d8] rounded-lg outline-none focus:border-[#5e23dc] h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold h-10 rounded-lg transition mt-2 text-xs"
              >
                {submitting ? 'Submitting...' : 'Raise Ticket'}
              </button>
            </form>
          </div>

          {/* Right Column: Tickets List and Conversation Room (Span 8) */}
          <div className="lg:col-span-8 space-y-6">

            <div className="bg-white border border-[#eceef0] p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#191c1e] border-b border-[#eceef0] pb-2">My Raised Support Tickets</h3>

              {loading ? (
                <div className="text-center py-6 text-xs text-gray-400">Loading support history...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">No tickets raised yet.</div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 rounded-xl border cursor-pointer flex justify-between items-center text-xs transition ${selectedTicket?.id === t.id
                          ? 'border-[#5e23dc] bg-[#5e23dc]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div>
                        <div className="font-bold text-[#191c1e]">{t.subject}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Category: {t.category} | Raised: {new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-[#e8ddff] text-[#5100cf] text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {t.priority}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${t.status === 'OPEN' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation chatroom logs for the selected ticket */}
            {selectedTicket && (
              <div className="bg-white border border-[#eceef0] p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-150">
                <div className="flex justify-between items-center border-b border-[#eceef0] pb-2">
                  <h3 className="font-bold text-xs text-[#191c1e] uppercase tracking-wider">Ticket Thread: {selectedTicket.subject}</h3>
                  <span className="text-[10px] font-bold text-gray-400">Status: {selectedTicket.status}</span>
                </div>

                <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                  {/* Original ticket description */}
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-[#eceef0] mr-auto max-w-[85%] text-xs space-y-1">
                    <span className="font-bold text-[9px] text-[#7a7487] uppercase block">Original Request</span>
                    <p className="text-[#191c1e] font-medium leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 max-w-[85%] ${msg.sender.role === 'ADMIN'
                          ? 'bg-[#e8ddff] border border-[#cbc3d8] ml-auto'
                          : 'bg-[#f2f4f6] border border-[#eceef0] mr-auto'
                        }`}
                    >
                      <div className="flex justify-between text-[8px] font-extrabold text-[#7a7487]">
                        <span>{msg.sender.firstName} ({msg.sender.role})</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[#191c1e] leading-relaxed font-medium">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' ? (
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-[#eceef0]">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message reply..."
                      className="flex-grow h-10 border border-[#cbc3d8] rounded-xl px-4 text-xs outline-none focus:border-[#5e23dc]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="bg-[#5e23dc] hover:bg-[#4500b4] text-white px-5 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-2.5 text-xs text-gray-400 font-semibold italic bg-[#f8f9fb] rounded-xl border border-dashed">
                    This support ticket has been closed.
                  </div>
                )}
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
