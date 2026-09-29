import { describe, it, expect } from 'vitest';
import {
  calculateEngagementRate,
  calculateLeadQualification,
  calculateInternshipMatch,
  isValidNetworkingStatusTransition,
  getFollowUpStatus,
  isFollowUpDueToday,
  isFollowUpOverdue,
  isFollowUpUpcoming7Days,
} from '../calculations/index.js';
import {
  createContactSchema,
  createLeadSchema,
  createInternshipSchema,
  createAnalyticsSnapshotSchema,
  generateContentOutputSchema,
} from '../schemas/index.js';
import { ContactCategory, NetworkingStatus } from '../types/enums.js';


describe('Engagement Rate Calculation', () => {
  it('should calculate correct engagement rate percentage', () => {
    // 1000 impressions, 50 reactions, 10 comments, 5 reposts, 15 clicks = 80 interactions => 8.00%
    const rate = calculateEngagementRate(1000, 50, 10, 5, 15);
    expect(rate).toBe(8);
  });

  it('should safely return null when impressions are zero', () => {
    const rate = calculateEngagementRate(0, 10, 5, 2, 1);
    expect(rate).toBeNull();
  });

  it('should safely return null when impressions are negative or NaN', () => {
    expect(calculateEngagementRate(-100, 10, 5, 2)).toBeNull();
    expect(calculateEngagementRate(NaN, 10, 5, 2)).toBeNull();
  });

  it('should round correctly to two decimal places', () => {
    // 333 impressions, 10 reactions = (10/333)*100 = 3.003% => 3%
    const rate = calculateEngagementRate(333, 10, 0, 0, 0);
    expect(rate).toBe(3);
  });
});

describe('Lead Qualification Scoring', () => {
  it('should calculate transparent score and document issues when UX and CTA are poor', () => {
    const result = calculateLeadQualification({
      websiteUxScore: 4,
      mobileExperienceScore: 3,
      performanceScore: 4,
      visualQualityScore: 5,
      ctaClarityScore: 2,
      conversionClarityScore: 3,
      serviceFit: 'HIGH',
      identifiedIssues: ['Broken mobile navigation bar'],
    });

    expect(result.totalScore).toBeGreaterThan(60);
    expect(result.reasons).toContain('Poor mobile responsiveness detected');
    expect(result.reasons).toContain('Call-to-action is unclear or buried below fold');
    expect(result.reasons).toContain('Broken mobile navigation bar');
    expect(result.serviceFit).toBe('HIGH');
  });

  it('should assign a lower opportunity score to already-optimized sites', () => {
    const result = calculateLeadQualification({
      websiteUxScore: 9,
      mobileExperienceScore: 9,
      performanceScore: 9,
      visualQualityScore: 9,
      ctaClarityScore: 9,
      conversionClarityScore: 9,
      serviceFit: 'LOW',
    });

    expect(result.totalScore).toBeLessThan(40);
  });
});

describe('Internship Match Scoring', () => {
  it('should score high for matching roles and technical skills', () => {
    const internship = {
      role: 'Full Stack Software Engineer Intern',
      location: 'San Francisco, CA',
      remote: true,
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      description: 'Building modern web applications and developer tools.',
    };

    const criteria = {
      targetRoles: ['Software Engineer', 'Full Stack Engineer'],
      targetLocations: ['San Francisco', 'Remote'],
      targetSkills: ['TypeScript', 'React', 'Node.js'],
    };

    const result = calculateInternshipMatch(internship, criteria);
    expect(result.matchScore).toBeGreaterThanOrEqual(80);
    expect(result.matchReasons).toContain('Matches target engineering role preference');
    expect(result.matchReasons).toContain('Remote flexibility available');
  });
});

describe('Networking Status Transitions', () => {
  it('should validate all valid forward and backward pipeline transitions', () => {
    // DISCOVERED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.REVIEWING)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.ARCHIVED)).toBe(true);

    // REVIEWING transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REVIEWING, NetworkingStatus.APPROVED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REVIEWING, NetworkingStatus.ARCHIVED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REVIEWING, NetworkingStatus.DISCOVERED)).toBe(true);

    // APPROVED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.APPROVED, NetworkingStatus.CONTACTED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.APPROVED, NetworkingStatus.ARCHIVED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.APPROVED, NetworkingStatus.REVIEWING)).toBe(true);

    // CONTACTED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONTACTED, NetworkingStatus.REPLIED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONTACTED, NetworkingStatus.FOLLOW_UP)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONTACTED, NetworkingStatus.ARCHIVED)).toBe(true);

    // FOLLOW_UP transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.FOLLOW_UP, NetworkingStatus.CONTACTED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.FOLLOW_UP, NetworkingStatus.REPLIED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.FOLLOW_UP, NetworkingStatus.ARCHIVED)).toBe(true);

    // REPLIED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REPLIED, NetworkingStatus.CONNECTED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REPLIED, NetworkingStatus.FOLLOW_UP)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.REPLIED, NetworkingStatus.ARCHIVED)).toBe(true);

    // CONNECTED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONNECTED, NetworkingStatus.ARCHIVED)).toBe(true);

    // ARCHIVED transitions
    expect(isValidNetworkingStatusTransition(NetworkingStatus.ARCHIVED, NetworkingStatus.DISCOVERED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.ARCHIVED, NetworkingStatus.REVIEWING)).toBe(true);

    // Idempotent (same status)
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.DISCOVERED)).toBe(true);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.APPROVED, NetworkingStatus.APPROVED)).toBe(true);
  });

  it('should strictly reject invalid state transitions', () => {
    // DISCOVERED cannot jump directly to CONTACTED, REPLIED, or CONNECTED
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.CONTACTED)).toBe(false);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.REPLIED)).toBe(false);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.DISCOVERED, NetworkingStatus.CONNECTED)).toBe(false);

    // ARCHIVED cannot jump directly to CONTACTED, REPLIED, or CONNECTED
    expect(isValidNetworkingStatusTransition(NetworkingStatus.ARCHIVED, NetworkingStatus.CONTACTED)).toBe(false);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.ARCHIVED, NetworkingStatus.CONNECTED)).toBe(false);

    // CONNECTED cannot transition back to CONTACTED or DISCOVERED
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONNECTED, NetworkingStatus.CONTACTED)).toBe(false);
    expect(isValidNetworkingStatusTransition(NetworkingStatus.CONNECTED, NetworkingStatus.DISCOVERED)).toBe(false);
  });
});

