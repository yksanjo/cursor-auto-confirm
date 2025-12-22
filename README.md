# Cursor Auto Confirm

A powerful VS Code/Cursor extension that automatically confirms commands across all terminal tabs, eliminating the need to manually switch between terminals to press Enter/Return.

## Features

- 🚀 **Auto-Confirm Across All Terminals**: Automatically send Enter/Return to all active terminal tabs with a single action
- 🎯 **Smart Detection**: Detects when commands need confirmation
- 💬 **Beautiful Popup UI**: Modern webview-based confirmation dialog
- ⚙️ **Configurable**: Customize delay, notifications, and behavior
- ⌨️ **Keyboard Shortcuts**: Quick access via `Ctrl+Shift+Enter` in terminal
- 📊 **Status Bar Indicator**: Visual indicator showing extension status

## Installation

1. Clone or download this repository
2. Open in VS Code/Cursor
3. Press `F5` to run the extension in a new Extension Development Host window
4. Or package and install: `vsce package` then install the `.vsix` file

## Usage

### Basic Usage

1. **Enable the extension** (enabled by default)
   - Click the status bar indicator to toggle
   - Or use Command Palette: "Toggle Auto Confirm"

2. **When a command needs confirmation:**
   - Press `Ctrl+Shift+Enter` in any terminal
   - A popup will appear asking if you want to confirm
   - Choose to confirm in all terminals or just the current one

### Manual Trigger

- **Command Palette**: Search for "Confirm in All Terminals"
- **Status Bar**: Click the status indicator to toggle on/off
- **Keyboard Shortcut**: `Ctrl+Shift+Enter` when terminal is focused

## Configuration

Open Settings (`Cmd+,` / `Ctrl+,`) and search for "Cursor Auto Confirm":

- **`cursorAutoConfirm.enabled`**: Enable/disable the extension (default: `true`)
- **`cursorAutoConfirm.delay`**: Delay in milliseconds before auto-confirming (default: `500`)
- **`cursorAutoConfirm.showNotification`**: Show popup notification (default: `true`)
- **`cursorAutoConfirm.confirmAllTabs`**: Auto-confirm in all terminal tabs (default: `true`)

## Commands

- `cursorAutoConfirm.enable` - Enable auto confirmation
- `cursorAutoConfirm.disable` - Disable auto confirmation
- `cursorAutoConfirm.toggle` - Toggle auto confirmation on/off
- `cursorAutoConfirm.confirmAll` - Show confirmation dialog for all terminals
- `cursorAutoConfirm.interceptEnter` - Intercept Enter key in terminal

## Keyboard Shortcuts

- `Ctrl+Shift+Enter` (Terminal focused) - Show confirmation dialog
- `Enter` (Terminal focused + extension enabled) - Intercept and show confirmation

## How It Works

1. The extension monitors all terminal instances
2. When you trigger confirmation (via shortcut or command), a popup appears
3. You can choose to confirm in all terminals or just the current one
4. The extension sends Enter/Return (`\r`) to the selected terminal(s)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm install -g vsce
vsce package
```

## Requirements

- VS Code 1.74.0 or higher
- Cursor (compatible with VS Code extensions)

## Known Limitations

- Terminal output detection is limited by VS Code API constraints
- Manual trigger via keyboard shortcut is recommended
- Works best when you know a command needs confirmation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Changelog

### 1.0.0
- Initial release
- Auto-confirm functionality
- Webview popup UI
- Configuration options
- Keyboard shortcuts

