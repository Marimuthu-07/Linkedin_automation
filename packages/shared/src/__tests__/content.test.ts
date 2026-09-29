import { describe, it, expect } from 'vitest';
import {
  ContentStatus,
  ContentCategory,
  VALID_CONTENT_TRANSITIONS,
  isValidContentStatusTransition,
  calculateEngagementRate,
  createContentPostSchema,
  updateContentPostSchema,
  updateContentStatusSchema,
  createContentMetricsSchema,
  generateLinkedInPostOutputSchema,
  generateHooksOutputSchema,
  generateCtaOutputSchema,
  generateHashtagsOutputSchema,
} from '../index.js';

describe('Content Lifecycle State Machine', () => {
  it('should allow valid forward transitions', () => {
    // IDEA -> DRAFT
    expect(isValidContentStatusTransition(ContentStatus.IDEA, ContentStatus.DRAFT)).toBe(true);
    // DRAFT -> REVIEW
    expect(isValidContentStatusTransition(ContentStatus.DRAFT, ContentStatus.REVIEW)).toBe(true);
    // REVIEW -> APPROVED
    expect(isValidContentStatusTransition(ContentStatus.REVIEW, ContentStatus.APPROVED)).toBe(true);
    // APPROVED -> SCHEDULED
    expect(isValidContentStatusTransition(ContentStatus.APPROVED, ContentStatus.SCHEDULED)).toBe(true);
    // SCHEDULED -> PUBLISHED
    expect(isValidContentStatusTransition(ContentStatus.SCHEDULED, ContentStatus.PUBLISHED)).toBe(true);
    // PUBLISHED -> ARCHIVED
    expect(isValidContentStatusTransition(ContentStatus.PUBLISHED, ContentStatus.ARCHIVED)).toBe(true);
  });

  it('should allow valid editorial backward transitions', () => {
    // DRAFT -> IDEA
    expect(isValidContentStatusTransition(ContentStatus.DRAFT, ContentStatus.IDEA)).toBe(true);
    // REVIEW -> DRAFT
    expect(isValidContentStatusTransition(ContentStatus.REVIEW, ContentStatus.DRAFT)).toBe(true);
    // APPROVED -> DRAFT
    expect(isValidContentStatusTransition(ContentStatus.APPROVED, ContentStatus.DRAFT)).toBe(true);
    // SCHEDULED -> APPROVED (Unschedule)
    expect(isValidContentStatusTransition(ContentStatus.SCHEDULED, ContentStatus.APPROVED)).toBe(true);
    // ARCHIVED -> IDEA or DRAFT (Restore)
    expect(isValidContentStatusTransition(ContentStatus.ARCHIVED, ContentStatus.IDEA)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.ARCHIVED, ContentStatus.DRAFT)).toBe(true);
  });

  it('should allow archiving from any non-published or published active stage', () => {
    expect(isValidContentStatusTransition(ContentStatus.IDEA, ContentStatus.ARCHIVED)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.DRAFT, ContentStatus.ARCHIVED)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.REVIEW, ContentStatus.ARCHIVED)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.APPROVED, ContentStatus.ARCHIVED)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.SCHEDULED, ContentStatus.ARCHIVED)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.PUBLISHED, ContentStatus.ARCHIVED)).toBe(true);
  });

  it('should be idempotent when transitioning to same status', () => {
    expect(isValidContentStatusTransition(ContentStatus.DRAFT, ContentStatus.DRAFT)).toBe(true);
    expect(isValidContentStatusTransition(ContentStatus.SCHEDULED, ContentStatus.SCHEDULED)).toBe(true);
  });

  it('should strictly reject invalid state jumps', () => {
    // IDEA -> PUBLISHED (Invalid jump)
    expect(isValidContentStatusTransition(ContentStatus.IDEA, ContentStatus.PUBLISHED)).toBe(false);
    // DRAFT -> PUBLISHED (Invalid jump)
    expect(isValidContentStatusTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED)).toBe(false);
    // REVIEW -> PUBLISHED (Invalid jump)
    expect(isValidContentStatusTransition(ContentStatus.REVIEW, ContentStatus.PUBLISHED)).toBe(false);
    // IDEA -> APPROVED (Invalid jump)
    expect(isValidContentStatusTransition(ContentStatus.IDEA, ContentStatus.APPROVED)).toBe(false);
    // ARCHIVED -> PUBLISHED (Invalid jump)
    expect(isValidContentStatusTransition(ContentStatus.ARCHIVED, ContentStatus.PUBLISHED)).toBe(false);
    // PUBLISHED -> DRAFT (Must archive or stay published)
    expect(isValidContentStatusTransition(ContentStatus.PUBLISHED, ContentStatus.DRAFT)).toBe(false);
  });
});

