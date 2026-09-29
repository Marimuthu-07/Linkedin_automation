import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Target,
  Briefcase,
  Bot,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { UserSettings } from '@linkedin-growth/shared';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    userName: '',
    userTitle: '',
    userBio: '',
    targetRoles: [] as string[],
    targetRolesInput: '',
    targetLocations: [] as string[],
    targetLocationsInput: '',
    targetTechnologies: [] as string[],
    targetTechnologiesInput: '',
    minInternshipMatchScore: 70,
    freelanceServices: [] as string[],
    freelanceServicesInput: '',
    aiProvider: 'mock' as 'mock' | 'openai' | 'gemini' | 'anthropic',
    weeklyPostingGoal: 3,
    dailyNetworkingGoal: 5,
  });

  useEffect(() => {
    setLoading(true);
    api.getSettings()
      .then((s) => {
        setSettings(s);
        setForm({
          userName: s.userName,
          userTitle: s.userTitle,
          userBio: s.userBio,
          targetRoles: s.targetRoles || [],
          targetRolesInput: '',
          targetLocations: s.targetLocations || [],
          targetLocationsInput: '',
          targetTechnologies: s.targetTechnologies || [],
          targetTechnologiesInput: '',
          minInternshipMatchScore: s.minInternshipMatchScore || 70,
          freelanceServices: s.freelanceServices || [],
          freelanceServicesInput: '',
          aiProvider: s.aiProvider || 'mock',
          weeklyPostingGoal: s.weeklyPostingGoal || 3,
          dailyNetworkingGoal: s.dailyNetworkingGoal || 5,
        });
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings({
        userName: form.userName,
        userTitle: form.userTitle,
        userBio: form.userBio,
        targetRoles: form.targetRoles,
        targetLocations: form.targetLocations,
        targetTechnologies: form.targetTechnologies,
        minInternshipMatchScore: form.minInternshipMatchScore,
        freelanceServices: form.freelanceServices,
        aiProvider: form.aiProvider,
        weeklyPostingGoal: form.weeklyPostingGoal,
        dailyNetworkingGoal: form.dailyNetworkingGoal,
      });
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (field: 'targetRoles' | 'targetLocations' | 'targetTechnologies' | 'freelanceServices', inputField: string) => {
    const val = (form as any)[inputField]?.trim();
    if (val && !(form as any)[field].includes(val)) {
      setForm({
        ...form,
        [field]: [...(form as any)[field], val],
        [inputField]: '',
      });
    }
  };

  const handleRemoveTag = (field: 'targetRoles' | 'targetLocations' | 'targetTechnologies' | 'freelanceServices', tag: string) => {
    setForm({
      ...form,
      [field]: (form as any)[field].filter((t: string) => t !== tag),
    });
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-500">Loading configuration...</div>;
  }

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Personal & System Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure student profile, AI inference models, opportunity matching criteria, and goals.
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        {/* Section 1: Personal Student Profile */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white font-heading">Student Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Professional Headline</label>
              <input
                type="text"
                value={form.userTitle}
                onChange={(e) => setForm({ ...form, userTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1">Bio / Background Context</label>
              <textarea
                rows={2}
                value={form.userBio}
                onChange={(e) => setForm({ ...form, userBio: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Career & Internship Preferences */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Target className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white font-heading">
              Career & Internship Preferences
            </h2>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">Target Engineering Roles</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.targetRolesInput}
                onChange={(e) => setForm({ ...form, targetRolesInput: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('targetRoles', 'targetRolesInput'))}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Software Engineer, AI Engineer (Press Enter)"
              />
              <button
                type="button"
                onClick={() => handleAddTag('targetRoles', 'targetRolesInput')}
                className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.targetRoles.map((r) => (
                <span
                  key={r}
                  onClick={() => handleRemoveTag('targetRoles', r)}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-slate-300 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <span>{r}</span>
                  <span>×</span>
                </span>
              ))}
            </div>
          </div>

          {/* Target Technologies */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">Target Skills & Technologies</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.targetTechnologiesInput}
                onChange={(e) => setForm({ ...form, targetTechnologiesInput: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('targetTechnologies', 'targetTechnologiesInput'))}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. TypeScript, React, Go, PostgreSQL (Press Enter)"
              />
              <button
                type="button"
                onClick={() => handleAddTag('targetTechnologies', 'targetTechnologiesInput')}
                className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.targetTechnologies.map((tech) => (
                <span
                  key={tech}
                  onClick={() => handleRemoveTag('targetTechnologies', tech)}
                  className="inline-flex items-center gap-1 rounded bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 text-indigo-300 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <span>{tech}</span>
                  <span>×</span>
                </span>
              ))}
            </div>
          </div>

          {/* Min match threshold */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Minimum Match Score for Priority Alerts: <strong className="text-indigo-400">{form.minInternshipMatchScore}%</strong>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={form.minInternshipMatchScore}
              onChange={(e) => setForm({ ...form, minInternshipMatchScore: parseInt(e.target.value, 10) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Section 3: AI Provider & Engine */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bot className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white font-heading">AI Provider Configuration</h2>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Active AI Inference Provider</label>
            <select
              value={form.aiProvider}
              onChange={(e) => setForm({ ...form, aiProvider: e.target.value as any })}
              className="w-full sm:w-80 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="mock">Mock Deterministic Engine (Offline & Tested)</option>
              <option value="openai">OpenAI (GPT-4o via API Key)</option>
              <option value="gemini">Google Gemini (Gemini 2.0 Flash / Pro)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Provider credentials exist safely in server-side environment variables (<code className="text-slate-300 font-mono">.env</code>).
            </p>
          </div>
        </div>

        {/* Section 4: LinkedIn Safety Manifesto */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>LinkedIn Safety & Human-in-the-Loop Manifesto</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-xs">
            This application is architected as an intelligent personal assistant, not an unauthorized bot. We enforce the following principles:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            <li>Zero LinkedIn credential storage or session hijacking</li>
            <li>Zero automated browser scraping or synthetic human simulation</li>
            <li>Zero automated mass connection requests, likes, or DMs</li>
            <li>All networking drafts and scheduled posts require manual human execution on LinkedIn</li>
            <li>Independent data provenance: your research and analytics belong to your database</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
