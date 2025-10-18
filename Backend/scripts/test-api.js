const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('Products count:', parsed.products ? parsed.products.length : 0);
      } catch (e) {
        console.log('Could not parse JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

testAPI();
