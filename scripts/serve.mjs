import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.txt':'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    const type = mime[path.extname(file)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) { res.writeHead(416); res.end(); return; }
      const start = Number(match[1]), end = Math.min(Number(match[2] || body.length - 1), body.length - 1);
      if (start > end) { res.writeHead(416); res.end(); return; }
      res.writeHead(206, {'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});
      res.end(body.subarray(start,end+1));
    } else { res.writeHead(200, {'Content-Type':type,'Content-Length':body.length,'Accept-Ranges':'bytes'}); res.end(body); }
  } catch { res.writeHead(404); res.end('Not found'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
