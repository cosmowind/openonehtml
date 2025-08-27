const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * HTML文件合并工具
 * 将外部CSS和JS文件合并到HTML文件中
 */
class HTMLMerger {
  constructor() {
    this.processedFiles = new Set();
  }

  /**
   * 处理单个HTML文件
   * @param {string} filePath HTML文件路径
   * @param {Object} options 配置选项
   * @returns {Promise<Object>} 处理结果
   */
  async processFile(filePath, options = {}) {
    try {
      const {
        backupOriginal = true,  // 是否备份原文件
        removeExternalRefs = true,  // 是否删除外部引用
        minify = false  // 是否压缩代码
      } = options;

      console.log(`正在处理文件: ${filePath}`);

      // 读取HTML文件
      let htmlContent = fs.readFileSync(filePath, 'utf8');

      // 备份原文件
      if (backupOriginal) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, htmlContent);
        console.log(`原文件已备份到: ${backupPath}`);
      }

      // 查找并处理CSS链接
      htmlContent = await this.processCSSLinks(htmlContent, path.dirname(filePath), minify);

      // 查找并处理JS脚本
      htmlContent = await this.processJSScripts(htmlContent, path.dirname(filePath), minify);

      // 删除外部引用（如果需要）
      if (removeExternalRefs) {
        htmlContent = this.removeExternalReferences(htmlContent);
      }

      // 写入处理后的文件
      fs.writeFileSync(filePath, htmlContent);

