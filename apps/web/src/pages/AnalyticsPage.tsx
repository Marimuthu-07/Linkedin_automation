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
  ArrowRight,
  Clock,
  Briefcase,
  GraduationCap,
  FileText,
  AlertTriangle,
  ExternalLink,
  Layers,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api.js';
import {
  AnalyticsOverview,
  ContentAnalytics,
  ContentTrendPoint,
  NetworkingAnalytics,
  NetworkingTrendPoint,
  LeadAnalytics,
  LeadTrendPoint,
  InternshipAnalytics,
  InternshipTrendPoint,
  AnalyticsSnapshot,
  ContentPost,
  AnalyticsPeriod,
  AnalyticsGroupBy,
} from '@linkedin-growth/shared';
import { StatsCard } from '../components/common/StatsCard.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { formatDate } from '../lib/utils.js';
import { TimeSeriesChart, ChartDataPoint } from '../components/analytics/TimeSeriesChart.js';
import { MetricDeltaBadge } from '../components/analytics/MetricDeltaBadge.js';
import { DistributionBar } from '../components/analytics/DistributionBar.js';
import { FormulaExplainerModal } from '../components/analytics/FormulaExplainerModal.js';

type TabType = 'overview' | 'content' | 'networking' | 'leads' | 'internships';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.THIRTY_DAYS);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics | null>(null);
  const [contentTrends, setContentTrends] = useState<ContentTrendPoint[]>([]);
  const [networkingAnalytics, setNetworkingAnalytics] = useState<NetworkingAnalytics | null>(null);
  const [networkingTrends, setNetworkingTrends] = useState<NetworkingTrendPoint[]>([]);
  const [leadAnalytics, setLeadAnalytics] = useState<LeadAnalytics | null>(null);
  const [leadTrends, setLeadTrends] = useState<LeadTrendPoint[]>([]);
  const [internshipAnalytics, setInternshipAnalytics] = useState<InternshipAnalytics | null>(null);
  const [internshipTrends, setInternshipTrends] = useState<InternshipTrendPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

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

  const queryParams = {
    period,
    ...(period === AnalyticsPeriod.CUSTOM && customStartDate && customEndDate
      ? { startDate: customStartDate, endDate: customEndDate }
      : {}),
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.getAnalyticsOverview(queryParams);
        setOverview(res);
      } else if (activeTab === 'content') {
        const [analytics, trends] = await Promise.all([
          api.getContentAnalytics(queryParams),
          api.getContentTrends(queryParams),
        ]);
        setContentAnalytics(analytics);
        setContentTrends(trends);
      } else if (activeTab === 'networking') {
        const [analytics, trends] = await Promise.all([
          api.getNetworkingAnalytics(queryParams),
          api.getNetworkingTrends(queryParams),
        ]);
        setNetworkingAnalytics(analytics);
        setNetworkingTrends(trends);
      } else if (activeTab === 'leads') {
        const [analytics, trends] = await Promise.all([
          api.getLeadAnalytics(queryParams),
          api.getLeadTrends(queryParams),
        ]);
        setLeadAnalytics(analytics);
        setLeadTrends(trends);
      } else if (activeTab === 'internships') {
        const [analytics, trends] = await Promise.all([
          api.getInternshipAnalytics(queryParams),
          api.getInternshipTrends(queryParams),
        ]);
        setInternshipAnalytics(analytics);
        setInternshipTrends(trends);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, period, customStartDate, customEndDate]);

  const handleRecordSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordAnalyticsSnapshot(snapshotForm);
      setIsSnapshotModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error saving snapshot: ${err.message}`);
    }
  };

  // Convert snapshots to chart data points
  const snapshotChartData: ChartDataPoint[] = (overview?.snapshots || []).map((s) => ({
    date: s.date,
    value: s.impressions,
    secondaryValue: s.engagementRate || 0,
    label: `${s.impressions.toLocaleString()} views`,
  }));

  const contentTrendChartData: ChartDataPoint[] = contentTrends.map((t) => ({
    date: t.date,
    value: t.impressions,
    secondaryValue: t.engagementRate || 0,
    label: `${t.impressions.toLocaleString()} impressions`,
  }));

  const networkingTrendChartData: ChartDataPoint[] = networkingTrends.map((t) => ({
    date: t.date,
    value: t.contactsAdded,
    secondaryValue: t.interactionsLogged,
    label: `${t.contactsAdded} contacts added`,
  }));

  const leadTrendChartData: ChartDataPoint[] = leadTrends.map((t) => ({
    date: t.date,
    value: t.leadsCreated,
    secondaryValue: t.leadsQualified,
    label: `${t.leadsCreated} leads created`,
  }));

  const internshipTrendChartData: ChartDataPoint[] = internshipTrends.map((t) => ({
    date: t.date,
    value: t.opportunitiesDiscovered,
    label: `${t.opportunitiesDiscovered} opportunities discovered`,
  }));

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
              Analytics Engine & Growth Intelligence
            </h1>
            <button
              onClick={() => setIsFormulaModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              title="View mathematical formulas and definitions"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Formulas</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data-backed analytics across Content, Networking, Freelance Leads, and Internship Pipelines.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Pills */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            {[
              { id: AnalyticsPeriod.SEVEN_DAYS, label: '7D' },
              { id: AnalyticsPeriod.THIRTY_DAYS, label: '30D' },
              { id: AnalyticsPeriod.NINETY_DAYS, label: '90D' },
              { id: AnalyticsPeriod.ONE_YEAR, label: '1Y' },
              { id: AnalyticsPeriod.CUSTOM, label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Record Daily Snapshot Button */}
          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Record Snapshot</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Input (when Custom is selected) */}
      {period === AnalyticsPeriod.CUSTOM && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 backdrop-blur-md">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-white">Custom Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Deterministic Mathematical Insights Banner */}
      {overview?.insights && overview.insights.length > 0 && activeTab === 'overview' && (
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/70 to-purple-950/30 p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Deterministic Period Insights</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 space-y-1 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{insight.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${
                      insight.type === 'positive'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : insight.type === 'attention'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {insight.domain}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Domain Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'overview', label: 'Cross-Domain Overview', icon: Layers },
          { id: 'content', label: 'Content Engine', icon: FileText },
          { id: 'networking', label: 'Networking Pipeline', icon: Users },
          { id: 'leads', label: 'Freelance Leads', icon: Briefcase },
          { id: 'internships', label: 'Internship Tracker', icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-white bg-slate-900/40 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CROSS-DOMAIN OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-8">
          {/* Top Level Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Impressions</span>
                <Eye className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-heading text-white">
                  {overview.content.totalImpressions.toLocaleString()}
                </span>
                <MetricDeltaBadge comparison={overview.content.impressionsComparison} />
              </div>
              <p className="text-[11px] text-slate-500">
                {overview.content.publishedInPeriod} posts published in period
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Avg Engagement Rate</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-heading text-white">
                  {overview.content.avgEngagementRate !== null ? `${overview.content.avgEngagementRate}%` : '—'}
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  {overview.content.totalInteractions.toLocaleString()} total interactions
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Formula: Interactions / Reach
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Networking Activity</span>
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-heading text-white">
                  {overview.networking.totalContacts.toLocaleString()}
                </span>
                <MetricDeltaBadge comparison={overview.networking.contactsComparison} />
              </div>
              <p className="text-[11px] text-slate-500">
                {overview.networking.followUpsDueCount} follow-up{overview.networking.followUpsDueCount !== 1 ? 's' : ''} currently due
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Freelance & Internships</span>
                <Briefcase className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-heading text-white">
                  {overview.leads.qualifiedCount} Leads
                </span>
                <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20">
                  {overview.internships.highMatchCount} Matches &gt;80%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {overview.internships.upcomingDeadlinesCount} upcoming application deadlines
              </p>
            </div>
          </div>

          {/* Time Series Reach & Interaction Sparkline */}
          <TimeSeriesChart
            title="Daily Reach & Engagement Timeline"
            subtitle="Recorded daily impressions from your local snapshot database"
            data={snapshotChartData}
            colorScheme="indigo"
            secondaryLabel="Engagement Rate (%)"
            valueSuffix=" views"
            chartType="bar"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTENT ENGINE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'content' && contentAnalytics && (
        <div className="space-y-8">
          {/* Content KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Posts"
              value={contentAnalytics.totalPosts}
              subtitle={`${contentAnalytics.publishedPostsCount} published in period`}
              icon={FileText}
              colorScheme="indigo"
            />
            <StatsCard
              title="Total Impressions"
              value={contentAnalytics.totalImpressions.toLocaleString()}
              subtitle={`Avg ${contentAnalytics.avgImpressionsPerPost.toLocaleString()} per post`}
              icon={Eye}
              colorScheme="purple"
            />
            <StatsCard
              title="Avg Engagement Rate"
              value={contentAnalytics.avgEngagementRate !== null ? `${contentAnalytics.avgEngagementRate}%` : '—'}
              subtitle="Interactions / Impressions"
              icon={TrendingUp}
              colorScheme="emerald"
            />
            <StatsCard
              title="Total Reactions"
              value={contentAnalytics.totalReactions.toLocaleString()}
              subtitle={`${contentAnalytics.totalComments} comments logged`}
              icon={MessageCircle}
              colorScheme="amber"
            />
            <StatsCard
              title="Reposts & Clicks"
              value={(contentAnalytics.totalReposts + contentAnalytics.totalClicks).toLocaleString()}
              subtitle={`${contentAnalytics.totalReposts} reposts, ${contentAnalytics.totalClicks} clicks`}
              icon={Repeat}
              colorScheme="cyan"
            />
          </div>

          {/* Impressions Trend Chart */}
          <TimeSeriesChart
            title="Content Impressions & Interaction Velocity"
            subtitle="Aggregated daily metrics across all published technical posts"
            data={contentTrendChartData}
            colorScheme="purple"
            valueSuffix=" views"
            chartType="bar"
          />

          {/* Category Performance Breakdown & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionBar
              title="Posts by Technical Category"
              subtitle="Distribution of created posts across engineering topics"
              items={Object.entries(contentAnalytics.postsByCategory).map(([cat, count]) => ({
                label: cat.replace(/_/g, ' '),
                count,
              }))}
            />

            <DistributionBar
              title="Lifecycle Status Distribution"
              subtitle="Current volume across human-in-the-loop workflow stages"
              items={Object.entries(contentAnalytics.postsByStatus).map(([status, count]) => ({
                label: status,
                count,
                badge: status === 'PUBLISHED' ? 'Live' : undefined,
              }))}
            />
          </div>

          {/* Top Performing Technical Posts Tables */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white font-heading">
                Top Performing Posts (Documented Metrics)
              </h3>
              <p className="text-xs text-slate-400">
                Ranked by verified recorded database metrics without arbitrary scoring.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top by Reach */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                    Highest Reach (Impressions)
                  </h4>
                  <Eye className="h-4 w-4 text-purple-400" />
                </div>
                <div className="space-y-2.5">
                  {contentAnalytics.topPostsByImpressions.map((post) => {
                    const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                    return (
                      <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                        <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title || post.idea}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-300">
                            {m?.impressions ? m.impressions.toLocaleString() : '0'} views
                          </span>
                          <span className="text-slate-400">
                            {m?.engagementRate !== null && m?.engagementRate !== undefined ? `${m.engagementRate}%` : '—'} rate
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top by Engagement Rate */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Highest Engagement Rate (%)
                  </h4>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="space-y-2.5">
                  {contentAnalytics.topPostsByEngagementRate.map((post) => {
                    const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                    return (
                      <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                        <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title || post.idea}</p>
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

              {/* Top by Comments */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Most Discussion (Comments)
                  </h4>
                  <MessageCircle className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="space-y-2.5">
                  {contentAnalytics.topPostsByComments.map((post) => {
                    const m = Array.isArray(post.metrics) && post.metrics.length > 0 ? post.metrics[0] : (post.latestMetrics || (post.metrics as any) || null);
                    return (
                      <div key={post.id} className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3">
                        <p className="text-xs font-medium text-slate-200 line-clamp-2">{post.title || post.idea}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-300">
                            {m?.comments || 0} comments
                          </span>
                          <span className="text-slate-400">
                            {m?.reactions || 0} reactions
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NETWORKING ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'networking' && networkingAnalytics && (
        <div className="space-y-8">
          {/* Networking KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Contacts"
              value={networkingAnalytics.totalContacts}
              subtitle={`+${networkingAnalytics.contactsAddedInPeriod} added in period`}
              icon={Users}
              colorScheme="indigo"
            />
            <StatsCard
              title="Interactions Logged"
              value={networkingAnalytics.interactionsInPeriod}
              subtitle={`${networkingAnalytics.followUpsCompleted} historical touchpoints`}
              icon={MessageCircle}
              colorScheme="purple"
            />
            <StatsCard
              title="Follow-Ups Due"
              value={networkingAnalytics.followUpsDueToday + networkingAnalytics.followUpsOverdue}
              subtitle={`${networkingAnalytics.followUpsOverdue} overdue, ${networkingAnalytics.followUpsDueToday} due today`}
              icon={Clock}
              colorScheme="amber"
            />
            <StatsCard
              title="Response Rate"
              value={networkingAnalytics.responseRate !== null ? `${networkingAnalytics.responseRate}%` : '—'}
              subtitle={`${networkingAnalytics.responseCount} connected / replied`}
              icon={TrendingUp}
              colorScheme="emerald"
            />
          </div>

          {/* Contact Acquisition & Interactions Timeline */}
          <TimeSeriesChart
            title="Networking Growth Velocity"
            subtitle="Contacts added and verified touchpoints recorded over time"
            data={networkingTrendChartData}
            colorScheme="indigo"
            valueSuffix=" contacts"
            chartType="bar"
          />

          {/* Pipeline Status & Category Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionBar
              title="Contacts by Pipeline Stage"
              subtitle="Volume across human-in-the-loop relationship states"
              items={Object.entries(networkingAnalytics.contactsByStatus).map(([status, count]) => ({
                label: status,
                count,
              }))}
            />

            <DistributionBar
              title="Contacts by Professional Category"
              subtitle="Target roles and engineering categories"
              items={Object.entries(networkingAnalytics.contactsByCategory).map(([cat, count]) => ({
                label: cat.replace(/_/g, ' '),
                count,
              }))}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FREELANCE LEADS ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'leads' && leadAnalytics && (
        <div className="space-y-8">
          {/* Leads KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Leads"
              value={leadAnalytics.totalLeads}
              subtitle={`+${leadAnalytics.leadsCreatedInPeriod} audited in period`}
              icon={Briefcase}
              colorScheme="emerald"
            />
            <StatsCard
              title="Qualified Opportunities"
              value={leadAnalytics.qualifiedLeadsCount}
              subtitle="High optimization opportunity"
              icon={CheckCircle2}
              colorScheme="indigo"
            />
            <StatsCard
              title="Avg Qualification Score"
              value={`${leadAnalytics.avgQualificationScore} / 100`}
              subtitle="Objective technical scoring"
              icon={TrendingUp}
              colorScheme="cyan"
            />
            <StatsCard
              title="Outreach & In Progress"
              value={leadAnalytics.contactedLeadsCount}
              subtitle="Active client conversations"
              icon={MessageCircle}
              colorScheme="purple"
            />
          </div>

          {/* Leads Trend Chart */}
          <TimeSeriesChart
            title="Lead Discovery & Qualification Velocity"
            subtitle="Weekly lead ingestion and technical audits"
            data={leadTrendChartData}
            colorScheme="emerald"
            valueSuffix=" leads"
            chartType="bar"
          />

          {/* Pipeline Funnel & Source Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white font-heading">Lead Conversion Funnel</h3>
                <span className="text-[10px] text-slate-400 font-mono">Explicit Stages</span>
              </div>
              <div className="space-y-3">
                {leadAnalytics.pipelineFunnel.map((stage) => (
                  <div key={stage.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{stage.status}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white font-bold">{stage.count}</span>
                        <span className="text-slate-500 text-[11px]">({stage.percentageOfTotal}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${stage.percentageOfTotal}%` }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DistributionBar
              title="Leads by Research Source"
              subtitle="Origin of audited client opportunities"
              items={Object.entries(leadAnalytics.leadsBySource).map(([src, count]) => ({
                label: src,
                count,
              }))}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INTERNSHIP ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'internships' && internshipAnalytics && (
        <div className="space-y-8">
          {/* Internship KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tracked Opportunities"
              value={internshipAnalytics.totalOpportunities}
              subtitle={`+${internshipAnalytics.opportunitiesAddedInPeriod} added in period`}
              icon={GraduationCap}
              colorScheme="cyan"
            />
            <StatsCard
              title="High Matches (&gt;80%)"
              value={internshipAnalytics.highMatchCount}
              subtitle="Target skills & role alignment"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
            <StatsCard
              title="Avg Match Score"
              value={`${internshipAnalytics.avgMatchScore}%`}
              subtitle="Profile alignment ratio"
              icon={TrendingUp}
              colorScheme="indigo"
            />
            <StatsCard
              title="Upcoming Deadlines"
              value={internshipAnalytics.upcomingDeadlines.length}
              subtitle="Deadlines within 30 days"
              icon={Clock}
              colorScheme="amber"
            />
          </div>

          {/* Discovery Trend Chart */}
          <TimeSeriesChart
            title="Opportunity Discovery Timeline"
            subtitle="Ingestion and tracking volume of target engineering internships"
            data={internshipTrendChartData}
            colorScheme="cyan"
            valueSuffix=" roles"
            chartType="bar"
          />

          {/* Status & Company Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionBar
              title="Opportunities by Application Status"
              subtitle="Current review and saved states"
              items={Object.entries(internshipAnalytics.opportunitiesByStatus).map(([st, count]) => ({
                label: st,
                count,
              }))}
            />

            <DistributionBar
              title="Top Tracked Companies"
              subtitle="Organizations with multiple matching openings"
              items={internshipAnalytics.opportunitiesByCompany.map((c) => ({
                label: c.company,
                count: c.count,
              }))}
            />
          </div>

          {/* Upcoming Deadlines Table */}
          {internshipAnalytics.upcomingDeadlines.length > 0 && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white font-heading">
                    Upcoming Application Deadlines
                  </h3>
                </div>
                <span className="text-xs text-amber-400 font-medium">
                  {internshipAnalytics.upcomingDeadlines.length} approaching
                </span>
              </div>

              <div className="space-y-2.5">
                {internshipAnalytics.upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.company}</span>
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          {item.matchScore}% Match
                        </span>
                        <Badge variant="status" status={item.status}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{item.role}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.location} {item.remote && '• Remote'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {item.deadline && (
                        <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          Due: {formatDate(item.deadline)}
                        </span>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <span>Apply</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Daily Snapshot Modal */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Record Daily Metrics Snapshot"
        description="Log your daily LinkedIn metrics to maintain an independent, self-hosted growth database."
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

      {/* Formula Explainer Modal */}
      <FormulaExplainerModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </div>
  );
};
