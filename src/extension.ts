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
		const tsxFiles = await findFiles(projectPath);  // Usa `await` per risolvere la promise

		// Check components for the 'use client' directive
		const missingUseClient = tsxFiles.map(checkForUseClient).filter(Boolean);

		if (missingUseClient.length > 0) {
			vscode.window.showWarningMessage(`The following components may need the 'use client' directive:\n${missingUseClient.join('\n')}`);
		} else {
			vscode.window.showInformationMessage("All components are correctly configured.");
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
