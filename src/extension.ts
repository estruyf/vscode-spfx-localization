'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocaleKey } from './commands/localeKey';
import LanguageHover from './hover/LanguageHover';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Register the localization command
  const creating = vscode.commands.registerCommand('extension.spfxLocalizationCreateKey', () => {
    LocaleKey.create();
  });

  const inserting = vscode.commands.registerCommand('extension.spfxLocalizationInsertKey', () => {
    LocaleKey.insert();
  });

  // Register the localization importer
  const importing = vscode.commands.registerCommand('extension.spfxLocalizationImport', () => {
    LocaleKey.import();
  });

  // Register hover providers
  vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescript' }, { provideHover: LanguageHover.onHover });
  vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescriptreact' }, { provideHover: LanguageHover.onHover });
  
  context.subscriptions.push(creating);
  context.subscriptions.push(inserting);
  context.subscriptions.push(importing);
}

// this method is called when your extension is deactivated
export function deactivate() {}