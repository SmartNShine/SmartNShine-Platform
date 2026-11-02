import { createServer } from 'node:http';
import { URL } from 'node:url';

/**
 * Factory function to create an HTTP server with a /health endpoint.
 * @param {number} port - The port to listen on (optional if not starting server).
 * @param {string} host - The host to bind to (optional if not starting server).
 * @returns {Object} Server instance with a listen method.
 */
export function createHealthServer() {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;

    if (pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'codity-e2e-health' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  return server;
}

/**
 * Direct execution: starts the server with HOST and PORT env vars.
 * Defaults to 127.0.0.1:3000 for safe loopback binding.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST || '127.0.0.1';
  const port = parseInt(process.env.PORT || '3000', 10);

  const server = createHealthServer();
  server.listen(port, host, () => {
    console.log(`Health server listening on http://${host}:${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });
}
