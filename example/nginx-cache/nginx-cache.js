const http = require('http');
const fs = require('fs');
const port = 3010;

const wait = seconds => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, seconds);
    })
}

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('nginx-cache.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
        });

        response.end(html);
    } else if (request.url === '/data') {
        response.writeHead(200, {
            'Cache-Control': 'max-age=20, s-max-age=40',
            'Vary': 'Test-Cache-Val'
        });

        wait(3000).then(() => response.end("success!"));
    }

}).listen(port);

console.log('server listening on port ', port);