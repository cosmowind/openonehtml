/**
 * UI管理器 - 统一管理所有UI组件和交互逻辑
 * 负责UI组件的初始化、更新和事件处理
 */
class UIManager {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.components = {};
    this.initialized = false;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化UI管理器
   */
  async init() {
    try {
      // 初始化组件
      await this.initComponents();
      
      // 设置事件监听器
      this.setupEventListeners();
      
      // 设置数据监听器
      this.setupDataListeners();
      
      this.initialized = true;
      console.log('UIManager initialized successfully');
    } catch (error) {
      console.error('UIManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化组件
   */
  async initComponents() {
    // 初始化统计面板
    this.components.statsPanel = new StatsPanel(this.dataManager);
    
    // 初始化搜索面板
    this.components.searchPanel = new SearchPanel(this.dataManager, this.presetManager);
    
    // 初始化文件列表
    this.components.fileList = new FileList(this.dataManager, this.presetManager);
    
    // 初始化模态框
    this.components.modalManager = new ModalManager(this.dataManager, this.presetManager);
    
    // 初始化预置选项管理器
    this.components.presetManager = new PresetManagerUI(this.presetManager);
    
    // 初始化所有组件
    for (const [name, component] of Object.entries(this.components)) {
      if (component.init && typeof component.init === 'function') {
        await component.init();
      }
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 设置全局事件监听器
    document.addEventListener('DOMContentLoaded', () => {
      this.handleDOMContentLoaded();
    });
    
    // 设置窗口大小变化监听器
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // 设置键盘事件监听器
    document.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
  }

  /**
   * 设置数据监听器
   */
  setupDataListeners() {
    if (!this.dataManager) return;
    
    // 监听数据变化
    this.dataManager.addListener((type, data) => {
      this.handleDataChange(type, data);
    });
    
    // 监听预置选项变化
    if (this.presetManager) {
      this.presetManager.addListener((type, data) => {
        this.handlePresetChange(type, data);
      });
    }
  }

  /**
   * 处理DOM内容加载完成事件
   */
  handleDOMContentLoaded() {
    console.log('DOM content loaded');
    
    // 更新所有组件
    this.updateAllComponents();
  }

  /**
   * 处理窗口大小变化事件
   */
  handleResize() {
    console.log('Window resized');
    
    // 更新响应式布局
    this.updateResponsiveLayout();
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeydown(e) {
    // 处理快捷键
    switch (e.key) {
      case 'Escape':
        this.handleEscapeKey();
        break;
      case 'F5':
        this.handleF5Key(e);
        break;
      case 'f':
      case 'F':
        if (e.ctrlKey || e.metaKey) {
          this.handleCtrlFKey(e);
        }
        break;
    }
  }

  /**
   * 处理ESC键
   */
  handleEscapeKey() {
    // 关闭所有模态框
    if (this.components.modalManager) {
      this.components.modalManager.closeAllModals();
    }
  }

  /**
   * 处理F5键
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleF5Key(e) {
    e.preventDefault();
    // 刷新数据
    this.refreshData();
  }

  /**
   * 处理Ctrl+F键
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleCtrlFKey(e) {
    e.preventDefault();
    // 聚焦搜索框
    if (this.components.searchPanel) {
      this.components.searchPanel.focusSearch();
    }
  }

  /**
   * 处理数据变化
   * @param {string} type - 变化类型
   * @param {*} data - 变化数据
   */
  handleDataChange(type, data) {
    console.log('Data changed:', type, data);
    
    // 根据变化类型更新相应组件
    switch (type) {
      case 'data':
        this.updateAllComponents();
        break;
      case 'statistics':
        if (this.components.statsPanel) {
          this.components.statsPanel.update();
        }
        break;
      case 'files':
        if (this.components.fileList) {
          this.components.fileList.update();
        }
        break;
      case 'search':
        if (this.components.searchPanel) {
          this.components.searchPanel.update();
        }
        if (this.components.fileList) {
          this.components.fileList.update();
        }
        break;
    }
  }

  /**
   * 处理预置选项变化
   * @param {string} type - 变化类型
   * @param {*} data - 变化数据
   */
  handlePresetChange(type, data) {
    console.log('Preset changed:', type, data);
    
    // 更新搜索面板
    if (this.components.searchPanel) {
      this.components.searchPanel.updatePresets();
    }
    
    // 更新文件列表
    if (this.components.fileList) {
      this.components.fileList.updatePresets();
    }
    
    // 更新模态框
    if (this.components.modalManager) {
      this.components.modalManager.updatePresets();
    }
  }

  /**
   * 更新所有组件
   */
  updateAllComponents() {
    for (const [name, component] of Object.entries(this.components)) {
      if (component.update && typeof component.update === 'function') {
        try {
          component.update();
        } catch (error) {
          console.error(`Error updating component ${name}:`, error);
        }
      }
    }
  }

  /**
   * 更新响应式布局
   */
  updateResponsiveLayout() {
    // 更新组件的响应式布局
    for (const [name, component] of Object.entries(this.components)) {
      if (component.updateResponsiveLayout && typeof component.updateResponsiveLayout === 'function') {
        try {
          component.updateResponsiveLayout();
        } catch (error) {
          console.error(`Error updating responsive layout for component ${name}:`, error);
        }
      }
    }
  }

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      // 显示加载状态
      this.showLoading(true);
      
      // 刷新数据
      if (this.dataManager) {
        await this.dataManager.loadData();
      }
      
      // 刷新预置选项
      if (this.presetManager) {
        await this.presetManager.loadPresets();
      }
      
      // 更新所有组件
      this.updateAllComponents();
      
      // 显示成功消息
      this.showMessage('数据刷新成功', 'success');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showMessage('数据刷新失败', 'error');
    } finally {
      // 隐藏加载状态
      this.showLoading(false);
    }
  }

  /**
   * 显示加载状态
   * @param {boolean} show - 是否显示
   */
  showLoading(show) {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 ('success', 'error', 'info', 'warning')
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

  /**
   * 获取组件
   * @param {string} name - 组件名称
   * @returns {*} - 组件实例
   */
  getComponent(name) {
    return this.components[name];
  }

  /**
   * 注册组件
   * @param {string} name - 组件名称
   * @param {*} component - 组件实例
   */
  registerComponent(name, component) {
    this.components[name] = component;
    console.log(`Component registered: ${name}`);
  }

  /**
   * 注销组件
   * @param {string} name - 组件名称
   */
  unregisterComponent(name) {
    if (this.components[name]) {
      delete this.components[name];
      console.log(`Component unregistered: ${name}`);
    }
  }
}

/**
 * 统计面板组件
 */
class StatsPanel {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.element = document.getElementById('statsPanel');
  }

  /**
   * 初始化
   */
  init() {
    this.update();
  }

  /**
   * 更新统计信息
   */
  update() {
    if (!this.element || !this.dataManager || !this.dataManager.data) {
      return;
    }
    
    const stats = this.dataManager.data.statistics || {};
    
    // 更新文件总数
    const totalFilesEl = this.element.querySelector('.stat-card[data-type="total-files"] .stat-value');
    if (totalFilesEl) {
      totalFilesEl.textContent = stats.total_files || 0;
    }
    
    // 更新分类统计
    const categoriesEl = this.element.querySelector('.stat-card[data-type="categories"] .stat-value');
    if (categoriesEl) {
      categoriesEl.textContent = Object.keys(stats.categories || {}).length;
    }
    
    // 更新标签统计
    const tagsEl = this.element.querySelector('.stat-card[data-type="tags"] .stat-value');
    if (tagsEl) {
      tagsEl.textContent = Object.keys(stats.tags || {}).length;
    }
    
    // 更新模型统计
    const modelsEl = this.element.querySelector('.stat-card[data-type="models"] .stat-value');
    if (modelsEl) {
      modelsEl.textContent = Object.keys(stats.models || {}).length;
    }
  }
}

/**
 * 搜索面板组件
 */
class SearchPanel {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.element = document.getElementById('searchPanel');
    this.searchInput = document.getElementById('searchInput');
    this.filterContainer = document.getElementById('filterContainer');
  }

  /**
   * 初始化
   */
  init() {
    this.setupEventListeners();
    this.updatePresets();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 搜索输入事件
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });
    }
    
