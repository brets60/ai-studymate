import http from 'node:http';

const postData = JSON.stringify({
  email: 'scholar@studymate.edu',
  password: 'studymate2026'
});

const req = http.request('http://192.168.2.24:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Set-Cookie headers:', res.headers['set-cookie']);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Body:', body));
});

req.on('error', console.error);
req.write(postData);
req.end();
