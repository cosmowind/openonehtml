const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname)));
app.use('/html-files', express.static(path.join(__dirname, 'html-files')));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'html-files');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成32位随机文件名
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, randomName + extension);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html' || path.extname(file.originalname).toLowerCase() === '.html') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传HTML文件！'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 工具函数
function loadData() {
  try {
    const dataPath = path.join(__dirname, 'database', 'data.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
  return { version: "1.0.0", files: [], preset_tags: [], preset_models: [], settings: { totalFiles: 0, totalTags: 0, totalModels: 0, totalCategories: 0 } };
}

function saveData(data) {
  try {
    const dataPath = path.join(__dirname, 'database', 'data.json');
    fs.ensureDirSync(path.dirname(dataPath));
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

function updateStats(data) {
  const files = data.files || [];
  const tags = data.preset_tags || [];
  const models = data.preset_models || [];

  data.settings.totalFiles = files.filter(f => f.status !== 'deleted').length;
  data.settings.totalTags = tags.length;
  data.settings.totalModels = models.length;

  // 计算分类数量
  const categories = new Set();
  files.forEach(file => {
    if (file.category) categories.add(file.category);
  });
  data.settings.totalCategories = categories.size;

  data.lastUpdate = new Date().toISOString();
}

// API路由

// 获取所有数据
app.get('/api/data', (req, res) => {
  const data = loadData();
  res.json(data);
});

// 保存数据
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    const data = loadData();

    // 合并新数据
    Object.assign(data, newData);

    // 更新最后修改时间
    data.lastUpdate = new Date().toISOString();

    // 保存到文件
    saveData(data);

    res.json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ error: '保存数据失败', details: error.message });
  }
});

// 上传文件
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const data = loadData();
    const fileId = crypto.randomBytes(8).toString('hex');

    const fileInfo = {
      id: fileId,
      originalName: req.file.originalname,
      encryptedName: req.file.filename,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      accessCount: 0,
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      category: req.body.category || '',
      background: req.body.background || '',
      prompt: req.body.prompt || '',
      model: req.body.model || '',
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
      status: 'active'
    };

    data.files.push(fileInfo);
    updateStats(data);

    if (saveData(data)) {
      res.json({ success: true, file: fileInfo });
    } else {
      res.status(500).json({ error: '保存数据失败' });
    }
  } catch (error) {
    console.error('上传文件错误:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 获取文件列表
app.get('/api/files', (req, res) => {
  const data = loadData();
  const { search, category, tags, model } = req.query;

  let files = data.files.filter(f => f.status !== 'deleted');

  // 搜索过滤 - 支持多关键词和高级搜索
  if (search) {
    const searchTerm = search.trim();
    if (searchTerm) {
      // 支持多关键词搜索，用空格分隔
      const keywords = searchTerm.toLowerCase().split(/\s+/).filter(k => k.length > 0);

      files = files.filter(f => {
        // 构建搜索文本
        const searchText = [
          f.title || '',
          f.description || '',
          f.originalName || '',
          f.background || '',
          f.prompt || '',
          f.category || ''
        ].join(' ').toLowerCase();

        // 检查是否包含所有关键词（AND逻辑）
        return keywords.every(keyword => {
          // 支持通配符 * 和 ?
          const regex = new RegExp(keyword.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
          return regex.test(searchText);
        });
      });
    }
  }

  // 分类过滤
  if (category) {
    files = files.filter(f => f.category === category);
  }

  // 标签过滤
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : [tags];
    files = files.filter(f => tagList.some(tag => f.tags.includes(tag)));
  }

  // 模型过滤
  if (model) {
    files = files.filter(f => f.model === model);
  }

  res.json(files);
});

// 获取单个文件信息
app.get('/api/files/:id', (req, res) => {
  const data = loadData();
  const file = data.files.find(f => f.id === req.params.id && f.status !== 'deleted');

  if (!file) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 更新访问信息
  file.lastAccess = new Date().toISOString();
  file.accessCount = (file.accessCount || 0) + 1;
  saveData(data);

  res.json(file);
});

// 更新文件信息
app.put('/api/files/:id', (req, res) => {
  const data = loadData();
  const fileIndex = data.files.findIndex(f => f.id === req.params.id && f.status !== 'deleted');

  if (fileIndex === -1) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const updateData = req.body;
  data.files[fileIndex] = { ...data.files[fileIndex], ...updateData };
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true, file: data.files[fileIndex] });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 删除文件
app.delete('/api/files/:id', (req, res) => {
  const { password } = req.body;

  if (password !== 'wind') {
    return res.status(403).json({ error: '删除密码错误' });
  }

  const data = loadData();
  const fileIndex = data.files.findIndex(f => f.id === req.params.id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 标记为已删除
  data.files[fileIndex].status = 'deleted';
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: '删除失败' });
  }
});

// 获取预置标签
app.get('/api/tags', (req, res) => {
  const data = loadData();
  res.json(data.preset_tags || []);
});

// 添加预置标签
app.post('/api/tags', (req, res) => {
  const data = loadData();
  const { name, color, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '标签名称不能为空' });
  }

  const tagId = 'tag_' + Date.now();
  const newTag = {
    id: tagId,
    name,
    color: color || '#3498db',
    description: description || '',
    createTime: new Date().toISOString(),
    usageCount: 0
  };

  if (!data.preset_tags) data.preset_tags = [];
  data.preset_tags.push(newTag);
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true, tag: newTag });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 获取预置模型
app.get('/api/models', (req, res) => {
  const data = loadData();
  res.json(data.preset_models || []);
});

