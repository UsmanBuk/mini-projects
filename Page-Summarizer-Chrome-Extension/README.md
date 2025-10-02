# Page Summarizer Chrome Extension

An AI-powered Chrome extension that automatically summarizes webpage content using OpenAI, Anthropic Claude, or Google Gemini APIs.

## Features

- **Multi-LLM Support**: Choose between OpenAI GPT, Anthropic Claude, or Google Gemini
- **Smart Content Extraction**: Filters out navigation, ads, and other non-content elements
- **Caching System**: Avoids duplicate API calls for pages you've already summarized
- **Secure Storage**: API keys are stored locally and encrypted
- **Rate Limiting**: Built-in API quota management
- **Clean UI**: Modern, responsive interface

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your toolbar

## Setup

1. Click the extension icon and then "Open Settings"
2. Add your API key for your preferred AI provider:
   - **OpenAI**: Get your API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Anthropic**: Get your API key at [console.anthropic.com](https://console.anthropic.com/)
   - **Google Gemini**: Get your API key at [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
3. Select your preferred provider
4. Configure your preferences (auto-summarize, caching, etc.)

## Usage

1. Navigate to any webpage with substantial text content
2. Click the Page Summarizer extension icon
3. Click "Summarize This Page" to generate a summary
4. Use the copy button to copy the summary to your clipboard
5. Cached summaries will load instantly on repeat visits

## Files Structure

```
manifest.json          # Chrome extension manifest (V3)
content.js             # Content script for text extraction
service-worker.js      # Background script for API calls
popup.html/js/css      # Main extension popup interface
options.html/js/css    # Settings and configuration page
utils.js               # Shared utility functions
public/icons/          # Extension icons
```

## Privacy & Security

- API keys are stored locally using Chrome's secure storage API
- Keys are only transmitted directly to their respective AI providers
- No data is sent to third-party servers
- Page content is processed locally before being sent for summarization

## Supported AI Providers

### OpenAI
- Model: GPT-3.5 Turbo
- Fast and reliable summarization
- Requires OpenAI API key

### Anthropic Claude
- Model: Claude-3 Haiku
- High-quality, thoughtful summaries
- Requires Anthropic API key

### Google Gemini
- Model: Gemini Pro
- Google's advanced language model
- Requires Google API key

## Development

This extension uses Manifest V3 and vanilla JavaScript for maximum compatibility and performance.

### Key Chrome APIs Used:
- `chrome.storage.local` - Secure settings and cache storage
- `chrome.tabs` - Active tab detection
- `chrome.runtime` - Message passing between scripts
- `chrome.scripting` - Content script injection

### Architecture:
- **Content Script**: Extracts and cleans webpage text content
- **Service Worker**: Handles API calls and background processing
- **Popup**: Main user interface for viewing summaries
- **Options Page**: Settings and API key management

## License

MIT License - see LICENSE file for details

## Version History

### v1.0.0
- Initial release
- Support for OpenAI, Anthropic, and Google Gemini
- Content extraction and caching system
- Manifest V3 compliance