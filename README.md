## What it does

When debugging bundled code, we need sourcemap files to locate the source files instead of the bundled files. This is especially important when the bundled code throws an error. When works with vscode, it allows to click the file path in its terminal to open the source file directly and goto the indicated line.

However, some bundlers (such as webpack) add their own protocols before the file path in the sourcemap, such as `webpack://somedir/subdir/source.ts:34:9`, vscode doesn't know how to open such files (vscode works with `somedir/subdir/source.ts:34:9` natively). This extension allows to open those files directly by clicking the link.

## How does it work

It just removes the protocol schema (`webpack://`) and append the workspace foler before the file path, then open it in the editor.

Besides the default protocol (`webpack`), the extension also allows to add custom protocols.