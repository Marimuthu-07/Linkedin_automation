import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { LeadStatus, LeadInteractionType, LeadOutreachVariantType } from '@linkedin-growth/shared';

describe('Lead Generation & Outreach Engine API Integration Tests', () => {
  const app = createApp();
  let createdLeadId: string;
  let testLeadForTransitionId: string;
  let createdInteractionId: string;

  it('GET /api/leads/stats should return complete pipeline metrics', async () => {
    const res = await request(app).get('/api/leads/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalLeads).toBe('number');
    expect(res.body.totalLeads).toBeGreaterThan(0);
    expect(typeof res.body.totalDiscovered).toBe('number');
    expect(typeof res.body.totalQualified).toBe('number');
    expect(typeof res.body.totalOutreachDraft).toBe('number');
    expect(typeof res.body.totalContacted).toBe('number');
    expect(typeof res.body.totalReplied).toBe('number');
    expect(typeof res.body.totalMeeting).toBe('number');
    expect(typeof res.body.totalProposal).toBe('number');
    expect(typeof res.body.totalWon).toBe('number');
    expect(typeof res.body.avgQualificationScore).toBe('number');
    expect(typeof res.body.followUpsDueToday).toBe('number');
    expect(typeof res.body.followUpsOverdue).toBe('number');
  });

  it('POST /api/leads/score should compute transparent deterministic qualification score', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .send({
        websiteUxScore: 4,
        mobileExperienceScore: 3,
        performanceScore: 3,
        visualQualityScore: 5,
        ctaClarityScore: 2,
        conversionClarityScore: 3,
        serviceFit: 'HIGH',
        identifiedIssues: ['Mobile checkout lag 5.2s', 'CTA below fold'],
      });

    expect(res.status).toBe(200);
    expect(typeof res.body.qualificationScore).toBe('number');
    expect(res.body.qualificationScore).toBeGreaterThan(60);
    expect(res.body.qualificationBreakdown).toBeDefined();
    expect(res.body.qualificationBreakdown.serviceFit).toBe('HIGH');
    expect(res.body.qualificationBreakdown.reasons).toContain('Poor mobile responsiveness detected');
    expect(res.body.qualificationBreakdown.reasons).toContain('Call-to-action is unclear or buried below fold');
    expect(res.body.qualificationBreakdown.reasons).toContain('Mobile checkout lag 5.2s');
  });

  it('GET /api/leads should return list of leads with filtering and search', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Filter by status
    const resStatus = await request(app).get('/api/leads?status=QUALIFIED');
    expect(resStatus.status).toBe(200);
    resStatus.body.forEach((l: any) => {
      expect(l.status).toBe('QUALIFIED');
    });

    // Search
    const resSearch = await request(app).get('/api/leads?search=Nordic');
    expect(resSearch.status).toBe(200);
    expect(resSearch.body.length).toBeGreaterThan(0);
    expect(resSearch.body[0].company).toContain('Nordic');
  });

  it('GET /api/leads with pagination should return structured paginated response', async () => {
    const res = await request(app).get('/api/leads?page=1&limit=3');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(3);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(3);
  });

  it('POST /api/leads should create a new prospect with audit scoring', async () => {
    const payload = {
      company: 'Test Growth Ventures (TEST)',
      website: 'https://testgrowthventures.io',
      industry: 'Venture Capital / FinTech',
      location: 'New York, NY',
      contactName: 'Alex Morgan',
      contactRole: 'Managing Partner',
      linkedinUrl: 'https://www.linkedin.com/in/alexmorgan-test',
      problem: 'Portfolio grid has heavy layout shifts and lacks fast company search.',
      opportunity: 'React dashboard overhaul with instant search and responsive mobile filters.',
      qualificationScore: 76,
      status: LeadStatus.DISCOVERED,
      notes: 'Initial outreach planned for Q2 portfolio revamp.',
    };

    const res = await request(app)
      .post('/api/leads')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.company).toBe(payload.company);
    expect(res.body.qualificationScore).toBe(76);
    expect(res.body.status).toBe(LeadStatus.DISCOVERED);

    createdLeadId = res.body.id;
  });

  it('POST /api/leads should reject invalid payload missing required fields', async () => {
    const invalidPayload = {
      company: '',
      website: 'invalid-url',
      problem: '',
    };

    const res = await request(app)
      .post('/api/leads')
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('GET /api/leads/:id should retrieve lead with interactions history', async () => {
    const res = await request(app).get(`/api/leads/${createdLeadId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdLeadId);
    expect(res.body.company).toBe('Test Growth Ventures (TEST)');
    expect(Array.isArray(res.body.interactions)).toBe(true);
  });

  it('GET /api/leads/:id should return 404 for non-existent lead ID', async () => {
    const res = await request(app).get('/api/leads/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/leads/:id should update lead fields', async () => {
    const res = await request(app)
      .patch(`/api/leads/${createdLeadId}`)
      .send({
        notes: 'Updated note: Client is reviewing tech stack requirements.',
        contactRole: 'Senior Managing Partner',
      });

    expect(res.status).toBe(200);
    expect(res.body.notes).toContain('Updated note');
    expect(res.body.contactRole).toBe('Senior Managing Partner');
  });

  it('PATCH /api/leads/:id/status should strictly validate and enforce state machine transitions', async () => {
    // 1. Create a clean lead in DISCOVERED
    const createRes = await request(app)
      .post('/api/leads')
      .send({
        company: 'State Machine Test Lead',
        website: 'https://statemachinetest.com',
        industry: 'Testing',
        problem: 'Test problem',
        opportunity: 'Test opportunity',
        status: LeadStatus.DISCOVERED,
      });
    testLeadForTransitionId = createRes.body.id;

    // 2. DISCOVERED -> QUALIFIED (Valid transition)
    const validRes1 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.QUALIFIED });
    expect(validRes1.status).toBe(200);
    expect(validRes1.body.status).toBe(LeadStatus.QUALIFIED);

    // 3. QUALIFIED -> WON (Invalid transition: cannot jump directly from QUALIFIED to WON)
    const invalidRes1 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.WON });
    expect(invalidRes1.status).toBe(400);
    expect(invalidRes1.body.error).toBe('Invalid Transition');
    expect(invalidRes1.body.allowedTransitions).toBeDefined();

    // 4. QUALIFIED -> OUTREACH_DRAFT -> CONTACTED -> REPLIED -> MEETING -> PROPOSAL -> WON (Valid sequence)
    const step1 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.OUTREACH_DRAFT });
    expect(step1.status).toBe(200);

    const step2 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.CONTACTED });
    expect(step2.status).toBe(200);

    const step3 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.REPLIED });
    expect(step3.status).toBe(200);

    const step4 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.MEETING });
    expect(step4.status).toBe(200);

    const step5 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.PROPOSAL });
    expect(step5.status).toBe(200);

    const step6 = await request(app)
      .patch(`/api/leads/${testLeadForTransitionId}/status`)
      .send({ status: LeadStatus.WON });
    expect(step6.status).toBe(200);
    expect(step6.body.status).toBe(LeadStatus.WON);
  });

  it('PATCH /api/leads/:id/follow-up should schedule follow-up date and log optional note', async () => {
    const followUpDate = new Date(Date.now() + 3 * 86400000).toISOString();

    const res = await request(app)
      .patch(`/api/leads/${createdLeadId}/follow-up`)
      .send({
        nextFollowUpAt: followUpDate,
        note: 'Check in on portfolio redesign proposal decision',
      });

    expect(res.status).toBe(200);
    expect(res.body.nextFollowUpAt).toBeDefined();

    // Verify interaction was logged
    const interactionsRes = await request(app).get(`/api/leads/${createdLeadId}/interactions`);
    expect(interactionsRes.status).toBe(200);
    const hasFollowUpNote = interactionsRes.body.some((i: any) => i.note.includes('Check in on portfolio'));
    expect(hasFollowUpNote).toBe(true);
  });

  it('POST /api/leads/:id/generate-outreach should generate grounded AI outreach drafts and variants', async () => {
    const res = await request(app)
      .post(`/api/leads/${createdLeadId}/generate-outreach`)
      .send({ variantType: LeadOutreachVariantType.DETAILED });

    expect(res.status).toBe(200);
    expect(res.body.draft).toBeDefined();
    expect(res.body.draft.length).toBeGreaterThan(20);
    expect(res.body.breakdown).toBeDefined();
    expect(Array.isArray(res.body.personalizationBasis)).toBe(true);
    expect(res.body.personalizationBasis.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.variants)).toBe(true);
    expect(res.body.variants.length).toBe(3); // CONNECTION, SHORT, DETAILED
    expect(res.body.guidance).toContain('Human review required');

    // Lead draft should be updated in DB
    const updatedLead = await request(app).get(`/api/leads/${createdLeadId}`);
    expect(updatedLead.body.outreachDraft).toBeDefined();
  });

  it('POST /api/leads/:id/interactions should log manual interactions and update lastInteractionAt', async () => {
    const res = await request(app)
      .post(`/api/leads/${createdLeadId}/interactions`)
      .send({
        type: LeadInteractionType.LINKEDIN_MANUAL,
        note: 'Manually sent personalized connection message with portfolio audit highlights.',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.type).toBe(LeadInteractionType.LINKEDIN_MANUAL);
    expect(res.body.note).toContain('Manually sent');

    createdInteractionId = res.body.id;

    // Check lead lastInteractionAt
    const leadRes = await request(app).get(`/api/leads/${createdLeadId}`);
    expect(leadRes.body.lastInteractionAt).toBeDefined();
  });

  it('DELETE /api/leads/:id/interactions/:interactionId should delete single interaction', async () => {
    const res = await request(app).delete(`/api/leads/${createdLeadId}/interactions/${createdInteractionId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdInteractionId);

    // Verify interaction deleted
    const listRes = await request(app).get(`/api/leads/${createdLeadId}/interactions`);
    const exists = listRes.body.some((i: any) => i.id === createdInteractionId);
    expect(exists).toBe(false);
  });

  it('DELETE /api/leads/:id should delete lead and cascaded relations', async () => {
    const res = await request(app).delete(`/api/leads/${createdLeadId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdLeadId);

    // Verify lead not found
    const getRes = await request(app).get(`/api/leads/${createdLeadId}`);
    expect(getRes.status).toBe(404);

    // Clean up test transition lead
    if (testLeadForTransitionId) {
      await request(app).delete(`/api/leads/${testLeadForTransitionId}`);
    }
  });
});
