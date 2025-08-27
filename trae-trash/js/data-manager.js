/**
 * 数据管理器 - 中央数据状态管理
 * 负责数据的加载、保存、更新和同步
 */
class DataManager {
  constructor() {
    this.data = null;
    this.listeners = [];
    this.initialized = false;
    this.loading = false;
  }

  /**
   * 初始化数据管理器
   */
  async init() {
    if (this.loading) return;
    
    this.loading = true;
    try {
      await this.loadData();
      this.initialized = true;
      this.notifyListeners();
      console.log('DataManager initialized successfully');
    } catch (error) {
      console.error('DataManager initialization failed:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 加载数据
   */
  async loadData() {
    try {
      const response = await fetch('./database/data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      
      // 确保统计信息存在
      if (!this.data.statistics) {
        this.updateStatistics();
      }
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

    /**
   * 保存数据到本地文件
   */
  async saveData() {
    if (!this.data) return;

    try {
      // 直接保存到本地数据库文件
      const response = await fetch('/database/data.json', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.data, null, 2)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
      // 如果网络请求失败，尝试使用localStorage作为备选方案
      try {
        localStorage.setItem('html_manager_data', JSON.stringify(this.data));
        console.log('Data saved to localStorage as fallback');
      } catch (localStorageError) {
        console.error('Failed to save to localStorage:', localStorageError);
        throw error;
      }
    }
  }

  /**
   * 更新统计信息
   */
  updateStatistics() {
    if (!this.data || !this.data.html_files) {
      console.warn('No data or html_files available for statistics');
      return;
    }
    
    const stats = {
      total_files: this.data.html_files.length,
      categories: {},
      tags: {},
      models: {}
    };
    
    this.data.html_files.forEach(file => {
      // 统计分类
      if (file.category) {
        stats.categories[file.category] = (stats.categories[file.category] || 0) + 1;
      }
      
      // 统计标签
      if (file.tags && Array.isArray(file.tags)) {
        file.tags.forEach(tag => {
          if (tag) {
            stats.tags[tag] = (stats.tags[tag] || 0) + 1;
          }
        });
      }
      
      // 统计模型
      if (file.models && Array.isArray(file.models)) {
        file.models.forEach(model => {
          if (model && model.name) {
            stats.models[model.name] = (stats.models[model.name] || 0) + 1;
          }
        });
      }
    });
    
    this.data.statistics = stats;
    this.data.last_updated = new Date().toISOString();
    
    console.log('Statistics updated:', stats);
  }

  /**
   * 添加数据变化监听器
   * @param {Function} callback - 监听器回调函数
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      console.log('Listener added, total listeners:', this.listeners.length);
    }
  }

  /**
   * 移除数据变化监听器
   * @param {Function} callback - 监听器回调函数
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log('Listener removed, total listeners:', this.listeners.length);
    }
  }

  /**
   * 通知所有监听器数据变化
   */
  notifyListeners() {
    if (this.data) {
      console.log('Notifying listeners about data change');
      this.listeners.forEach(callback => {
        try {
          callback(this.data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  /**
   * 更新文件信息
   * @param {string} fileId - 文件ID
   * @param {Object} fileData - 文件数据
   * @returns {Promise<boolean>} - 是否更新成功
   */
  async updateFile(fileId, fileData) {
    if (!this.data || !this.data.html_files) {
      console.error('No data available for update');
      return false;
    }
    
    const fileIndex = this.data.html_files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      console.error('File not found:', fileId);
      return false;
    }
    
    try {
      // 更新文件数据
      this.data.html_files[fileIndex] = {
        ...this.data.html_files[fileIndex],
        ...fileData,
        updated_at: new Date().toISOString()
      };
      
      // 更新统计信息
      this.updateStatistics();
      
      // 保存数据
      await this.saveData();
      
      // 通知监听器
      this.notifyListeners();
      
      console.log('File updated successfully:', fileId);
      return true;
    } catch (error) {
      console.error('Failed to update file:', error);
      return false;
    }
  }

  /**
   * 编辑标签
   * @param {string} oldTagName - 旧标签名称
   * @param {string} newTagName - 新标签名称
   * @returns {Promise<number>} - 更新的文件数量
   */
  async editTag(oldTagName, newTagName) {
    if (!this.data || !this.data.html_files) {
      console.error('No data available for tag editing');
      return 0;
    }
    
    if (!oldTagName || !newTagName) {
      console.error('Invalid tag names');
      return 0;
    }
    
    if (oldTagName === newTagName) {
      console.log('Old and new tag names are the same');
      return 0;
    }
    
    let updatedCount = 0;
    
    try {
      // 更新所有文件中的标签
      this.data.html_files.forEach(file => {
        if (file.tags && Array.isArray(file.tags) && file.tags.includes(oldTagName)) {
          const index = file.tags.indexOf(oldTagName);
          file.tags[index] = newTagName;
          updatedCount++;
          file.updated_at = new Date().toISOString();
        }
      });
      
      if (updatedCount > 0) {
        // 更新统计信息
        this.updateStatistics();
        
        // 保存数据
        await this.saveData();
        
        // 通知监听器
        this.notifyListeners();
        
        console.log(`Tag edited successfully: ${oldTagName} -> ${newTagName}, updated ${updatedCount} files`);
      } else {
        console.log('No files found with the old tag:', oldTagName);
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Failed to edit tag:', error);
      return 0;
    }
  }

  /**
   * 编辑模型
   * @param {string} oldModelName - 旧模型名称
   * @param {string} newModelName - 新模型名称
   * @returns {Promise<number>} - 更新的文件数量
   */
  async editModel(oldModelName, newModelName) {
    if (!this.data || !this.data.html_files) {
      console.error('No data available for model editing');
      return 0;
    }
    
    if (!oldModelName || !newModelName) {
      console.error('Invalid model names');
      return 0;
    }
    
    if (oldModelName === newModelName) {
      console.log('Old and new model names are the same');
      return 0;
    }
    
    let updatedCount = 0;
    
    try {
      // 更新所有文件中的模型
      this.data.html_files.forEach(file => {
        if (file.models && Array.isArray(file.models)) {
          file.models.forEach(model => {
            if (model.name === oldModelName) {
              model.name = newModelName;
              updatedCount++;
              file.updated_at = new Date().toISOString();
            }
          });
        }
      });
      
      if (updatedCount > 0) {
        // 更新统计信息
        this.updateStatistics();
        
        // 保存数据
        await this.saveData();
        
        // 通知监听器
        this.notifyListeners();
        
        console.log(`Model edited successfully: ${oldModelName} -> ${newModelName}, updated ${updatedCount} files`);
      } else {
        console.log('No files found with the old model:', oldModelName);
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Failed to edit model:', error);
      return 0;
    }
  }

  /**
   * 删除文件
   * @param {string} fileId - 文件ID
   * @returns {Promise<boolean>} - 是否删除成功
   */
  async deleteFile(fileId) {
    if (!this.data || !this.data.html_files) {
      console.error('No data available for deletion');
      return false;
    }
    
    const fileIndex = this.data.html_files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      console.error('File not found:', fileId);
      return false;
    }
    
    try {
      // 删除文件数据
      this.data.html_files.splice(fileIndex, 1);
      
      // 更新统计信息
      this.updateStatistics();
      
      // 保存数据
      await this.saveData();
      
      // 通知监听器
      this.notifyListeners();
      
      console.log('File deleted successfully:', fileId);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * 添加文件
   * @param {Object} fileData - 文件数据
   * @returns {Promise<boolean>} - 是否添加成功
   */
  async addFile(fileData) {
    if (!this.data || !this.data.html_files) {
      console.error('No data available for adding file');
      return false;
    }
    
    try {
      // 生成文件ID（如果未提供）
      if (!fileData.id) {
        fileData.id = this.generateFileId();
      }
      
      // 设置时间戳
      const now = new Date().toISOString();
      fileData.created_at = now;
      fileData.updated_at = now;
      
      // 添加文件数据
      this.data.html_files.push(fileData);
      
      // 更新统计信息
      this.updateStatistics();
      
      // 保存数据
      await this.saveData();
      
      // 通知监听器
      this.notifyListeners();
      
      console.log('File added successfully:', fileData.id);
      return true;
    } catch (error) {
      console.error('Failed to add file:', error);
      return false;
    }
  }

  /**
   * 生成文件ID
   * @returns {string} - 生成的文件ID
   */
  generateFileId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 获取所有标签
   * @returns {Array<string>} - 标签列表
   */
  getAllTags() {
    if (!this.data || !this.data.statistics || !this.data.statistics.tags) {
      return [];
    }
    return Object.keys(this.data.statistics.tags);
  }

  /**
   * 获取所有模型
   * @returns {Array<string>} - 模型列表
   */
  getAllModels() {
    if (!this.data || !this.data.statistics || !this.data.statistics.models) {
      return [];
    }
    return Object.keys(this.data.statistics.models);
  }

  /**
   * 获取所有分类
   * @returns {Array<string>} - 分类列表
   */
  getAllCategories() {
    if (!this.data || !this.data.statistics || !this.data.statistics.categories) {
      return [];
    }
    return Object.keys(this.data.statistics.categories);
  }

  /**
   * 搜索文件
   * @param {Object} filters - 搜索过滤器
   * @returns {Array<Object>} - 搜索结果
   */
  searchFiles(filters) {
    if (!this.data || !this.data.html_files) {
      return [];
    }
    
    let results = this.data.html_files;
    
    // 文本搜索
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(file => {
        return file.original_name?.toLowerCase().includes(searchTerm) ||
               file.scene?.toLowerCase().includes(searchTerm) ||
               file.prompt?.toLowerCase().includes(searchTerm) ||
               file.description?.toLowerCase().includes(searchTerm) ||
               file.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      });
    }
    
    // 分类筛选
    if (filters.category) {
      results = results.filter(file => file.category === filters.category);
    }
    
    // 标签筛选
    if (filters.tag) {
      results = results.filter(file => file.tags?.includes(filters.tag));
    }
    
    // 模型筛选
    if (filters.model) {
      results = results.filter(file => file.models?.some(model => model.name === filters.model));
    }
    
    return results;
  }

  /**
   * 获取文件信息
   * @param {string} fileId - 文件ID
   * @returns {Object|null} - 文件信息
   */
  getFile(fileId) {
    if (!this.data || !this.data.html_files) {
      return null;
    }
    return this.data.html_files.find(f => f.id === fileId) || null;
  }

  /**
   * 根据ID获取文件信息（别名方法）
   * @param {string} fileId - 文件ID
   * @returns {Object|null} - 文件信息
   */
  getFileById(fileId) {
    return this.getFile(fileId);
  }

  /**
   * 获取统计数据
   * @returns {Object} - 统计数据
   */
  getStatistics() {
    if (!this.data || !this.data.statistics) {
      return {
        total_files: 0,
        categories: {},
        tags: {},
        models: {}
      };
    }
    return this.data.statistics;
  }
}

// 导出数据管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
} else if (typeof window !== 'undefined') {
  window.DataManager = DataManager;
}