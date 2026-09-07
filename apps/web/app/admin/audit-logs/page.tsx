'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: any;
  after: any;
  createdAt: string;
  admin: {
    firstName: string;
    lastName: string;
  };
}

interface AdminAlert {
  id: string;
  type: string;
  severity: string;
  details: string;
  entityType?: string;
  entityId?: string;
  isResolved: boolean;
  createdAt: string;
}

interface BypassIncident {
  id: string;
  leadId: string;
  senderId: string;
  messageRaw: string;
  detectedPatterns: any;
  policyApplied: string;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  lead: {
    property: {
      title: string;
    };
  };
}

interface SystemSetting {
  key: string;
  value: string;
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // Compliance & Bypass database
  const [alertsList, setAlertsList] = useState<AdminAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED' | 'CRITICAL'>('ALL');
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({
    type: 'PRICE_OUTLIER',
    severity: 'HIGH',
    details: '',
    entityType: 'Property',
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  const [incidentsList, setIncidentsList] = useState<BypassIncident[]>([]);
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);

  // Audit Logs database
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogSearchAction, setAuditLogSearchAction] = useState('');
  const [auditLogSearchEntity, setAuditLogSearchEntity] = useState('');

  useEffect(() => {
    const accToken = localStorage.getItem('Ziva_access');
    if (!accToken) {
      router.push('/auth/login');
      return;
    }
    setToken(accToken);
    fetchComplianceAndLogs(accToken);
  }, [router]);

