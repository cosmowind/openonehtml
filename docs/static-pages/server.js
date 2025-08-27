const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 模拟GitHub Pages的路径结构
// 在本地测试时，我们需要模拟 /openonehtml 路径前缀
// docs 目录是GitHub Pages的根目录
const docsPath = path.join(__dirname, '..');

// 服务整个docs目录下的文件，模拟GitHub Pages结构
app.use('/openonehtml', express.static(docsPath));

// 单独服务static-pages目录（为了兼容性）
app.use('/openonehtml/static-pages', express.static(path.join(__dirname)));
app.use('/openonehtml/static-pages/html-files', express.static(path.join(__dirname, 'html-files')));

// 根路径重定向到GitHub Pages结构
app.use('/', express.static(docsPath));

// 404处理
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>Requested: ${req.url}</p>
    <p>Try: <a href="/openonehtml/">/openonehtml/</a></p>
    <p>Or: <a href="/openonehtml/static-pages/">/openonehtml/static-pages/</a></p>
    <p>Or: <a href="/openonehtml/test-links.html">/openonehtml/test-links.html</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 本地测试服务器已启动!`);
  console.log(`📱 主页: http://localhost:${PORT}/openonehtml/static-pages/`);
  console.log(`🔗 测试页面: http://localhost:${PORT}/openonehtml/test-links.html`);
  console.log(`📋 模拟GitHub Pages路径结构: /openonehtml/*`);
  console.log(`⚡ 按Ctrl+C停止服务器`);
});
