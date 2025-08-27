// UI管理器 - 统一管理UI组件和交互逻辑
class UIManager {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.statsPanel = null;
    this.searchPanel = null;
    this.fileList = null;
    this.modalManager = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('初始化UI管理器...');

      // 初始化各个UI组件
      this.initStatsPanel();
      this.initSearchPanel();
      this.initFileList();
      this.initModalManager();
      this.initSettingsPanel();

      // 设置事件监听
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('UI管理器初始化完成');
    } catch (error) {
      console.error('UI管理器初始化失败:', error);
      throw error;
    }
  }

  // 初始化统计面板
  initStatsPanel() {
    this.statsPanel = new StatsPanel(this.dataManager);
    this.statsPanel.init();
  }

  // 初始化搜索面板
  initSearchPanel() {
    this.searchPanel = new SearchPanel(this.dataManager, this.presetManager);
    this.searchPanel.init();
  }

  // 初始化文件列表
  initFileList() {
    this.fileList = new FileList(this.dataManager, this.presetManager);
    this.fileList.init();
  }

  // 初始化模态框管理器
  initModalManager() {
    this.modalManager = new ModalManager(this.dataManager, this.presetManager);
    this.modalManager.init();
  }

  // 初始化设置面板
  initSettingsPanel() {
    this.settingsPanel = new SettingsPanel();
    this.settingsPanel.init();
  }

  // 设置事件监听
  setupEventListeners() {
    // 添加文件按钮
    const addFileBtn = document.getElementById('addFileBtn');
    if (addFileBtn) {
      addFileBtn.addEventListener('click', () => {
        this.modalManager.showAddFileModal();
      });
    }

    // 批量管理按钮
    const batchManageBtn = document.getElementById('batchManageBtn');
    if (batchManageBtn) {
      batchManageBtn.addEventListener('click', () => {
        this.modalManager.showBatchManageModal();
      });
    }

    // 扫描目录按钮
    const scanDirectoryBtn = document.getElementById('scanDirectoryBtn');
    if (scanDirectoryBtn) {
      scanDirectoryBtn.addEventListener('click', () => {
        this.modalManager.showScanDirectoryModal();
      });
    }

    // 设置按钮（如果存在的话）
    const settingsBtn = document.getElementById('settingsBtn');
    console.log('设置按钮:', settingsBtn);
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        console.log('设置按钮被点击');
        this.settingsPanel.show();
      });
    } else {
      console.error('找不到设置按钮');
    }

    // 监听显示设置变更事件
    document.addEventListener('displaySettingsChanged', (event) => {
      console.log('收到显示设置变更事件:', event.detail);
      if (this.fileList) {
        console.log('重新渲染文件列表以应用新设置');
        this.fileList.render();
      }
    });
  }

  // 关闭所有模态框
  closeAllModals() {
    if (this.modalManager) {
      this.modalManager.closeAllModals();
    }
    if (this.settingsPanel) {
      this.settingsPanel.hide();
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    if (window.OpenOneHTML) {
      window.OpenOneHTML.showMessage(message, type);
    }
  }

  // 刷新所有组件
  async refresh() {
    if (this.statsPanel) await this.statsPanel.refresh();
    if (this.searchPanel) await this.searchPanel.refresh();
    if (this.fileList) await this.fileList.refresh();
  }
}

