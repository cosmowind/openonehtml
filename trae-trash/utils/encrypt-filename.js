/**
 * 文件名加密工具
 * 将HTML文件名加密为32位随机字符串
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class FilenameEncryptor {
    constructor() {
        this.encryptionLength = 32;
    }

    /**
     * 生成随机字符串
     * @param {number} length - 字符串长度
     * @returns {string} 随机字符串
     */
    generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            result += chars[randomIndex];
        }
        
        return result;
    }

    /**
     * 使用MD5哈希生成文件名
     * @param {string} originalName - 原始文件名
     * @returns {string} 加密后的文件名
     */
    generateHashFilename(originalName) {
        const hash = crypto.createHash('md5');
        hash.update(originalName + Date.now()); // 添加时间戳确保唯一性
        return hash.digest('hex').substring(0, this.encryptionLength);
    }

    /**
     * 加密文件名
     * @param {string} originalName - 原始文件名
     * @param {boolean} useHash - 是否使用哈希算法
     * @returns {string} 加密后的文件名（不含扩展名）
     */
    encryptFilename(originalName, useHash = true) {
        // 移除扩展名
        const nameWithoutExt = path.parse(originalName).name;
        
        if (useHash) {
            return this.generateHashFilename(nameWithoutExt);
        } else {
            return this.generateRandomString(this.encryptionLength);
        }
    }

    /**
     * 批量加密文件名
     * @param {string[]} filenames - 文件名数组
     * @param {boolean} useHash - 是否使用哈希算法
     * @returns {Object} 加密结果映射
     */
    encryptBatch(filenames, useHash = true) {
        const result = {};
        
        filenames.forEach(filename => {
            const encrypted = this.encryptFilename(filename, useHash);
            result[filename] = encrypted;
        });
        
        return result;
    }

    /**
     * 重命名文件
     * @param {string} filePath - 文件路径
     * @param {boolean} useHash - 是否使用哈希算法
     * @returns {string} 新文件名
     */
    renameFile(filePath, useHash = true) {
        const dirname = path.dirname(filePath);
        const originalName = path.basename(filePath);
        const ext = path.extname(filePath);
        
        const encryptedName = this.encryptFilename(originalName, useHash);
        const newPath = path.join(dirname, encryptedName + ext);
        
        // 重命名文件
        fs.renameSync(filePath, newPath);
        
        return encryptedName + ext;
    }

    /**
     * 处理目录中的所有HTML文件
     * @param {string} directory - 目录路径
     * @param {boolean} useHash - 是否使用哈希算法
     * @returns {Object} 处理结果
     */
    processDirectory(directory, useHash = true) {
        const results = {
            processed: [],
            errors: [],
            mapping: {}
        };

        try {
            const files = fs.readdirSync(directory);
            
            files.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.htm')) {
                    try {
                        const filePath = path.join(directory, file);
                        const newName = this.renameFile(filePath, useHash);
                        
                        results.processed.push({
                            original: file,
                            new: newName
                        });
                        
                        results.mapping[file] = newName;
                    } catch (error) {
                        results.errors.push({
                            file: file,
                            error: error.message
                        });
                    }
                }
            });
        } catch (error) {
            results.errors.push({
                file: 'directory',
                error: error.message
            });
        }

        return results;
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('使用方法:');
        console.log('  node encrypt-filename.js <文件名或目录路径> [useHash]');
        console.log('  useHash: true/false (默认: true)');
        process.exit(1);
    }
    
    const target = args[0];
    const useHash = args[1] !== 'false';
    
    const encryptor = new FilenameEncryptor();
    
    if (fs.existsSync(target)) {
        if (fs.statSync(target).isDirectory()) {
            const results = encryptor.processDirectory(target, useHash);
            console.log('处理结果:');
            console.log('成功处理:', results.processed.length, '个文件');
            console.log('错误:', results.errors.length, '个');
            
            if (results.errors.length > 0) {
                console.log('错误详情:');
                results.errors.forEach(err => {
                    console.log(`  ${err.file}: ${err.error}`);
                });
            }
        } else {
            try {
                const newName = encryptor.renameFile(target, useHash);
                console.log(`文件重命名成功: ${target} -> ${newName}`);
            } catch (error) {
                console.error('重命名失败:', error.message);
            }
        }
    } else {
        console.error('文件或目录不存在:', target);
    }
}

module.exports = FilenameEncryptor;