// 添加预置模型
app.post('/api/models', (req, res) => {
  const data = loadData();
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '模型名称不能为空' });
  }

  const modelId = 'model_' + Date.now();
  const newModel = {
    id: modelId,
    name,
    description: description || '',
    createTime: new Date().toISOString(),
    usageCount: 0
  };

  if (!data.preset_models) data.preset_models = [];
  data.preset_models.push(newModel);
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true, model: newModel });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 更新模型
app.put('/api/models/:id', (req, res) => {
  const data = loadData();
  const modelId = req.params.id;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '模型名称不能为空' });
  }

  if (!data.preset_models) {
    return res.status(404).json({ error: '模型不存在' });
  }

  const modelIndex = data.preset_models.findIndex(model => model.id === modelId);
  if (modelIndex === -1) {
    return res.status(404).json({ error: '模型不存在' });
  }

  // 更新模型信息
  data.preset_models[modelIndex] = {
    ...data.preset_models[modelIndex],
    name,
    description: description || '',
    updateTime: new Date().toISOString()
  };

  if (saveData(data)) {
    res.json({ success: true, model: data.preset_models[modelIndex] });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 分类管理API
app.get('/api/categories', (req, res) => {
  const data = loadData();
  const categories = data.categories || [];
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const data = loadData();
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }

  const categoryId = 'category_' + Date.now();
  const newCategory = {
    id: categoryId,
    name,
    description: description || '',
    createTime: new Date().toISOString(),
    usageCount: 0
  };

  if (!data.categories) data.categories = [];
  data.categories.push(newCategory);
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true, category: newCategory });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const data = loadData();
  const categoryId = req.params.id;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }

  if (!data.categories) {
    return res.status(404).json({ error: '分类不存在' });
  }

  const categoryIndex = data.categories.findIndex(category => category.id === categoryId);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: '分类不存在' });
  }

  // 更新分类信息
  data.categories[categoryIndex] = {
    ...data.categories[categoryIndex],
    name,
    description: description || '',
    updateTime: new Date().toISOString()
  };

  if (saveData(data)) {
    res.json({ success: true, category: data.categories[categoryIndex] });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const data = loadData();
  const categoryId = req.params.id;

  if (!data.categories) {
    return res.status(404).json({ error: '分类不存在' });
  }

  const categoryIndex = data.categories.findIndex(category => category.id === categoryId);
  if (categoryIndex === -1) {
    return res.status(404).json({ error: '分类不存在' });
  }

  // 检查是否有文件使用此分类
  const files = data.files || [];
  const filesUsingCategory = files.filter(file => file.category === data.categories[categoryIndex].name);

  if (filesUsingCategory.length > 0) {
    return res.status(400).json({
      error: `无法删除分类，有 ${filesUsingCategory.length} 个文件正在使用此分类`
    });
  }

  const deletedCategory = data.categories.splice(categoryIndex, 1)[0];
  updateStats(data);

  if (saveData(data)) {
    res.json({ success: true, category: deletedCategory });
  } else {
    res.status(500).json({ error: '保存失败' });
  }
});

// 目录扫描接口
app.post('/api/scan-directory', (req, res) => {
  const { directory } = req.body;

  if (!directory) {
    return res.status(400).json({ error: '请提供目录路径' });
  }

  try {
    const htmlFiles = [];

    // 扫描HTML文件
    function scanDir(dirPath) {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          scanDir(fullPath);
        } else if (item.toLowerCase().endsWith('.html')) {
          htmlFiles.push({
            path: fullPath,
            name: item,
            size: stats.size,
            mtime: stats.mtime
          });
        }
      }
    }

    scanDir(directory);
    res.json({ success: true, files: htmlFiles });

  } catch (error) {
    console.error('扫描目录失败:', error);
    res.status(500).json({ error: '扫描目录失败: ' + error.message });
  }
});

// 批量上传文件
app.post('/api/batch-upload', (req, res) => {
  const { files, background, prompt, tags, model } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ error: '请提供文件列表' });
  }

  const data = loadData();
  const results = [];

  for (const fileInfo of files) {
    try {
      const sourcePath = fileInfo.path;
      const originalName = fileInfo.name;

      if (!fs.existsSync(sourcePath)) {
        results.push({ name: originalName, success: false, error: '文件不存在' });
        continue;
      }

      // 生成随机文件名
      const randomName = crypto.randomBytes(16).toString('hex') + '.html';
      const targetPath = path.join(__dirname, 'html-files', randomName);

      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);

      // 添加到数据库
      const fileId = crypto.randomBytes(8).toString('hex');
      const fileSize = fs.statSync(sourcePath).size;

      const newFile = {
        id: fileId,
        originalName,
        encryptedName: randomName,
        fileSize,
        uploadTime: new Date().toISOString(),
        accessCount: 0,
        title: originalName,
        description: '',
        category: '',
        background: background || '',
        prompt: prompt || '',
        model: model || '',
        tags: tags || [],
        status: 'active'
      };

      data.files.push(newFile);
      results.push({ name: originalName, success: true, file: newFile });

    } catch (error) {
      results.push({ name: originalName, success: false, error: error.message });
    }
  }

  updateStats(data);
  saveData(data);

  res.json({ success: true, results });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`OpenOneHTML服务器运行在 http://localhost:${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});

module.exports = app;
