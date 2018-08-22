'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocaleKey } from './commands/LocaleKey';
import LanguageHover from './hover/LanguageHover';
import CsvCommands from './commands/CsvCommands';

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
  
  // Register the localization importer
  const csvImport = vscode.commands.registerCommand('extension.spfxCsvImport', () => {
    CsvCommands.import();
  });

  // Register the localization importer
  const csvExport = vscode.commands.registerCommand('extension.spfxCsvExport', () => {
    CsvCommands.export();
  });

  // Register hover providers
  vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescript' }, { provideHover: LanguageHover.onHover });
  vscode.languages.registerHoverProvider({ scheme: 'file', language: 'typescriptreact' }, { provideHover: LanguageHover.onHover });
  
  context.subscriptions.push(creating);
  context.subscriptions.push(inserting);
  context.subscriptions.push(importing);
  context.subscriptions.push(csvImport);
  context.subscriptions.push(csvExport);

  // Show the actions in the context menu
  vscode.commands.executeCommand('setContext', 'spfxProjectCheck', true);

  console.log('SPFx localization is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}