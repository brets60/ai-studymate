import https from 'node:https';
import http from 'node:http';

const urls = [
  'http://localhost:3000/login',
  'https://a9d083feaffb3b.lhr.life/login',
  'https://1df0ba52c8ae51.lhr.life/login',
  'https://apparatus-pregnancy-efficient-markets.trycloudflare.com/login',
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 7000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ url, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'TIMEOUT' });
    });
  });
}

const results = await Promise.all(urls.map(checkUrl));
console.log(JSON.stringify(results, null, 2));
