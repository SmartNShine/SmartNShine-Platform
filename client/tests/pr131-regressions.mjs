// Run with: node client/tests/pr131-regressions.mjs
// Requires the client's installed esbuild, Playwright, and Chromium browser.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const bundle = await build({
  stdin: {
    resolveDir: new URL('..', import.meta.url).pathname,
    loader: 'jsx',
    contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { useInterviewTurnFlow } from './src/components/interview/hooks/useInterviewTurnFlow.js';
      import { checkInterviewEnvironment } from './src/components/interview/hooks/useEnvironmentGuard.js';
      import ProjectCoverImageField from './src/components/portfolio/editor/ProjectCoverImageField.jsx';
      import CustomSectionsPanel from './src/components/portfolio/editor/CustomSectionsPanel.jsx';
      window.checkEnvironment = checkInterviewEnvironment;
      let root;
      window.options = { enabled: true, frozen: false, interviewPhase: 'speaking', turnKey: 'q1', answerLimitSec: 60,
        isRecording: false, hasRecordingDraft: false,
        startRecording: async () => { window.starts++; return true; }, submitRecording: () => { window.submits++; },
        cancelRecording: () => {}, prepareMic: () => {} };
      window.starts = 0; window.submits = 0; window.deletes = 0;
      function Turn() { window.flow = useInterviewTurnFlow(window.options); return null; }
      window.renderTurn = (updates = {}) => {
        Object.assign(window.options, updates);
        root ||= createRoot(document.getElementById('root'));
        flushSync(() => root.render(<Turn />));
      };
      function Highlights() {
        const [sections, setSections] = useState([{ id: 'section', title: 'Awards', items: [{ id: 'item', title: 'Award', bullets: [] }] }]);
        return <CustomSectionsPanel sections={sections} onUpdateSection={(i, updates) => setSections(items => items.map((item, idx) => idx === i ? {...item, ...updates} : item))} />;
      }
      function Cover() {
        const [images, setImages] = useState([{url: 'https://res.cloudinary.com/demo/image/upload/old.png', isCover: true}]);
        return <ProjectCoverImageField images={images} onChange={setImages} />;
      }
      window.renderCover = () => {
        root.unmount(); root = createRoot(document.getElementById('root'));
        flushSync(() => root.render(<Cover />));
      };
      window.renderHighlights = () => {
        root.unmount(); root = createRoot(document.getElementById('root'));
        flushSync(() => root.render(<Highlights />));
      };
    `,
  },
  bundle: true, write: false, format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  alias: { '@': new URL('../src', import.meta.url).pathname },
  plugins: [{ name: 'mock-portfolio-api', setup(b) {
    b.onResolve({ filter: /portfolio\.api$/ }, () => ({ path: 'portfolio-api', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const portfolioAPI = { uploadImage: async (...args) => { window.uploadArgs = args.length; return { data: { url: "https://example.com/new.png" } }; }, deleteImage: async () => { window.deletes++; } };' }));
  } }],
});
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.clock.install();
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const devices = await page.evaluate(async () => {
    const stream = label => ({ getVideoTracks: () => [{ label, readyState: 'live' }] });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      enumerateDevices: async () => [{kind: 'videoinput', label: 'OBS Virtual Camera'}],
    }});
    return [await checkEnvironment({ cameraStream: stream('FaceTime HD Camera') }),
      await checkEnvironment({ cameraStream: stream('OBS Virtual Camera') })];
  });
  assert.deepEqual(devices[0].virtualDevices, []);
  assert.deepEqual(devices[1].virtualDevices, ['OBS Virtual Camera']);
  console.log('PASS: only selected live devices affect readiness');

  await page.evaluate(() => { renderTurn(); renderTurn({ frozen: true }); renderTurn({ interviewPhase: 'waiting' }); });
  await page.clock.fastForward(30000);
  assert.deepEqual(await page.evaluate(() => ({ stage: flow.stage, paused: flow.isPaused, starts, submits })),
    { stage: 'thinking', paused: true, starts: 0, submits: 0 });
  await page.evaluate(() => renderTurn({ frozen: false }));
  await page.clock.fastForward(15000);
  assert.equal(await page.evaluate(() => starts), 1);
  await page.evaluate(() => renderTurn({ frozen: true }));
  const remaining = await page.evaluate(() => flow.getRemainingMs());
  await page.clock.fastForward(120000);
  assert.equal(await page.evaluate(() => flow.getRemainingMs()), remaining);
  assert.equal(await page.evaluate(() => submits), 0);
  await page.evaluate(() => renderTurn({ frozen: false }));
  await page.clock.fastForward(61000);
  assert.equal(await page.evaluate(() => submits), 1);
  console.log('PASS: dialog before countdown and mid-answer pause/resume');

  await page.evaluate(() => renderHighlights());
  const highlights = page.getByPlaceholder('Key points...');
  await highlights.pressSequentially('Won first place');
  await highlights.press('Enter');
  await highlights.pressSequentially('Team award ');
  assert.equal(await highlights.inputValue(), 'Won first place\nTeam award ');
  console.log('PASS: highlights retain typed spaces and newlines');

  await page.evaluate(() => renderCover());
  await page.getByRole('button', { name: 'Remove' }).click();
  assert.equal(await page.evaluate(() => deletes), 0);
  await page.evaluate(() => renderCover());
  await page.locator('input[type=file]').setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: Buffer.from('fixture') });
  await page.waitForFunction(() => window.uploadArgs !== undefined);
  assert.equal(await page.evaluate(() => uploadArgs), 1, 'replacement upload must not supply the saved URL for deletion');
  assert.equal(await page.evaluate(() => deletes), 0);
  console.log('PASS: remove and replacement preserve saved cover images');
} finally {
  await browser.close();
}
