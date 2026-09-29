import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle,
  Filter,
  Sliders,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Internship, InternshipStatus } from '@linkedin-growth/shared';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { formatDate } from '../lib/utils.js';

export const InternshipsPage: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeInternship, setActiveInternship] = useState<Internship | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    company: '',
    role: '',
    location: '',
    remote: false,
    url: '',
    source: 'Company Careers Page',
    description: '',
    skills: [] as string[],
    skillInput: '',
    eligibility: 'Open to enrolled CS / Engineering students graduating 2026/2027',
    deadline: '',
    status: InternshipStatus.NEW,
  });

  const loadInternships = () => {
    setLoading(true);
    api.getInternships({
      status: selectedStatus,
      remote: remoteOnly ? 'true' : undefined,
      minScore: minMatchScore > 0 ? minMatchScore.toString() : undefined,
      search: searchQuery,
    })
      .then(setInternships)
      .catch((err) => console.error('Failed to load internships:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInternships();
  }, [selectedStatus, remoteOnly, minMatchScore, searchQuery]);

  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInternship({
        company: form.company,
        role: form.role,
        location: form.location,
        remote: form.remote,
        url: form.url,
        source: form.source,
        description: form.description,
        skills: form.skills,
        eligibility: form.eligibility,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        status: form.status,
      });

      setIsAddModalOpen(false);
      setForm({
        company: '',
        role: '',
        location: '',
        remote: false,
        url: '',
        source: 'Company Careers Page',
        description: '',
        skills: [],
        skillInput: '',
        eligibility: 'Open to enrolled CS / Engineering students graduating 2026/2027',
        deadline: '',
        status: InternshipStatus.NEW,
      });
      loadInternships();
    } catch (err: any) {
      alert(`Error creating internship: ${err.message}`);
    }
  };

  const handleStatusChange = async (internshipId: string, nextStatus: InternshipStatus) => {
    try {
      await api.updateInternship(internshipId, { status: nextStatus });
      setInternships((prev) =>
        prev.map((item) => (item.id === internshipId ? { ...item, status: nextStatus } : item))
      );
      if (activeInternship && activeInternship.id === internshipId) {
        setActiveInternship((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && form.skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(form.skillInput.trim())) {
        setForm({
          ...form,
          skills: [...form.skills, form.skillInput.trim()],
          skillInput: '',
        });
      }
    }
  };

  const removeSkill = (skill: string) => {
    setForm({
      ...form,
      skills: form.skills.filter((s) => s !== skill),
    });
  };

  const statuses = [
    'ALL',
    InternshipStatus.NEW,
    InternshipStatus.REVIEWING,
    InternshipStatus.SAVED,
    InternshipStatus.INTERESTED,
    InternshipStatus.CLOSED,
    InternshipStatus.EXPIRED,
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Internship Intelligence & Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track official career page openings with automatic profile matching and deadline alerts.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Compliance Notice */}
      <div className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-xs text-slate-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />
        <p>
          <strong className="text-white">Official Sources & Direct Applications:</strong> All opportunities link directly to official company career portals. The system organizes deadlines and scores alignment, without automated bot applications.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, role, skills, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Remote Toggle */}
        <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-800">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Remote Only</span>
        </label>

        {/* Min Match Score Slider */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-300">
          <span>Min Match: <strong className="text-indigo-400">{minMatchScore}%</strong></span>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(parseInt(e.target.value, 10))}
            className="w-24 accent-indigo-500"
          />
        </div>
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

      {/* Opportunities List Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading opportunities...</div>
      ) : internships.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-200">No internship opportunities found</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your match score slider or search parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {internships.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header: Company & Match Score Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-heading">{item.company}</h3>
                    <p className="text-xs font-medium text-indigo-400 mt-0.5">{item.role}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                      {item.matchScore}% Match
                    </span>
                    <Badge variant="status" status={item.status} className="mt-1">
                      {item.status}
                    </Badge>
                  </div>
                </div>

                {/* Location & Remote */}
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span>{item.location}</span>
                  {item.remote && (
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-cyan-300">
                      Remote
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-300 line-clamp-2">{item.description}</p>

                {/* Skills Tags */}
                {item.skills && item.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Match Reasons */}
                {item.matchReasons && item.matchReasons.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {item.matchReasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span className="line-clamp-1">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{item.deadline ? `Due: ${formatDate(item.deadline)}` : 'Open Rolling'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveInternship(item);
                      setIsDetailModalOpen(true);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  >
                    Details
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <span>Apply</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Internship Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Internship Opportunity"
        description="Record a verified internship opening from an official company career portal."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateInternship} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Stripe"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="Software Engineering Intern"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Location *</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Official Career Page URL *</label>
              <input
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="https://company.com/careers/..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remoteCheck"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remoteCheck" className="text-slate-300 font-medium cursor-pointer">
              Remote / Flexible Work Option Available
            </label>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Role Description *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="Overview of the internship project and responsibilities..."
            />
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">Required Skills (Press Enter to add)</label>
            <input
              type="text"
              value={form.skillInput}
              onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
              onKeyDown={handleAddSkill}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              placeholder="TypeScript, React, PostgreSQL..."
            />
            {form.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.skills.map((s) => (
                  <span
                    key={s}
                    onClick={() => removeSkill(s)}
                    className="inline-flex items-center gap-1 rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs text-indigo-300 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    <span>{s}</span>
                    <span>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Eligibility Criteria</label>
              <input
                type="text"
                value={form.eligibility}
                onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Application Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
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
              Save Opportunity
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {activeInternship && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`${activeInternship.role} @ ${activeInternship.company}`}
          description={`Match Score: ${activeInternship.matchScore}%`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Status change bar */}
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3">
              {Object.values(InternshipStatus).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(activeInternship.id, st)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeInternship.status === st
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div>
                <span className="font-semibold text-slate-400">Description:</span>
                <p className="mt-1 text-slate-200 leading-relaxed">{activeInternship.description}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-400">Eligibility:</span>
                <p className="mt-1 text-slate-300">{activeInternship.eligibility}</p>
              </div>

              {activeInternship.matchReasons && (
                <div>
                  <span className="font-semibold text-emerald-400">Profile Match Breakdown:</span>
                  <ul className="mt-1 space-y-1">
                    {activeInternship.matchReasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
              <a
                href={activeInternship.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
              >
                <span>Open Career Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
