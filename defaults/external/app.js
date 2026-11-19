// Translation resources
const translations = {
  'en': {
    'import-tip': 'Clash / Mihomo Subscription Import',
    'import-file-tip': 'Import File',
    'sub-link': 'Subscription Link',
    'sel-lang': 'Language:',
    'loading': 'Downloading',
    'loading-msg': 'Downloading subscription, please wait ...',
    'uploading': 'Uploading',
    'uploading-msg': 'Uploading subscription file, please wait ...',
    'success': 'Success',
    'success-msg': 'Subscription Imported',
    'backend-err': 'Server Error',
    'resp-status': 'Response Status:',
    'frontend-err': 'Error',
    'err-msg': 'Error Message:',
    'err-name': 'Error Name:',
    'ok': 'OK',
    'please-enter-link': 'Please enter subscription link',
    'please-select-file': 'Please select a subscription file',
    'view-logs': 'View Logs',
    'logs-title': 'Logs',
    'back': 'Back',
    'back-to-list': 'Log List',
    'refresh': 'Refresh',
    'download': 'Download',
    'wrap-lines': 'Wrap',
    'scroll-bottom': 'Bottom',
    'logs-loading': 'Loading logs...',
    'log-loading': 'Loading log content...',
    'logs-empty': 'No log files found',
    'log-select-tip': 'Select a log file to view',
    'log-empty': '(Empty file)',
    'log-truncated': 'Showing the last {limit} of this log file. Download the file to view the full log.',
    'logs-load-err': 'Failed to load log list',
    'log-view-err': 'Failed to load log content'
  },
  'zh-CN': {
    'import-tip': '导入 Clash / Mihomo订阅',
    'import-file-tip': '导入文件',
    'sub-link': '订阅链接',
    'sel-lang': '语言：',
    'loading': '下载中',
    'loading-msg': '正在下载订阅，请稍候……',
    'uploading': '上传中',
    'uploading-msg': '正在上传订阅文件，请稍候……',
    'success': '成功',
    'success-msg': '订阅已导入',
    'backend-err': '服务器错误',
    'resp-status': '响应状态：',
    'frontend-err': '错误',
    'err-msg': '错误信息：',
    'err-name': '错误名称：',
    'ok': '确定',
    'please-enter-link': '请输入订阅链接',
    'please-select-file': '请选择订阅文件',
    'view-logs': '查看日志',
    'logs-title': '日志',
    'back': '返回',
    'back-to-list': '日志列表',
    'refresh': '刷新',
    'download': '下载',
    'wrap-lines': '自动换行',
    'scroll-bottom': '跳至底部',
    'logs-loading': '正在加载日志列表……',
    'log-loading': '正在加载日志内容……',
    'logs-empty': '暂无日志文件',
    'log-select-tip': '请选择要查看的日志文件',
    'log-empty': '（空文件）',
    'log-truncated': '当前仅显示最后 {limit} 内容，如需查看完整日志请点击下载。',
    'logs-load-err': '加载日志列表失败',
    'log-view-err': '加载日志内容失败'
  },
  'ru': {
    'import-tip': 'Импорт подписки Clash / Mihomo',
    'import-file-tip': 'Импортировать файл',
    'sub-link': 'Ссылка на подписку',
    'sel-lang': 'Язык:',
    'loading': 'Загрузка',
    'loading-msg': 'Загрузка подписки, подождите...',
    'uploading': 'Отправка',
    'uploading-msg': 'Отправка файла подписки, подождите...',
    'success': 'Готово',
    'success-msg': 'Подписка импортирована',
    'backend-err': 'Ошибка сервера',
    'resp-status': 'Статус ответа:',
    'frontend-err': 'Ошибка',
    'err-msg': 'Сообщение об ошибке:',
    'err-name': 'Название ошибки:',
    'ok': 'OK',
    'please-enter-link': 'Введите ссылку на подписку',
    'please-select-file': 'Выберите файл подписки',
    'view-logs': 'Логи',
    'logs-title': 'Журналы',
    'back': 'Назад',
    'back-to-list': 'Список',
    'refresh': 'Обновить',
    'download': 'Скачать',
    'wrap-lines': 'Перенос строк',
    'scroll-bottom': 'В конец',
    'logs-loading': 'Загрузка списка логов...',
    'log-loading': 'Загрузка содержимого...',
    'logs-empty': 'Файлы журналов не найдены',
    'log-select-tip': 'Выберите файл журнала для просмотра',
    'log-empty': '(Пустой файл)',
    'log-truncated': 'Показаны последние {limit} файла. Скачайте файл для просмотра полностью.',
    'logs-load-err': 'Не удалось загрузить список логов',
    'log-view-err': 'Не удалось загрузить содержимое лога'
  }
};

