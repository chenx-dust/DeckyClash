// Translation resources
const translations = {
  'en': {
    'import-tip': 'Clash / Mihomo Subscription Import',
    'sub-link': 'Subscription Link',
    'sel-lang': 'Language:',
    'loading': 'Downloading',
    'loading-msg': 'Downloading subscription, please wait ...',
    'success': 'Success',
    'success-msg': 'Subscription Imported',
    'backend-err': 'Server Error',
    'resp-status': 'Response Status:',
    'frontend-err': 'Error',
    'err-msg': 'Error Message:',
    'err-name': 'Error Name:',
    'ok': 'OK',
    'please-enter-link': 'Please enter subscription link'
  },
  'zh-CN': {
    'import-tip': '导入 Clash / Mihomo订阅',
    'sub-link': '订阅链接',
    'sel-lang': '语言：',
    'loading': '下载中',
    'loading-msg': '正在下载订阅，请稍候……',
    'success': '成功',
    'success-msg': '订阅已导入',
    'backend-err': '服务器错误',
    'resp-status': '响应状态：',
    'frontend-err': '错误',
    'err-msg': '错误信息：',
    'err-name': '错误名称：',
    'ok': '确定',
    'please-enter-link': '请输入订阅链接'
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
  return 'en';
}

// Initialize language
currentLanguage = localStorage.getItem('language') || detectLanguage();

// Translation function
function t(key) {
  return translations[currentLanguage][key] || key;
}

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
  document.getElementById('input-url').placeholder = t('sub-link');
  document.getElementById('sel-lang').textContent = t('sel-lang');
  document.getElementById('language-select').value = currentLanguage;
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

// Initialize application
function initApp() {
  // Update page text
  updatePageText();

  // Get DOM elements
  const inputUrl = document.getElementById('input-url');
  const downloadBtn = document.getElementById('download-btn');
  const languageSelect = document.getElementById('language-select');

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

  // Language change event
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('language', currentLanguage);
    updatePageText();
  });
}

// Initialize after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
