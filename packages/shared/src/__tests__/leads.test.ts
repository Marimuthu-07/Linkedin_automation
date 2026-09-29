import { describe, it, expect } from 'vitest';
import {
  calculateLeadQualification,
  isValidLeadStatusTransition,
  VALID_LEAD_TRANSITIONS,
  calculateConversionRate,
  calculateLeadReplyRate,
  calculateLeadMeetingRate,
  calculateLeadProposalRate,
  calculateLeadWinRate,
} from '../calculations/index.js';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  leadFollowUpSchema,
  scoreLeadInputSchema,
  createLeadInteractionSchema,
  generateLeadOutreachInputSchema,
  generateLeadOutreachOutputSchema,
} from '../schemas/index.js';
import {
  LeadStatus,
  LeadInteractionType,
  LeadOutreachVariantType,
  LeadOutreachStatus,
} from '../types/enums.js';

describe('Lead Pipeline State Machine', () => {
  it('should allow valid standard progressive transitions', () => {
    // DISCOVERED -> RESEARCHING / QUALIFIED / OUTREACH_DRAFT / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.RESEARCHING)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.QUALIFIED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.OUTREACH_DRAFT)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.ARCHIVED)).toBe(true);

    // QUALIFIED -> OUTREACH_DRAFT / CONTACTED / RESEARCHING / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.QUALIFIED, LeadStatus.OUTREACH_DRAFT)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.QUALIFIED, LeadStatus.CONTACTED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.QUALIFIED, LeadStatus.ARCHIVED)).toBe(true);

    // OUTREACH_DRAFT -> CONTACTED / QUALIFIED / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.OUTREACH_DRAFT, LeadStatus.CONTACTED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.OUTREACH_DRAFT, LeadStatus.QUALIFIED)).toBe(true);

    // CONTACTED -> REPLIED / MEETING / LOST / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.CONTACTED, LeadStatus.REPLIED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.CONTACTED, LeadStatus.MEETING)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.CONTACTED, LeadStatus.LOST)).toBe(true);

    // REPLIED -> MEETING / PROPOSAL / CONTACTED / LOST / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.REPLIED, LeadStatus.MEETING)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.REPLIED, LeadStatus.PROPOSAL)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.REPLIED, LeadStatus.LOST)).toBe(true);

    // MEETING -> PROPOSAL / WON / LOST / REPLIED / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.MEETING, LeadStatus.PROPOSAL)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.MEETING, LeadStatus.WON)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.MEETING, LeadStatus.LOST)).toBe(true);

    // PROPOSAL -> WON / LOST / MEETING / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.PROPOSAL, LeadStatus.WON)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.PROPOSAL, LeadStatus.LOST)).toBe(true);

    // WON -> ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.WON, LeadStatus.ARCHIVED)).toBe(true);

    // LOST -> RESEARCHING / QUALIFIED / DISCOVERED / ARCHIVED
    expect(isValidLeadStatusTransition(LeadStatus.LOST, LeadStatus.QUALIFIED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.LOST, LeadStatus.DISCOVERED)).toBe(true);

    // Idempotent transitions
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.DISCOVERED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.QUALIFIED, LeadStatus.QUALIFIED)).toBe(true);
    expect(isValidLeadStatusTransition(LeadStatus.WON, LeadStatus.WON)).toBe(true);
  });

  it('should strictly reject invalid lifecycle jumps', () => {
    // DISCOVERED cannot jump directly to WON, PROPOSAL, MEETING, or REPLIED
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.WON)).toBe(false);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.PROPOSAL)).toBe(false);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.MEETING)).toBe(false);
    expect(isValidLeadStatusTransition(LeadStatus.DISCOVERED, LeadStatus.REPLIED)).toBe(false);

    // CONTACTED cannot jump directly to WON without meeting/proposal
    expect(isValidLeadStatusTransition(LeadStatus.CONTACTED, LeadStatus.WON)).toBe(false);

    // WON cannot transition directly to CONTACTED or DISCOVERED
    expect(isValidLeadStatusTransition(LeadStatus.WON, LeadStatus.CONTACTED)).toBe(false);
    expect(isValidLeadStatusTransition(LeadStatus.WON, LeadStatus.DISCOVERED)).toBe(false);
  });
});