describe('Content Schemas Validation', () => {
  it('should validate minimal content post with idea only', () => {
    const minimalIdea = {
      idea: 'I learned how Docker volumes work on Linux.',
      category: ContentCategory.LINUX,
    };
    const parsed = createContentPostSchema.safeParse(minimalIdea);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe(ContentStatus.IDEA);
    }
  });

  it('should validate minimal content post with title only', () => {
    const minimalTitle = {
      title: 'Demystifying PostgreSQL B-Trees',
      category: ContentCategory.DATABASES,
    };
    const parsed = createContentPostSchema.safeParse(minimalTitle);
    expect(parsed.success).toBe(true);
  });

  it('should reject content post when both title and idea are missing/empty', () => {
    const emptyPost = {
      title: '',
      idea: '',
      category: ContentCategory.SOFTWARE_ENGINEERING,
    };
    const parsed = createContentPostSchema.safeParse(emptyPost);
    expect(parsed.success).toBe(false);
  });

  it('should validate full content post with hooks, body, tags, and audience', () => {
    const fullPost = {
      title: 'Mastering Node.js Stream Pipelines',
      hook: 'Stop buffering gigabytes in RAM. Use streams instead.',
      body: '1. Use Transform streams.\n2. Handle backpressure.\n3. Measure throughput.',
      cta: 'How do you handle large file uploads in Node.js?',
      category: ContentCategory.SOFTWARE_ENGINEERING,
      status: ContentStatus.DRAFT,
      targetAudience: 'Backend Engineers & Node.js Developers',
      tone: 'AUTHENTIC_TECHNICAL',
      sourceContext: 'Refactored media upload service.',
      hashtags: ['nodejs', 'backend', 'performance'],
    };
    const parsed = createContentPostSchema.safeParse(fullPost);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid content category', () => {
    const invalidCat = {
      title: 'Test Post',
      category: 'INVALID_CATEGORY_NAME',
    };
    const parsed = createContentPostSchema.safeParse(invalidCat);
    expect(parsed.success).toBe(false);
  });

  it('should reject invalid externalPostUrl', () => {
    const invalidUrl = {
      title: 'Test Post',
      externalPostUrl: 'not-a-valid-url',
    };
    const parsed = createContentPostSchema.safeParse(invalidUrl);
    expect(parsed.success).toBe(false);
  });

  it('should accept valid externalPostUrl', () => {
    const validUrl = {
      title: 'Test Post',
      externalPostUrl: 'https://www.linkedin.com/posts/alexchen-test',
    };
    const parsed = createContentPostSchema.safeParse(validUrl);
    expect(parsed.success).toBe(true);
  });
});

describe('Content Metrics Validation', () => {
  it('should validate valid non-negative metrics', () => {
    const validMetrics = {
      impressions: 5000,
      reactions: 150,
      comments: 30,
      reposts: 12,
      clicks: 80,
    };
    const parsed = createContentMetricsSchema.safeParse(validMetrics);
    expect(parsed.success).toBe(true);
  });

  it('should reject negative numbers in metrics', () => {
    const negativeImpressions = {
      impressions: -50,
      reactions: 10,
      comments: 2,
      reposts: 1,
      clicks: 0,
    };
    expect(createContentMetricsSchema.safeParse(negativeImpressions).success).toBe(false);

    const negativeReactions = {
      impressions: 1000,
      reactions: -5,
      comments: 2,
      reposts: 1,
      clicks: 0,
    };
    expect(createContentMetricsSchema.safeParse(negativeReactions).success).toBe(false);
  });

  it('should calculate accurate engagement rate', () => {
    // (150 + 30 + 12 + 80) / 5000 * 100 = 272 / 5000 * 100 = 5.44%
    const er = calculateEngagementRate(5000, 150, 30, 12, 80);
    expect(er).toBe(5.44);
  });

  it('should return null engagement rate when impressions is 0', () => {
    expect(calculateEngagementRate(0, 10, 5, 2, 1)).toBeNull();
  });
});

describe('AI Content Generation Schemas', () => {
  it('should validate structured LinkedIn post output', () => {
    const validAiOutput = {
      title: 'How Streams Prevent Node.js Memory Spikes',
      hook: 'Most Node.js backends buffer entire file uploads in RAM.',
      body: '1. Use Transform streams.\n2. Add backpressure.\n3. Measure p99 latency.',
      cta: 'What is your favorite memory debugging tool?',
      hashtags: ['nodejs', 'backend', 'performance'],
      suggestedHashtags: ['nodejs', 'backend', 'performance'],
      alternativeHooks: [
        'Why stream pipelines are a superpower:',
        'Stop crashing servers with unbuffered allocations:',
      ],
      personalizationBasis: ['Topic', 'Category'],
      isLimitedContext: false,
      warnings: [],
    };
    const parsed = generateLinkedInPostOutputSchema.safeParse(validAiOutput);
    expect(parsed.success).toBe(true);
  });

  it('should validate hook generator output', () => {
    const hooksOutput = {
      hooks: [
        'Most developers overlook this critical detail:',
        'Stop treating memory optimization as an afterthought:',
        'Why conventional wisdom about indexing is wrong:',
      ],
      rationale: 'Curiosity and problem-driven hooks.',
    };
    const parsed = generateHooksOutputSchema.safeParse(hooksOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.hooks.length).toBe(3);
    }
  });

  it('should validate CTA generator output', () => {
    const ctaOutput = {
      ctas: [
        'What is your go-to strategy for this?',
        'Save this post if you are building distributed systems.',
      ],
    };
    const parsed = generateCtaOutputSchema.safeParse(ctaOutput);
    expect(parsed.success).toBe(true);
  });

  it('should validate hashtag generator output', () => {
    const hashtagOutput = {
      hashtags: ['softwareengineering', 'typescript', 'react', 'webdev'],
    };
    const parsed = generateHashtagsOutputSchema.safeParse(hashtagOutput);
    expect(parsed.success).toBe(true);
  });
});
