import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Copy,
  Clock,
  Calendar,
  AlertCircle,
  Linkedin,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Edit3,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import {
  Lead,
  LeadStatus,
  LeadInteraction,
  LeadInteractionType,
  LeadOutreachVariant,
  LeadOutreachVariantType,
  getFollowUpStatus,
  VALID_LEAD_TRANSITIONS,
} from '@linkedin-growth/shared';
import { Modal } from '../common/Modal.js';
import { Badge } from '../common/Badge.js';
import { api } from '../../lib/api.js';
import { formatDate, formatRelativeTime } from '../../lib/utils.js';

interface LeadWorkbenchModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
  onLeadDeleted?: (leadId: string) => void;
}

export const LeadWorkbenchModal: React.FC<LeadWorkbenchModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
}) => {
  if (!lead) return null;

  const [activeTab, setActiveTab] = useState<'audit' | 'outreach' | 'timeline' | 'followup' | 'edit'>('audit');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<LeadOutreachVariantType>(LeadOutreachVariantType.DETAILED);

  // Follow-up state
  const [followUpDateInput, setFollowUpDateInput] = useState(
    lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : ''
  );
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Interaction State
  const [interactions, setInteractions] = useState<LeadInteraction[]>(lead.interactions || []);
  const [newInteractionType, setNewInteractionType] = useState<LeadInteractionType>(LeadInteractionType.NOTE);
  const [newInteractionNote, setNewInteractionNote] = useState('');
  const [loggingInteraction, setLoggingInteraction] = useState(false);

  // Task creation state
  const [taskTitle, setTaskTitle] = useState(`Follow up with ${lead.company}`);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(false);

  // Edit Lead state
  const [editForm, setEditForm] = useState({
    company: lead.company,
    website: lead.website,
    industry: lead.industry,
    location: lead.location || '',
    contactName: lead.contactName || '',
    contactRole: lead.contactRole || '',
    linkedinUrl: lead.linkedinUrl || '',
    companyLinkedinUrl: lead.companyLinkedinUrl || '',
    problem: lead.problem,
    opportunity: lead.opportunity,
    notes: lead.notes || '',
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        company: lead.company,
        website: lead.website,
        industry: lead.industry,
        location: lead.location || '',
        contactName: lead.contactName || '',
        contactRole: lead.contactRole || '',
        linkedinUrl: lead.linkedinUrl || '',
        companyLinkedinUrl: lead.companyLinkedinUrl || '',
        problem: lead.problem,
        opportunity: lead.opportunity,
        notes: lead.notes || '',
      });
      setFollowUpDateInput(lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : '');
      setInteractions(lead.interactions || []);
      setTaskTitle(`Follow up with ${lead.company} regarding website audit`);
    }
  }, [lead]);

  // Load fresh interactions when opening timeline tab
  useEffect(() => {
    if (lead && activeTab === 'timeline') {
      api.getLeadInteractions(lead.id)
        .then(setInteractions)
        .catch(console.error);
    }
  }, [lead?.id, activeTab]);

  const handleStatusTransition = async (nextStatus: LeadStatus) => {
    try {
      const updated = await api.updateLeadStatus(lead.id, nextStatus);
      onLeadUpdated(updated);
    } catch (err: any) {
      alert(`Invalid transition: ${err.message}`);
    }
  };

  const handleGenerateOutreach = async (variantType?: LeadOutreachVariantType) => {
    setGenerating(true);
    try {
      const res = await api.generateLeadOutreach(lead.id, { variantType });
      onLeadUpdated(res.lead);
      if (variantType) {
        setSelectedVariant(variantType);
      }
    } catch (err: any) {
      alert(`Error generating outreach: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFollowUp(true);
    try {
      const updated = await api.updateLeadFollowUp(lead.id, {
        nextFollowUpAt: followUpDateInput ? new Date(followUpDateInput).toISOString() : null,
        note: followUpNoteInput.trim() || undefined,
      });
      onLeadUpdated(updated);
      setFollowUpNoteInput('');
      alert('Follow-up schedule updated successfully!');
    } catch (err: any) {
      alert(`Error setting follow-up: ${err.message}`);
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleSetQuickFollowUp = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(10, 0, 0, 0);
    setFollowUpDateInput(d.toISOString().slice(0, 16));
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionNote.trim()) return;

    setLoggingInteraction(true);
    try {
      const created = await api.createLeadInteraction(lead.id, {
        type: newInteractionType,
        note: newInteractionNote.trim(),
      });
      setInteractions((prev) => [created, ...prev]);
      setNewInteractionNote('');

      // Refresh lead
      const updatedLead = await api.getLeadById(lead.id);
      onLeadUpdated(updatedLead);
    } catch (err: any) {
      alert(`Error logging interaction: ${err.message}`);
    } finally {
      setLoggingInteraction(false);
    }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    try {
      await api.deleteLeadInteraction(lead.id, interactionId);
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
    } catch (err: any) {
      alert(`Error deleting interaction: ${err.message}`);
    }
  };

  const handleCreateTask = async () => {
    setCreatingTask(true);
    try {
      await api.createTask({
        title: taskTitle.trim(),
        description: `Lead: ${lead.company}\nProblem: ${lead.problem}\nOpportunity: ${lead.opportunity}`,
        type: 'LEAD' as any,
        priority: 'MEDIUM' as any,
        dueAt: followUpDateInput ? new Date(followUpDateInput).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        relatedEntityType: 'LEAD',
        relatedEntityId: lead.id,
      });
      setTaskSuccess(true);
      setTimeout(() => setTaskSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateLead(lead.id, {
        company: editForm.company.trim(),
        website: editForm.website.trim(),
        industry: editForm.industry.trim(),
        location: editForm.location.trim() || null,
        contactName: editForm.contactName.trim() || null,
        contactRole: editForm.contactRole.trim() || null,
        linkedinUrl: editForm.linkedinUrl.trim() || null,
        companyLinkedinUrl: editForm.companyLinkedinUrl.trim() || null,
        problem: editForm.problem.trim(),
        opportunity: editForm.opportunity.trim(),
        notes: editForm.notes.trim() || null,
      });
      onLeadUpdated(updated);
      alert('Lead details updated!');
    } catch (err: any) {
      alert(`Error updating lead: ${err.message}`);
    }
  };

  const followUpCategory = getFollowUpStatus(lead.nextFollowUpAt);
  const allowedTransitions = VALID_LEAD_TRANSITIONS[lead.status as LeadStatus] || [];

  // Extract variants if present, or fallback to main draft
  const variants: LeadOutreachVariant[] = Array.isArray(lead.outreachVariants) && lead.outreachVariants.length > 0
    ? lead.outreachVariants
    : lead.outreachDraft
      ? [
          {
            type: LeadOutreachVariantType.DETAILED,
            body: lead.outreachDraft,
            personalizationBasis: ['Stored Website Observations', 'Deterministic Qualification Reasons'],
            status: 'DRAFT' as any,
          },
        ]
      : [];

  const currentVariantContent = variants.find((v) => v.type === selectedVariant) || variants[0];
  const activeDraftText = currentVariantContent?.body || lead.outreachDraft || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="2xl"
    >
      <div className="space-y-4 -mt-2">
        {/* Header: Company, Links, Status & Lifecycle Transitions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-heading">{lead.company}</h2>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-bold border ${
                  lead.qualificationScore >= 80
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                }`}
              >
                {lead.qualificationScore}/100 Fit
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
              <span>{lead.industry}</span>
              <span>•</span>
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
              >
                <span>{lead.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              {lead.linkedinUrl && (
                <>
                  <span>•</span>
                  <a
                    href={lead.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    <Linkedin className="h-3 w-3" />
                    <span>Contact Profile</span>
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="status" status={lead.status}>
              {lead.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* State Machine Transition Toolbar */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Stage Lifecycle:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {allowedTransitions.map((nextSt) => (
                <button
                  key={nextSt}
                  onClick={() => handleStatusTransition(nextSt)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-indigo-500 hover:bg-indigo-950/40 hover:text-indigo-200 transition-all"
                >
                  <span>Advance to {nextSt.replace('_', ' ')}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </button>
              ))}
              {allowedTransitions.length === 0 && (
                <span className="text-[11px] text-slate-500 italic">No further standard stage transitions</span>
              )}
            </div>
          </div>
        </div>

        {/* Workbench Tabs */}
        <div className="flex gap-2 border-b border-slate-800 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2 px-3 transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit & Scoring
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'outreach'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI Outreach Drafts</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Interactions ({interactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'followup'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Follow-Up & Tasks</span>
            {followUpCategory === 'OVERDUE' && (
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Info</span>
          </button>
        </div>

        {/* Tab 1: Audit & Scoring */}
        {activeTab === 'audit' && (
          <div className="space-y-4 text-xs">
            {/* Observed Problem & Service Opportunity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5">
                <span className="font-semibold text-rose-300 uppercase tracking-wider text-[11px]">
                  Observed Technical Problem:
                </span>
                <p className="mt-1 text-slate-200 leading-relaxed">{lead.problem}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px]">
                  Service Opportunity Pitch:
                </span>
                <p className="mt-1 text-slate-200 leading-relaxed">{lead.opportunity}</p>
              </div>
            </div>

            {/* Audit Breakdown Sliders Visual */}
            {lead.qualificationBreakdown && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Website Dimension Ratings (0 = Poor / High Opportunity)
                  </span>
                  <span className="text-[11px] text-indigo-300 font-semibold">
                    Service Fit: {lead.qualificationBreakdown.serviceFit}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Mobile UX</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.mobileExperienceScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.mobileExperienceScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>CTA Clarity</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.ctaClarityScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.ctaClarityScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Conversion Clarity</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.conversionClarityScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.conversionClarityScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Performance & Speed</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.performanceScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.performanceScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Visual Polish</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.visualQualityScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.visualQualityScore * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Site Architecture</span>
                      <span className="font-bold text-indigo-300">{lead.qualificationBreakdown.websiteUxScore}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${lead.qualificationBreakdown.websiteUxScore * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Reasons */}
                {lead.qualificationBreakdown.reasons && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-300 text-[11px]">
                      Deterministic Justifications:
                    </span>
                    <ul className="space-y-1">
                      {lead.qualificationBreakdown.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-300 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Outreach Drafts & Variants */}
        {activeTab === 'outreach' && (
          <div className="space-y-4 text-xs">
            {/* Human in the loop guidance */}
            <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-slate-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-indigo-400" />
              <div>
                <p className="text-[11px]">
                  <strong className="text-white">Human Approval Required:</strong> Outreach is grounded strictly in stored audit facts. Copy this message and send it manually on LinkedIn or via email.
                </p>
              </div>
            </div>

            {/* Variant Switcher & Generator Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex gap-1.5">
                {[
                  { type: LeadOutreachVariantType.CONNECTION, label: 'Connection Request (<300)' },
                  { type: LeadOutreachVariantType.SHORT, label: 'Short Value Note' },
                  { type: LeadOutreachVariantType.DETAILED, label: 'Detailed Loom Pitch' },
                ].map((v) => (
                  <button
                    key={v.type}
                    onClick={() => setSelectedVariant(v.type)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedVariant === v.type
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleGenerateOutreach(selectedVariant)}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{generating ? 'Generating Grounded Draft...' : 'Generate / Regenerate'}</span>
              </button>
            </div>

            {/* Draft Content Card */}
            {activeDraftText ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-all">
                  {activeDraftText}
                </div>

                {/* Personalization Basis Chips */}
                {currentVariantContent?.personalizationBasis && currentVariantContent.personalizationBasis.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Grounded Facts Used:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentVariantContent.personalizationBasis.map((fact, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-cyan-500/30 bg-cyan-950/20 px-2 py-0.5 text-[10px] text-cyan-300 font-medium"
                        >
                          {fact}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500">
                    Character count: {activeDraftText.length}
                  </span>

                  <div className="flex items-center gap-2">
                    {lead.linkedinUrl && (
                      <a
                        href={lead.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/30 px-3 py-1.5 text-sky-300 hover:bg-sky-900/40 transition-colors font-medium"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        <span>Open LinkedIn</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeDraftText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Outreach'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400 space-y-2">
                <Sparkles className="mx-auto h-8 w-8 text-slate-600" />
                <p className="text-xs">No outreach drafted yet for this prospect.</p>
                <button
                  onClick={() => handleGenerateOutreach(selectedVariant)}
                  disabled={generating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                  {generating ? 'Generating...' : 'Generate Grounded Draft'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Timeline & Interactions */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 text-xs">
            {/* Log New Interaction Form */}
            <form onSubmit={handleLogInteraction} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3">
              <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Record Manual Interaction / Note
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newInteractionType}
                  onChange={(e) => setNewInteractionType(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={LeadInteractionType.NOTE}>Internal Note</option>
                  <option value={LeadInteractionType.LINKEDIN_MANUAL}>Manual LinkedIn Message</option>
                  <option value={LeadInteractionType.EMAIL}>Manual Email</option>
                  <option value={LeadInteractionType.CALL}>Discovery Call</option>
                  <option value={LeadInteractionType.MEETING}>Meeting Held</option>
                  <option value={LeadInteractionType.OTHER}>Other Event</option>
                </select>
                <input
                  type="text"
                  required
                  value={newInteractionNote}
                  onChange={(e) => setNewInteractionNote(e.target.value)}
                  placeholder="Record summary of call, reply, or manual note..."
                  className="sm:col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loggingInteraction || !newInteractionNote.trim()}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loggingInteraction ? 'Logging...' : 'Save Interaction'}
                </button>
              </div>
            </form>

            {/* Interaction List */}
            <div className="space-y-2.5">
              {interactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-slate-500">
                  No interactions recorded yet. Log your first note or outreach event above.
                </div>
              ) : (
                interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${
                            interaction.type === LeadInteractionType.LINKEDIN_MANUAL
                              ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                              : interaction.type === LeadInteractionType.MEETING
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                : interaction.type === LeadInteractionType.EMAIL
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'
                          }`}
                        >
                          {interaction.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatRelativeTime(interaction.occurredAt || interaction.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{interaction.note}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteInteraction(interaction.id)}
                      title="Delete interaction"
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Follow-up & Tasks */}
        {activeTab === 'followup' && (
          <div className="space-y-4 text-xs">
            {/* Follow-up Scheduler Form */}
            <form onSubmit={handleSaveFollowUp} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Schedule Follow-Up Reminder
                </span>
                {lead.nextFollowUpAt && (
                  <span className="text-[11px] text-indigo-400">
                    Current: {new Date(lead.nextFollowUpAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(0)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(1)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(3)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(7)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                >
                  In 1 Week
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpDateInput('')}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-rose-400 hover:bg-slate-800"
                >
                  Clear Follow-up
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Follow-Up Date & Time</label>
                  <input
                    type="datetime-local"
                    value={followUpDateInput}
                    onChange={(e) => setFollowUpDateInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Optional Follow-Up Context Note</label>
                  <input
                    type="text"
                    value={followUpNoteInput}
                    onChange={(e) => setFollowUpNoteInput(e.target.value)}
                    placeholder="e.g. Check if client reviewed 3-min Loom breakdown..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingFollowUp}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingFollowUp ? 'Updating...' : 'Save Follow-Up Schedule'}
                </button>
              </div>
            </form>

            {/* Create Task in Unified Task System */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <ListTodo className="h-4 w-4 text-indigo-400" />
                <span>Create Unified Follow-Up Task</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Add an actionable reminder to your unified task list linked directly to this client lead.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleCreateTask}
                  disabled={creatingTask || !taskTitle.trim()}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  {creatingTask ? 'Creating...' : taskSuccess ? 'Task Created! ✓' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Edit Info */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Website URL</label>
                <input
                  type="url"
                  required
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Contact Role</label>
                <input
                  type="text"
                  value={editForm.contactRole}
                  onChange={(e) => setEditForm({ ...editForm, contactRole: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Observed Problem</label>
              <textarea
                rows={2}
                value={editForm.problem}
                onChange={(e) => setEditForm({ ...editForm, problem: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Service Opportunity</label>
              <textarea
                rows={2}
                value={editForm.opportunity}
                onChange={(e) => setEditForm({ ...editForm, opportunity: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500">
          <span>Created: {formatDate(lead.createdAt)}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
          >
            Close Workbench
          </button>
        </div>
      </div>
    </Modal>
  );
};
