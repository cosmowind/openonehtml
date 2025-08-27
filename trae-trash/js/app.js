/**
 * 主应用文件 - 初始化和协调所有管理器
 * 负责应用的启动、初始化和全局状态管理
 */

// 全局变量
let dataManager;
let presetManager;
let uiManager;
let appInitialized = false;

/**
 * 应用主类
 */
class App {
  constructor() {
    this.initialized = false;
    this.initializing = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.initializing) {
      console.warn('App is already initializing');
      return;
    }
    
    if (this.initialized) {
      console.warn('App is already initialized');
      return;
    }
    
    this.initializing = true;
    
    try {
      console.log('Initializing app...');
      
      // 显示加载状态
      this.showLoading(true);
      
      // 初始化数据管理器
      await this.initDataManager();
      
      // 初始化预置选项管理器
      await this.initPresetManager();
      
      // 初始化UI管理器
      await this.initUIManager();
      
      // 设置全局事件监听器
      this.setupGlobalEventListeners();
      
      // 初始化完成
      this.initialized = true;
      appInitialized = true;
      
      console.log('App initialized successfully');
      
      // 隐藏加载状态
      this.showLoading(false);
      
      // 触发应用初始化完成事件
      this.triggerAppEvent('initialized');
      
    } catch (error) {
      console.error('App initialization failed:', error);
      this.initializing = false;
      this.showLoading(false);
      this.showError('应用初始化失败，请刷新页面重试');
      throw error;
    }
  }

  /**
   * 初始化数据管理器
   */
  async initDataManager() {
    try {
      console.log('Initializing DataManager...');
      
      // 创建数据管理器实例
      dataManager = new DataManager();
      
      // 加载数据
      await dataManager.loadData();
      
      console.log('DataManager initialized successfully');
      
    } catch (error) {
      console.error('DataManager initialization failed:', error);
      throw new Error('数据管理器初始化失败');
    }
  }

  /**
   * 初始化预置选项管理器
   */
  async initPresetManager() {
    try {
      console.log('Initializing PresetManager...');
      
      // 创建预置选项管理器实例
      presetManager = new PresetManager(dataManager);
      
      console.log('PresetManager initialized successfully');
      
    } catch (error) {
      console.error('PresetManager initialization failed:', error);
      throw new Error('预置选项管理器初始化失败');
    }
  }

  /**
   * 初始化UI管理器
   */
  async initUIManager() {
    try {
      console.log('Initializing UIManager...');
      
      // 创建UI管理器实例
      uiManager = new UIManager(dataManager, presetManager);
      
      console.log('UIManager initialized successfully');
      
    } catch (error) {
      console.error('UIManager initialization failed:', error);
      throw new Error('UI管理器初始化失败');
    }
  }

  /**
   * 设置全局事件监听器
   */
  setupGlobalEventListeners() {
    // 页面加载完成事件
    document.addEventListener('DOMContentLoaded', () => {
      this.handleDOMContentLoaded();
    });
    
    // 页面卸载事件
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });
    
    // 网络状态变化事件
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
    
    // 错误处理
    window.addEventListener('error', (e) => {
      this.handleError(e);
    });
    
    // 未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (e) => {
      this.handleUnhandledRejection(e);
    });
  }

  /**
   * 处理DOM内容加载完成
   */
  handleDOMContentLoaded() {
    console.log('DOM content loaded');
    
    // 如果应用未初始化，则初始化
    if (!this.initialized && !this.initializing) {
      this.init().catch(error => {
        console.error('Failed to initialize app on DOMContentLoaded:', error);
      });
    }
  }

  /**
   * 处理页面卸载
   */
  handleBeforeUnload() {
    console.log('Page unloading');
    
    // 保存数据
    if (dataManager) {
      dataManager.saveData().catch(error => {
        console.error('Failed to save data on page unload:', error);
      });
    }
  }

  /**
   * 处理网络在线
   */
  handleOnline() {
    console.log('Network online');
    this.showMessage('网络已连接', 'success');
  }

  /**
   * 处理网络离线
   */
  handleOffline() {
    console.log('Network offline');
    this.showMessage('网络已断开', 'warning');
  }

  /**
   * 处理错误
   * @param {ErrorEvent} e - 错误事件
   */
  handleError(e) {
    console.error('Global error:', e.error);
    
    // 显示错误消息
    this.showError('发生错误，请刷新页面重试');
  }

  /**
   * 处理未处理的Promise拒绝
   * @param {PromiseRejectionEvent} e - Promise拒绝事件
   */
  handleUnhandledRejection(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    // 显示错误消息
    this.showError('发生错误，请刷新页面重试');
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
   * @param {string} type - 消息类型
   */
  showMessage(message, type = 'info') {
    if (uiManager) {
      uiManager.showMessage(message, type);
    } else {
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

  /**
   * 显示错误
   * @param {string} message - 错误消息
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * 触发应用事件
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  triggerAppEvent(eventType, data = {}) {
    const event = new CustomEvent(`app:${eventType}`, {
      detail: data
    });
    
    document.dispatchEvent(event);
    console.log(`App event triggered: ${eventType}`, data);
  }

  /**
   * 刷新应用
   */
  async refresh() {
    try {
      console.log('Refreshing app...');
      
      // 显示加载状态
      this.showLoading(true);
      
      // 刷新数据
      if (dataManager) {
        await dataManager.loadData();
      }
      
      // 刷新预置选项
      if (presetManager) {
        await presetManager.loadPresets();
      }
      
      // 更新UI
      if (uiManager) {
        uiManager.updateAllComponents();
      }
      
      // 隐藏加载状态
      this.showLoading(false);
      
      // 显示成功消息
      this.showMessage('应用刷新成功', 'success');
      
      console.log('App refreshed successfully');
      
    } catch (error) {
      console.error('Failed to refresh app:', error);
      this.showLoading(false);
      this.showError('应用刷新失败');
    }
  }

  /**
   * 重置应用
   */
  async reset() {
    try {
      console.log('Resetting app...');
      
      if (!confirm('确定要重置应用吗？此操作将清除所有数据，且不可撤销。')) {
        return;
      }
      
      // 显示加载状态
      this.showLoading(true);
      
      // 重置数据
      if (dataManager) {
        await dataManager.resetData();
      }
      
      // 重置预置选项
      if (presetManager) {
        await presetManager.loadPresets();
      }
      
      // 更新UI
      if (uiManager) {
        uiManager.updateAllComponents();
      }
      
      // 隐藏加载状态
      this.showLoading(false);
      
      // 显示成功消息
      this.showMessage('应用重置成功', 'success');
      
      console.log('App reset successfully');
      
    } catch (error) {
      console.error('Failed to reset app:', error);
      this.showLoading(false);
      this.showError('应用重置失败');
    }
  }

  /**
   * 获取应用状态
   * @returns {Object} - 应用状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      initializing: this.initializing,
      dataManager: dataManager ? {
        initialized: dataManager.initialized,
        dataLoaded: dataManager.data !== null
      } : null,
      presetManager: presetManager ? {
        initialized: presetManager.initialized
      } : null,
      uiManager: uiManager ? {
        initialized: uiManager.initialized
      } : null
    };
  }
}

// 创建应用实例
const app = new App();

// 全局函数，用于在HTML中调用
window.app = app;
window.dataManager = dataManager;
window.presetManager = presetManager;
window.uiManager = uiManager;

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
      console.error('Failed to initialize app:', error);
    });
  });
} else {
  app.init().catch(error => {
    console.error('Failed to initialize app:', error);
  });
}

// 导出应用实例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}