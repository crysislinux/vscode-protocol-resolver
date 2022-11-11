import * as vscode from 'vscode';
import { CustomTerminalLinkProvider } from './terminal-link-provider';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	if (context.extensionMode === vscode.ExtensionMode.Development) {
		console.log('Congratulations, your extension "protocol-resolver" is now active!');
	}
	const terminalLinkProvider = new CustomTerminalLinkProvider({ extensionId: context.extension.id });
	const disposable = vscode.window.registerTerminalLinkProvider(terminalLinkProvider);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
