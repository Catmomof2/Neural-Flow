
import React, { useState, useMemo } from 'react';
import { Lead, LeadType, LeadStatus } from '../types';

interface AdminDashboardProps {
  leads: Lead[];
  onClose: () => void;
  onUpdateLeads: (leads: Lead[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ leads, onClose, onUpdateLeads }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LeadType | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || lead.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [leads, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: leads.length,
    signups: leads.filter(l => l.type === LeadType.SIGNUP).length,
    contacts: leads.filter(l => l.type === LeadType.CONTACT).length,
    new: leads.filter(l => l.status === LeadStatus.NEW).length,
    referrals: leads.reduce((acc, curr) => acc + (curr.referralCount || 0), 0)
  }), [leads]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const bulkDelete = () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;
    const nextLeads = leads.filter(l => !selectedIds.has(l.id));
    onUpdateLeads(nextLeads);
    setSelectedIds(new Set());
  };

  const bulkMarkProcessed = () => {
    const nextLeads = leads.map(l => 
      selectedIds.has(l.id) ? { ...l, status: LeadStatus.PROCESSED } : l
    );
    onUpdateLeads(nextLeads);
    setSelectedIds(new Set());
  };

  const exportLeads = () => {
    const headers = ['Email', 'Type', 'Status', 'Referral Code', 'Referrals', 'Date'];
    const csvData = filteredLeads.map(l => [
      l.email,
      l.type,
      l.status,
      l.referralCode,
      l.referralCount,
      new Date(l.timestamp).toISOString()
    ].join(','));
    
    const blob = new Blob([[headers.join(','), ...csvData].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `neuralflow-leads-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">A</div>
          <h1 className="text-xl font-bold tracking-tight">Admin <span className="text-slate-500">Center</span></h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportLeads}
            className="text-slate-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            Exit Dashboard
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Leads', val: stats.total, color: 'text-white' },
            { label: 'New', val: stats.new, color: 'text-indigo-400' },
            { label: 'Waitlist', val: stats.signups, color: 'text-emerald-400' },
            { label: 'Total Referrals', val: stats.referrals, color: 'text-amber-400' },
            { label: 'Inbound Messages', val: stats.contacts, color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="flex gap-4 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none min-w-[140px]"
            >
              <option value="ALL">All Types</option>
              <option value={LeadType.SIGNUP}>Waitlist</option>
              <option value={LeadType.CONTACT}>Support</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                <span className="text-xs text-slate-500 mr-2">{selectedIds.size} selected</span>
                <button 
                  onClick={bulkMarkProcessed}
                  className="bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 hover:bg-indigo-600/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Mark Processed
                </button>
                <button 
                  onClick={bulkDelete}
                  className="bg-rose-600/10 text-rose-400 border border-rose-600/20 hover:bg-rose-600/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/30 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500" 
                  />
                </th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Source</th>
                <th className="px-6 py-5">Referral Details</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 italic">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`group hover:bg-indigo-600/[0.03] transition-colors ${selectedIds.has(lead.id) ? 'bg-indigo-600/[0.05]' : ''}`}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{lead.email}</span>
                        {lead.message && (
                          <span className="text-xs text-slate-500 mt-1 line-clamp-1 italic">{lead.message}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                        lead.type === LeadType.SIGNUP ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
                      }`}>
                        {lead.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {lead.type === LeadType.SIGNUP ? (
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Code</span>
                            <span className="font-mono text-xs text-slate-300">{lead.referralCode}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Referrals</span>
                            <span className="font-bold text-indigo-400">{lead.referralCount}</span>
                          </div>
                          {lead.referredBy && (
                            <div className="flex flex-col">
                               <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Referred By</span>
                               <span className="text-xs text-amber-500">{lead.referredBy}</span>
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                        lead.status === LeadStatus.NEW ? 'bg-indigo-400/10 text-indigo-400 animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-xs text-slate-500 font-mono">
                      {new Date(lead.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