  const fetchComplianceAndLogs = async (accToken: string) => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Fetch compliance data
      const [alertsRes, incidentsRes, settingsRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/alerts`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/bypass-incidents`, { headers: { Authorization: `Bearer ${accToken}` } }),
        fetch(`${apiBase}/api/v1/admin/settings`, { headers: { Authorization: `Bearer ${accToken}` } }),
      ]);

      if (alertsRes.ok) {
        const json = await alertsRes.json();
        setAlertsList(json.data || json || []);
      }
      if (incidentsRes.ok) {
        const json = await incidentsRes.json();
        setIncidentsList(json.data || json || []);
      }
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const settings = settingsJson.data || settingsJson || [];
        setSettingsList(settings);
      }

      // Fetch Audit Logs
      const query = `action=${auditLogSearchAction}&entityType=${auditLogSearchEntity}`;
      const logsRes = await fetch(`${apiBase}/api/v1/admin/audit-logs?limit=50&${query}`, {
        headers: { Authorization: `Bearer ${accToken}` },
      });
      const logsJson = await logsRes.json();
      if (logsRes.ok) {
        setAuditLogs(logsJson.data?.logs || logsJson.logs || []);
      }
    } catch (err) {
      alert('Error fetching compliance alerts and system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async (policy: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/settings/bypassPolicy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: policy }),
      });
      if (res.ok) {
        alert(`Bypass policy successfully set to: ${policy}`);
        fetchComplianceAndLogs(token);
      } else {
        alert('Failed to update compliance policy.');
      }
    } catch (err) {
      alert('Failed to update system settings.');
    }
  };

  const handleToggleResolveAlert = async (alertId: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Status toggled by Admin' }),
      });
      if (res.ok) {
        const updated = await res.json();
        const data = updated.data || updated;
        setAlertsList((prev) => prev.map((a) => (a.id === alertId ? { ...a, isResolved: data.isResolved } : a)));
      } else {
        alert('Failed to update alert resolution status.');
      }
    } catch (err) {
      alert('Failed to update compliance alert.');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to permanently delete this compliance alert?')) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      } else {
        alert('Failed to delete alert.');
      }
    } catch (err) {
      alert('Error deleting compliance alert.');
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.details.trim()) {
      alert('Please enter alert details.');
      return;
    }
    setCreatingAlert(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiBase}/api/v1/admin/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAlertForm),
      });
      if (res.ok) {
        const created = await res.json();
        const alertData = created.data || created;
        setAlertsList((prev) => [alertData, ...prev]);
        setShowCreateAlertModal(false);
        setNewAlertForm({
          type: 'PRICE_OUTLIER',
          severity: 'HIGH',
          details: '',
          entityType: 'Property',
        });
      } else {
        alert('Failed to create compliance alert.');
      }
    } catch (err) {
      alert('Error creating compliance alert.');
    } finally {
      setCreatingAlert(false);
    }
  };

  const activeBypassPolicy = settingsList.find((s) => s.key === 'bypassPolicy')?.value || 'MASK';

  const filteredAlerts = alertsList.filter((a) => {
    if (alertFilter === 'UNRESOLVED') return !a.isResolved;
    if (alertFilter === 'RESOLVED') return a.isResolved;
    if (alertFilter === 'CRITICAL') return a.severity === 'CRITICAL' || a.severity === 'HIGH';
    return true;
  });

  return (
    <div className="space-y-12">
      {/* SECTION 1: Compliance Controls, alerts, and bypass incidents */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Compliance &amp; System Settings</h1>
            <p className="text-xs text-gray-500 mt-1">Configure moderation policies, dismiss security alerts, and inspect bypass incidents.</p>
          </div>

          {/* Policy controls */}
          <div className="bg-white border border-[#cbc3d8] p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-sm shrink-0">
            <span className="text-xs font-bold text-[#191c1e] uppercase">Bypass Filter Policy:</span>
            <div className="flex gap-2">
              {[
                { key: 'ALLOW', label: 'Allow & Flag' },
                { key: 'MASK', label: 'Mask Contacts' },
                { key: 'BLOCK', label: 'Hard Block' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleUpdatePolicy(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition uppercase ${
                    activeBypassPolicy === p.key ? 'bg-[#5e23dc] text-white' : 'bg-[#f2f4f6] text-[#494455] hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-44">
            <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active alerts panel */}
            <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
              <div className="border-b border-[#eceef0] pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#4500b4]">Compliance alerts list</h3>
                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {alertsList.filter((a) => !a.isResolved).length} Urgent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateAlertModal(true)}
                    className="bg-[#5e23dc] hover:bg-[#4500b4] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">add_alert</span> + Trigger Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchComplianceAndLogs(token)}
                    title="Refresh alerts"
                    className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#494455] transition"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'UNRESOLVED', 'CRITICAL', 'RESOLVED'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAlertFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                      alertFilter === tab ? 'bg-[#5e23dc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab} ({tab === 'ALL' ? alertsList.length : tab === 'UNRESOLVED' ? alertsList.filter(a => !a.isResolved).length : tab === 'RESOLVED' ? alertsList.filter(a => a.isResolved).length : alertsList.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length})
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center bg-[#f8f9fb] rounded-xl border border-dashed border-[#eceef0]">
                    <span className="material-symbols-outlined text-3xl text-gray-400 block mb-1">verified_user</span>
                    <p className="text-xs text-gray-500 font-medium">No alerts matching this filter.</p>
                  </div>
                ) : (
                  filteredAlerts.map((alertItem) => (
                    <div
                      key={alertItem.id}
                      className={`border p-4 rounded-xl space-y-2 transition-all ${
                        alertItem.isResolved
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : alertItem.severity === 'CRITICAL' || alertItem.severity === 'HIGH'
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-[#eceef0] bg-[#f8f9fb]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              alertItem.severity === 'CRITICAL'
                                ? 'bg-red-600 text-white'
                                : alertItem.severity === 'HIGH'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : alertItem.severity === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alertItem.severity}
                          </span>
                          <span className="text-[10px] font-bold text-[#4500b4]">
                            {alertItem.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(alertItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#191c1e] leading-relaxed font-medium">{alertItem.details}</p>
                      
                      <div className="flex items-center justify-between pt-1 border-t border-[#eceef0]/60">
                        <button
                          type="button"
                          onClick={() => handleToggleResolveAlert(alertItem.id)}
                          className={`text-[9px] font-bold py-1 px-3 rounded-lg transition inline-flex items-center gap-1 ${
                            alertItem.isResolved
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {alertItem.isResolved ? 'history' : 'check_circle'}
                          </span>
                          {alertItem.isResolved ? 'Re-open Alert' : 'Mark Resolved'}
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {alertItem.isResolved && (
                            <span className="text-[9px] text-[#16a373] font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">check</span> Resolved
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(alertItem.id)}
                            title="Delete alert"
                            className="text-gray-400 hover:text-red-600 transition p-1"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contact bypass incidents list */}
            <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#4500b4] border-b border-[#eceef0] pb-2 flex justify-between items-center">
                <span>Contact exchange bypass logs</span>
                <span className="bg-[#e8ddff] text-[#4500b4] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {incidentsList.length} Flagged
                </span>
              </h3>
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {incidentsList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic p-4 text-center">No bypass incidents recorded.</p>
                ) : (
                  incidentsList.map((inc) => (
                    <div key={inc.id} className="border border-[#eceef0] p-4 rounded-xl space-y-2 bg-[#f8f9fb]">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h4 className="font-bold text-xs text-[#191c1e]">
                            Sender: {inc.sender?.firstName || 'User'}
                          </h4>
                          <p className="text-[10px] text-gray-500">Property: {inc.lead?.property?.title || 'General Chat'}</p>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                          {inc.policyApplied}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#494455] bg-white p-2.5 rounded-lg border border-[#eceef0]">
                        <p className="italic">&quot;{inc.messageRaw}&quot;</p>
                        {inc.detectedPatterns && (
                          <div className="mt-2 text-[9px] text-red-600 font-bold">
                            Matches: {Object.keys(inc.detectedPatterns).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Audit Logs Database view */}
      <section className="space-y-6 border-t border-[#cbc3d8]/40 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#191c1e]">System Administration Audit Logs</h2>
            <p className="text-xs text-gray-500 mt-1 font-sans">Full trace records of all critical actions performed by portal administrators.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Filter Action (e.g. USER_BLOCK)"
              value={auditLogSearchAction}
              onChange={(e) => setAuditLogSearchAction(e.target.value)}
              className="h-10 bg-white border border-[#cbc3d8] rounded-xl px-4 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] w-full md:w-44"
            />
            <input
              type="text"
              placeholder="Entity Type (e.g. USER)"
              value={auditLogSearchEntity}
              onChange={(e) => setAuditLogSearchEntity(e.target.value)}
              className="h-10 bg-white border border-[#cbc3d8] rounded-xl px-4 text-xs text-[#191c1e] outline-none focus:border-[#5e23dc] w-36"
            />
            <button
              onClick={() => fetchComplianceAndLogs(token)}
              className="bg-[#5e23dc] hover:bg-[#4500b4] text-white h-10 px-4 rounded-xl text-xs font-bold transition shrink-0"
            >
              Filter Logs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-44">
            <div className="animate-spin w-8 h-8 border-2 border-[#5e23dc] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="bg-white border border-[#eceef0] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2f4f6] text-[#494455] font-bold uppercase tracking-wider border-b border-[#eceef0]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Administrator</th>
                  <th className="px-5 py-3">Action performed</th>
                  <th className="px-5 py-3">Target Entity Type / ID</th>
                  <th className="px-5 py-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f2f4f6]/50 transition-colors">
                    <td className="px-5 py-4 text-gray-500 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#191c1e]">
                      {log.admin?.firstName} {log.admin?.lastName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#4500b4]">{log.entityType}</div>
                      <div className="text-[9px] text-[#7a7487] mt-0.5">{log.entityId}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-[#494455]">
                      {log.after ? JSON.stringify(log.after) : (log.before ? JSON.stringify(log.before) : 'No delta')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE ALERT MODAL */}
      {showCreateAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-[#191c1e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5e23dc]">warning</span>
                Create Compliance &amp; Fraud Alert
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateAlertModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Alert Type</label>
                <select
                  value={newAlertForm.type}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#5e23dc]"
                >
                  <option value="PRICE_OUTLIER">Price Outlier / Market Deviation</option>
                  <option value="DUPLICATE_PHONE">Duplicate Contact Numbers</option>
                  <option value="DUPLICATE_PHOTOS">Stolen / Duplicate Photos</option>
                  <option value="DOCUMENT_DISCREPANCY">Fake / Discrepant Vendor Document</option>
                  <option value="SPAM_ENQUIRY">Spam / Bot Lead Inquiries</option>
                  <option value="POLICY_VIOLATION">Terms &amp; Compliance Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewAlertForm({ ...newAlertForm, severity: sev })}
                      className={`py-1.5 rounded-lg font-bold text-[10px] border transition ${
                        newAlertForm.severity === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-red-600 text-white border-red-600'
                            : sev === 'HIGH'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : sev === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Entity Type</label>
                <select
                  value={newAlertForm.entityType}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, entityType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#5e23dc]"
                >
                  <option value="Property">Property Listing</option>
                  <option value="User">User / Agent Account</option>
                  <option value="VendorProfile">Vendor Professional Profile</option>
                  <option value="Lead">Lead / Transaction</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Alert Details / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this compliance alert is flagged..."
                  value={newAlertForm.details}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, details: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs outline-none focus:border-[#5e23dc]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAlertModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAlert}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5e23dc] hover:bg-[#4500b4] text-white transition disabled:opacity-50"
                >
                  {creatingAlert ? 'Saving...' : 'Save & Trigger Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
