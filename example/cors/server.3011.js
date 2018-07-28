const http = require('http');
const port = 3011;

http.createServer((request, response) => {
    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Test-Cors',
        //'Access-Control-Allow-Methods': 'PUT, DELETE',
        'Access-Control-Max-Age': '1000',
    })
    response.end('3011');
}).listen(port);

console.log('server listening on port ', port);