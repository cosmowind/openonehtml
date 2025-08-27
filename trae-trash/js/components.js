/**
 * 文件列表组件
 */
class FileList {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.element = document.getElementById('fileList');
    this.template = document.getElementById('fileCardTemplate');
  }

  /**
   * 初始化
   */
  init() {
    this.setupEventListeners();
    this.update();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 文件卡片点击事件委托
    if (this.element) {
      this.element.addEventListener('click', (e) => {
        this.handleFileCardClick(e);
      });
    }
  }

  /**
   * 处理文件卡片点击
   * @param {Event} e - 点击事件
   */
  handleFileCardClick(e) {
    const card = e.target.closest('.file-card');
    if (!card) return;
    
    const fileId = card.getAttribute('data-id');
    if (!fileId) return;
    
    // 查找文件数据
    const file = this.dataManager.getFileById(fileId);
    if (!file) return;
    
    // 处理不同的点击操作
    if (e.target.closest('.view-btn')) {
      this.viewFile(file);
    } else if (e.target.closest('.edit-btn')) {
      this.editFile(file);
    } else if (e.target.closest('.delete-btn')) {
      this.deleteFile(file);
    } else {
      // 默认查看文件
      this.viewFile(file);
    }
  }

  /**
   * 查看文件
   * @param {Object} file - 文件对象
   */
  viewFile(file) {
    if (!file || !file.path) return;
    
    // 在新窗口中打开文件
    window.open(file.path, '_blank');
  }

  /**
   * 编辑文件
   * @param {Object} file - 文件对象
   */
  editFile(file) {
    if (!file) return;
    
    // 显示编辑模态框
    const modal = document.getElementById('editFileModal');
    if (modal) {
      this.populateEditForm(file);
      modal.style.display = 'block';
    }
  }

  /**
   * 删除文件
   * @param {Object} file - 文件对象
   */
  deleteFile(file) {
    if (!file) return;
    
    if (!confirm(`确定要删除文件 "${file.original_name || file.name}" 吗？此操作不可撤销。`)) {
      return;
    }
    
    // 执行删除
    this.dataManager.deleteFile(file.id)
      .then(() => {
        this.showMessage('文件删除成功', 'success');
      })
      .catch(error => {
        console.error('Failed to delete file:', error);
        this.showMessage('文件删除失败', 'error');
      });
  }

  /**
   * 填充编辑表单
   * @param {Object} file - 文件对象
   */
  populateEditForm(file) {
    if (!file) return;
    
    // 设置文件ID
    const fileIdInput = document.getElementById('editFileId');
    if (fileIdInput) {
      fileIdInput.value = file.id;
    }
    
    // 设置文件名称
    const fileNameInput = document.getElementById('editFileName');
    if (fileNameInput) {
      fileNameInput.value = file.original_name || file.name || '';
    }
    
    // 设置场景
    const sceneInput = document.getElementById('editScene');
    if (sceneInput) {
      sceneInput.value = file.scene || '';
    }
    
    // 设置描述
    const descriptionInput = document.getElementById('editDescription');
    if (descriptionInput) {
      descriptionInput.value = file.description || '';
    }
    
    // 填充预置选项
    if (this.presetManager) {
      this.presetManager.populateEditForm(file);
    }
  }

  /**
   * 更新文件列表
   */
  update() {
    if (!this.element || !this.dataManager) return;
    
    // 获取搜索参数
    const searchParams = {
      search: document.getElementById('searchInput')?.value || '',
      category: document.getElementById('categoryFilter')?.value || '',
      tag: document.getElementById('tagFilter')?.value || '',
      model: document.getElementById('modelFilter')?.value || ''
    };
    
    const files = this.dataManager.searchFiles(searchParams);
    
    // 清空列表
    this.element.innerHTML = '';
    
    // 如果没有文件，显示空状态
    if (files.length === 0) {
      this.element.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <div class="empty-text">没有找到文件</div>
          <div class="empty-subtext">请检查搜索条件或添加新文件</div>
        </div>
      `;
      return;
    }
    
    // 渲染文件卡片
    files.forEach(file => {
      const card = this.createFileCard(file);
      this.element.appendChild(card);
    });
  }

  /**
   * 创建文件卡片
   * @param {Object} file - 文件对象
   * @returns {HTMLElement} - 文件卡片元素
   */
  createFileCard(file) {
    let card;

    // 使用模板或直接创建
    if (this.template) {
      // 使用模板时，直接克隆模板内容，因为模板已经包含了file-card结构
      card = this.template.content.cloneNode(true).querySelector('.file-card');
      card.setAttribute('data-id', file.id);
    } else {
      // 不使用模板时，需要手动创建完整的卡片结构
      card = document.createElement('div');
      card.className = 'file-card';
      card.setAttribute('data-id', file.id);
      card.innerHTML = this.getFileCardHTML(file);
    }
    
    // 填充数据
    this.populateFileCard(card, file);
    
    return card;
  }

  /**
   * 获取文件卡片HTML
   * @param {Object} file - 文件对象
   * @returns {string} - HTML字符串
   */
  getFileCardHTML(file) {
    return `
      <div class="file-card-header">
        <h3 class="file-name">${file.original_name || file.name || '未命名文件'}</h3>
        <div class="file-actions">
          <button class="btn btn-sm btn-primary view-btn">查看</button>
          <button class="btn btn-sm btn-secondary edit-btn">编辑</button>
          <button class="btn btn-sm btn-danger delete-btn">删除</button>
        </div>
      </div>
      <div class="file-card-body">
        <div class="file-info">
          <div class="info-item">
            <span class="info-label">场景:</span>
            <span class="info-value">${file.scene || '未设置'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">分类:</span>
            <span class="info-value">${file.category || '未分类'}</span>
          </div>
        </div>
        <div class="file-tags">
          ${this.renderTags(file.tags)}
        </div>
        <div class="file-models">
          ${this.renderModels(file.models)}
        </div>
        <div class="file-description">
          ${file.description || '暂无描述'}
        </div>
      </div>
      <div class="file-card-footer">
        <div class="file-meta">
          <span class="meta-item">创建时间: ${this.formatDate(file.created_at)}</span>
          <span class="meta-item">更新时间: ${this.formatDate(file.updated_at)}</span>
        </div>
      </div>
    `;
  }

  /**
   * 填充文件卡片
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} file - 文件对象
   */
  populateFileCard(card, file) {
    // 填充文件名称
    const nameEl = card.querySelector('.file-name');
    if (nameEl) {
      nameEl.textContent = file.original_name || file.name || '未命名文件';
    }
    
    // 填充场景
    const sceneEl = card.querySelector('.info-value');
    if (sceneEl) {
      sceneEl.textContent = file.scene || '未设置';
    }
    
    // 填充分类
    const categoryEl = card.querySelector('.info-value:nth-of-type(2)');
    if (categoryEl) {
      categoryEl.textContent = file.category || '未分类';
    }
    
    // 填充标签
    const tagsEl = card.querySelector('.file-tags');
    if (tagsEl) {
      tagsEl.innerHTML = this.renderTags(file.tags);
    }
    
    // 填充模型
    const modelsEl = card.querySelector('.file-models');
    if (modelsEl) {
      modelsEl.innerHTML = this.renderModels(file.models);
    }
    
    // 填充描述
    const descriptionEl = card.querySelector('.file-description');
    if (descriptionEl) {
      descriptionEl.textContent = file.description || '暂无描述';
    }
    
    // 填充元数据
    const metaEls = card.querySelectorAll('.meta-item');
    if (metaEls.length >= 2) {
      metaEls[0].textContent = `创建时间: ${this.formatDate(file.created_at)}`;
      metaEls[1].textContent = `更新时间: ${this.formatDate(file.updated_at)}`;
    }
  }

  /**
   * 渲染标签
   * @param {Array<string>} tags - 标签数组
   * @returns {string} - HTML字符串
   */
  renderTags(tags) {
    if (!tags || tags.length === 0) {
      return '<span class="no-tags">暂无标签</span>';
    }
    
    return tags.map(tag => `
      <span class="tag">${tag}</span>
    `).join('');
  }

  /**
   * 渲染模型
   * @param {Array<Object>} models - 模型数组
   * @returns {string} - HTML字符串
   */
  renderModels(models) {
    if (!models || models.length === 0) {
      return '<span class="no-models">暂无模型</span>';
    }
    
    return models.map(model => `
      <span class="model">${model.name || '未命名模型'}</span>
    `).join('');
  }

  /**
   * 格式化日期
   * @param {string} dateStr - 日期字符串
   * @returns {string} - 格式化后的日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '未知';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateStr;
    }
  }

  /**
   * 更新预置选项
   */
  updatePresets() {
    // 预置选项更新时，重新渲染文件列表
    this.update();
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
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

/**
 * 模态框管理器
 */
class ModalManager {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.modals = {};
    this.activeModal = null;
  }

  /**
   * 初始化
   */
  init() {
    this.setupEventListeners();
    this.initializeModals();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 全局点击事件，用于关闭模态框
    document.addEventListener('click', (e) => {
      this.handleGlobalClick(e);
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * 初始化模态框
   */
  initializeModals() {
    // 查找所有模态框
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      const modalId = modal.id;
      if (modalId) {
        this.modals[modalId] = {
          element: modal,
          isOpen: false
        };
        
        // 设置关闭按钮
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            this.closeModal(modalId);
          });
        }
      }
    });
  }

  /**
   * 处理全局点击
   * @param {Event} e - 点击事件
   */
  handleGlobalClick(e) {
    // 如果点击的是模态框外部，关闭模态框
    if (e.target.classList.contains('modal')) {
      const modalId = e.target.id;
      if (modalId) {
        this.closeModal(modalId);
      }
    }
  }

  /**
   * 打开模态框
   * @param {string} modalId - 模态框ID
   * @param {Object} data - 模态框数据
   */
  openModal(modalId, data = {}) {
    const modal = this.modals[modalId];
    if (!modal) {
      console.error('Modal not found:', modalId);
      return;
    }
    
    // 关闭其他模态框
    this.closeAllModals();
    
    // 打开模态框
    modal.element.style.display = 'block';
    modal.isOpen = true;
    this.activeModal = modalId;
    
    // 触发模态框打开事件
    this.triggerModalEvent(modalId, 'open', data);
    
    // 设置模态框数据
    this.setModalData(modalId, data);
  }

  /**
   * 关闭模态框
   * @param {string} modalId - 模态框ID
   */
  closeModal(modalId) {
    const modal = this.modals[modalId];
    if (!modal || !modal.isOpen) {
      return;
    }
    
    // 关闭模态框
    modal.element.style.display = 'none';
    modal.isOpen = false;
    
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    
    // 触发模态框关闭事件
    this.triggerModalEvent(modalId, 'close');
  }

  /**
   * 关闭所有模态框
   */
  closeAllModals() {
    Object.keys(this.modals).forEach(modalId => {
      this.closeModal(modalId);
    });
  }

  /**
   * 触发模态框事件
   * @param {string} modalId - 模态框ID
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  triggerModalEvent(modalId, eventType, data = {}) {
    const modal = this.modals[modalId];
    if (!modal) return;
    
    // 触发自定义事件
    const event = new CustomEvent(`modal:${eventType}`, {
      detail: {
        modalId,
        ...data
      }
    });
    
    modal.element.dispatchEvent(event);
  }

  /**
   * 设置模态框数据
   * @param {string} modalId - 模态框ID
   * @param {Object} data - 模态框数据
   */
  setModalData(modalId, data) {
    const modal = this.modals[modalId];
    if (!modal) return;
    
    // 根据模态框类型设置数据
    switch (modalId) {
      case 'editFileModal':
        this.setEditFileModalData(data);
        break;
      case 'deleteFileModal':
        this.setDeleteFileModalData(data);
        break;
      case 'presetManagerModal':
        this.setPresetManagerModalData(data);
        break;
    }
  }

  /**
   * 设置编辑文件模态框数据
   * @param {Object} data - 模态框数据
   */
  setEditFileModalData(data) {
    if (!data.file) return;
    
    const file = data.file;
    
    // 设置文件ID
    const fileIdInput = document.getElementById('editFileId');
    if (fileIdInput) {
      fileIdInput.value = file.id;
    }
    
    // 设置文件名称
    const fileNameInput = document.getElementById('editFileName');
    if (fileNameInput) {
      fileNameInput.value = file.name || '';
    }
    
    // 设置场景
    const sceneInput = document.getElementById('editScene');
    if (sceneInput) {
      sceneInput.value = file.scene || '';
    }
    
    // 设置描述
    const descriptionInput = document.getElementById('editDescription');
    if (descriptionInput) {
      descriptionInput.value = file.description || '';
    }
    
    // 填充预置选项
    if (this.presetManager) {
      this.presetManager.populateEditForm(file);
    }
  }

  /**
   * 设置删除文件模态框数据
   * @param {Object} data - 模态框数据
   */
  setDeleteFileModalData(data) {
    if (!data.file) return;
    
    const file = data.file;
    
    // 设置文件名称
    const fileNameEl = document.getElementById('deleteFileName');
    if (fileNameEl) {
      fileNameEl.textContent = file.name || '未命名文件';
    }
    
    // 设置文件ID
    const fileIdInput = document.getElementById('deleteFileId');
    if (fileIdInput) {
      fileIdInput.value = file.id;
    }
  }

  /**
   * 设置预置选项管理器模态框数据
   * @param {Object} data - 模态框数据
   */
  setPresetManagerModalData(data) {
    const type = data.type || 'tags';
    
    // 设置管理器类型
    const modal = document.getElementById('presetManagerModal');
    if (modal) {
      modal.setAttribute('data-type', type);
    }
    
    // 设置标题
    const title = modal.querySelector('.modal-title');
    if (title) {
      title.textContent = type === 'tags' ? '标签管理' : '模型管理';
    }
    
    // 填充列表
    if (this.presetManager) {
      this.presetManager.populateManagerList(type);
    }
  }

  /**
   * 更新预置选项
   */
  updatePresets() {
    // 更新所有模态框中的预置选项
    Object.keys(this.modals).forEach(modalId => {
      const modal = this.modals[modalId];
      if (modal.isOpen) {
        this.updateModalPresets(modalId);
      }
    });
  }

  /**
   * 更新模态框预置选项
   * @param {string} modalId - 模态框ID
   */
  updateModalPresets(modalId) {
    switch (modalId) {
      case 'editFileModal':
        if (this.presetManager) {
          const fileId = document.getElementById('editFileId').value;
          const file = this.dataManager.getFileById(fileId);
          if (file) {
            this.presetManager.populateEditForm(file);
          }
        }
        break;
      case 'presetManagerModal':
        if (this.presetManager) {
          const type = document.getElementById('presetManagerModal').getAttribute('data-type');
          this.presetManager.populateManagerList(type);
        }
        break;
    }
  }
}

/**
 * 预置选项管理器UI组件
 */
class PresetManagerUI {
  constructor(presetManager) {
    this.presetManager = presetManager;
  }

  /**
   * 初始化
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 标签管理按钮
    const tagManagerBtn = document.getElementById('tagManagerBtn');
    if (tagManagerBtn) {
      tagManagerBtn.addEventListener('click', () => {
        this.presetManager.showManager('tags');
      });
    }
    
    // 模型管理按钮
    const modelManagerBtn = document.getElementById('modelManagerBtn');
    if (modelManagerBtn) {
      modelManagerBtn.addEventListener('click', () => {
        this.presetManager.showManager('models');
      });
    }
  }
}

// 导出组件
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileList, ModalManager, PresetManagerUI };
} else if (typeof window !== 'undefined') {
  window.FileList = FileList;
  window.ModalManager = ModalManager;
  window.PresetManagerUI = PresetManagerUI;
}