const http = require('http');
const PORT = 30011;

http.createServer((req, res) => {
  const { url, method } = req;
  console.log('request url:', url, ', request method:', method);
  
  if (method === 'PUT' && url === '/api/data') {
    return res.end('ok!');
  }
  return res.end('Not Fount');
}).listen(PORT);

console.log('Server listening on port ', PORT);
