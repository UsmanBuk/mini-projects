// Content script - runs in the context of web pages
// Responsible for extracting page content and communicating with service worker

import { extractMainContent, getCacheKey } from './utils.js';

// Track if we've already processed this page
let isProcessed = false;
let pageContent = null;

/**
 * Extract and cache the main content of the current page
 */
function extractPageContent() {
  if (isProcessed && pageContent) {
    return pageContent;
  }

  try {
    const content = extractMainContent(document);
    const url = window.location.href;
    const title = document.title;
    
    console.log('Extracting content:', { 
      url, 
      title, 
      contentLength: content.length, 
      content: content.substring(0, 200) + '...' 
    });
    
    pageContent = {
      url,
      title,
      content,
      timestamp: Date.now(),
      wordCount: content.split(/\s+/).length
    };
    
    isProcessed = true;
    return pageContent;
  } catch (error) {
    console.error('Failed to extract page content:', error);
    return null;
  }
}

/**
 * Listen for messages from popup/service worker
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getPageContent':
      const content = extractPageContent();
      sendResponse({ success: true, data: content });
      break;
      
    case 'checkContentReady':
      // Check if page has meaningful content
      const hasContent = document.body && 
        document.body.innerText && 
        document.body.innerText.trim().length > 100;
      console.log('Content check:', { 
        hasBody: !!document.body, 
        textLength: document.body?.innerText?.trim().length || 0,
        hasContent 
      });
      sendResponse({ ready: hasContent });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
});

// Auto-extract content when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(extractPageContent, 1000); // Small delay for dynamic content
  });
} else {
  setTimeout(extractPageContent, 1000);
}

// Re-extract content on significant page changes (SPA navigation)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    isProcessed = false;
    pageContent = null;
    setTimeout(extractPageContent, 2000); // Longer delay for SPA transitions
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Page Summarizer content script loaded');