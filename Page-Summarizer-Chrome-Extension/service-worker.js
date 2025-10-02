// Service worker - handles background tasks and API calls
// This is where we make calls to LLM APIs and manage data

import { getCacheKey, truncateText, validateApiKey, formatError } from './utils.js';

// Cache for summaries (in memory, resets when extension restarts)
const summaryCache = new Map();

/**
 * Call OpenAI API to generate summary
 * @param {string} content - Text content to summarize
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} - Generated summary
 */
async function callOpenAI(content, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of web page content. Focus on the main points and key information. Keep summaries between 100-200 words.'
        },
        {
          role: 'user',
          content: `Please summarize the following webpage content:\n\n${content}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || 'No summary generated';
}

/**
 * Call Anthropic Claude API to generate summary
 * @param {string} content - Text content to summarize
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<string>} - Generated summary
 */
async function callAnthropic(content, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Please create a concise summary of the following webpage content. Focus on the main points and key information. Keep it between 100-200 words:\n\n${content}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() || 'No summary generated';
}

/**
 * Call Google Gemini API to generate summary
 * @param {string} content - Text content to summarize
 * @param {string} apiKey - Google API key
 * @returns {Promise<string>} - Generated summary
 */
async function callGemini(content, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Please create a concise summary of the following webpage content. Focus on the main points and key information. Keep it between 100-200 words:\n\n${content}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text?.trim() || 'No summary generated';
}

/**
 * Generate summary using the configured LLM provider
 * @param {Object} pageData - Page content data
 * @param {Object} settings - User settings including API keys
 * @returns {Promise<string>} - Generated summary
 */
async function generateSummary(pageData, settings) {
  const { content, url } = pageData;
  const { provider, apiKeys } = settings;
  
  // Check cache first
  const cacheKey = getCacheKey(url);
  if (summaryCache.has(cacheKey)) {
    return summaryCache.get(cacheKey);
  }
  
  // Validate API key
  const apiKey = apiKeys[provider];
  if (!validateApiKey(apiKey, provider)) {
    throw new Error(`Invalid or missing API key for ${provider}`);
  }
  
  // Truncate content if too long
  const truncatedContent = truncateText(content);
  
  let summary;
  try {
    switch (provider) {
      case 'openai':
        summary = await callOpenAI(truncatedContent, apiKey);
        break;
      case 'anthropic':
        summary = await callAnthropic(truncatedContent, apiKey);
        break;
      case 'gemini':
        summary = await callGemini(truncatedContent, apiKey);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Cache the summary
    summaryCache.set(cacheKey, summary);
    
    // Also store in chrome.storage for persistence
    const storageKey = `cached_${cacheKey}`;
    const cacheData = {
      summary,
      timestamp: Date.now(),
      url,
      provider
    };
    
    chrome.storage.local.set({ [storageKey]: cacheData });
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'generateSummary':
      handleGenerateSummary(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ 
          success: false, 
          error: formatError(error) 
        }));
      return true; // Keep message channel open for async response
      
    case 'clearCache':
      summaryCache.clear();
      // Clear stored cache as well
      chrome.storage.local.get(null, (items) => {
        const keysToRemove = Object.keys(items).filter(key => key.startsWith('cached_'));
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove);
        }
      });
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * Handle summary generation request
 * @param {Object} data - Request data containing pageData and settings
 * @returns {Promise<string>} - Generated summary
 */
async function handleGenerateSummary(data) {
  const { pageData, settings } = data;
  
  if (!pageData || !pageData.content) {
    throw new Error('No page content available');
  }
  
  if (pageData.content.length < 100) {
    throw new Error('Page content too short to summarize');
  }
  
  return await generateSummary(pageData, settings);
}

// Initialize service worker
console.log('Page Summarizer service worker loaded');