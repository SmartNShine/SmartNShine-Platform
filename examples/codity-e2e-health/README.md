# Codity E2E Health Fixture

A lightweight, dependency-free Node.js HTTP server for health checks and e2e testing.

## Files

- **`server.mjs`** - HTTP server factory exporting `createHealthServer()`
- **`server.test.mjs`** - Test suite using Node's built-in `node:test` module
- **`Dockerfile`** - Production-ready container image (Node 22, no dependencies)
- **`README.md`** - This documentation

## Running the Fixture

### Direct Execution

Start the server with default loopback binding (127.0.0.1:3000):

```bash
node examples/codity-e2e-health/server.mjs
```

Custom host and port via environment variables:

```bash
HOST=0.0.0.0 PORT=8080 node examples/codity-e2e-health/server.mjs
```

### Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","service":"codity-e2e-health"}
```

### Running Tests

Run the test suite using Node's native test runner:

```bash
node --test examples/codity-e2e-health/server.test.mjs
```

Tests verify:
- Exact HTTP 200 response on `/health`
- Correct JSON payload
- HTTP 404 for non-existent paths
- Reliable server shutdown

## Docker

### Building the Image

```bash
docker build -t codity-e2e-health examples/codity-e2e-health
```

### Running the Container

Bind only to host loopback (safe default):

```bash
docker run --rm -p 127.0.0.1:3000:3000 codity-e2e-health
```

The container:
- Runs on Node 22 slim image
- Binds to `0.0.0.0:3000` internally
- Includes a built-in HTTP health check
- Gracefully handles SIGTERM/SIGINT signals

Test the container:

```bash
curl http://localhost:3000/health
```

## Implementation Notes

- **No dependencies**: Uses only Node built-in modules (`node:http`, `node:url`, `node:test`)
- **Loopback default**: Binds to `127.0.0.1` by default for security
- **Ephemeral ports in tests**: Test suite uses port 0 (OS auto-assignment) for isolation
- **Graceful shutdown**: Respects SIGTERM and SIGINT signals
- **Built-in health check**: Dockerfile includes HTTP health probe
