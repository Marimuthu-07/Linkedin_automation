import { LeadQualificationBreakdown } from '../types/models.js';
import { NetworkingStatus, ContentStatus } from '../types/enums.js';

/**
 * Valid state transitions for the Human-In-The-Loop Networking Pipeline.
 * 
 * Pipeline flow:
 * DISCOVER -> REVIEWING -> APPROVED -> CONTACTED -> REPLIED / FOLLOW_UP -> CONNECTED / ARCHIVED
 */
export const VALID_NETWORKING_TRANSITIONS: Record<NetworkingStatus, NetworkingStatus[]> = {
  [NetworkingStatus.DISCOVERED]: [
    NetworkingStatus.REVIEWING,
    NetworkingStatus.ARCHIVED,
  ],
  [NetworkingStatus.REVIEWING]: [
    NetworkingStatus.APPROVED,
    NetworkingStatus.ARCHIVED,
    NetworkingStatus.DISCOVERED,
  ],
  [NetworkingStatus.APPROVED]: [
    NetworkingStatus.CONTACTED,
    NetworkingStatus.ARCHIVED,
    NetworkingStatus.REVIEWING,
  ],
  [NetworkingStatus.CONTACTED]: [
    NetworkingStatus.REPLIED,
    NetworkingStatus.FOLLOW_UP,
    NetworkingStatus.ARCHIVED,
  ],
  [NetworkingStatus.FOLLOW_UP]: [
    NetworkingStatus.CONTACTED,
    NetworkingStatus.REPLIED,
    NetworkingStatus.ARCHIVED,
  ],
  [NetworkingStatus.REPLIED]: [
    NetworkingStatus.CONNECTED,
    NetworkingStatus.FOLLOW_UP,
    NetworkingStatus.ARCHIVED,
  ],
  [NetworkingStatus.CONNECTED]: [
    NetworkingStatus.ARCHIVED,
  ],
  [NetworkingStatus.ARCHIVED]: [
    NetworkingStatus.DISCOVERED,
    NetworkingStatus.REVIEWING,
  ],
};

/**
 * Validates whether a requested networking transition from `from` status to `to` status is allowed.
 * Returns true if the status is unchanged (idempotent) or explicitly listed in VALID_NETWORKING_TRANSITIONS.
 */
export function isValidNetworkingStatusTransition(
  from: NetworkingStatus,
  to: NetworkingStatus
): boolean {
  if (from === to) return true;
  const allowed = VALID_NETWORKING_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Valid state transitions for the Human-In-The-Loop Content Engine Lifecycle.
 * 
 * Workflow:
 * IDEA -> DRAFT -> REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED -> ARCHIVED
 */
export const VALID_CONTENT_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.IDEA]: [
    ContentStatus.DRAFT,
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.DRAFT]: [
    ContentStatus.REVIEW,
    ContentStatus.IDEA,
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.REVIEW]: [
    ContentStatus.DRAFT,
    ContentStatus.APPROVED,
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.APPROVED]: [
    ContentStatus.DRAFT,
    ContentStatus.SCHEDULED,
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.SCHEDULED]: [
    ContentStatus.APPROVED,
    ContentStatus.PUBLISHED,
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.PUBLISHED]: [
    ContentStatus.ARCHIVED,
  ],
  [ContentStatus.ARCHIVED]: [
    ContentStatus.IDEA,
    ContentStatus.DRAFT,
  ],
};

/**
 * Validates whether a requested content transition from `from` status to `to` status is allowed.
 * Returns true if the status is unchanged (idempotent) or explicitly listed in VALID_CONTENT_TRANSITIONS.
 */
export function isValidContentStatusTransition(
  from: ContentStatus,
  to: ContentStatus
): boolean {
  if (from === to) return true;
  const allowed = VALID_CONTENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}


export type FollowUpStatusCategory = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING_7_DAYS' | 'FUTURE' | 'NONE';

/**
 * Evaluates the status of a scheduled follow-up date relative to a reference date (default: now).
 */
