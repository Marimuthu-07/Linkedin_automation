import {
  NetworkingStatus,
  ContactCategory,
  NetworkingMessageType,
  NetworkingMessageStatus,
  ContentStatus,
  ContentCategory,
  LeadStatus,
  LeadInteractionType,
  LeadOutreachVariantType,
  LeadOutreachStatus,
  InternshipStatus,
  TaskType,
  TaskStatus,
  TaskPriority,
  NotificationType,
  AnalyticsPeriod,
  AnalyticsGroupBy,
} from './enums.js';

export interface NetworkingMessage {
  id: string;
  contactId: string;
  type: NetworkingMessageType;
  content: string;
  personalizationBasis: string[];
  status: NetworkingMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkingContact {
  id: string;
  name: string;
  linkedinUrl?: string | null;
  headline?: string | null;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  category: ContactCategory;
  source: string;
  relevanceReason?: string | null;
  notes?: string | null;
  messageDraft?: string | null;
  status: NetworkingStatus;
  lastInteractionAt?: string | null;
  nextFollowUpAt?: string | null;
  messages?: NetworkingMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NetworkingStats {
  totalDiscovered: number;
  totalReviewing: number;
  totalApproved: number;
  totalContacted: number;
  totalReplied: number;
  totalFollowUp: number;
  totalConnected: number;
  totalArchived: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  followUpsUpcoming7Days: number;
  totalContacts: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContentMetric {
  id: string;
  postId: string;
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
  engagementRate: number | null;
  followersAtPublication?: number | null;
  recordedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContentRevision {
  id: string;
  contentPostId: string;
  title: string;
  hook: string;
  body: string;
  cta?: string | null;
  hashtags: string[];
  revisionNumber: number;
  createdBy: string;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  title: string;
  idea?: string | null;
  hook: string;
  body: string;
  cta?: string | null;
  category: ContentCategory;
  status: ContentStatus;
  targetAudience?: string | null;
  tone?: string | null;
  hashtags: string[];
  tags?: string[]; // for backward compatibility
  sourceContext?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  publishedManually?: boolean;
  externalPostUrl?: string | null;
  generationPrompt?: string | null;
  aiGenerated?: boolean;
  aiProvider?: string | null;
  aiModel?: string | null;
  revisionCount?: number;
  alternativeHooks?: string[];
  notes?: string | null;
  revisions?: ContentRevision[];
  metrics?: ContentMetric[] | ContentMetric | null;
  latestMetrics?: ContentMetric | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStats {
  totalPosts: number;
  ideasCount: number;
  draftsCount: number;
  reviewCount: number;
  approvedCount: number;
  scheduledCount: number;
  publishedCount: number;
  archivedCount: number;
  avgImpressions: number;
  avgEngagementRate: number | null;
}


export interface LeadQualificationBreakdown {
  websiteUxScore: number; // 0-10
  mobileExperienceScore: number; // 0-10
  performanceScore: number; // 0-10
  visualQualityScore: number; // 0-10
  ctaClarityScore: number; // 0-10
  conversionClarityScore: number; // 0-10
  serviceFit: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  totalScore: number; // 0-100
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: LeadInteractionType;
  note: string;
  occurredAt: string;
  createdAt: string;
}

export interface LeadOutreachVariant {
  type: LeadOutreachVariantType;
  body: string;
  personalizationBasis: string[];
  status?: LeadOutreachStatus;
  createdAt?: string;
}

export interface Lead {
  id: string;
  company: string;
  website: string;
  industry: string;
  location?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  linkedinUrl?: string | null;
  companyLinkedinUrl?: string | null;
  source: string;
  problem: string;
  opportunity: string;
  qualificationScore: number;
  qualificationBreakdown?: LeadQualificationBreakdown | null;
  status: LeadStatus;
  notes?: string | null;
  outreachDraft?: string | null;
  outreachVariants?: LeadOutreachVariant[] | null;
  nextFollowUpAt?: string | null;
  lastInteractionAt?: string | null;
  interactions?: LeadInteraction[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  totalLeads: number;
  totalDiscovered: number;
  totalResearching: number;
  totalQualified: number;
  totalOutreachDraft: number;
  totalContacted: number;
  totalReplied: number;
  totalMeeting: number;
  totalProposal: number;
  totalWon: number;
  totalLost: number;
  totalArchived: number;
  avgQualificationScore: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  followUpsUpcoming7Days: number;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  url: string;
  source: string;
  description: string;
  skills: string[];
  eligibility: string;
  deadline?: string | null;
  postedAt?: string | null;
  discoveredAt: string;
  matchScore: number; // 0-100
  matchReasons?: string[];
  status: InternshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  followers: number;
  connections: number;
  profileViews: number;
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
  engagementRate: number | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: TaskType;
  dueAt?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  linkUrl?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userName: string;
  userTitle: string;
  userBio: string;
  targetRoles: string[];
  targetLocations: string[];
  targetTechnologies: string[];
  minInternshipMatchScore: number;
  freelanceServices: string[];
  aiProvider: 'mock' | 'openai' | 'gemini' | 'anthropic';
  weeklyPostingGoal: number;
  dailyNetworkingGoal: number;
  updatedAt: string;
}

export interface DashboardOverview {
  networking: {
    peopleToReviewCount: number;
    draftMessagesCount: number;
    followUpsDueCount: number;
    totalActiveContacts: number;
  };
  content: {
    draftPostsCount: number;
    scheduledPostsCount: number;
    recentPublishedCount: number;
    ideasCount: number;
    upcomingPosts: ContentPost[];
  };
  leads: {
    newLeadsCount: number;
    qualifiedLeadsCount: number;
    followUpsCount: number;
    totalActiveLeads: number;
  };
  internships: {
    newOpportunitiesCount: number;
    highMatchCount: number;
    upcomingDeadlinesCount: number;
    topMatches: Internship[];
  };
  analytics: {
    currentFollowers: number;
    currentConnections: number;
    totalImpressions30d: number;
    avgEngagementRate30d: number | null;
    profileViews30d: number;
    postsPublished30d: number;
    latestSnapshot?: AnalyticsSnapshot | null;
  };
  todayActions: Task[];
  recentNotifications: NotificationItem[];
}

export interface MetricComparison {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number | null; // null when previous is 0 and cannot divide
}

export interface MetricDefinition {
  name: string;
  description: string;
  formula: string;
  numerator: string;
  denominator: string;
  period: string;
  nullHandling: string;
  metricType: 'count' | 'average' | 'percentage' | 'rate';
}

export interface ContentTrendPoint {
  date: string;
  postsPublished: number;
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
  engagementRate: number | null;
}

export interface CategoryPerformance {
  category: ContentCategory | string;
  postCount: number;
  publishedCount: number;
  totalImpressions: number;
  totalInteractions: number;
  avgEngagementRate: number | null;
}

export interface ContentAnalytics {
  period: AnalyticsPeriod | string;
  startDate: string;
  endDate: string;
  totalPosts: number;
  postsByStatus: Record<string, number>;
  postsByCategory: Record<string, number>;
  publishedPostsCount: number;
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  totalReposts: number;
  totalClicks: number;
  avgEngagementRate: number | null;
  avgImpressionsPerPost: number;
  topPostsByImpressions: ContentPost[];
  topPostsByEngagementRate: ContentPost[];
  topPostsByComments: ContentPost[];
  categoryBreakdown: CategoryPerformance[];
  comparison: {
    impressions: MetricComparison;
    interactions: MetricComparison;
    postsPublished: MetricComparison;
    avgEngagementRate: MetricComparison;
  };
}

export interface NetworkingTrendPoint {
  date: string;
  contactsAdded: number;
  interactionsLogged: number;
  connectionRequestsDrafted: number;
}

export interface NetworkingAnalytics {
  period: AnalyticsPeriod | string;
  startDate: string;
  endDate: string;
  totalContacts: number;
  contactsByStatus: Record<string, number>;
  contactsByCategory: Record<string, number>;
  contactsBySource: Record<string, number>;
  contactsAddedInPeriod: number;
  interactionsInPeriod: number;
  followUpsDueToday: number;
  followUpsOverdue: number;
  followUpsUpcoming7Days: number;
  followUpsCompleted: number;
  connectionRequestsCount: number;
  responseCount: number;
  responseRate: number | null;
  comparison: {
    contactsAdded: MetricComparison;
    interactions: MetricComparison;
  };
}

export interface LeadFunnelStage {
  status: LeadStatus | string;
  count: number;
  percentageOfTotal: number;
}

export interface LeadTrendPoint {
  date: string;
  leadsCreated: number;
  leadsQualified: number;
  leadsContacted: number;
}

export interface LeadAnalytics {
  period: AnalyticsPeriod | string;
  startDate: string;
  endDate: string;
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByServiceFit: Record<string, number>;
  leadsCreatedInPeriod: number;
  qualifiedLeadsCount: number;
  contactedLeadsCount: number;
  avgQualificationScore: number;
  pipelineFunnel: LeadFunnelStage[];
  comparison: {
    leadsCreated: MetricComparison;
    leadsQualified: MetricComparison;
  };
}

export interface InternshipTrendPoint {
  date: string;
  opportunitiesDiscovered: number;
}

export interface InternshipAnalytics {
  period: AnalyticsPeriod | string;
  startDate: string;
  endDate: string;
  totalOpportunities: number;
  opportunitiesByStatus: Record<string, number>;
  opportunitiesBySource: Record<string, number>;
  opportunitiesByCompany: Array<{ company: string; count: number }>;
  opportunitiesAddedInPeriod: number;
  avgMatchScore: number;
  highMatchCount: number;
  upcomingDeadlines: Internship[];
  comparison: {
    opportunitiesDiscovered: MetricComparison;
  };
}

export interface DeterministicInsight {
  id: string;
  domain: 'CONTENT' | 'NETWORKING' | 'LEADS' | 'INTERNSHIPS' | 'GENERAL';
  title: string;
  message: string;
  type: 'positive' | 'neutral' | 'attention';
  change?: MetricComparison | null;
}

export interface AnalyticsOverview {
  period: AnalyticsPeriod | string;
  startDate: string;
  endDate: string;
  content: {
    totalPosts: number;
    publishedInPeriod: number;
    totalImpressions: number;
    totalInteractions: number;
    avgEngagementRate: number | null;
    impressionsComparison: MetricComparison;
    interactionsComparison: MetricComparison;
  };
  networking: {
    totalContacts: number;
    addedInPeriod: number;
    followUpsDueCount: number;
    interactionsInPeriod: number;
    contactsComparison: MetricComparison;
    interactionsComparison: MetricComparison;
  };
  leads: {
    totalLeads: number;
    createdInPeriod: number;
    qualifiedCount: number;
    activePipelineCount: number;
    leadsComparison: MetricComparison;
  };
  internships: {
    totalTracked: number;
    addedInPeriod: number;
    highMatchCount: number;
    upcomingDeadlinesCount: number;
    internshipsComparison: MetricComparison;
  };
  latestSnapshot: AnalyticsSnapshot | null;
  snapshots: AnalyticsSnapshot[];
  insights: DeterministicInsight[];
}
