/**
 * 预置选项管理器 - 管理标签和模型的预置选项
 * 负责预置选项的加载、添加、删除和管理
 */
class PresetManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.presets = {
      tags: new Set(),
      models: new Set()
    };
    this.listeners = [];
    this.initialized = false;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化预置选项管理器
   */
  async init() {
    try {
      await this.loadPresets();
      this.initialized = true;
      console.log('PresetManager initialized successfully');
    } catch (error) {
      console.error('PresetManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * 加载预置选项
   */
  async loadPresets() {
    if (!this.dataManager || !this.dataManager.data) {
      console.warn('DataManager not available for loading presets');
      return;
    }
    
    const data = this.dataManager.data;
    if (data && data.html_files) {
      // 清空现有选项
      this.presets.tags.clear();
      this.presets.models.clear();
      
      // 从现有数据中加载选项
      data.html_files.forEach(file => {
        // 加载标签
        if (file.tags && Array.isArray(file.tags)) {
          file.tags.forEach(tag => {
            if (tag && tag.trim()) {
              this.presets.tags.add(tag.trim());
            }
          });
        }
        
        // 加载模型
        if (file.models && Array.isArray(file.models)) {
          file.models.forEach(model => {
            if (model && model.name && model.name.trim()) {
              this.presets.models.add(model.name.trim());
            }
          });
        }
      });
      
      console.log('Presets loaded:', {
        tags: Array.from(this.presets.tags),
        models: Array.from(this.presets.models)
      });
    }
  }

  /**
   * 添加标签
   * @param {string} tag - 标签名称
   * @returns {boolean} - 是否添加成功
   */
  addTag(tag) {
    if (!tag || typeof tag !== 'string') {
      console.error('Invalid tag:', tag);
      return false;
    }
    
    const trimmedTag = tag.trim();
    if (!trimmedTag) {
      console.error('Empty tag');
      return false;
    }
    
    if (this.presets.tags.has(trimmedTag)) {
      console.log('Tag already exists:', trimmedTag);
      return false;
    }
    
    this.presets.tags.add(trimmedTag);
    this.notifyListeners('tags');
    console.log('Tag added:', trimmedTag);
    return true;
  }

  /**
   * 添加模型
   * @param {string} model - 模型名称
   * @returns {boolean} - 是否添加成功
   */
  addModel(model) {
    if (!model || typeof model !== 'string') {
      console.error('Invalid model:', model);
      return false;
    }
    
    const trimmedModel = model.trim();
    if (!trimmedModel) {
      console.error('Empty model');
      return false;
    }
    
    if (this.presets.models.has(trimmedModel)) {
      console.log('Model already exists:', trimmedModel);
      return false;
    }
    
    this.presets.models.add(trimmedModel);
    this.notifyListeners('models');
    console.log('Model added:', trimmedModel);
    return true;
  }

  /**
   * 删除标签
   * @param {string} tag - 标签名称
   * @returns {boolean} - 是否删除成功
   */
  removeTag(tag) {
    if (!tag || typeof tag !== 'string') {
      console.error('Invalid tag:', tag);
      return false;
    }
    
    const trimmedTag = tag.trim();
    if (!trimmedTag) {
      console.error('Empty tag');
      return false;
    }
    
    if (!this.presets.tags.has(trimmedTag)) {
      console.log('Tag not found:', trimmedTag);
      return false;
    }
    
    this.presets.tags.delete(trimmedTag);
    this.notifyListeners('tags');
    console.log('Tag removed:', trimmedTag);
    return true;
  }

  /**
   * 删除模型
   * @param {string} model - 模型名称
   * @returns {boolean} - 是否删除成功
   */
  removeModel(model) {
    if (!model || typeof model !== 'string') {
      console.error('Invalid model:', model);
      return false;
    }
    
    const trimmedModel = model.trim();
    if (!trimmedModel) {
      console.error('Empty model');
      return false;
    }
    
    if (!this.presets.models.has(trimmedModel)) {
      console.log('Model not found:', trimmedModel);
      return false;
    }
    
    this.presets.models.delete(trimmedModel);
    this.notifyListeners('models');
    console.log('Model removed:', trimmedModel);
    return true;
  }

  /**
   * 重命名标签
   * @param {string} oldTag - 旧标签名称
   * @param {string} newTag - 新标签名称
   * @returns {boolean} - 是否重命名成功
   */
  async renameTag(oldTag, newTag) {
    if (!oldTag || !newTag || typeof oldTag !== 'string' || typeof newTag !== 'string') {
      console.error('Invalid tag names:', { oldTag, newTag });
      return false;
    }
    
    const trimmedOldTag = oldTag.trim();
    const trimmedNewTag = newTag.trim();
    
    if (!trimmedOldTag || !trimmedNewTag) {
      console.error('Empty tag names');
      return false;
    }
    
    if (trimmedOldTag === trimmedNewTag) {
      console.log('Old and new tag names are the same');
      return false;
    }
    
    if (!this.presets.tags.has(trimmedOldTag)) {
      console.log('Old tag not found:', trimmedOldTag);
      return false;
    }
    
    try {
      // 删除旧标签
      this.presets.tags.delete(trimmedOldTag);
      
      // 添加新标签
      this.presets.tags.add(trimmedNewTag);
      
      // 更新数据管理器中的标签
      if (this.dataManager) {
        await this.dataManager.editTag(trimmedOldTag, trimmedNewTag);
      }
      
      this.notifyListeners('tags');
      console.log('Tag renamed:', trimmedOldTag, '->', trimmedNewTag);
      return true;
    } catch (error) {
      // 如果失败，恢复旧标签
      this.presets.tags.add(trimmedOldTag);
      this.presets.tags.delete(trimmedNewTag);
      console.error('Failed to rename tag:', error);
      return false;
    }
  }

  /**
   * 重命名模型
   * @param {string} oldModel - 旧模型名称
   * @param {string} newModel - 新模型名称
   * @returns {boolean} - 是否重命名成功
   */
  async renameModel(oldModel, newModel) {
    if (!oldModel || !newModel || typeof oldModel !== 'string' || typeof newModel !== 'string') {
      console.error('Invalid model names:', { oldModel, newModel });
      return false;
    }
    
    const trimmedOldModel = oldModel.trim();
    const trimmedNewModel = newModel.trim();
    
    if (!trimmedOldModel || !trimmedNewModel) {
      console.error('Empty model names');
      return false;
    }
    
    if (trimmedOldModel === trimmedNewModel) {
      console.log('Old and new model names are the same');
      return false;
    }
    
    if (!this.presets.models.has(trimmedOldModel)) {
      console.log('Old model not found:', trimmedOldModel);
      return false;
    }
    
    try {
      // 删除旧模型
      this.presets.models.delete(trimmedOldModel);
      
      // 添加新模型
      this.presets.models.add(trimmedNewModel);
      
      // 更新数据管理器中的模型
      if (this.dataManager) {
        await this.dataManager.editModel(trimmedOldModel, trimmedNewModel);
      }
      
      this.notifyListeners('models');
      console.log('Model renamed:', trimmedOldModel, '->', trimmedNewModel);
      return true;
    } catch (error) {
      // 如果失败，恢复旧模型
      this.presets.models.add(trimmedOldModel);
      this.presets.models.delete(trimmedNewModel);
      console.error('Failed to rename model:', error);
      return false;
    }
  }

  /**
   * 获取标签列表
   * @param {boolean} sorted - 是否排序
   * @returns {Array<string>} - 标签列表
   */
  getTags(sorted = true) {
    const tags = Array.from(this.presets.tags);
    return sorted ? tags.sort() : tags;
  }

  /**
   * 获取模型列表
   * @param {boolean} sorted - 是否排序
   * @returns {Array<string>} - 模型列表
   */
  getModels(sorted = true) {
    const models = Array.from(this.presets.models);
    return sorted ? models.sort() : models;
  }

  /**
   * 检查标签是否存在
   * @param {string} tag - 标签名称
   * @returns {boolean} - 是否存在
   */
  hasTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    return this.presets.tags.has(tag.trim());
  }

  /**
   * 检查模型是否存在
   * @param {string} model - 模型名称
   * @returns {boolean} - 是否存在
   */
  hasModel(model) {
    if (!model || typeof model !== 'string') return false;
    return this.presets.models.has(model.trim());
  }

  /**
   * 获取标签使用统计
   * @param {string} tag - 标签名称
   * @returns {number} - 使用次数
   */
  getTagUsage(tag) {
    if (!this.dataManager || !this.dataManager.data || !this.dataManager.data.statistics) {
      return 0;
    }
    return this.dataManager.data.statistics.tags[tag] || 0;
  }

  /**
   * 获取模型使用统计
   * @param {string} model - 模型名称
   * @returns {number} - 使用次数
   */
  getModelUsage(model) {
    if (!this.dataManager || !this.dataManager.data || !this.dataManager.data.statistics) {
      return 0;
    }
    return this.dataManager.data.statistics.models[model] || 0;
  }

  /**
   * 获取所有标签及其使用统计
   * @returns {Object} - 标签统计对象
   */
  getAllTagStats() {
    const stats = {};
    this.presets.tags.forEach(tag => {
      stats[tag] = this.getTagUsage(tag);
    });
    return stats;
  }

  /**
   * 获取所有模型及其使用统计
   * @returns {Object} - 模型统计对象
   */
  getAllModelStats() {
    const stats = {};
    this.presets.models.forEach(model => {
      stats[model] = this.getModelUsage(model);
    });
    return stats;
  }

  /**
   * 添加预置选项变化监听器
   * @param {Function} callback - 监听器回调函数
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      console.log('Preset listener added, total listeners:', this.listeners.length);
    }
  }

  /**
   * 移除预置选项变化监听器
   * @param {Function} callback - 监听器回调函数
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
      console.log('Preset listener removed, total listeners:', this.listeners.length);
    }
  }

  /**
   * 通知监听器预置选项变化
   * @param {string} type - 变化类型 ('tags' 或 'models')
   */
  notifyListeners(type) {
    console.log(`Notifying listeners about ${type} change`);
    this.listeners.forEach(callback => {
      try {
        callback(type, this.getPresetsByType(type));
      } catch (error) {
        console.error('Error in preset listener callback:', error);
      }
    });
  }

  /**
   * 根据类型获取预置选项
   * @param {string} type - 类型 ('tags' 或 'models')
   * @returns {Array<string>} - 预置选项列表
   */
  getPresetsByType(type) {
    switch (type) {
      case 'tags':
        return this.getTags();
      case 'models':
        return this.getModels();
      default:
        return [];
    }
  }

  /**
   * 填充编辑表单
   * @param {Object} file - 文件对象
   */
  populateEditForm(file) {
    if (!file) return;
    
    // 填充标签选择框
    const tagsSelect = document.getElementById('editTagsSelect');
    if (tagsSelect) {
      tagsSelect.innerHTML = '';
      this.getTags().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        option.selected = file.tags && file.tags.includes(tag);
        tagsSelect.appendChild(option);
      });
    }
    
    // 填充模型选择框
    const modelsSelect = document.getElementById('editModelsSelect');
    if (modelsSelect) {
      modelsSelect.innerHTML = '';
      this.getModels().forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        option.selected = file.models && file.models.some(m => m.name === model);
        modelsSelect.appendChild(option);
      });
    }
  }

  /**
   * 获取选中的标签
   * @returns {Array<string>} - 选中的标签列表
   */
  getSelectedTags() {
    const select = document.getElementById('editTagsSelect');
    const selectedTags = select ? Array.from(select.selectedOptions).map(option => option.value) : [];
    
    // 获取手动输入的新标签
    const newTagInput = document.getElementById('newTagInput');
    if (newTagInput) {
      const newTags = newTagInput.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      newTags.forEach(tag => {
        if (tag && !selectedTags.includes(tag)) {
          selectedTags.push(tag);
          // 添加到预置选项中
          this.addTag(tag);
        }
      });
    }
    
    return selectedTags;
  }

  /**
   * 获取选中的模型
   * @returns {Array<Object>} - 选中的模型列表
   */
  getSelectedModels() {
    const select = document.getElementById('editModelsSelect');
    const selectedNames = select ? Array.from(select.selectedOptions).map(option => option.value) : [];
    
    // 获取手动输入的新模型
    const newModelInput = document.getElementById('newModelInput');
    if (newModelInput) {
      const newModels = newModelInput.value.split(',')
        .map(model => model.trim())
        .filter(model => model);
      
      newModels.forEach(model => {
        if (model && !selectedNames.includes(model)) {
          selectedNames.push(model);
          // 添加到预置选项中
          this.addModel(model);
        }
      });
    }
    
    return selectedNames.map(name => ({
      name: name,
      version: '1.0.0',
      performance: {
        accuracy: 85,
        efficiency: 85,
        creativity: 85
      }
    }));
  }

  /**
   * 显示管理器界面
   * @param {string} type - 管理器类型 ('tags' 或 'models')
   */
  showManager(type) {
    if (!['tags', 'models'].includes(type)) {
      console.error('Invalid manager type:', type);
      return;
    }
    
    const modal = document.getElementById('presetManagerModal');
    if (!modal) {
      console.error('Preset manager modal not found');
      return;
    }
    
    // 设置管理器类型
    modal.setAttribute('data-type', type);
    
    // 设置标题
    const title = modal.querySelector('.modal-title');
    if (title) {
      title.textContent = type === 'tags' ? '标签管理' : '模型管理';
    }
    
    // 填充列表
    this.populateManagerList(type);
    
    // 显示模态框
    modal.style.display = 'block';
  }

  /**
   * 填充管理器列表
   * @param {string} type - 管理器类型 ('tags' 或 'models')
   */
  populateManagerList(type) {
    const listContainer = document.getElementById('presetManagerList');
    if (!listContainer) return;
    
    const items = type === 'tags' ? this.getTags() : this.getModels();
    const stats = type === 'tags' ? this.getAllTagStats() : this.getAllModelStats();
    
    listContainer.innerHTML = items.map(item => {
      const usage = stats[item] || 0;
      return `
        <div class="preset-item" data-name="${item}">
          <div class="preset-info">
            <span class="preset-name">${item}</span>
            <span class="preset-usage">使用次数: ${usage}</span>
          </div>
          <div class="preset-actions">
            <button class="btn btn-sm btn-primary" onclick="presetManager.editPreset('${type}', '${item}')">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="presetManager.deletePreset('${type}', '${item}')">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 编辑预置选项
   * @param {string} type - 类型 ('tags' 或 'models')
   * @param {string} name - 选项名称
   */
  async editPreset(type, name) {
    if (!['tags', 'models'].includes(type) || !name) {
      console.error('Invalid parameters:', { type, name });
      return;
    }
    
    const newName = prompt(`请输入新的${type === 'tags' ? '标签' : '模型'}名称:`, name);
    if (!newName || newName === name) return;
    
    try {
      if (type === 'tags') {
        await this.renameTag(name, newName);
      } else {
        await this.renameModel(name, newName);
      }
      
      // 重新填充列表
      this.populateManagerList(type);
      
      // 显示成功消息
      this.showMessage(`${type === 'tags' ? '标签' : '模型'}重命名成功`, 'success');
    } catch (error) {
      console.error('Failed to edit preset:', error);
      this.showMessage(`${type === 'tags' ? '标签' : '模型'}重命名失败`, 'error');
    }
  }

  /**
   * 删除预置选项
   * @param {string} type - 类型 ('tags' 或 'models')
   * @param {string} name - 选项名称
   */
  async deletePreset(type, name) {
    if (!['tags', 'models'].includes(type) || !name) {
      console.error('Invalid parameters:', { type, name });
      return;
    }
    
    if (!confirm(`确定要删除${type === 'tags' ? '标签' : '模型'} "${name}" 吗？此操作不可撤销。`)) {
      return;
    }
    
    try {
      if (type === 'tags') {
        this.removeTag(name);
      } else {
        this.removeModel(name);
      }
      
      // 重新填充列表
      this.populateManagerList(type);
      
      // 显示成功消息
      this.showMessage(`${type === 'tags' ? '标签' : '模型'}删除成功`, 'success');
    } catch (error) {
      console.error('Failed to delete preset:', error);
      this.showMessage(`${type === 'tags' ? '标签' : '模型'}删除失败`, 'error');
    }
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 ('success', 'error', 'info')
   */
  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }
}

// 导出预置选项管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PresetManager;
} else if (typeof window !== 'undefined') {
  window.PresetManager = PresetManager;
}