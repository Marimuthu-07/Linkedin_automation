import { describe, it, expect } from 'vitest';
import {
  calculateEngagementRate,
  calculateMetricComparison,
  getDateRangeForPeriod,
  formatDateKey,
  formatBucketKey,
  generateDeterministicInsights,
  OFFICIAL_METRIC_DEFINITIONS,
  AnalyticsPeriod,
  AnalyticsGroupBy,
} from '../index.js';

describe('Analytics Calculations & Metrics Suite', () => {
  describe('calculateEngagementRate', () => {
    it('should calculate engagement rate accurately with reactions, comments, reposts, and clicks', () => {
      // (42 + 8 + 3 + 22) / 1200 * 100 = 75 / 1200 * 100 = 6.25%
      const rate = calculateEngagementRate(1200, 42, 8, 3, 22);
      expect(rate).toBe(6.25);
    });

    it('should calculate engagement rate with 0 clicks (default parameter)', () => {
      // (50 + 10 + 5) / 1000 * 100 = 65 / 1000 * 100 = 6.5%
      const rate = calculateEngagementRate(1000, 50, 10, 5);
      expect(rate).toBe(6.5);
    });

    it('should safely return null when impressions is 0 (division by zero prevention)', () => {
      const rate = calculateEngagementRate(0, 10, 5, 2, 1);
      expect(rate).toBeNull();
    });

    it('should safely return null when impressions is negative or NaN', () => {
      expect(calculateEngagementRate(-500, 10, 5, 2)).toBeNull();
      expect(calculateEngagementRate(NaN, 10, 5, 2)).toBeNull();
    });

    it('should handle null, undefined, or negative interaction values as 0', () => {
      const rate = calculateEngagementRate(1000, (null as any), (undefined as any), -5, 10);
      expect(rate).toBe(1.0); // 10 / 1000 * 100 = 1.0%
    });

    it('should return 0.0% if all interactions are 0 and impressions > 0', () => {
      const rate = calculateEngagementRate(500, 0, 0, 0, 0);
      expect(rate).toBe(0);
    });
  });

  describe('calculateMetricComparison', () => {
    it('should calculate positive percentage growth', () => {
      const comp = calculateMetricComparison(150, 100);
      expect(comp.current).toBe(150);
      expect(comp.previous).toBe(100);
      expect(comp.absoluteChange).toBe(50);
      expect(comp.percentageChange).toBe(50.0);
    });

    it('should calculate negative percentage contraction', () => {
      const comp = calculateMetricComparison(80, 100);
      expect(comp.current).toBe(80);
      expect(comp.previous).toBe(100);
      expect(comp.absoluteChange).toBe(-20);
      expect(comp.percentageChange).toBe(-20.0);
    });

    it('should return 0% change when current equals previous', () => {
      const comp = calculateMetricComparison(100, 100);
      expect(comp.absoluteChange).toBe(0);
      expect(comp.percentageChange).toBe(0);
    });

    it('should return 0% change when both current and previous are 0', () => {
      const comp = calculateMetricComparison(0, 0);
      expect(comp.absoluteChange).toBe(0);
      expect(comp.percentageChange).toBe(0);
    });

    it('should return null percentageChange when previous is 0 and current > 0 (division by zero safeguard)', () => {
      const comp = calculateMetricComparison(25, 0);
      expect(comp.current).toBe(25);
      expect(comp.previous).toBe(0);
      expect(comp.absoluteChange).toBe(25);
      expect(comp.percentageChange).toBeNull();
    });

    it('should safely handle NaN/null inputs', () => {
      const comp = calculateMetricComparison(NaN, (null as any));
      expect(comp.current).toBe(0);
      expect(comp.previous).toBe(0);
      expect(comp.absoluteChange).toBe(0);
      expect(comp.percentageChange).toBe(0);
    });
  });

  describe('getDateRangeForPeriod', () => {
    const refDate = new Date(2026, 8, 29, 12, 0, 0); // Sept 29, 2026 local time

    it('should compute 7-day period and baseline bounds', () => {
      const bounds = getDateRangeForPeriod(AnalyticsPeriod.SEVEN_DAYS, undefined, undefined, refDate);
      expect(formatDateKey(bounds.endDate)).toBe('2026-09-29');
      // 7 days ending on Sept 29: Sept 23 to Sept 29
      expect(formatDateKey(bounds.startDate)).toBe('2026-09-23');
      // Equal 7-day prior baseline: Sept 16 to Sept 22
      expect(formatDateKey(bounds.prevStartDate)).toBe('2026-09-16');
      expect(formatDateKey(bounds.prevEndDate)).toBe('2026-09-22');
    });

    it('should compute 30-day period and baseline bounds', () => {
      const bounds = getDateRangeForPeriod(AnalyticsPeriod.THIRTY_DAYS, undefined, undefined, refDate);
      expect(formatDateKey(bounds.endDate)).toBe('2026-09-29');
      expect(formatDateKey(bounds.startDate)).toBe('2026-08-31');
      expect(formatDateKey(bounds.prevEndDate)).toBe('2026-08-30');
    });

    it('should compute 90-day period bounds', () => {
      const bounds = getDateRangeForPeriod(AnalyticsPeriod.NINETY_DAYS, undefined, undefined, refDate);
      expect(formatDateKey(bounds.endDate)).toBe('2026-09-29');
      expect(bounds.startDate < bounds.endDate).toBe(true);
      expect(bounds.prevStartDate < bounds.prevEndDate).toBe(true);
    });

    it('should compute 1-year period bounds', () => {
      const bounds = getDateRangeForPeriod(AnalyticsPeriod.ONE_YEAR, undefined, undefined, refDate);
      expect(formatDateKey(bounds.endDate)).toBe('2026-09-29');
      expect(formatDateKey(bounds.startDate)).toBe('2025-09-30');
    });

    it('should support custom date range with equal prior baseline period', () => {
      const bounds = getDateRangeForPeriod(
        AnalyticsPeriod.CUSTOM,
        '2026-09-10',
        '2026-09-20',
        refDate
      );
      expect(formatDateKey(bounds.startDate)).toBe('2026-09-10');
      expect(formatDateKey(bounds.endDate)).toBe('2026-09-20');
      // Duration is 11 days (Sept 10 - 20). Baseline ends before Sept 10.
      expect(bounds.prevEndDate < bounds.startDate).toBe(true);
    });
  });

  describe('formatBucketKey', () => {
    const testDate = new Date('2026-09-29T10:00:00Z');

    it('should format date by day (YYYY-MM-DD)', () => {
      expect(formatBucketKey(testDate, AnalyticsGroupBy.DAY)).toBe('2026-09-29');
    });

    it('should format date by month (YYYY-MM)', () => {
      expect(formatBucketKey(testDate, AnalyticsGroupBy.MONTH)).toBe('2026-09');
    });

    it('should format date by week (Monday start of week)', () => {
      const weekKey = formatBucketKey(testDate, AnalyticsGroupBy.WEEK);
      // Sept 29, 2026 is Tuesday -> Monday is Sept 28, 2026
      expect(weekKey).toBe('2026-09-28');
    });
  });

  describe('generateDeterministicInsights', () => {
    it('should produce reach growth insight when impressions increased', () => {
      const insights = generateDeterministicInsights({
        content: {
          totalImpressions: 4500,
          totalInteractions: 300,
          impressionsComparison: {
            current: 4500,
            previous: 3000,
            absoluteChange: 1500,
            percentageChange: 50.0,
          },
        },
      });

      expect(insights.length).toBeGreaterThan(0);
      const reachInsight = insights.find((i) => i.id === 'content-impressions-trend');
      expect(reachInsight).toBeDefined();
      expect(reachInsight?.type).toBe('positive');
      expect(reachInsight?.message).toContain('50% more impressions');
    });

    it('should produce follow-up alert when follow-ups are due', () => {
      const insights = generateDeterministicInsights({
        networking: {
          contactsAddedInPeriod: 5,
          interactionsInPeriod: 8,
          followUpsDueCount: 3,
        },
      });

      const followUpInsight = insights.find((i) => i.id === 'networking-followups-due');
      expect(followUpInsight).toBeDefined();
      expect(followUpInsight?.type).toBe('attention');
      expect(followUpInsight?.message).toContain('3 networking follow-ups are due');
    });

    it('should produce top category insight when category engagement is provided', () => {
      const insights = generateDeterministicInsights({
        content: {
          totalImpressions: 2000,
          totalInteractions: 150,
          topCategory: 'SOFTWARE_ENGINEERING',
          topCategoryEngagement: 7.5,
        },
      });

      const catInsight = insights.find((i) => i.id === 'content-top-category');
      expect(catInsight).toBeDefined();
      expect(catInsight?.message).toContain('SOFTWARE ENGINEERING');
      expect(catInsight?.message).toContain('7.5%');
    });
  });

  describe('OFFICIAL_METRIC_DEFINITIONS', () => {
    it('should contain full definitions for all standard metrics', () => {
      expect(OFFICIAL_METRIC_DEFINITIONS.ENGAGEMENT_RATE).toBeDefined();
      expect(OFFICIAL_METRIC_DEFINITIONS.ENGAGEMENT_RATE.formula).toContain('Impressions');
      expect(OFFICIAL_METRIC_DEFINITIONS.AVG_IMPRESSIONS_PER_POST).toBeDefined();
      expect(OFFICIAL_METRIC_DEFINITIONS.PERIOD_OVER_PERIOD_CHANGE).toBeDefined();
      expect(OFFICIAL_METRIC_DEFINITIONS.NETWORKING_RESPONSE_RATE).toBeDefined();
      expect(OFFICIAL_METRIC_DEFINITIONS.LEAD_QUALIFICATION_SCORE).toBeDefined();
    });
  });
});
