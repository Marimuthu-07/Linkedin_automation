import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  Send,
  Calendar,
} from 'lucide-react';
import { LeadStats } from '@linkedin-growth/shared';

interface LeadStatsCardsProps {
  stats: LeadStats | null;
  onFilterStatus?: (status: string) => void;
  onFilterFollowUp?: (filter: string) => void;
}

export const LeadStatsCards: React.FC<LeadStatsCardsProps> = ({
  stats,
  onFilterStatus,
  onFilterFollowUp,
}) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Leads */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('ALL')}
        className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm hover:border-slate-700 transition-all"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider">Total Leads</span>
          <Briefcase className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-heading">{stats.totalLeads}</span>
          <span className="text-[10px] text-slate-400">avg {stats.avgQualificationScore}% fit</span>
        </div>
      </div>

      {/* 2. Qualified Leads */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('QUALIFIED')}
        className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm hover:border-emerald-500/40 transition-all"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider">Qualified</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-emerald-300 font-heading">{stats.totalQualified}</span>
          <span className="text-[10px] text-slate-400">+{stats.totalOutreachDraft} drafted</span>
        </div>
      </div>

      {/* 3. In Outreach / Contacted */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('CONTACTED')}
        className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm hover:border-cyan-500/40 transition-all"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider">Contacted</span>
          <Send className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-cyan-300 font-heading">{stats.totalContacted}</span>
          <span className="text-[10px] text-slate-400">{stats.totalReplied} replied</span>
        </div>
      </div>

      {/* 4. Meetings & Proposals */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('MEETING')}
        className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm hover:border-purple-500/40 transition-all"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider">Meetings</span>
          <Calendar className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-purple-300 font-heading">{stats.totalMeeting}</span>
          <span className="text-[10px] text-slate-400">+{stats.totalProposal} proposals</span>
        </div>
      </div>

      {/* 5. Closed Won */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('WON')}
        className="cursor-pointer rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm hover:border-green-500/40 transition-all"
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium uppercase tracking-wider">Won Clients</span>
          <Award className="h-4 w-4 text-green-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-green-400 font-heading">{stats.totalWon}</span>
          <span className="text-[10px] text-slate-400">contracts</span>
        </div>
      </div>

      {/* 6. Follow-ups Due / Overdue */}
      <div
        onClick={() => onFilterFollowUp && onFilterFollowUp('due_today')}
        className={`cursor-pointer rounded-xl border p-3.5 backdrop-blur-sm transition-all ${
          stats.followUpsOverdue > 0
            ? 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50'
            : stats.followUpsDueToday > 0
              ? 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50'
              : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Follow-Ups</span>
          {stats.followUpsOverdue > 0 ? (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          ) : (
            <Clock className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-xl font-bold font-heading ${
              stats.followUpsOverdue > 0
                ? 'text-rose-400'
                : stats.followUpsDueToday > 0
                  ? 'text-amber-300'
                  : 'text-slate-300'
            }`}
          >
            {stats.followUpsDueToday + stats.followUpsOverdue}
          </span>
          <span className="text-[10px] text-slate-400">
            {stats.followUpsOverdue > 0 ? `${stats.followUpsOverdue} overdue` : 'due today'}
          </span>
        </div>
      </div>
    </div>
  );
};
