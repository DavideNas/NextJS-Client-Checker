import * as vscode from 'vscode';
import * as path from 'path';
import { findFiles, checkForUseClient } from './analyzer';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    // start to analyze project as command is called
    let disposable = vscode.commands.registerCommand('nextjs.checkUseClient', async () => {
        await runCheck(context);
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() { }

async function runCheck(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    // check if there is a project opened on VS Code
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("Please open a Next.js project before running the analysis");
        return;
    }
    const projectPath = workspaceFolders[0].uri.fsPath;
    
    // Call function from analyzer.ts to find all paths of files in the project
    const tsxFiles = await findFiles(projectPath);
    // Scan each files and try to find wrong server components wich needs 'use client' directive
    const missingUseClient = tsxFiles.map(checkForUseClient).filter((file) => file !== null) as string[];
    
    if (missingUseClient.length > 0) {
        // Close log panel if opened
        if (panel) {
            panel.dispose();
        }
        // Generate panel of log to show files list
        panel = vscode.window.createWebviewPanel(
            'nextjsUseClientCheck',
            'Missing "use client" Directives',
            vscode.ViewColumn.Two,  // open panel on the right of editor
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );
        // create content of log panel HTML formatted
        panel.webview.html = getWebviewContent(missingUseClient);

        // run click events based on message from buttons of list element or button
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'openFile') {
                    // open clicked file from log list
                    openFileInEditor(message.path);
                } else if (message.command === 'recheck') {
                    // relaunch check
                    panel?.dispose();
                    await runCheck(context);
                }
            },
            undefined,
            context.subscriptions
        );

        panel.onDidDispose(() => {
            panel = undefined;
        });
    } else {
        // If all component are right setted up no changes needed
        vscode.window.showInformationMessage("All components are correctly configured.");
    }
}

function openFileInEditor(filePath: string) {
    filePath = decodeURIComponent(filePath);
    // check if file exists once the path is correct fomatted
    if (/^[a-zA-Z]:[^\\]/.test(filePath)) {
        filePath = filePath[0] + ":\\" + filePath.substring(2);
    }
    // create a format of compatible file path (with the system)
    filePath = filePath.replace(/([a-zA-Z]:)([^\\])/g, '$1\\$2').replace(/(\\|\/)+/g, '\\');

    const fs = require('fs');
    // if file not exists then return 'File not found' message
    if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`File not found: ${filePath}`);
        return;
    }

    // open clicked file on the left of editor
    vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(document => {
        vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    });
}

// UI part of extension panel (HTML and CSS formatted) 
function getWebviewContent(missingUseClient: string[]): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Missing "use client" Directives</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

            body {
                font-family: 'VT323', monospace;
                background-color: #0a0a0a;
                color: #00ff00;
                margin: 0;
                padding: 20px;
            }

            h1 {
                font-size: 22px;
                color: #0f0;
                border-bottom: 2px solid #00ff00;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }

            .file-item {
                color: #0f0;
                cursor: pointer;
                padding: 5px;
                display: block;
                font-size: 16px;
                background: rgba(0, 255, 0, 0.1);
                border-left: 2px solid #00ff00;
                transition: all 0.2s ease-in-out;
            }

            .file-item:hover {
                background: rgba(0, 255, 0, 0.3);
                color: #fff;
            }

            button {
                margin-top: 15px;
                padding: 12px 18px;
                background: #00ff00;
                color: #000;
                font-family: 'VT323', monospace;
                border: 2px solid #00ff00;
                cursor: pointer;
                border-radius: 5px;
                font-size: 18px;
                text-transform: uppercase;
                letter-spacing: 2px;
                transition: background 0.2s, color 0.2s, border-color 0.2s;
            }

            button:hover {
                background: #000;
                border-color: #00ff00;
                color: #00ff00;
            }
        </style>
    </head>
    <body>
        <h1>Missing "use client" Directives</h1>
        <ul>
        ${missingUseClient.map(file => `
            <li>
                <div class="file-item" onclick="openFileInEditor('${encodeURIComponent(file)}')">${file}</div>
            </li>
        `).join('')}
        </ul>
        <button id="recheck">Relaunch the Check</button>
        <script>
            const vscode = acquireVsCodeApi();
            function openFileInEditor(filePath) {
                vscode.postMessage({ command: 'openFile', path: filePath });
            }
            document.getElementById("recheck").addEventListener("click", () => {
                vscode.postMessage({ command: 'recheck' });
            });
        </script>
    </body>
    </html>
    `;
}
