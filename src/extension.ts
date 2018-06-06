'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocaleKey } from './commands/localeKey';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Register the localization command
  const creating = vscode.commands.registerCommand('extension.spfxLocalizationCreateKey', () => {
    LocaleKey.create();
  });

  // Register the localization importer
  const importing = vscode.commands.registerCommand('extension.spfxLocalizationImport', () => {
    LocaleKey.import();
  });
  
  context.subscriptions.push(creating);
  context.subscriptions.push(importing);
}

// this method is called when your extension is deactivated
export function deactivate() {}