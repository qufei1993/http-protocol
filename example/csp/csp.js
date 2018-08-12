const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('csp.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
            //'Content-Security-Policy': 'default-src http: https',
        });

        response.end(html);
    }
}).listen(port);

console.log('server listening on port ', port);