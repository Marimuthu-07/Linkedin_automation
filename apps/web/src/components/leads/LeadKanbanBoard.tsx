import React from 'react';
import {
  ExternalLink,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Send,
  MessageSquare,
  Calendar,
  Award,
  XCircle,
  FileText,
} from 'lucide-react';
import { Lead, LeadStatus, getFollowUpStatus } from '@linkedin-growth/shared';
import { Badge } from '../common/Badge.js';

interface LeadKanbanBoardProps {
  leads: Lead[];
  onOpenWorkbench: (lead: Lead) => void;
  onAdvanceStatus?: (leadId: string, nextStatus: LeadStatus) => void;
}

const KANBAN_COLUMNS: Array<{
  status: LeadStatus;
  label: string;
  color: string;
  borderColor: string;
  bgLight: string;
}> = [
  {
    status: LeadStatus.DISCOVERED,
    label: 'Discovered',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-950/10',
  },
  {
    status: LeadStatus.QUALIFIED,
    label: 'Qualified',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-950/10',
  },
  {
    status: LeadStatus.OUTREACH_DRAFT,
    label: 'Outreach Draft',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgLight: 'bg-cyan-950/10',
  },
  {
    status: LeadStatus.CONTACTED,
    label: 'Contacted',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgLight: 'bg-sky-950/10',
  },
  {
    status: LeadStatus.REPLIED,
    label: 'Replied',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgLight: 'bg-indigo-950/10',
  },
  {
    status: LeadStatus.MEETING,
    label: 'Meeting',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-950/10',
  },
  {
    status: LeadStatus.PROPOSAL,
    label: 'Proposal',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-950/10',
  },
  {
    status: LeadStatus.WON,
    label: 'Won',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgLight: 'bg-green-950/10',
  },
  {
    status: LeadStatus.LOST,
    label: 'Lost',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-950/10',
  },
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onOpenWorkbench,
  onAdvanceStatus,
}) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {KANBAN_COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.status);

        return (
          <div
            key={col.status}
            className={`flex flex-col flex-shrink-0 w-80 rounded-xl border ${col.borderColor} ${col.bgLight} bg-slate-900/40 p-3.5 backdrop-blur-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color} font-heading`}>
                  {col.label}
                </h3>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {columnLeads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-600">
                  No leads in {col.label.toLowerCase()}
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const followUpCategory = getFollowUpStatus(lead.nextFollowUpAt);

                  return (
                    <div
                      key={lead.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-sm hover:border-slate-700 hover:bg-slate-900/70 transition-all cursor-pointer"
                      onClick={() => onOpenWorkbench(lead)}
                    >
                      <div>
                        {/* Company & Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors font-heading">
                              {lead.company}
                            </h4>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{lead.industry}</p>
                          </div>
                          <span
                            className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${
                              lead.qualificationScore >= 80
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : lead.qualificationScore >= 60
                                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                                  : 'border-slate-700 bg-slate-800 text-slate-300'
                            }`}
                          >
                            {lead.qualificationScore}/100 Fit
                          </span>
                        </div>

                        {/* Website */}
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-indigo-400">
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 hover:underline truncate max-w-[200px]"
                          >
                            <span>{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                          </a>
                        </div>

                        {/* Problem Snippet */}
                        <div className="mt-2.5 rounded-lg border border-slate-800/60 bg-slate-900/60 p-2 text-[11px]">
                          <span className="font-semibold text-rose-300">Issue: </span>
                          <span className="text-slate-300 line-clamp-2">{lead.problem}</span>
                        </div>

                        {/* Outreach status badge */}
                        {lead.outreachDraft && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-300 font-medium">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span>Outreach Draft Ready</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        {/* Contact */}
                        <span className="truncate max-w-[120px]">
                          {lead.contactName ? lead.contactName : 'No contact specified'}
                        </span>

                        {/* Follow-up badge */}
                        {lead.nextFollowUpAt && (
                          <div className="flex items-center gap-1">
                            {followUpCategory === 'OVERDUE' ? (
                              <span className="flex items-center gap-0.5 text-rose-400 font-semibold">
                                <AlertCircle className="h-3 w-3" />
                                <span>Overdue</span>
                              </span>
                            ) : followUpCategory === 'DUE_TODAY' ? (
                              <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                                <Clock className="h-3 w-3" />
                                <span>Due Today</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(lead.nextFollowUpAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
