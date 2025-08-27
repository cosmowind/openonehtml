// 数据管理器 - 统一管理所有数据操作
class DataManager {
  constructor() {
    this.data = null;
    this.listeners = new Set();
    this.isInitialized = false;
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

  // 加载数据
  async loadData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.data = await response.json();
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

  // 保存数据
  async saveData() {
    try {
      this.updateStats();

      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/files?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }

  // 获取单个文件
  async getFile(id) {
    try {
      const response = await fetch(`/api/files/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取文件失败:', error);
      throw error;
    }
  }

  // 添加文件
  async addFile(fileData) {
    try {
      const formData = new FormData();

      // 添加文件
      if (fileData.file) {
        formData.append('file', fileData.file);
      }

      // 添加其他数据
      Object.keys(fileData).forEach(key => {
        if (key !== 'file' && fileData[key] != null) {
          if (Array.isArray(fileData[key])) {
            formData.append(key, JSON.stringify(fileData[key]));
          } else {
            formData.append(key, fileData[key]);
          }
        }
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('添加文件失败:', error);
      throw error;
    }
  }

  // 更新文件
  async updateFile(id, fileData) {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  }

  // 删除文件
  async deleteFile(id, password) {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }

  // 标签操作

  // 获取预置标签
  async getTags() {
    try {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 添加预置标签
  async addTag(tagData) {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('添加标签失败:', error);
      throw error;
    }
  }

  // 删除预置标签
  async deleteTag(tagId) {
    try {
      // 注意：这里需要实现删除标签的API
      console.warn('删除标签功能暂未实现');
      return { success: false, error: '功能暂未实现' };
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }

  // 模型操作

  // 获取预置模型
  async getModels() {
    try {
      const response = await fetch('/api/models');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取模型失败:', error);
      return [];
    }
  }

  // 添加预置模型
  async addModel(modelData) {
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modelData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('添加模型失败:', error);
      throw error;
    }
  }

  // 目录扫描
  async scanDirectory(directory) {
    try {
      const response = await fetch('/api/scan-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ directory })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('扫描目录失败:', error);
      throw error;
    }
  }

  // 批量上传
  async batchUpload(files, commonData) {
    try {
      const response = await fetch('/api/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files,
          ...commonData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.refreshData();
      }

      return result;
    } catch (error) {
      console.error('批量上传失败:', error);
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
