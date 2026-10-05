import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * 单独给「静态页用的 3D 工牌」用的构建配置。
 *
 * 为什么不用 app 的主配置：主配置是 SPA 构建，产物带 index.html、按路由分包，
 * 静态页用不上。这里走 library 模式，把 Lanyard 组件连同 React / three / R3F /
 * rapier / meshline 一起打成一个自包含的 ES bundle，直接丢进 portfolio/badge/，
 * 静态页用 <script type="module"> 引即可，不需要任何外部 CDN。
 *
 * 用法：cd app && npm run build:badge
 */
export default defineConfig({
  base: './',
  mode: 'production',
  plugins: [react()],
  // 不要拷贝 app/public（audio / images / videos 属于 SPA，静态页用不到）
  publicDir: false,
  // .glb / .gltf 是二进制模型，不声明的话 Vite 会当 JS 解析并在第一个空字节处挂掉
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // lib 模式默认【不】替换 process.env.NODE_ENV，留给使用方的打包器处理。
  // 但这份 bundle 是给纯 HTML 页直接 <script> 引的，没有打包器兜底，
  // 不内联就会把 React 的开发版分支一起打进来（实测体积翻倍）。
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  build: {
    outDir: path.resolve(__dirname, '../portfolio/badge'),
    // 与主配置同样的坑：本机 safe-delete 垫片在 OneDrive 目录下会超时，
    // Vite 清空 outDir 时会直接抛错中断整个构建。改为覆盖写入，
    // 构建前用 PowerShell 手动清一次（bash rm 在 OneDrive 下也会被垫片卡住）。
    emptyOutDir: false,
    // 静态页是 file:// 或任意路径下打开，资源必须相对引用
    assetsDir: 'assets',
    // lib 模式默认把资源全部内联成 base64，会让 163KB 的 GLB 与三张 webp
    // 膨胀 33% 且塞进 JS 里没法单独缓存。强制外置成独立文件。
    assetsInlineLimit: 0,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(__dirname, 'src/badge/main.tsx'),
      formats: ['es'],
      fileName: () => 'badge.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    // three + rapier 体积本来就大，别刷警告
    chunkSizeWarningLimit: 6000,
  },
});
