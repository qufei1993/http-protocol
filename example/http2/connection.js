const http = require('http');
const fs = require('fs');
const port = 30100;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    const html = fs.readFileSync('./connection.html', 'utf-8');
    const img = fs.readFileSync('./test_img.jpg');

    if (request.url === '/') {
        response.writeHead(200, {
            'Content-Type': 'text/html',
            'Connection': 'close',
            'Link': '</test.jpg>; as=image; rel=preload',
        });

        response.end(html);
    } else {
        response.writeHead(200, {
            'Content-Type': 'image/jpg'
        });

        response.end(img);
    }
}).listen(port);

console.log('server listening on port ', port);