    // 搜索按钮事件
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }
    
    // 重置按钮事件
    const resetBtn = document.getElementById('resetSearchBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetSearch();
      });
    }
  }

  /**
   * 处理搜索输入
   * @param {string} value - 搜索值
   */
  handleSearchInput(value) {
    // 防抖处理
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  /**
   * 执行搜索
   */
  performSearch() {
    if (!this.dataManager) return;
    
    const query = this.searchInput ? this.searchInput.value.trim() : '';
    const filters = this.getFilters();
    
    this.dataManager.search(query, filters);
  }

  /**
   * 重置搜索
   */
  resetSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    // 重置过滤器
    this.resetFilters();
    
    // 执行搜索
    this.performSearch();
  }

  /**
   * 获取过滤器
   * @returns {Object} - 过滤器对象
   */
  getFilters() {
    const filters = {};
    
    // 获取分类过滤器
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      filters.category = categoryFilter.value;
    }
    
    // 获取标签过滤器
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
      filters.tags = Array.from(tagFilter.selectedOptions).map(option => option.value);
    }
    
    // 获取模型过滤器
    const modelFilter = document.getElementById('modelFilter');
    if (modelFilter) {
      filters.models = Array.from(modelFilter.selectedOptions).map(option => option.value);
    }
    
    return filters;
  }

  /**
   * 重置过滤器
   */
  resetFilters() {
    // 重置分类过滤器
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.value = '';
    }
    
    // 重置标签过滤器
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
      Array.from(tagFilter.options).forEach(option => {
        option.selected = false;
      });
    }
    
    // 重置模型过滤器
    const modelFilter = document.getElementById('modelFilter');
    if (modelFilter) {
      Array.from(modelFilter.options).forEach(option => {
        option.selected = false;
      });
    }
  }

  /**
   * 更新预置选项
   */
  updatePresets() {
    if (!this.presetManager) return;
    
    // 更新标签过滤器
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
      const currentValue = Array.from(tagFilter.selectedOptions).map(option => option.value);
      tagFilter.innerHTML = '';
      
      this.presetManager.getTags().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        option.selected = currentValue.includes(tag);
        tagFilter.appendChild(option);
      });
    }
    
    // 更新模型过滤器
    const modelFilter = document.getElementById('modelFilter');
    if (modelFilter) {
      const currentValue = Array.from(modelFilter.selectedOptions).map(option => option.value);
      modelFilter.innerHTML = '';
      
      this.presetManager.getModels().forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        option.selected = currentValue.includes(model);
        modelFilter.appendChild(option);
      });
    }
  }

  /**
   * 聚焦搜索框
   */
  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }

  /**
   * 更新
   */
  update() {
    // 更新搜索结果
    this.updateSearchResults();
  }

  /**
   * 更新搜索结果
   */
  updateSearchResults() {
    if (!this.dataManager) return;
    
    // 获取所有文件作为搜索结果
    const results = this.dataManager.data?.html_files || [];
    const resultsCount = document.getElementById('searchResultsCount');
    
    if (resultsCount) {
      resultsCount.textContent = `搜索结果: ${results.length} 个文件`;
    }
  }
}

// 导出UI管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIManager, StatsPanel, SearchPanel };
} else if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
  window.StatsPanel = StatsPanel;
  window.SearchPanel = SearchPanel;
}