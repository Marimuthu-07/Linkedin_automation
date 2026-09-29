import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import { LeadStatus, LeadQualificationBreakdown, calculateLeadQualification } from '@linkedin-growth/shared';
import { Modal } from '../common/Modal.js';
import { api } from '../../lib/api.js';

interface LeadAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeadAddModal: React.FC<LeadAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'audit'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [issueInput, setIssueInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    company: '',
    website: '',
    industry: 'Software / Technology',
    location: '',
    contactName: '',
    contactRole: '',
    linkedinUrl: '',
    companyLinkedinUrl: '',
    source: 'Manual Website Audit',
    problem: '',
    opportunity: '',
    status: LeadStatus.DISCOVERED,
    notes: '',
    websiteUxScore: 5,
    mobileExperienceScore: 4,
    performanceScore: 4,
    visualQualityScore: 5,
    ctaClarityScore: 3,
    conversionClarityScore: 3,
    serviceFit: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH',
    identifiedIssues: [] as string[],
  });

  // Live Score Calculation
  const [liveScore, setLiveScore] = useState<LeadQualificationBreakdown>(() =>
    calculateLeadQualification({
      websiteUxScore: 5,
      mobileExperienceScore: 4,
      performanceScore: 4,
      visualQualityScore: 5,
      ctaClarityScore: 3,
      conversionClarityScore: 3,
      serviceFit: 'HIGH',
      identifiedIssues: [],
    })
  );

  useEffect(() => {
    const calculated = calculateLeadQualification({
      websiteUxScore: formData.websiteUxScore,
      mobileExperienceScore: formData.mobileExperienceScore,
      performanceScore: formData.performanceScore,
      visualQualityScore: formData.visualQualityScore,
      ctaClarityScore: formData.ctaClarityScore,
      conversionClarityScore: formData.conversionClarityScore,
      serviceFit: formData.serviceFit,
      identifiedIssues: formData.identifiedIssues,
    });
    setLiveScore(calculated);
  }, [
    formData.websiteUxScore,
    formData.mobileExperienceScore,
    formData.performanceScore,
    formData.visualQualityScore,
    formData.ctaClarityScore,
    formData.conversionClarityScore,
    formData.serviceFit,
    formData.identifiedIssues,
  ]);

  const handleAddIssue = () => {
    if (issueInput.trim() && !formData.identifiedIssues.includes(issueInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        identifiedIssues: [...prev.identifiedIssues, issueInput.trim()],
      }));
      setIssueInput('');
    }
  };

  const handleRemoveIssue = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      identifiedIssues: prev.identifiedIssues.filter((i) => i !== issue),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createLead({
        company: formData.company.trim(),
        website: formData.website.trim(),
        industry: formData.industry.trim(),
        location: formData.location.trim() || null,
        contactName: formData.contactName.trim() || null,
        contactRole: formData.contactRole.trim() || null,
        linkedinUrl: formData.linkedinUrl.trim() || null,
        companyLinkedinUrl: formData.companyLinkedinUrl.trim() || null,
        source: formData.source || 'Manual Research',
        problem: formData.problem.trim(),
        opportunity: formData.opportunity.trim(),
        qualificationScore: liveScore.totalScore,
        qualificationBreakdown: liveScore,
        status: liveScore.totalScore >= 70 ? LeadStatus.QUALIFIED : formData.status,
        notes: formData.notes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Error creating lead: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Prospect & Website Opportunity Audit"
      description="Record manual website observations and calculate transparent opportunity fit scores."
      maxWidth="2xl"
    >
      {/* Tab Selector */}
      <div className="flex border-b border-slate-800 mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 px-3 transition-colors border-b-2 ${
            activeTab === 'info'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Company & Contact Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>2. Website Opportunity Audit</span>
          <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
            {liveScore.totalScore}/100
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {activeTab === 'info' ? (
          <div className="space-y-3.5">
            {/* Company & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="Acme Analytics Inc."
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Website URL *</label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://acmeanalytics.io"
                />
              </div>
            </div>

            {/* Industry & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Industry *</label>
                <input
                  type="text"
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="B2B SaaS / FinTech"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="San Francisco, CA (or Remote)"
                />
              </div>
            </div>

            {/* Contact Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="Jordan Lee"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Contact Role</label>
                <input
                  type="text"
                  value={formData.contactRole}
                  onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="Head of Growth / CTO"
                />
              </div>
            </div>

            {/* LinkedIn URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Contact LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://www.linkedin.com/in/jordanlee"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Company LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.companyLinkedinUrl}
                  onChange={(e) => setFormData({ ...formData, companyLinkedinUrl: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://www.linkedin.com/company/acme"
                />
              </div>
            </div>

            {/* Problem & Opportunity */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">Observed Technical / UX Problem *</label>
              <textarea
                required
                rows={2}
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. 5.4s mobile LCP load, buried subscription CTA below fold, broken table on iOS Safari..."
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Service Opportunity / Value Pitch *</label>
              <textarea
                required
                rows={2}
                value={formData.opportunity}
                onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Next.js storefront overhaul with instant sub-second transitions and interactive ROI calculator..."
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">Step 1 of 2: Basic Info</span>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Proceed to Audit Ratings →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Score Callout */}
            <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-indigo-200">
                    Transparent Opportunity Score: {liveScore.totalScore}/100
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Calculated deterministically from your UX observations and service fit.
                  </p>
                </div>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                  liveScore.totalScore >= 75
                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                    : liveScore.totalScore >= 60
                      ? 'border-indigo-500/30 bg-indigo-500/20 text-indigo-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {liveScore.totalScore >= 75 ? 'HIGH OPPORTUNITY' : liveScore.totalScore >= 60 ? 'MODERATE FIT' : 'LOW FIT'}
              </span>
            </div>

            {/* Audit Sliders (0-10) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Website Audit Dimensions (0 = Poor / High Opportunity, 10 = Flawless)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Mobile Experience</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.mobileExperienceScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.mobileExperienceScore}
                    onChange={(e) => setFormData({ ...formData, mobileExperienceScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>CTA & Action Clarity</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.ctaClarityScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.ctaClarityScore}
                    onChange={(e) => setFormData({ ...formData, ctaClarityScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Conversion Funnel Clarity</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.conversionClarityScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.conversionClarityScore}
                    onChange={(e) => setFormData({ ...formData, conversionClarityScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Performance & Speed</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.performanceScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.performanceScore}
                    onChange={(e) => setFormData({ ...formData, performanceScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Visual Quality & Polish</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.visualQualityScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.visualQualityScore}
                    onChange={(e) => setFormData({ ...formData, visualQualityScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Overall Site UX</span>
                    <span className="font-mono text-indigo-300 font-bold">{formData.websiteUxScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.websiteUxScore}
                    onChange={(e) => setFormData({ ...formData, websiteUxScore: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Service Fit Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Service Capability Match</label>
                <select
                  value={formData.serviceFit}
                  onChange={(e) => setFormData({ ...formData, serviceFit: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="HIGH">HIGH (Strong Match for Tech Stack / Full Rebuild)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Optimization Opportunity)</option>
                  <option value="LOW">LOW (Peripheral Service Match)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Add Specific Issue Tag</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={issueInput}
                    onChange={(e) => setIssueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIssue();
                      }
                    }}
                    placeholder="e.g. Broken checkout iframe..."
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddIssue}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Issue Tags List */}
            {formData.identifiedIssues.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.identifiedIssues.map((issue) => (
                  <span
                    key={issue}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-950/20 px-2 py-0.5 text-[11px] text-rose-300"
                  >
                    <span>{issue}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIssue(issue)}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Reasons Preview */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] space-y-1">
              <span className="font-semibold text-indigo-300">Deterministic Justifications:</span>
              <ul className="space-y-0.5 text-slate-400">
                {liveScore.reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-indigo-400" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="text-slate-400 hover:text-slate-200"
              >
                ← Back to Basic Info
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.company || !formData.website || !formData.problem}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {submitting ? 'Saving Lead...' : 'Save Lead & Opportunity'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
