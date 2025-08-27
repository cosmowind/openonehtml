/**
 * 项目初始化工具
 * 用于快速设置项目环境和处理现有文件
 */

const fs = require('fs');
const path = require('path');
const FilenameEncryptor = require('./encrypt-filename');
const CSSJSMerger = require('./merge-css-js');
const DatabaseManager = require('./database-manager');

class ProjectInitializer {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.encryptor = new FilenameEncryptor();
        this.merger = new CSSJSMerger();
        this.dbManager = new DatabaseManager();
    }

    /**
     * 初始化项目
     */
    init() {
        console.log('🚀 开始初始化 OpenOneHTML 项目...');
        
        // 检查必要目录
        this.checkDirectories();
        
        // 处理现有HTML文件
        this.processExistingFiles();
        
        // 安装依赖
        this.installDependencies();
        
        console.log('✅ 项目初始化完成！');
        this.showNextSteps();
    }

    /**
     * 检查必要目录
     */
    checkDirectories() {
        const requiredDirs = ['database', 'utils', 'html-files', 'static', 'templates'];
        
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`📁 创建目录: ${dir}`);
            }
        });
    }

    /**
     * 处理现有HTML文件
     */
    processExistingFiles() {
        console.log('📄 处理现有HTML文件...');
        
        // 查找根目录下的HTML文件
        const rootFiles = fs.readdirSync(this.projectRoot);
        const htmlFiles = rootFiles.filter(file => 
            file.endsWith('.html') && 
            file !== 'index.html' &&
            !file.startsWith('.')
        );
        
        if (htmlFiles.length === 0) {
            console.log('📝 未找到需要处理的HTML文件');
            return;
        }
        
        console.log(`🔍 找到 ${htmlFiles.length} 个HTML文件`);
        
        htmlFiles.forEach(file => {
            this.processHTMLFile(file);
        });
    }

    /**
     * 处理单个HTML文件
     * @param {string} filename - 文件名或相对路径
     */
    processHTMLFile(filename) {
        console.log(`⚙️ 处理文件: ${filename}`);
        
        // 检查是否已经是完整路径
        let filePath, jsonPath;
        if (path.isAbsolute(filename)) {
            filePath = filename;
            jsonPath = filename.replace('.html', '.json');
        } else {
            filePath = path.join(this.projectRoot, filename);
            jsonPath = path.join(this.projectRoot, filename.replace('.html', '.json'));
        }
        
        try {
            // 1. 合并CSS/JS
            console.log(`  🔄 合并CSS/JS...`);
            this.merger.processFile(filePath, true);
            
            // 2. 加密文件名并移动
            console.log(`  🔐 加密文件名...`);
            const encryptedName = this.encryptor.encryptFilename(filename);
            const newFileName = encryptedName + '.html';
            const newFilePath = path.join(this.projectRoot, 'html-files', newFileName);
            
            // 移动文件到html-files目录
            fs.renameSync(filePath, newFilePath);
            console.log(`  📁 移动文件: ${filename} -> html-files/${newFileName}`);
            
            // 3. 处理JSON描述文件
            if (fs.existsSync(jsonPath)) {
                console.log(`  📋 处理JSON描述文件...`);
                this.processJSONFile(jsonPath, newFileName, encryptedName);
            } else {
                console.log(`  ⚠️ 未找到JSON描述文件，创建基本记录...`);
                this.createBasicRecord(filename, newFileName, encryptedName);
            }
            
            console.log(`  ✅ 处理完成: ${filename}`);
            
        } catch (error) {
            console.error(`  ❌ 处理失败 ${filename}: ${error.message}`);
        }
    }

    /**
     * 处理JSON描述文件
     * @param {string} jsonPath - JSON文件路径
     * @param {string} newFileName - 新文件名
     * @param {string} encryptedName - 加密名称
     */
    processJSONFile(jsonPath, newFileName, encryptedName) {
        try {
            const jsonContent = fs.readFileSync(jsonPath, 'utf8');
            const fileInfo = JSON.parse(jsonContent);
            
            // 更新文件信息
            fileInfo.id = encryptedName;
            fileInfo.original_name = fileInfo.original_name || path.basename(jsonPath, '.json');
            fileInfo.file_size = fs.statSync(path.join(this.projectRoot, 'html-files', newFileName)).size;
            
            // 添加到数据库
            this.dbManager.addHTMLFile(fileInfo);
            
            // 移动JSON文件到database目录
            const newJsonPath = path.join(this.projectRoot, 'database', encryptedName + '.json');
            fs.renameSync(jsonPath, newJsonPath);
            console.log(`    📋 JSON文件已移动: database/${encryptedName}.json`);
            
        } catch (error) {
            console.error(`    ❌ 处理JSON文件失败: ${error.message}`);
        }
    }

    /**
     * 创建基本记录
     * @param {string} originalName - 原始文件名
     * @param {string} newFileName - 新文件名
     * @param {string} encryptedName - 加密名称
     */
    createBasicRecord(originalName, newFileName, encryptedName) {
        const fileInfo = {
            id: encryptedName,
            original_name: originalName,
            scene: '未分类场景',
            prompt: '待补充提示词',
            models: [
                {
                    name: '未知模型',
                    version: '未知版本',
                    performance: {
                        accuracy: 0,
                        efficiency: 0,
                        creativity: 0
                    }
                }
            ],
            tags: ['待分类'],
            category: '未分类',
            description: `自动生成的记录，原始文件名: ${originalName}`,
            file_size: fs.statSync(path.join(this.projectRoot, 'html-files', newFileName)).size,
            created_at: new Date().toISOString()
        };
        
        this.dbManager.addHTMLFile(fileInfo);
    }

    /**
     * 安装依赖
     */
    installDependencies() {
        console.log('📦 检查依赖...');
        
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.log('⚠️ 未找到package.json文件，跳过依赖安装');
            return;
        }
        
        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('📥 安装依赖包...');
            const { execSync } = require('child_process');
            try {
                execSync('npm install', { 
                    cwd: this.projectRoot,
                    stdio: 'inherit'
                });
                console.log('✅ 依赖安装完成');
            } catch (error) {
                console.error('❌ 依赖安装失败:', error.message);
            }
        } else {
            console.log('✅ 依赖已安装');
        }
    }

    /**
     * 显示后续步骤
     */
    showNextSteps() {
        console.log('\n🎯 后续步骤:');
        console.log('1. 运行 npm start 启动本地服务器');
        console.log('2. 访问 http://localhost:3000 查看管理界面');
        console.log('3. 使用以下命令管理项目:');
        console.log('   - npm run encrypt <文件/目录>  # 加密文件名');
        console.log('   - npm run merge <文件/目录>    # 合并CSS/JS');
        console.log('   - npm run db <命令>           # 数据库管理');
        console.log('\n📚 更多信息请查看 readme.md');
    }

    /**
     * 扫描并处理目录
     * @param {string} directory - 目录路径
     */
    scanDirectory(directory) {
        console.log(`🔍 扫描目录: ${directory}`);
        
        if (!fs.existsSync(directory)) {
            console.error(`❌ 目录不存在: ${directory}`);
            return;
        }
        
        const files = fs.readdirSync(directory);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        if (htmlFiles.length === 0) {
            console.log('📝 未找到HTML文件');
            return;
        }
        
        console.log(`🔍 找到 ${htmlFiles.length} 个HTML文件`);
        
        htmlFiles.forEach(file => {
            // 构建文件的完整路径
            const fullPath = path.join(directory, file);
            
            // 计算相对于项目根目录的路径
            let relativePath;
            if (directory === '.' || directory === this.projectRoot) {
                relativePath = file;
            } else {
                relativePath = path.relative(this.projectRoot, fullPath);
            }
            
            console.log(`处理文件: ${file}, 相对路径: ${relativePath}`);
            this.processHTMLFile(relativePath);
        });
    }

    /**
     * 创建模板文件
     */
    createTemplates() {
        console.log('📋 创建模板文件...');
        
        // HTML模板
        const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML模板</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>HTML模板</h1>
        <p>这是一个基本的HTML模板，您可以基于此进行开发。</p>
    </div>
</body>
</html>`;
        
        // JSON模板
        const jsonTemplate = `{
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
}`;
        
        try {
            fs.writeFileSync(path.join(this.projectRoot, 'templates', 'html-template.html'), htmlTemplate);
            fs.writeFileSync(path.join(this.projectRoot, 'templates', 'json-template.json'), jsonTemplate);
            console.log('✅ 模板文件创建完成');
        } catch (error) {
            console.error('❌ 创建模板文件失败:', error.message);
        }
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const initializer = new ProjectInitializer();
    
    switch (command) {
        case 'init':
            initializer.init();
            break;
            
        case 'scan':
            if (args.length < 2) {
                console.log('使用方法: node init-project.js scan <目录路径>');
                process.exit(1);
            }
            initializer.scanDirectory(args[1]);
            break;
            
        case 'templates':
            initializer.createTemplates();
            break;
            
        default:
            console.log('可用命令:');
            console.log('  init          - 初始化项目');
            console.log('  scan <目录>   - 扫描并处理目录中的HTML文件');
            console.log('  templates     - 创建模板文件');
            break;
    }
}

module.exports = ProjectInitializer;