/**
 * 数据库管理工具
 * 管理HTML文件的元数据、标签系统和检索功能
 */

const fs = require('fs');
const path = require('path');
const FilenameEncryptor = require('./encrypt-filename');

class DatabaseManager {
    constructor(dataPath = null, schemaPath = null) {
        this.dataPath = dataPath || path.join(__dirname, '../database/data.json');
        this.schemaPath = schemaPath || path.join(__dirname, '../database/schema.json');
        this.encryptor = new FilenameEncryptor();
        
        this.loadData();
        this.loadSchema();
    }

    /**
     * 加载数据文件
     */
    loadData() {
        try {
            const dataContent = fs.readFileSync(this.dataPath, 'utf8');
            this.data = JSON.parse(dataContent);
        } catch (error) {
            console.error('加载数据文件失败:', error.message);
            this.data = this.createDefaultData();
        }
    }

    /**
     * 加载schema文件
     */
    loadSchema() {
        try {
            const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
            this.schema = JSON.parse(schemaContent);
        } catch (error) {
            console.error('加载schema文件失败:', error.message);
            this.schema = this.createDefaultSchema();
        }
    }

    /**
     * 创建默认数据结构
     * @returns {Object} 默认数据
     */
    createDefaultData() {
        return {
            version: "1.0",
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            html_files: [],
            statistics: {
                total_files: 0,
                total_size: 0,
                total_access: 0,
                categories: {},
                tags: {},
                models: {}
            },
            settings: {
                auto_encrypt: true,
                backup_enabled: true,
                max_file_size: 10485760,
                allowed_extensions: [".html", ".htm"],
                encryption_length: 32
            }
        };
    }

    /**
     * 创建默认schema
     * @returns {Object} 默认schema
     */
    createDefaultSchema() {
        return {
            schema_version: "1.0",
            description: "OpenOneHTML项目数据库结构定义",
            tables: {
                html_files: {
                    fields: {
                        id: { type: "string", required: true },
                        original_name: { type: "string", required: true },
                        scene: { type: "string", required: true },
                        prompt: { type: "string", required: true },
                        models: { type: "array", required: true },
                        tags: { type: "array" },
                        category: { type: "string" },
                        description: { type: "string" },
                        file_size: { type: "number" },
                        created_at: { type: "string" },
                        updated_at: { type: "string" },
                        access_count: { type: "number", default: 0 },
                        rating: { type: "number", default: 0 }
                    }
                }
            }
        };
    }

    /**
     * 保存数据
     */
    saveData() {
        try {
            this.data.last_updated = new Date().toISOString();
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('保存数据失败:', error.message);
            return false;
        }
    }

    /**
     * 添加HTML文件记录
     * @param {Object} fileInfo - 文件信息
     * @returns {boolean} 添加结果
     */
    addHTMLFile(fileInfo) {
        try {
            // 验证必需字段
            const requiredFields = ['original_name', 'scene', 'prompt', 'models'];
            for (const field of requiredFields) {
                if (!fileInfo[field]) {
                    throw new Error(`缺少必需字段: ${field}`);
                }
            }

            // 生成ID
            const id = fileInfo.id || this.encryptor.encryptFilename(fileInfo.original_name);
            
            // 创建记录
            const record = {
                id: id,
                original_name: fileInfo.original_name,
                scene: fileInfo.scene,
                prompt: fileInfo.prompt,
                models: fileInfo.models || [],
                tags: fileInfo.tags || [],
                category: fileInfo.category || '未分类',
                description: fileInfo.description || '',
                file_size: fileInfo.file_size || 0,
                created_at: fileInfo.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                access_count: fileInfo.access_count || 0,
                rating: fileInfo.rating || 0,
                compatibility: fileInfo.compatibility || {}
            };

            // 检查是否已存在
            const existingIndex = this.data.html_files.findIndex(f => f.id === id);
            if (existingIndex >= 0) {
                // 更新现有记录
                this.data.html_files[existingIndex] = record;
                console.log(`已更新文件记录: ${fileInfo.original_name}`);
            } else {
                // 添加新记录
                this.data.html_files.push(record);
                console.log(`已添加文件记录: ${fileInfo.original_name}`);
            }

            // 更新统计信息
            this.updateStatistics();
            
            // 保存数据
            return this.saveData();
        } catch (error) {
            console.error('添加HTML文件记录失败:', error.message);
            return false;
        }
    }

    /**
     * 从JSON文件添加HTML文件记录
     * @param {string} jsonFilePath - JSON文件路径
     * @returns {boolean} 添加结果
     */
    addHTMLFileFromJSON(jsonFilePath) {
        try {
            if (!fs.existsSync(jsonFilePath)) {
                throw new Error(`JSON文件不存在: ${jsonFilePath}`);
            }

            const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
            const fileInfo = JSON.parse(jsonContent);
            
            return this.addHTMLFile(fileInfo);
        } catch (error) {
            console.error('从JSON文件添加记录失败:', error.message);
            return false;
        }
    }

