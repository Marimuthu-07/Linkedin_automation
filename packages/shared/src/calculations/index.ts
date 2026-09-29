import { LeadQualificationBreakdown, MetricComparison, DeterministicInsight, MetricDefinition } from '../types/models.js';
import { NetworkingStatus, ContentStatus, AnalyticsPeriod, AnalyticsGroupBy } from '../types/enums.js';

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

/**
 * Calculates period-over-period comparison metrics with explicit zero/null denominator handling.
 *
 * Formula:
 * absoluteChange = current - previous
 * percentageChange = ((current - previous) / previous) * 100
 *
 * Safety Rules:
 * - If previous === 0 and current === 0 -> percentageChange is 0
 * - If previous === 0 and current > 0 -> percentageChange is null (mathematically undefined division by zero)
 * - If previous > 0 -> percentageChange is rounded to 1 decimal place
 */
export function calculateMetricComparison(
  current: number,
  previous: number
): MetricComparison {
  const validCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
  const validPrevious = typeof previous === 'number' && !isNaN(previous) ? previous : 0;
  const absoluteChange = validCurrent - validPrevious;

  let percentageChange: number | null = null;
  if (validPrevious === 0) {
    percentageChange = validCurrent === 0 ? 0 : null;
  } else {
    const rawPct = ((validCurrent - validPrevious) / validPrevious) * 100;
    percentageChange = Math.round(rawPct * 10) / 10;
  }

  return {
    current: validCurrent,
    previous: validPrevious,
    absoluteChange,
    percentageChange,
  };
}

export interface DateRangeBounds {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
}

export function formatDateKey(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes contiguous date boundaries for standard analytics periods (7d, 30d, 90d, 1y, custom)
 * along with the equal-duration preceding baseline comparison period.
 */
export function getDateRangeForPeriod(
  period: AnalyticsPeriod | string = AnalyticsPeriod.THIRTY_DAYS,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): DateRangeBounds {
  const endDate = new Date(refDate);
  endDate.setHours(23, 59, 59, 999);

  let startDate = new Date(refDate);
  startDate.setHours(0, 0, 0, 0);

  let days = 30;
  if (period === AnalyticsPeriod.SEVEN_DAYS || period === '7d') {
    days = 7;
  } else if (period === AnalyticsPeriod.THIRTY_DAYS || period === '30d') {
    days = 30;
  } else if (period === AnalyticsPeriod.NINETY_DAYS || period === '90d') {
    days = 90;
  } else if (period === AnalyticsPeriod.ONE_YEAR || period === '1y') {
    days = 365;
  } else if (period === AnalyticsPeriod.CUSTOM || period === 'custom') {
    if (customStart && customEnd) {
      let parsedStart: Date;
      let parsedEnd: Date;

      if (/^\d{4}-\d{2}-\d{2}$/.test(customStart)) {
        const [sy, sm, sd] = customStart.split('-').map(Number);
        parsedStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      } else {
        parsedStart = new Date(customStart);
        parsedStart.setHours(0, 0, 0, 0);
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(customEnd)) {
        const [ey, em, ed] = customEnd.split('-').map(Number);
        parsedEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      } else {
        parsedEnd = new Date(customEnd);
        parsedEnd.setHours(23, 59, 59, 999);
      }

      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime()) && parsedStart <= parsedEnd) {
        startDate = parsedStart;
        endDate.setTime(parsedEnd.getTime());
        const diffMs = endDate.getTime() - startDate.getTime();
        days = Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)));

        const prevEnd = new Date(startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - (days * 24 * 60 * 60 * 1000) + 1);
        prevStart.setHours(0, 0, 0, 0);

        return {
          startDate,
          endDate,
          prevStartDate: prevStart,
          prevEndDate: prevEnd,
        };
      }
    }
  }

  // Calculate standard boundaries
  startDate.setDate(endDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevEndDate.getDate() - days + 1);
  prevStartDate.setHours(0, 0, 0, 0);

  return {
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
  };
}


/**
 * Formats a Date object into a grouping bucket string.
 * - 'day': YYYY-MM-DD
 * - 'week': YYYY-Www (ISO week start)
 * - 'month': YYYY-MM
 */
