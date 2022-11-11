import * as vscode from 'vscode';

interface CustomLink {
	startIndex: number;
	length: number;
	tooltip: string;
	file: string;
	lineIndex: number;
	colIndex: number;
}

export interface CustomTerminalLinkProviderOptions {
	extensionId: string;
}

export class CustomTerminalLinkProvider implements vscode.TerminalLinkProvider {
	private extensionIdentifier: string;

	constructor(options: CustomTerminalLinkProviderOptions) {
		this.extensionIdentifier = options.extensionId.split('.')[1];
	}

	provideTerminalLinks(context: vscode.TerminalLinkContext, token: vscode.CancellationToken) {
		const config = vscode.workspace.getConfiguration(this.extensionIdentifier);
		const protocols = config?.get<string[]>('protocols') ||['webpack'];
        // keep the hardcoded regex here for a reference
		// const regex = /webpack:\/\/([^\.]{1,4096}\.\w{1,8})(:\d{1,8})?(:\d{1,8})?/g;
		const regex = new RegExp(`(?:${protocols.join('|')}):\/\/([^\\.]{1,4096}\\.\\w{1,8})(:\\d{1,8})?(:\\d{1,8})?`, 'g');
		const matches = [...context.line.matchAll(regex)];
		if (matches.length === 0) {
			return [];
		}
		return matches.map(m => {
			let lineIndex = 0;
			let colIndex = 0;
			if (m[2]) {
				lineIndex = parseInt(m[2].slice(1)) - 1;
			}
			if (m[3]) {
				colIndex = parseInt(m[3].slice(1)) - 1;
			}
			return {
				startIndex: m.index || 0,
				length: m[0].length,
				tooltip: 'Open file',
				file: m[1],
				lineIndex,
				colIndex,
			};
		});
	}

	handleTerminalLink(link: CustomLink) {
		const workspacePath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;
		console.log(workspacePath);
		if (!workspacePath) {
			return;
		}
		const fileUri = vscode.Uri.joinPath(vscode.Uri.file(workspacePath), link.file);
		console.log(fileUri.toString());
		Promise.resolve()
		.then(() => vscode.workspace.openTextDocument(fileUri))
		.then(doc => vscode.window.showTextDocument(doc))
		.then(editor => {
			let range = editor.document.lineAt(link.lineIndex).range;
			const start = new vscode.Position(link.lineIndex, link.colIndex);
			editor.selection =  new vscode.Selection(start, start);
			editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
		})
		.catch(err => {
			vscode.window.showWarningMessage(err.message);
		});
	}
}