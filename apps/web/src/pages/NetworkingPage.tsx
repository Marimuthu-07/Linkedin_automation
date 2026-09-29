import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  Clock,
  Calendar,
  Filter,
  CheckCircle,
  Copy,
  Trash2,
  Edit2,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  MessageSquare,
  Columns,
  List,
  RefreshCw,
  Info,
  Check,
  CalendarDays,
} from 'lucide-react';
import { api } from '../lib/api.js';
import {
  NetworkingContact,
  NetworkingStats,
  NetworkingMessage,
  NetworkingStatus,
  ContactCategory,
  NetworkingMessageType,
  VALID_NETWORKING_TRANSITIONS,
  getFollowUpStatus,
} from '@linkedin-growth/shared';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { formatDate } from '../lib/utils.js';

export const NetworkingPage: React.FC = () => {
  // Data state
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [stats, setStats] = useState<NetworkingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter & Pagination state
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFollowUp, setSelectedFollowUp] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // View state: 'table' or 'board'
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeContact, setActiveContact] = useState<NetworkingContact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Action states
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [messageDraftType, setMessageDraftType] = useState<NetworkingMessageType>(
    NetworkingMessageType.CONNECTION_REQUEST
  );
  const [editedDraftText, setEditedDraftText] = useState('');
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  // Add contact form state
  const [addFormData, setAddFormData] = useState({
    name: '',
    linkedinUrl: '',
    headline: '',
    role: '',
    company: '',
    location: '',
    category: ContactCategory.OTHER,
    source: 'Manual Entry',
    relevanceReason: '',
    notes: '',
    nextFollowUpAt: '',
  });

  // Edit contact form state
  const [editFormData, setEditFormData] = useState<any>({});

  // Fetch stats
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.getNetworkingStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load networking stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch contacts
  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await api.getNetworkingContacts({
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        followUpFilter: selectedFollowUp !== 'ALL' ? selectedFollowUp.toLowerCase() : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit,
      });

      setContacts(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load networking contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [selectedStatus, selectedCategory, selectedFollowUp, searchQuery, page, limit]);

  // Handle creating a new contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: addFormData.name.trim(),
        category: addFormData.category,
        source: addFormData.source || 'Manual Entry',
      };

      if (addFormData.linkedinUrl?.trim()) payload.linkedinUrl = addFormData.linkedinUrl.trim();
      if (addFormData.headline?.trim()) payload.headline = addFormData.headline.trim();
      if (addFormData.role?.trim()) payload.role = addFormData.role.trim();
      if (addFormData.company?.trim()) payload.company = addFormData.company.trim();
      if (addFormData.location?.trim()) payload.location = addFormData.location.trim();
      if (addFormData.relevanceReason?.trim()) payload.relevanceReason = addFormData.relevanceReason.trim();
      if (addFormData.notes?.trim()) payload.notes = addFormData.notes.trim();
      if (addFormData.nextFollowUpAt) {
        payload.nextFollowUpAt = new Date(addFormData.nextFollowUpAt).toISOString();
      }

      await api.createContact(payload);
      setIsAddModalOpen(false);
      setAddFormData({
        name: '',
        linkedinUrl: '',
        headline: '',
        role: '',
        company: '',
        location: '',
        category: ContactCategory.OTHER,
        source: 'Manual Entry',
        relevanceReason: '',
        notes: '',
        nextFollowUpAt: '',
      });
      loadContacts();
      loadStats();
    } catch (err: any) {
      alert(`Error adding person: ${err.message}`);
    }
  };

  // Handle status transition
  const handleTransitionStatus = async (targetStatus: NetworkingStatus) => {
    if (!activeContact) return;
    setStatusErrorMessage(null);

    try {
      const updated = await api.updateContactStatus(activeContact.id, targetStatus);
      setActiveContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      loadStats();
    } catch (err: any) {
      setStatusErrorMessage(err.message || 'Failed to update status transition');
    }
  };

  // Handle generating AI message draft
  const handleGenerateMessageDraft = async () => {
    if (!activeContact) return;
    setIsGeneratingDraft(true);
    setStatusErrorMessage(null);

    try {
      const res = await api.generateContactDraft(activeContact.id, messageDraftType);
      setActiveContact(res.contact);
      setEditedDraftText(res.draft);
      setContacts((prev) => prev.map((c) => (c.id === res.contact.id ? res.contact : c)));
      loadStats();
    } catch (err: any) {
      setStatusErrorMessage(
        `Unable to generate a message right now: ${err.message}. Your existing draft has not been changed.`
      );
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Handle saving edited draft text
  const handleSaveDraftText = async () => {
    if (!activeContact || !editedDraftText.trim()) return;
    try {
      const updated = await api.updateContact(activeContact.id, {
        messageDraft: editedDraftText.trim(),
      });
      setActiveContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert(`Failed to save draft: ${err.message}`);
    }
  };

  // Handle marking message as used & updating status to CONTACTED
  const handleMarkAsContacted = async () => {
    if (!activeContact) return;
    try {
      // Find current draft message if any
      const draftMsg = activeContact.messages?.find((m) => m.status === 'DRAFT');
      if (draftMsg) {
        await api.updateContactMessage(activeContact.id, draftMsg.id, { status: 'USED' });
      }

      // If transition to CONTACTED is valid, execute it
      const updated = await api.updateContactStatus(activeContact.id, NetworkingStatus.CONTACTED);
      setActiveContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      loadStats();
    } catch (err: any) {
      alert(`Could not mark as contacted: ${err.message}`);
    }
  };

  // Set follow-up date preset
  const handleSetFollowUpPreset = async (daysFromNow: number | null) => {
    if (!activeContact) return;
    try {
      let isoDate: string | null = null;
      if (daysFromNow !== null) {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        d.setHours(10, 0, 0, 0); // 10:00 AM standard reminder
        isoDate = d.toISOString();
      }

      const updated = await api.updateContact(activeContact.id, {
        nextFollowUpAt: isoDate,
      });

      setActiveContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      loadStats();
    } catch (err: any) {
      alert(`Failed to update follow-up date: ${err.message}`);
    }
  };

  // Handle saving contact edits
  const handleSaveContactEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact) return;

    try {
      const updated = await api.updateContact(activeContact.id, {
        name: editFormData.name?.trim(),
        linkedinUrl: editFormData.linkedinUrl?.trim() || null,
        headline: editFormData.headline?.trim() || null,
        role: editFormData.role?.trim() || null,
        company: editFormData.company?.trim() || null,
        location: editFormData.location?.trim() || null,
        category: editFormData.category,
        source: editFormData.source?.trim() || 'Manual Entry',
        relevanceReason: editFormData.relevanceReason?.trim() || null,
        notes: editFormData.notes?.trim() || null,
      });

      setActiveContact(updated);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsEditMode(false);
      loadStats();
    } catch (err: any) {
      alert(`Failed to update contact: ${err.message}`);
    }
  };

  // Handle deleting contact
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to delete this contact and its message history?')) {
      return;
    }

    try {
      await api.deleteContact(contactId);
      setIsDetailModalOpen(false);
      setActiveContact(null);
      loadContacts();
      loadStats();
    } catch (err: any) {
      alert(`Failed to delete contact: ${err.message}`);
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  // Open detail view for contact
  const openDetail = (contact: NetworkingContact) => {
    setActiveContact(contact);
    setEditedDraftText(contact.messageDraft || '');
    setStatusErrorMessage(null);
    setIsEditMode(false);
    setEditFormData({
      name: contact.name,
      linkedinUrl: contact.linkedinUrl || '',
      headline: contact.headline || '',
      role: contact.role || '',
      company: contact.company || '',
      location: contact.location || '',
      category: contact.category,
      source: contact.source,
      relevanceReason: contact.relevanceReason || '',
      notes: contact.notes || '',
    });
    setIsDetailModalOpen(true);
  };

  // Helper for rendering follow-up badges
  const renderFollowUpBadge = (dateStr?: string | null) => {
    if (!dateStr) {
      return <span className="text-slate-500 text-[11px]">No follow-up set</span>;
    }

    const status = getFollowUpStatus(dateStr);
    const dateFormatted = formatDate(dateStr);

    if (status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
          <AlertTriangle className="h-3 w-3" />
          <span>Overdue ({dateFormatted})</span>
        </span>
      );
    } else if (status === 'DUE_TODAY') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-400 animate-pulse">
          <Clock className="h-3 w-3" />
          <span>Due Today</span>
        </span>
      );
    } else if (status === 'UPCOMING_7_DAYS') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
          <Calendar className="h-3 w-3" />
          <span>{dateFormatted}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
          <Calendar className="h-3 w-3" />
          <span>{dateFormatted}</span>
        </span>
      );
    }
  };

  const statusList = [
    'ALL',
    NetworkingStatus.DISCOVERED,
    NetworkingStatus.REVIEWING,
    NetworkingStatus.APPROVED,
    NetworkingStatus.CONTACTED,
    NetworkingStatus.REPLIED,
    NetworkingStatus.FOLLOW_UP,
    NetworkingStatus.CONNECTED,
    NetworkingStatus.ARCHIVED,
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Networking Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Human-in-the-loop relationship pipeline. Research prospects, organize leads, draft tailored connection notes with explicit provenance, and track timely follow-ups.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Person</span>
        </button>
      </div>

      {/* Human-in-the-loop Safety Protocol Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-4 text-xs text-slate-300 backdrop-blur-md">
        <ShieldAlert className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Human-in-the-Loop LinkedIn Protocol
          </p>
          <p className="text-slate-300 leading-relaxed">
            AI provides research organization and draft message suggestions grounded in verified profile data. No automated connection requests, logins, or synthetic messaging occur. You always review, personalize, and manually send outreach directly on LinkedIn.
          </p>
        </div>
      </div>

      {/* Descriptive Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Total Prospects</p>
          <p className="mt-1 text-lg font-bold text-white font-heading">
            {statsLoading ? '...' : stats?.totalContacts ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Discovered</p>
          <p className="mt-1 text-lg font-bold text-blue-400 font-heading">
            {statsLoading ? '...' : stats?.totalDiscovered ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Under Review</p>
          <p className="mt-1 text-lg font-bold text-amber-400 font-heading">
            {statsLoading ? '...' : stats?.totalReviewing ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Approved</p>
          <p className="mt-1 text-lg font-bold text-emerald-400 font-heading">
            {statsLoading ? '...' : stats?.totalApproved ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Contacted</p>
          <p className="mt-1 text-lg font-bold text-cyan-400 font-heading">
            {statsLoading ? '...' : stats?.totalContacted ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
          <p className="text-[11px] font-medium text-slate-400">Replies</p>
          <p className="mt-1 text-lg font-bold text-indigo-400 font-heading">
            {statsLoading ? '...' : stats?.totalReplied ?? 0}
          </p>
        </div>
        <div
          onClick={() => setSelectedFollowUp('DUE_TODAY')}
          className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 backdrop-blur-sm cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <p className="text-[11px] font-medium text-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Due Today
          </p>
          <p className="mt-1 text-lg font-bold text-amber-400 font-heading">
            {statsLoading ? '...' : stats?.followUpsDueToday ?? 0}
          </p>
        </div>
        <div
          onClick={() => setSelectedFollowUp('OVERDUE')}
          className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 backdrop-blur-sm cursor-pointer hover:border-rose-500/50 transition-colors"
        >
          <p className="text-[11px] font-medium text-rose-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Overdue
          </p>
          <p className="mt-1 text-lg font-bold text-rose-400 font-heading">
            {statsLoading ? '...' : stats?.followUpsOverdue ?? 0}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, company, headline, notes, relevance..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/70 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.values(ContactCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Follow-up Filter */}
          <select
            value={selectedFollowUp}
            onChange={(e) => {
              setSelectedFollowUp(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Follow-ups</option>
            <option value="DUE_TODAY">Due Today</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UPCOMING_7_DAYS">Next 7 Days</option>
            <option value="HAS_FOLLOWUP">Has Follow-up Scheduled</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'board'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pipeline Board View"
            >
              <Columns className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusList.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSelectedStatus(s);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedStatus === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Main Content: Table or Board */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
          Loading networking pipeline...
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-400 backdrop-blur-sm">
          <Users className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-200">No contacts found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || selectedFollowUp !== 'ALL'
              ? 'Try resetting the filters or clearing the search query.'
              : 'Add your first networking prospect to track relationships and generate authentic connection notes.'}
          </p>
          {(searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || selectedFollowUp !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedCategory('ALL');
                setSelectedFollowUp('ALL');
                setSearchQuery('');
                setPage(1);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Person</th>
                  <th className="px-4 py-3.5 font-semibold">Role & Company</th>
                  <th className="px-4 py-3.5 font-semibold">Category</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Follow-up</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => openDetail(contact)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Person */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {contact.name}
                      </div>
                      {contact.headline && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                          {contact.headline}
                        </p>
                      )}
                      {contact.location && (
                        <p className="text-[10px] text-slate-500">{contact.location}</p>
                      )}
                    </td>

                    {/* Role & Company */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-200 font-medium">
                        {contact.role || '—'}
                      </div>
                      <div className="text-[11px] text-indigo-400">
                        {contact.company || '—'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1 text-[10px] font-medium text-slate-300">
                        {contact.category.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge variant="status" status={contact.status}>
                        {contact.status}
                      </Badge>
                      {contact.messageDraft && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-400">
                          <Sparkles className="h-3 w-3 shrink-0" />
                          <span>Draft ready</span>
                        </div>
                      )}
                    </td>

                    {/* Follow-up */}
                    <td className="px-4 py-3.5">
                      {renderFollowUpBadge(contact.nextFollowUpAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open LinkedIn in new tab for manual outreach"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      <button
                        onClick={() => openDetail(contact)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/80 px-2.5 py-1 text-white hover:bg-indigo-600 transition-colors"
                      >
                        <span>View & Draft</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{contacts.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalCount}</span> contacts (Page{' '}
              {page} of {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 inline mr-1" /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {[
            NetworkingStatus.DISCOVERED,
            NetworkingStatus.REVIEWING,
            NetworkingStatus.APPROVED,
            NetworkingStatus.CONTACTED,
            NetworkingStatus.REPLIED,
            NetworkingStatus.FOLLOW_UP,
            NetworkingStatus.CONNECTED,
          ].map((colStatus) => {
            const colContacts = contacts.filter((c) => c.status === colStatus);
            return (
              <div
                key={colStatus}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/50 p-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
                  <span className="font-semibold text-xs text-slate-200 tracking-wide">
                    {colStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    {colContacts.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colContacts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openDetail(c)}
                      className="group rounded-lg border border-slate-800 bg-slate-900/80 p-3 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">
                          {c.name}
                        </h4>
                        {c.messageDraft && (
                          <span title="Draft Ready">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300">
                        {c.role || 'Professional'} {c.company ? `@ ${c.company}` : ''}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                          {c.category.replace(/_/g, ' ')}
                        </span>
                        {c.nextFollowUpAt && renderFollowUpBadge(c.nextFollowUpAt)}
                      </div>
                    </div>
                  ))}

                  {colContacts.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-600 italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Person Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Networking Person"
        description="Add a professional to your relationship pipeline. Only Name is required; add relevance details to power authentic draft generation."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-name" className="block font-medium text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                id="add-name"
                type="text"
                required
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Elena Rostova"
              />
            </div>
            <div>
              <label htmlFor="add-linkedin" className="block font-medium text-slate-300 mb-1">
                LinkedIn Profile URL (Optional)
              </label>
              <input
                id="add-linkedin"
                type="url"
                value={addFormData.linkedinUrl}
                onChange={(e) => setAddFormData({ ...addFormData, linkedinUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="https://www.linkedin.com/in/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-role" className="block font-medium text-slate-300 mb-1">
                Role / Title (Optional)
              </label>
              <input
                id="add-role"
                type="text"
                value={addFormData.role}
                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Staff Infrastructure Engineer"
              />
            </div>
            <div>
              <label htmlFor="add-company" className="block font-medium text-slate-300 mb-1">
                Company / Organization (Optional)
              </label>
              <input
                id="add-company"
                type="text"
                value={addFormData.company}
                onChange={(e) => setAddFormData({ ...addFormData, company: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="CloudScale Systems"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="add-category" className="block font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                id="add-category"
                value={addFormData.category}
                onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value as ContactCategory })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {Object.values(ContactCategory).map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="add-location" className="block font-medium text-slate-300 mb-1">
                Location (Optional)
              </label>
              <input
                id="add-location"
                type="text"
                value={addFormData.location}
                onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label htmlFor="add-followup" className="block font-medium text-slate-300 mb-1">
                Initial Follow-up Date (Optional)
              </label>
              <input
                id="add-followup"
                type="date"
                value={addFormData.nextFollowUpAt}
                onChange={(e) => setAddFormData({ ...addFormData, nextFollowUpAt: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="add-headline" className="block font-medium text-slate-300 mb-1">
              Headline / Bio Summary (Optional)
            </label>
            <input
              id="add-headline"
              type="text"
              value={addFormData.headline}
              onChange={(e) => setAddFormData({ ...addFormData, headline: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Building distributed storage engines & open source tooling."
            />
          </div>

          <div>
            <label htmlFor="add-relevance" className="block font-medium text-slate-300 mb-1">
              Why is this person relevant? (Optional)
            </label>
            <textarea
              id="add-relevance"
              rows={2}
              value={addFormData.relevanceReason}
              onChange={(e) => setAddFormData({ ...addFormData, relevanceReason: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g., Open sourced Raft library in Go; active in developer tooling community."
            />
          </div>

          <div>
            <label htmlFor="add-notes" className="block font-medium text-slate-300 mb-1">
              Personal Notes (Optional)
            </label>
            <textarea
              id="add-notes"
              rows={2}
              value={addFormData.notes}
              onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Spoke at conference, shared mutual repo, alumni, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Add Person
            </button>
          </div>
        </form>
      </Modal>

      {/* Person Detail & Draft Workbench Modal */}
      {activeContact && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={activeContact.name}
          description={
            activeContact.role && activeContact.company
              ? `${activeContact.role} @ ${activeContact.company}`
              : activeContact.headline || 'Networking Contact Profile'
          }
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status Transition & Pipeline Flow */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Current Pipeline Status:</span>
                  <Badge variant="status" status={activeContact.status}>
                    {activeContact.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{isEditMode ? 'Cancel Edit' : 'Edit Profile'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteContact(activeContact.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-1 text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Status Transition Buttons */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-medium text-slate-400 mb-2">
                  Allowed Next Transitions (Human-in-the-Loop Gate):
                </div>
                <div className="flex flex-wrap gap-2">
                  {(VALID_NETWORKING_TRANSITIONS[activeContact.status as NetworkingStatus] || []).map((nextSt) => (
                    <button
                      key={nextSt}
                      onClick={() => handleTransitionStatus(nextSt)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/15 px-3 py-1.5 font-medium text-indigo-300 hover:bg-indigo-600/30 hover:text-white transition-all cursor-pointer"
                    >
                      <span>Move to {nextSt.replace(/_/g, ' ')}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>

              {statusErrorMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-950/40 border border-rose-500/40 p-2.5 text-rose-300 text-[11px]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{statusErrorMessage}</span>
                </div>
              )}
            </div>

            {/* Profile Info or Edit Mode */}
            {isEditMode ? (
              <form onSubmit={handleSaveContactEdit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <h4 className="font-semibold text-slate-200">Edit Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={editFormData.linkedinUrl || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Role</label>
                    <input
                      type="text"
                      value={editFormData.role || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={editFormData.company || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                    <select
                      value={editFormData.category || ContactCategory.OTHER}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                    >
                      {Object.values(ContactCategory).map((c) => (
                        <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Relevance Reason</label>
                  <textarea
                    rows={2}
                    value={editFormData.relevanceReason || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, relevanceReason: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Profile Details</span>
                  {activeContact.linkedinUrl && (
                    <a
                      href={activeContact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      <span>Open LinkedIn Profile</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  {activeContact.location && (
                    <div><strong className="text-slate-500">Location:</strong> {activeContact.location}</div>
                  )}
                  <div><strong className="text-slate-500">Source:</strong> {activeContact.source}</div>
                  {activeContact.lastInteractionAt && (
                    <div><strong className="text-slate-500">Last Interaction:</strong> {formatDate(activeContact.lastInteractionAt)}</div>
                  )}
                </div>

                {activeContact.relevanceReason && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="font-semibold text-slate-400">Why Relevant: </span>
                    <span className="text-slate-300">{activeContact.relevanceReason}</span>
                  </div>
                )}

                {activeContact.notes && (
                  <div className="pt-1">
                    <span className="font-semibold text-slate-400">Notes: </span>
                    <span className="text-slate-300">{activeContact.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Management Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <CalendarDays className="h-4 w-4 text-indigo-400" />
                  <span>Follow-up Management</span>
                </div>
                <div>{renderFollowUpBadge(activeContact.nextFollowUpAt)}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Set reminder:</span>
                <button
                  onClick={() => handleSetFollowUpPreset(0)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => handleSetFollowUpPreset(3)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  In 3 Days
                </button>
                <button
                  onClick={() => handleSetFollowUpPreset(7)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Next Week (7d)
                </button>
                {activeContact.nextFollowUpAt && (
                  <button
                    onClick={() => handleSetFollowUpPreset(null)}
                    className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-1 text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    Clear Follow-up
                  </button>
                )}
              </div>
            </div>

            {/* AI Message Drafting Workbench */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>Personalized Outreach Workbench</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={messageDraftType}
                    onChange={(e) => setMessageDraftType(e.target.value as NetworkingMessageType)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value={NetworkingMessageType.CONNECTION_REQUEST}>Connection Note (300 char)</option>
                    <option value={NetworkingMessageType.FOLLOW_UP}>Follow-up Note</option>
                    <option value={NetworkingMessageType.GENERAL}>General Outreach</option>
                  </select>

                  <button
                    onClick={handleGenerateMessageDraft}
                    disabled={isGeneratingDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGeneratingDraft ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingDraft ? 'Generating...' : 'Generate Draft'}</span>
                  </button>
                </div>
              </div>

              {/* Personalization Provenance & Tone */}
              {activeContact.messageDraft && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Personalization basis:</span>
                  {[
                    activeContact.role ? 'Role' : '',
                    activeContact.company ? 'Company' : '',
                    activeContact.relevanceReason ? 'RelevanceReason' : '',
                  ]
                    .filter(Boolean)
                    .map((basis) => (
                      <span
                        key={basis}
                        className="rounded-md bg-indigo-900/40 border border-indigo-500/30 px-2 py-0.5 text-indigo-300 text-[10px]"
                      >
                        • {basis}
                      </span>
                    ))}
                  {!activeContact.role && !activeContact.company && !activeContact.relevanceReason && (
                    <span className="rounded-md bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 text-amber-300 text-[10px]">
                      Limited profile details provided
                    </span>
                  )}
                </div>
              )}

              {/* Editable Draft Textarea */}
              {activeContact.messageDraft || editedDraftText ? (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={editedDraftText}
                    onChange={(e) => setEditedDraftText(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-200 font-mono text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
                    placeholder="Draft text will appear here..."
                  />

                  {/* Character Count & Action Disclaimer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Draft only — review and send manually on LinkedIn.</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {editedDraftText !== activeContact.messageDraft && (
                        <button
                          onClick={handleSaveDraftText}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          Save Edits
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyText(editedDraftText, 'active-draft')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-1.5 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                      >
                        {copiedDraftId === 'active-draft' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedDraftId === 'active-draft' ? 'Copied!' : 'Copy Draft'}</span>
                      </button>
                      <button
                        onClick={handleMarkAsContacted}
                        title="Mark message as used and transition contact to CONTACTED"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500 transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark as Contacted</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg">
                  <p>No message draft generated yet.</p>
                  <button
                    onClick={handleGenerateMessageDraft}
                    disabled={isGeneratingDraft}
                    className="mt-2 text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Tailored Connection Note</span>
                  </button>
                </div>
              )}
            </div>

            {/* Message History Section */}
            {activeContact.messages && activeContact.messages.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  <span>Draft & Message History ({activeContact.messages.length})</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeContact.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300">
                            {msg.type.replace(/_/g, ' ')}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                            {msg.status}
                          </span>
                        </div>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        {msg.content}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          {msg.personalizationBasis.map((b) => (
                            <span key={b} className="text-[9px] text-indigo-400">
                              #{b}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedDraftId === msg.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
