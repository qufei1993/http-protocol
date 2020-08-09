const http = require('http');
const PORT = 3011;

http.createServer((req, res) => {
  const url = req.url;
  console.log('request url: ', url);
  if (url === '/api/data') {
    return res.end('ok!');
  }

  if (url === '/script') {
    return res.end('console.log("hello world!");');
  }
}).listen(PORT);

console.log('Server listening on port ', PORT);
