# Multi-Search Web

**Multi-Search Web** is a Chrome extension that enables users to perform text-based searches directly on webpages.  
It allows multiple search panels to open at once, letting you highlight and search for multiple terms or phrases simultaneously without leaving the page.

## Features
- 🔍 Highlight and search text inline on any webpage  
- ➕ Spawn multiple independent search panels for side-by-side results  
- 🎨 Lightweight and non-intrusive UI designed for quick reference and comparison  
- ⚡ Works entirely in-browser with no external dependencies

## Installation
1. Clone or download this repository.
2. In Chrome, go to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right).
4. Click **Load unpacked** and select the project folder.
5. The extension will appear in your toolbar once loaded.

## Usage
- Click the extension icon or use the shortcut to open the search panel.
- Type your search term to highlight occurrences on the page.
- Use the ➕ button to open additional panels for multiple simultaneous searches.

## Project Structure
├── background.js # Handles extension lifecycle and messaging<br>
├── content.js # Injects UI and manages search highlights<br>
├── manifest.json # Chrome extension configuration<br>

## License
MIT License