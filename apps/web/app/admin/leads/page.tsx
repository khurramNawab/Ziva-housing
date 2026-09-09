'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lead {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
  property: {
    id?: string;
    title: string;
    city: string;
    locality?: string;
    ownerProfile?: {
      user: {
        firstName: string;
        lastName: string;
        phone: string;
      };
    };
  };
  customer: {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  messages?: Array<{
    id: string;
    contentRaw: string;
    flaggedPatterns: any;
    createdAt: string;
  }>;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface SupportMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PropertyOption {
  id: string;
  title: string;
  city: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

const STAGES = [
  { stage: 'NEW', label: 'New Enquiry', dotColor: 'bg-[#5e23dc]', headerBg: 'bg-[#f2f4f6]' },
  { stage: 'CONTACTED', label: 'Contacted', dotColor: 'bg-amber-500', headerBg: 'bg-amber-50' },
  { stage: 'VISIT_SCHEDULED', label: 'Site Visit', dotColor: 'bg-purple-500', headerBg: 'bg-purple-50' },
  { stage: 'NEGOTIATION', label: 'Negotiation', dotColor: 'bg-indigo-500', headerBg: 'bg-indigo-50' },
  { stage: 'BOOKING', label: 'Booked / Escrow', dotColor: 'bg-[#16a373]', headerBg: 'bg-[#e8faf4]' },
];

export default function AdminLeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Leads CRM Database
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [overrideStage, setOverrideStage] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  // Add Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [propertiesList, setPropertiesList] = useState<PropertyOption[]>([]);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [newPropertyId, setNewPropertyId] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newStage, setNewStage] = useState('NEW');
  const [newNotes, setNewNotes] = useState('');
  const [creatingLead, setCreatingLead] = useState(false);

  // Helpdesk Tickets Database
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/auth/login');
      return;
    }
    setToken(accToken);
    fetchLeadsAndTickets(accToken);
    fetchOptions(accToken);
  }, [router]);

  const fetchLeadsAndTickets = async (accToken: string) => {
    setLoading(true);
    let localLeads: Lead[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('Ziva_user_enquiries') || localStorage.getItem('Ziva_owner_leads');
        if (raw) localLeads = JSON.parse(raw);
      } catch {}
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

      // Fetch CRM Leads
      const leadsRes = await fetch(`${apiBase}/api/v1/admin/leads?limit=100`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const leadsJson = await leadsRes.json();
      if (leadsRes.ok) {
        const apiLeads = leadsJson.data?.leads || leadsJson.leads || [];
        const merged = [...localLeads, ...apiLeads.filter((al: any) => !localLeads.some(ll => ll.id === al.id))];
        setLeadsList(merged.length > 0 ? merged : localLeads);
      } else {
        setLeadsList(localLeads);
      }

      // Fetch Tickets
      const ticketsRes = await fetch(`${apiBase}/api/v1/assistance/tickets`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const ticketsJson = await ticketsRes.json();
      if (ticketsRes.ok) {
        setTicketsList(ticketsJson.data || ticketsJson || []);
      }
    } catch {
      setLeadsList(localLeads);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async (accToken: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

      // Fetch users for dropdown
      const usersRes = await fetch(`${apiBase}/api/v1/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.data?.users || uData.users || []);
      }

      // Fetch properties for dropdown
      const propRes = await fetch(`${apiBase}/api/v1/properties?limit=100`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      if (propRes.ok) {
        const pData = await propRes.json();
        setPropertiesList(pData.data?.properties || pData.properties || pData.data || []);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyId || !newCustomerId) {
      alert('Please select both a Property and a Customer.');
      return;
    }

    setCreatingLead(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: newPropertyId,
          customerId: newCustomerId,
          status: newStage,
          notes: newNotes,
        }),
      });

      if (res.ok) {
        alert('New Lead created successfully!');
        setShowAddLeadModal(false);
        setNewPropertyId('');
        setNewCustomerId('');
        setNewNotes('');
        setNewStage('NEW');
        fetchLeadsAndTickets(token);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create lead.');
      }
    } catch {
      alert('Error creating lead. Please check your network connection.');
    } finally {
      setCreatingLead(false);
    }
  };

  const handleOverrideStage = async () => {
    if (!selectedLead || !overrideStage) return;

    setOverriding(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/admin/leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: overrideStage, reason: overrideReason }),
      });

      if (res.ok) {
        alert('Pipeline deal stage updated successfully.');
        fetchLeadsAndTickets(token);
        setSelectedLead(null);
        setOverrideStage('');
        setOverrideReason('');
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Override stage action failed.');
      }
    } catch {
      alert('Failed to override deals pipeline stage.');
    } finally {
      setOverriding(false);
    }
  };

  const handleInspectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTicketMessages(data.messages || []);
      }
    } catch {
      alert('Failed to load support message thread.');
    }
  };

  const handleSendTicketReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicketMessages((prev) => [...prev, data]);
        setReplyMessage('');
      } else {
        alert('Failed to send reply.');
      }
    } catch {
      alert('Error sending support reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!selectedTicket) return;

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiBase}/api/v1/assistance/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSelectedTicket((prev) => prev ? { ...prev, status } : null);
        fetchLeadsAndTickets(token);
        alert(`Ticket status updated to ${status}.`);
      } else {
        alert('Failed to update status.');
      }
    } catch {
      alert('Error updating ticket status.');
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leadsList;
    const q = searchQuery.toLowerCase();
    return leadsList.filter((l) => {
      const pTitle = l.property?.title?.toLowerCase() || '';
      const pCity = l.property?.city?.toLowerCase() || '';
      const cName = `${l.customer?.firstName || ''} ${l.customer?.lastName || ''}`.toLowerCase();
      const cPhone = l.customer?.phone?.toLowerCase() || '';
      const id = l.id?.toLowerCase() || '';
      return pTitle.includes(q) || pCity.includes(q) || cName.includes(q) || cPhone.includes(q) || id.includes(q);
    });
  }, [leadsList, searchQuery]);

  return (
    <div className="space-y-12">
      {/* SECTION 1: CRM Leads Kanban Board */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#191c1e]">Leads Pipeline — CRM Board</h1>
            <p className="text-xs text-[#494455] mt-1">
              Track and manage all real property enquiries live across pipeline stages ({leadsList.length} total leads).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7487] text-sm">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[#eceef0] rounded-xl text-xs text-[#191c1e] placeholder:text-[#7a7487] focus:outline-none focus:border-[#5e23dc] focus:ring-1 focus:ring-[#5e23dc]/20 w-56 transition-all"
                placeholder="Search leads, buyer, city..."
                type="text"
              />
            </div>
            <button
              onClick={() => {
                setNewStage('NEW');
                setShowAddLeadModal(true);
              }}
              className="px-4 py-2 bg-[#5e23dc] hover:bg-[#4500b4] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-[#5e23dc]/25"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Lead
            </button>
            <button
              onClick={() => fetchLeadsAndTickets(token)}
              title="Refresh leads"
              className="p-2 border border-[#eceef0] rounded-xl bg-white text-[#494455] hover:bg-[#f2f4f6] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>

        {/* Kanban Board: 5 columns */}
        {loading ? (
          <div className="flex items-center justify-center h-44">
            <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((col) => {
                const stageLeads = filteredLeads.filter((l) => l.status === col.stage);
                return (
                  <div key={col.stage} className="w-[300px] flex flex-col flex-shrink-0 bg-[#f8f9fb] rounded-2xl overflow-hidden border border-[#eceef0] shadow-sm">
                    {/* Column Header */}
                    <div className={`${col.headerBg} px-4 py-3 flex items-center justify-between border-b border-[#eceef0] flex-shrink-0`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} flex-shrink-0`} />
                        <h3 className="text-xs font-bold text-[#191c1e] uppercase tracking-wider">{col.label}</h3>
                        <span className="bg-white border border-[#eceef0] text-[#7a7487] text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {stageLeads.length}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setNewStage(col.stage);
                          setShowAddLeadModal(true);
                        }}
                        title={`Add lead to ${col.label}`}
                        className="text-[#7a7487] hover:text-[#5e23dc] transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[220px] max-h-[540px]">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white rounded-xl border border-[#eceef0] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#5e23dc] bg-[#e8ddff]/60 px-1.5 py-0.5 rounded">
                              {lead.id}
                            </span>
                            <span className="text-[9px] text-[#7a7487]">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-[#191c1e] leading-tight mb-2">
                            {lead.property?.title || 'Untitled Property'}
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#7a7487] text-xs">person</span>
                            <span className="text-[11px] text-[#494455] font-medium">
                              {lead.customer?.firstName} {lead.customer?.lastName || ''}
                            </span>
                          </div>

                          {lead.customer?.phone && (
                            <div className="flex items-center gap-2 mb-1 text-[#7a7487]">
                              <span className="material-symbols-outlined text-xs">phone</span>
                              <span className="text-[10px] font-mono">{lead.customer.phone}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[#7a7487] text-xs">location_city</span>
                            <span className="text-[11px] text-[#494455]">{lead.property?.city || 'City N/A'}</span>
                          </div>

                          {lead.notes && (
                            <p className="text-[10px] text-[#7a7487] bg-[#f8f9fb] p-2 rounded-lg mb-3 italic line-clamp-2">
                              &ldquo;{lead.notes}&rdquo;
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setOverrideStage(lead.status);
                              }}
                              className="w-full text-[10px] font-bold bg-[#e8ddff] text-[#4500b4] py-1.5 rounded-lg hover:bg-[#5e23dc] hover:text-white transition-colors"
                            >
                              Update / Move Stage →
                            </button>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#7a7487] border border-dashed border-[#eceef0] rounded-xl">
                          <span className="material-symbols-outlined text-2xl text-[#cbc3d8] mb-1">inbox</span>
                          <p className="text-[11px] font-medium">No leads in this stage</p>
                          <button
                            onClick={() => {
                              setNewStage(col.stage);
                              setShowAddLeadModal(true);
                            }}
                            className="mt-2 text-[10px] text-[#5e23dc] font-bold hover:underline"
                          >
                            + Add Lead
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add Card Button */}
                    <div className="p-3 border-t border-[#eceef0] flex-shrink-0 bg-white">
                      <button
                        onClick={() => {
                          setNewStage(col.stage);
                          setShowAddLeadModal(true);
                        }}
                        className="w-full text-[11px] font-semibold text-[#7a7487] hover:text-[#5e23dc] flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-[#f2f4f6] transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Lead
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Helpdesk Customer Support Tickets */}
      <section className="space-y-6 border-t border-[#cbc3d8]/40 pt-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#191c1e]">Helpdesk Customer Support Tickets</h2>
            <p className="text-xs text-[#7a7487] mt-1">Review active support center logs, issue warnings, and reply to inquiries.</p>
          </div>
          <span className="text-xs font-bold text-[#5e23dc] bg-[#e8ddff] px-3 py-1 rounded-full">
            {ticketsList.length} Active Tickets
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-44">
            <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          </div>
        ) : ticketsList.length === 0 ? (
          <div className="bg-white border border-[#eceef0] rounded-2xl p-12 text-center text-[#7a7487]">
            <span className="material-symbols-outlined text-4xl text-[#cbc3d8] mb-2">support_agent</span>
            <p className="text-sm font-bold text-[#191c1e]">No Support Tickets</p>
            <p className="text-xs text-[#7a7487] mt-1">All customer helpdesk tickets are currently cleared.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#eceef0] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase tracking-wider border-b border-[#eceef0]">
                <tr>
                  <th className="px-5 py-3">Ticket Subject</th>
                  <th className="px-5 py-3">Category / Priority</th>
                  <th className="px-5 py-3">Creator Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {ticketsList.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#f2f4f6]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sm text-[#191c1e]">{ticket.subject}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 italic">{ticket.description}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#191c1e] block">{ticket.category}</span>
                      <span className={`inline-block text-[8px] font-extrabold px-1 rounded uppercase tracking-wider mt-0.5 ${ticket.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {ticket.priority} PRIORITY
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#191c1e]">
                      {ticket.user?.firstName} {ticket.user?.lastName}
                      <div className="text-[9px] text-[#7a7487] mt-0.5">{ticket.user?.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ticket.status === 'RESOLVED' ? 'bg-[#e8faf4] text-[#16a373]' :
                        ticket.status === 'OPEN' ? 'bg-red-50 text-red-700' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleInspectTicket(ticket)}
                        className="bg-[#5e23dc]/10 hover:bg-[#5e23dc]/25 text-[#5e23dc] font-bold px-3 py-1.5 rounded-xl text-[10px]"
                      >
                        Inspect &amp; Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE LEAD MODAL DIALOG */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
              <div>
                <h3 className="font-bold text-base text-[#191c1e]">Create New Lead</h3>
                <p className="text-xs text-[#7a7487]">Manually record a property inquiry in the CRM pipeline</p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#494455] uppercase">Target Property *</label>
                <select
                  required
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#eceef0] focus:border-[#5e23dc] rounded-xl px-3 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="">-- Select Property --</option>
                  {propertiesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.city})
                    </option>
                  ))}
                </select>
                {propertiesList.length === 0 && (
                  <p className="text-[10px] text-amber-600">No properties loaded yet or loading...</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#494455] uppercase">Customer / Buyer User *</label>
                <select
                  required
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#eceef0] focus:border-[#5e23dc] rounded-xl px-3 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="">-- Select Customer User --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.phone})
                    </option>
                  ))}
                </select>
                {usersList.length === 0 && (
                  <p className="text-[10px] text-amber-600">No users found. Ensure users exist in the database.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#494455] uppercase">Initial Pipeline Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#eceef0] focus:border-[#5e23dc] rounded-xl px-3 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="NEW">NEW - Fresh Enquiry</option>
                  <option value="CONTACTED">CONTACTED - Outreach Made</option>
                  <option value="VISIT_SCHEDULED">VISIT SCHEDULED - Site Tour</option>
                  <option value="NEGOTIATION">NEGOTIATION - Terms Discussion</option>
                  <option value="BOOKING">BOOKING - Token / Escrow</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#494455] uppercase">Notes / Message</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Buyer interested in immediate site visit this Saturday..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-[#f8f9fb] border border-[#eceef0] focus:border-[#5e23dc] rounded-xl px-3 py-2 text-xs outline-none text-[#191c1e]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="flex-1 py-2.5 border border-[#eceef0] text-[#494455] rounded-xl text-xs font-bold hover:bg-[#f2f4f6] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  {creatingLead ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERRIDE STAGE MODAL DIALOG */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
              <div>
                <h3 className="font-bold text-sm text-[#191c1e]">Update Pipeline Stage</h3>
                <p className="text-[10px] text-gray-500 font-mono">Lead ID: {selectedLead.id}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Target Stage</label>
                <select
                  value={overrideStage}
                  onChange={(e) => setOverrideStage(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-2 py-2.5 text-xs outline-none text-[#191c1e]"
                >
                  <option value="NEW">NEW - Fresh Enquiry</option>
                  <option value="CONTACTED">CONTACTED - Outreach Made</option>
                  <option value="VISIT_SCHEDULED">VISIT_SCHEDULED - Site Tour</option>
                  <option value="NEGOTIATION">NEGOTIATION - Deal Room</option>
                  <option value="BOOKING">BOOKING - Token / Escrow</option>
                  <option value="CLOSED_WON">CLOSED_WON - Deal Closed 🎉</option>
                  <option value="CLOSED_LOST">CLOSED_LOST - Cancelled / Dropped</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Change Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Token payment received in escrow, moving to booking"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2.5 text-xs outline-none text-[#191c1e]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="flex-1 py-2.5 border border-[#eceef0] text-[#494455] rounded-xl text-xs font-bold hover:bg-[#f2f4f6] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={overriding}
                onClick={handleOverrideStage}
                className="flex-1 bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                {overriding ? 'Updating...' : 'Apply Stage Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT TICKET DRAWER DIALOG */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-end z-50 p-4 font-sans text-[#191c1e]">
          <div className="bg-white h-full max-w-lg w-full p-6 space-y-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[#eceef0] pb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#191c1e]">{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-gray-500">Ticket Status: {selectedTicket.status}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Status Update Quick Buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#494455] uppercase">Update Helpdesk Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateTicketStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold transition ${selectedTicket.status === st
                        ? 'bg-[#5e23dc] text-white'
                        : 'bg-[#f2f4f6] text-[#494455] hover:bg-gray-200'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message History Thread */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#494455] uppercase">Ticket Message Thread</h4>
                <div className="space-y-3 bg-[#f8f9fb] border border-[#cbc3d8]/40 p-4 rounded-2xl max-h-[300px] overflow-y-auto">
                  <div className="p-3 bg-white rounded-xl border border-[#eceef0] space-y-1">
                    <p className="font-bold text-[10px] text-[#4500b4]">
                      {selectedTicket.user?.firstName} (Customer Inquiry)
                    </p>
                    <p className="text-xs text-[#191c1e] leading-relaxed">{selectedTicket.description}</p>
                    <p className="text-[8px] text-gray-400 text-right">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border border-[#eceef0] space-y-1 ${msg.sender?.role === 'ADMIN' ? 'bg-[#e8ddff]/40 ml-6' : 'bg-white mr-6'
                        }`}
                    >
                      <p className="font-bold text-[10px] text-[#4500b4]">
                        {msg.sender?.firstName} ({msg.sender?.role})
                      </p>
                      <p className="text-xs text-[#191c1e] leading-relaxed">{msg.message}</p>
                      <p className="text-[8px] text-gray-400 text-right">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reply Composer Editor */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <textarea
                rows={3}
                placeholder="Type reply message to dispatch back to customer desk..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full bg-[#f2f4f6] border border-[#cbc3d8] rounded-xl px-3 py-2 text-xs outline-none text-[#191c1e]"
              />
              <button
                type="button"
                disabled={sendingReply}
                onClick={handleSendTicketReply}
                className="w-full bg-[#5e23dc] hover:bg-[#4500b4] text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">reply</span> Send Reply Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
