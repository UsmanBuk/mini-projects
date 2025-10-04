# Desktop Note Tracker with AI Assistant

A Windows desktop application built with Electron and React that provides a floating, always-on-top note tracker with integrated Claude AI chat capabilities.

## Features

- **Floating Widget**: Always-on-top button at bottom-right corner that expands to full interface
- **Quick Note Capture**: Press Enter to save notes with automatic timestamps
- **Note Management**: Search, filter by date, and delete notes
- **AI Chat Integration**: Chat with Claude AI that has context of all your notes
- **Global Hotkeys**:
  - `Ctrl+Shift+N`: Toggle window expand/collapse
  - `Ctrl+Shift+Q`: Focus note input field
- **Export Options**: Export notes as JSON or Markdown
- **Glassmorphism UI**: Modern, transparent design with blur effects
- **Window Position Persistence**: Remembers window position and size

## Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the application in development mode:
```bash
npm run dev
```

## Building

Build the application for production:
```bash
npm run build
```

Create a distributable package:
```bash
npm run dist
```

## Usage

1. Click the floating button at bottom-right to expand the widget
2. Type a note and press Enter to save
3. Use the Chat tab to ask questions about your notes
4. Use keyboard shortcuts for quick access
5. Drag the expanded window anywhere on screen
6. Export notes anytime in JSON or Markdown format

## Technologies

- **Electron**: Desktop application framework
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Claude API**: AI assistant integration
- **electron-store**: Local data persistence

## Requirements

- Windows 10 or later
- Node.js 16 or later
- Anthropic API key for AI features