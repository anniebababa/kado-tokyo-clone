/**
 * Kado Tokyo — development server
 * Routes:  /         → index.html
 *          /service  → service.html
 * Static:  /css/**   → css/
 *          /js/**    → js/
 *          /images/** → images/
 *
 * Usage:  node server.js          (default port 3000)
 *         PORT=8080 node server.js
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

function serveFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  // Route map: clean URL → file
  const routes = {
    '/':        'index.html',
    '/service': 'service.html',
  };

  if (routes[url]) {
    return serveFile(res, path.join(ROOT, routes[url]));
  }

  // Static file fallback (css, js, images, etc.)
  const filePath = path.join(ROOT, url);
  if (filePath.startsWith(ROOT)) {
    serveFile(res, filePath);
  } else {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
  }
});

server.listen(PORT, () => {
  console.log(`Kado Tokyo is running at http://localhost:${PORT}`);
  console.log('  /         → index.html');
  console.log('  /service  → service.html');
});