describe('Follow-up Date Calculations', () => {
  const refDate = new Date('2026-09-28T12:00:00Z');

  it('should accurately categorize follow-up due today', () => {
    const dueToday = new Date('2026-09-28T15:30:00Z');
    expect(isFollowUpDueToday(dueToday, refDate)).toBe(true);
    expect(getFollowUpStatus(dueToday, refDate)).toBe('DUE_TODAY');
    expect(isFollowUpOverdue(dueToday, refDate)).toBe(false);
  });

  it('should accurately categorize overdue follow-up', () => {
    const overdueDate = new Date('2026-09-26T10:00:00Z');
    expect(isFollowUpOverdue(overdueDate, refDate)).toBe(true);
    expect(getFollowUpStatus(overdueDate, refDate)).toBe('OVERDUE');
    expect(isFollowUpDueToday(overdueDate, refDate)).toBe(false);
  });

  it('should accurately categorize upcoming 7 days follow-up', () => {
    const upcomingDate = new Date('2026-10-02T10:00:00Z'); // 4 days later
    expect(isFollowUpUpcoming7Days(upcomingDate, refDate)).toBe(true);
    expect(getFollowUpStatus(upcomingDate, refDate)).toBe('UPCOMING_7_DAYS');
  });

  it('should categorize far future follow-ups as FUTURE', () => {
    const futureDate = new Date('2026-11-20T10:00:00Z');
    expect(getFollowUpStatus(futureDate, refDate)).toBe('FUTURE');
  });

  it('should handle null or invalid date strings safely', () => {
    expect(getFollowUpStatus(null, refDate)).toBe('NONE');
    expect(getFollowUpStatus(undefined, refDate)).toBe('NONE');
    expect(getFollowUpStatus('invalid-date', refDate)).toBe('NONE');
  });
});

describe('Validation Schemas', () => {
  it('should validate minimal networking contact with name only', () => {
    const minimalContact = {
      name: 'Taylor Chen',
    };

    const parsed = createContactSchema.safeParse(minimalContact);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Taylor Chen');
      expect(parsed.data.category).toBe(ContactCategory.OTHER);
      expect(parsed.data.status).toBe(NetworkingStatus.DISCOVERED);
    }
  });

  it('should validate full networking contact with all details', () => {
    const validContact = {
      name: 'Sarah Connor',
      linkedinUrl: 'https://www.linkedin.com/in/sarahconnor',
      role: 'Staff Infrastructure Engineer',
      company: 'CloudTech',
      category: ContactCategory.SOFTWARE_ENGINEER,
      source: 'LinkedIn Network',
      relevanceReason: 'Deep expertise in distributed systems and cloud tooling',
    };

    const parsed = createContactSchema.safeParse(validContact);
    expect(parsed.success).toBe(true);
  });

  it('should reject contact with empty name', () => {
    const invalidContact = {
      name: '',
      company: 'Acme',
    };

    const parsed = createContactSchema.safeParse(invalidContact);
    expect(parsed.success).toBe(false);
  });

  it('should reject invalid URLs', () => {
    const invalidLead = {
      company: 'TechCorp',
      website: 'not-a-valid-url',
      industry: 'SaaS',
      problem: 'Slow page load',
      opportunity: 'Next.js rewrite',
    };

    const parsed = createLeadSchema.safeParse(invalidLead);
    expect(parsed.success).toBe(false);
  });

  it('should validate AI structured content generation output', () => {
    const aiOutput = {
      hook: 'Most developers write Dockerfiles that are 10x too big. Here is how I fixed mine:',
      body: 'By implementing multi-stage builds and alpine bases, we reduced image size from 1.2GB to 85MB.',
      cta: 'What is your favorite Docker optimization technique? Let me know below.',
      suggestedHashtags: ['#docker', '#devops', '#softwareengineering'],
      alternativeHooks: [
        'How we shrank our production Docker image by 93% in 1 afternoon:',
        'Stop shipping 1GB container images to production.',
      ],
    };

    const parsed = generateContentOutputSchema.safeParse(aiOutput);
    expect(parsed.success).toBe(true);
  });
});

