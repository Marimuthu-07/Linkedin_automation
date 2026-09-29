import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ShieldCheck,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';
import { Lead, LeadStatus, LeadStats } from '@linkedin-growth/shared';
import { api } from '../lib/api.js';
import { LeadStatsCards } from '../components/leads/LeadStatsCards.js';
import { LeadKanbanBoard } from '../components/leads/LeadKanbanBoard.js';
import { LeadTable } from '../components/leads/LeadTable.js';
import { LeadAddModal } from '../components/leads/LeadAddModal.js';
import { LeadWorkbenchModal } from '../components/leads/LeadWorkbenchModal.js';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('qualificationScore');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        api.getLeads({
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
          followUpFilter: followUpFilter !== 'all' ? followUpFilter : undefined,
          sortBy,
          sortOrder: 'desc',
        }),
        api.getLeadStats(),
      ]);
      setLeads(leadsRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load lead data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, searchQuery, followUpFilter, sortBy]);

  const handleOpenWorkbench = (lead: Lead) => {
    setActiveLead(lead);
    setIsWorkbenchOpen(true);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setActiveLead(updatedLead);
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    api.getLeadStats().then(setStats).catch(console.error);
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await api.deleteLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (activeLead?.id === leadId) {
        setIsWorkbenchOpen(false);
        setActiveLead(null);
      }
      api.getLeadStats().then(setStats).catch(console.error);
    } catch (err: any) {
      alert(`Error deleting lead: ${err.message}`);
    }
  };

  const statusTabs = [
    'ALL',
    LeadStatus.DISCOVERED,
    LeadStatus.QUALIFIED,
    LeadStatus.OUTREACH_DRAFT,
    LeadStatus.CONTACTED,
    LeadStatus.REPLIED,
    LeadStatus.MEETING,
    LeadStatus.PROPOSAL,
    LeadStatus.WON,
    LeadStatus.LOST,
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Lead Generation & Freelance Outreach Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover prospective clients, perform structured website opportunity audits, and draft grounded cold outreach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            title="Refresh lead data"
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prospect & Audit</span>
          </button>
        </div>
      </div>

      {/* Safety Compliance & Human in the Loop Banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <p>
          <strong className="text-white">Deterministic Lead Qualification & Safety:</strong> Every qualification score is computed from structured website observations. Outreach drafts are grounded in verified observations only. All LinkedIn interactions remain manual.
        </p>
      </div>

      {/* Summary Stats Overview Cards */}
      <LeadStatsCards
        stats={stats}
        onFilterStatus={(st) => setSelectedStatus(st)}
        onFilterFollowUp={(filter) => setFollowUpFilter(filter)}
      />

      {/* Controls Bar: Search, Filters, Sorters, View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads by company, contact, industry, or observed problem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Dropdowns: Follow-up & Sorting & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Follow-up filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 hidden sm:inline">Follow-up:</span>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Follow-ups</option>
              <option value="due_today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming_7_days">Next 7 Days</option>
              <option value="none">No Follow-up Scheduled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="qualificationScore">Score: High to Low</option>
              <option value="updatedAt">Recently Updated</option>
              <option value="createdAt">Newest Leads</option>
              <option value="nextFollowUpAt">Follow-up Date</option>
              <option value="company">Company Name</option>
            </select>
          </div>

          {/* View Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {statusTabs.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedStatus === st
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Content: Kanban or Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading client leads pipeline...</div>
      ) : viewMode === 'kanban' ? (
        <LeadKanbanBoard
          leads={leads}
          onOpenWorkbench={handleOpenWorkbench}
        />
      ) : (
        <LeadTable
          leads={leads}
          onOpenWorkbench={handleOpenWorkbench}
          onDeleteLead={handleDeleteLead}
        />
      )}

      {/* Modals */}
      <LeadAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadData()}
      />

      <LeadWorkbenchModal
        lead={activeLead}
        isOpen={isWorkbenchOpen}
        onClose={() => {
          setIsWorkbenchOpen(false);
          setActiveLead(null);
        }}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleDeleteLead}
      />
    </div>
  );
};
