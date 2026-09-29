import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status.toUpperCase()) {
    case 'DISCOVERED':
    case 'NEW':
    case 'IDEA':
    case 'TODO':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'REVIEWING':
    case 'RESEARCHING':
    case 'DRAFT':
    case 'IN_PROGRESS':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'APPROVED':
    case 'QUALIFIED':
    case 'SAVED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'SCHEDULED':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'PUBLISHED':
    case 'CONNECTED':
    case 'WON':
    case 'DONE':
      return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
    case 'CONTACTED':
    case 'OUTREACH_DRAFT':
    case 'PROPOSAL':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'REPLIED':
    case 'MEETING':
    case 'INTERESTED':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' };
    case 'FOLLOW_UP':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'ARCHIVED':
    case 'CLOSED':
    case 'EXPIRED':
    case 'LOST':
    case 'DISMISSED':
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}
