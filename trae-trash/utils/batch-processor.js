const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./database-manager');
const crypto = require('crypto');

class BatchProcessor {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.htmlFilesDir = path.join(__dirname, '..', 'html-files');
        this.databaseDir = path.join(__dirname, '..', 'database');
    }

    /**
     * 批量处理JSON配置文件
     * @param {string} configDir - 包含JSON配置文件的目录路径
     * @param {string} htmlDir - 包含对应HTML文件的目录路径
     */
    async processBatch(configDir, htmlDir) {
        try {
            console.log('🚀 开始批量处理...');
            
            // 确保目录存在
            if (!fs.existsSync(configDir)) {
                throw new Error(`配置目录不存在: ${configDir}`);
            }
            
            if (!fs.existsSync(htmlDir)) {
                throw new Error(`HTML文件目录不存在: ${htmlDir}`);
            }

            // 读取所有JSON配置文件
            const configFiles = fs.readdirSync(configDir)
                .filter(file => file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(configDir, file)
                }));

            if (configFiles.length === 0) {
                console.log('⚠️  没有找到JSON配置文件');
                return;
            }

            console.log(`📁 找到 ${configFiles.length} 个配置文件`);

            // 处理每个配置文件
            const results = [];
            for (const configFile of configFiles) {
                try {
                    const result = await this.processConfigFile(configFile, htmlDir);
                    results.push({
                        file: configFile.name,
                        success: true,
                        result: result
                    });
                    console.log(`✅ 成功处理: ${configFile.name}`);
                } catch (error) {
                    results.push({
                        file: configFile.name,
                        success: false,
                        error: error.message
                    });
                    console.error(`❌ 处理失败: ${configFile.name} - ${error.message}`);
                }
            }

            // 输出处理结果
            console.log('\n📊 处理结果汇总:');
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.filter(r => !r.success).length;
            
            console.log(`✅ 成功: ${successCount} 个文件`);
            console.log(`❌ 失败: ${failureCount} 个文件`);
            
            if (failureCount > 0) {
                console.log('\n失败的文件:');
                results.filter(r => !r.success).forEach(r => {
                    console.log(`  - ${r.file}: ${r.error}`);
                });
            }

            return results;
        } catch (error) {
            console.error('❌ 批量处理失败:', error.message);
            throw error;
        }
    }

    /**
     * 处理单个配置文件
     * @param {Object} configFile - 配置文件信息
     * @param {string} htmlDir - HTML文件目录
     */
    async processConfigFile(configFile, htmlDir) {
        // 读取配置文件
        const configContent = fs.readFileSync(configFile.path, 'utf8');
        const config = JSON.parse(configContent);

        // 验证配置文件格式
        this.validateConfig(config);

        // 查找对应的HTML文件
        const htmlFileName = config.original_name;
        const htmlFilePath = path.join(htmlDir, htmlFileName);
        
        if (!fs.existsSync(htmlFilePath)) {
            throw new Error(`找不到对应的HTML文件: ${htmlFileName}`);
        }

        // 生成加密文件名
        const encryptedName = this.encryptFilename(htmlFileName);
        const targetHtmlPath = path.join(this.htmlFilesDir, `${encryptedName}.html`);
        
        // 复制HTML文件到目标目录
        fs.copyFileSync(htmlFilePath, targetHtmlPath);
        
        // 创建数据库记录
        const dbRecord = {
            id: encryptedName,
            original_name: config.original_name,
            scene: config.scene,
            prompt: config.prompt,
            models: config.models || [],
            tags: config.tags || [],
            category: config.category || '未分类',
            description: config.description || '',
            features: config.features || [],
            created_at: config.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 保存数据库记录
        const dbPath = path.join(this.databaseDir, `${encryptedName}.json`);
        fs.writeFileSync(dbPath, JSON.stringify(dbRecord, null, 2));

        return {
            encryptedName,
            originalName: htmlFileName,
            targetPath: targetHtmlPath,
            dbPath: dbPath
        };
    }

    /**
     * 验证配置文件格式
     * @param {Object} config - 配置对象
     */
    validateConfig(config) {
        const requiredFields = ['original_name', 'scene', 'prompt'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`缺少必需字段: ${field}`);
            }
        }

        if (!Array.isArray(config.models)) {
            throw new Error('models字段必须是数组');
        }

        if (!Array.isArray(config.tags)) {
            throw new Error('tags字段必须是数组');
        }
    }

    /**
     * 加密文件名
     * @param {string} filename - 原始文件名
     * @returns {string} 加密后的文件名
     */
    encryptFilename(filename) {
        return crypto.createHash('md5').update(filename).digest('hex');
    }

    /**
     * 交互式批量处理
     */
    async interactiveBatchProcess() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            console.log('🎯 批量处理向导\n');
            
            // 询问配置文件目录
            const configDir = await new Promise(resolve => {
                rl.question('请输入JSON配置文件目录路径 (默认: ./batch-configs): ', answer => {
                    resolve(answer.trim() || './batch-configs');
                });
            });

            // 询问HTML文件目录
            const htmlDir = await new Promise(resolve => {
                rl.question('请输入HTML文件目录路径 (默认: ./batch-html): ', answer => {
                    resolve(answer.trim() || './batch-html');
                });
            });

            rl.close();
            
            // 执行批量处理
            await this.processBatch(configDir, htmlDir);
            
            console.log('\n🎉 批量处理完成！');
            console.log('💡 提示: 请重启服务器以查看新添加的文件');
        } catch (error) {
            console.error('❌ 交互式处理失败:', error.message);
            rl.close();
            process.exit(1);
        }
    }
}

// 命令行入口
if (require.main === module) {
    const processor = new BatchProcessor();
    
    if (process.argv.includes('--interactive') || process.argv.includes('-i')) {
        // 交互式模式
        processor.interactiveBatchProcess();
    } else if (process.argv.length >= 4) {
        // 命令行参数模式
        const configDir = process.argv[2];
        const htmlDir = process.argv[3];
        
        processor.processBatch(configDir, htmlDir)
            .then(() => {
                console.log('\n🎉 批量处理完成！');
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ 批量处理失败:', error.message);
                process.exit(1);
            });
    } else {
        // 显示帮助信息
        console.log('📋 OpenOneHTML 批量处理工具\n');
        console.log('用法:');
        console.log('  1. 交互式模式:');
        console.log('     node utils/batch-processor.js --interactive');
        console.log('     node utils/batch-processor.js -i\n');
        console.log('  2. 命令行参数模式:');
        console.log('     node utils/batch-processor.js <配置文件目录> <HTML文件目录>\n');
        console.log('示例:');
        console.log('     node utils/batch-processor.js ./batch-configs ./batch-html\n');
        console.log('说明:');
        console.log('  - 配置文件目录: 包含批量生成的JSON配置文件');
        console.log('  - HTML文件目录: 包含对应的HTML源文件');
        console.log('  - 工具会自动处理文件复制、加密和数据库记录创建');
    }
}

module.exports = BatchProcessor;