export function getFollowUpStatus(
  followUpDate: string | Date | null | undefined,
  refDate: Date = new Date()
): FollowUpStatusCategory {
  if (!followUpDate) return 'NONE';

  const date = typeof followUpDate === 'string' ? new Date(followUpDate) : followUpDate;
  if (isNaN(date.getTime())) return 'NONE';

  const startOfToday = new Date(refDate);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(refDate);
  endOfToday.setHours(23, 59, 59, 999);

  const sevenDaysFromNow = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (date.getTime() < startOfToday.getTime()) {
    return 'OVERDUE';
  } else if (date.getTime() <= endOfToday.getTime()) {
    return 'DUE_TODAY';
  } else if (date.getTime() <= sevenDaysFromNow.getTime()) {
    return 'UPCOMING_7_DAYS';
  } else {
    return 'FUTURE';
  }
}

export function isFollowUpDueToday(
  followUpDate: string | Date | null | undefined,
  refDate: Date = new Date()
): boolean {
  return getFollowUpStatus(followUpDate, refDate) === 'DUE_TODAY';
}

export function isFollowUpOverdue(
  followUpDate: string | Date | null | undefined,
  refDate: Date = new Date()
): boolean {
  return getFollowUpStatus(followUpDate, refDate) === 'OVERDUE';
}

export function isFollowUpUpcoming7Days(
  followUpDate: string | Date | null | undefined,
  refDate: Date = new Date()
): boolean {
  return getFollowUpStatus(followUpDate, refDate) === 'UPCOMING_7_DAYS';
}


/**
 * Calculates the engagement rate for LinkedIn content or aggregated metrics.
 * 
 * FORMULA:
 * Engagement Rate (%) = ((Reactions + Comments + Reposts + Clicks) / Impressions) * 100
 * 
 * Safety Rule:
 * Returns null if impressions <= 0 to avoid division by zero or skewed metrics.
 */
export function calculateEngagementRate(
  impressions: number,
  reactions: number,
  comments: number,
  reposts: number,
  clicks: number = 0
): number | null {
  if (typeof impressions !== 'number' || isNaN(impressions) || impressions <= 0) {
    return null;
  }

  const validReactions = Math.max(0, reactions || 0);
  const validComments = Math.max(0, comments || 0);
  const validReposts = Math.max(0, reposts || 0);
  const validClicks = Math.max(0, clicks || 0);

  const totalInteractions = validReactions + validComments + validReposts + validClicks;
  const rawRate = (totalInteractions / impressions) * 100;

  // Round to 2 decimal places for clean display and consistency
  return Math.round(rawRate * 100) / 100;
}

export interface LeadScoringInput {
  websiteUxScore: number; // 0 - 10
  mobileExperienceScore: number; // 0 - 10
  performanceScore: number; // 0 - 10
  visualQualityScore: number; // 0 - 10
  ctaClarityScore: number; // 0 - 10
  conversionClarityScore: number; // 0 - 10
  serviceFit: 'LOW' | 'MEDIUM' | 'HIGH';
  identifiedIssues?: string[];
}

/**
 * Computes a transparent, deterministic qualification score for freelance leads.
 * 
 * Scoring weights:
 * - Conversion & CTA clarity (gap opportunity): 30% (lower client UX score = higher opportunity to help)
 * - Mobile & Performance (technical need): 30%
 * - Website UX & Visuals: 20%
 * - Service Fit (alignment with developer capabilities): 20% (HIGH = 20, MED = 12, LOW = 4)
 */
