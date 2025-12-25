const fetch = require('node-fetch'); // Next.js env might not have fetch in node context depending on version, but let's try or use http
const http = require('http');

const data = JSON.stringify({
    name: 'Test Agent',
    email: 'agent@test.com'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/create-order',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
