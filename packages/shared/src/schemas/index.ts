import { z } from 'zod';
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
} from '../types/enums.js';

// URL validator that accepts valid http/https URLs or linkedin.com URLs
export const urlSchema = z.string().trim().url({ message: 'Must be a valid URL starting with http:// or https://' });


export const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid URL starting with http:// or https://' }
  );

export const linkedinUrlSchema = z.string().trim().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('linkedin.com') || parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid LinkedIn or web URL' }
);

export const optionalLinkedinUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine(
    (url) => {
      if (!url || url === '') return true;
      try {
        const parsed = new URL(url);
        return parsed.hostname.includes('linkedin.com') || parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid LinkedIn or web URL' }
  );

// Networking Contact Schemas
export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  linkedinUrl: optionalLinkedinUrlSchema,
  headline: z.string().max(200).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  category: z.nativeEnum(ContactCategory).default(ContactCategory.OTHER),
  source: z.string().default('Manual Entry'),
  relevanceReason: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  messageDraft: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(NetworkingStatus).default(NetworkingStatus.DISCOVERED),
  lastInteractionAt: z.string().datetime().optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const updateContactStatusSchema = z.object({
  status: z.nativeEnum(NetworkingStatus),
});

export const createNetworkingMessageSchema = z.object({
  contactId: z.string().optional(),
  type: z.nativeEnum(NetworkingMessageType).default(NetworkingMessageType.CONNECTION_REQUEST),
  content: z.string().min(1, 'Message content is required').max(3000),
  personalizationBasis: z.array(z.string()).default([]),
  status: z.nativeEnum(NetworkingMessageStatus).default(NetworkingMessageStatus.DRAFT),
});

export const updateNetworkingMessageSchema = createNetworkingMessageSchema.partial();


// Content Post Schemas
export const createContentPostSchema = z
  .object({
    title: z.string().max(200).optional(),
    idea: z.string().max(2000).optional().nullable(),
    hook: z.string().max(500).default(''),
    body: z.string().default(''),
    cta: z.string().max(300).optional().nullable(),
    category: z.nativeEnum(ContentCategory).default(ContentCategory.SOFTWARE_ENGINEERING),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.IDEA),
    targetAudience: z.string().max(200).optional().nullable(),
    tone: z.string().max(100).optional().nullable(),
    sourceContext: z.string().max(5000).optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    publishedAt: z.string().datetime().optional().nullable(),
    publishedManually: z.boolean().default(false),
    externalPostUrl: optionalUrlSchema,
    hashtags: z.array(z.string().max(50)).default([]),
    tags: z.array(z.string().max(50)).default([]),
    notes: z.string().max(2000).optional().nullable(),
    alternativeHooks: z.array(z.string()).default([]),
  })
  .refine(
    (data) => (data.title && data.title.trim().length > 0) || (data.idea && data.idea.trim().length > 0),
    { message: 'Either title or idea must be provided' }
  );

export const updateContentPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  idea: z.string().max(2000).optional().nullable(),
  hook: z.string().max(500).optional(),
  body: z.string().optional(),
  cta: z.string().max(300).optional().nullable(),
  category: z.nativeEnum(ContentCategory).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  targetAudience: z.string().max(200).optional().nullable(),
  tone: z.string().max(100).optional().nullable(),
  sourceContext: z.string().max(5000).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  publishedManually: z.boolean().optional(),
  externalPostUrl: optionalUrlSchema,
  hashtags: z.array(z.string().max(50)).optional(),
  tags: z.array(z.string().max(50)).optional(),
  notes: z.string().max(2000).optional().nullable(),
  alternativeHooks: z.array(z.string()).optional(),
});

export const updateContentStatusSchema = z.object({
  status: z.nativeEnum(ContentStatus),
  externalPostUrl: optionalUrlSchema,
  publishedAt: z.string().datetime().optional().nullable(),
});

export const publishRecordSchema = z.object({
  publishedAt: z.string().datetime().optional().nullable(),
  externalPostUrl: optionalUrlSchema,
});

export const createContentMetricsSchema = z.object({
  impressions: z.number().int().min(0, 'Impressions cannot be negative'),
  reactions: z.number().int().min(0, 'Reactions cannot be negative'),
  comments: z.number().int().min(0, 'Comments cannot be negative'),
  reposts: z.number().int().min(0, 'Reposts cannot be negative'),
  clicks: z.number().int().min(0, 'Clicks cannot be negative').default(0),
  followersAtPublication: z.number().int().min(0).optional().nullable(),
  recordedAt: z.string().datetime().optional().nullable(),
});