// 统计面板组件
class StatsPanel {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.removeListener = null;
  }

  init() {
    // 监听数据变化
    this.removeListener = this.dataManager.addListener((data) => {
      this.updateStats(data.settings);
    });

    // 初始化统计数字
    this.updateStats(this.dataManager.getStats());

    // 设置点击事件
    this.setupClickEvents();
  }

  updateStats(stats) {
    const elements = {
      files: document.getElementById('totalFiles'),
      categories: document.getElementById('totalCategories'),
      tags: document.getElementById('totalTags'),
      models: document.getElementById('totalModels')
    };

    Object.keys(elements).forEach(key => {
      if (elements[key]) {
        elements[key].textContent = stats[`total${key.charAt(0).toUpperCase() + key.slice(1)}`] || 0;
      }
    });
  }

  setupClickEvents() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        this.handleStatClick(type);
      });
    });
  }

  handleStatClick(type) {
    switch (type) {
      case 'tags':
        this.showTagManager();
        break;
      case 'models':
        this.showModelManager();
        break;
      case 'categories':
        this.showCategoryManager();
        break;
      case 'files':
        this.scrollToFiles();
        break;
    }
  }

  showTagManager() {
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      window.OpenOneHTML.uiManager.modalManager.showTagManagerModal();
    }
  }

  showModelManager() {
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      window.OpenOneHTML.uiManager.modalManager.showModelManagerModal();
    }
  }

  showCategoryManager() {
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      window.OpenOneHTML.uiManager.modalManager.showCategoryManagerModal();
    }
  }

  scrollToFiles() {
    const filesSection = document.getElementById('filesGrid');
    if (filesSection) {
      filesSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async refresh() {
    this.updateStats(this.dataManager.getStats());
  }

  destroy() {
    if (this.removeListener) {
      this.removeListener();
    }
  }
}

// 搜索面板组件
class SearchPanel {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.currentFilters = {};
    this.removeListener = null;
  }

  init() {
    // 监听数据变化
    this.removeListener = this.dataManager.addListener(() => {
      this.updateFilterOptions();
    });

    // 设置搜索和筛选事件
    this.setupSearchEvents();
    this.setupFilterEvents();

    // 初始化筛选选项
    this.updateFilterOptions();
  }

  setupSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  setupFilterEvents() {
    const categoryFilter = document.getElementById('categoryFilter');
    const tagsFilter = document.getElementById('tagsFilter');
    const modelFilter = document.getElementById('modelFilter');

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.onFilterChange());
    }

    if (tagsFilter) {
      tagsFilter.addEventListener('change', () => this.onFilterChange());
    }

    if (modelFilter) {
      modelFilter.addEventListener('change', () => this.onFilterChange());
    }


  }

  updateFilterOptions() {
    this.updateCategoryOptions();
    this.updateTagOptions();
    this.updateModelOptions();
  }

  updateCategoryOptions() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const files = this.dataManager.data?.files || [];
    const categories = [...new Set(files.map(f => f.category).filter(Boolean))];

    // 清空现有选项（保留"全部"选项）
    const defaultOption = categoryFilter.querySelector('option[value=""]');
    categoryFilter.innerHTML = '';
    if (defaultOption) categoryFilter.appendChild(defaultOption);

    // 添加分类选项
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  updateTagOptions() {
    const tagsFilter = document.getElementById('tagsFilter');
    if (!tagsFilter) return;

    const tags = this.presetManager.getTags();

    // 清空现有选项（保留"选择标签"选项）
    const defaultOption = tagsFilter.querySelector('option[value=""]');
    tagsFilter.innerHTML = '';
    if (defaultOption) tagsFilter.appendChild(defaultOption);

    // 添加标签选项
    tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = tag.name;
      tagsFilter.appendChild(option);
    });
  }

  updateModelOptions() {
    const modelFilter = document.getElementById('modelFilter');
    if (!modelFilter) return;

    const models = this.presetManager.getModels();

    // 清空现有选项（保留"全部"选项）
    const defaultOption = modelFilter.querySelector('option[value=""]');
    modelFilter.innerHTML = '';
    if (defaultOption) modelFilter.appendChild(defaultOption);

    // 添加模型选项
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      modelFilter.appendChild(option);
    });
  }

  getCurrentFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const tagsFilter = document.getElementById('tagsFilter');
    const modelFilter = document.getElementById('modelFilter');

    const filters = {};

    if (searchInput && searchInput.value.trim()) {
      filters.search = searchInput.value.trim();
    }

    if (categoryFilter && categoryFilter.value) {
      filters.category = categoryFilter.value;
    }

    if (tagsFilter && tagsFilter.value) {
      filters.tags = [tagsFilter.value];
    }

    if (modelFilter && modelFilter.value) {
      filters.model = modelFilter.value;
    }

    return filters;
  }

  performSearch() {
    this.currentFilters = this.getCurrentFilters();
    this.triggerSearch();
  }

  onFilterChange() {
    this.performSearch();
  }

  clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const tagsFilter = document.getElementById('tagsFilter');
    const modelFilter = document.getElementById('modelFilter');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (tagsFilter) {
      tagsFilter.value = '';
    }
    if (modelFilter) modelFilter.value = '';

    this.currentFilters = {};
    this.triggerSearch();
  }

  triggerSearch() {
    // 触发自定义事件，让文件列表组件知道搜索条件已更新
    const event = new CustomEvent('searchFiltersChanged', {
      detail: { filters: this.currentFilters }
    });
    document.dispatchEvent(event);
  }

  async refresh() {
    this.updateFilterOptions();
  }

  destroy() {
    if (this.removeListener) {
      this.removeListener();
    }
  }
}
