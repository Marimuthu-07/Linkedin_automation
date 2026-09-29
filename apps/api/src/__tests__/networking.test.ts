import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ContactCategory, NetworkingStatus, NetworkingMessageType } from '@linkedin-growth/shared';

describe('Networking Pipeline API Integration Tests', () => {
  const app = createApp();
  let createdContactId: string;
  let testContactWithDiscoveredStatusId: string;

  it('GET /api/networking/stats should return descriptive networking metrics', async () => {
    const res = await request(app).get('/api/networking/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalContacts).toBeGreaterThan(0);
    expect(typeof res.body.totalDiscovered).toBe('number');
    expect(typeof res.body.totalReviewing).toBe('number');
    expect(typeof res.body.totalApproved).toBe('number');
    expect(typeof res.body.totalContacted).toBe('number');
    expect(typeof res.body.totalReplied).toBe('number');
    expect(typeof res.body.followUpsDueToday).toBe('number');
    expect(typeof res.body.followUpsOverdue).toBe('number');
  });

  it('GET /api/networking should return paginated contact response structure', async () => {
    const res = await request(app).get('/api/networking?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(typeof res.body.totalPages).toBe('number');
  });

  it('GET /api/networking should filter by status', async () => {
    const res = await request(app).get('/api/networking?status=APPROVED');
    expect(res.status).toBe(200);
    res.body.items.forEach((c: any) => {
      expect(c.status).toBe(NetworkingStatus.APPROVED);
    });
  });

  it('GET /api/networking should filter by category', async () => {
    const res = await request(app).get('/api/networking?category=FOUNDER');
    expect(res.status).toBe(200);
    res.body.items.forEach((c: any) => {
      expect(c.category).toBe(ContactCategory.FOUNDER);
    });
  });

  it('GET /api/networking should search across fields', async () => {
    const res = await request(app).get('/api/networking?search=Rostova');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].name).toContain('Elena');
  });

  it('GET /api/networking should support follow-up filters', async () => {
    const resDueToday = await request(app).get('/api/networking?followUpFilter=due_today');
    expect(resDueToday.status).toBe(200);
    expect(Array.isArray(resDueToday.body.items)).toBe(true);

    const resOverdue = await request(app).get('/api/networking?followUpFilter=overdue');
    expect(resOverdue.status).toBe(200);
    expect(Array.isArray(resOverdue.body.items)).toBe(true);
  });

  it('POST /api/networking should create a complete contact', async () => {
    const newPerson = {
      name: 'Jordan Lee (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-jordan-lee',
      headline: 'Founding Engineer @ VectorStream',
      role: 'Founding Engineer',
      company: 'VectorStream',
      location: 'New York, NY',
      category: ContactCategory.AI_ENGINEER,
      source: 'GitHub AI Library',
      relevanceReason: 'Author of vector index optimization library.',
      notes: 'Open source contributor with high overlap in database indexing.',
    };

    const res = await request(app).post('/api/networking').send(newPerson);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe(newPerson.name);
    expect(res.body.status).toBe(NetworkingStatus.DISCOVERED);
    expect(res.body.category).toBe(ContactCategory.AI_ENGINEER);

    createdContactId = res.body.id;
    testContactWithDiscoveredStatusId = res.body.id;
  });

  it('POST /api/networking should create a minimal contact with name only', async () => {
    const minimal = {
      name: 'Taylor Chen (DEMO)',
    };

    const res = await request(app).post('/api/networking').send(minimal);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Taylor Chen (DEMO)');
    expect(res.body.category).toBe(ContactCategory.OTHER);
    expect(res.body.status).toBe(NetworkingStatus.DISCOVERED);
  });

  it('POST /api/networking should reject invalid input', async () => {
    // Empty name
    const resEmptyName = await request(app).post('/api/networking').send({ name: '' });
    expect(resEmptyName.status).toBe(400);

    // Invalid category
    const resInvalidCat = await request(app).post('/api/networking').send({
      name: 'Valid Name',
      category: 'INVALID_CATEGORY_XYZ',
    });
    expect(resInvalidCat.status).toBe(400);

    // Invalid URL
    const resInvalidUrl = await request(app).post('/api/networking').send({
      name: 'Valid Name',
      linkedinUrl: 'not_a_valid_url',
    });
    expect(resInvalidUrl.status).toBe(400);
  });

  it('GET /api/networking/:id should retrieve contact with message history', async () => {
    const res = await request(app).get(`/api/networking/${createdContactId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdContactId);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('GET /api/networking/:id should return 404 for non-existent id', async () => {
    const res = await request(app).get('/api/networking/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });

  it('PATCH /api/networking/:id/status should strictly validate and enforce transition rules', async () => {
    // Test INVALID transition: DISCOVERED -> CONTACTED (skipping REVIEWING/APPROVED)
    const resInvalid = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.CONTACTED });

    expect(resInvalid.status).toBe(400);
    expect(resInvalid.body.error).toBe('Invalid Status Transition');
    expect(resInvalid.body.currentStatus).toBe(NetworkingStatus.DISCOVERED);
    expect(resInvalid.body.attemptedStatus).toBe(NetworkingStatus.CONTACTED);
    expect(Array.isArray(resInvalid.body.allowedTransitions)).toBe(true);

    // Test VALID transition: DISCOVERED -> REVIEWING
    const resValid1 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.REVIEWING });

    expect(resValid1.status).toBe(200);
    expect(resValid1.body.status).toBe(NetworkingStatus.REVIEWING);

    // Test VALID transition: REVIEWING -> APPROVED
    const resValid2 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.APPROVED });

    expect(resValid2.status).toBe(200);
    expect(resValid2.body.status).toBe(NetworkingStatus.APPROVED);

    // Test VALID transition: APPROVED -> CONTACTED
    const resValid3 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.CONTACTED });

    expect(resValid3.status).toBe(200);
    expect(resValid3.body.status).toBe(NetworkingStatus.CONTACTED);

    // Test VALID transition: CONTACTED -> REPLIED
    const resValid4 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.REPLIED });

    expect(resValid4.status).toBe(200);
    expect(resValid4.body.status).toBe(NetworkingStatus.REPLIED);

    // Test VALID transition: REPLIED -> CONNECTED
    const resValid5 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.CONNECTED });

    expect(resValid5.status).toBe(200);
    expect(resValid5.body.status).toBe(NetworkingStatus.CONNECTED);

    // Test VALID transition: CONNECTED -> ARCHIVED
    const resValid6 = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.ARCHIVED });

    expect(resValid6.status).toBe(200);
    expect(resValid6.body.status).toBe(NetworkingStatus.ARCHIVED);

    // Test INVALID transition: ARCHIVED -> CONTACTED
    const resInvalidArchived = await request(app)
      .patch(`/api/networking/${testContactWithDiscoveredStatusId}/status`)
      .send({ status: NetworkingStatus.CONTACTED });

    expect(resInvalidArchived.status).toBe(400);
    expect(resInvalidArchived.body.error).toBe('Invalid Status Transition');
  });

  it('POST /api/networking/:id/generate-message should generate structured note with provenance', async () => {
    const res = await request(app)
      .post(`/api/networking/${createdContactId}/generate-message`)
      .send({ type: NetworkingMessageType.CONNECTION_REQUEST });

    expect(res.status).toBe(200);
    expect(res.body.draft).toBeDefined();
    expect(typeof res.body.draft).toBe('string');
    expect(Array.isArray(res.body.personalizationBasis)).toBe(true);
    expect(res.body.guidance).toContain('Draft only — review and send manually on LinkedIn');
    expect(res.body.message).toBeDefined();
    expect(res.body.message.status).toBe('DRAFT');
  });

  it('POST and PATCH /api/networking/:id/messages should manage message lifecycle', async () => {
    // Create manual message
    const resCreate = await request(app)
      .post(`/api/networking/${createdContactId}/messages`)
      .send({
        content: 'Hi Jordan, loved your article on vector partitioning.',
        type: NetworkingMessageType.FOLLOW_UP,
        personalizationBasis: ['Role', 'Company'],
        status: 'DRAFT',
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.id).toBeDefined();
    const messageId = resCreate.body.id;

    // Update message status to USED
    const resUpdate = await request(app)
      .patch(`/api/networking/${createdContactId}/messages/${messageId}`)
      .send({
        status: 'USED',
      });

    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.status).toBe('USED');

    // Delete message
    const resDelete = await request(app)
      .delete(`/api/networking/${createdContactId}/messages/${messageId}`);

    expect(resDelete.status).toBe(200);
  });

  it('DELETE /api/networking/:id should delete contact', async () => {
    const res = await request(app).delete(`/api/networking/${createdContactId}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted successfully');

    // Confirm 404
    const resGet = await request(app).get(`/api/networking/${createdContactId}`);
    expect(resGet.status).toBe(404);
  });
});