      console.log(`文件处理完成: ${filePath}`);
      return {
        success: true,
        file: filePath,
        message: '文件合并完成'
      };

    } catch (error) {
      console.error(`处理文件失败 ${filePath}:`, error);
      return {
        success: false,
        file: filePath,
        error: error.message
      };
    }
  }

  /**
   * 处理CSS链接
   * @param {string} htmlContent HTML内容
   * @param {string} baseDir 基础目录
   * @param {boolean} minify 是否压缩
   * @returns {Promise<string>} 处理后的HTML内容
   */
  async processCSSLinks(htmlContent, baseDir, minify = false) {
    const cssLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;

    let match;
    while ((match = cssLinkRegex.exec(htmlContent)) !== null) {
      const linkTag = match[0];
      const cssPath = match[1];

      // 跳过外部链接
      if (cssPath.startsWith('http://') || cssPath.startsWith('https://')) {
        continue;
      }

      try {
        const fullCssPath = path.resolve(baseDir, cssPath);

        if (fs.existsSync(fullCssPath)) {
          let cssContent = fs.readFileSync(fullCssPath, 'utf8');

          // 压缩CSS（简单版本）
          if (minify) {
            cssContent = this.minifyCSS(cssContent);
          }

          // 转换为内联样式
          const styleTag = `<style>\n${cssContent}\n</style>`;

          // 替换链接标签
          htmlContent = htmlContent.replace(linkTag, styleTag);

          console.log(`已合并CSS文件: ${cssPath}`);
        }
      } catch (error) {
        console.warn(`处理CSS文件失败 ${cssPath}:`, error.message);
      }
    }

    return htmlContent;
  }

  /**
   * 处理JS脚本
   * @param {string} htmlContent HTML内容
   * @param {string} baseDir 基础目录
   * @param {boolean} minify 是否压缩
   * @returns {Promise<string>} 处理后的HTML内容
   */
  async processJSScripts(htmlContent, baseDir, minify = false) {
    const jsScriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;

    let match;
    while ((match = jsScriptRegex.exec(htmlContent)) !== null) {
      const scriptTag = match[0];
      const jsPath = match[1];

      // 跳过外部链接和内联脚本
      if (jsPath.startsWith('http://') || jsPath.startsWith('https://') ||
          jsPath.startsWith('data:')) {
        continue;
      }

      try {
        const fullJsPath = path.resolve(baseDir, jsPath);

        if (fs.existsSync(fullJsPath)) {
          let jsContent = fs.readFileSync(fullJsPath, 'utf8');

          // 压缩JS（简单版本）
          if (minify) {
            jsContent = this.minifyJS(jsContent);
          }

          // 转换为内联脚本
          const inlineScript = `<script>\n${jsContent}\n</script>`;

          // 替换脚本标签
          htmlContent = htmlContent.replace(scriptTag, inlineScript);

          console.log(`已合并JS文件: ${jsPath}`);
        }
      } catch (error) {
        console.warn(`处理JS文件失败 ${jsPath}:`, error.message);
      }
    }

    return htmlContent;
  }

  /**
   * 删除外部引用
   * @param {string} htmlContent HTML内容
   * @returns {string} 处理后的HTML内容
   */
  removeExternalReferences(htmlContent) {
    // 删除CSS链接
    htmlContent = htmlContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

    // 删除JS脚本引用（保留内联脚本）
    htmlContent = htmlContent.replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '');

    return htmlContent;
  }

  /**
   * 压缩CSS
   * @param {string} css CSS内容
   * @returns {string} 压缩后的CSS
   */
  minifyCSS(css) {
    return css
      .replace(/\s+/g, ' ')           // 多个空白字符替换为单个空格
      .replace(/\s*{\s*/g, '{')       // 移除{前的空格
      .replace(/\s*}\s*/g, '}')       // 移除}后的空格
      .replace(/\s*:\s*/g, ':')       // 移除:后的空格
      .replace(/\s*;\s*/g, ';')       // 移除;后的空格
      .replace(/,\s*/g, ',')          // 移除,后的空格
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .trim();
  }

  /**
   * 压缩JS
   * @param {string} js JS内容
   * @returns {string} 压缩后的JS
   */
  minifyJS(js) {
    return js
      .replace(/\s+/g, ' ')           // 多个空白字符替换为单个空格
      .replace(/\s*{\s*/g, '{')       // 移除{前的空格
      .replace(/\s*}\s*/g, '}')       // 移除}后的空格
      .replace(/\s*\(\s*/g, '(')      // 移除(前的空格
      .replace(/\s*\)\s*/g, ')')      // 移除)后的空格
      .replace(/\s*;\s*/g, ';')       // 移除;后的空格
      .replace(/,\s*/g, ',')          // 移除,后的空格
      .replace(/\/\/.*$/gm, '')       // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .trim();
  }

  /**
   * 批量处理目录中的HTML文件
   * @param {string} directory 目录路径
   * @param {Object} options 配置选项
   * @returns {Promise<Array>} 处理结果数组
   */
  async processDirectory(directory, options = {}) {
    const results = [];

    try {
      const files = fs.readdirSync(directory);
      const htmlFiles = files.filter(file =>
        file.endsWith('.html') || file.endsWith('.htm')
      );

      console.log(`在目录 ${directory} 中发现 ${htmlFiles.length} 个HTML文件`);

      for (const file of htmlFiles) {
        const filePath = path.join(directory, file);
        const result = await this.processFile(filePath, options);
        results.push(result);
      }

    } catch (error) {
      console.error(`处理目录失败 ${directory}:`, error);
      results.push({
        success: false,
        directory,
        error: error.message
      });
    }

    return results;
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('用法:');
    console.log('  node merge-css-js.js <文件路径或目录路径> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --no-backup     不备份原文件');
    console.log('  --keep-external 保留外部引用');
    console.log('  --minify        压缩代码');
    console.log('');
    console.log('示例:');
    console.log('  node merge-css-js.js ./test.html');
    console.log('  node merge-css-js.js ./html-files --minify');
    process.exit(1);
  }

  const targetPath = args[0];
  const options = {
    backupOriginal: !args.includes('--no-backup'),
    removeExternalRefs: !args.includes('--keep-external'),
    minify: args.includes('--minify')
  };

  const merger = new HTMLMerger();

  fs.stat(targetPath, async (err, stats) => {
    if (err) {
      console.error(`路径不存在: ${targetPath}`);
      process.exit(1);
    }

    try {
      if (stats.isDirectory()) {
        console.log(`开始处理目录: ${targetPath}`);
        const results = await merger.processDirectory(targetPath, options);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        console.log(`\n处理完成!`);
        console.log(`成功: ${successCount} 个文件`);
        console.log(`失败: ${failCount} 个文件`);
      } else {
        console.log(`开始处理文件: ${targetPath}`);
        const result = await merger.processFile(targetPath, options);

        if (result.success) {
          console.log('✅ 文件处理成功!');
        } else {
          console.log('❌ 文件处理失败:', result.error);
        }
      }
    } catch (error) {
      console.error('处理过程中发生错误:', error);
      process.exit(1);
    }
  });
}

module.exports = HTMLMerger;
