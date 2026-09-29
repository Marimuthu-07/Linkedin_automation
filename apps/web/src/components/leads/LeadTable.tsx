import React from 'react';
import {
  ExternalLink,
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Trash2,
  Linkedin,
} from 'lucide-react';
import { Lead, LeadStatus, getFollowUpStatus } from '@linkedin-growth/shared';
import { Badge } from '../common/Badge.js';
import { formatDate } from '../../lib/utils.js';

interface LeadTableProps {
  leads: Lead[];
  onOpenWorkbench: (lead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onOpenWorkbench,
  onDeleteLead,
}) => {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
        <Briefcase className="mx-auto h-10 w-10 text-slate-600" />
        <h3 className="mt-3 text-sm font-semibold text-slate-200">No client leads found</h3>
        <p className="mt-1 text-xs text-slate-500">
          Try adjusting your search query, status filters, or score thresholds.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm shadow-sm">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Company & Industry</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold text-center">Fit Score</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Next Follow-Up</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {leads.map((lead) => {
            const followUpCategory = getFollowUpStatus(lead.nextFollowUpAt);

            return (
              <tr
                key={lead.id}
                onClick={() => onOpenWorkbench(lead)}
                className="group hover:bg-slate-850/60 cursor-pointer transition-colors"
              >
                {/* Company & Website */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-indigo-300 transition-colors font-heading text-xs">
                        {lead.company}
                      </span>
                      {lead.outreachDraft && (
                        <span title="Outreach draft ready">
                          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{lead.industry}</span>
                      <span>•</span>
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-indigo-400 hover:underline"
                      >
                        <span>{lead.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3.5">
                  {lead.contactName ? (
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-medium">{lead.contactName}</span>
                      <span className="text-[11px] text-slate-500">{lead.contactRole || 'Decision Maker'}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[11px] italic">Not identified</span>
                  )}
                </td>

                {/* Fit Score */}
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold border ${
                      lead.qualificationScore >= 80
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : lead.qualificationScore >= 60
                          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {lead.qualificationScore}/100
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <Badge variant="status" status={lead.status}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </td>

                {/* Follow-up */}
                <td className="px-4 py-3.5">
                  {lead.nextFollowUpAt ? (
                    <div className="flex items-center gap-1.5">
                      {followUpCategory === 'OVERDUE' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                          <AlertCircle className="h-3 w-3 text-rose-400" />
                          <span>Overdue</span>
                        </span>
                      ) : followUpCategory === 'DUE_TODAY' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span>Due Today</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>{formatDate(lead.nextFollowUpAt)}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[11px]">None scheduled</span>
                  )}
                </td>

                {/* Updated */}
                <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                  {formatDate(lead.updatedAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenWorkbench(lead)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <span>Workbench</span>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                    </button>
                    {onDeleteLead && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${lead.company}?`)) {
                            onDeleteLead(lead.id);
                          }
                        }}
                        title="Delete lead"
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
