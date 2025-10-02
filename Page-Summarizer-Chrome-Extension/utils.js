// Shared utilities for the Chrome extension

/**
 * Extract clean text content from DOM, filtering out navigation, ads, etc.
 * @param {Document} doc - The document to extract content from
 * @returns {string} - Cleaned text content
 */
export function extractMainContent(doc = document) {
  // Remove unwanted elements
  const unwantedSelectors = [
    'nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.nav', '.navbar', '.header', '.footer', '.sidebar', '.ad', '.ads',
    '.advertisement', '.social', '.share', '.comments', '.related',
    '#nav', '#header', '#footer', '#sidebar'
  ];

  // Clone the document to avoid modifying the original
  const clone = doc.cloneNode(true);
  
  // Remove unwanted elements
  unwantedSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Try to find main content area
  const mainSelectors = [
    'main', 'article', '[role="main"]', '.main', '.content', 
    '.post', '.entry', '#main', '#content'
  ];

  let mainContent = null;
  for (const selector of mainSelectors) {
    mainContent = clone.querySelector(selector);
    if (mainContent) break;
  }

  // Fallback to body if no main content found
  if (!mainContent) {
    mainContent = clone.body || clone;
  }

  // Extract text and clean it up
  let text = mainContent.innerText || mainContent.textContent || '';
  
  // Clean up the text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();

  return text;
}

/**
 * Generate a cache key for a URL
 * @param {string} url - The URL to generate key for
 * @returns {string} - Cache key
 */
export function getCacheKey(url) {
  return `summary_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Truncate text to a maximum length for API calls
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 4000 tokens ≈ 16000 chars)
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 16000) {
  if (text.length <= maxLength) return text;
  
  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxLength * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  return truncated + '...';
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @param {string} provider - Provider name (openai, anthropic, gemini)
 * @returns {boolean} - Whether the key format is valid
 */
export function validateApiKey(apiKey, provider) {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    case 'gemini':
      return apiKey.length > 20; // Gemini keys don't have specific prefix
    default:
      return false;
  }
}

/**
 * Format error messages for display
 * @param {Error|string} error - Error to format
 * @returns {string} - Formatted error message
 */
export function formatError(error) {
  if (typeof error === 'string') return error;
  
  if (error.message) {
    // Handle common API errors
    if (error.message.includes('401')) {
      return 'Invalid API key. Please check your settings.';
    }
    if (error.message.includes('429')) {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.message.includes('quota')) {
      return 'API quota exceeded. Please check your account.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred.';
}