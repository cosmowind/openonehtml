# OpenOneHTML 使用指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 简化配置方式（推荐）

使用简化配置系统，只需要填写三个核心分类：

```bash
# 复制配置模板
cp templates/simple-config.yaml my-config.yaml

# 编辑配置文件（只需要修改三个核心分类）
# 然后创建对应的HTML文件

# 转换配置为JSON格式
node utils/simple-config.js my-config.yaml my-file.html

# 初始化项目
node utils/init-project.js init
```

### 3. 传统配置方式

```bash
# 初始化项目（处理现有文件）
node utils/init-project.js init
```

### 2. 启动项目

```bash
# 启动本地服务器
npm start

# 或者使用开发服务器（需要安装 live-server）
npm run dev
```

然后访问 http://localhost:3000 查看管理界面。

## 核心功能

### 🚀 简化配置系统（推荐）

#### 为什么使用简化配置？

- **只需要三个核心分类**：背景需求、提示词、开发模型
- **预设选项选择**：从预设选项中选择，无需手写复杂json
- **自动生成信息**：标签、分类、描述等信息自动生成
- **配置复用**：同一套配置可以应用到多个html文件上

#### 快速上手

1. **复制配置模板**：
   ```bash
   cp templates/simple-config.yaml my-config.yaml
   ```

2. **编辑配置文件**（只需要修改三个核心分类）：
   ```yaml
   # === 背景需求 ===
   background_requirements:
     preset: "网页应用开发"  # 从预设中选择
     custom: ""  # 可选自定义

   # === 提示词 ===
   prompt:
     preset: "创建一个响应式网页应用"  # 从预设中选择
     custom: ""  # 可选自定义

   # === 开发模型 ===
   development_models:
     - name: "Human Developer"
       version: "1.0.0"
       performance:
         accuracy: 95
         efficiency: 90
         creativity: 85
   ```

3. **创建html文件**：创建对应的html文件

4. **转换配置**：
   ```bash
   node utils/simple-config.js my-config.yaml my-file.html
   ```

5. **初始化项目**：
   ```bash
   node utils/init-project.js init
   ```

#### 预设选项

**背景需求预设**：
- 网页应用开发
- 移动端界面
- 数据可视化
- 交互原型
- 教学演示

**提示词预设**：
- 创建一个响应式网页应用
- 设计一个移动端友好的界面
- 开发一个数据可视化仪表板
- 制作一个交互式原型
- 创建一个教学演示页面
- 构建一个单页应用(spa)
- 设计一个电商网站界面
- 开发一个社交媒体组件

**开发模型预设**：
- human developer (人类开发者)
- ai assistant (ai助手)
- code generator (代码生成器)
- ui designer (ui设计师)
- frontend expert (前端专家)

#### 配置复用示例

```bash
# 同一配置应用到多个文件
node utils/simple-config.js my-config.yaml file1.html
node utils/simple-config.js my-config.yaml file2.html
node utils/simple-config.js my-config.yaml file3.html
```

### 📁 批量文件管理

#### 功能特点

- **批量上传**：支持拖拽上传多个HTML文件
- **统一配置**：为一组文件设置共同的背景需求、提示词和标签
- **模型分配**：为每个文件分配不同的开发模型
- **自动生成**：自动生成对应的JSON配置文件
- **进度显示**：实时显示处理进度和状态

#### 使用步骤

1. **访问批量管理界面**：
   ```
   启动项目后，点击主页的"批量管理"按钮
   或者直接访问: http://localhost:3000/batch-manager.html
   ```

2. **设置共同信息**：
   - 背景需求：输入这组文件的共同背景描述
   - 提示词：输入共同的提示词内容
   - 标签：输入共同的标签（用逗号分隔）

3. **上传HTML文件**：
   - 拖拽HTML文件到上传区域
   - 或点击"选择文件"按钮选择文件
   - 支持一次上传多个文件

4. **分配开发模型**：
   - 为每个文件选择合适的开发模型
   - 预设模型包括：Human Developer、AI Assistant、Code Reviewer等
   - 可以为不同文件分配不同模型

5. **处理文件**：
   - 点击"🚀 处理文件"按钮
   - 系统会自动生成JSON配置文件并下载
   - 实时显示处理进度

6. **初始化到系统**：
   ```bash
   # 创建批量处理目录
   mkdir batch-configs batch-html
   
   # 将下载的JSON文件放到 batch-configs 目录
   # 将对应的HTML文件放到 batch-html 目录
   
   # 运行批量处理工具
   node utils/batch-processor.js batch-configs batch-html
   ```

#### 批量处理工具

**交互式模式**：
```bash
node utils/batch-processor.js --interactive
# 或
node utils/batch-processor.js -i
```

**命令行模式**：
```bash
node utils/batch-processor.js <配置文件目录> <HTML文件目录>
```

**示例**：
```bash
node utils/batch-processor.js ./batch-configs ./batch-html
```

#### 工具功能

- **自动验证**：检查配置文件格式和必需字段
- **文件加密**：自动生成加密文件名
- **数据库集成**：自动创建数据库记录
- **错误处理**：详细的错误信息和处理结果
- **进度反馈**：实时显示处理状态

#### 适用场景

- **模型对比**：同一需求用不同模型实现
- **团队协作**：不同开发者负责不同文件
- **版本管理**：同一功能的不同实现版本
- **教学演示**：展示不同开发方法的对比