describe('Deterministic Lead Qualification Algorithm', () => {
  it('should calculate high opportunity score when site has severe UX, mobile, and CTA deficiencies', () => {
    const input = {
      websiteUxScore: 3,
      mobileExperienceScore: 2,
      performanceScore: 3,
      visualQualityScore: 4,
      ctaClarityScore: 2,
      conversionClarityScore: 2,
      serviceFit: 'HIGH' as const,
      identifiedIssues: ['Checkout layout shifts', 'Unclear primary CTA'],
    };

    const breakdown = calculateLeadQualification(input);

    expect(breakdown.totalScore).toBeGreaterThanOrEqual(70);
    expect(breakdown.serviceFit).toBe('HIGH');
    expect(breakdown.reasons).toContain('Poor mobile responsiveness detected');
    expect(breakdown.reasons).toContain('Call-to-action is unclear or buried below fold');
    expect(breakdown.reasons).toContain('Weak conversion funnel with high user friction');
    expect(breakdown.reasons).toContain('Sub-optimal page load and performance metrics');
    expect(breakdown.reasons).toContain('Strong match for web application / redesign services');
    expect(breakdown.reasons).toContain('Checkout layout shifts');
    expect(breakdown.reasons).toContain('Unclear primary CTA');
  });

  it('should verify exact service fit weights: HIGH=20, MEDIUM=12, LOW=4', () => {
    // When all ratings are 10 (perfect site, needScore = 0):
    const highFit = calculateLeadQualification({
      websiteUxScore: 10,
      mobileExperienceScore: 10,
      performanceScore: 10,
      visualQualityScore: 10,
      ctaClarityScore: 10,
      conversionClarityScore: 10,
      serviceFit: 'HIGH',
    });
    expect(highFit.totalScore).toBe(20);

    const medFit = calculateLeadQualification({
      websiteUxScore: 10,
      mobileExperienceScore: 10,
      performanceScore: 10,
      visualQualityScore: 10,
      ctaClarityScore: 10,
      conversionClarityScore: 10,
      serviceFit: 'MEDIUM',
    });
    expect(medFit.totalScore).toBe(12);

    const lowFit = calculateLeadQualification({
      websiteUxScore: 10,
      mobileExperienceScore: 10,
      performanceScore: 10,
      visualQualityScore: 10,
      ctaClarityScore: 10,
      conversionClarityScore: 10,
      serviceFit: 'LOW',
    });
    expect(lowFit.totalScore).toBe(4);
  });

  it('should verify technical opportunity component is capped at exactly 80 points', () => {
    // When all ratings are 0 (worst possible site, maximum opportunity):
    // needScore = (10*1.5) + (10*1.5) + (10*1.5) + (10*1.5) + (10*1.0) + (10*1.0) = 80
    const worstWithHigh = calculateLeadQualification({
      websiteUxScore: 0,
      mobileExperienceScore: 0,
      performanceScore: 0,
      visualQualityScore: 0,
      ctaClarityScore: 0,
      conversionClarityScore: 0,
      serviceFit: 'HIGH',
    });
    // 80 (technical) + 20 (HIGH fit) = 100
    expect(worstWithHigh.totalScore).toBe(100);

    const worstWithMed = calculateLeadQualification({
      websiteUxScore: 0,
      mobileExperienceScore: 0,
      performanceScore: 0,
      visualQualityScore: 0,
      ctaClarityScore: 0,
      conversionClarityScore: 0,
      serviceFit: 'MEDIUM',
    });
    // 80 (technical) + 12 (MEDIUM fit) = 92
    expect(worstWithMed.totalScore).toBe(92);

    const worstWithLow = calculateLeadQualification({
      websiteUxScore: 0,
      mobileExperienceScore: 0,
      performanceScore: 0,
      visualQualityScore: 0,
      ctaClarityScore: 0,
      conversionClarityScore: 0,
      serviceFit: 'LOW',
    });
    // 80 (technical) + 4 (LOW fit) = 84
    expect(worstWithLow.totalScore).toBe(84);
  });

  it('should calculate low opportunity score when site is already well-optimized with low service fit', () => {
    const input = {
      websiteUxScore: 9,
      mobileExperienceScore: 9,
      performanceScore: 9,
      visualQualityScore: 9,
      ctaClarityScore: 9,
      conversionClarityScore: 9,
      serviceFit: 'LOW' as const,
    };

    const breakdown = calculateLeadQualification(input);

    expect(breakdown.totalScore).toBeLessThan(30);
    expect(breakdown.serviceFit).toBe('LOW');
  });

  it('should clamp out-of-bounds ratings safely (0 to 10) and keep total score between 0 and 100', () => {
    const input = {
      websiteUxScore: 100, // should clamp to 10
      mobileExperienceScore: -5, // should clamp to 0
      performanceScore: 5,
      visualQualityScore: 5,
      ctaClarityScore: 5,
      conversionClarityScore: 5,
      serviceFit: 'MEDIUM' as const,
    };

    const breakdown = calculateLeadQualification(input);

    expect(breakdown.websiteUxScore).toBe(10);
    expect(breakdown.mobileExperienceScore).toBe(0);
    expect(breakdown.totalScore).toBeGreaterThan(0);
    expect(breakdown.totalScore).toBeLessThanOrEqual(100);
  });
});