export function formatBucketKey(
  date: Date,
  groupBy: AnalyticsGroupBy | string = AnalyticsGroupBy.DAY
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (groupBy === AnalyticsGroupBy.MONTH || groupBy === 'month') {
    return `${year}-${month}`;
  }

  if (groupBy === AnalyticsGroupBy.WEEK || groupBy === 'week') {
    // Get start of the week (Monday)
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - distanceToMonday);
    const mYear = monday.getFullYear();
    const mMonth = String(monday.getMonth() + 1).padStart(2, '0');
    const mDay = String(monday.getDate()).padStart(2, '0');
    return `${mYear}-${mMonth}-${mDay}`;
  }

  // Default: Day (YYYY-MM-DD)
  return `${year}-${month}-${day}`;
}

export interface InsightsInput {
  content?: {
    totalImpressions: number;
    totalInteractions: number;
    impressionsComparison?: MetricComparison | null;
    avgEngagementRate?: number | null;
    topCategory?: string | null;
    topCategoryEngagement?: number | null;
    postsPublishedInPeriod?: number;
  };
  networking?: {
    contactsAddedInPeriod: number;
    interactionsInPeriod: number;
    followUpsDueCount: number;
    interactionsComparison?: MetricComparison | null;
    contactsComparison?: MetricComparison | null;
  };
  leads?: {
    createdInPeriod: number;
    qualifiedCount: number;
    leadsComparison?: MetricComparison | null;
  };
  internships?: {
    highMatchCount: number;
    upcomingDeadlinesCount: number;
  };
}

/**
 * Generates transparent, deterministic, mathematical insights from verified metrics.
 *
 * Rules:
 * - NO arbitrary AI scores
 * - NO ungrounded causal claims
 * - Transparent delta reporting (current, previous, percent change)
 */
export function generateDeterministicInsights(input: InsightsInput): DeterministicInsight[] {
  const insights: DeterministicInsight[] = [];

  // 1. Content reach comparison
  if (input.content?.impressionsComparison) {
    const comp = input.content.impressionsComparison;
    if (comp.previous > 0 && comp.percentageChange !== null) {
      const isPositive = comp.percentageChange >= 0;
      insights.push({
        id: 'content-impressions-trend',
        domain: 'CONTENT',
        title: isPositive ? 'Content Reach Growth' : 'Content Reach Dip',
        message: `Your content received ${Math.abs(comp.percentageChange)}% ${isPositive ? 'more' : 'fewer'} impressions (${comp.current.toLocaleString()} vs ${comp.previous.toLocaleString()}) than the previous period.`,
        type: isPositive ? 'positive' : 'neutral',
        change: comp,
      });
    } else if (comp.current > 0 && comp.previous === 0) {
      insights.push({
        id: 'content-impressions-new',
        domain: 'CONTENT',
        title: 'New Content Reach',
        message: `Your content generated ${comp.current.toLocaleString()} impressions in this period with no prior baseline.`,
        type: 'positive',
        change: comp,
      });
    }
  }

  // 2. High performing content category
  if (input.content?.topCategory && input.content.topCategoryEngagement !== null && input.content.topCategoryEngagement !== undefined) {
    insights.push({
      id: 'content-top-category',
      domain: 'CONTENT',
      title: 'Top Performing Content Topic',
      message: `Your highest-engagement content category was ${input.content.topCategory.replace(/_/g, ' ')} with a ${input.content.topCategoryEngagement}% average engagement rate.`,
      type: 'positive',
    });
  }

  // 3. Networking interactions
  if (input.networking?.interactionsComparison) {
    const comp = input.networking.interactionsComparison;
    if (comp.current !== comp.previous) {
      const increased = comp.current > comp.previous;
      insights.push({
        id: 'networking-interactions-trend',
        domain: 'NETWORKING',
        title: increased ? 'Networking Activity Surge' : 'Networking Activity Pacing',
        message: `Networking interactions ${increased ? 'increased' : 'shifted'} from ${comp.previous} to ${comp.current} touchpoints.`,
        type: increased ? 'positive' : 'neutral',
        change: comp,
      });
    }
  }

  // 4. Follow-ups action alert
  if (input.networking && input.networking.followUpsDueCount > 0) {
    insights.push({
      id: 'networking-followups-due',
      domain: 'NETWORKING',
      title: 'Follow-Ups Due',
      message: `${input.networking.followUpsDueCount} networking follow-up${input.networking.followUpsDueCount > 1 ? 's are' : ' is'} due or overdue for response.`,
      type: 'attention',
    });
  }

  // 5. Leads pipeline
  if (input.leads && input.leads.qualifiedCount > 0) {
    insights.push({
      id: 'leads-qualified-pipeline',
      domain: 'LEADS',
      title: 'Qualified Leads Pipeline',
      message: `${input.leads.qualifiedCount} freelance lead${input.leads.qualifiedCount > 1 ? 's have' : ' has'} been qualified based on objective website and UX criteria.`,
      type: 'positive',
    });
  }

  // 6. Internship deadlines
  if (input.internships && input.internships.upcomingDeadlinesCount > 0) {
    insights.push({
      id: 'internships-upcoming-deadlines',
      domain: 'INTERNSHIPS',
      title: 'Upcoming Internship Deadlines',
      message: `${input.internships.upcomingDeadlinesCount} tracked internship application${input.internships.upcomingDeadlinesCount > 1 ? 's have' : ' has'} deadlines approaching in the next 14 days.`,
      type: 'attention',
    });
  }

  return insights;
}