### 文件管理

#### 添加新html文件

**传统方式**：
1. 在项目根目录创建html文件和对应的json描述文件
2. 运行初始化工具自动处理：
   ```bash
   node utils/init-project.js init
   ```

#### JSON描述文件格式

```json
{
  "original_name": "your-file-name.html",
  "scene": "描述应用场景",
  "prompt": "使用的提示词内容",
  "models": [
    {
      "name": "模型名称",
      "version": "模型版本",
      "performance": {
        "accuracy": 90,
        "efficiency": 85,
        "creativity": 80
      }
    }
  ],
  "tags": ["标签1", "标签2"],
  "category": "分类名称",
  "description": "详细描述这个HTML文件的功能和特点"
}
```

#### 批量处理文件

```bash
# 扫描并处理指定目录中的HTML文件
node utils/init-project.js scan /path/to/directory
```

### 工具使用

#### 1. 文件名加密工具

```bash
# 加密单个文件
node utils/encrypt-filename.js your-file.html

# 加密整个目录
node utils/encrypt-filename.js ./directory

# 使用随机字符串（非哈希）
node utils/encrypt-filename.js your-file.html false
```

#### 2. CSS/JS合并工具

```bash
# 合并单个HTML文件
node utils/merge-css-js.js your-file.html

# 合并整个目录
node utils/merge-css-js.js ./directory

# 不创建备份
node utils/merge-css-js.js your-file.html false
```

#### 3. 数据库管理工具

```bash
# 添加HTML文件记录
node utils/database-manager.js add your-file.json

# 搜索文件
node utils/database-manager.js search "场景关键词" "分类"

# 查看统计信息
node utils/database-manager.js stats

# 导出数据
node utils/database-manager.js export backup.json

# 导入数据
node utils/database-manager.js import backup.json
```

### 项目结构

```
openonehtml/
├── readme.md                    # 项目说明
├── index.html                    # 主页面
├── package.json                 # 项目配置
├── database/                     # 数据库相关
│   ├── data.json                 # 数据存储文件
│   └── schema.json               # 数据结构定义
├── utils/                        # 工具脚本
│   ├── encrypt-filename.js       # 文件名加密工具
│   ├── merge-css-js.js           # CSS/JS合并工具
│   ├── database-manager.js       # 数据库管理工具
│   └── init-project.js           # 项目初始化工具
├── html-files/                   # HTML文件存储（加密后）
├── static/                       # 静态资源
├── templates/                    # 模板文件
│   ├── html-template.html        # HTML模板
│   └── json-template.json        # JSON模板
└── 截屏手机坐标/                 # 示例文件目录
    ├── Qwen3coder-截屏手机坐标.html
    ├── glm45-截屏手机坐标.html
    └── kimik2-截屏手机坐标.html
```

## 工作流程

### 1. 添加新HTML文件

1. **创建HTML文件**：在根目录创建新的HTML文件
2. **创建JSON描述**：创建同名的JSON文件，包含场景、提示词、模型等信息
3. **运行初始化**：执行 `node utils/init-project.js init` 自动处理
4. **查看结果**：访问管理界面查看已添加的文件

### 2. 处理现有文件

1. **放置文件**：将HTML文件放在根目录或指定目录
2. **创建描述**：为每个HTML文件创建对应的JSON描述文件
3. **批量处理**：使用扫描工具处理整个目录

### 3. 管理和维护

1. **搜索筛选**：使用管理界面的搜索功能
2. **编辑记录**：通过数据库工具编辑文件记录
3. **备份恢复**：定期导出数据备份

## 部署到GitHub Pages

### 1. 创建GitHub仓库

1. 在GitHub上创建新仓库
2. 将项目推送到GitHub

### 2. 配置GitHub Pages

1. 进入仓库设置
2. 找到Pages选项
3. 选择部署分支（通常是main或master）
4. 选择根目录作为部署目录
5. 保存设置

### 3. 自动化部署（可选）

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 常见问题

### Q: 如何处理分离的CSS和JS文件？
A: 使用合并工具自动将CSS和JS内容合并到HTML中：
```bash
node utils/merge-css-js.js your-file.html
```

### Q: 如何批量处理多个HTML文件？
A: 将文件放在同一目录，然后使用扫描工具：
```bash
node utils/init-project.js scan ./your-directory
```

### Q: 如何备份数据？
A: 使用数据库管理工具导出数据：
```bash
node utils/database-manager.js export backup.json
```

### Q: 如何自定义文件名加密方式？
A: 加密工具支持两种模式：
- 哈希模式（默认）：基于文件名生成MD5哈希
- 随机模式：生成纯随机字符串

```bash
# 使用随机模式
node utils/encrypt-filename.js your-file.html false
```

## 扩展功能

### 添加新字段

数据库结构设计为可扩展的，如需添加新字段：

1. 修改 `database/schema.json` 添加字段定义
2. 更新 `utils/database-manager.js` 中的相关逻辑
3. 在JSON描述文件中添加新字段

### 自定义工具

所有工具都采用模块化设计，可以轻松扩展：

- 继承现有工具类
- 添加新的处理逻辑
- 集成到主工作流程中

## 技术支持

- 查看项目源码了解详细实现
- 阅读工具代码中的注释
- 检查控制台输出的错误信息
- 查看浏览器开发者工具中的网络请求

## 许可证

MIT License - 详见 LICENSE 文件