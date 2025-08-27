/**
 * CSS/JS合并工具
 * 将分离的CSS和JS文件合并到HTML中
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class CSSJSMerger {
    constructor() {
        this.processedFiles = [];
        this.errors = [];
    }

    /**
     * 读取文件内容
     * @param {string} filePath - 文件路径
     * @returns {string} 文件内容
     */
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`无法读取文件 ${filePath}: ${error.message}`);
        }
    }

    /**
     * 写入文件内容
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`无法写入文件 ${filePath}: ${error.message}`);
        }
    }

    /**
     * 解析CSS链接
     * @param {string} href - CSS链接
     * @param {string} htmlFilePath - HTML文件路径
     * @returns {string} CSS文件路径
     */
    resolveCSSPath(href, htmlFilePath) {
        const htmlDir = path.dirname(htmlFilePath);
        const cssPath = path.resolve(htmlDir, href);
        
        if (!fs.existsSync(cssPath)) {
            throw new Error(`CSS文件不存在: ${cssPath}`);
        }
        
        return cssPath;
    }

    /**
     * 解析JS链接
     * @param {string} src - JS链接
     * @param {string} htmlFilePath - HTML文件路径
     * @returns {string} JS文件路径
     */
    resolveJSPath(src, htmlFilePath) {
        const htmlDir = path.dirname(htmlFilePath);
        const jsPath = path.resolve(htmlDir, src);
        
        if (!fs.existsSync(jsPath)) {
            throw new Error(`JS文件不存在: ${jsPath}`);
        }
        
        return jsPath;
    }

    /**
     * 合并CSS到HTML
     * @param {string} htmlContent - HTML内容
     * @param {string} htmlFilePath - HTML文件路径
     * @returns {string} 处理后的HTML内容
     */
    mergeCSS(htmlContent, htmlFilePath) {
        const $ = cheerio.load(htmlContent);
        
        // 查找所有CSS链接
        $('link[rel="stylesheet"]').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                try {
                    const cssPath = this.resolveCSSPath(href, htmlFilePath);
                    const cssContent = this.readFile(cssPath);
                    
                    // 创建style标签
                    const styleTag = `<style>\n/* ${href} */\n${cssContent}\n</style>`;
                    
                    // 替换link标签
                    $(element).replaceWith(styleTag);
                    
                    console.log(`已合并CSS文件: ${href}`);
                } catch (error) {
                    console.error(`合并CSS失败 ${href}: ${error.message}`);
                    this.errors.push({
                        type: 'css',
                        file: href,
                        error: error.message
                    });
                }
            }
        });
        
        return $.html();
    }

    /**
     * 合并JS到HTML
     * @param {string} htmlContent - HTML内容
     * @param {string} htmlFilePath - HTML文件路径
     * @returns {string} 处理后的HTML内容
     */
    mergeJS(htmlContent, htmlFilePath) {
        const $ = cheerio.load(htmlContent);
        
        // 查找所有JS脚本
        $('script[src]').each((index, element) => {
            const src = $(element).attr('src');
            if (src) {
                try {
                    const jsPath = this.resolveJSPath(src, htmlFilePath);
                    const jsContent = this.readFile(jsPath);
                    
                    // 创建script标签
                    const scriptTag = `<script>\n// ${src}\n${jsContent}\n</script>`;
                    
                    // 替换script标签
                    $(element).replaceWith(scriptTag);
                    
                    console.log(`已合并JS文件: ${src}`);
                } catch (error) {
                    console.error(`合并JS失败 ${src}: ${error.message}`);
                    this.errors.push({
                        type: 'js',
                        file: src,
                        error: error.message
                    });
                }
            }
        });
        
        return $.html();
    }

    /**
     * 处理单个HTML文件
     * @param {string} htmlFilePath - HTML文件路径
     * @param {boolean} backup - 是否创建备份
     * @returns {boolean} 处理结果
     */
    processFile(htmlFilePath, backup = true) {
        try {
            // 创建备份
            if (backup) {
                const backupPath = htmlFilePath + '.backup';
                const originalContent = this.readFile(htmlFilePath);
                this.writeFile(backupPath, originalContent);
                console.log(`已创建备份文件: ${backupPath}`);
            }
            
            // 读取HTML内容
            let htmlContent = this.readFile(htmlFilePath);
            
            // 合并CSS
            htmlContent = this.mergeCSS(htmlContent, htmlFilePath);
            
            // 合并JS
            htmlContent = this.mergeJS(htmlContent, htmlFilePath);
            
            // 写入处理后的HTML
            this.writeFile(htmlFilePath, htmlContent);
            
            this.processedFiles.push(htmlFilePath);
            console.log(`处理完成: ${htmlFilePath}`);
            
            return true;
        } catch (error) {
            console.error(`处理文件失败 ${htmlFilePath}: ${error.message}`);
            this.errors.push({
                type: 'file',
                file: htmlFilePath,
                error: error.message
            });
            return false;
        }
    }

    /**
     * 处理目录中的所有HTML文件
     * @param {string} directory - 目录路径
     * @param {boolean} backup - 是否创建备份
     * @returns {Object} 处理结果
     */
    processDirectory(directory, backup = true) {
        const results = {
            processed: [],
            errors: [],
            totalFiles: 0
        };

        try {
            const files = fs.readdirSync(directory);
            
            files.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.htm')) {
                    results.totalFiles++;
                    const filePath = path.join(directory, file);
                    
                    if (this.processFile(filePath, backup)) {
                        results.processed.push(file);
                    }
                }
            });
            
            results.errors = [...this.errors];
            
        } catch (error) {
            results.errors.push({
                type: 'directory',
                file: directory,
                error: error.message
            });
        }

        return results;
    }

    /**
     * 清理备份文件
     * @param {string} directory - 目录路径
     */
    cleanBackups(directory) {
        try {
            const files = fs.readdirSync(directory);
            
            files.forEach(file => {
                if (file.endsWith('.backup')) {
                    const backupPath = path.join(directory, file);
                    fs.unlinkSync(backupPath);
                    console.log(`已删除备份文件: ${backupPath}`);
                }
            });
        } catch (error) {
            console.error(`清理备份文件失败: ${error.message}`);
        }
    }

    /**
     * 获取处理统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return {
            processedFiles: this.processedFiles.length,
            errors: this.errors.length,
            errorDetails: this.errors
        };
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('使用方法:');
        console.log('  node merge-css-js.js <文件或目录路径> [backup]');
        console.log('  backup: true/false (默认: true)');
        process.exit(1);
    }
    
    const target = args[0];
    const backup = args[1] !== 'false';
    
    const merger = new CSSJSMerger();
    
    if (fs.existsSync(target)) {
        if (fs.statSync(target).isDirectory()) {
            const results = merger.processDirectory(target, backup);
            console.log('\n处理结果:');
            console.log(`总文件数: ${results.totalFiles}`);
            console.log(`成功处理: ${results.processed.length}`);
            console.log(`错误数量: ${results.errors.length}`);
            
            if (results.errors.length > 0) {
                console.log('\n错误详情:');
                results.errors.forEach(err => {
                    console.log(`  ${err.type} - ${err.file}: ${err.error}`);
                });
            }
        } else {
            if (merger.processFile(target, backup)) {
                console.log('文件处理成功');
            } else {
                console.log('文件处理失败');
            }
        }
        
        const stats = merger.getStats();
        console.log('\n统计信息:');
        console.log(`处理文件数: ${stats.processedFiles}`);
        console.log(`错误数: ${stats.errors}`);
    } else {
        console.error('文件或目录不存在:', target);
    }
}

module.exports = CSSJSMerger;