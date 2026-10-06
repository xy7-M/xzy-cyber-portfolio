# -*- coding: utf-8 -*-
"""极简静态服务器：给验证页提供 three / glb / webp，绕开 vite 的依赖预构建。
用法: python serve-static.py <root> <port>
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


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    root = sys.argv[1]
    port = int(sys.argv[2])
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(Handler, directory=root)
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        print(f"serving {root} on http://127.0.0.1:{port}", flush=True)
        httpd.serve_forever()
