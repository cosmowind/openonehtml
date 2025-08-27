/**
 * 简化配置转换工具
 * 将简化的YAML配置转换为完整的JSON格式
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class SimpleConfigConverter {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.presets = {
            background_requirements: {
                "网页应用开发": {
                    category: "网页应用",
                    tags: ["网页", "应用", "开发"],
                    description: "用于创建功能完整的网页应用程序"
                },
                "移动端界面": {
                    category: "移动端",
                    tags: ["移动端", "界面", "响应式"],
                    description: "专门为移动设备设计的用户界面"
                },
                "数据可视化": {
                    category: "数据展示",
                    tags: ["数据", "可视化", "图表"],
                    description: "将数据以图表形式展示的应用"
                },
                "交互原型": {
                    category: "原型设计",
                    tags: ["原型", "交互", "设计"],
                    description: "用于演示交互逻辑的原型界面"
                },
                "教学演示": {
                    category: "教育工具",
                    tags: ["教学", "演示", "教育"],
                    description: "用于教学和演示目的的HTML文件"
                }
            },
            prompts: {
                "创建一个响应式网页应用": "创建一个响应式网页应用，包含现代化的UI设计和良好的用户体验",
                "设计一个移动端友好的界面": "设计一个移动端友好的界面，确保在各种设备上都有良好的显示效果",
                "开发一个数据可视化仪表板": "开发一个数据可视化仪表板，能够清晰地展示各种数据指标",
                "制作一个交互式原型": "制作一个交互式原型，用于演示产品的核心功能和用户流程",
                "创建一个教学演示页面": "创建一个教学演示页面，用于展示特定的概念或技术",
                "构建一个单页应用(SPA)": "构建一个单页应用，具有流畅的用户体验和快速的页面切换",
                "设计一个电商网站界面": "设计一个电商网站界面，包含商品展示、购物车和用户功能",
                "开发一个社交媒体组件": "开发一个社交媒体组件，支持用户互动和内容分享"
            },
            models: {
                "Human Developer": {
                    version: "1.0.0",
                    performance: {
                        accuracy: 95,
                        efficiency: 90,
                        creativity: 85
                    }
                },
                "AI Assistant": {
                    version: "1.0.0",
                    performance: {
                        accuracy: 85,
                        efficiency: 95,
                        creativity: 90
                    }
                },
                "Code Generator": {
                    version: "1.0.0",
                    performance: {
                        accuracy: 90,
                        efficiency: 85,
                        creativity: 75
                    }
                },
                "UI Designer": {
                    version: "1.0.0",
                    performance: {
                        accuracy: 80,
                        efficiency: 90,
                        creativity: 95
                    }
                },
                "Frontend Expert": {
                    version: "1.0.0",
                    performance: {
                        accuracy: 95,
                        efficiency: 85,
                        creativity: 90
                    }
                }
            }
        };
    }

    /**
     * 转换简化配置为完整JSON
     * @param {string} yamlPath - YAML配置文件路径
     * @param {string} htmlFileName - HTML文件名
     * @returns {object} 完整的JSON配置
     */
    convertConfig(yamlPath, htmlFileName) {
        try {
            // 读取YAML文件
            const yamlContent = fs.readFileSync(yamlPath, 'utf8');
            const config = yaml.load(yamlContent);

            // 获取预设信息
            const bgPreset = this.presets.background_requirements[config.background_requirements.preset] || {};
            const promptText = config.prompt.custom || this.presets.prompts[config.prompt.preset] || config.prompt.preset;

            // 处理开发模型
            const models = config.development_models.map(model => {
                const presetModel = this.presets.models[model.name];
                return {
                    name: model.name,
                    version: model.version || (presetModel ? presetModel.version : "1.0.0"),
                    performance: {
                        accuracy: model.performance?.accuracy || (presetModel ? presetModel.performance.accuracy : 80),
                        efficiency: model.performance?.efficiency || (presetModel ? presetModel.performance.efficiency : 80),
                        creativity: model.performance?.creativity || (presetModel ? presetModel.performance.creativity : 80)
                    }
                };
            });

            // 构建完整JSON
            const fullConfig = {
                original_name: htmlFileName,
                scene: config.background_requirements.custom || config.background_requirements.preset,
                prompt: promptText,
                models: models,
                tags: config.optional_info?.tags || bgPreset.tags || ["未分类"],
                category: config.optional_info?.category || bgPreset.category || "未分类",
                description: config.optional_info?.description || bgPreset.description || "自动生成的描述",
                features: this.generateFeatures(config),
                complexity: this.estimateComplexity(config),
                estimated_time: this.estimateTime(config),
                created_date: new Date().toISOString().split('T')[0],
                last_modified: new Date().toISOString().split('T')[0],
                author: "OpenOneHTML User",
                license: "MIT",
                access_count: 0,
                rating: 0,
                comments: []
            };

            return fullConfig;

        } catch (error) {
            console.error('转换配置失败:', error.message);
            throw error;
        }
    }

    /**
     * 生成功能特点列表
     * @param {object} config - 配置对象
     * @returns {array} 功能特点列表
     */
    generateFeatures(config) {
        const features = [];
        
        // 根据背景需求添加功能
        const bgFeatures = {
            "网页应用开发": ["响应式设计", "用户界面", "交互功能"],
            "移动端界面": ["移动端适配", "触摸交互", "响应式布局"],
            "数据可视化": ["图表展示", "数据处理", "交互式图表"],
            "交互原型": ["原型设计", "用户流程", "交互演示"],
            "教学演示": ["教学内容", "演示功能", "学习辅助"]
        };

        const bgKey = config.background_requirements.preset;
        if (bgFeatures[bgKey]) {
            features.push(...bgFeatures[bgKey]);
        }

        // 根据提示词添加功能
        if (config.prompt.preset.includes("响应式")) {
            features.push("响应式布局");
        }
        if (config.prompt.preset.includes("数据")) {
            features.push("数据处理");
        }
        if (config.prompt.preset.includes("交互")) {
            features.push("交互功能");
        }

        return features.length > 0 ? features : ["基础功能"];
    }

    /**
     * 估算复杂度
     * @param {object} config - 配置对象
     * @returns {string} 复杂度
     */
    estimateComplexity(config) {
        const complexityMap = {
            "网页应用开发": "中等",
            "移动端界面": "中等",
            "数据可视化": "复杂",
            "交互原型": "简单",
            "教学演示": "简单"
        };

        return complexityMap[config.background_requirements.preset] || "中等";
    }

    /**
     * 估算时间
     * @param {object} config - 配置对象
     * @returns {string} 预估时间
     */
    estimateTime(config) {
        const timeMap = {
            "网页应用开发": "30分钟",
            "移动端界面": "20分钟",
            "数据可视化": "45分钟",
            "交互原型": "15分钟",
            "教学演示": "10分钟"
        };

        return timeMap[config.background_requirements.preset] || "20分钟";
    }

    /**
     * 创建配置文件
     * @param {string} yamlPath - YAML配置文件路径
     * @param {string} htmlFileName - HTML文件名
     */
    createConfigFile(yamlPath, htmlFileName) {
        try {
            const fullConfig = this.convertConfig(yamlPath, htmlFileName);
            const jsonPath = path.join(path.dirname(yamlPath), htmlFileName.replace('.html', '.json'));
            
            fs.writeFileSync(jsonPath, JSON.stringify(fullConfig, null, 2));
            console.log(`✅ 配置文件已创建: ${jsonPath}`);
            
            return jsonPath;
        } catch (error) {
            console.error('创建配置文件失败:', error.message);
            throw error;
        }
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log('\n📋 OpenOneHTML 简化配置工具使用指南');
        console.log('=====================================');
        console.log('\n🚀 快速开始:');
        console.log('1. 复制模板文件: cp templates/simple-config.yaml my-config.yaml');
        console.log('2. 编辑配置文件: 修改 my-config.yaml 中的三个核心分类');
        console.log('3. 转换配置: node utils/simple-config.js my-config.yaml my-file.html');
        console.log('\n📝 配置文件结构:');
        console.log('- background_requirements: 背景需求 (预设+自定义)');
        console.log('- prompt: 提示词 (预设+自定义)');
        console.log('- development_models: 开发模型 (可选择多个)');
        console.log('\n🎯 预设选项:');
        console.log('背景需求: 网页应用开发、移动端界面、数据可视化、交互原型、教学演示');
        console.log('提示词: 响应式网页应用、移动端界面、数据可视化、交互原型、教学演示等');
        console.log('开发模型: Human Developer、AI Assistant、Code Generator、UI Designer、Frontend Expert');
    }
}

// 命令行使用
if (require.main === module) {
    const converter = new SimpleConfigConverter();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        converter.showHelp();
        process.exit(0);
    }
    
    if (args.length !== 2) {
        console.error('❌ 使用方法: node simple-config.js <yaml配置文件> <html文件名>');
        console.error('示例: node simple-config.js my-config.yaml my-file.html');
        process.exit(1);
    }
    
    const [yamlPath, htmlFileName] = args;
    
    if (!fs.existsSync(yamlPath)) {
        console.error(`❌ 配置文件不存在: ${yamlPath}`);
        process.exit(1);
    }
    
    if (!htmlFileName.endsWith('.html')) {
        console.error('❌ HTML文件名必须以.html结尾');
        process.exit(1);
    }
    
    try {
        converter.createConfigFile(yamlPath, htmlFileName);
        console.log('\n🎉 配置转换完成！现在可以运行初始化工具:');
        console.log('node utils/init-project.js init');
    } catch (error) {
        console.error('❌ 转换失败:', error.message);
        process.exit(1);
    }
}

module.exports = SimpleConfigConverter;