// 组件类定义 - 实现具体的UI组件
class Components {
  constructor(dataManager, presetManager, uiManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.uiManager = uiManager;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('初始化组件...');
      this.isInitialized = true;
      console.log('组件初始化完成');
    } catch (error) {
      console.error('组件初始化失败:', error);
      throw error;
    }
  }
}

// 文件列表组件 - 负责文件卡片的渲染、编辑、删除
class FileList {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.files = [];
    this.currentFilters = {};
    this.removeListener = null;
    this.displaySettings = this.loadDisplaySettings();
  }

  init() {
    // 监听数据变化
    this.removeListener = this.dataManager.addListener((data) => {
      this.files = data.files || [];
      this.render();
    });

    // 监听搜索筛选变化
    document.addEventListener('searchFiltersChanged', (e) => {
      this.currentFilters = e.detail.filters;
      this.render();
    });

    // 监听显示设置变化
    document.addEventListener('displaySettingsChanged', (e) => {
      console.log('FileList收到显示设置变更事件:', e.detail);
      this.displaySettings = this.loadDisplaySettings();
      console.log('FileList重新加载显示设置:', this.displaySettings);
      this.render();
    });

    // 初始化文件列表
    this.files = this.dataManager.data?.files || [];
    this.render();
  }

  loadDisplaySettings() {
    const defaultSettings = {
      title: { show: true, format: 'label' },
      category: { show: true, format: 'label' },
      tags: { show: true, format: 'label' },
      model: { show: true, format: 'label' },
      background: { show: false, format: 'inline' },
      prompt: { show: false, format: 'inline' },
      description: { show: true, format: 'inline' },
      accessCount: { show: false, format: 'inline' }
    };

    try {
      const saved = localStorage.getItem('fileDisplaySettings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
      console.error('加载显示设置失败:', error);
      return defaultSettings;
    }
  }

  saveDisplaySettings() {
    try {
      localStorage.setItem('fileDisplaySettings', JSON.stringify(this.displaySettings));
    } catch (error) {
      console.error('保存显示设置失败:', error);
    }
  }

  async render() {
    const container = document.getElementById('filesGrid');
    if (!container) return;

    // 应用筛选
    let filteredFiles = this.applyFilters();

    if (filteredFiles.length === 0) {
      this.renderEmptyState();
      return;
    }

    container.innerHTML = '';

    filteredFiles.forEach(file => {
      const fileCard = this.createFileCard(file);
      container.appendChild(fileCard);
    });
  }

  applyFilters() {
    let files = this.files.filter(f => f.status !== 'deleted');

    const { search, category, tags, model } = this.currentFilters;

    // 搜索过滤
    if (search) {
      const searchTerm = search.toLowerCase();
      files = files.filter(f =>
        f.title.toLowerCase().includes(searchTerm) ||
        f.description.toLowerCase().includes(searchTerm) ||
        f.originalName.toLowerCase().includes(searchTerm) ||
        f.background.toLowerCase().includes(searchTerm) ||
        f.prompt.toLowerCase().includes(searchTerm)
      );
    }

    // 分类过滤
    if (category) {
      files = files.filter(f => f.category === category);
    }

    // 标签过滤
    if (tags && tags.length > 0) {
      files = files.filter(f => tags.some(tag => f.tags.includes(tag)));
    }

    // 模型过滤
    if (model) {
      files = files.filter(f => f.model === model);
    }

    return files;
  }

  createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = file.id;

    // 卡片头部
    const header = this.createCardHeader(file);
    card.appendChild(header);

    // 卡片内容
    const content = this.createCardContent(file);
    card.appendChild(content);

    // 卡片操作
    const actions = this.createCardActions(file);
    card.appendChild(actions);

    return card;
  }

  createCardHeader(file) {
    const header = document.createElement('div');
    header.className = 'file-card-header';

    const title = document.createElement('h3');
    title.className = 'file-card-title';
    // 显示更有意义的标题：去掉扩展名并美化显示
    const displayName = file.title || file.originalName || '未命名文件';
    const cleanName = displayName.replace(/\.html?$/i, '').replace(/[-_]/g, ' ');
    title.textContent = cleanName;
    header.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'file-card-meta';

    // 根据显示设置添加元数据
    if (this.displaySettings.category.show && file.category) {
      meta.appendChild(this.createMetaItem('分类', file.category, this.displaySettings.category.format));
    }

    if (this.displaySettings.model.show && file.model) {
      const model = this.presetManager.getModelById(file.model);
      const modelName = model ? model.name : file.model;
      meta.appendChild(this.createMetaItem('模型', modelName, this.displaySettings.model.format));
    }

    if (this.displaySettings.accessCount.show) {
      meta.appendChild(this.createMetaItem('访问', `${file.accessCount || 0}次`, this.displaySettings.accessCount.format));
    }

    header.appendChild(meta);
    return header;
  }

  createCardContent(file) {
    const content = document.createElement('div');
    content.className = 'file-card-content';

    // 描述
    if (this.displaySettings.description.show && file.description) {
      const description = document.createElement('div');
      description.className = 'file-card-description';
      description.textContent = file.description;
      content.appendChild(description);
    }

    // 标签
    if (this.displaySettings.tags.show && file.tags && file.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'file-card-tags';

      file.tags.forEach(tagId => {
        const tag = this.presetManager.getTagById(tagId);
        if (tag) {
          const tagElement = this.presetManager.createTagElement(tag);
          tagsContainer.appendChild(tagElement);
        }
      });

      content.appendChild(tagsContainer);
    }

    return content;
  }

  createCardActions(file) {
    const actions = document.createElement('div');
    actions.className = 'file-card-actions';

    // 查看按钮
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-primary';
    viewBtn.textContent = '查看';
    viewBtn.onclick = () => this.viewFile(file);
    actions.appendChild(viewBtn);

    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = '编辑';
    editBtn.onclick = () => this.editFile(file);
    actions.appendChild(editBtn);

    return actions;
  }

  createMetaItem(label, value, format = 'label') {
    const item = document.createElement('div');
    item.className = 'file-card-meta-item';

    if (format === 'label') {
      const labelEl = document.createElement('strong');
      labelEl.textContent = `${label}: `;
      item.appendChild(labelEl);
    }

    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    item.appendChild(valueEl);

    return item;
  }

  renderEmptyState() {
    const container = document.getElementById('filesGrid');
    if (!container) return;

    container.innerHTML = '';

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">📁</div>
      <h3>暂无文件</h3>
      <p>点击"添加文件"按钮开始上传你的HTML创意实现</p>
    `;

    container.appendChild(emptyState);
  }

  viewFile(file) {
    const correctPath = `/openonehtml/static-pages/html-files/${file.encryptedName}`;
    console.log('=== 链接生成调试 ===');
    console.log('文件名:', file.encryptedName);
    console.log('生成的路径:', correctPath);
    console.log('完整URL:', window.location.origin + correctPath);
    window.open(correctPath, '_blank');
  }

  editFile(file) {
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      window.OpenOneHTML.uiManager.modalManager.showEditFileModal(file);
    }
  }

  updateDisplaySettings(newSettings) {
    this.displaySettings = { ...this.displaySettings, ...newSettings };
    this.saveDisplaySettings();
    this.render();
  }

  destroy() {
    if (this.removeListener) {
      this.removeListener();
    }
  }
}

// 模态框管理器 - 处理编辑、删除等模态框
class ModalManager {
  constructor(dataManager, presetManager) {
    this.dataManager = dataManager;
    this.presetManager = presetManager;
    this.currentModal = null;
  }

  init() {
    // 初始化模态框容器
    this.createModalContainer();
  }

  createModalContainer() {
    if (document.getElementById('modalContainer')) return;

    const container = document.createElement('div');
    container.id = 'modalContainer';
    container.className = 'modal-container';
    container.style.display = 'none';

    container.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop"></div>
      <div class="modal" id="modal">
        <div class="modal-header">
          <h3 id="modalTitle">模态框标题</h3>
          <button id="closeModalBtn" type="button" class="btn btn-small modal-close-btn">×</button>
        </div>
        <div class="modal-body" id="modalBody">
          <!-- 模态框内容将在这里动态生成 -->
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // 设置事件监听
    const backdrop = container.querySelector('#modalBackdrop');
    const closeBtn = container.querySelector('#closeModalBtn');

    console.log('设置模态框事件监听:', { backdrop: !!backdrop, closeBtn: !!closeBtn });

    backdrop.addEventListener('click', () => {
      console.log('点击背景关闭模态框');
      this.closeModal();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        console.log('点击关闭按钮关闭模态框', e.target);
        e.stopPropagation(); // 阻止事件冒泡
        this.closeModal();
      });

      // 额外添加事件监听器来确保
      closeBtn.addEventListener('mousedown', (e) => {
        console.log('关闭按钮鼠标按下');
      });

      closeBtn.addEventListener('mouseup', (e) => {
        console.log('关闭按钮鼠标释放');
      });

      console.log('关闭按钮事件监听器已添加');
    } else {
      console.error('关闭按钮不存在！');
    }

    // 添加ESC键关闭功能
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && container.style.display !== 'none') {
        this.closeModal();
      }
    });
  }

  showModal(title, content, options = {}) {
    console.log('显示模态框:', title);
    const container = document.getElementById('modalContainer');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    console.log('模态框元素:', { container: !!container, modal: !!modal, modalTitle: !!modalTitle, modalBody: !!modalBody });

    if (container && modal && modalTitle && modalBody) {
      modalTitle.textContent = title;
      modalBody.innerHTML = '';
      modalBody.appendChild(content);

      // 确保关闭按钮的事件监听器仍然有效
      this.ensureCloseButtonEvents();

      container.style.display = 'flex';
      setTimeout(() => container.classList.add('show'), 10);

      this.currentModal = { title, content, options };
      console.log('模态框显示完成');
    } else {
      console.error('模态框元素未找到');
    }
  }

  closeModal() {
    console.log('执行closeModal方法');
    const container = document.getElementById('modalContainer');
    console.log('模态框容器:', container);

    if (container) {
      console.log('关闭模态框，当前显示状态:', container.style.display);
      container.classList.remove('show');
      setTimeout(() => {
        container.style.display = 'none';
        this.currentModal = null;
        console.log('模态框已关闭');
      }, 300);
    } else {
      console.log('未找到模态框容器');
    }
  }

  closeAllModals() {
    this.closeModal();
  }

  ensureCloseButtonEvents() {
    const container = document.getElementById('modalContainer');
    const backdrop = container?.querySelector('#modalBackdrop');
    const closeBtn = container?.querySelector('#closeModalBtn');

    console.log('确保模态框事件:', { backdrop: !!backdrop, closeBtn: !!closeBtn });

    // 确保背景点击关闭功能
    if (backdrop) {
      // 移除所有现有的事件监听器，重新添加
      const newBackdrop = backdrop.cloneNode(true);
      backdrop.parentNode.replaceChild(newBackdrop, backdrop);

      newBackdrop.addEventListener('click', (e) => {
        console.log('点击背景关闭模态框（重新绑定）');
        e.stopPropagation();
        this.closeModal();
      });

      console.log('背景点击事件重新绑定完成');
    }

    if (closeBtn) {
      // 移除所有现有的事件监听器，重新添加
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

      // 确保按钮有正确的样式和属性
      newCloseBtn.setAttribute('type', 'button');
      newCloseBtn.classList.add('modal-close-btn');
      newCloseBtn.style.pointerEvents = 'auto';
      newCloseBtn.style.zIndex = '1005';

      // 重新添加事件监听器
      newCloseBtn.addEventListener('click', (e) => {
        console.log('关闭按钮被点击（重新绑定）', e.target);
        e.stopPropagation();
        e.preventDefault();
        this.closeModal();
      });

      newCloseBtn.addEventListener('mousedown', (e) => {
        console.log('关闭按钮鼠标按下（重新绑定）');
        e.stopPropagation();
      });

      newCloseBtn.addEventListener('mouseup', (e) => {
        console.log('关闭按钮鼠标释放（重新绑定）');
        e.stopPropagation();
      });

      console.log('关闭按钮事件重新绑定完成');
    }

    // 防止模态框内容中的其他元素阻止事件
    const modal = container?.querySelector('#modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        // 只有当点击的是模态框本身时才阻止冒泡
        if (e.target === modal) {
          e.stopPropagation();
        }
        // 确保模态框内容中的交互元素不会触发背景关闭
        if (e.target.closest('.modal-body, .settings-content, .form-group, .setting-item')) {
          e.stopPropagation();
        }
      });
    }

    // 确保模态框内容中的表单不会阻止关闭按钮事件
    const modalBody = container?.querySelector('#modalBody');
    if (modalBody) {
      modalBody.addEventListener('click', (e) => {
        // 阻止所有在模态框内容区域内的点击事件冒泡到背景
        // 这样可以防止复选框、选择框、输入框等交互元素触发背景关闭
        e.stopPropagation();

        // 但是要确保关闭按钮和设置按钮仍然可以工作
        if (e.target.closest('#closeModalBtn, .modal-close-btn, #closeSettingsBtn, #saveSettingsBtn, #cancelSettingsBtn')) {
          // 这些按钮的点击应该正常工作，不阻止
          return;
        }
      });
    }
  }

  showAddFileModal() {
    const content = this.createFileForm();
    this.showModal('添加文件', content, { type: 'add' });
  }

  showEditFileModal(file) {
    const content = this.createFileForm(file);
    this.showModal('编辑文件', content, { type: 'edit', file });
  }

  showBatchManageModal() {
    const content = this.createBatchManageForm();
    this.showModal('批量管理', content, { type: 'batch' });
  }

  showScanDirectoryModal() {
    const content = this.createScanDirectoryForm();
    this.showModal('扫描目录', content, { type: 'scan' });
  }

  showTagManagerModal() {
    const content = this.createTagManagerForm();
    this.showModal('标签管理', content, { type: 'tagManager' });
  }

  showModelManagerModal() {
    const content = this.createModelManagerForm();
    this.showModal('模型管理', content, { type: 'modelManager' });
  }

  showCategoryManagerModal() {
    const content = this.createCategoryManagerForm();
    this.showModal('分类管理', content, { type: 'categoryManager' });
  }

  createFileForm(file = null) {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="fileTitle">文件标题 *</label>
        <input type="text" id="fileTitle" name="title" required value="${file?.title || ''}">
      </div>

      <div class="form-group">
        <label for="fileCategory">分类</label>
        <select id="fileCategory" name="category">
          <option value="">选择分类</option>
          ${(this.presetManager && this.presetManager.getCategories ? this.presetManager.getCategories() : []).map(category =>
            `<option value="${category.name}" ${file?.category === category.name ? 'selected' : ''}>${category.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="fileBackground">背景需求</label>
        <textarea id="fileBackground" name="background" rows="3">${file?.background || ''}</textarea>
      </div>

      <div class="form-group">
        <label for="filePrompt">提示词</label>
        <textarea id="filePrompt" name="prompt" rows="3">${file?.prompt || ''}</textarea>
      </div>

      <div class="form-group">
        <label for="fileModel">开发模型</label>
        <select id="fileModel" name="model">
          <option value="">选择模型</option>
          ${this.presetManager.getModels().map(model =>
            `<option value="${model.id}" ${file?.model === model.id ? 'selected' : ''}>${model.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>标签</label>
        <div id="tagSelectorContainer"></div>
      </div>

      <div class="form-group">
        <label for="fileDescription">描述</label>
        <textarea id="fileDescription" name="description" rows="3">${file?.description || ''}</textarea>
      </div>

      ${!file ? `
        <div class="form-group">
          <label for="fileInput">HTML文件 *</label>
          <input type="file" id="fileInput" name="file" accept=".html,.htm" required>
        </div>
      ` : ''}

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">保存</button>
        <button type="button" class="btn btn-secondary" id="cancelEditFile">取消</button>
      </div>
    `;

    // 创建标签选择器
    const tagSelectorContainer = form.querySelector('#tagSelectorContainer');
    const selectedTags = file?.tags || [];
    const tagSelector = this.presetManager.createTagSelector(selectedTags);
    tagSelectorContainer.appendChild(tagSelector);

    // 添加取消按钮处理
    const cancelBtn = form.querySelector('#cancelEditFile');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // 添加表单提交处理
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const fileData = {
        title: formData.get('title'),
        category: formData.get('category'),
        background: formData.get('background'),
        prompt: formData.get('prompt'),
        model: formData.get('model'),
        description: formData.get('description'),
        tags: tagSelector.getSelectedIds()
      };

      if (!file) {
        const fileInput = form.querySelector('#fileInput');
        if (fileInput.files[0]) {
          fileData.file = fileInput.files[0];
        }
      }

      try {
        if (file) {
          await this.dataManager.updateFile(file.id, fileData);
          window.OpenOneHTML.showMessage('文件更新成功', 'success');
        } else {
          await this.dataManager.addFile(fileData);
          window.OpenOneHTML.showMessage('文件添加成功', 'success');
        }
        this.closeModal();
      } catch (error) {
        console.error('保存文件失败:', error);
        window.OpenOneHTML.showMessage('保存失败，请重试', 'error');
      }
    });

    return form;
  }

  createBatchManageForm() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="batchDirectory">目录路径 *</label>
        <input type="text" id="batchDirectory" name="directory" required placeholder="例如: C:\\Users\\用户名\\Desktop\\html-files">
      </div>

      <div class="form-group">
        <label for="batchBackground">背景需求</label>
        <textarea id="batchBackground" name="background" rows="3" placeholder="这些文件共同的背景需求"></textarea>
      </div>

      <div class="form-group">
        <label for="batchPrompt">提示词</label>
        <textarea id="batchPrompt" name="prompt" rows="3" placeholder="这些文件共同的提示词"></textarea>
      </div>

      <div class="form-group">
        <label for="batchModel">开发模型</label>
        <select id="batchModel" name="model">
          <option value="">选择模型</option>
          ${this.presetManager.getModels().map(model =>
            `<option value="${model.id}">${model.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>标签</label>
        <div id="batchTagSelectorContainer"></div>
      </div>

      <div class="batch-results" id="batchResults" style="display: none;">
        <h4>处理结果</h4>
        <div id="batchResultsList"></div>
      </div>
    `;

    // 创建标签选择器
    const tagSelectorContainer = form.querySelector('#batchTagSelectorContainer');
    const tagSelector = this.presetManager.createTagSelector([]);
    tagSelectorContainer.appendChild(tagSelector);

    // 添加表单提交处理
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const batchData = {
        directory: formData.get('directory'),
        background: formData.get('background'),
        prompt: formData.get('prompt'),
        model: formData.get('model'),
        tags: tagSelector.getSelectedIds()
      };

      try {
        const results = await this.dataManager.scanDirectory(batchData.directory);
        this.showBatchResults(results);
      } catch (error) {
        console.error('扫描目录失败:', error);
        window.OpenOneHTML.showMessage('扫描失败，请重试', 'error');
      }
    });

    return form;
  }

  createScanDirectoryForm() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="scanDirectory">目录路径 *</label>
        <input type="text" id="scanDirectory" name="directory" required placeholder="例如: C:\\Users\\用户名\\Desktop\\html-files">
        <small class="form-text text-muted">将扫描该目录下的所有HTML文件</small>
      </div>

      <div class="form-group">
        <label for="scanBackground">背景需求</label>
        <textarea id="scanBackground" name="background" rows="3" placeholder="这些文件共同的背景需求"></textarea>
      </div>

      <div class="form-group">
        <label for="scanPrompt">提示词</label>
        <textarea id="scanPrompt" name="prompt" rows="3" placeholder="这些文件共同的提示词"></textarea>
      </div>

      <div class="form-group">
        <label for="scanModel">开发模型</label>
        <select id="scanModel" name="model">
          <option value="">选择模型</option>
          ${this.presetManager.getModels().map(model =>
            `<option value="${model.id}">${model.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>标签</label>
        <div id="scanTagSelectorContainer"></div>
      </div>

      <div class="scan-results" id="scanResults" style="display: none;">
        <h4>扫描结果</h4>
        <div id="scanResultsList"></div>
        <button type="button" id="uploadScannedFiles" class="btn btn-primary">上传选中文件</button>
      </div>
    `;

    // 创建标签选择器
    const tagSelectorContainer = form.querySelector('#scanTagSelectorContainer');
    const tagSelector = this.presetManager.createTagSelector([]);
    tagSelectorContainer.appendChild(tagSelector);

    // 添加表单提交处理
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const scanData = {
        directory: formData.get('directory'),
        background: formData.get('background'),
        prompt: formData.get('prompt'),
        model: formData.get('model'),
        tags: tagSelector.getSelectedIds()
      };

      try {
        const results = await this.dataManager.scanDirectory(scanData.directory);
        this.showScanResults(results, scanData);
      } catch (error) {
        console.error('扫描目录失败:', error);
        window.OpenOneHTML.showMessage('扫描失败，请重试', 'error');
      }
    });

    return form;
  }

  showBatchResults(results) {
    const resultsContainer = document.getElementById('batchResults');
    const resultsList = document.getElementById('batchResultsList');

    if (resultsContainer && resultsList) {
      resultsList.innerHTML = results.map(result =>
        `<div class="batch-result-item ${result.success ? 'success' : 'error'}">
          <span class="status"></span>
          <span>${result.name}: ${result.success ? '成功' : result.error}</span>
        </div>`
      ).join('');

      resultsContainer.style.display = 'block';
    }
  }

  showScanResults(results, scanData) {
    const resultsContainer = document.getElementById('scanResults');
    const resultsList = document.getElementById('scanResultsList');
    const uploadBtn = document.getElementById('uploadScannedFiles');

    if (resultsContainer && resultsList && uploadBtn) {
      resultsList.innerHTML = results.files.map(file =>
        `<div class="file-item">
          <label>
            <input type="checkbox" name="selectedFiles" value="${file.path}" checked>
            ${file.name} (${(file.size / 1024).toFixed(1)}KB)
          </label>
        </div>`
      ).join('');

      uploadBtn.onclick = () => this.uploadSelectedFiles(scanData);
      resultsContainer.style.display = 'block';
    }
  }

  async uploadSelectedFiles(scanData) {
    const selectedFiles = Array.from(document.querySelectorAll('input[name="selectedFiles"]:checked'))
      .map(checkbox => {
        const file = checkbox.value;
        const fileName = checkbox.closest('.file-item').textContent.trim().split(' ')[0];
        return { path: file, name: fileName };
      });

    if (selectedFiles.length === 0) {
      window.OpenOneHTML.showMessage('请至少选择一个文件', 'error');
      return;
    }

    try {
      const results = await this.dataManager.batchUpload(selectedFiles, {
        background: scanData.background,
        prompt: scanData.prompt,
        model: scanData.model,
        tags: scanData.tags
      });

      this.showBatchResults(results);
      window.OpenOneHTML.showMessage(`成功上传 ${results.filter(r => r.success).length} 个文件`, 'success');
    } catch (error) {
      console.error('批量上传失败:', error);
      window.OpenOneHTML.showMessage('批量上传失败，请重试', 'error');
    }
  }

  createTagManagerForm() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="newTagName">新标签名称</label>
        <input type="text" id="newTagName" name="tagName" placeholder="输入标签名称">
      </div>

      <div class="form-group">
        <label for="newTagColor">标签颜色</label>
        <input type="color" id="newTagColor" name="tagColor" value="#3498db">
      </div>

      <div class="form-group">
        <button type="button" id="addNewTag" class="btn btn-primary">添加标签</button>
      </div>

      <div class="existing-tags">
        <h4>现有标签</h4>
        <div id="existingTagsList"></div>
      </div>
    `;

    // 添加新标签
    const addBtn = form.querySelector('#addNewTag');
    const nameInput = form.querySelector('#newTagName');
    const colorInput = form.querySelector('#newTagColor');

    addBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const color = colorInput.value;

      if (!name) {
        window.OpenOneHTML.showMessage('请输入标签名称', 'error');
        return;
      }

      try {
        console.log('添加标签:', { name, color });
        await this.presetManager.addTag({ name, color });
        nameInput.value = '';
        this.updateExistingTags(form);
        window.OpenOneHTML.showMessage('标签添加成功', 'success');
      } catch (error) {
        console.error('添加标签失败:', error);
        window.OpenOneHTML.showMessage('添加标签失败', 'error');
      }
    });

    this.updateExistingTags(form);

    return form;
  }

  updateExistingTags(form) {
    const tagsList = form.querySelector('#existingTagsList');
    if (!tagsList) return;

    const tags = this.presetManager.getTags();
    tagsList.innerHTML = tags.map(tag => `
      <div class="tag-item">
        <div class="tag-info">
          <span class="tag-name">${tag.name}</span>
          <span class="tag-count">使用 ${tag.usageCount} 次</span>
        </div>
        <div class="tag-actions">
          <button type="button" class="btn btn-small btn-secondary" data-action="edit" data-tag-id="${tag.id}">编辑</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete" data-tag-id="${tag.id}">删除</button>
        </div>
      </div>
    `).join('');

    // 添加编辑和删除事件监听
    const buttons = tagsList.querySelectorAll('button[data-tag-id]');
    buttons.forEach(button => {
      const tagId = button.dataset.tagId;
      const action = button.dataset.action;

      button.addEventListener('click', async () => {
        if (action === 'delete') {
          if (confirm('确定要删除这个标签吗？')) {
            try {
              await this.deleteTag(tagId);
              this.updateExistingTags(form);
              window.OpenOneHTML.showMessage('标签删除成功', 'success');
            } catch (error) {
              console.error('删除标签失败:', error);
              window.OpenOneHTML.showMessage('删除标签失败', 'error');
            }
          }
        } else if (action === 'edit') {
          this.showEditTagDialog(tagId, form);
        }
      });
    });
  }

  showEditTagDialog(tagId, form) {
    const tag = this.presetManager.getTagById(tagId);
    if (!tag) return;

    const editForm = document.createElement('div');
    editForm.innerHTML = `
      <div class="edit-tag-form">
        <div class="form-group">
          <label for="editTagName">标签名称</label>
          <input type="text" id="editTagName" value="${tag.name}">
        </div>
        <div class="form-group">
          <label for="editTagColor">标签颜色</label>
          <input type="color" id="editTagColor" value="${tag.color || '#3498db'}">
        </div>
        <div class="form-group">
          <label for="editTagDescription">标签描述</label>
          <textarea id="editTagDescription" rows="2">${tag.description || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" id="saveEditTag">保存</button>
          <button type="button" class="btn btn-secondary" id="cancelEditTag">取消</button>
        </div>
      </div>
    `;

    // 显示编辑对话框
    const dialog = document.createElement('div');
    dialog.className = 'edit-tag-dialog';
    dialog.innerHTML = `
      <div class="edit-tag-overlay"></div>
      <div class="edit-tag-content">
        <div class="edit-tag-header">
          <h3>编辑标签</h3>
          <button type="button" class="close-edit-tag">×</button>
        </div>
        <div class="edit-tag-body"></div>
      </div>
    `;

    dialog.querySelector('.edit-tag-body').appendChild(editForm);
    document.body.appendChild(dialog);

    // 绑定事件
    const saveBtn = dialog.querySelector('#saveEditTag');
    const cancelBtn = dialog.querySelector('#cancelEditTag');
    const closeBtn = dialog.querySelector('.close-edit-tag');
    const overlay = dialog.querySelector('.edit-tag-overlay');

    const closeDialog = () => {
      document.body.removeChild(dialog);
    };

    saveBtn.addEventListener('click', async () => {
      const newName = dialog.querySelector('#editTagName').value.trim();
      const newColor = dialog.querySelector('#editTagColor').value;
      const newDescription = dialog.querySelector('#editTagDescription').value.trim();

      if (!newName) {
        window.OpenOneHTML.showMessage('请输入标签名称', 'error');
        return;
      }

      try {
        await this.updateTag(tagId, { name: newName, color: newColor, description: newDescription });
        this.updateExistingTags(form);
        window.OpenOneHTML.showMessage('标签更新成功', 'success');
        closeDialog();
      } catch (error) {
        console.error('更新标签失败:', error);
        window.OpenOneHTML.showMessage('更新标签失败', 'error');
      }
    });

    cancelBtn.addEventListener('click', closeDialog);
    closeBtn.addEventListener('click', closeDialog);
    overlay.addEventListener('click', closeDialog);

    // 添加ESC键关闭功能
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  async updateTag(tagId, tagData) {
    try {
      // 更新标签信息
      const data = this.dataManager.data;
      if (data.preset_tags) {
        const tagIndex = data.preset_tags.findIndex(tag => tag.id === tagId);
        if (tagIndex > -1) {
          data.preset_tags[tagIndex] = {
            ...data.preset_tags[tagIndex],
            ...tagData
          };
          await this.dataManager.saveData();
          await this.presetManager.refresh();

          // 同步更新所有使用此标签的文件显示
          this.syncTagUpdate(tagId, tagData);
          return true;
        }
      }

      throw new Error('标签不存在');
    } catch (error) {
      console.error('更新标签失败:', error);
      throw error;
    }
  }

  syncTagUpdate(tagId, newTagData) {
    // 这里可以触发文件列表的重新渲染，让更新后的标签信息立即显示
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager) {
      // 触发自定义事件来通知文件列表更新
      const event = new CustomEvent('tagUpdated', {
        detail: { tagId, newTagData }
      });
      document.dispatchEvent(event);
    }
  }

  async deleteTag(tagId) {
    try {
      // 先检查是否有文件使用这个标签
      const files = this.dataManager.data?.files || [];
      const filesUsingTag = files.filter(file => file.tags && file.tags.includes(tagId));

      if (filesUsingTag.length > 0) {
        throw new Error(`无法删除标签：${filesUsingTag.length}个文件正在使用此标签`);
      }

      // 从预置选项中删除
      const data = this.dataManager.data;
      if (data.preset_tags) {
        const tagIndex = data.preset_tags.findIndex(tag => tag.id === tagId);
        if (tagIndex > -1) {
          data.preset_tags.splice(tagIndex, 1);
          await this.dataManager.saveData();
          await this.presetManager.refresh();
          return true;
        }
      }

      throw new Error('标签不存在');
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }

  createModelManagerForm() {
    const form = document.createElement('form');
    form.className = 'modal-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="newModelName">新模型名称</label>
        <input type="text" id="newModelName" name="modelName" placeholder="输入模型名称">
      </div>

      <div class="form-group">
        <label for="newModelDescription">模型描述</label>
        <textarea id="newModelDescription" name="modelDescription" placeholder="输入模型描述"></textarea>
      </div>

      <div class="form-group">
        <button type="button" id="addNewModel" class="btn btn-primary">添加模型</button>
      </div>

      <div class="existing-models">
        <h4>现有模型</h4>
        <div id="existingModelsList"></div>
      </div>
    `;

    // 添加新模型
    const addBtn = form.querySelector('#addNewModel');
    const nameInput = form.querySelector('#newModelName');
    const descInput = form.querySelector('#newModelDescription');

    addBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const description = descInput.value.trim();

      if (!name) {
        window.OpenOneHTML.showMessage('请输入模型名称', 'error');
        return;
      }

      try {
        console.log('添加模型:', { name, description });
        await this.presetManager.addModel({ name, description });
        nameInput.value = '';
        descInput.value = '';
        this.updateExistingModels(form);
        window.OpenOneHTML.showMessage('模型添加成功', 'success');
      } catch (error) {
        console.error('添加模型失败:', error);
        window.OpenOneHTML.showMessage('添加模型失败', 'error');
      }
    });

    this.updateExistingModels(form);

    return form;
  }

  updateExistingModels(form) {
    const modelsList = form.querySelector('#existingModelsList');
    if (!modelsList) return;

    const models = this.presetManager.getModels();
    modelsList.innerHTML = models.map(model => `
      <div class="model-item">
        <span class="model-name">${model.name}</span>
        <span class="model-count">使用 ${model.usageCount} 次</span>
        <button type="button" class="btn btn-small btn-primary" data-model-id="${model.id}">编辑</button>
        <button type="button" class="btn btn-small btn-danger" data-model-id="${model.id}">删除</button>
      </div>
    `).join('');

    // 添加编辑事件监听
    const editButtons = modelsList.querySelectorAll('button[data-model-id].btn-primary');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modelId = button.dataset.modelId;
        this.editModel(modelId, form);
      });
    });

    // 添加删除事件监听
    const deleteButtons = modelsList.querySelectorAll('button[data-model-id].btn-danger');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const modelId = button.dataset.modelId;
        if (confirm('确定要删除这个模型吗？')) {
          try {
            await this.deleteModel(modelId);
            this.updateExistingModels(form);
            window.OpenOneHTML.showMessage('模型删除成功', 'success');
          } catch (error) {
            console.error('删除模型失败:', error);
            window.OpenOneHTML.showMessage('删除模型失败', 'error');
          }
        }
      });
    });
  }

  async deleteModel(modelId) {
    try {
      // 先检查是否有文件使用这个模型
      const files = this.dataManager.data?.files || [];
      const filesUsingModel = files.filter(file => file.model === modelId);

      if (filesUsingModel.length > 0) {
        throw new Error(`无法删除模型：${filesUsingModel.length}个文件正在使用此模型`);
      }

      // 从预置选项中删除
      const data = this.dataManager.data;
      if (data.preset_models) {
        const modelIndex = data.preset_models.findIndex(model => model.id === modelId);
        if (modelIndex > -1) {
          data.preset_models.splice(modelIndex, 1);
          await this.dataManager.saveData();
          await this.presetManager.refresh();
          return true;
        }
      }

      throw new Error('模型不存在');
    } catch (error) {
      console.error('删除模型失败:', error);
      throw error;
    }
  }

  editModel(modelId, form) {
    const model = this.presetManager.getModels().find(m => m.id === modelId);
    if (!model) return;

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑模型</h3>
          <button type="button" class="modal-close-btn" id="closeEditModel">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editModelName">模型名称</label>
            <input type="text" id="editModelName" value="${model.name}">
          </div>
          <div class="form-group">
            <label for="editModelDescription">模型描述</label>
            <textarea id="editModelDescription" rows="2">${model.description || ''}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" id="saveEditModel">保存</button>
            <button type="button" class="btn btn-secondary" id="cancelEditModel">取消</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.showModal('编辑模型', dialog, { type: 'editModel' });

    // 保存事件
    const saveBtn = dialog.querySelector('#saveEditModel');
    saveBtn.addEventListener('click', async () => {
      const newName = dialog.querySelector('#editModelName').value.trim();
      const newDescription = dialog.querySelector('#editModelDescription').value.trim();

      if (!newName) {
        window.OpenOneHTML.showMessage('请输入模型名称', 'error');
        return;
      }

      try {
        await this.presetManager.updateModel(modelId, { name: newName, description: newDescription });
        this.updateExistingModels(form);
        window.OpenOneHTML.showMessage('模型更新成功', 'success');
        this.closeModal();
      } catch (error) {
        console.error('更新模型失败:', error);
        window.OpenOneHTML.showMessage('更新模型失败', 'error');
      }
    });

    // 取消事件
    const cancelBtn = dialog.querySelector('#cancelEditModel');
    cancelBtn.addEventListener('click', () => this.closeModal());
  }

  createCategoryManagerForm() {
    const form = document.createElement('form');
    form.className = 'modal-form';

    const files = this.dataManager.data?.files || [];
    const categories = [...new Set(files.map(f => f.category).filter(Boolean))];

    form.innerHTML = `
      <div class="form-group">
        <label for="newCategoryName">新分类名称</label>
        <input type="text" id="newCategoryName" name="categoryName" placeholder="输入分类名称">
      </div>

      <div class="form-group">
        <label for="newCategoryDescription">分类描述</label>
        <textarea id="newCategoryDescription" name="categoryDescription" placeholder="输入分类描述"></textarea>
      </div>

      <div class="form-group">
        <button type="button" id="addNewCategory" class="btn btn-primary">添加分类</button>
      </div>

      <div class="existing-categories">
        <h4>现有分类</h4>
        <div id="existingCategoriesList"></div>
      </div>
    `;

    // 添加新分类事件
    const addBtn = form.querySelector('#addNewCategory');
    const nameInput = form.querySelector('#newCategoryName');
    const descInput = form.querySelector('#newCategoryDescription');

    addBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const description = descInput.value.trim();

      if (!name) {
        window.OpenOneHTML.showMessage('请输入分类名称', 'error');
        return;
      }

      try {
        console.log('添加分类:', { name, description });
        await this.addCategory({ name, description });
        nameInput.value = '';
        descInput.value = '';
        this.updateExistingCategories(form);
        window.OpenOneHTML.showMessage('分类添加成功', 'success');
      } catch (error) {
        console.error('添加分类失败:', error);
        window.OpenOneHTML.showMessage('添加分类失败', 'error');
      }
    });

    this.updateExistingCategories(form);

    return form;
  }

  updateExistingCategories(form) {
    const categoriesList = form.querySelector('#existingCategoriesList');
    if (!categoriesList) return;

    const categories = this.presetManager.getCategories();
    categoriesList.innerHTML = categories.map(category => `
      <div class="category-item">
        <span class="category-name">${category.name}</span>
        <span class="category-count">使用 ${category.usageCount} 次</span>
        <button type="button" class="btn btn-small btn-primary" data-category-id="${category.id}">编辑</button>
        <button type="button" class="btn btn-small btn-danger" data-category-id="${category.id}">删除</button>
      </div>
    `).join('');

    // 添加编辑和删除事件
    categoriesList.querySelectorAll('.btn-primary').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const categoryId = e.target.dataset.categoryId;
        this.editCategory(categoryId, form);
      });
    });

    categoriesList.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const categoryId = e.target.dataset.categoryId;
        const category = this.presetManager.getCategories().find(c => c.id === categoryId);
        if (category && confirm(`确定要删除分类 "${category.name}" 吗？`)) {
          try {
            await this.presetManager.deleteCategory(categoryId);
            this.updateExistingCategories(form);
            window.OpenOneHTML.showMessage('分类删除成功', 'success');
          } catch (error) {
            console.error('删除分类失败:', error);
            window.OpenOneHTML.showMessage('删除分类失败', 'error');
          }
        }
      });
    });
  }

  async addCategory(categoryData) {
    try {
      return await this.presetManager.addCategory(categoryData);
    } catch (error) {
      console.error('添加分类失败:', error);
      throw error;
    }
  }



  editCategory(categoryId, form) {
    const category = this.presetManager.getCategories().find(c => c.id === categoryId);
    if (!category) return;

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑分类</h3>
          <button type="button" class="modal-close-btn" id="closeEditCategory">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editCategoryName">分类名称</label>
            <input type="text" id="editCategoryName" value="${category.name}">
          </div>
          <div class="form-group">
            <label for="editCategoryDescription">分类描述</label>
            <textarea id="editCategoryDescription" rows="2">${category.description || ''}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" id="saveEditCategory">保存</button>
            <button type="button" class="btn btn-secondary" id="cancelEditCategory">取消</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.showModal('编辑分类', dialog, { type: 'editCategory' });

    // 保存事件
    const saveBtn = dialog.querySelector('#saveEditCategory');
    saveBtn.addEventListener('click', async () => {
      const newName = dialog.querySelector('#editCategoryName').value.trim();
      const newDescription = dialog.querySelector('#editCategoryDescription').value.trim();

      if (!newName) {
        window.OpenOneHTML.showMessage('请输入分类名称', 'error');
        return;
      }

      try {
        await this.presetManager.updateCategory(categoryId, { name: newName, description: newDescription });
        this.updateExistingCategories(form);
        window.OpenOneHTML.showMessage('分类更新成功', 'success');
        this.closeModal();
      } catch (error) {
        console.error('更新分类失败:', error);
        window.OpenOneHTML.showMessage('更新分类失败', 'error');
      }
    });

    // 取消事件
    const cancelBtn = dialog.querySelector('#cancelEditCategory');
    cancelBtn.addEventListener('click', () => this.closeModal());
  }


}