    /**
     * 搜索HTML文件
     * @param {Object} filters - 过滤条件
     * @returns {Array} 搜索结果
     */
    searchHTMLFiles(filters = {}) {
        let results = [...this.data.html_files];

        // 按场景过滤
        if (filters.scene) {
            results = results.filter(file => 
                file.scene.toLowerCase().includes(filters.scene.toLowerCase())
            );
        }

        // 按分类过滤
        if (filters.category) {
            results = results.filter(file => 
                file.category.toLowerCase().includes(filters.category.toLowerCase())
            );
        }
        
        // 按标签过滤
        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(file => 
                filters.tags.some(tag => 
                    file.tags.some(fileTag => 
                        fileTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        // 按模型过滤
        if (filters.model) {
            results = results.filter(file => 
                file.models.some(model => 
                    model.name.toLowerCase().includes(filters.model.toLowerCase())
                )
            );
        }

        // 按描述过滤
        if (filters.description) {
            results = results.filter(file => 
                file.description.toLowerCase().includes(filters.description.toLowerCase())
            );
        }

        return results;
    }

    /**
     * 获取所有标签
     * @returns {Array} 标签列表
     */
    getAllTags() {
        const tagSet = new Set();
        
        this.data.html_files.forEach(file => {
            file.tags.forEach(tag => tagSet.add(tag));
        });
        
        return Array.from(tagSet).sort();
    }

    /**
     * 获取所有分类
     * @returns {Array} 分类列表
     */
    getAllCategories() {
        const categorySet = new Set();
        
        this.data.html_files.forEach(file => {
            categorySet.add(file.category);
        });
        
        return Array.from(categorySet).sort();
    }

    /**
     * 获取所有模型
     * @returns {Array} 模型列表
     */
    getAllModels() {
        const modelSet = new Set();
        
        this.data.html_files.forEach(file => {
            file.models.forEach(model => {
                modelSet.add(model.name);
            });
        });
        
        return Array.from(modelSet).sort();
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        const stats = this.data.statistics;
        
        // 基础统计
        stats.total_files = this.data.html_files.length;
        stats.total_size = this.data.html_files.reduce((sum, file) => sum + (file.file_size || 0), 0);
        stats.total_access = this.data.html_files.reduce((sum, file) => sum + (file.access_count || 0), 0);
        
        // 分类统计
        stats.categories = {};
        this.data.html_files.forEach(file => {
            const category = file.category || '未分类';
            stats.categories[category] = (stats.categories[category] || 0) + 1;
        });
        
        // 标签统计（使用次数）
        stats.tags = {};
        this.data.html_files.forEach(file => {
            file.tags.forEach(tag => {
                stats.tags[tag] = (stats.tags[tag] || 0) + 1;
            });
        });
        
        // 模型统计（使用次数）
        stats.models = {};
        this.data.html_files.forEach(file => {
            file.models.forEach(model => {
                const modelName = model.name;
                stats.models[modelName] = (stats.models[modelName] || 0) + 1;
            });
        });
        
        // 添加标签和模型总数统计
        stats.total_tags = Object.keys(stats.tags).length;
        stats.total_models = Object.keys(stats.models).length;
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        return this.data.statistics;
    }

    /**
     * 删除HTML文件记录
     * @param {string} id - 文件ID
     * @returns {boolean} 删除结果
     */
    deleteHTMLFile(id) {
        try {
            const index = this.data.html_files.findIndex(f => f.id === id);
            if (index >= 0) {
                const deletedFile = this.data.html_files.splice(index, 1)[0];
                console.log(`已删除文件记录: ${deletedFile.original_name}`);
                
                // 更新统计信息
                this.updateStatistics();
                
                // 保存数据
                return this.saveData();
            } else {
                console.log(`未找到文件记录: ${id}`);
                return false;
            }
        } catch (error) {
            console.error('删除HTML文件记录失败:', error.message);
            return false;
        }
    }

    /**
     * 导出数据
     * @param {string} exportPath - 导出路径
     * @returns {boolean} 导出结果
     */
    exportData(exportPath) {
        try {
            const exportData = {
                exported_at: new Date().toISOString(),
                data: this.data
            };
            
            fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
            console.log(`数据已导出到: ${exportPath}`);
            return true;
        } catch (error) {
            console.error('导出数据失败:', error.message);
            return false;
        }
    }

    /**
     * 导入数据
     * @param {string} importPath - 导入路径
     * @returns {boolean} 导入结果
     */
    importData(importPath) {
        try {
            const importContent = fs.readFileSync(importPath, 'utf8');
            const importData = JSON.parse(importContent);
            
            if (importData.data) {
                this.data = importData.data;
                console.log(`数据已从 ${importPath} 导入`);
                
                // 更新统计信息
                this.updateStatistics();
                
                // 保存数据
                return this.saveData();
            } else {
                throw new Error('导入数据格式不正确');
            }
        } catch (error) {
            console.error('导入数据失败:', error.message);
            return false;
        }
    }

    /**
     * 编辑标签 - 重命名标签并同步更新所有记录
     * @param {string} oldTagName - 旧标签名
     * @param {string} newTagName - 新标签名
     * @returns {boolean} 编辑结果
     */
    editTag(oldTagName, newTagName) {
        try {
            if (!oldTagName || !newTagName) {
                throw new Error('标签名不能为空');
            }
            
            if (oldTagName === newTagName) {
                throw new Error('新旧标签名相同');
            }
            
            let updatedCount = 0;
            
            // 遍历所有文件，更新标签
            this.data.html_files.forEach(file => {
                if (file.tags && file.tags.includes(oldTagName)) {
                    // 替换标签
                    const index = file.tags.indexOf(oldTagName);
                    file.tags[index] = newTagName;
                    file.updated_at = new Date().toISOString();
                    updatedCount++;
                }
            });
            
            if (updatedCount === 0) {
                console.log(`未找到使用标签 "${oldTagName}" 的文件`);
                return false;
            }
            
            console.log(`已将标签 "${oldTagName}" 更新为 "${newTagName}"，影响了 ${updatedCount} 个文件`);
            
            // 更新统计信息
            this.updateStatistics();
            
            // 保存数据
            return this.saveData();
        } catch (error) {
            console.error('编辑标签失败:', error.message);
            return false;
        }
    }

    /**
     * 删除HTML文件（包括记录和实际文件）
     * @param {string} id - 文件ID
     * @param {string} password - 删除密码
     * @returns {Object} 删除结果
     */
    deleteHTMLFileWithPassword(id, password) {
        try {
            // 验证密码
            const deletePassword = process.env.DELETE_PASSWORD || 'wind';
            if (password !== deletePassword) {
                return {
                    success: false,
                    error: '密码错误'
                };
            }
            
            // 查找文件记录
            const index = this.data.html_files.findIndex(f => f.id === id);
            if (index < 0) {
                return {
                    success: false,
                    error: '未找到文件记录'
                };
            }
            
            const deletedFile = this.data.html_files[index];
            
            // 删除实际HTML文件
            const htmlFilePath = path.join(__dirname, '../html-files', `${id}.html`);
            if (fs.existsSync(htmlFilePath)) {
                fs.unlinkSync(htmlFilePath);
                console.log(`已删除HTML文件: ${htmlFilePath}`);
            }
            
            // 删除JSON元数据文件
            const jsonFilePath = path.join(__dirname, '../database', `${id}.json`);
            if (fs.existsSync(jsonFilePath)) {
                fs.unlinkSync(jsonFilePath);
                console.log(`已删除JSON文件: ${jsonFilePath}`);
            }
            
            // 从数据库中删除记录
            this.data.html_files.splice(index, 1);
            console.log(`已删除文件记录: ${deletedFile.original_name}`);
            
            // 更新统计信息
            this.updateStatistics();
            
            // 保存数据
            const saveResult = this.saveData();
            
            return {
                success: saveResult,
                message: `成功删除文件: ${deletedFile.original_name}`,
                deletedFile: deletedFile
            };
        } catch (error) {
            console.error('删除HTML文件失败:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const dbManager = new DatabaseManager();
    
    switch (command) {
        case 'add':
            if (args.length < 2) {
                console.log('使用方法: node database-manager.js add <json文件路径>');
                process.exit(1);
            }
            dbManager.addHTMLFileFromJSON(args[1]);
            break;
            
        case 'search':
            const filters = {};
            if (args[2]) filters.scene = args[2];
            if (args[3]) filters.category = args[3];
            
            const results = dbManager.searchHTMLFiles(filters);
            console.log('搜索结果:');
            results.forEach(file => {
                console.log(`- ${file.original_name} (${file.category})`);
            });
            break;
            
        case 'stats':
            const stats = dbManager.getStatistics();
            console.log('统计信息:');
            console.log(`总文件数: ${stats.total_files}`);
            console.log(`总大小: ${stats.total_size} bytes`);
            console.log(`总访问量: ${stats.total_access}`);
            console.log('分类:', Object.keys(stats.categories));
            console.log('标签:', Object.keys(stats.tags));
            console.log('模型:', Object.keys(stats.models));
            break;
            
        case 'export':
            if (args.length < 2) {
                console.log('使用方法: node database-manager.js export <导出路径>');
                process.exit(1);
            }
            dbManager.exportData(args[1]);
            break;
            
        case 'import':
            if (args.length < 2) {
                console.log('使用方法: node database-manager.js import <导入路径>');
                process.exit(1);
            }
            dbManager.importData(args[1]);
            break;
            
        default:
            console.log('可用命令:');
            console.log('  add <json文件路径> - 添加HTML文件记录');
            console.log('  search [场景] [分类] - 搜索HTML文件');
            console.log('  stats - 显示统计信息');
            console.log('  export <导出路径> - 导出数据');
            console.log('  import <导入路径> - 导入数据');
            break;
    }
}

module.exports = DatabaseManager;