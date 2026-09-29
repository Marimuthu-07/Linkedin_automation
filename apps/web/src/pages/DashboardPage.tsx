import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  PenSquare,
  Briefcase,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  AlertCircle,
  Calendar,
  Send,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { DashboardOverview, Task, TaskStatus, AnalyticsOverview } from '@linkedin-growth/shared';
import { StatsCard } from '../components/common/StatsCard.js';
import { Badge } from '../components/common/Badge.js';
import { formatDate } from '../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchDashboard = () => {
    setLoading(true);
    Promise.all([
      api.getDashboardOverview(),
      api.getAnalyticsOverview({ period: '7d' }),
    ])
      .then(([dashRes, analyticsRes]) => {
        setData(dashRes);
        setAnalyticsOverview(analyticsRes);
        setTasks(dashRes.todayActions || []);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      await api.updateTask(task.id, { status: nextStatus });
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert on error
      fetchDashboard();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm">Loading growth intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
        <h3 className="mt-2 font-semibold text-white">Failed to connect to API</h3>
        <p className="mt-1 text-xs text-rose-300">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 p-6 sm:p-8 backdrop-blur-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Productivity Operating System</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Good morning, Alex.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Your human-in-the-loop pipeline is running smoothly. Research, analyze, and draft content with AI assistance—then review and act manually on LinkedIn.
          </p>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            {data?.networking.peopleToReviewCount || 0} Contacts to Review
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            {data?.content.draftPostsCount || 0} Post Drafts
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {data?.leads.qualifiedLeadsCount || 0} Qualified Leads
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            {data?.internships.highMatchCount || 0} High-Match Internships
          </span>
        </div>
      </div>

      {/* 5 Core Module KPI Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pipeline Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Networking"
            value={data?.networking.totalActiveContacts || 0}
            subtitle={`${data?.networking.followUpsDueCount || 0} follow-ups due`}
            icon={Users}
            colorScheme="indigo"
            trend={
              analyticsOverview?.networking.contactsComparison
                ? {
                    value:
                      analyticsOverview.networking.contactsComparison.percentageChange !== null
                        ? `${analyticsOverview.networking.contactsComparison.percentageChange >= 0 ? '+' : ''}${analyticsOverview.networking.contactsComparison.percentageChange}%`
                        : `+${analyticsOverview.networking.contactsComparison.current} new`,
                    positive: (analyticsOverview.networking.contactsComparison.percentageChange || 0) >= 0,
                  }
                : undefined
            }
          />
          <StatsCard
            title="Content Queue"
            value={data?.content.draftPostsCount || 0}
            subtitle={`${data?.content.scheduledPostsCount || 0} scheduled (manual)`}
            icon={PenSquare}
            colorScheme="purple"
            trend={
              analyticsOverview?.content.impressionsComparison
                ? {
                    value:
                      analyticsOverview.content.impressionsComparison.percentageChange !== null
                        ? `${analyticsOverview.content.impressionsComparison.percentageChange >= 0 ? '+' : ''}${analyticsOverview.content.impressionsComparison.percentageChange}%`
                        : `+${analyticsOverview.content.impressionsComparison.current} views`,
                    positive: (analyticsOverview.content.impressionsComparison.percentageChange || 0) >= 0,
                  }
                : undefined
            }
          />
          <StatsCard
            title="Freelance Leads"
            value={data?.leads.totalActiveLeads || 0}
            subtitle={`${data?.leads.qualifiedLeadsCount || 0} qualified opportunities`}
            icon={Briefcase}
            colorScheme="emerald"
            trend={
              analyticsOverview?.leads.leadsComparison
                ? {
                    value:
                      analyticsOverview.leads.leadsComparison.percentageChange !== null
                        ? `${analyticsOverview.leads.leadsComparison.percentageChange >= 0 ? '+' : ''}${analyticsOverview.leads.leadsComparison.percentageChange}%`
                        : `+${analyticsOverview.leads.leadsComparison.current} new`,
                    positive: (analyticsOverview.leads.leadsComparison.percentageChange || 0) >= 0,
                  }
                : undefined
            }
          />
          <StatsCard
            title="Internships"
            value={data?.internships.newOpportunitiesCount || 0}
            subtitle={`${data?.internships.highMatchCount || 0} score > 80%`}
            icon={GraduationCap}
            colorScheme="cyan"
            trend={
              analyticsOverview?.internships.internshipsComparison
                ? {
                    value:
                      analyticsOverview.internships.internshipsComparison.percentageChange !== null
                        ? `${analyticsOverview.internships.internshipsComparison.percentageChange >= 0 ? '+' : ''}${analyticsOverview.internships.internshipsComparison.percentageChange}%`
                        : `+${analyticsOverview.internships.internshipsComparison.current} new`,
                    positive: (analyticsOverview.internships.internshipsComparison.percentageChange || 0) >= 0,
                  }
                : undefined
            }
          />
          <StatsCard
            title="Analytics"
            value={data?.analytics.currentFollowers || 0}
            subtitle={`Avg ${data?.analytics.avgEngagementRate30d || '0'}% engagement`}
            icon={TrendingUp}
            colorScheme="amber"
          />
        </div>
      </section>

      {/* Main Action Split: Today's Actions & Upcoming Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Today's Actions (Tasks) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white font-heading">
                Today's Actions
              </h3>
              <p className="text-xs text-slate-400">
                Actionable items requiring your human judgment and review today
              </p>
            </div>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              <span>View all tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-slate-200">All caught up for today!</p>
                <p className="text-xs text-slate-500">No pending high-priority actions.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const isDone = task.status === TaskStatus.DONE;
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`group flex items-start justify-between gap-4 rounded-xl border p-4 backdrop-blur-md transition-all cursor-pointer ${
                      isDone
                        ? 'border-slate-800/40 bg-slate-900/20 opacity-60'
                        : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className="mt-0.5 text-slate-400 group-hover:text-indigo-400 transition-colors"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="status" status={task.type}>
                        {task.type}
                      </Badge>
                      {task.dueAt && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.dueAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Content & High Match Internships */}
        <div className="space-y-6">
          {/* Upcoming Content Queue */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Content Queue
                </h4>
              </div>
              <Link to="/content" className="text-xs text-indigo-400 hover:underline">
                View CMS
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {data?.content.upcomingPosts.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No posts queued.</p>
              ) : (
                data?.content.upcomingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="status" status={post.status}>
                        {post.status}
                      </Badge>
                      <span className="text-[10px] text-slate-500">
                        {post.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 line-clamp-2">
                      {post.title}
                    </p>
                    {post.status === 'SCHEDULED' && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-400 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Manual publish required</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Internship Matches */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Top Internship Matches
                </h4>
              </div>
              <Link to="/internships" className="text-xs text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {data?.internships.topMatches.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">No match data found.</p>
              ) : (
                data?.internships.topMatches.map((internship) => (
                  <div
                    key={internship.id}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{internship.company}</span>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        {internship.matchScore}% Match
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-1">{internship.role}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{internship.location}</span>
                      {internship.deadline && (
                        <span>Due: {formatDate(internship.deadline)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
