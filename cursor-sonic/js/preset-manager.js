// 预置选项管理器 - 管理标签和模型的预置选项
class PresetManager {
  constructor() {
    this.tags = [];
    this.models = [];
    this.categories = [];
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('初始化预置选项管理器...');
      await this.loadTags();
      await this.loadModels();
      await this.loadCategories();
      this.isInitialized = true;
      console.log('预置选项管理器初始化完成');
    } catch (error) {
      console.error('预置选项管理器初始化失败:', error);
      throw error;
    }
  }

  // 标签管理

  async loadTags() {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.tags = await response.json();
      return this.tags;
    } catch (error) {
      console.error('加载标签失败:', error);
      this.tags = [];
      throw error;
    }
  }

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
        await this.loadTags(); // 重新加载标签
      }
      return result;
    } catch (error) {
      console.error('添加标签失败:', error);
      throw error;
    }
  }

  async deleteTag(tagId) {
    try {
      // 注意：需要实现删除标签的API
      console.warn('删除标签功能暂未实现');
      return { success: false, error: '功能暂未实现' };
    } catch (error) {
      console.error('删除标签失败:', error);
      throw error;
    }
  }

  async updateTag(tagId, tagData) {
    try {
      // 注意：需要实现更新标签的API
      console.warn('更新标签功能暂未实现');
      return { success: false, error: '功能暂未实现' };
    } catch (error) {
      console.error('更新标签失败:', error);
      throw error;
    }
  }

  getTags() {
    return this.tags;
  }

  getTagById(id) {
    return this.tags.find(tag => tag.id === id);
  }

  getTagByName(name) {
    return this.tags.find(tag => tag.name === name);
  }

  // 模型管理

  async loadModels() {
    try {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.models = await response.json();
      return this.models;
    } catch (error) {
      console.error('加载模型失败:', error);
      this.models = [];
      throw error;
    }
  }

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
        await this.loadModels(); // 重新加载模型
      }
      return result;
    } catch (error) {
      console.error('添加模型失败:', error);
      throw error;
    }
  }

  async deleteModel(modelId) {
    try {
      // 注意：需要实现删除模型的API
      console.warn('删除模型功能暂未实现');
      return { success: false, error: '功能暂未实现' };
    } catch (error) {
      console.error('删除模型失败:', error);
      throw error;
    }
  }

  async updateModel(modelId, modelData) {
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(modelData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedModel = await response.json();

      // 更新本地缓存
      const modelIndex = this.models.findIndex(model => model.id === modelId);
      if (modelIndex >= 0) {
        this.models[modelIndex] = { ...this.models[modelIndex], ...updatedModel };
      }

      return updatedModel;
    } catch (error) {
      console.error('更新模型失败:', error);
      throw error;
    }
  }

  getModels() {
    return this.models;
  }

  getModelById(id) {
    return this.models.find(model => model.id === id);
  }

  getModelByName(name) {
    return this.models.find(model => model.name === name);
  }

  // 工具方法

  // 创建标签HTML元素
  createTagElement(tag, options = {}) {
    const {
      removable = false,
      onRemove = null,
      selected = false
    } = options;

    const tagEl = document.createElement('span');
    tagEl.className = `tag${removable ? ' removable' : ''}${selected ? ' selected' : ''}`;
    tagEl.dataset.id = tag.id;
    tagEl.style.backgroundColor = tag.color || '#3498db';

    const nameEl = document.createElement('span');
    nameEl.className = 'tag-name';
    nameEl.textContent = tag.name;

    tagEl.appendChild(nameEl);

    if (removable && onRemove) {
      const removeEl = document.createElement('span');
      removeEl.className = 'tag-remove';
      removeEl.textContent = '×';
      removeEl.onclick = (e) => {
        e.stopPropagation();
        onRemove(tag.id);
      };
      tagEl.appendChild(removeEl);
    }

    return tagEl;
  }

  // 创建模型选择HTML元素
  createModelSelectElement(selectedId = '') {
    const selectEl = document.createElement('select');

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '选择模型';
    selectEl.appendChild(defaultOption);

    this.models.forEach(model => {
      const optionEl = document.createElement('option');
      optionEl.value = model.id;
      optionEl.textContent = model.name;
      if (model.id === selectedId) {
        optionEl.selected = true;
      }
      selectEl.appendChild(optionEl);
    });

    return selectEl;
  }

  // 创建多选标签HTML元素
  createTagSelector(selectedIds = []) {
    const containerEl = document.createElement('div');
    containerEl.className = 'tag-selector';

    // 创建搜索输入框
    const searchEl = document.createElement('input');
    searchEl.type = 'text';
    searchEl.placeholder = '搜索标签...';
    searchEl.className = 'tag-search';

    // 创建标签列表容器
    const tagsEl = document.createElement('div');
    tagsEl.className = 'tag-list';

    // 添加标签项
    const updateTagList = () => {
      const searchTerm = searchEl.value.toLowerCase();
      tagsEl.innerHTML = '';

      this.tags
        .filter(tag => tag.name.toLowerCase().includes(searchTerm))
        .forEach(tag => {
          const tagEl = this.createTagElement(tag, {
            removable: false,
            selected: selectedIds.includes(tag.id)
          });

          tagEl.onclick = () => {
            const index = selectedIds.indexOf(tag.id);
            if (index > -1) {
              selectedIds.splice(index, 1);
              tagEl.classList.remove('selected');
            } else {
              selectedIds.push(tag.id);
              tagEl.classList.add('selected');
            }
          };

          tagsEl.appendChild(tagEl);
        });
    };

    searchEl.addEventListener('input', updateTagList);
    updateTagList();

    containerEl.appendChild(searchEl);
    containerEl.appendChild(tagsEl);

    // 添加获取选中标签的方法
    containerEl.getSelectedIds = () => selectedIds;

    return containerEl;
  }

  // 刷新数据
  async refresh() {
    await this.loadTags();
    await this.loadModels();
    await this.loadCategories();
  }

  // 分类管理

  async loadCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.categories = await response.json();
      return this.categories;
    } catch (error) {
      console.error('加载分类失败:', error);
      this.categories = [];
      throw error;
    }
  }

  async addCategory(categoryData) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newCategory = await response.json();
      this.categories.push(newCategory);
      return newCategory;
    } catch (error) {
      console.error('添加分类失败:', error);
      throw error;
    }
  }

  async deleteCategory(categoryId) {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 从本地缓存中删除
      this.categories = this.categories.filter(category => category.id !== categoryId);
      return true;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  async updateCategory(categoryId, categoryData) {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedCategory = await response.json();

      // 更新本地缓存
      const categoryIndex = this.categories.findIndex(category => category.id === categoryId);
      if (categoryIndex >= 0) {
        this.categories[categoryIndex] = { ...this.categories[categoryIndex], ...updatedCategory };
      }

      return updatedCategory;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  }

  getCategories() {
    return this.categories;
  }
}