describe('Lead Conversion Rates (Division by Zero Safe)', () => {
  it('should compute valid conversion rate percentages', () => {
    // 20 contacted, 5 replied => 25.0%
    expect(calculateLeadReplyRate(5, 20)).toBe(25);

    // 20 contacted, 4 meetings => 20.0%
    expect(calculateLeadMeetingRate(4, 20)).toBe(20);

    // 20 contacted, 2 won => 10.0%
    expect(calculateLeadWinRate(2, 20)).toBe(10);
  });

  it('should return null when denominator is zero or negative', () => {
    expect(calculateLeadReplyRate(0, 0)).toBeNull();
    expect(calculateLeadMeetingRate(2, 0)).toBeNull();
    expect(calculateLeadProposalRate(1, -5)).toBeNull();
    expect(calculateConversionRate(5, NaN)).toBeNull();
  });
});

describe('Lead Zod Schemas Validation', () => {
  it('should validate complete valid lead payload', () => {
    const payload = {
      company: 'Nordic Artisan Coffee',
      website: 'https://nordiccoffee.com',
      industry: 'E-commerce',
      location: 'Stockholm',
      contactName: 'Lars Lindqvist',
      contactRole: 'Co-Founder',
      linkedinUrl: 'https://www.linkedin.com/in/lars',
      problem: 'Mobile checkout takes 5.8s',
      opportunity: 'Next.js storefront rebuild',
      qualificationScore: 82,
      status: LeadStatus.QUALIFIED,
    };

    const parsed = createLeadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('should reject lead without company or invalid website', () => {
    const invalidPayload = {
      company: '',
      website: 'not-a-url',
      industry: 'SaaS',
      problem: 'Issue',
      opportunity: 'Pitch',
    };

    const parsed = createLeadSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('should validate lead follow-up schema', () => {
    const valid = {
      nextFollowUpAt: new Date().toISOString(),
      note: 'Follow up on Loom video review',
    };
    expect(leadFollowUpSchema.safeParse(valid).success).toBe(true);

    const validClear = {
      nextFollowUpAt: null,
    };
    expect(leadFollowUpSchema.safeParse(validClear).success).toBe(true);
  });

  it('should validate lead interaction schema', () => {
    const valid = {
      type: LeadInteractionType.LINKEDIN_MANUAL,
      note: 'Sent manual InMail regarding website audit',
      occurredAt: new Date().toISOString(),
    };
    expect(createLeadInteractionSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      type: 'INVALID_TYPE',
      note: '',
    };
    expect(createLeadInteractionSchema.safeParse(invalid).success).toBe(false);
  });

  it('should validate AI outreach output schema', () => {
    const validOutput = {
      observation: 'Noticed 5.8s mobile checkout latency.',
      problemStatement: 'Introduces friction at checkout.',
      valueProposition: 'Next.js template improves conversion.',
      closingQuestion: 'Open to a quick 3-min Loom breakdown?',
      fullDraft: 'Hi Lars,\n\nNoticed 5.8s mobile checkout latency...',
      personalizationBasis: ['Company: Nordic Coffee', 'Problem: 5.8s mobile checkout'],
      variants: [
        {
          type: LeadOutreachVariantType.SHORT,
          body: 'Short pitch text...',
          personalizationBasis: ['Company: Nordic Coffee'],
          status: LeadOutreachStatus.DRAFT,
        },
      ],
    };

    const parsed = generateLeadOutreachOutputSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);
  });
});
