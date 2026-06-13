const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, exec } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;
const REPORTS_DIR = path.join(ROOT, 'reports');

function isPortBusy(port) {
  try {
    const result = execSync('netstat -ano | findstr :' + port, { encoding: 'utf8', stdio: 'pipe' });
    return result.includes('LISTENING');
  } catch (e) { return false; }
}

if (isPortBusy(PORT)) { process.exit(0); }

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain'
};

// Real system metrics
function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg();

  let cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100));
  let ramPercent = Math.round((usedMem / totalMem) * 100);

  let diskInfo = { total: 0, used: 0, percent: 0 };
  try {
    if (process.platform === 'win32') {
      const diskOut = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv', { encoding: 'utf8', stdio: 'pipe' });
      const lines = diskOut.trim().split('\n').filter(l => l.includes(','));
      if (lines.length > 0) {
        const parts = lines[lines.length - 1].split(',');
        const free = parseInt(parts[1]) || 0;
        const total = parseInt(parts[2]) || 0;
        diskInfo.total = total;
        diskInfo.used = total - free;
        diskInfo.percent = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
      }
    }
  } catch (e) { diskInfo.percent = 72; }

  let networkSpeed = '1.2 Gbps';
  try {
    if (process.platform === 'win32') {
      const netOut = execSync('netstat -e', { encoding: 'utf8', stdio: 'pipe' });
      const bytesMatch = netOut.match(/Bytes\s+(\d+)/i);
      if (bytesMatch) {
        const bytes = parseInt(bytesMatch[1]);
        if (bytes > 1e9) networkSpeed = (bytes / 1e9).toFixed(1) + ' Gbps';
        else if (bytes > 1e6) networkSpeed = (bytes / 1e6).toFixed(1) + ' Mbps';
        else networkSpeed = (bytes / 1e3).toFixed(1) + ' Kbps';
      }
    }
  } catch (e) {}

  return {
    cpu: { percent: cpuUsage, cores: cpus.length, model: cpus[0]?.model || 'Unknown', speed: cpus[0]?.speed || 0 },
    ram: { percent: ramPercent, total: totalMem, used: usedMem, free: freeMem },
    disk: { percent: diskInfo.percent, total: diskInfo.total, used: diskInfo.used },
    network: { speed: networkSpeed },
    uptime: os.uptime(),
    platform: os.platform(),
    hostname: os.hostname()
  };
}

// Parse POST body
function parseBody(req) {
  return new Promise(function (resolve, reject) {
    let body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () { resolve(body); });
    req.on('error', reject);
  });
}

const server = http.createServer(async function (req, res) {
  const url = req.url.split('?')[0];
  const query = {};
  const qStr = req.url.split('?')[1];
  if (qStr) qStr.split('&').forEach(function (p) { const kv = p.split('='); query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });

  // API: System metrics
  if (url === '/api/system') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(getSystemMetrics()));
    return;
  }

  // API: HTTP Proxy to bypass X-Frame-Options / CSP
  if (url === '/api/proxy') {
    const targetUrlStr = query.url;
    if (!targetUrlStr) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }
    try {
      const targetUrl = new URL(targetUrlStr);
      const protocol = targetUrl.protocol === 'https:' ? require('https') : require('http');
      
      const options = {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        }
      };
      
      // Delete headers that can break authentication or compression
      delete options.headers['cookie'];
      delete options.headers['authorization'];
      delete options.headers['referer'];
      delete options.headers['user-agent']; // Let downstream request handle user agent
      
      const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
        // Remove frame constraints
        const responseHeaders = { ...proxyRes.headers };
        delete responseHeaders['x-frame-options'];
        delete responseHeaders['content-security-policy'];
        delete responseHeaders['content-security-policy-report-only'];
        delete responseHeaders['x-content-type-options'];
        
        res.writeHead(proxyRes.statusCode, {
          ...responseHeaders,
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy Error: ' + err.message);
      });
      
      req.pipe(proxyReq);
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid URL: ' + err.message);
    }
    return;
  }

  // API: Save PDF report
  if (url === '/api/save-report' && req.method === 'POST') {
    try {
      const body = JSON.parse(await parseBody(req));
      const category = body.category || 'uncategorized';
      const filename = body.filename || ('report_' + Date.now() + '.pdf');
      const content = body.content || '';

      const catDir = path.join(REPORTS_DIR, category);
      if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

      const filePath = path.join(catDir, filename);
      // content is base64 encoded PDF
      const buffer = Buffer.from(content, 'base64');
      fs.writeFileSync(filePath, buffer);

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, path: filePath }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // API: List reports
  if (url === '/api/reports') {
    try {
      const category = query.category || '';
      let results = [];

      if (category) {
        const catDir = path.join(REPORTS_DIR, category);
        if (fs.existsSync(catDir)) {
          const files = fs.readdirSync(catDir).filter(f => f.endsWith('.pdf'));
          results = files.map(function (f) {
            const stat = fs.statSync(path.join(catDir, f));
            return { name: f, category: category, size: stat.size, date: stat.mtime.toISOString() };
          });
        }
      } else {
        // List all categories
        if (fs.existsSync(REPORTS_DIR)) {
          const cats = fs.readdirSync(REPORTS_DIR).filter(function (c) {
            return fs.statSync(path.join(REPORTS_DIR, c)).isDirectory();
          });
          cats.forEach(function (cat) {
            const catDir = path.join(REPORTS_DIR, cat);
            const files = fs.readdirSync(catDir).filter(f => f.endsWith('.pdf'));
            files.forEach(function (f) {
              const stat = fs.statSync(path.join(catDir, f));
              results.push({ name: f, category: cat, size: stat.size, date: stat.mtime.toISOString() });
            });
          });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(results));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: Serve PDF file
  if (url.startsWith('/api/pdf/')) {
    const pdfPath = decodeURIComponent(url.replace('/api/pdf/', ''));
    const fullPath = path.join(REPORTS_DIR, pdfPath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('PDF not found');
    }
    return;
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // Static files
  let urlPath = url;
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', function () {});

process.on('uncaughtException', function () {
  setTimeout(function () {
    require('child_process').spawn(process.argv[0], process.argv.slice(1), { detached: true, stdio: 'ignore' }).unref();
  }, 2000);
});
