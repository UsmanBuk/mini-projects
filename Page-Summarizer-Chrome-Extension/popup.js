// Popup script - handles the main extension popup interface

// DOM elements
const elements = {
  summarizeBtn: document.getElementById('summarize-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  copyBtn: document.getElementById('copy-btn'),
  regenerateBtn: document.getElementById('regenerate-btn'),
  retryBtn: document.getElementById('retry-btn'),
  
  status: document.getElementById('status'),
  statusText: document.getElementById('status-text'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorText: document.getElementById('error-text'),
  
  pageInfo: document.getElementById('page-info'),
  pageTitle: document.getElementById('page-title'),
  wordCount: document.getElementById('word-count'),
  providerUsed: document.getElementById('provider-used'),
  
  summaryContainer: document.getElementById('summary-container'),
  summaryText: document.getElementById('summary-text'),
  
  noSetup: document.getElementById('no-setup'),
  noContent: document.getElementById('no-content')
};

// Current page data and settings
let currentPageData = null;
let currentSettings = null;
let currentTab = null;

/**
 * Initialize the popup
 */
async function init() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    // Load settings
    await loadSettings();
    
    // Check if we have valid settings
    if (!hasValidSettings()) {
      showNoSetup();
      return;
    }
    
    // Get page content
    await loadPageContent();
    
    if (!currentPageData || !currentPageData.content) {
      showNoContent();
      return;
    }
    
    // Show page info
    showPageInfo();
    
    // Check for cached summary
    await checkCachedSummary();
    
    // Enable summarize button
    elements.summarizeBtn.disabled = false;
    showStatus('Ready to summarize');
    
  } catch (error) {
    console.error('Popup initialization error:', error);
    showError('Failed to initialize extension');
  }
}

/**
 * Load user settings from chrome.storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      currentSettings = result.settings || {
        provider: 'openai',
        apiKeys: {},
        autoSummarize: false,
        cacheEnabled: true
      };
      resolve();
    });
  });
}

/**
 * Check if we have valid settings
 */
function hasValidSettings() {
  if (!currentSettings || !currentSettings.apiKeys) return false;
  
  const apiKey = currentSettings.apiKeys[currentSettings.provider];
  return apiKey && apiKey.trim().length > 0;
}

/**
 * Load page content from content script
 */
async function loadPageContent() {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(currentTab.id, { action: 'getPageContent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting page content:', chrome.runtime.lastError);
        currentPageData = null;
      } else if (response && response.success) {
        currentPageData = response.data;
      } else {
        currentPageData = null;
      }
      resolve();
    });
  });
}

/**
 * Check for cached summary
 */
async function checkCachedSummary() {
  if (!currentSettings.cacheEnabled || !currentPageData) return;
  
  const cacheKey = `cached_${btoa(currentPageData.url).replace(/[^a-zA-Z0-9]/g, '')}`;
  
  return new Promise((resolve) => {
    chrome.storage.local.get([cacheKey], (result) => {
      const cachedData = result[cacheKey];
      if (cachedData && cachedData.summary) {
        // Check if cache is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (Date.now() - cachedData.timestamp < maxAge) {
          showSummary(cachedData.summary, cachedData.provider || currentSettings.provider, true);
        }
      }
      resolve();
    });
  });
}

/**
 * Generate summary for current page
 */
async function generateSummary() {
  if (!currentPageData || !currentSettings) {
    showError('Missing page data or settings');
    return;
  }
  
  showLoading();
  hideError();
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateSummary',
      data: {
        pageData: currentPageData,
        settings: currentSettings
      }
    });
    
    if (response.success) {
      showSummary(response.data, currentSettings.provider, false);
    } else {
      showError(response.error || 'Failed to generate summary');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    showError('Failed to generate summary');
  } finally {
    hideLoading();
  }
}

/**
 * Show UI elements
 */
function showStatus(message) {
  elements.statusText.textContent = message;
  elements.status.classList.remove('hidden');
}

function showLoading() {
  elements.loading.classList.remove('hidden');
  elements.summarizeBtn.disabled = true;
}

function hideLoading() {
  elements.loading.classList.add('hidden');
  elements.summarizeBtn.disabled = false;
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.error.classList.remove('hidden');
}

function hideError() {
  elements.error.classList.add('hidden');
}

function showPageInfo() {
  if (!currentPageData) return;
  
  elements.pageTitle.textContent = currentPageData.title || 'Untitled Page';
  elements.wordCount.textContent = `${currentPageData.wordCount || 0} words`;
  elements.providerUsed.textContent = currentSettings.provider.toUpperCase();
  elements.pageInfo.classList.remove('hidden');
}

function showSummary(summary, provider, isCached) {
  elements.summaryText.textContent = summary;
  elements.providerUsed.textContent = `${provider.toUpperCase()}${isCached ? ' (cached)' : ''}`;
  elements.summaryContainer.classList.remove('hidden');
  hideStatus();
}

function hideStatus() {
  elements.status.classList.add('hidden');
}

function showNoSetup() {
  elements.noSetup.classList.remove('hidden');
  elements.summarizeBtn.disabled = true;
}

function showNoContent() {
  elements.noContent.classList.remove('hidden');
  elements.summarizeBtn.disabled = true;
}

/**
 * Copy summary to clipboard
 */
async function copySummary() {
  try {
    const summary = elements.summaryText.textContent;
    await navigator.clipboard.writeText(summary);
    
    // Show brief feedback
    const originalText = elements.copyBtn.title;
    elements.copyBtn.title = 'Copied!';
    setTimeout(() => {
      elements.copyBtn.title = originalText;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy summary:', error);
  }
}

/**
 * Open options page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Retry loading page content
 */
async function retryContent() {
  hideError();
  elements.noContent.classList.add('hidden');
  
  // Wait a moment for page to potentially load more content
  setTimeout(async () => {
    await loadPageContent();
    
    if (currentPageData && currentPageData.content) {
      showPageInfo();
      elements.summarizeBtn.disabled = false;
      showStatus('Ready to summarize');
    } else {
      showNoContent();
    }
  }, 1000);
}

// Event listeners
elements.summarizeBtn.addEventListener('click', generateSummary);
elements.regenerateBtn.addEventListener('click', generateSummary);
elements.settingsBtn.addEventListener('click', openSettings);
elements.openSettingsBtn.addEventListener('click', openSettings);
elements.copyBtn.addEventListener('click', copySummary);
elements.retryBtn.addEventListener('click', retryContent);

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', init);

console.log('Page Summarizer popup loaded');