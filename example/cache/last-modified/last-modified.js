const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 3010;

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
        const stat = fs.statSync(filePath); // 获取当前脚本状态
        const mtime = stat.mtime.toGMTString() // 文件的最后修改时间
        const requestMtime = request.headers['if-modified-since']; // 来自浏览器传递的值

        console.log(stat);
        console.log(mtime, requestMtime);

        if (mtime === requestMtime) {
            response.statusCode = 304;
            response.end();
            return;
        }

        console.log('协商缓存 Last-Modified 失效');
        response.writeHead(200, {
            'Content-Type': 'text/javascript',
            'Last-Modified': mtime,
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(response);
    }

}).listen(port);

console.log('server listening on port ', port);