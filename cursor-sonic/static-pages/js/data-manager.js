// 数据管理器 - 静态版本，使用本地存储
class DataManager {
  constructor() {
    this.data = null;
    this.listeners = new Set();
    this.isInitialized = false;
    this.storageKey = 'openonehtml_data';
  }

  async init() {
    try {
      console.log('初始化数据管理器...');
      await this.loadData();
      this.isInitialized = true;
      console.log('数据管理器初始化完成');
    } catch (error) {
      console.error('数据管理器初始化失败:', error);
      throw error;
    }
  }

  // 添加数据变化监听器
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听器数据已更新
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.data);
      } catch (error) {
        console.error('数据监听器执行失败:', error);
      }
    });
  }

  // 从本地存储加载数据
  async loadData() {
    try {
      // 首先尝试从本地存储加载
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        this.data = JSON.parse(storedData);
        this.notifyListeners();
        return this.data;
      }

      // 如果本地存储为空，尝试从database/data.json加载初始数据
      const response = await fetch('./database/data.json');
      if (response.ok) {
        this.data = await response.json();
        // 保存到本地存储
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } else {
        throw new Error('无法加载初始数据文件');
      }

      this.notifyListeners();
      return this.data;
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用默认数据
      this.data = {
        version: "1.0.0",
        files: [],
        preset_tags: [],
        preset_models: [],
        categories: [],
        settings: {
          totalFiles: 0,
          totalTags: 0,
          totalModels: 0,
          totalCategories: 0
        }
      };
      this.notifyListeners();
      throw error;
    }
  }

  // 保存数据到本地存储
  async saveData() {
    try {
      this.updateStats();
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      throw error;
    }
  }

  // 刷新数据
  async refreshData() {
    await this.loadData();
  }

  // 更新统计信息
  updateStats() {
    if (!this.data) return;

    const files = this.data.files || [];
    const tags = this.data.preset_tags || [];
    const models = this.data.preset_models || [];

    // 计算文件数量
    this.data.settings.totalFiles = files.filter(f => f.status !== 'deleted').length;

    // 计算标签数量
    this.data.settings.totalTags = tags.length;

    // 计算模型数量
    this.data.settings.totalModels = models.length;

    // 计算分类数量
    const categories = new Set();
    files.forEach(file => {
      if (file.category) categories.add(file.category);
    });
    this.data.settings.totalCategories = categories.size;

    // 更新时间戳
    this.data.lastUpdate = new Date().toISOString();
  }

  // 获取统计信息
  getStats() {
    return this.data?.settings || {
      totalFiles: 0,
      totalTags: 0,
      totalModels: 0,
      totalCategories: 0
    };
  }

  // 文件操作

  // 获取文件列表
  async getFiles(filters = {}) {
    try {
      let files = this.data.files.filter(f => f.status !== 'deleted');

      // 搜索过滤 - 支持多关键词和高级搜索
      if (filters.search) {
        const searchTerm = filters.search.trim();
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
      if (filters.category) {
        files = files.filter(f => f.category === filters.category);
      }

      // 标签过滤
      if (filters.tags) {
        const tagList = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
        files = files.filter(f => tagList.some(tag => f.tags.includes(tag)));
      }

      // 模型过滤
      if (filters.model) {
        files = files.filter(f => f.model === filters.model);
      }

      return files;
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }

  // 获取单个文件
  async getFile(id) {
    try {
      const file = this.data.files.find(f => f.id === id && f.status !== 'deleted');

      if (!file) {
        throw new Error('文件不存在');
      }

      // 更新访问信息
      file.lastAccess = new Date().toISOString();
      file.accessCount = (file.accessCount || 0) + 1;
      await this.saveData();

      return file;
    } catch (error) {
      console.error('获取文件失败:', error);
      throw error;
    }
  }

  // 添加文件（静态版本：将文件复制到html-files目录并添加到数据中）
  async addFile(fileData) {
    try {
      const crypto = window.crypto || window.msCrypto;
      const fileId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      let fileInfo;

      if (fileData.file) {
        // 处理文件上传
        const file = fileData.file;
        const randomName = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('') + '.html';

        // 在静态版本中，我们将文件内容存储为base64编码
        const fileContent = await this.readFileAsText(file);
        localStorage.setItem(`file_${randomName}`, fileContent);

        fileInfo = {
          id: fileId,
          originalName: file.name,
          encryptedName: randomName,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
          accessCount: 0,
          title: fileData.title || file.name,
          description: fileData.description || '',
          category: fileData.category || '',
          background: fileData.background || '',
          prompt: fileData.prompt || '',
          model: fileData.model || '',
          tags: fileData.tags ? (Array.isArray(fileData.tags) ? fileData.tags : [fileData.tags]) : [],
          status: 'active'
        };
      } else {
        // 处理URL或文本内容
        fileInfo = {
          id: fileId,
          originalName: fileData.title || '未命名文件',
          encryptedName: '',
          fileSize: 0,
          uploadTime: new Date().toISOString(),
          accessCount: 0,
          title: fileData.title || '未命名文件',
          description: fileData.description || '',
          category: fileData.category || '',
          background: fileData.background || '',
          prompt: fileData.prompt || '',
          model: fileData.model || '',
          tags: fileData.tags ? (Array.isArray(fileData.tags) ? fileData.tags : [fileData.tags]) : [],
          status: 'active'
        };
      }

      if (!this.data.files) this.data.files = [];
      this.data.files.push(fileInfo);
      await this.saveData();

      return { success: true, file: fileInfo };
    } catch (error) {
      console.error('添加文件失败:', error);
      throw error;
    }
  }

  // 读取文件为文本
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // 更新文件
  async updateFile(id, fileData) {
    try {
      const fileIndex = this.data.files.findIndex(f => f.id === id && f.status !== 'deleted');

      if (fileIndex === -1) {
        throw new Error('文件不存在');
      }

      const updateData = fileData;
      this.data.files[fileIndex] = { ...this.data.files[fileIndex], ...updateData };
      await this.saveData();

      return { success: true, file: this.data.files[fileIndex] };
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  }

  // 删除文件
  async deleteFile(id, password) {
    try {
      // 在静态版本中，我们简化删除逻辑，不需要密码验证
      const fileIndex = this.data.files.findIndex(f => f.id === id);

      if (fileIndex === -1) {
        throw new Error('文件不存在');
      }

      // 标记为已删除
      this.data.files[fileIndex].status = 'deleted';
      await this.saveData();

      return { success: true };
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  // 标签操作

  // 获取预置标签
  async getTags() {
    try {
      return this.data.preset_tags || [];
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 添加预置标签
  async addTag(tagData) {
    try {
      if (!tagData.name) {
        throw new Error('标签名称不能为空');
      }

      const tagId = 'tag_' + Date.now();
      const newTag = {
        id: tagId,
        name: tagData.name,
        color: tagData.color || '#3498db',
        description: tagData.description || '',
        createTime: new Date().toISOString(),
        usageCount: 0
      };

      if (!this.data.preset_tags) this.data.preset_tags = [];
      this.data.preset_tags.push(newTag);
      await this.saveData();

      return { success: true, tag: newTag };
    } catch (error) {
      console.error('添加标签失败:', error);
      throw error;
    }
  }

  // 删除预置标签
  async deleteTag(tagId) {
    try {
      if (!this.data.preset_tags) {
        throw new Error('标签不存在');
      }

      const tagIndex = this.data.preset_tags.findIndex(tag => tag.id === tagId);
      if (tagIndex === -1) {
        throw new Error('标签不存在');
      }

      const deletedTag = this.data.preset_tags.splice(tagIndex, 1)[0];
      await this.saveData();

      return { success: true, tag: deletedTag };
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }

  // 模型操作

  // 获取预置模型
  async getModels() {
    try {
      return this.data.preset_models || [];
    } catch (error) {
      console.error('获取模型失败:', error);
      return [];
    }
  }

  // 添加预置模型
  async addModel(modelData) {
    try {
      if (!modelData.name) {
        throw new Error('模型名称不能为空');
      }

      const modelId = 'model_' + Date.now();
      const newModel = {
        id: modelId,
        name: modelData.name,
        description: modelData.description || '',
        createTime: new Date().toISOString(),
        usageCount: 0
      };

      if (!this.data.preset_models) this.data.preset_models = [];
      this.data.preset_models.push(newModel);
      await this.saveData();

      return { success: true, model: newModel };
    } catch (error) {
      console.error('添加模型失败:', error);
      throw error;
    }
  }

  // 目录扫描（静态版本：模拟扫描功能）
  async scanDirectory(directory) {
    try {
      // 在静态版本中，我们返回一个提示信息，因为无法实际扫描文件系统
      console.warn('静态版本不支持目录扫描功能');
      return {
        success: false,
        error: '静态版本不支持目录扫描功能，请手动添加文件'
      };
    } catch (error) {
      console.error('扫描目录失败:', error);
      throw error;
    }
  }

  // 批量上传（静态版本：批量添加文件信息）
  async batchUpload(files, commonData) {
    try {
      const results = [];

      for (const fileInfo of files) {
        try {
          const crypto = window.crypto || window.msCrypto;
          const fileId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

          const newFile = {
            id: fileId,
            originalName: fileInfo.name,
            encryptedName: '',
            fileSize: fileInfo.size || 0,
            uploadTime: new Date().toISOString(),
            accessCount: 0,
            title: fileInfo.name,
            description: '',
            category: commonData.category || '',
            background: commonData.background || '',
            prompt: commonData.prompt || '',
            model: commonData.model || '',
            tags: commonData.tags || [],
            status: 'active'
          };

          if (!this.data.files) this.data.files = [];
          this.data.files.push(newFile);
          results.push({ name: fileInfo.name, success: true, file: newFile });

        } catch (error) {
          results.push({ name: fileInfo.name, success: false, error: error.message });
        }
      }

      await this.saveData();

      return { success: true, results };
    } catch (error) {
      console.error('批量上传失败:', error);
      throw error;
    }
  }

  // 分类管理

  // 获取分类列表
  async getCategories() {
    try {
      return this.data.categories || [];
    } catch (error) {
      console.error('获取分类失败:', error);
      return [];
    }
  }

  // 添加分类
  async addCategory(categoryData) {
    try {
      if (!categoryData.name) {
        throw new Error('分类名称不能为空');
      }

      const categoryId = 'category_' + Date.now();
      const newCategory = {
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description || '',
        createTime: new Date().toISOString(),
        usageCount: 0
      };

      if (!this.data.categories) this.data.categories = [];
      this.data.categories.push(newCategory);
      await this.saveData();

      return { success: true, category: newCategory };
    } catch (error) {
      console.error('添加分类失败:', error);
      throw error;
    }
  }

  // 更新分类
  async updateCategory(id, categoryData) {
    try {
      if (!categoryData.name) {
        throw new Error('分类名称不能为空');
      }

      if (!this.data.categories) {
        throw new Error('分类不存在');
      }

      const categoryIndex = this.data.categories.findIndex(category => category.id === id);
      if (categoryIndex === -1) {
        throw new Error('分类不存在');
      }

      // 更新分类信息
      this.data.categories[categoryIndex] = {
        ...this.data.categories[categoryIndex],
        name: categoryData.name,
        description: categoryData.description || '',
        updateTime: new Date().toISOString()
      };

      await this.saveData();

      return { success: true, category: this.data.categories[categoryIndex] };
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  }

  // 删除分类
  async deleteCategory(id) {
    try {
      if (!this.data.categories) {
        throw new Error('分类不存在');
      }

      const categoryIndex = this.data.categories.findIndex(category => category.id === id);
      if (categoryIndex === -1) {
        throw new Error('分类不存在');
      }

      // 检查是否有文件使用此分类
      const files = this.data.files || [];
      const filesUsingCategory = files.filter(file => file.category === this.data.categories[categoryIndex].name);

      if (filesUsingCategory.length > 0) {
        throw new Error(`无法删除分类，有 ${filesUsingCategory.length} 个文件正在使用此分类`);
      }

      const deletedCategory = this.data.categories.splice(categoryIndex, 1)[0];
      await this.saveData();

      return { success: true, category: deletedCategory };
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  // 数据导出
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  // 数据导入
  async importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // 验证数据结构
      if (!data || typeof data !== 'object') {
        throw new Error('无效的数据格式');
      }

      // 更新数据
      this.data = { ...this.data, ...data };
      await this.saveData();

      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }
}