/**
 * Official dictionary of documented metrics and mathematical definitions.
 */
export const OFFICIAL_METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  ENGAGEMENT_RATE: {
    name: 'Engagement Rate',
    description: 'The proportion of impressions that converted into meaningful interactions (reactions, comments, reposts, clicks).',
    formula: '((Reactions + Comments + Reposts + Clicks) / Impressions) * 100',
    numerator: 'Total interactions (Reactions + Comments + Reposts + Clicks)',
    denominator: 'Total impressions (views)',
    period: 'Calculated per post or aggregated across a selected time period',
    nullHandling: 'Returns null if impressions is 0 or negative to prevent division by zero.',
    metricType: 'rate',
  },
  AVG_IMPRESSIONS_PER_POST: {
    name: 'Average Impressions Per Post',
    description: 'Average reach generated per published LinkedIn post.',
    formula: 'Total Impressions / Published Post Count',
    numerator: 'Total Impressions of published posts in period',
    denominator: 'Count of published posts in period',
    period: 'Selected time period',
    nullHandling: 'Returns 0 if published post count is 0.',
    metricType: 'average',
  },
  PERIOD_OVER_PERIOD_CHANGE: {
    name: 'Period-over-Period Percentage Change',
    description: 'Relative rate of growth or reduction compared against an equal-duration preceding baseline period.',
    formula: '((Current Period Value - Previous Period Value) / Previous Period Value) * 100',
    numerator: 'Absolute change (Current - Previous)',
    denominator: 'Previous period baseline value',
    period: 'Current period vs equal-length previous period (e.g. last 30d vs prior 30d)',
    nullHandling: 'Returns 0 if both values are 0; returns null if previous value is 0 and current value is > 0.',
    metricType: 'percentage',
  },
  NETWORKING_RESPONSE_RATE: {
    name: 'Networking Response Rate',
    description: 'Proportion of contacted networking prospects that have responded or connected.',
    formula: '(Contacts with status REPLIED or CONNECTED / Total Contacted Contacts) * 100',
    numerator: 'Count of contacts with status REPLIED or CONNECTED',
    denominator: 'Count of contacts with status in (CONTACTED, REPLIED, FOLLOW_UP, CONNECTED)',
    period: 'All-time or period filtered',
    nullHandling: 'Returns null if no contacts have been contacted yet.',
    metricType: 'rate',
  },
  LEAD_QUALIFICATION_SCORE: {
    name: 'Lead Qualification Score',
    description: 'Deterministic 0-100 score evaluating website UX, mobile performance, CTA clarity, and alignment with freelance offerings.',
    formula: 'Weighted sum of technical deficiency gaps (max 80 pts) + Service Fit alignment (max 20 pts)',
    numerator: 'Sum of technical optimization gaps + fit points',
    denominator: '100 max possible score',
    period: 'Per lead evaluation',
    nullHandling: 'Defaults to 50 if audit breakdown is not provided.',
    metricType: 'percentage',
  },
};