// Current language
let currentLanguage = 'en';

// Detect browser language
function detectLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  if (browserLang.startsWith('ru')) {
    return 'ru';
  }
  return 'en';
}

// Initialize language
currentLanguage = localStorage.getItem('language') || detectLanguage();

// Translation function
function t(key) {
  return (translations[currentLanguage] && translations[currentLanguage][key]) || translations['en'][key] || key;
}

// Log viewer state
const logState = {
  inLogsPanel: false,
  logs: [],
  listLoading: false,
  listError: null,
  selectedName: null,
  viewerLoading: false,
  viewerError: null,
  viewerData: null,
  wrapLines: true,
  listRequestId: 0,
  viewRequestId: 0,
};

// HTML escape function
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Update page text
function updatePageText() {
  document.getElementById('import-tip').textContent = t('import-tip');
  document.getElementById('import-file-tip').textContent = t('import-file-tip');
  document.getElementById('input-url').placeholder = t('sub-link');
  document.getElementById('sel-lang').textContent = t('sel-lang');
  document.getElementById('language-select').value = currentLanguage;
  document.getElementById('open-logs-label').textContent = t('view-logs');
  document.getElementById('logs-back-label').textContent = t('back');
  document.getElementById('logs-title').textContent = t('logs-title');
  document.getElementById('logs-refresh-label').textContent = t('refresh');
  document.getElementById('logs-mobile-back-label').textContent = t('back-to-list');
  document.getElementById('log-wrap-label').textContent = t('wrap-lines');
  document.getElementById('log-bottom-label').textContent = t('scroll-bottom');
  document.getElementById('log-download-label').textContent = t('download');

  if (logState.inLogsPanel) {
    renderLogList();
    renderLogViewer();
  }
}

// Custom modal component
const Modal = {
  // Create modal HTML
  createHTML(icon, title, content, showButton = true) {
    const iconHTML = icon === 'loading'
      ? '<div class="loading-spinner"></div>'
      : `<div class="modal-icon ${icon}">${this.getIconSymbol(icon)}</div>`;

    const buttonHTML = showButton
      ? `<button class="modal-button" onclick="Modal.close()">${t('ok')}</button>`
      : '';

    return `
      <div class="modal">
        ${iconHTML}
        <div class="modal-title">${title}</div>
        <div class="modal-content">${content}</div>
        ${buttonHTML}
      </div>
    `;
  },

  // Get icon symbol
  getIconSymbol(icon) {
    const symbols = {
      'info': 'ℹ',
      'success': '✓',
      'error': '✕'
    };
    return symbols[icon] || 'ℹ';
  },

  // Show modal
  show(icon, title, content, showButton = true) {
    // Remove existing modal
    this.close();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = this.createHTML(icon, title, content, showButton);

    // Append to page
    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Close on overlay click (only when button is shown)
    if (showButton) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }
  },

  // Close modal
  close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  },

  // Show loading
  showLoading(title, message) {
    this.show('loading', title, message, false);
  },

  // Show success
  showSuccess(title, message) {
    this.show('success', title, message, true);
  },

  // Show error
  showError(title, message) {
    this.show('error', title, message, true);
  },

  // Show info
  showInfo(title, message) {
    this.show('info', title, message, true);
  }
};

