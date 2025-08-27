# OpenOneHTML - HTML创意实现管理平台

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.1-orange.svg)]()

OpenOneHTML是一个现代化的HTML文件管理平台，专为整理和对比不同AI代码模型的生成结果而设计。支持文件上传、元数据管理、智能搜索、批量操作和可视化设置等功能。

## ✨ 核心特性

- 📁 **智能文件管理** - 批量上传、分类存储、版本控制
- 🔍 **高级搜索筛选** - 多维度搜索、标签过滤、关键词匹配
- 🎨 **可视化设置** - 灵活的卡片显示配置、主题定制
- 📊 **数据统计** - 实时统计面板、访问追踪、性能分析
- 🔧 **批量操作** - 批量编辑、批量删除、批量导入
- 🌐 **Web界面** - 响应式设计、现代化UI、流畅交互

## 🏗️ 技术架构

### 前端技术栈
- **框架**: 原生JavaScript + HTML5 + CSS3
- **UI组件**: 自定义组件库 + 响应式设计
- **状态管理**: 事件驱动 + 中央数据管理器
- **存储**: localStorage + JSON文件存储

### 后端技术栈
- **运行时**: Node.js 18+
- **Web框架**: Express.js
- **文件处理**: Multer + fs-extra
- **数据存储**: JSON文件系统

### 项目结构
```
├── index.html          # 主页面
├── server.js           # Express服务器
├── package.json        # 项目配置
├── database/           # 数据存储
│   ├── data.json       # 主数据文件
│   └── schema.json     # 数据架构
├── js/                 # JavaScript模块
│   ├── app.js          # 主应用入口
│   ├── data-manager.js # 数据管理器
│   ├── ui-manager.js   # UI管理器
│   └── components.js   # UI组件库
├── css/                # 样式文件
│   ├── global.css      # 全局样式
│   ├── modal.css       # 模态框样式
│   ├── file-list.css   # 文件列表样式
│   └── ...
├── html-files/         # HTML文件存储
├── codeblock/          # 示例文件
└── utils/              # 工具函数
```

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- npm 8.0+

### 安装与运行
```bash
# 1. 克隆项目
git clone <repository-url>
cd openonehtml

# 2. 安装依赖
npm install

# 3. 启动服务
npm start
# 或直接运行
node server.js

# 4. 访问应用
# 打开浏览器访问: http://localhost:3000
```

### 基础使用
1. 打开应用首页，查看统计面板
2. 点击"添加文件"上传HTML文件
3. 为文件添加标签、分类、描述等元数据
4. 使用搜索功能快速查找文件
5. 通过设置面板自定义显示选项

## 📋 核心功能

### 文件管理
- ✅ **上传管理** - 支持单个/批量HTML文件上传，自动生成32位加密文件名
- ✅ **元数据编辑** - 标题、描述、标签、模型、分类、场景、提示词等信息管理
- ✅ **文件预览** - 直接在浏览器中预览HTML文件，记录访问统计
- ✅ **批量操作** - 支持批量编辑、删除和导入操作

### 智能搜索与筛选
- ✅ **多维度搜索** - 支持标题、描述、文件名等字段的关键词搜索
- ✅ **高级筛选** - 按分类、标签、模型进行精确筛选
- ✅ **搜索语法** - 支持通配符、多关键词、混合搜索
- ✅ **实时结果** - 搜索和筛选结果实时更新

### 可视化设置系统
- ✅ **显示字段控制** - 灵活控制卡片显示的8个字段（标题、分类、标签、模型、背景、提示词、描述、访问统计）
- ✅ **格式自定义** - 每个字段支持"标签"或"描述"格式选择
- ✅ **设置持久化** - 本地存储用户偏好设置，页面刷新后保持
- ✅ **实时应用** - 设置变更立即生效，无需刷新页面

### 数据统计与分析
- ✅ **实时统计面板** - 显示总文件数、分类数、标签数、模型数
- ✅ **访问追踪** - 记录和统计文件访问次数
- ✅ **数据可视化** - 直观的统计信息展示

### 用户界面体验
- ✅ **响应式设计** - 完美适配桌面和移动设备
- ✅ **现代化UI** - 渐变背景、卡片布局、平滑动画效果
- ✅ **交互优化** - 模态框外部点击关闭、消息提示、表单验证
- ✅ **直观操作** - 简洁明了的界面设计，操作流程清晰

## 🔌 API 接口

### 文件管理
- `GET /api/files` - 获取文件列表（支持搜索、筛选、分页）
- `POST /api/files` - 上传新文件
- `PUT /api/files/:id` - 更新文件信息
- `DELETE /api/files/:id` - 删除文件

### 预置选项管理
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 添加新标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

- `GET /api/models` - 获取模型列表
- `POST /api/models` - 添加新模型
- `PUT /api/models/:id` - 更新模型
- `DELETE /api/models/:id` - 删除模型

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 添加新分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 工具接口
- `POST /api/upload` - 文件上传处理
- `POST /api/scan-directory` - 目录扫描导入
- `GET /api/data` - 获取完整数据
- `POST /api/data` - 保存完整数据

## 💾 数据架构

### 主数据结构 (database/data.json)
```json
{
  "files": [
    {
      "id": "uuid",
      "originalName": "example.html",
      "encryptedName": "abc123.html",
      "title": "示例页面",
      "description": "HTML文件描述",
      "background": "需求背景",
      "prompt": "生成提示词",
      "category": "按钮组件",
      "tags": ["UI", "交互"],
      "model": "GPT-4",
      "uploadTime": "2024-12-01T00:00:00Z",
      "accessCount": 0,
      "status": "active"
    }
  ],
  "tags": ["UI", "交互", "动画"],
  "models": ["GPT-4", "Claude", "Gemini"],
  "categories": ["按钮组件", "表单组件", "导航组件"]
}
```

### 模块职责说明

| 模块文件 | 主要职责 | 代码行数 |
|---------|---------|---------|
| `js/app.js` | 应用初始化和模块协调 | ~100行 |
| `js/data-manager.js` | 中央数据状态管理 | ~400行 |
| `js/ui-manager.js` | UI组件生命周期管理 | ~300行 |
| `js/components.js` | UI组件实现库 | ~1800行 |
| `server.js` | Express服务器和API | ~600行 |

## 🚀 使用指南

### 基础操作流程
1. **添加文件**: 点击"添加文件"按钮上传HTML文件
2. **编辑信息**: 点击文件卡片进行元数据编辑
3. **搜索文件**: 使用顶部搜索框进行关键词搜索
4. **筛选结果**: 使用下拉菜单按分类/标签/模型筛选
5. **自定义显示**: 点击右上角⚙️按钮调整显示设置

### 高级功能
- **批量操作**: 选择多个文件进行批量编辑或删除
- **目录扫描**: 使用扫描功能批量导入目录中的HTML文件
- **设置定制**: 通过预览设置面板自定义卡片显示字段和格式

## 🤝 开发与贡献

### 环境要求
- Node.js 18.0+
- npm 8.0+
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

### 本地开发
```bash
# 克隆项目
git clone <repository-url>

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 项目结构说明
- `js/` - 前端JavaScript模块
- `css/` - 样式文件
- `database/` - 数据存储文件
- `html-files/` - 上传的HTML文件
- `codeblock/` - 示例文件
- `utils/` - 工具函数

## 📄 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📚 相关文档

- [更新日志](milestone.md) - 版本更新历史和功能改进记录
- [开发指南](CONTRIBUTING.md) - 贡献代码的详细指南
- [API文档](API.md) - 完整的API接口说明

---

*最后更新：2025年8月22日 - v2.1 版本*
