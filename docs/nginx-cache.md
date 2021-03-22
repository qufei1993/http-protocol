# Nginx 代理服务配置缓存实践

Nginx 出发点就是一个 HTTP 的服务，一个纯粹做 HTTP 协议的服务

## Nginx 安装

### windows 安装可参考以下

[nginx: download](http://nginx.org/)

### Mac安装

* 安装 ```brew install nginx```

### 基本操作

* 查看版本 ```nginx -v```
* 安装位置 ```/usr/local/etc/nginx```
* 启动 ```sudo nginx```
* 关闭 Nginx ```sudo nginx -s stop```
* 重新加载 Nginx ```sudo nginx -s reload```
* 检查 nginx 配置文件 ```sudo nginx -t```

## 修改 hosts 文件配置本地域名

这一块主要是域名的 DNS 解析策略，如果浏览器的 DNS 缓存没有命中，第二部会查看操作系统中是否有域名对应的 IP，位于操作系统的 hosts 文件，hosts 文件位置如下所示：

**hosts 文件位置**

* Windows：C:\windows\system32\drivers\etc\hosts
* Mac：/private/etc/hosts
* Ubuntu：/etc/hosts

**vim hosts 文件位置**

```sh
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1 test.com
```

保存以上配置即可，127.0.0.1 test.com 在浏览中输入 www.test.com 域名，就可访问本地指定的网站，仅限于本地。

**注意** 要访问指定网站，我们还要在 Nginx 中配置 conf 文件做代理，让这些域名有所访问的对象，下面我们会配置 test.com 指向 http://127.0.0.1:3010

查看是否配置成功可以打开命中终端 ping 一下配置的域名

```bash
> ping test.com
PING test.com (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.047 ms
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.095 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.084 ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.055 ms
```

## Nginx 配置缓存

* levels：是否要创建二级文件夹
* keys_zone=my_cache:10m：代理缓存查找一个缓存之前要有个地方保存，一个 url 对应的缓存保存在哪个地方，这个关系是存在内存里的，这里要声明一个内存大小进行保存，my_cache 是缓存的名字，在每个 server 里面可以去设置

**增加 nginx-cache.conf 配置，文件目录如下** 

```
/usr/local/etc/nginx/servers/
```

**vim nginx-cache.conf**

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

## Nodejs Demo

**两个知识点：**

1. 在服务端代码中响应头 Cache-Control 中同时设置了 s-maxage 和 max-age，因为 s-maxage 仅在代理服务器（Nginx）中有效，所以它会替换 max-age。

2. 服务端响应头设置了 [Vary](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Vary) 参数，用来指定在发送一个请求时，只有在 Vary 指定的 HTTP 的 headers 是相同的情况下，才会去使用缓存，例如 User-Agent，IE、Firefox 打开这个页面是不同的，CDN/代理服务器就会认为这是不同的页面，将会使用不同的缓存。

**nginx-cache.js**

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

**ngxin-cache.html**

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

以上就是关于 Nginx 代理服务器的实现，具体的 Nginx 代理服务器缓存还是有很多的功能，比如通过一些脚本让缓存使用内存数据库搜索性能会更高，默认 Nginx 缓存是写在磁盘上的，读写磁盘效率是很低的，还可以通过设置 cache key 等。