// Use native fetch to replace axios
function fetchWithParams(url, params) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  })
    .then(async (response) => {
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Return axios-like response format
      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: response.headers,
        config: {}
      };
    });
}

function fetchWithForm(url, formData) {
  return fetch(url, {
    method: 'POST',
    body: formData,
  })
    .then(async (response) => {
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: response.headers,
        config: {}
      };
    });
}

// Download subscription
function onDownloadBtnClick(url) {
  if (!url || !url.trim()) {
    Modal.showError(t('frontend-err'), t('please-enter-link'));
    return;
  }

  // Show loading
  Modal.showLoading(t('loading'), t('loading-msg'));

  fetchWithParams('/download_sub', { link: url.trim() })
    .then((response) => {
      console.log(response);
      Modal.close();

      if (response.status === 200) {
        Modal.showSuccess(t('success'), t('success-msg'));
      } else {
        const errorMsg = typeof response.data === 'object' && response.data.error
          ? response.data.error
          : 'Unknown error';

        Modal.showError(
          t('backend-err'),
          `
            <div>
              <b>${t('resp-status')}</b>
              <code>${escapeHtml(response.status)}</code>
              <br />
              <b>${t('err-msg')}</b>
              <code>${escapeHtml(errorMsg)}</code>
            </div>
          `
        );
      }
    })
    .catch(error => {
      Modal.close();
      Modal.showError(
        t('frontend-err'),
        `
          <div>
            <b>${t('err-name')}</b>
            <code>${escapeHtml(error.name || 'Error')}</code>
            <br />
            <b>${t('err-msg')}</b>
            <code>${escapeHtml(error.message || 'Unknown error')}</code>
          </div>
        `
      );
    });
}

function onUploadBtnClick(file) {
  if (!file) {
    Modal.showError(t('frontend-err'), t('please-select-file'));
    return;
  }

  Modal.showLoading(t('uploading'), t('uploading-msg'));

  const formData = new FormData();
  formData.append('file', file, file.name);

  fetchWithForm('/upload_sub', formData)
    .then((response) => {
      console.log(response);
      Modal.close();

      if (response.status === 200) {
        Modal.showSuccess(t('success'), t('success-msg'));
      } else {
        const errorMsg = typeof response.data === 'object' && response.data.error
          ? response.data.error
          : 'Unknown error';

        Modal.showError(
          t('backend-err'),
          `
            <div>
              <b>${t('resp-status')}</b>
              <code>${escapeHtml(response.status)}</code>
              <br />
              <b>${t('err-msg')}</b>
              <code>${escapeHtml(errorMsg)}</code>
            </div>
          `
        );
      }
    })
    .catch(error => {
      Modal.close();
      Modal.showError(
        t('frontend-err'),
        `
          <div>
            <b>${t('err-name')}</b>
            <code>${escapeHtml(error.name || 'Error')}</code>
            <br />
            <b>${t('err-msg')}</b>
            <code>${escapeHtml(error.message || 'Unknown error')}</code>
          </div>
        `
      );
    });
}

function fetchJson(url, params) {
  const queryString = params ? new URLSearchParams(params).toString() : '';
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  return fetch(fullUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
    }
  })
    .then(async (response) => {
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
      };
    });
}

function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTimestamp(mtimeSeconds) {
  if (typeof mtimeSeconds !== 'number' || Number.isNaN(mtimeSeconds)) {
    return '';
  }
  const d = new Date(mtimeSeconds * 1000);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDownloadLogUrl(name) {
  return `/download_log?name=${encodeURIComponent(name)}`;
}

function extractLogErrorMessage(response, fallbackKey) {
  if (typeof response.data === 'object' && response.data && response.data.error) {
    return String(response.data.error);
  }
  if (typeof response.data === 'string' && response.data.trim()) {
    return response.data.trim();
  }
  return `${t(fallbackKey)} (${response.status})`;
}

function createDownloadIconSvg() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
  const polyline = document.createElementNS(ns, 'polyline');
  polyline.setAttribute('points', '7 10 12 15 17 10');
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', '12');
  line.setAttribute('y1', '15');
  line.setAttribute('x2', '12');
  line.setAttribute('y2', '3');

  svg.appendChild(path);
  svg.appendChild(polyline);
  svg.appendChild(line);
  return svg;
}

