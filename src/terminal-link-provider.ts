import * as vscode from 'vscode';

interface CustomLink {
	startIndex: number;
	length: number;
	tooltip: string;
	file: string;
	lineIndex: number;
	colIndex: number;
}

interface ProtocolItem {
	protocol: string;
	autoRemoveProjectPrefix: boolean;
}

const defaultWebpackProtocol: ProtocolItem = { protocol: 'webpack', autoRemoveProjectPrefix: true };

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
		const protocolItems = config?.get<ProtocolItem[]>('protocols') || [defaultWebpackProtocol];
		const protocols = protocolItems.map(item => item.protocol);
        // keep the hardcoded regex here for a reference
		// const regex = /(webpack):\/?\/([\w\-_.$\/]{1,4096}\.(?:ts|js|mjs))(:\d{1,8})?(:\d{1,8})?/g;
		const regex = new RegExp(`(${protocols.join('|')}):\/?\/([\\w\\-_.$\\/]{1,4096}\\.(?:ts|js|mjs))(:\\d{1,8})?(:\\d{1,8})?`, 'g');
		const matches = [...context.line.matchAll(regex)];
		if (matches.length === 0) {
			return [];
		}
		const settings = protocolItems.reduce((acc, cur) => {
			acc[cur.protocol] = cur;
			return acc;
		}, { } as { [protocol: string]: ProtocolItem });
		return matches.map(m => {
			let lineIndex = 0;
			let colIndex = 0;
			if (m[3]) {
				lineIndex = parseInt(m[3].slice(1)) - 1;
			}
			if (m[4]) {
				colIndex = parseInt(m[4].slice(1)) - 1;
			}
			let file = m[2];
			if (settings[m[1]].autoRemoveProjectPrefix) {
				file = file.replace(/^[^\/]+\//, '');
			}
			return {
				startIndex: m.index || 0,
				length: m[0].length,
				tooltip: 'Open file',
				file,
				lineIndex,
				colIndex,
			};
		});
	}

	handleTerminalLink(link: CustomLink) {
		const workspacePath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;
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