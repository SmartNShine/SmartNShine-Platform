import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHealthServer } from './server.mjs';

test('Health endpoint returns 200 with correct JSON', async (t) => {
  const server = createHealthServer();

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      try {
        const { port } = server.address();
        const url = `http://127.0.0.1:${port}/health`;

        const res = await fetch(url);
        assert.equal(res.status, 200, 'Expected HTTP 200');
        assert.equal(res.headers.get('content-type'), 'application/json', 'Expected JSON content-type');

        const json = await res.json();
        assert.deepEqual(json, { status: 'ok', service: 'codity-e2e-health' }, 'Expected exact health response');

        resolve();
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
});

test('Non-existent paths return 404', async (t) => {
  const server = createHealthServer();

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      try {
        const { port } = server.address();
        const url = `http://127.0.0.1:${port}/notfound`;

        const res = await fetch(url);
        assert.equal(res.status, 404, 'Expected HTTP 404');

        resolve();
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
});

test('Server closes reliably', async (t) => {
  const server = createHealthServer();

  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
});
