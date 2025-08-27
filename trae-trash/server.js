const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const ProjectInitializer = require('./utils/init-project');

const PORT = 3000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理扫描API请求
  if (req.url.startsWith('/api/scan')) {
    handleScanRequest(req, res);
    return;
  }

  // 处理更新文件API请求
  if (req.url.startsWith('/api/update-file')) {
    handleUpdateFileRequest(req, res);
    return;
  }

  // 处理编辑标签API请求
  if (req.url.startsWith('/api/edit-tag')) {
    handleEditTagRequest(req, res);
    return;
  }

  // 处理删除文件API请求
  if (req.url.startsWith('/api/delete-file')) {
    handleDeleteFileRequest(req, res);
    return;
  }

  // 处理数据库文件请求
  if (req.url.startsWith('/database/')) {
    handleDatabaseFileRequest(req, res);
    return;
  }

  // 处理HTML文件请求
  if (req.url.startsWith('/html-files/')) {
    handleHtmlFileRequest(req, res);
    return;
  }

  // 处理数据库文件PUT请求
  if (req.url === '/database/data.json' && req.method === 'PUT') {
    handleDatabasePutRequest(req, res);
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // 获取文件扩展名
  const extname = path.extname(filePath);

  // 设置默认Content-Type
  let contentType = 'application/octet-stream';

  // 根据扩展名设置Content-Type
  switch (extname) {
    case '.html':
      contentType = 'text/html; charset=utf-8';
      break;
    case '.js':
      contentType = 'application/javascript; charset=utf-8';
      break;
    case '.css':
      contentType = 'text/css; charset=utf-8';
      break;
    case '.json':
      contentType = 'application/json; charset=utf-8';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }

  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        console.log(`File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>404 Not Found</h1><p>页面不存在</p></body></html>');
      } else {
        // 服务器错误
        console.error(`Server error: ${err.code}`);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><body><h1>500 Internal Server Error</h1><p>服务器内部错误</p></body></html>');
      }
    } else {
      // 成功响应
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});

// 处理数据库文件PUT请求
function handleDatabasePutRequest(req, res) {
  if (req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const dbPath = path.join(__dirname, 'database', 'data.json');

        // 保存数据到文件
        fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无法保存数据库文件' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: '数据保存成功' }));
        });
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持PUT方法' }));
  }
}

// 处理扫描请求
function handleScanRequest(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const directory = data.directory;

        if (!directory) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少目录参数' }));
          return;
        }

        if (!fs.existsSync(directory)) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '目录不存在' }));
          return;
        }

        const initializer = new ProjectInitializer();

        // 重定向console.log到响应
        const originalLog = console.log;
        const logs = [];
        console.log = (message) => {
          logs.push(message);
          originalLog(message);
        };

        try {
          // 获取项目根目录
          const projectRoot = process.cwd();

          // 如果传入的是完整路径，转换为相对于项目根目录的路径
          let scanDir = directory;
          if (path.isAbsolute(directory)) {
            // 如果是项目根目录，使用 '.' 表示当前目录
            if (directory.toLowerCase() === projectRoot.toLowerCase()) {
              scanDir = '.';
            } else {
              // 否则计算相对路径
              scanDir = path.relative(projectRoot, directory);
            }
          }

          console.log('扫描目录:', scanDir);
          initializer.scanDirectory(scanDir);

          // 恢复console.log
          console.log = originalLog;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: '扫描完成',
            logs: logs
          }));
        } catch (error) {
          // 恢复console.log
          console.log = originalLog;

          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: '扫描失败',
            details: error.message
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持POST方法' }));
  }
}

// 处理更新文件请求
function handleUpdateFileRequest(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const fileId = data.id;
        const fileData = data.data;

        if (!fileId || !fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少文件ID或数据参数' }));
          return;
        }

        // 读取数据库文件
        const dbPath = path.join(__dirname, 'database', 'data.json');
        fs.readFile(dbPath, 'utf8', (err, dbContent) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无法读取数据库文件' }));
            return;
          }

          try {
            const db = JSON.parse(dbContent);

            // 查找并更新文件
            const fileIndex = db.html_files.findIndex(f => f.id === fileId);
            if (fileIndex === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '找不到指定的文件' }));
              return;
            }

            // 更新文件数据
            db.html_files[fileIndex] = {
              ...db.html_files[fileIndex],
              ...fileData,
              updated_at: new Date().toISOString()
            };

            // 更新统计信息
            updateStatistics(db);

            // 保存回数据库文件
            fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8', (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无法保存数据库文件' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: '文件更新成功'
              }));
            });
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '解析数据库文件失败' }));
          }
        });
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持POST方法' }));
  }
}

// 更新统计信息
function updateStatistics(db) {
  const stats = {
    total_files: db.html_files.length,
    categories: {},
    tags: {},
    models: {}
  };

  // 统计分类
  db.html_files.forEach(file => {
    if (file.category) {
      stats.categories[file.category] = (stats.categories[file.category] || 0) + 1;
    }

    // 统计标签
    if (file.tags) {
      file.tags.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    }

    // 统计模型
    if (file.models) {
      file.models.forEach(model => {
        if (model.name) {
          stats.models[model.name] = (stats.models[model.name] || 0) + 1;
        }
      });
    }
  });

  db.statistics = stats;
  db.last_updated = new Date().toISOString();
}

// 处理编辑标签请求
function handleEditTagRequest(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const oldTagName = data.oldTagName;
        const newTagName = data.newTagName;

        if (!oldTagName || !newTagName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少标签名称参数' }));
          return;
        }

        if (oldTagName === newTagName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '新旧标签名称相同' }));
          return;
        }

        // 读取数据库文件
        const dbPath = path.join(__dirname, 'database', 'data.json');
        fs.readFile(dbPath, 'utf8', (err, dbContent) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无法读取数据库文件' }));
            return;
          }

          try {
            const db = JSON.parse(dbContent);
            let updatedCount = 0;

            // 更新所有文件中的标签
            db.html_files.forEach(file => {
              if (file.tags && Array.isArray(file.tags) && file.tags.includes(oldTagName)) {
                const index = file.tags.indexOf(oldTagName);
                file.tags[index] = newTagName;
                updatedCount++;

                // 更新时间戳
                file.updated_at = new Date().toISOString();
              }
            });

            if (updatedCount === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '没有找到使用该标签的文件' }));
              return;
            }

            // 更新统计信息
            updateStatistics(db);

            // 保存回数据库文件
            fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8', (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无法保存数据库文件' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: '标签编辑成功',
                updatedCount: updatedCount
              }));
            });
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '解析数据库文件失败' }));
          }
        });
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持POST方法' }));
  }
}

// 处理删除文件请求
function handleDeleteFileRequest(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const fileId = data.id;
        const password = data.password;

        if (!fileId || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少文件ID或密码参数' }));
          return;
        }

        // 验证密码
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '密码配置文件不存在' }));
          return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const deletePassword = envContent.match(/DELETE_PASSWORD=(.+)/)?.[1];

        if (!deletePassword || password !== deletePassword) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '密码错误' }));
          return;
        }

        // 读取数据库文件
        const dbPath = path.join(__dirname, 'database', 'data.json');
        fs.readFile(dbPath, 'utf8', (err, dbContent) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无法读取数据库文件' }));
            return;
          }

          try {
            const db = JSON.parse(dbContent);

            // 查找文件
            const fileIndex = db.html_files.findIndex(f => f.id === fileId);
            if (fileIndex === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '找不到指定的文件' }));
              return;
            }

            const file = db.html_files[fileIndex];

            // 删除实际文件
            const htmlFilePath = path.join(__dirname, file.file_path);
            const jsonFilePath = path.join(__dirname, file.json_path);

            // 删除HTML文件
            if (fs.existsSync(htmlFilePath)) {
              fs.unlinkSync(htmlFilePath);
            }

            // 删除JSON元数据文件
            if (fs.existsSync(jsonFilePath)) {
              fs.unlinkSync(jsonFilePath);
            }

            // 从数据库中删除记录
            db.html_files.splice(fileIndex, 1);

            // 更新统计信息
            updateStatistics(db);

            // 保存回数据库文件
            fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8', (err) => {
              if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '无法保存数据库文件' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: `文件 "${file.original_name}" 删除成功`
              }));
            });
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '解析数据库文件失败' }));
          }
        });
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的JSON数据' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持POST方法' }));
  }
}

// 处理数据库文件请求
function handleDatabaseFileRequest(req, res) {
  const filePath = path.join(__dirname, req.url);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '数据库文件未找到' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  });
}

// 处理HTML文件请求
function handleHtmlFileRequest(req, res) {
  const filePath = path.join(__dirname, req.url);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body><h1>404 Not Found</h1><p>HTML文件不存在</p></body></html>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});