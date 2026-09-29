import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Copy,
  ChevronRight,
  ShieldAlert,
  Sliders,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Lead, LeadStatus } from '@linkedin-growth/shared';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { formatDate } from '../lib/utils.js';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [leadForm, setLeadForm] = useState({
    company: '',
    website: '',
    industry: '',
    location: '',
    contactName: '',
    contactRole: '',
    problem: '',
    opportunity: '',
    status: LeadStatus.DISCOVERED,
    websiteUxScore: 5,
    mobileExperienceScore: 4,
    performanceScore: 4,
    visualQualityScore: 5,
    ctaClarityScore: 3,
    conversionClarityScore: 3,
    serviceFit: 'HIGH' as const,
  });

  const loadLeads = () => {
    setLoading(true);
    api.getLeads({
      status: selectedStatus,
      search: searchQuery,
    })
      .then(setLeads)
      .catch((err) => console.error('Failed to load leads:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, [selectedStatus, searchQuery]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate transparent qualification score
      const breakdown = await api.scoreLead({
        websiteUxScore: leadForm.websiteUxScore,
        mobileExperienceScore: leadForm.mobileExperienceScore,
        performanceScore: leadForm.performanceScore,
        visualQualityScore: leadForm.visualQualityScore,
        ctaClarityScore: leadForm.ctaClarityScore,
        conversionClarityScore: leadForm.conversionClarityScore,
        serviceFit: leadForm.serviceFit,
      });

      await api.createLead({
        company: leadForm.company,
        website: leadForm.website,
        industry: leadForm.industry,
        location: leadForm.location || null,
        contactName: leadForm.contactName || null,
        contactRole: leadForm.contactRole || null,
        problem: leadForm.problem,
        opportunity: leadForm.opportunity,
        qualificationScore: breakdown.totalScore,
        qualificationBreakdown: breakdown,
        status: leadForm.status,
      });

      setIsAddModalOpen(false);
      loadLeads();
    } catch (err: any) {
      alert(`Error creating lead: ${err.message}`);
    }
  };

  const handleStatusChange = async (leadId: string, nextStatus: LeadStatus) => {
    try {
      await api.updateLead(leadId, { status: nextStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
      );
      if (activeLead && activeLead.id === leadId) {
        setActiveLead((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      alert(`Error updating lead status: ${err.message}`);
    }
  };

  const handleGenerateOutreach = async (leadId: string) => {
    setIsGeneratingOutreach(true);
    try {
      const res = await api.generateLeadOutreach(leadId);
      setActiveLead(res.lead);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? res.lead : l))
      );
    } catch (err: any) {
      alert(`Error generating outreach: ${err.message}`);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const statuses = [
    'ALL',
    LeadStatus.DISCOVERED,
    LeadStatus.RESEARCHING,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Freelance & Client Lead Generation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover high-opportunity web redesign, performance, and AI application freelance prospects.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client Lead</span>
        </button>
      </div>

      {/* Safety Compliance & Brand Services Notice */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-slate-300">
        <ShieldAlert className="h-5 w-5 shrink-0 text-emerald-400" />
        <p>
          <strong className="text-white">Transparent Lead Qualification:</strong> Every opportunity score is derived from documented UX/Performance factors. Outreach drafts reference verified website observations. Never spam.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search leads by company, industry, or observed problem..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              selectedStatus === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Leads List Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading client leads...</div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <Briefcase className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-200">No leads found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Add a prospect with website audit observations to see qualification scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header: Company & Qualification Score */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{lead.company}</h3>
                    <p className="text-[11px] text-slate-400">{lead.industry}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                      {lead.qualificationScore}/100 Fit
                    </span>
                    <Badge variant="status" status={lead.status} className="mt-1">
                      {lead.status}
                    </Badge>
                  </div>
                </div>

                {/* Website Link */}
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                >
                  <span>{lead.website.replace('https://', '')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                {/* Problem & Opportunity */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-2.5 text-rose-200">
                    <span className="font-semibold text-rose-400">Problem: </span>
                    <p className="line-clamp-2 mt-0.5">{lead.problem}</p>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-emerald-200">
                    <span className="font-semibold text-emerald-400">Opportunity: </span>
                    <p className="line-clamp-2 mt-0.5">{lead.opportunity}</p>
                  </div>
                </div>

                {/* Qualification Reasons Tags */}
                {lead.qualificationBreakdown?.reasons && (
                  <div className="mt-3 space-y-1">
                    {lead.qualificationBreakdown.reasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="h-1 w-1 rounded-full bg-indigo-400" />
                        <span className="line-clamp-1">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-[11px] text-slate-500">
                  {lead.contactName ? `${lead.contactName} (${lead.contactRole})` : 'Contact pending'}
                </span>
                <button
                  onClick={() => {
                    setActiveLead(lead);
                    setIsDetailModalOpen(true);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  Audit & Outreach
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Client / Freelance Lead"
        description="Audit a prospective client website and record transparent scoring metrics."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={leadForm.company}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Nordic Artisan Coffee"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Website URL *</label>
              <input
                type="url"
                required
                value={leadForm.website}
                onChange={(e) => setLeadForm({ ...leadForm, website: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="https://nordiccoffeeroasters.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                required
                value={leadForm.industry}
                onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Specialty Retail / E-commerce"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Name & Role</label>
              <input
                type="text"
                value={leadForm.contactName}
                onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Lars Lindqvist (Co-Founder)"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Observed Technical / UX Problem *</label>
            <textarea
              required
              rows={2}
              value={leadForm.problem}
              onChange={(e) => setLeadForm({ ...leadForm, problem: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. 5.8s mobile checkout load, broken layout shift, buried CTA..."
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Service Opportunity / Value Pitch *</label>
            <textarea
              required
              rows={2}
              value={leadForm.opportunity}
              onChange={(e) => setLeadForm({ ...leadForm, opportunity: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Next.js rebuild with sub-second page transitions and improved conversion..."
            />
          </div>

          {/* Audit Scoring Sliders */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Transparent Website Audit Ratings (0 - 10)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Mobile UX ({leadForm.mobileExperienceScore}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={leadForm.mobileExperienceScore}
                  onChange={(e) => setLeadForm({ ...leadForm, mobileExperienceScore: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Performance ({leadForm.performanceScore}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={leadForm.performanceScore}
                  onChange={(e) => setLeadForm({ ...leadForm, performanceScore: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">CTA Clarity ({leadForm.ctaClarityScore}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={leadForm.ctaClarityScore}
                  onChange={(e) => setLeadForm({ ...leadForm, ctaClarityScore: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Calculate & Add Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Detail & Outreach Generator Modal */}
      {activeLead && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Lead: ${activeLead.company}`}
          description={`Qualification Score: ${activeLead.qualificationScore}/100`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Pipeline status buttons */}
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3">
              {Object.values(LeadStatus).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(activeLead.id, st)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeLead.status === st
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Audit breakdown */}
            {activeLead.qualificationBreakdown && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <span className="font-semibold text-indigo-300 uppercase tracking-wider">
                  Audit Findings & Justification:
                </span>
                <ul className="space-y-1">
                  {activeLead.qualificationBreakdown.reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Outreach generator section */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span>Personalized Value Outreach Draft</span>
                </div>
                <button
                  onClick={() => handleGenerateOutreach(activeLead.id)}
                  disabled={isGeneratingOutreach}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isGeneratingOutreach ? 'Generating...' : 'Regenerate Outreach'}
                </button>
              </div>

              {activeLead.outreachDraft ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {activeLead.outreachDraft}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Review and send manually via email or LinkedIn.
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeLead.outreachDraft!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 text-indigo-300 hover:bg-indigo-600/40"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Outreach'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400">
                  <p>No outreach message generated yet.</p>
                  <button
                    onClick={() => handleGenerateOutreach(activeLead.id)}
                    className="mt-2 text-indigo-400 hover:underline font-medium"
                  >
                    Click to generate personalized outreach
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700"
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
