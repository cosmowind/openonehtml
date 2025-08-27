// OpenOneHTML 主应用入口
class App {
  constructor() {
    this.dataManager = null;
    this.presetManager = null;
    this.uiManager = null;
    this.components = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('正在初始化OpenOneHTML应用...');

      // 初始化数据管理器
      this.dataManager = new DataManager();
      await this.dataManager.init();

      // 初始化预置选项管理器
      this.presetManager = new PresetManager();
      await this.presetManager.init();

      // 初始化UI管理器
      this.uiManager = new UIManager(this.dataManager, this.presetManager);
      await this.uiManager.init();

      // 初始化组件
      this.components = new Components(this.dataManager, this.presetManager, this.uiManager);
      await this.components.init();

      // 设置全局事件监听
      this.setupGlobalEvents();

      this.isInitialized = true;
      console.log('OpenOneHTML应用初始化完成');

      // 显示成功消息
      this.showMessage('应用初始化成功！', 'success');

    } catch (error) {
      console.error('应用初始化失败:', error);
      this.showMessage('应用初始化失败，请刷新页面重试', 'error');
    }
  }

  setupGlobalEvents() {
    // 处理键盘快捷键
    document.addEventListener('keydown', (e) => {
      // ESC键关闭模态框
      if (e.key === 'Escape') {
        this.uiManager.closeAllModals();
      }

      // Ctrl/Cmd + K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
        }
      }
    });

    // 处理页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        // 页面重新可见时刷新数据
        this.dataManager.refreshData();
      }
    });

    // 处理网络状态变化
    window.addEventListener('online', () => {
      if (this.isInitialized) {
        this.showMessage('网络连接已恢复', 'success');
        this.dataManager.refreshData();
      }
    });

    window.addEventListener('offline', () => {
      this.showMessage('网络连接已断开', 'error');
    });
  }

  showMessage(message, type = 'info') {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;

    // 添加到消息容器
    const container = document.getElementById('messageContainer') || this.createMessageContainer();
    container.appendChild(messageEl);

    // 3秒后自动移除
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }

  createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    container.className = 'message-container';
    document.body.appendChild(container);
    return container;
  }

  // 全局方法：刷新应用数据
  async refresh() {
    if (this.isInitialized) {
      await this.dataManager.refreshData();
      this.showMessage('数据已刷新', 'success');
    }
  }

  // 全局方法：导出数据
  exportData() {
    if (this.isInitialized) {
      return this.dataManager.exportData();
    }
  }

  // 全局方法：导入数据
  async importData(data) {
    if (this.isInitialized) {
      await this.dataManager.importData(data);
      this.showMessage('数据导入成功', 'success');
    }
  }
}

// 全局应用实例
window.OpenOneHTML = new App();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.OpenOneHTML.init();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
