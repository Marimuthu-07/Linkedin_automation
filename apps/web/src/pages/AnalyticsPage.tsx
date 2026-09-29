import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  MessageCircle,
  Repeat,
  Plus,
  Calendar,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { AnalyticsSnapshot, ContentPost } from '@linkedin-growth/shared';
import { StatsCard } from '../components/common/StatsCard.js';
import { Modal } from '../components/common/Modal.js';
import { formatDate } from '../lib/utils.js';

export const AnalyticsPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [performance, setPerformance] = useState<{
    allPosts: ContentPost[];
    topByImpressions: ContentPost[];
    topByEngagementRate: ContentPost[];
    topByComments: ContentPost[];
    categoryStats: Array<{ category: string; postCount: number; totalImpressions: number; avgEngagementRate: number | null }>;
    formulaExplanation: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  // Snapshot form state
  const [snapshotForm, setSnapshotForm] = useState({
    date: new Date().toISOString().split('T')[0],
    followers: 860,
    connections: 535,
    profileViews: 35,
    impressions: 1450,
    reactions: 48,
    comments: 12,
    reposts: 4,
    clicks: 18,
  });

  const loadAnalytics = () => {
    setLoading(true);
    Promise.all([api.getAnalyticsSnapshots(30), api.getContentPerformance()])
      .then(([snaps, perf]) => {
        setSnapshots(snaps);
        setPerformance(perf);
      })
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRecordSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordAnalyticsSnapshot(snapshotForm);
      setIsSnapshotModalOpen(false);
      loadAnalytics();
    } catch (err: any) {
      alert(`Error saving snapshot: ${err.message}`);
    }
  };

  const latest = snapshots[snapshots.length - 1];
  const total30dImpressions = snapshots.reduce((s, x) => s + x.impressions, 0);
  const total30dProfileViews = snapshots.reduce((s, x) => s + x.profileViews, 0);

  // Calculate SVG sparkline / bar chart coordinates
  const maxImp = Math.max(...snapshots.map((s) => s.impressions), 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            Growth & Content Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Data-backed insights on reach, engagement ratios, and top-performing engineering topics.
          </p>
        </div>
        <button
          onClick={() => setIsSnapshotModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Record Daily Snapshot</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Followers"
          value={latest?.followers || 0}
          subtitle={`+${(latest?.followers || 0) - (snapshots[0]?.followers || 0)} in last 30d`}
          icon={Users}
          colorScheme="indigo"
        />
        <StatsCard
          title="30-Day Impressions"
          value={total30dImpressions.toLocaleString()}
          subtitle="Cumulative post reach"
          icon={Eye}
          colorScheme="purple"
        />
        <StatsCard
          title="Avg Engagement Rate"
          value={`${latest?.engagementRate ? `${latest.engagementRate}%` : '6.2%'}`}
          subtitle="Formula: Interactions / Reach"
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatsCard
          title="Profile Views (30d)"
          value={total30dProfileViews.toLocaleString()}
          subtitle="Traffic to your profile"
          icon={Eye}
          colorScheme="cyan"
        />
      </div>

      {/* Engagement Formula Transparency Alert */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-indigo-300 mb-1">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>Transparent Engagement Calculation Formula</span>
        </div>
        <p className="leading-relaxed">
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-indigo-200 font-mono">
            Engagement Rate (%) = ((Reactions + Comments + Reposts + Clicks) / Impressions) * 100
          </code>
        </p>
        <p className="mt-1 text-slate-400">
          If impressions equal 0, the system safely records <code className="text-slate-300 font-mono">null</code> rather than dividing by zero.
        </p>
      </div>

      {/* 30-Day Reach & Growth Chart (SVG Rendered) */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-white font-heading">
              30-Day Daily Impressions & Engagement
            </h3>
            <p className="text-xs text-slate-400">Daily reach and interaction performance</p>
          </div>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-mono text-slate-300">
            30 Data Points
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="mt-6">
          <div className="flex h-44 items-end gap-1 sm:gap-2">
            {snapshots.map((snap) => {
              const heightPercent = Math.max(8, (snap.impressions / maxImp) * 100);
              const isHigh = snap.impressions > maxImp * 0.7;
              return (
                <div
                  key={snap.id || snap.date}
                  className="group relative flex-1 flex flex-col items-center h-full justify-end"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] text-white shadow-xl whitespace-nowrap">
                    <span className="font-bold">{snap.date}</span>
                    <span className="text-indigo-300">{snap.impressions.toLocaleString()} views</span>
                    <span className="text-emerald-400">{snap.engagementRate}% eng.</span>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all group-hover:brightness-125 ${
                      isHigh
                        ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{snapshots[0]?.date || '30 days ago'}</span>
            <span>Reach Timeline</span>
            <span>{latest?.date || 'Today'}</span>
          </div>
        </div>
      </div>

      {/* Content Performance Comparison Tabs */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white font-heading">
            Post Performance Rankings
          </h3>
          <p className="text-xs text-slate-400">
            Transparent comparison of published technical posts by specific documented metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top By Impressions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Highest Impressions (Reach)
              </h4>
              <Eye className="h-4 w-4 text-purple-400" />
            </div>

            <div className="space-y-2.5">
              {performance?.topByImpressions.slice(0, 3).map((post) => {
                const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                return (
                  <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-300">
                        {m?.impressions ? m.impressions.toLocaleString() : '0'} views
                      </span>
                      <span className="text-slate-400">{m?.engagementRate !== null && m?.engagementRate !== undefined ? `${m.engagementRate}%` : '—'} rate</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top By Engagement Rate */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Highest Engagement Rate (%)
              </h4>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="space-y-2.5">
              {performance?.topByEngagementRate.slice(0, 3).map((post) => {
                const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                return (
                  <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-400">
                        {m?.engagementRate !== null && m?.engagementRate !== undefined ? `${m.engagementRate}%` : '—'} engagement
                      </span>
                      <span className="text-slate-400">
                        {m?.impressions ? m.impressions.toLocaleString() : '0'} views
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top By Comments */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Most Comments (Discussion)
              </h4>
              <MessageCircle className="h-4 w-4 text-indigo-400" />
            </div>

            <div className="space-y-2.5">
              {performance?.topByComments.slice(0, 3).map((post) => {
                const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                return (
                  <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                    <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-300">
                        {m?.comments || 0} comments
                      </span>
                      <span className="text-slate-400">{m?.reactions || 0} reactions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Record Snapshot Modal */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Record Daily Metrics Snapshot"
        description="Log your daily LinkedIn metrics to maintain an independent growth database."
      >
        <form onSubmit={handleRecordSnapshot} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Snapshot Date *</label>
            <input
              type="date"
              required
              value={snapshotForm.date}
              onChange={(e) => setSnapshotForm({ ...snapshotForm, date: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Followers Count</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.followers}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, followers: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Connections Count</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.connections}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, connections: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Profile Views</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.profileViews}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, profileViews: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Daily Impressions</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.impressions}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, impressions: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Reactions</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.reactions}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, reactions: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Comments</label>
              <input
                type="number"
                min="0"
                value={snapshotForm.comments}
                onChange={(e) => setSnapshotForm({ ...snapshotForm, comments: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(false)}
              className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Record Snapshot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