function renderLogList() {
  const listEl = document.getElementById('logs-list');
  const countEl = document.getElementById('logs-count');

  if (!logState.listLoading && !logState.listError && logState.logs.length > 0) {
    countEl.textContent = String(logState.logs.length);
    countEl.classList.remove('hidden');
  } else {
    countEl.textContent = '';
    countEl.classList.add('hidden');
  }

  listEl.textContent = '';

  if (logState.listLoading && logState.logs.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'logs-placeholder';
    placeholder.textContent = t('logs-loading');
    listEl.appendChild(placeholder);
    return;
  }

  if (logState.listError) {
    const placeholder = document.createElement('div');
    placeholder.className = 'logs-placeholder error';
    placeholder.textContent = logState.listError;
    listEl.appendChild(placeholder);
    return;
  }

  if (logState.logs.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'logs-placeholder';
    placeholder.textContent = t('logs-empty');
    listEl.appendChild(placeholder);
    return;
  }

  logState.logs.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'log-item' + (item.name === logState.selectedName ? ' active' : '');
    row.tabIndex = 0;
    row.setAttribute('role', 'button');

    const main = document.createElement('div');
    main.className = 'log-item-main';

    const nameEl = document.createElement('div');
    nameEl.className = 'log-item-name';
    nameEl.textContent = item.name;
    nameEl.title = item.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'log-item-meta';
    const ts = formatTimestamp(item.mtime);
    metaEl.textContent = ts ? `${formatFileSize(item.size)} · ${ts}` : formatFileSize(item.size);

    main.appendChild(nameEl);
    main.appendChild(metaEl);

    const dlLink = document.createElement('a');
    dlLink.className = 'log-item-download';
    dlLink.href = getDownloadLogUrl(item.name);
    dlLink.setAttribute('download', item.name.split('/').pop() || 'log.txt');
    dlLink.title = t('download');
    dlLink.setAttribute('aria-label', `${t('download')}: ${item.name}`);
    dlLink.appendChild(createDownloadIconSvg());
    dlLink.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    row.appendChild(main);
    row.appendChild(dlLink);

    row.addEventListener('click', () => {
      openLogFile(item.name);
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLogFile(item.name);
      }
    });

    listEl.appendChild(row);
  });
}

