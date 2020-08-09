const http = require('http');
const port = 3011;

http.createServer((request, response) => {
    // if (request.method === 'OPTIONS') {
    //     console.log(request.url, request.method);
    //     response.writeHead(200, {
    //         'Access-Control-Allow-Origin': '*',
    //         'Access-Control-Allow-Headers': 'X-Test-Cors',
    //         'Access-Control-Allow-Methods': 'PUT, DELETE',
    //         'Access-Control-Max-Age': '1000',
    //     })
    //     return response.end('3011');
    // }
    // console.log(request.url);

    // if (request.url === '/') {
    //     return response.end('ok!');
    // }   
    console.log(request.url, request.method);
    response.writeHead(200, {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3010',
        'Access-Control-Allow-Headers': 'X-Test-Cors',
        'Access-Control-Allow-Methods': 'PUT, DELETE',
        'Access-Control-Max-Age': '1000',
    });

    response.end('3011');
}).listen(port);

console.log('server listening on port ', port);