import * as vscode from 'vscode';
import { ConfirmationPanel } from './confirmationPanel';

let isEnabled = true;
let statusBarItem: vscode.StatusBarItem;
let confirmationPopup: vscode.Disposable | undefined;
let terminalBuffer: Map<vscode.Terminal, string> = new Map();
let currentActiveTerminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Auto Confirm extension is now active!');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorAutoConfirm.toggle';
    updateStatusBar();
    statusBarItem.show();

    // Load configuration
    const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
    isEnabled = config.get<boolean>('enabled', true);

    // Watch for terminal creation
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal((terminal) => {
            setupTerminalWatcher(terminal);
        })
    );

    // Watch existing terminals
    vscode.window.terminals.forEach(terminal => {
        setupTerminalWatcher(terminal);
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.enable', () => {
            isEnabled = true;
            updateStatusBar();
            vscode.window.showInformationMessage('Auto Confirm enabled');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.disable', () => {
            isEnabled = false;
            updateStatusBar();
            vscode.window.showInformationMessage('Auto Confirm disabled');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.toggle', () => {
            isEnabled = !isEnabled;
            updateStatusBar();
            vscode.window.showInformationMessage(
                `Auto Confirm ${isEnabled ? 'enabled' : 'disabled'}`
            );
        })
    );

    // Register command to confirm in all terminals
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.confirmAll', () => {
            showConfirmationDialog(context.extensionUri);
        })
    );

    // Register command to execute confirmation in all terminals
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.executeConfirmAll', () => {
            confirmAllTerminals();
        })
    );

    // Register command to execute confirmation in current terminal
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorAutoConfirm.executeConfirmCurrent', (terminalId?: string) => {
            const terminal = currentActiveTerminal || vscode.window.activeTerminal;
            if (terminal) {
                confirmTerminal(terminal);
            }
        })
    );

    // Track active terminal
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTerminal((terminal) => {
            currentActiveTerminal = terminal;
        })
    );

    // Set initial active terminal
    if (vscode.window.activeTerminal) {
        currentActiveTerminal = vscode.window.activeTerminal;
    }

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('cursorAutoConfirm')) {
                const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
                isEnabled = config.get<boolean>('enabled', true);
                updateStatusBar();
            }
        })
    );

    // Poll terminals for confirmation prompts (since direct output watching is limited)
    startTerminalPolling();

    context.subscriptions.push(statusBarItem);
}

function setupTerminalWatcher(terminal: vscode.Terminal) {
    terminalBuffer.set(terminal, '');
}

function startTerminalPolling() {
    // Poll every 500ms to check for confirmation prompts
    setInterval(() => {
        if (!isEnabled) {
            return;
        }

        const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
        const confirmAllTabs = config.get<boolean>('confirmAllTabs', true);
        const showNotification = config.get<boolean>('showNotification', true);

        // Check all active terminals
        vscode.window.terminals.forEach(terminal => {
            if (terminal.exitStatus !== undefined) {
                return; // Terminal is closed
            }

            // Try to detect if terminal is waiting for input
            // Note: This is a simplified approach - in practice, you might need
            // to use terminal process data or other methods
            checkTerminalForConfirmation(terminal, confirmAllTabs, showNotification);
        });
    }, 500);
}

function checkTerminalForConfirmation(
    terminal: vscode.Terminal,
    confirmAllTabs: boolean,
    showNotification: boolean
) {
    // This function can be extended to check terminal state
    // For now, we rely on manual trigger or keyboard shortcut
}

function showConfirmationDialog(extensionUri: vscode.Uri) {
    const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
    const showNotification = config.get<boolean>('showNotification', true);

    if (!showNotification) {
        // Auto-confirm without showing dialog
        const delay = config.get<number>('delay', 500);
        const confirmAllTabs = config.get<boolean>('confirmAllTabs', true);
        setTimeout(() => {
            if (confirmAllTabs) {
                confirmAllTerminals();
            } else {
                const terminal = currentActiveTerminal || vscode.window.activeTerminal;
                if (terminal) {
                    confirmTerminal(terminal);
                }
            }
        }, delay);
        return;
    }

    // Show webview panel
    const terminalCount = vscode.window.terminals.filter(t => t.exitStatus === undefined).length;
    ConfirmationPanel.createOrShow(extensionUri, terminalCount);
}

function confirmAllTerminals() {
    const activeTerminals = vscode.window.terminals.filter(
        t => t.exitStatus === undefined
    );

    if (activeTerminals.length === 0) {
        vscode.window.showWarningMessage('No active terminals found');
        return;
    }

    activeTerminals.forEach(terminal => {
        confirmTerminal(terminal);
    });

    const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
    const showNotification = config.get<boolean>('showNotification', true);
    
    if (showNotification) {
        vscode.window.showInformationMessage(
            `Confirmed in ${activeTerminals.length} terminal(s)`
        );
    }
}

function confirmTerminal(terminal: vscode.Terminal) {
    if (terminal.exitStatus === undefined) {
        // Send Enter/Return key
        terminal.sendText('\r', false);
    }
}

function updateStatusBar() {
    statusBarItem.text = isEnabled 
        ? '$(check) Auto Confirm' 
        : '$(x) Auto Confirm';
    statusBarItem.tooltip = isEnabled 
        ? 'Click to disable auto confirmation'
        : 'Click to enable auto confirmation';
}

export function deactivate() {
    if (confirmationPopup) {
        confirmationPopup.dispose();
    }
    terminalBuffer.clear();
}