// 设置面板组件
class SettingsPanel {
  constructor() {
    this.isVisible = false;
  }

  init() {
    this.createPanel();
    this.setupEventListeners();
  }

  createPanel() {
    if (document.getElementById('settingsPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'settingsPanel';
    panel.className = 'settings-panel';
    panel.style.display = 'none';

    panel.innerHTML = `
      <div class="settings-content">
        <div class="setting-group">
          <h4>显示字段</h4>
          <div class="setting-item">
            <label><input type="checkbox" data-field="title" checked> 文件标题</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="category" checked> 分类</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="tags" checked> 标签</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="model" checked> 模型</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="background"> 背景需求</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="prompt"> 提示词</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="description" checked> 描述</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
          <div class="setting-item">
            <label><input type="checkbox" data-field="accessCount"> 访问统计</label>
            <select class="display-format">
              <option value="label">标签</option>
              <option value="inline">描述</option>
            </select>
          </div>
        </div>
      </div>
      <div class="settings-actions">
        <button id="saveSettingsBtn" class="btn btn-primary">保存</button>
        <button id="cancelSettingsBtn" class="btn btn-secondary">取消</button>
      </div>
    `;

    document.body.appendChild(panel);
  }

  setupEventListeners() {
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('settingsPanel');
      if (panel && this.isVisible && !panel.contains(e.target) && !e.target.closest('#settingsBtn')) {
        this.hide();
      }
    });

    // 设置变更监听
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.addEventListener('change', (e) => {
        this.saveSettings();
        this.applySettings();
      });
    }
  }

  show() {
    console.log('SettingsPanel.show() 被调用');
    // 使用ModalManager来显示设置面板
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      console.log('OpenOneHTML和modalManager存在');
      const panel = document.getElementById('settingsPanel');
      console.log('设置面板元素:', panel);
      if (panel) {
        console.log('设置面板存在，开始处理内容');
        // 提取设置面板的内容
        const settingsContent = panel.querySelector('.settings-content');
        const settingsActions = panel.querySelector('.settings-actions');

        console.log('settingsContent:', settingsContent);
        console.log('settingsActions:', settingsActions);
        if (settingsContent) {
          console.log('找到内容，开始创建wrapper');
          // 创建新的容器来包装内容和按钮
          const wrapper = document.createElement('div');
          wrapper.className = 'settings-wrapper';

          // 克隆内容部分
          const contentClone = settingsContent.cloneNode(true);
          wrapper.appendChild(contentClone);

          // 如果没有找到settingsActions，创建一个
          let actionsClone;
          if (settingsActions) {
            actionsClone = settingsActions.cloneNode(true);
            console.log('使用现有的settingsActions');
          } else {
            // 创建新的settingsActions
            actionsClone = document.createElement('div');
            actionsClone.className = 'settings-actions';
            actionsClone.innerHTML = `
              <button id="saveSettingsBtn" class="btn btn-primary">保存</button>
              <button id="cancelSettingsBtn" class="btn btn-secondary">取消</button>
            `;
            console.log('创建新的settingsActions');
          }
          wrapper.appendChild(actionsClone);

          console.log('调用showModal方法');
          window.OpenOneHTML.uiManager.modalManager.showModal('预览设置', wrapper, { type: 'settings' });
          console.log('showModal调用完成');

          // 为模态框中的设置项添加事件监听
          setTimeout(() => {
            if (wrapper) {
              // 首先加载已保存的设置到设置面板
              this.loadSettingsToPanel(wrapper);
              this.setupModalEvents(wrapper);
              this.setupSaveCancelButtons(wrapper);
            }
          }, 10);
        }
        this.isVisible = true;
      }
    }
  }

  hide() {
    if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
      window.OpenOneHTML.uiManager.modalManager.closeModal();
    }
    this.isVisible = false;
  }

  setupModalEvents(content) {
    // 为模态框中的设置项添加事件监听
    const items = content.querySelectorAll('.setting-item input[type="checkbox"], .setting-item select');
    items.forEach(item => {
      item.addEventListener('change', () => {
        this.saveSettings();
        this.applySettings();
      });
    });

  }

  setupSaveCancelButtons(content) {
    console.log('设置保存和取消按钮事件');
    console.log('content:', content);

    // 保存按钮事件
    const saveBtn = content.querySelector('#saveSettingsBtn');
    console.log('找到保存按钮:', saveBtn);

    if (saveBtn) {
      // 移除所有可能存在的旧事件监听器
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

      // 标记按钮是否正在处理中
      let isProcessing = false;

      newSaveBtn.addEventListener('click', async (e) => {
        console.log('保存按钮被点击！');
        e.preventDefault();
        e.stopPropagation();

        // 防止重复点击
        if (isProcessing) {
          console.log('保存正在处理中，忽略重复点击');
          return;
        }

        isProcessing = true;
        const originalText = newSaveBtn.textContent;

        try {
          // 显示保存中状态
          newSaveBtn.textContent = '保存中...';
          newSaveBtn.disabled = true;
          newSaveBtn.style.backgroundColor = '#6c757d';

          // 执行保存
          this.saveSettings();
          this.applySettings();
          console.log('设置已保存并应用');

          // 显示成功状态
          newSaveBtn.textContent = '保存成功！';
          newSaveBtn.style.backgroundColor = '#28a745';

          // 2秒后关闭模态框
          setTimeout(() => {
            if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
              window.OpenOneHTML.uiManager.modalManager.closeModal();
              console.log('模态框已关闭');
            }
            this.isVisible = false;
          }, 2000);

        } catch (error) {
          console.error('保存设置失败:', error);
          newSaveBtn.textContent = '保存失败';
          newSaveBtn.style.backgroundColor = '#dc3545';

          // 3秒后恢复按钮状态
          setTimeout(() => {
            newSaveBtn.textContent = originalText;
            newSaveBtn.disabled = false;
            newSaveBtn.style.backgroundColor = '#007bff';
            isProcessing = false;
          }, 3000);
        }
      });

      // 添加视觉反馈
      newSaveBtn.style.backgroundColor = '#007bff';
      newSaveBtn.style.color = 'white';
      newSaveBtn.style.border = 'none';
      newSaveBtn.style.padding = '8px 16px';
      newSaveBtn.style.borderRadius = '4px';
      newSaveBtn.style.cursor = 'pointer';
      newSaveBtn.style.fontWeight = 'bold';
    } else {
      console.error('找不到保存按钮');
    }

    // 取消按钮事件
    const cancelBtn = content.querySelector('#cancelSettingsBtn');
    console.log('找到取消按钮:', cancelBtn);

    if (cancelBtn) {
      // 移除所有可能存在的旧事件监听器
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      newCancelBtn.addEventListener('click', (e) => {
        console.log('取消按钮被点击');
        e.preventDefault();
        e.stopPropagation();

        // 直接关闭模态框，不需要恢复设置（因为用户没有保存）
        if (window.OpenOneHTML && window.OpenOneHTML.uiManager && window.OpenOneHTML.uiManager.modalManager) {
          window.OpenOneHTML.uiManager.modalManager.closeModal();
          console.log('模态框已关闭');
        }
        this.isVisible = false;
      });
    } else {
      console.error('找不到取消按钮');
    }
  }

  saveSettings() {
    const settings = {};
    console.log('开始保存设置...');

    // 尝试从当前模态框中获取设置项
    let items = document.querySelectorAll('#modalBody .setting-item');
    console.log('从模态框中找到的设置项数量:', items.length);

    if (items.length === 0) {
      // 如果没有找到，尝试从原始面板获取
      items = document.querySelectorAll('#settingsPanel .setting-item');
      console.log('从原始面板中找到的设置项数量:', items.length);
    }

    items.forEach((item, index) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const select = item.querySelector('.display-format');

      if (checkbox && select) {
        const field = checkbox.dataset.field;
        const show = checkbox.checked;
        const format = select.value;

        console.log(`设置项 ${index}:`, { field, show, format });
        settings[field] = { show, format };
      } else {
        console.log(`设置项 ${index} 缺少 checkbox 或 select`);
      }
    });

    console.log('最终设置对象:', settings);

    try {
      localStorage.setItem('fileDisplaySettings', JSON.stringify(settings));
      console.log('设置已保存到 localStorage');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  applySettings() {
    console.log('应用显示设置...');
    const settings = this.getSettings();
    console.log('当前设置:', settings);

    // 触发设置变更事件
    const event = new CustomEvent('displaySettingsChanged', {
      detail: settings
    });
    document.dispatchEvent(event);
    console.log('已触发displaySettingsChanged事件');
  }

  getSettings() {
    try {
      const saved = localStorage.getItem('fileDisplaySettings');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('加载设置失败:', error);
      return {};
    }
  }

  loadSettingsToPanel(panel) {
    console.log('加载设置到设置面板');
    const savedSettings = this.getSettings();
    console.log('已保存的设置:', savedSettings);

    // 更新模态框中的设置项
    const settingItems = panel.querySelectorAll('.setting-item');
    console.log('找到的设置项数量:', settingItems.length);

    settingItems.forEach((item, index) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const select = item.querySelector('.display-format');

      if (checkbox && select) {
        const field = checkbox.dataset.field;
        const savedSetting = savedSettings[field];

        if (savedSetting) {
          console.log(`更新设置项 ${index}: ${field}`, savedSetting);
          // 设置复选框状态
          checkbox.checked = savedSetting.show;
          // 设置下拉框状态
          select.value = savedSetting.format;
        } else {
          console.log(`设置项 ${index}: ${field} 使用默认值`);
        }
      }
    });
  }
}
