const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3010;
const crypto = require('crypto');
const md5 = buffer => {
    return crypto.createHash('md5').update(buffer).digest('hex')
};

http.createServer((request, response) => {
    if (request.url === '/favicon.ico') return response.end();
    console.log('request url: ', request.url);
    if (request.url === '/') {
        const html = fs.readFileSync('index.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
        });

        response.end(html);
    } else if (request.url === '/script.js') {
        const filePath = path.join(__dirname, request.url); // 拼接当前脚本文件地址
        const buffer = fs.readFileSync(filePath); // 获取当前脚本状态
        const fileMd5 = md5(buffer);
        console.log(request.headers)
        console.log(fileMd5);
        const noneMatch = request.headers['if-none-match']; // 来自浏览器传递的值

        console.log(noneMatch);

        if (noneMatch === fileMd5) {
            response.statusCode = 304;
            response.end();
            return;
        }

        console.log('Etag 缓存失效');
        response.writeHead(200, {
            'Content-Type': 'text/javascript',
            'Cache-Control': 'max-age=0',
            'ETag': fileMd5,
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(response);
    }

}).listen(port);

console.log('server listening on port ', port);