# -*- coding: utf-8 -*-
"""给超大单文件 index.html 用的多线程静态服务器。
SimpleHTTPRequestHandler 单线程时，一个 17MB 响应会把整个 server 卡住/被回收；
ThreadingTCPServer 保证并发请求不会被饿死。
用法: python serve-big.py <root> <port>
"""
import functools
import mimetypes
import socketserver
import sys
from http.server import SimpleHTTPRequestHandler

mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("audio/mp4", ".m4a")


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    root = sys.argv[1]
    port = int(sys.argv[2])
    handler = functools.partial(Handler, directory=root)
    with Server(("127.0.0.1", port), handler) as httpd:
        print("serving %s on http://127.0.0.1:%d" % (root, port), flush=True)
        httpd.serve_forever()