export function calculateLeadQualification(input: LeadScoringInput): LeadQualificationBreakdown {
  const clamp = (val: number) => Math.min(10, Math.max(0, val || 0));

  const ux = clamp(input.websiteUxScore);
  const mobile = clamp(input.mobileExperienceScore);
  const perf = clamp(input.performanceScore);
  const visual = clamp(input.visualQualityScore);
  const cta = clamp(input.ctaClarityScore);
  const conversion = clamp(input.conversionClarityScore);

  // Opportunity factor: The more issues/deficiencies the current site has in UX/CTA/Mobile,
  // the higher the freelance redesign opportunity score.
  const needScore = (
    (10 - cta) * 1.5 +
    (10 - conversion) * 1.5 +
    (10 - mobile) * 1.5 +
    (10 - perf) * 1.5 +
    (10 - visual) * 1.0 +
    (10 - ux) * 1.0
  ); // max = 80 points

  let fitPoints = 12;
  if (input.serviceFit === 'HIGH') fitPoints = 20;
  if (input.serviceFit === 'LOW') fitPoints = 4;

  const totalScore = Math.min(100, Math.round(needScore + fitPoints));

  const reasons: string[] = [];
  if (mobile < 6) reasons.push('Poor mobile responsiveness detected');
  if (perf < 6) reasons.push('Sub-optimal page load and performance metrics');
  if (cta < 6) reasons.push('Call-to-action is unclear or buried below fold');
  if (conversion < 6) reasons.push('Weak conversion funnel with high user friction');
  if (visual < 6) reasons.push('Outdated visual design and branding elements');
  if (input.serviceFit === 'HIGH') reasons.push('Strong match for web application / redesign services');
  if (input.identifiedIssues && input.identifiedIssues.length > 0) {
    for (const issue of input.identifiedIssues) {
      if (!reasons.includes(issue)) reasons.push(issue);
    }
  }

  if (reasons.length === 0) {
    reasons.push('Standard website audit indicates moderate optimization potential');
  }

  return {
    websiteUxScore: ux,
    mobileExperienceScore: mobile,
    performanceScore: perf,
    visualQualityScore: visual,
    ctaClarityScore: cta,
    conversionClarityScore: conversion,
    serviceFit: input.serviceFit,
    reasons,
    totalScore,
  };
}

export interface InternshipMatchingCriteria {
  targetRoles: string[];
  targetLocations: string[];
  targetSkills: string[];
  remoteOnly?: boolean;
}

export interface InternshipMatchResult {
  matchScore: number;
  matchReasons: string[];
}

/**
 * Calculates a match score for internship opportunities against user profile criteria.
 */
export function calculateInternshipMatch(
  internship: {
    role: string;
    location: string;
    remote: boolean;
    skills: string[];
    description?: string;
  },
  criteria: InternshipMatchingCriteria
): InternshipMatchResult {
  let score = 0;
  const reasons: string[] = [];

  const roleLower = internship.role.toLowerCase();
  const descLower = (internship.description || '').toLowerCase();

  // 1. Role match (up to 40 points)
  const roleMatch = criteria.targetRoles.some(r => roleLower.includes(r.toLowerCase()));
  if (roleMatch) {
    score += 40;
    reasons.push('Matches target engineering role preference');
  } else {
    // Partial match on general engineering terms
    if (roleLower.includes('software') || roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('ai') || roleLower.includes('frontend') || roleLower.includes('full stack')) {
      score += 25;
      reasons.push('Related software engineering discipline');
    }
  }

  // 2. Skills overlap (up to 35 points)
  const userSkillsLower = criteria.targetSkills.map(s => s.toLowerCase());
  const matchedSkills = internship.skills.filter(s =>
    userSkillsLower.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
  );

  if (matchedSkills.length > 0) {
    const skillRatio = Math.min(1, matchedSkills.length / Math.max(1, Math.min(4, internship.skills.length)));
    const skillPoints = Math.round(skillRatio * 35);
    score += skillPoints;
    reasons.push(`Matched skills: ${matchedSkills.slice(0, 4).join(', ')}`);
  }

  // 3. Location / Remote match (up to 25 points)
  const locLower = internship.location.toLowerCase();
  const locationMatch = criteria.targetLocations.some(l => locLower.includes(l.toLowerCase()));

  if (internship.remote) {
    score += 25;
    reasons.push('Remote flexibility available');
  } else if (locationMatch) {
    score += 25;
    reasons.push(`Matches preferred location (${internship.location})`);
  } else {
    score += 5; // Base points for in-person opportunities
  }

  return {
    matchScore: Math.min(100, Math.max(0, score)),
    matchReasons: reasons,
  };
}
