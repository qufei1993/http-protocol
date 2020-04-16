# 跨域（CORS）产生的原因分析与解决方案

关于浏览器跨域的原理，一个请求在浏览器端发送出去后，是会收到返回值响应的，只不过浏览器在解析这个请求的响应之后，发现不属于浏览器的同源策略(地址里面的协议、域名和端口号均相同)，会进行拦截。

如果是在 curl 里面发送一个请求，都是没有跨域这样一个概念的。

## 示例分析

**server.html**

在这个 html 里面采用 ajax 请求 3011 这个服务

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>cors</title>
    </head>
    <body>
        <script>
            const xhr = new XMLHttpRequest();

            xhr.open('GET', 'http://127.0.0.1:3011/');
            xhr.send();
        </script>
    </body>
</html>
```

**server.3011.js**

```js
const http = require('http');
const port = 3011;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    response.end('3011 port serve for you');
}).listen(port);

console.log('server listening on port ', port);
```

**server.3010.js**

对上面定义的 server.html 模版进行渲染，从而在该模版里调用 3011 这个端口服务

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    const html = fs.readFileSync('server.html', 'utf-8');
    
    response.writeHead(200, {
        'Content-Type': 'text/html',
    });
    response.end(html);

}).listen(port);

console.log('server listening on port ', port);
```

打开浏览器，地址栏输入 http://127.0.0.1:3010/ 会看到以下提示

```bash
Failed to load http://127.0.0.1:3011/: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://127.0.0.1:3010' is therefore not allowed access.
```

但是 server.3011.js 服务端会打印出如下信息： 

```
request url:  /
```

说明浏览器在发送这个请求的时候并不知道服务是不是跨域的，还是会发送请求并接收服务端返回的内容，但是当浏览器接收到响应后在 headers 里面没有看到 ``` Access-Control-Allow-Origin: ``` 被设置为允许，会把这个请求返回的内容给忽略掉，并且在命令行报 not allowed access 错误。

## 基于 HTTP 协议层面的几种解决办法

### 1. 设置 Access-Control-Allow-Origin

1.1 设置为 '*' 表示可以接收任意域名的访问

```js
http.createServer((request, response) => {
    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    })
}).listen(port);
```

1.2 * 也可以设置为特定域名访问

```js
http.createServer((request, response) => {
    response.writeHead(200, {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3010/'
    })
}).listen(port);
```

1.3 如果有多个域名访问可以在服务端动态设置

```js
http.createServer((request, response) => {
    const origin = request.headers.origin;

    if ([
        'http://127.0.0.1:3010'
    ].indexOf(origin) !== -1) {
        response.writeHead(200, {
            'Access-Control-Allow-Origin': origin,
        })
    }
}).listen(port);
```

### 2. jsonp

浏览器是允许像 link、img、script 标签在路径上加载一些内容进行请求，是允许跨域的，那么 jsonp 的实现原理就是在 script 标签里面加载了一个链接，去访问服务器的某个请求，返回内容。

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>cors</title>
    </head>
    <body>
        <!-- <script>
            const xhr = new XMLHttpRequest();

            xhr.open('GET', 'http://127.0.0.1:3011/');
            xhr.send();
        </script> -->

        <script src="http://127.0.0.1:3011/"></script>
    </body>
</html>
```

**jsonp 实现原理**

```
// todo
```

## CORS 预请求

预请求也是浏览器的一种安全机制，会先发送一个 OPTIONS 请求给目的站点，与跨域服务器协商可以设置的头部信息，允许的方法和 headers 信息等。

1. Access-Control-Allow-Origin: 跨域服务器允许的来源地址（跟请求的 Origin 进行匹配），可以是 * 或者某个确切的地址，不允许多个地址
2. Access-Control-Allow-Methods: 允许的方法 GET、HEAD、POST
3. Access-Control-Allow-Headers: 允许的 Content-Type
    3.1 text/plain
    3.2 multipart/form-data
    3.3 application/x-www-form-urlencoded
    3.4 ...
4. Access-Control-Max-Age: 预请求的返回结果 Access-Control-Allow-Methods 和 Access-Control-Allow-Headers 可以被缓存的时间，单位秒
5. 请求头限制
6. XMLHttpRequestUpload 对象均没有注册任何事件监听器
7. 请求中没有使用 ReadableStream 对象

### 预请求示例

**修改 server.html**

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>cors</title>
    </head>
    <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.4/fetch.min.js"></script>
        <script>
           fetch('http://127.0.0.1:3011/', {
               method: 'PUT',
               headers: {
                   'X-Test-Cors': 'test'
               }
           })
        </script>
    </body>
</html>
```

在次运行后浏览器提示如下信息,上面自定义的头 X-Test-Cors 在跨域请求的时候是不被允许的.

```bash
Failed to load http://127.0.0.1:3011/: Request header field X-Test-Cors is not allowed by Access-Control-Allow-Headers in preflight response.
```

```bash
Failed to load http://127.0.0.1:3011/: Method PUT is not allowed by Access-Control-Allow-Methods in preflight response.
```

修改后端服务 server.3011.js 处理 OPTIONS 请求，设置相应的跨域响应头

```js
const http = require('http');
const port = 3011;

http.createServer((request, response) => {
    response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Test-Cors',
        'Access-Control-Allow-Methods': 'PUT, DELETE',
        'Access-Control-Max-Age': '1000',
    })
    response.end('3011');
}).listen(port);

console.log('server listening on port ', port);
```

**运行结果**

第一次先发送了一个 OPTIONS 请求询问

![](./img/cors/cors2018072801.jpeg)

第二次发送一个 PUT 数据请求

![](./img/cors/cors2018072802.png)