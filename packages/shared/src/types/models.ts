import {
  NetworkingStatus,
  ContactCategory,
  NetworkingMessageType,
  NetworkingMessageStatus,
  ContentStatus,
  ContentCategory,
  LeadStatus,
  InternshipStatus,
  TaskType,
  TaskStatus,
  TaskPriority,
  NotificationType,
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
  createdAt: string;
  updatedAt: string;
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
