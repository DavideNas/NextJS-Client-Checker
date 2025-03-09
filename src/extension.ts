import * as vscode from 'vscode';
import * as path from 'path';
import { findFiles, checkForUseClient } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('nextjs.checkUseClient', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Please open a Next.js project before running the analysis");
            return;
        }
        const projectPath = workspaceFolders[0].uri.fsPath;

        // Trova tutti i file .tsx nel progetto
        const tsxFiles = await findFiles(projectPath);

        // Verifica i componenti per la direttiva 'use client'
        const missingUseClient = tsxFiles.map(checkForUseClient).filter((file) => file !== null) as string[];

        if (missingUseClient.length > 0) {
            // Apre il log nella webview sulla destra
            const panel = vscode.window.createWebviewPanel(
                'nextjsUseClientCheck',
                'Missing "use client" Directives',
                // La webview si aprirà nella colonna di destra
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(context.extensionPath)] // Consente risorse locali
                }
            );

            // Contenuto HTML della webview
            panel.webview.html = getWebviewContent(missingUseClient);

            // Ascolta il messaggio per aprire un file al clic (a sinistra)
            panel.webview.onDidReceiveMessage(
                message => {
                    console.log("Message received:", message);
                    if (message.command === 'openFile') {
                        let filePath = message.path;
                        // Decodifica i caratteri speciali e correggi il formato
                        console.log("Raw path received:", filePath); // 🔍 Debug

                        // Decodifica eventuali caratteri URL (Es: %3A → :)
                        filePath = decodeURIComponent(filePath);

                        // Aggiunge il backslash dopo "C:" se manca (solo per Windows)
                        if (/^[a-zA-Z]:[^\\]/.test(filePath)) {
                            filePath = filePath[0] + ":\\" + filePath.substring(2);
                        }

                        // 🔥 FIX: Corregge i separatori di directory mancanti
                        filePath = filePath.replace(/([a-zA-Z]:)([^\s\\])/g, '$1\\$2'); // Aggiunge backslash dopo il drive letter
                        filePath = filePath.replace(/(\\|\/)+/g, '\\'); // Unifica tutti i separatori in '\'

                        // if (process.platform === "win32") {
                        //     filePath = filePath.replace(/\//g, '\\');
                        // }

                        console.log("Processed path:", filePath); // DEBUG: Mostra il percorso finale

                        // Verifica se il file esiste prima di tentare di aprirlo
                        const fs = require('fs');
                        if (!fs.existsSync(filePath)) {
                            vscode.window.showErrorMessage(`File not found: ${filePath}`);
                            console.error("File not found:", filePath);
                            return;
                        }

                        // Apre il file sulla sinistra
                        vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(document => {
                            // Apre il file a sinistra
                            vscode.window.showTextDocument(document, vscode.ViewColumn.One)
                                .then(() => {
                                    console.log("File opened successfully:", filePath);
                                }, err => {
                                    console.error("Error opening file:", err);
                                });
                        }, err => {
                            console.error("Error loading document:", err);
                        });
                    }
                },
                undefined,
                context.subscriptions
            );
        } else {
            vscode.window.showInformationMessage("All components are correctly configured.");
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

// Funzione per generare il contenuto HTML della webview
function getWebviewContent(missingUseClient: string[]): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Missing "use client" Directives</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #1e1e1e;
                color: #d3d3d3;
                margin: 0;
                padding: 20px;
            }
            h1 {
                color: #ffffff;
                font-size: 20px;
            }
            .tab {
                background-color: #333333;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 10px;
                cursor: pointer;
                color: #d3d3d3;
                transition: background-color 0.3s;
            }
            .tab:hover {
                background-color: #444444;
            }
            .tab-content {
                margin-left: 20px;
            }
            .file-item {
                color: #b0b0b0;
                cursor: pointer;
                padding: 5px 0;
                transition: color 0.3s;
            }
            .file-item:hover {
                color: #ffffff;
            }
        </style>
    </head>
    <body>
        <h1>Missing "use client" Directives</h1>
        <div>
            <div class="tab">
                <span>Files needing the 'use client' directive:</span>
            </div>
            <div class="tab-content">
                ${missingUseClient.map((file, index) => `
                    <div class="file-item" onclick="openFileInEditor('${encodeURIComponent(file)}')">
                        ${file}
                    </div>
                `).join('')}
            </div>
        </div>
        <!-- Script alla fine del body -->
        <script>
            // Verifica che la funzione sia definita prima di usarla
            const vscode = acquireVsCodeApi();
            console.log("Defining openFileInEditor function...");

            function openFileInEditor(filePath) {
                const decodedPath = decodeURIComponent(filePath);
                console.log("Opening file:", decodedPath);
                vscode.postMessage({
                    command: 'openFile',
                    path: decodedPath
                });
            }
        </script>
    </body>
    </html>
    `;
}
