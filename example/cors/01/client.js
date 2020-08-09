const http = require('http');
const fs = require('fs');
const PORT = 3010;
http.createServer((req, res) => {
  fs.createReadStream('index.html').pipe(res);
}).listen(PORT);
console.log('Server listening on port ', PORT);