function renderLogViewer() {
  const workspace = document.getElementById('logs-workspace');
  const nameEl = document.getElementById('log-viewer-name');
  const metaEl = document.getElementById('log-viewer-meta');
  const downloadBtn = document.getElementById('log-download-btn');
  const wrapBtn = document.getElementById('log-wrap-btn');
  const bottomBtn = document.getElementById('log-bottom-btn');
  const bannerEl = document.getElementById('log-truncated-banner');
  const placeholderEl = document.getElementById('log-viewer-placeholder');
  const contentEl = document.getElementById('log-content');

  workspace.classList.toggle('viewing-log', Boolean(logState.selectedName));
  wrapBtn.classList.toggle('active', logState.wrapLines);
  contentEl.classList.toggle('wrap', logState.wrapLines);

  nameEl.textContent = logState.selectedName || t('log-select-tip');
  nameEl.title = logState.selectedName || '';

  if (logState.selectedName) {
    downloadBtn.href = getDownloadLogUrl(logState.selectedName);
    downloadBtn.setAttribute('download', logState.selectedName.split('/').pop() || 'log.txt');
    downloadBtn.classList.remove('hidden');
  } else {
    downloadBtn.removeAttribute('href');
    downloadBtn.classList.add('hidden');
  }

  if (!logState.selectedName) {
    metaEl.textContent = '';
    bannerEl.textContent = '';
    bannerEl.classList.add('hidden');
    contentEl.textContent = '';
    contentEl.classList.add('hidden');
    placeholderEl.className = 'logs-placeholder';
    placeholderEl.textContent = t('log-select-tip');
    placeholderEl.classList.remove('hidden');
    bottomBtn.disabled = true;
    return;
  }

  if (logState.viewerLoading) {
    const selectedItem = logState.logs.find((item) => item.name === logState.selectedName);
    if (selectedItem) {
      const ts = formatTimestamp(selectedItem.mtime);
      metaEl.textContent = ts ? `${formatFileSize(selectedItem.size)} · ${ts}` : formatFileSize(selectedItem.size);
    } else {
      metaEl.textContent = '';
    }
    bannerEl.textContent = '';
    bannerEl.classList.add('hidden');
    contentEl.textContent = '';
    contentEl.classList.add('hidden');
    placeholderEl.className = 'logs-placeholder';
    placeholderEl.textContent = t('log-loading');
    placeholderEl.classList.remove('hidden');
    bottomBtn.disabled = true;
    return;
  }

  if (logState.viewerError) {
    metaEl.textContent = '';
    bannerEl.textContent = '';
    bannerEl.classList.add('hidden');
    contentEl.textContent = '';
    contentEl.classList.add('hidden');
    placeholderEl.className = 'logs-placeholder error';
    placeholderEl.textContent = logState.viewerError;
    placeholderEl.classList.remove('hidden');
    bottomBtn.disabled = true;
    return;
  }

  if (logState.viewerData) {
    const data = logState.viewerData;
    const ts = formatTimestamp(data.mtime);
    metaEl.textContent = ts ? `${formatFileSize(data.size)} · ${ts}` : formatFileSize(data.size);

    if (data.truncated) {
      bannerEl.textContent = t('log-truncated').replace('{limit}', formatFileSize(data.max_bytes));
      bannerEl.classList.remove('hidden');
    } else {
      bannerEl.textContent = '';
      bannerEl.classList.add('hidden');
    }

    if (!data.content) {
      contentEl.textContent = '';
      contentEl.classList.add('hidden');
      placeholderEl.className = 'logs-placeholder';
      placeholderEl.textContent = t('log-empty');
      placeholderEl.classList.remove('hidden');
      bottomBtn.disabled = true;
    } else {
      placeholderEl.classList.add('hidden');
      contentEl.textContent = data.content;
      contentEl.classList.remove('hidden');
      bottomBtn.disabled = false;
    }
  }
}

function loadLogList(preserveSelection = true) {
  const reqId = ++logState.listRequestId;
  logState.listLoading = true;
  logState.listError = null;
  const refreshBtn = document.getElementById('logs-refresh-btn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
  }
  renderLogList();

  fetchJson('/list_logs')
    .then((response) => {
      if (reqId !== logState.listRequestId) {
        return;
      }
      logState.listLoading = false;
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }

      if (response.status === 200 && response.data && Array.isArray(response.data.logs)) {
        logState.logs = response.data.logs;
        if (preserveSelection && logState.selectedName) {
          const stillExists = logState.logs.some((item) => item.name === logState.selectedName);
          if (stillExists) {
            openLogFile(logState.selectedName);
          } else {
            ++logState.viewRequestId;
            logState.selectedName = null;
            logState.viewerLoading = false;
            logState.viewerError = null;
            logState.viewerData = null;
            renderLogViewer();
          }
        }
        renderLogList();
      } else {
        logState.listError = extractLogErrorMessage(response, 'logs-load-err');
        renderLogList();
      }
    })
    .catch((error) => {
      if (reqId !== logState.listRequestId) {
        return;
      }
      logState.listLoading = false;
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
      logState.listError = error && error.message
        ? `${t('logs-load-err')}: ${error.message}`
        : t('logs-load-err');
      renderLogList();
    });
}

