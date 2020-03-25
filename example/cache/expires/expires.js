const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('expires.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
        });

        response.end(html);
    } else if (request.url === '/script.js') {
        response.writeHead(200, {
            'Content-Type': 'text/javascript',
            'Expires': new Date('2020-03-25 11:19:00'),
        });

        response.end("console.log('script load !!!')");
    }

}).listen(port);

console.log('server listening on port ', port);