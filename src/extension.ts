import * as vscode from 'vscode';
import { findFiles, checkForUseClient } from './analyzer';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('nextjs.checkUseClient', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if(!workspaceFolders) {
			vscode.window.showErrorMessage("Apri un progetto Next.js prima di eseguire l'analisi");
			return;
		}
		const projectPath = workspaceFolders[0].uri.fsPath;
		const tsxFiles = findFiles(projectPath);
		const missingUseClient = tsxFiles.map(checkForUseClient).filter(Boolean);

		if(missingUseClient.length > 0) {
			vscode.window.showWarningMessage(`I seguenti componenti potrebbero necessitare 'use client':\n${missingUseClient.join('\n')}`);
		} else {
			vscode.window.showInformationMessage("Tutti i componenti sono configurati correttamente.");
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
