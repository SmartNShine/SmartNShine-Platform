import test from 'node:test';
import assert from 'node:assert/strict';
import Portfolio from '../models/Portfolio.model.js';
import PortfolioProject from '../models/PortfolioProject.model.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { updatePortfolio, updatePortfolioProject } from '../controllers/portfolio.controller.js';
import { normalizePortfolioCustomSections } from '../utils/portfolioCustomSections.js';

const oldUrl = 'https://res.cloudinary.com/demo/image/upload/old.png';
const newUrl = 'https://res.cloudinary.com/demo/image/upload/new.png';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

for (const project of [false, true]) {
  for (const fails of [false, true]) {
    test(`${project ? 'project' : 'custom-section'} image cleanup ${fails ? 'preserves assets on failed save' : 'runs after successful save'}`, async t => {
      const calls = [];
      const doc = {
        _id: 'a'.repeat(24),
        images: [{ url: oldUrl }],
        customSections: [{ items: [{ image: oldUrl }] }],
        markModified() {},
        toObject() { return { images: this.images, customSections: this.customSections }; },
        async save() { calls.push('save'); if (fails) throw new Error('database unavailable'); calls.push('saved'); },
      };
      // Each fixture represents only the relevant document's image references.
      if (project) doc.customSections = [];
      else doc.images = [];
      t.mock.method(Portfolio, 'findOne', async () => doc);
      t.mock.method(PortfolioProject, 'findOne', async () => doc);
      t.mock.method(cloudinaryService, 'deleteImage', async url => { calls.push(url); });
      t.mock.method(console, 'error', () => {});
      const req = { user: { userId: 'owner' }, params: { id: doc._id, projectId: 'b'.repeat(24) },
        body: project ? { images: [{ url: newUrl }] } : { customSections: [{ items: [{ image: newUrl }] }] } };
      const res = response();
      await (project ? updatePortfolioProject : updatePortfolio)(req, res);
      assert.equal(res.statusCode, fails ? 500 : 200);
      assert.deepEqual(calls, fails ? ['save'] : ['save', 'saved', oldUrl]);
    });
  }
}

test('custom-section highlights are normalized at persistence', () => {
  const [section] = normalizePortfolioCustomSections([{ items: [{ bullets: ['First point ', '', ' Second point', ''] }] }]);
  assert.deepEqual(section.items[0].bullets, ['First point', 'Second point']);
});

test('completed reports include persisted screen-share status and frames', async t => {
  const { default: InterviewSession } = await import('../models/InterviewSession.model.js');
  const { default: InterviewResult } = await import('../models/InterviewResult.model.js');
  const { completeSession } = await import('../controllers/interview.controller.js');
  // Force the deterministic report fallback; this regression must never call a paid API.
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  t.after(() => { if (previousKey !== undefined) process.env.OPENAI_API_KEY = previousKey; });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'log', () => {});
  const session = {
    _id: 'a'.repeat(24), status: 'in-progress', questions: [], role: 'Engineer',
    proctoringLevel: 'proctored', startedAt: new Date(), async save() {},
    screenShare: { status: 'monitor', required: true, stoppedMsTotal: 1200,
      frames: [{ _id: 'f'.repeat(24), reason: 'periodic', timestampSeconds: 15 }] },
  };
  t.mock.method(InterviewSession, 'findOne', async () => session);
  t.mock.method(InterviewSession, 'findById', () => ({
    then(resolve) { return Promise.resolve(session).then(resolve); },
    select(fields) { return { lean: async () => Object.fromEntries(fields.split(' ').map(key => [key, session[key]])) }; },
  }));
  t.mock.method(InterviewResult, 'findOne', () => ({ then(resolve) { return Promise.resolve(null).then(resolve); }, sort: async () => null }));
  t.mock.method(InterviewResult, 'calculatePercentile', async () => 75);
  t.mock.method(InterviewResult.prototype, 'save', async function () { return this; });
  const res = response();
  await completeSession({ params: { sessionId: session._id }, user: { userId: 'owner' } }, res);
  assert.equal(res.statusCode, 200);
  const share = res.body.data.proctoringAudit.screenShare;
  assert.equal(share.status, 'monitor');
  assert.equal(share.required, true);
  assert.equal(share.stoppedMsTotal, 1200);
  assert.equal(String(share.frames[0].id), 'f'.repeat(24));
});
