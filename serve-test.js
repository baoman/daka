const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
// 使用专用端口，避免旧预览服务在 5173 上返回正式 cloud-config.js。
const port = Number(process.env.PORT || 5186);
const localConfigPath = path.join(root, 'cloud-config.local.js');

if (!fs.existsSync(localConfigPath)) {
  throw new Error('缺少 cloud-config.local.js，无法启动测试服务器。');
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  const requested = rawPath === '/' ? '/index.html' : rawPath;

  // 仅在本地测试服务器中把页面对 cloud-config.js 的请求替换为测试项目配置。
  if (requested === '/cloud-config.js') {
    return send(res, 200, fs.readFileSync(localConfigPath), contentTypes['.js']);
  }

  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return send(res, 404, 'Not found');
  }
  return send(res, 200, fs.readFileSync(filePath), contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
}).listen(port, '127.0.0.1', () => {
  console.log(`测试服务器已启动：http://127.0.0.1:${port}/`);
});
