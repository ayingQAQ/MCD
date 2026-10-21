import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    // Only declared product pages fall back to the SPA. Missing assets remain 404.
    const spaRoutes = new Set(['/', '/galaxy', '/atlas', '/lab', '/quests']);
    const target = resolve(root, `.${spaRoutes.has(pathname.replace(/\/$/, '') || '/') ? '/index.html' : pathname}`);
    if (!target.startsWith(root + sep) || !(await stat(target)).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(await readFile(target));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(4173, '127.0.0.1', () => console.log('McCosmos: http://127.0.0.1:4173 · Ctrl+C to stop'));
