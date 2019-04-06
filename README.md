# HTTP协议原理实践

> http请求和tcp链接不是一个概念，在一个tcp链接里，可以发送多个http请求，之前的协议版本是不可以这么做的，从http/1.1里面就可以这样做了，tcp链接对应的是多个http请求，而一个http请求肯定是在某个tcp链接里面进行发送的。

## 快速导航

- **5层网络模型介绍** [[more]](#5层网络模型介绍)
    * `[TCP/IP]` [应用层 ](#应用层)
    * `[TCP/IP]` [传输层 ](#传输层)
    * `[TCP/IP]` [网络层 ](#网络层)
    * `[TCP/IP]` [数据链路层 ](#数据链路层)
    * `[TCP/IP]` [物理层 ](#物理层)

- **HTTP协议发展历史** [[more]](#http协议发展历史)
    * `[HTTP协议]` [http/0.9](#阶段一)
    * `[HTTP协议]` [http/1.0](#阶段二)
    * `[HTTP协议]` [http/1.1](阶段三)
    * `[HTTP协议]` [http/2](#阶段四)

- **http三次握手** [[more]](#http三次握手)
    * `[HTTP三次握手]` [三次握手时序图](#三次握手时序图)
    * `[HTTP三次握手]` [三次握手数据包详细内容分析](#三次握手数据包详细内容分析)
    * `[HTTP三次握手]` [分析总结](#总结)
    * `[面试]` `说下TCP三次握手的过程?`，参考：[三次握手时序图](#三次握手时序图)

- **URI/URL/URN**

- **跨域CORS** [[more]](#跨域cors)
    * `[CORS]` [跨域形成原理简介](#跨域cors)
    * `[CORS]` [实例来验证跨域的产生过程](#示例)
    * `[CORS]` [基于http协议层面的几种解决办法](#基于http协议层面的几种解决办法)
    * `[CORS]` [CORS预请求](#cors预请求)
    * `[面试]` `你之前遇见过跨域吗？说一下跨域的形成与实现。`，参考：[CORS](#跨域cors)

- **缓存头Cache-Control的含义和使用**
    * `[Cache-Control]` [可缓存性（public、private、no-cache）](#可缓存性)
    * `[Cache-Control]` [到期 （max-age、s-maxage、max-stale）](#到期)
    * `[Cache-Control]` [重新验证 （must-revalidate、proxy-revalidate）](#重新验证)
    * `[Cache-Control]` [其它 （no-store、no-transform）](#其它)
    * `[Cache-Control]` [缓存cache-control示例](#缓存cache-control示例)

    1. `[思考]` `在页面中引入静态资源文件，为什么静态资源文件改变后，再次发起请求还是之前的内容，没有变化呢？`，参考：[#](#缓存cache-control示例)
    2. `[思考]` `在使用webpack等一些打包工具时，为什么要加上一串hash码？`，参考：[#](#缓存cache-control示例)

- **Cookie**
    * `[Cookie]` [cookie属性（max-age、Secure、httpOnly）](#cookie属性)
    * `[Cookie]` [cookie的domain设置](#cookie的domain设置)
    * `[Cookie]` [实例cookie在浏览器中的使用](#cookie的domain设置)

- **HTTP长链接**
    * `[KeepAlive]` [http长链接简介](#http长链接)
    * `[KeepAlive]` [http/1.1中长链接的实现示例](#http长链接)
    * `[KeepAlive]` [长链接在http2中的应用与http/1.1协议中的对比](#http长链接)
    * `[面试]` `Chrome浏览器允许的一次性最大TCP并发链接是几个？`，参考：[HTTP长链接分析](#http长链接)
- **数据协商**
- **CSP**
    * `[CSP]` [限制方式](#限制方式)
    * `[CSP]` [参考示例](#参考示例)
    * `[CSP]` [更多的设置方式](#更多的设置方式)

- **Nginx服务配置**
    * `[Nginx]` [Nginx安装启动](#nginx安装启动)
    * `[Nginx]` [修改hosts文件配置本地域名](#修改hosts文件配置本地域名)
    * `[Nginx]` [Nginx配置缓存](#nginx配置缓存)
    * `[Nginx]` [nginx部署https服务](#nginx部署https服务)
    * `[Nginx]` [实现http2协议](#实现http2协议)

## 5层网络模型介绍

> 互联网的实现分为好几层，每层都有自己的功能，向城市里的高楼一样，每层都需要依赖下一层，对于用户接触到的，只是上面最高一层，当然，如果要了解互联网，就必须从最下层开始自下而上理解每一层的功能。

#### 应用层

构建于TCP协议之上，为应用软件提供服务，应用层也是最高的一层直接面向用户。

* www万维网

* FTP文件传输协议

* DNS协议: 域名与IP的转换

* 邮件传输

* DCHP协议

#### 传输层

传输层向用户提供可靠的端到端(End-to-End)服务，主要有两个协议分别是TCP、 UDP协议， 大多数情况下我们使用的是TCP协议，它是一个更可靠的数据传输协议。

* 协议对比TCP
    * 面向链接: 需要对方主机在线，并建立链接。
    * 面向字节流: 你给我一堆字节流的数据，我给你发送出去，但是每次发送多少是我说了算，每次选出一段字节发送的时候，都会带上一个序号，这个序号就是发送的这段字节中编号最小的字节的编号。
    * 可靠: 保证数据有序的到达对方主机，每发送一个数据就会期待收到对方的回复，如果在指定时间内收到了对方的回复，就确认为数据到达，如果超过一定时间没收到对方回复，就认为对方没收到，在重新发送一遍。

* 协议对比UDP
    * 面向无链接: 发送的时候不关心对方主机在线，可以离线发送。
    * 面向报文: 一次发送一段数据。
    * 不可靠: 只负责发送出去，至于接收方有没有收到就不管了。

#### 网络层

#### 数据链路层

#### 物理层

## http协议发展历史

> http是基于TCP/IP之上的应用层协议，也是互联网的基础协议，最新http2协议基于信道复用，分帧传输在传输效率上也有了大幅度的提升

#### 阶段一

**http/0.9**

只有一个命令GET，对应我们现在的请求GET、POST，没有header等描述数据的信息，服务器发送完毕数据就关闭TCP链接，每个http请求都要经历一次dns域名解析、传输和四次挥手，这样反复创建和断开tcp链接的开销是巨大的，在现在看来这种方式很糟糕。

#### 阶段二 
**http/1.0**
* 增加了很多命令POST、GET、HEAD
* 等增status code和header
> status code描述服务端处理某一个请求之后它的状态， header是不管发送还是请求一个数据它的描述。
* 多字符集支持、多部分发送、权限、缓存等。

#### 阶段三
**http/1.1**
* 持久链接
* 管道机制(pipeline)
> 可以在同一个链接里发送多个请求，但是在服务端对于进来的请求都是要按照顺序进行内容的返回，如果前一个请求很慢，后一个请求很多，它也需要第一个请求发送之后，后一个请求才可以发送，这块在http2里面进行了优化
* 增加host和其他功能
> 增加host可以在同一台物理服务器上跑多个web服务，例如一个nodejs的web服务，一个java的web服务

#### 阶段四
**http/2**
* 所有数据以二进制传输
* 同一个链接里面发送多个请求，不在需要按照顺序来
* 头信息压缩以及推送等提高效率的功能

## http三次握手

> 先清楚一个概念http请求与tcp链接之间的关系，在客户端向服务端请求和返回的过程中，是需要去创建一个TCP connection，因为http是不存在链接这样一个概念的，它只有请求和响应这样一个概念，请求和响应都是一个数据包，中间要通过一个传输通道，这个传输通道就是在TCP里面创建了一个从客户端发起和服务端接收的一个链接，TCP链接在创建的时候是有一个三次握手(三次网络传输)这样一个消耗在的。

#### 客户端与服务器端的一次请求

<div align="center"><img src="/img/http2018072201.jpg"></div>
</br>

#### 三次握手时序图

<div align="center"><img src="/img/http2018072202.jpg"></div>

<strong>第一次握手:</strong>  建立连接，客户端A发送SYN=1、随机产生Seq=client_isn的数据包到服务器B，等待服务器确认。

<strong>第二次握手:</strong> 服务器B收到请求后确认联机(可以接受数据)，发起第二次握手请求，ACK=(A的Seq+1)、SYN=1，随机产生Seq=client_isn的数据包到A。

<strong>第三次握手:</strong> A收到后检查ACK是否正确，若正确，A会在发送确认包ACK=服务器B的Seq+1、ACK=1，服务器B收到后确认Seq值与ACK值，若正确，则建立连接。

<strong>TCP标示</strong>:
1. SYN(synchronous建立联机)
2. ACK(acknowledgement 确认)
3. Sequence number(顺序号码)

#### 三次握手数据包详细内容分析

这里采用的是[wireshark 官网地址 https://www.wireshark.org/](https://www.wireshark.org/)，是一个很好的网络数据包抓取和分析软件。

示例采用的网址[http://news.baidu.com/](http://news.baidu.com/)，windows下打开cmd、Mac下打开终端ping下得到ip可以利用wireshark工具进行一次ip地址过滤，只分析指定的数据。

* 第一次握手，客户端发送一个TCP，标志位为SYN，Seq(序列号)=0，代表客户端请求建立链接，如下图所示

<div align="center"><img src="/img/three-way-handshake/one.png"></div>

* 第二次握手，服务器发回数据包，标志位为[SYN, ACK]，ACK设置为客户端第一次握手请求的Seq+1，即ACK=0+1=1，在随机产生一个Seq的数据包到客户端。

<div align="center"><img src="/img/three-way-handshake/two.png"></div>

* 第三次握手请求，客户端在次发送确认数据包，标识位为ACK，把服务器发来的Seq+1，即ACK=0+1，发送给服务器，服务器成功收到ACK报文段之后，连接就建立成功了。

<div align="center"><img src="/img/three-way-handshake/three.png"></div>

#### 总结

> 至于为什么要经过三次握手呢，是为了防止服务端开启一些无用的链接，网络传输是有延时的，中间可能隔着非常远的距离，通过光纤或者中间代理服务器等，客户端发送一个请求，服务端收到之后如果直接创建一个链接，返回内容给到客户端，因为网络传输原因，这个数据包丢失了，客户端就一直接收不到服务器返回的这个数据，超过了客户端设置的时间就关闭了，那么这时候服务端是不知道的，它的端口就会开着等待客户端发送实际的请求数据，服务这个开销也就浪费掉了。

## URI/URL/URN

#### URI

Uniform Resource Identifier/统一资源标志符，用来标示互联网上唯一的信息资源，包括URL和URN。

#### URL

Uniform Resource Locator/统一资源定位器

#### URN

永久统一资源定位符，例如资源被移动后如果是URL则会返回404，在URN中资源被移动之后还能被找到，当前还没有什么成熟的使用方案

## 跨域cors

> 关于浏览器跨域的原理，一个请求在浏览器端发送出去后，是会收到返回值响应的，只不过浏览器在解析这个请求的响应之后，发现不属于浏览器的同源策略(地址里面的协议、域名和端口号均相同)，会进行拦截。如果是在curl里面发送一个请求，都是没有跨域这样一个概念的，下面是例子进行分析：

#### 示例

server.html

在这个html里面采用ajax请求3011这个服务

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

server.3011.js

```js
const http = require('http');
const port = 3011;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    response.end('3011 port serve for you');
}).listen(port);

console.log('server listening on port ', port);
```

server.3010.js

对上面定义的server.html模版进行渲染，从而在该模版里调用3011这个端口服务

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

打开浏览器，地址栏输入http://127.0.0.1:3010/，会看到以下提示not allowed access，但是server.3011.js，会打印出 ``` request url:  / ```，说明浏览器在发送这个请求的时候并不知道服务是不是跨域的，还是会发送请求并接收服务端返回的内容，但是当浏览器接收到响应后在headers里面没有看到 ``` Access-Control-Allow-Origin: ``` 被设置为允许，会把这个请求返回的内容给忽略掉，并且在命令行报下面的错误。

```bash
Failed to load http://127.0.0.1:3011/: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://127.0.0.1:3010' is therefore not allowed access.
```

#### 基于http协议层面的几种解决办法

* 设置Access-Control-Allow-Origin

    * 设置为*表示，可以接收任意域名的访问

    ```js
    http.createServer((request, response) => {

        response.writeHead(200, {
            'Access-Control-Allow-Origin': '*'
        })
    }).listen(port);
    ```

    * 也可以设置为特定域名访问

    ```js
    http.createServer((request, response) => {

        response.writeHead(200, {
            'Access-Control-Allow-Origin': 'http://127.0.0.1:3010/'
        })
    }).listen(port);
    ```

    * 如果有多个域名访问可以在服务端动态设置

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

* jsonp

浏览器是允许像link、img、script标签在路径上加载一些内容进行请求，是允许跨域的，那么jsonp的实现原理就是在script标签里面加载了一个链接，去访问服务器的某个请求，返回内容。

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

#### CORS预请求

预请求也是浏览器的一种安全机制，会先发送一个OPTIONS请求给目的站点，与跨域服务器协商可以设置的头部信息，允许的方法和headers信息等。

* Access-Control-Allow-Origin: 跨域服务器允许的来源地址（跟请求的Origin进行匹配），可以是*或者某个确切的地址，不允许多个地址

* Access-Control-Allow-Methods: 允许的方法GET、HEAD、POST

* Access-Control-Allow-Headers: 允许的Content-Type

    * text/plain

    * multipart/form-data

    * application/x-www-form-urlencoded

* Access-Control-Max-Age: 预请求的返回结果(Access-Control-Allow-Methods和Access-Control-Allow-Headers)可以被缓存的时间，单位秒

* 请求头限制

* XMLHttpRequestUpload对象均没有注册任何事件监听器

* 请求中没有使用ReadableStream对象

修改server.html

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

在次运行后浏览器提示如下信息,上面自定义的头X-Test-Cors在跨域请求的时候是不被允许的.

```bash
Failed to load http://127.0.0.1:3011/: Request header field X-Test-Cors is not allowed by Access-Control-Allow-Headers in preflight response.
```

```bash
Failed to load http://127.0.0.1:3011/: Method PUT is not allowed by Access-Control-Allow-Methods in preflight response.
```

修改后端服务server.3011.js处理OPTIONS请求，设置相应的跨域响应头

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

运行结果

第一次先发送了一个OPTIONS请求询问

![](/img/cors2018072801.jpeg)

第二次发送一个PUT数据请求

![](/img/cors2018072802.png)

## 缓存头Cache-Control的含义和使用

#### 可缓存性

* public http经过的任何地方都可以进行缓存

* private 只有发起请求的这个浏览器才可以进行缓存，如果设置了代理缓存，那么代理缓存是不会生效的
 
* no-cache 任何一个节点都不可以缓存

#### 到期

* max-age=<seconds> 设置缓存到多少秒过期

* s-maxage=<seconds> 会代替max-age，只有在代理服务器（nginx代理服务器）才会生效

* max-stale=<seconds> 是发起请求方主动带起的一个头，是代表即便缓存过期，但是在max-stale这个时间内还可以使用过期的缓存，而不需要愿服务器请求新的内容

#### 重新验证

* must-revalidate 如果max-age设置的内容过期，必须要向服务器请求重新获取数据验证内容是否过期

* proxy-revalidate 主要用在缓存服务器，指定缓存服务器在过期后重新从原服务器获取，不能从本地获取

#### 其它

* no-store 本地和代理服务器都不可以存储这个缓存，永远都要从服务器拿body新的内容使用

* no-transform 主要用于proxy服务器，告诉代理服务器不要随意改动返回的内容


#### 缓存cache-control示例

* 先思考两个问题?
    1. 在页面中引入静态资源文件，为什么静态资源文件改变后，再次发起请求还是之前的内容，没有变化呢？
    2. 在使用webpack等一些打包工具时，为什么要加上一串hash码？

* cache-control.html

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>cache-control</title>
    </head>
    <body>
        <script src="/script.js"></script>
    </body>
</html>
```

* cache-control.js

浏览器输入http://localhost:3010/ 加载cache-control.html文件，该文件会请求http://localhost:3010/script.js，在url等于```/script.js```设置cache-control的max-age进行浏览器缓存

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('./example/cache/cache-control.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
        });

        response.end(html);
    } else if (request.url === '/script.js') {
        response.writeHead(200, {
            'Content-Type': 'text/javascript',
            'Cache-Control': 'max-age=200'
        });

        response.end("console.log('script load')");
    }

}).listen(port);

console.log('server listening on port ', port);
```

* 第一次运行

浏览器运行结果,没有什么问题，正常响应

![](/img/cache-control2018081101.png)

控制台运行结果

![](/img/cache-control2018081102.png)


* 修改cache-control.js返回值

```js
...
response.writeHead(200, {
    'Content-Type': 'text/javascript',
    'Cache-Control': 'max-age=200'
});

response.end("console.log('script load ！！！')");
...
```

* 中断上次程序，第二次运行

浏览器运营结果

第二次运行，从memory cahce读取，浏览器控制台并没有打印修改过的内容

![](/img/cache-control2018081103.png)

控制台运营结果

指请求了``` / ``` 并没有请求 ``` /script.js  ```

![](/img/cache-control2018081104.png)

以上结果浏览器并没有返回给我们服务端修改的结果，这是为什么呢？是因为我们请求的url```/script.js```没有变，那么浏览器就不会经过服务端的验证，会直接从客户端缓存去读，就会导致一个问题，我们的js静态资源更新之后，不会立即更新到我们的客户端，这也是前端开发中常见的一个问题，我们是希望浏览器去缓存我们的静态资源文件（js、css、img等）我们也不希望服务端内容更新了之后客户端还是请求的缓存的资源， 解决办法也就是我们在做js构建流程时，把打包完成的js文件名上根据它内容hash值加上一串hash码，这样你的js文件或者css文件等内容不变，这样生成的hash码就不会变，反映到页面上就是你的url没有变，如果你的文件内容有变化那么嵌入到页面的文件url就会发生变化，这样就可以达到一个更新缓存的目的，这也是目前前端来说比较常见的一个静态资源方案。

#### 资源验证

如果使用cahce-control浏览器发起一个请求到缓存查找的一个过程流程图

![](/img/cache-control2018081105.png)

##### 验证头

* Last-Modified 上次修改时间，配合If-Modified-Since或者If-Unmo dified-Since使用，对比上次修改时间以验证资源是否可用

* Etag 数据签名，配合If-Match或者If-Non-Match使用，对比资源的签名判断是否使用缓存

## cookie

通过Set-Cookie设置，下次请求会自动带上，键值对形式可以设置多个

#### cookie属性

* max-age或expires设置过期时间

* Secure只在https发送

* httpOnly无法通过document.cookie访问

#### 示例

* cookie.html

控制台打印输出cookie信息

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>Cookie</title>
    </head>
    <body>
        <script>
            console.log(document.cookie);    
        </script>
    </body>
</html>
```

* cookie.js

设置两个cookie，a=111 设置过期时间2秒钟，b=222设置httpOnly

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('./cookie.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
            'Set-Cookie': ['a=111;max-age=2', 'b=222; httpOnly'],
        });

        response.end(html);
    }

}).listen(port);

console.log('server listening on port ', port);
```

* 返回结果

可以看到当b=222设置了httpOnly之后，js就无法读取到该cookie值，示例中只输出了a=111

![](/img/cookie2018081201.png)

#### cookie的domain设置

> 如果想要在一个域名的二级域名中共享同一个cookie需要做domain设置

以下例子中，假设test.com是一级域名，设置一些cookie信息，同时设置domain，使得二级域名可以共享，在之后的二级域名例如 a.test.com, b.test.com访问中都可以访问到同一个cookie信息。

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('./cookie.html', 'utf-8');
    
        if (request.headers.host === 'test.com') {
            response.writeHead(200, {
                'Content-Type': 'text/html',
                'Set-Cookie': ['a=111;max-age=2', 'b=222; httpOnly; domain=test.com'],
            });
        }

        response.end(html);
    }

}).listen(port);

console.log('server listening on port ', port);
```

## http长链接

> http的请求是在tcp链接之上进行发送，tcp链接分为长链接、短链接的概念，http发送请求的时候会先创建一个tcp链接，在tcp连接上把http请求的内容发送，并接收返回，这个时候一次请求就结束了，浏览器会和服务端商量，要不要把这次tcp链接给关闭到，如果不关闭，这个tcp链接就会一直开着，会有消耗，但是接下去如果还有请求，就可以直接在这个tcp链接上进行发送，那么就不需要经过三次握手这样的一个链接消耗，而如果直接关闭，那么在下次http请求的时候就需要在创建一个tcp链接，长链接是可以设置timeout的，可以设置多长时间在这个tcp链接上没有新的请求就会关闭

#### http/1.1

http/1.1的链接在tcp上去发送请求是有先后顺序的，例如你有10个请求是不可以并发的在一个tcp链接上去发送，浏览器是可以允许并发的创建一个tcp链接，chrome允许的是6个，一次性的并发，如果你有10个只能等前面6个其中一个完成，新的请求在进去。

#### http/1.1长链接示例

* connection.html

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>Connection</title>
    </head>
    <body>
        <img src="/test1.jpg" alt="" />
        <img src="/test2.jpg" alt="" />
        <img src="/test3.jpg" alt="" />
        <img src="/test4.jpg" alt="" />
        <img src="/test5.jpg" alt="" />
        <img src="/test6.jpg" alt="" />
        <img src="/test7.jpg" alt="" />
        <img src="/test8.jpg" alt="" />
    </body>
</html>
```

* connection.js

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    const html = fs.readFileSync('./connection.html', 'utf-8');
    const img = fs.readFileSync('./test_img.jpg');

    if (request.url === '/') {
        response.writeHead(200, {
            'Content-Type': 'text/html',
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
```

* 返回结果

可以看到第一次图片加载时复用了第一次localhost的tcp链接，最后两张图片一直在等待前面的tcp链接完成，有一定的响应等待

![](/img/connection2018081201.png)

http/2

在http/2中有了一个新的概念<strong>信道复用</strong>，在TCP连接上可以并发的去发送http请求，链接一个网站只需要一个TCP链接(同域的情况下)

![]()

## 数据协商

```js
// todo
```

## csp

Content-Security-Policy内容安全策略，限制资源获取

[参考文档 内容安全策略 (CSP) - Web 安全 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/Security/CSP)

#### 限制方式

* default-src限制全局

* 制定资源类型

```
connect-src manifest-src img-src style-src script-src frame-src font-src media-src ...
```

#### 参考示例

> web领域非常著名的一个攻击方式xss，是通过某些方法在网站里面注入一些别人写好的脚本，窃取一些用户的信息，处于安全考虑不希望执行写在页面里面的一些脚本，可以在返回的headers里面设置Content-Security-Policy。

csp.html

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>cache-control</title>
    </head>
    <body>
        <script>
            console.log('hello world!!!');    
        </script>
        <script src="/script.js"></script>
    </body>
</html>
```

csp.js

在head里设置Content-Security-Policy只能加载http https

```js
const http = require('http');
const fs = require('fs');
const port = 3010;

http.createServer((request, response) => {
    console.log('request url: ', request.url);

    if (request.url === '/') {
        const html = fs.readFileSync('csp.html', 'utf-8');
    
        response.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Security-Policy': 'default-src http: https',
        });

        response.end(html);
    }
}).listen(port);
```
运行结果

![](/img/csp2018081201.png)

#### 更多的设置方式

* 限制外链加载的javascript文件只能通过哪些域名加载

> 只能根据本域名下的js内容进行加载

```js
response.writeHead(200, {
    'Content-Security-Policy': 'default-src \'self\'',
});
```

* 限制指定某个网站

```js
response.writeHead(200, {
    'Content-Security-Policy': 'default-src \'self\' https://www.baidu.com/',
});
```

* 限制form表单的提交

```js
response.writeHead(200, {
    'Content-Security-Policy': 'default-src \'self\'; form-action \'self\'',
});
```

* 内容安全策略如果出现我们不希望的情况，可以让它主动申请向我们服务器发送一个请求进行汇报

```js
// report-uri 跟上服务器的url地址
response.writeHead(200, {
    'Content-Security-Policy': 'default-src \'self\'; report-uri /report',
});
```

* 除了在服务端通过headers指定还可以在html里面通过meta标签写

> 注意：在html标签里通过meta写report-uri是不支持的，建议还用通过headers设置

```html
<meta http-equiv="Content-Security-Policy" content="default-src http: https">
```

更多内容可参考 CSP的CDN [参考文档 内容安全策略 (CSP) - Web 安全 | MDN](https://developer.mozilla.org/zh-CN/docs/Web/Security/CSP)

## nginx服务配置

> nginx出发点就是一个http的服务，一个纯粹做http协议的服务

#### windows安装可参考以下

[nginx: download](http://nginx.org/)

#### Mac安装

* 安装

``` brew install nginx ```

* 查看版本

``` nginx -v ```

* 安装位置

``` /usr/local/etc/nginx ```

* 启动

``` sudo nginx  ```

* 查看 nginx 是否启动成功

> 在浏览器中访问 http://localhost:8080，如果出现如下界面，则说明启动成功.

![](/img/nginx2018081201.png)

* 关闭nginx

``` sudo nginx -s stop ```

* 重新加载nginx

``` sudo nginx -s reload ```

#### 修改hosts文件配置本地域名

hosts位置:
* Windows C:\windows\system32\drivers\etc\hosts
* Mac /private/etc/hosts
* Ubuntu /etc/hosts

vim hosts

```sh
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1 test.com
```

保存以上配置即可，127.0.0.1 test.com 在浏览中输入www.test.com域名，就可访问本地指定的网站，仅限于本地。

``` 注意 ``` Nginx中，要做好conf配置，让这些域名有所访问的对象，例如下面Nginx配置缓存处的test.com指向http://127.0.0.1:3010

查看是否配置成功 可以打开cmd ping 一下配置的余名，例如上面配置的

ping test.com

```bash
PING test.com (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.047 ms
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.095 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.084 ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.055 ms
```

#### nginx配置缓存

* levels 是否要创建二级文件夹
* keys_zone=my_cache:10m 代理缓存查找一个缓存之前要有个地方保存，一个url对应的缓存保存在哪个地方，这个关系是存在内存里的，这里要声明一个内存大小进行保存，my_cache是缓存的名字，在每个server里面可以去设置

修改conf配置，文件目录了 ``` /usr/local/etc/nginx/servers/ ```

vim nginx-cache.conf

```conf
proxy_cache_path /var/cache levels=1:2 keys_zone=my_cache:10m;

server {
    listen          80;
    server_name     test.com;

    location / {
        proxy_cache my_cache;
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host; # 设置浏览器请求的host
    }
}
```

nginx-cache.js

* 以下s-maxage会代替max-age，只有在代理服务器（nginx代理服务器）才会生效
* 用来指定在发送一个请求时，只有在Vary指定的http的headers是相同的情况下，才会去使用缓存，例如User-Agent，IE、Firefox打开这个页面，CDN／代理服务器就会认为这是不同的页面，将会使用不同的缓存

```js
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
            'Cache-Control': 'max-age=20, s-max-age=20',
            'Vary': 'Test-Cache-Val'
        });

        wait(3000).then(() => response.end("success!"));
    }

}).listen(port);

console.log('server listening on port ', port);
```

ngxin-cache.html

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>nginx-cache</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.4/fetch.min.js"></script>
    </head>
    <body>
        <div>
            this is nginx-cache, and data is: <span id="data">请等待，数据获取中...</span>
        </div>
        <script>
            fetch('/data', {
                headers: {
                    'Test-Cache-Val': '123'
                }
            }).then((res => res.text())).then(text => {
                document.getElementById('data').innerText = text;
            });
        </script>
    </body>
</html>
```

以上就是关于nginx代理服务器的实现实例，具体的Nginx代理服务器缓存还是有很多的功能，比如通过一些脚本让缓存使用内存数据库搜索性能会更高，默认nginx缓存是写在磁盘上的，读写磁盘效率是很低的，还可以通过设置cache key等。

#### nginx部署https服务

##### 生成public key和private key

/usr/local/etc/nginx/certs目录下执行以下命令

```
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -keyout localhost-privkey.pem -out localhost-cert.pem
```

```bash
Generating a 2048 bit RSA private key
...............................................................................+++
..............+++
writing new private key to 'localhost-privkey.pem'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:
Email Address []:
```

##### 基于上面的nginx-cache.conf文件进行修改

```conf
proxy_cache_path /var/cache levels=1:2 keys_zone=my_cache:10m;

server {
    listen          443 ssl; # https默认证书
    server_name     test.com;

    # ssl on; # 开启ssl证书
    ssl_certificate_key /usr/local/etc/nginx/certs/localhost-privkey.pem;
    ssl_certificate /usr/local/etc/nginx/certs/localhost-cert.pem;

    location / {
        proxy_cache my_cache;
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host; # 设置浏览器请求的host
    }
}
```

``` 注意:  ``` [nginx: [warn] the "ssl" directive is deprecated, use the "listen ... ssl"](https://github.com/Q-Angelo/summarize/issues/3) 

##### http自动跳转https

```conf
proxy_cache_path /var/cache levels=1:2 keys_zone=my_cache:10m;

server {
    listen          80 default_server;
    listen          [::]:80 default_server; # [::] 你的ip
    server_name     test.com;
    return 302 https://$server_name$request_uri;
}

server {
    listen          443 ssl; # https默认证书
    server_name     test.com;

    # ssl on; # 开启ssl证书
    ssl_certificate_key /usr/local/etc/nginx/certs/localhost-privkey.pem;
    ssl_certificate /usr/local/etc/nginx/certs/localhost-cert.pem;

    location / {
        proxy_cache my_cache;
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host; # 设置浏览器请求的host
    }
}
```

#### 实现http2协议

http2目前只能在https下面才可以

* 优势: 
    * 信道复用
    * 分帧传输
    * Server Push http/1.1协议里是客户端主动请求，服务才会响应，

http2.conf

```conf
server {
    listen          443 ssl http2;
    server_name     http2.test.com;
    http2_push_preload on; 

    ssl_certificate_key /usr/local/etc/nginx/certs/localhost-privkey.pem;
    ssl_certificate /usr/local/etc/nginx/certs/localhost-cert.pem;

    location / {
        proxy_pass http://127.0.0.1:30100;
        proxy_set_header Host $host;
    }
}
```

connection.js [基于http/1.1长链接示例修改](https://github.com/Q-Angelo/http-protocol#http11%E9%95%BF%E9%93%BE%E6%8E%A5%E7%A4%BA%E4%BE%8B)

```js
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
```

connection.html

```html
<html>
    <head>
        <meta charset="utf-8" />
        <title>http2-connection</title>
        <style>
            img {
                width: 100px;
                height: 100px;
            }
        </style>
    </head>
    <body>
        1
        <img src="/test1.jpg" alt="" />
        2
        <img src="/test2.jpg" alt="" />
        3
        <img src="/test3.jpg" alt="" />
        4
        <img src="/test4.jpg" alt="" />
        5
        <img src="/test5.jpg" alt="" />
        6
        <img src="/test6.jpg" alt="" />
        7
        <img src="/test7.jpg" alt="" />
        8
        <img src="/test8.jpg" alt="" />
    </body>
</html>
```

运行效果，基于http2协议复合浏览器同域策略都在一个TCP上复用

![](./img/connection2018090901.png)

测试http2性能的网站 [https://http2.akamai.com/demo/http2-lab.html](https://http2.akamai.com/demo/http2-lab.html)
