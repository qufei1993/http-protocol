const http = require('http');
const PORT = 3011;
const corsMiddleware = require('cors')({
  origin: 'http://127.0.0.1:3010',
  methods: 'PUT,DELETE',
  allowedHeaders: 'Test-CORS, Content-Type',
  maxAge: 1728000,
  credentials: true,
});

http.createServer((req, res) => {
  const { url, method } = req;
  console.log('request url:', url, ', request method:', method);
  
  const nextFn = () => {
    if (method === 'PUT' && url === '/api/data') {
      return res.end('ok!');
    }
    return res.end();
  }
  corsMiddleware(req, res, nextFn);
}).listen(PORT);

console.log('Server listening on port ', PORT);