export const updateContentMetricsSchema = createContentMetricsSchema;


// Lead Schemas
export const leadOutreachVariantSchema = z.object({
  type: z.nativeEnum(LeadOutreachVariantType),
  body: z.string().min(1, 'Outreach body is required'),
  personalizationBasis: z.array(z.string()).default([]),
  status: z.nativeEnum(LeadOutreachStatus).default(LeadOutreachStatus.DRAFT),
  createdAt: z.string().optional(),
});

export const createLeadSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(100),
  website: urlSchema,
  industry: z.string().min(1, 'Industry is required').max(100),
  location: z.string().max(100).optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactRole: z.string().max(100).optional().nullable(),
  linkedinUrl: optionalLinkedinUrlSchema,
  companyLinkedinUrl: optionalLinkedinUrlSchema,
  source: z.string().default('Manual Research'),
  problem: z.string().min(3, 'Observed problem/gap is required').max(1000),
  opportunity: z.string().min(3, 'Service opportunity is required').max(1000),
  qualificationScore: z.number().min(0).max(100).default(50),
  qualificationBreakdown: z.object({
    websiteUxScore: z.number().min(0).max(10),
    mobileExperienceScore: z.number().min(0).max(10),
    performanceScore: z.number().min(0).max(10),
    visualQualityScore: z.number().min(0).max(10),
    ctaClarityScore: z.number().min(0).max(10),
    conversionClarityScore: z.number().min(0).max(10),
    serviceFit: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    reasons: z.array(z.string()),
    totalScore: z.number().min(0).max(100),
  }).optional().nullable(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.DISCOVERED),
  notes: z.string().max(2000).optional().nullable(),
  outreachDraft: z.string().max(3000).optional().nullable(),
  outreachVariants: z.array(leadOutreachVariantSchema).optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  lastInteractionAt: z.string().datetime().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
});

export const leadFollowUpSchema = z.object({
  nextFollowUpAt: z.string().datetime().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const scoreLeadInputSchema = z.object({
  websiteUxScore: z.number().min(0).max(10).default(5),
  mobileExperienceScore: z.number().min(0).max(10).default(5),
  performanceScore: z.number().min(0).max(10).default(5),
  visualQualityScore: z.number().min(0).max(10).default(5),
  ctaClarityScore: z.number().min(0).max(10).default(5),
  conversionClarityScore: z.number().min(0).max(10).default(5),
  serviceFit: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  identifiedIssues: z.array(z.string()).default([]),
});

export const createLeadInteractionSchema = z.object({
  type: z.nativeEnum(LeadInteractionType).default(LeadInteractionType.NOTE),
  note: z.string().min(1, 'Interaction note is required').max(3000),
  occurredAt: z.string().datetime().optional().nullable(),
});

// Internship Schemas
export const createInternshipSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100),
  role: z.string().min(1, 'Role title is required').max(100),
  location: z.string().min(1, 'Location is required').max(100),
  remote: z.boolean().default(false),
  url: urlSchema,
  source: z.string().default('Career Portal'),
  description: z.string().min(5, 'Description is required'),
  skills: z.array(z.string()).default([]),
  eligibility: z.string().min(1, 'Eligibility is required').default('Open to all qualified students'),
  deadline: z.string().datetime().optional().nullable(),
  postedAt: z.string().datetime().optional().nullable(),
  matchScore: z.number().min(0).max(100).default(50),
  matchReasons: z.array(z.string()).default([]),
  status: z.nativeEnum(InternshipStatus).default(InternshipStatus.NEW),
});

export const updateInternshipSchema = createInternshipSchema.partial();

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.nativeEnum(TaskType).default(TaskType.GENERAL),
  dueAt: z.string().datetime().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  relatedEntityType: z.string().optional().nullable(),
  relatedEntityId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Analytics Snapshot Schema
export const createAnalyticsSnapshotSchema = z.object({
  date: z.string().min(10, 'Date in YYYY-MM-DD format required'),
  followers: z.number().int().min(0),
  connections: z.number().int().min(0),
  profileViews: z.number().int().min(0),
  impressions: z.number().int().min(0),
  reactions: z.number().int().min(0),
  comments: z.number().int().min(0),
  reposts: z.number().int().min(0),
  clicks: z.number().int().min(0).default(0),
});

