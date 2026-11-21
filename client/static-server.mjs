import {createServer} from "node:http";
import {readFile, stat} from "node:fs/promises";
import {extname, resolve, sep} from "node:path";

const root = resolve("dist");
const types = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/health") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
      revision: process.env.CODITY_DEPLOY_REVISION,
      artifact_digest: process.env.CODITY_ARTIFACT_DIGEST,
    }));
    return;
  }
  let file;
  try {
    const requested = resolve(root, `.${decodeURIComponent(path)}`);
    if (requested !== root && !requested.startsWith(root + sep)) {
      response.writeHead(400).end();
      return;
    }
    file = requested;
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
  } catch {
    if (path.startsWith("/assets/")) {
      response.writeHead(404).end();
      return;
    }
    file = resolve(root, "index.html");
  }
  try {
    const body = await readFile(file);
    response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(8080, "0.0.0.0");