function openLogFile(name) {
  const reqId = ++logState.viewRequestId;
  logState.selectedName = name;
  logState.viewerLoading = true;
  logState.viewerError = null;
  logState.viewerData = null;
  renderLogList();
  renderLogViewer();

  fetchJson('/view_log', { name: name })
    .then((response) => {
      if (reqId !== logState.viewRequestId) {
        return;
      }
      logState.viewerLoading = false;
      if (response.status === 200 && response.data && typeof response.data === 'object') {
        logState.viewerData = response.data;
      } else {
        logState.viewerError = extractLogErrorMessage(response, 'log-view-err');
      }
      renderLogViewer();
    })
    .catch((error) => {
      if (reqId !== logState.viewRequestId) {
        return;
      }
      logState.viewerLoading = false;
      logState.viewerError = error && error.message
        ? `${t('log-view-err')}: ${error.message}`
        : t('log-view-err');
      renderLogViewer();
    });
}

function showLogsPanel(updateHash = true) {
  logState.inLogsPanel = true;
  document.getElementById('root').classList.add('logs-mode');
  document.getElementById('import-panel').classList.add('hidden');
  document.getElementById('logs-panel').classList.remove('hidden');

  if (updateHash && window.location.hash !== '#logs') {
    window.location.hash = '#logs';
  }

  renderLogViewer();
  loadLogList(true);
}

function showImportPanel(updateHash = true) {
  logState.inLogsPanel = false;
  document.getElementById('root').classList.remove('logs-mode');
  document.getElementById('logs-panel').classList.add('hidden');
  document.getElementById('import-panel').classList.remove('hidden');

  if (updateHash && window.location.hash === '#logs') {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }
}

// Initialize application
function initApp() {
  // Update page text
  updatePageText();

  // Get DOM elements
  const inputUrl = document.getElementById('input-url');
  const downloadBtn = document.getElementById('download-btn');
  const inputFile = document.getElementById('input-file');
  const uploadBtn = document.getElementById('upload-btn');
  const languageSelect = document.getElementById('language-select');
  const openLogsBtn = document.getElementById('open-logs-btn');
  const logsBackBtn = document.getElementById('logs-back-btn');
  const logsRefreshBtn = document.getElementById('logs-refresh-btn');
  const logsMobileBackBtn = document.getElementById('logs-mobile-back-btn');
  const logWrapBtn = document.getElementById('log-wrap-btn');
  const logBottomBtn = document.getElementById('log-bottom-btn');
  const logContentEl = document.getElementById('log-content');

  // Set current language
  languageSelect.value = currentLanguage;

  // Input enter key event
  inputUrl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      onDownloadBtnClick(inputUrl.value);
    }
  });

  // Download button click event
  downloadBtn.addEventListener('click', () => {
    onDownloadBtnClick(inputUrl.value);
  });

  uploadBtn.addEventListener('click', () => {
    const file = inputFile.files && inputFile.files[0];
    onUploadBtnClick(file);
  });

  // Language change event
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('language', currentLanguage);
    updatePageText();
  });

  // Log viewer events
  openLogsBtn.addEventListener('click', () => {
    showLogsPanel(true);
  });

  logsBackBtn.addEventListener('click', () => {
    showImportPanel(true);
  });

  logsRefreshBtn.addEventListener('click', () => {
    loadLogList(true);
  });

  logsMobileBackBtn.addEventListener('click', () => {
    ++logState.viewRequestId;
    logState.selectedName = null;
    logState.viewerLoading = false;
    logState.viewerError = null;
    logState.viewerData = null;
    renderLogList();
    renderLogViewer();
  });

  logWrapBtn.addEventListener('click', () => {
    logState.wrapLines = !logState.wrapLines;
    renderLogViewer();
  });

  logBottomBtn.addEventListener('click', () => {
    logContentEl.scrollTop = logContentEl.scrollHeight;
  });

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#logs' && !logState.inLogsPanel) {
      showLogsPanel(false);
    } else if (window.location.hash !== '#logs' && logState.inLogsPanel) {
      showImportPanel(false);
    }
  });

  if (window.location.hash === '#logs') {
    showLogsPanel(false);
  }
}

// Initialize after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
