# Socket hang up 是什么？

> 心灵纯洁的人，生活充满甜蜜和喜悦。——列夫·托尔斯泰

关于 Socket hang up 最早是在一次服务压测中出现的，后来得到了解决，近期在 Node.js 服务迁移 K8S 容器中时又报出了此问题，核查原因之后发现是对容器的 CPU、内存大小做了限制引起的，这里总结下什么是 Socket hang up 及在什么情况下发生，该如何解决。

**作者简介**：五月君，Nodejs Developer，慕课网认证作者，热爱技术、喜欢分享的 90 后青年，欢迎关注 [Nodejs技术栈](https://nodejsred.oss-cn-shanghai.aliyuncs.com/node_roadmap_wx.jpg?x-oss-process=style/may) 和 Github 开源项目 [https://www.nodejs.red](https://www.nodejs.red)

## 什么是 Socket hang up

> 这里也可以做为面试题目来提问，什么是 Socket hang up？

hang up 翻译为英文有挂断的意思, socket hang up 也可以理解为 socket（链接）被挂断。无论使用哪种语言，也许多多少少应该都会遇见过，只是不知道你有没有去思考这是为什么？例如在 Node.js 中系统提供的 http server 默认超时为 2 两分钟（server.timeout 可以查看），如果一个请求超出这个时间，http server 会关闭这个请求链接，当客户端想要返回一个请求的时候发现这个 socket 已经被 “挂断”，就会报 socket hang up 错误。

弄懂一个问题，还是要多去实践，下面从一个小的 demo 复现这个问题然后结合 Node.js http 相关源码进一步了解 Socket hang up 是什么？另外也推荐你看下万能的 stack overflow 上面也有对这个问题的讨论 [stackoverflow.com/questions/16995184/nodejs-what-does-socket-hang-up-actually-mean](https://stackoverflow.com/questions/16995184/nodejs-what-does-socket-hang-up-actually-mean)。

## 复现 Socket hang up

**服务端**

开启一个 http 服务，定义 /timeout 接口设置 3 秒之后延迟响应

```js
const http = require('http');
const port = 3020;

const server = http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/timeout') {
        setTimeout(function() {
            response.end('OK!');
        }, 1000 * 60 * 3)
    }
}).listen(port);

console.log('server listening on port ', port);
```

**客户端**

```js
const http = require('http');
const opts = {
  hostname: '127.0.0.1',
  port: 3020,
  path: '/timeout',
  method: 'GET',
};

http.get(opts, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      console.log(rawData);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', err => {
  console.error(err);
});
```

启动服务端之后再启动客户端大约 2 两分钟之后或者直接 kill 掉服务端会报如下错误，可以看到相应的错误堆栈

```bash
Error: socket hang up
    at connResetException (internal/errors.js:570:14)
    at Socket.socketOnEnd (_http_client.js:440:23)
    at Socket.emit (events.js:215:7)
    at endReadableNT (_stream_readable.js:1183:12)
    at processTicksAndRejections (internal/process/task_queues.js:80:21) {
  code: 'ECONNRESET'
}
```

为什么在 http client 这一端会报 socket hang up 这个错误，看下 Node.js http client 端源码会发现由于没有得到响应，那么就认为这个 socket 已经结束，因此会在 L440 处触发一个 connResetException('socket hang up') 错误。

```js
// https://github.com/nodejs/node/blob/v12.x/lib/_http_client.js#L440

function socketOnEnd() {
  const socket = this;
  const req = this._httpMessage;
  const parser = this.parser;

  if (!req.res && !req.socket._hadError) {
    // If we don't have a response then we know that the socket
    // ended prematurely and we need to emit an error on the request.
    req.socket._hadError = true;
    req.emit('error', connResetException('socket hang up'));
  }
  if (parser) {
    parser.finish();
    freeParser(parser, req, socket);
  }
  socket.destroy();
}
```

## Socket hang up 解决

**1. 设置 http server socket 超时时间**

看以下 Node.js http server 源码，默认情况下服务器的超时值为 2 分钟，如果超时，socket 会自动销毁，可以通过调用 server.setTimeout(msecs) 方法将超时时间调节大一些，如果传入 0 将关闭超时机制

```js
// https://github.com/nodejs/node/blob/v12.x/lib/_http_server.js#L348
function Server(options, requestListener) {
  // ...

  this.timeout = kDefaultHttpServerTimeout; // 默认为 2 * 60 * 1000
  this.keepAliveTimeout = 5000;
  this.maxHeadersCount = null;
  this.headersTimeout = 40 * 1000; // 40 seconds
}
Object.setPrototypeOf(Server.prototype, net.Server.prototype);
Object.setPrototypeOf(Server, net.Server);


Server.prototype.setTimeout = function setTimeout(msecs, callback) {
  this.timeout = msecs;
  if (callback)
    this.on('timeout', callback);
  return this;
};
```

修改后的代码如下所示：

```js
const server = http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/timeout') {
        setTimeout(function() {
            response.end('OK!');
        }, 1000 * 60 * 3)
    }
}).listen(port);

server.setTimeout(0); // 设置超时时间
```

如果不设置 setTimeout 也可以针对这种错误在 http client 端进行捕获放入队列发起重试，当这种错误概率很大的时候要去排查相应的服务是否存在处理很慢等异常问题。

## ECONNRESET VS ETIMEDOUT

> 这里注意区分下 ECONNRESET 与 ETIMEDOUT 的区别

**ECONNRESET 为读取超时**，当服务器太慢无法正常响应时就会发生 {"code":"ECONNRESET"} 错误，例如上面介绍的 socket hang up 例子。

**ETIMEDOUT 为链接超时**，是指的在客户端与远程服务器建立链接发生的超时，下面给一个 request 模块的请求例子。

```js
const request = require('request');

request({
  url: 'http://127.0.0.1:3020/timeout',
  timeout: 5000,
}, (err, response, body) => {
  console.log(err, body);
});
```

以上示例，大约持续 5 秒中之后会报 { code: 'ETIMEDOUT' } 错误，堆栈如下：

```bash
Error: ETIMEDOUT
    at Timeout._onTimeout (/Users/test/node_modules/request/request.js:677:15)
    at listOnTimeout (internal/timers.js:531:17)
    at processTimers (internal/timers.js:475:7) {
  code: 'ETIMEDOUT'
}
```