// Settings Schema
export const updateSettingsSchema = z.object({
  userName: z.string().min(1).max(100).optional(),
  userTitle: z.string().max(150).optional(),
  userBio: z.string().max(1000).optional(),
  targetRoles: z.array(z.string()).optional(),
  targetLocations: z.array(z.string()).optional(),
  targetTechnologies: z.array(z.string()).optional(),
  minInternshipMatchScore: z.number().min(0).max(100).optional(),
  freelanceServices: z.array(z.string()).optional(),
  aiProvider: z.enum(['mock', 'openai', 'gemini', 'anthropic']).optional(),
  weeklyPostingGoal: z.number().int().min(1).max(20).optional(),
  dailyNetworkingGoal: z.number().int().min(1).max(50).optional(),
});

// AI Generation Schemas
export const generateLinkedInPostInputSchema = z.object({
  idea: z.string().optional(),
  topic: z.string().optional(),
  category: z.nativeEnum(ContentCategory).default(ContentCategory.SOFTWARE_ENGINEERING),
  targetAudience: z.string().default('Software Engineers & Technical Leads'),
  tone: z.string().default('AUTHENTIC_TECHNICAL'),
  sourceContext: z.string().optional(),
  projectContext: z.string().optional(),
  mainLesson: z.string().optional(),
  desiredLength: z.enum(['SHORT', 'MEDIUM', 'LONG']).default('MEDIUM'),
});

export const generateLinkedInPostOutputSchema = z.object({
  title: z.string().default('Untitled Technical Post'),
  hook: z.string(),
  body: z.string(),
  cta: z.string().default(''),
  hashtags: z.array(z.string()).default([]),
  suggestedHashtags: z.array(z.string()).default([]),
  alternativeHooks: z.array(z.string()).default([]),
  personalizationBasis: z.array(z.string()).default([]),
  isLimitedContext: z.boolean().default(false),
  warnings: z.array(z.string()).default([]),
});

// Backward compatibility aliases
export const generateContentInputSchema = generateLinkedInPostInputSchema;
export const generateContentOutputSchema = generateLinkedInPostOutputSchema;

export const generateHooksInputSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  idea: z.string().optional(),
  category: z.string().optional(),
  sourceContext: z.string().optional(),
});

export const generateHooksOutputSchema = z.object({
  hooks: z.array(z.string()).min(1),
  rationale: z.string().optional(),
});

export const generateCtaInputSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  category: z.string().optional(),
});

export const generateCtaOutputSchema = z.object({
  ctas: z.array(z.string()).min(1),
});

export const generateHashtagsInputSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  category: z.string().optional(),
});

export const generateHashtagsOutputSchema = z.object({
  hashtags: z.array(z.string()).min(1),
});


export const generateNetworkingMessageInputSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  relevanceReason: z.string().optional().nullable(),
  category: z.nativeEnum(ContactCategory).optional().nullable(),
  notes: z.string().optional().nullable(),
  type: z.nativeEnum(NetworkingMessageType).default(NetworkingMessageType.CONNECTION_REQUEST),
});

export const generateNetworkingMessageOutputSchema = z.object({
  message: z.string(),
  personalizationBasis: z.array(z.string()),
  isLimitedPersonalization: z.boolean().default(false),
  toneNotes: z.string().optional(),
});


export const generateLeadOutreachInputSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  website: z.string().min(1, 'Website is required'),
  industry: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactRole: z.string().optional().nullable(),
  problem: z.string().min(1, 'Problem is required'),
  opportunity: z.string().min(1, 'Opportunity is required'),
  serviceFit: z.string().optional().nullable(),
  auditFindings: z.array(z.string()).default([]),
  qualificationReasons: z.array(z.string()).default([]),
  identifiedIssues: z.array(z.string()).default([]),
  variantType: z.nativeEnum(LeadOutreachVariantType).optional(),
});

export const generateLeadOutreachOutputSchema = z.object({
  observation: z.string(),
  problemStatement: z.string(),
  valueProposition: z.string(),
  closingQuestion: z.string(),
  fullDraft: z.string(),
  personalizationBasis: z.array(z.string()).default([]),
  variants: z.array(leadOutreachVariantSchema).default([]),
  isLimitedPersonalization: z.boolean().default(false),
  warnings: z.array(z.string()).default([]),
});

// Analytics Query Schemas
export const analyticsQuerySchema = z.object({
  period: z.nativeEnum(AnalyticsPeriod).default(AnalyticsPeriod.THIRTY_DAYS),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
});

export const analyticsTrendsQuerySchema = z.object({
  period: z.nativeEnum(AnalyticsPeriod).default(AnalyticsPeriod.THIRTY_DAYS),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.nativeEnum(AnalyticsGroupBy).default(AnalyticsGroupBy.DAY),
  category: z.string().optional(),
});
