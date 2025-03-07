import * as vscode from 'vscode';
import { findFiles, checkForUseClient } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('nextjs.checkUseClient', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("Please open a Next.js project before running the analysis");
      return;
    }
    const projectPath = workspaceFolders[0].uri.fsPath;

    // Find all TSX files in the project
    const tsxFiles = findFiles(projectPath);

    // Check components for the 'use client' directive
    const missingUseClient = tsxFiles.map(checkForUseClient).filter(Boolean);

    if (missingUseClient.length > 0) {
      // Mostra una lista di file mancanti con la possibilità di aprirli
      const fileLinks = missingUseClient.map(file => {
        return {
          label: `Open ${file}`,  // Etichetta del link
          description: 'Missing "use client" directive', // Descrizione opzionale
          filePath: file // Memorizziamo il percorso del file
        };
      });

      // Usa showQuickPick per mostrare una lista di file cliccabili
      const selectedFile = await vscode.window.showQuickPick(fileLinks, {
        placeHolder: 'Select a component to open',
        canPickMany: false, // Disabilita la selezione multipla
      });

      if (selectedFile && selectedFile.filePath) {
        // Se un file è selezionato e il filePath non è null, aprilo nell'editor
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(selectedFile.filePath));
      }
    } else {
      vscode.window.showInformationMessage("All components are correctly configured.");
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
