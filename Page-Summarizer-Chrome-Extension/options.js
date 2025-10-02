// Options page script - handles settings configuration

import { validateApiKey } from './utils.js';

// DOM elements
const elements = {
  // Provider selection
  providerRadios: document.querySelectorAll('input[name="provider"]'),
  
  // API keys
  openaiKey: document.getElementById('openai-key'),
  anthropicKey: document.getElementById('anthropic-key'),
  geminiKey: document.getElementById('gemini-key'),
  
  // Key status indicators
  openaiStatus: document.getElementById('openai-status'),
  anthropicStatus: document.getElementById('anthropic-status'),
  geminiStatus: document.getElementById('gemini-status'),
  
  // Preferences
  autoSummarize: document.getElementById('auto-summarize'),
  cacheEnabled: document.getElementById('cache-enabled'),
  showWordCount: document.getElementById('show-word-count'),
  
  // Cache management
  cacheInfo: document.getElementById('cache-info'),
  cacheCount: document.getElementById('cache-count'),
  clearCacheBtn: document.getElementById('clear-cache-btn'),
  
  // Actions
  saveBtn: document.getElementById('save-btn'),
  resetBtn: document.getElementById('reset-btn'),
  
  // Status
  status: document.getElementById('status'),
  statusText: document.getElementById('status-text'),
  
  // Visibility toggles
  visibilityToggles: document.querySelectorAll('.toggle-visibility')
};

// Default settings
const defaultSettings = {
  provider: 'openai',
  apiKeys: {
    openai: '',
    anthropic: '',
    gemini: ''
  },
  autoSummarize: false,
  cacheEnabled: true,
  showWordCount: true
};

// Current settings
let currentSettings = { ...defaultSettings };

/**
 * Initialize the options page
 */
async function init() {
  await loadSettings();
  updateUI();
  await updateCacheInfo();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('Options page initialized');
}

/**
 * Load settings from chrome.storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        currentSettings = { ...defaultSettings, ...result.settings };
        // Ensure apiKeys object exists
        if (!currentSettings.apiKeys) {
          currentSettings.apiKeys = { ...defaultSettings.apiKeys };
        }
      }
      resolve();
    });
  });
}

/**
 * Save settings to chrome.storage
 */
async function saveSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings: currentSettings }, resolve);
  });
}

/**
 * Update UI with current settings
 */
function updateUI() {
  // Provider selection
  elements.providerRadios.forEach(radio => {
    radio.checked = radio.value === currentSettings.provider;
  });
  
  // API keys
  elements.openaiKey.value = currentSettings.apiKeys.openai || '';
  elements.anthropicKey.value = currentSettings.apiKeys.anthropic || '';
  elements.geminiKey.value = currentSettings.apiKeys.gemini || '';
  
  // Preferences
  elements.autoSummarize.checked = currentSettings.autoSummarize;
  elements.cacheEnabled.checked = currentSettings.cacheEnabled;
  elements.showWordCount.checked = currentSettings.showWordCount;
  
  // Validate and show key status
  validateAllKeys();
}

/**
 * Validate all API keys and update status
 */
function validateAllKeys() {
  validateKeyStatus('openai', elements.openaiKey.value, elements.openaiStatus);
  validateKeyStatus('anthropic', elements.anthropicKey.value, elements.anthropicStatus);
  validateKeyStatus('gemini', elements.geminiKey.value, elements.geminiStatus);
}

/**
 * Validate a specific API key and update its status
 */
function validateKeyStatus(provider, key, statusElement) {
  if (!key.trim()) {
    statusElement.textContent = '';
    statusElement.className = 'key-status';
    return;
  }
  
  const isValid = validateApiKey(key, provider);
  if (isValid) {
    statusElement.textContent = '✓ Valid key format';
    statusElement.className = 'key-status valid';
  } else {
    statusElement.textContent = '⚠ Invalid key format';
    statusElement.className = 'key-status invalid';
  }
}

/**
 * Update cache information
 */
async function updateCacheInfo() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const cachedItems = Object.keys(items).filter(key => key.startsWith('cached_'));
      elements.cacheCount.textContent = cachedItems.length;
      resolve();
    });
  });
}

/**
 * Clear all cached summaries
 */
async function clearCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items).filter(key => key.startsWith('cached_'));
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          // Also clear service worker cache
          chrome.runtime.sendMessage({ action: 'clearCache' });
          updateCacheInfo();
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * Save current settings
 */
async function save() {
  // Collect form data
  const formData = new FormData();
  
  // Provider
  const selectedProvider = document.querySelector('input[name="provider"]:checked');
  currentSettings.provider = selectedProvider ? selectedProvider.value : 'openai';
  
  // API keys
  currentSettings.apiKeys = {
    openai: elements.openaiKey.value.trim(),
    anthropic: elements.anthropicKey.value.trim(),
    gemini: elements.geminiKey.value.trim()
  };
  
  // Preferences
  currentSettings.autoSummarize = elements.autoSummarize.checked;
  currentSettings.cacheEnabled = elements.cacheEnabled.checked;
  currentSettings.showWordCount = elements.showWordCount.checked;
  
  try {
    await saveSettings();
    showStatus('Settings saved successfully!');
    
    // Hide status after 3 seconds
    setTimeout(() => {
      elements.status.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

/**
 * Reset settings to defaults
 */
async function reset() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = { ...defaultSettings };
    updateUI();
    await saveSettings();
    showStatus('Settings reset to defaults');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  elements.statusText.textContent = message;
  elements.status.className = `status ${type === 'error' ? 'error' : ''}`;
  elements.status.classList.remove('hidden');
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = document.querySelector(`[data-target="${inputId}"]`);
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    input.type = 'password';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Save button
  elements.saveBtn.addEventListener('click', save);
  
  // Reset button
  elements.resetBtn.addEventListener('click', reset);
  
  // Clear cache button
  elements.clearCacheBtn.addEventListener('click', async () => {
    await clearCache();
    showStatus('Cache cleared successfully');
  });
  
  // API key validation on input
  elements.openaiKey.addEventListener('input', (e) => {
    validateKeyStatus('openai', e.target.value, elements.openaiStatus);
  });
  
  elements.anthropicKey.addEventListener('input', (e) => {
    validateKeyStatus('anthropic', e.target.value, elements.anthropicStatus);
  });
  
  elements.geminiKey.addEventListener('input', (e) => {
    validateKeyStatus('gemini', e.target.value, elements.geminiStatus);
  });
  
  // Password visibility toggles
  elements.visibilityToggles.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      togglePasswordVisibility(targetId);
    });
  });
  
  // Auto-save on enter key in inputs
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        save();
      }
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

console.log('Page Summarizer options page loaded');