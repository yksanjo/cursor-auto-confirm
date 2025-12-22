import * as vscode from 'vscode';

export class ConfirmationPanel {
    private static currentPanel: ConfirmationPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'confirmAll':
                        vscode.commands.executeCommand('cursorAutoConfirm.executeConfirmAll');
                        this._panel.dispose();
                        break;
                    case 'confirmCurrent':
                        vscode.commands.executeCommand('cursorAutoConfirm.executeConfirmCurrent', message.terminalId);
                        this._panel.dispose();
                        break;
                    case 'cancel':
                        this._panel.dispose();
                        break;
                }
            },
            null,
            this._disposables
        );

        this._update();
    }

    public static createOrShow(extensionUri: vscode.Uri, terminalCount: number) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ConfirmationPanel.currentPanel) {
            ConfirmationPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'confirmationPanel',
            'Confirm Command',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        ConfirmationPanel.currentPanel = new ConfirmationPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        ConfirmationPanel.currentPanel = new ConfirmationPanel(panel, extensionUri);
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const config = vscode.workspace.getConfiguration('cursorAutoConfirm');
        const delay = config.get<number>('delay', 500);
        const confirmAllTabs = config.get<boolean>('confirmAllTabs', true);
        const terminalCount = vscode.window.terminals.filter(t => t.exitStatus === undefined).length;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Command</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        h2 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        .info {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 10px;
            margin: 15px 0;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        button {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: opacity 0.2s;
        }
        button:hover {
            opacity: 0.8;
        }
        button:active {
            opacity: 0.6;
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-danger {
            background-color: var(--vscode-errorForeground);
            color: white;
        }
        .terminal-count {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>⚠️ Command Confirmation Required</h2>
        <div class="info">
            <p>A command is waiting for confirmation.</p>
            <p>Active terminals: <span class="terminal-count">${terminalCount}</span></p>
            <p>Auto-confirm delay: <span class="terminal-count">${delay}ms</span></p>
        </div>
        <div class="button-group">
            <button class="btn-primary" onclick="confirmAll()">
                ✓ Confirm All (${terminalCount})
            </button>
            <button class="btn-secondary" onclick="confirmCurrent()">
                ✓ This Terminal
            </button>
            <button class="btn-danger" onclick="cancel()">
                ✗ Cancel
            </button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        function confirmAll() {
            vscode.postMessage({
                command: 'confirmAll'
            });
        }
        
        function confirmCurrent() {
            vscode.postMessage({
                command: 'confirmCurrent',
                terminalId: 'current'
            });
        }
        
        function cancel() {
            vscode.postMessage({
                command: 'cancel'
            });
        }
        
        // Auto-close after delay if configured
        const delay = ${delay};
        const autoConfirm = ${confirmAllTabs};
        if (delay > 0 && delay < 5000 && autoConfirm) {
            setTimeout(() => {
                confirmAll();
            }, delay);
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        ConfirmationPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

