const http = require('http');
const PORT = 3011;

http.createServer((req, res) => {
  const { url, method } = req;
  console.log('request url:', url, ', request method:', method);
  res.writeHead(200, {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3010',
    'Access-Control-Allow-Headers': 'Test-CORS, Content-Type',
    'Access-Control-Allow-Methods': 'PUT,DELETE',
    'Access-Control-Max-Age': 1728000
  });
  if (method === 'OPTIONS') {
    return res.end();
  }
  if (method === 'PUT' && url === '/api/data') {
    return res.end('ok!');
  }
  return res.end();
}).listen(PORT);

console.log('Server listening on port ', PORT);
