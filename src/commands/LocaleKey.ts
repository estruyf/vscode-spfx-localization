import { CONFIG_AUTO_EXPORT } from './../helpers/ExtensionSettings';
import * as vscode from 'vscode';
import { Config, LocalizedResourceValue } from '../models/Config';
import { ActionType } from './ActionType';
import ProjectFileHelper from '../helpers/ProjectFileHelper';
import ResourceHelper from '../helpers/ResourceHelper';
import TextHelper from '../helpers/TextHelper';
import Logging from './Logging';
import { CONFIG_KEY } from '../helpers/ExtensionSettings';
import CsvCommands from './CsvCommands';

export class LocaleKey {

  /**
   * Create a new localization key for a SharePoint Framework solution
   */
  public static async insert() {
    // The code you place here will be executed every time your command is executed
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      Logging.error(`You aren't editing a file at the moment.`);
      return; // No open text editor
    }
    
    // Get the current text selection
    let selection = editor.selection;
    let text = editor.document.getText(selection);
    if (!text) {
      Logging.error(`You didn't select a string to replace with the locale key.`);
      return;
    }

    // Check if the text start and ends width quotes
    text = TextHelper.stripQuotes(text);

    // Create the localization information
    this.createLocalization(editor, text, ActionType.insert);
  }

  /**
   * Create a new key and insert it in the current document. Same process as creation, but without text selection.
   */
  public static async create() {
    // The code you place here will be executed every time your command is executed
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      Logging.error(`You aren't editing a file at the moment.`);
      return; // No open text editor
    }

    // Create the localization information
    this.createLocalization(editor, "", ActionType.create);
  }

  /**
   * Import a localization dependency in the local file of a SharePoint Framework solution
   */
  public static async import() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    // Get the current text of the document
    const crntFile = editor.document.getText();
    if (crntFile && crntFile.includes("import * as strings")) {
      Logging.warning(`Current file already contains a localized resources strings import.`);
      return;
    }

    // Fetch the project config
    const configInfo: Config | null = await ProjectFileHelper.getConfig();
    if (configInfo && configInfo.localizedResources) {
      const resx = ResourceHelper.excludeResourcePaths(configInfo);
      // Check if resources were retrieved
      if (resx && resx.length > 0) {
        // Take the default one to import
        let defaultResx: string | undefined = resx[0].key;
        if (resx.length > 1) {
          defaultResx = await vscode.window.showQuickPick(resx.map(r => r.key), {
            placeHolder: "Specify which localized resource you want to insert in your file.",
            canPickMany: false
          });
        }

        if (defaultResx) {
          editor.edit(builder => builder.insert(new vscode.Position(0, 0), `import * as strings from '${defaultResx}';\r\n`));
        } else {
          Logging.error("You didn't select a localized resource to insert.");
        }
      }
    }
  }

  /**
   * Creates the localization keys and values in the right files
   * 
   * @param editor 
   * @param text 
   * @param action 
   */
  private static async createLocalization(editor: vscode.TextEditor, text: string, action: ActionType) {
    const localeKey = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: "Specify the key to create",
      prompt: "Example: InputTitleLabel, TitleFieldLabel, ..."
    });
    if (!localeKey) {
      Logging.error(`You didn't specify a locale key to create.`);
      return;
    }

    // Check if text is empty.
    if (!text && action === ActionType.create) {
      const localeValue = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Specify the default localization value",
        prompt: "Example: Loading profile information..."
      });
      if (!localeValue) {
        Logging.error(`You didn't specify the default localization value.`);
        return;
      } else {
        text = localeValue;
      }
    }

    // Check if the user wants to surround the key with curly brackets. Only during the insert process.
    let useBrackets = "no";
    const bracketsResult = await vscode.window.showQuickPick(["no", "yes"], {
      placeHolder: "Do you want to surround the localized key with curly brackets `{}`?",
      canPickMany: false
    });
    if (bracketsResult) {
      useBrackets = bracketsResult;
    }

    // Fetch the project config
    const configInfo: Config | null = await ProjectFileHelper.getConfig();    
    if (configInfo) {
      if (!configInfo.localizedResources) {
        Logging.error(`No localizedResources were defined in the config.`);
        return;
      }

      // Convert to array and filter out the none project related resource files
      const resx = ResourceHelper.excludeResourcePaths(configInfo);
      let defaultResx: LocalizedResourceValue | null = null;
      if (resx && resx.length > 0) {
        // Fetch the default locale resource
        defaultResx = resx[0];

        // Check if there were more localized resources defined
        if (resx.length > 1) {
          // Show the quick pick control with the available options
          const resxKey = await vscode.window.showQuickPick(resx.map(r => r.key), {
            placeHolder: "Specify which localized resource file to use.",
            canPickMany: false
          });
          // Check if option was selected
          if (resxKey) {
            const selected = resx.filter(r => r.key === resxKey);
            defaultResx = selected && selected.length > 0 ? selected[0] : defaultResx;
          }
        }

        // Create the key in the localized resource file
        let resourcePath = ProjectFileHelper.getResourcePath(defaultResx);
        // Get all files from the localization folder
        const localeFiles = await vscode.workspace.findFiles(`${resourcePath}/*`);

        // Loop over all the files
        for (const filePath of localeFiles) {
          await this.addKeyToFile(filePath, localeKey, text);
        }

        // Insert the newly created key on the insert action
        if (action === ActionType.insert) {
          // Update the current selected text to the used resouce key
          await editor.edit(builder => {
            builder.replace(editor.selection, useBrackets === "yes" ? `{strings.${localeKey}}` : `strings.${localeKey}`);
          });
        } else {
          if (editor.selection.active) {
            // Update the current selected text to the used resouce key
            await editor.edit(builder => {
              builder.replace(editor.selection.active, useBrackets === "yes" ? `{strings.${localeKey}}` : `strings.${localeKey}`);
            });
          }
        }
      }

      // Display a message box to the user
      // vscode.window.showInformationMessage(`${EXTENSION_NAME}: "${localeKey}" key has been added.`);

      // Check if auto CSV export needs to start
      const autoExport = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_AUTO_EXPORT);
      if (autoExport && defaultResx) {
        // Start the export to the CSV file
        CsvCommands.export(defaultResx);
      }
    }
  }

  /**
   * Adds the locale key to the found file
   * 
   * @param fileName 
   * @param localeKey 
   * @param localeValue 
   */
  private static async addKeyToFile(fileName: vscode.Uri, localeKey: string, localeValue: string): Promise<void> {
    const fileData = await vscode.workspace.openTextDocument(fileName);
    const fileContents = fileData.getText();
    const fileLines = fileContents.split("\n");

    // Create workspace edit
    const edit = new vscode.WorkspaceEdit();
    let applyEdit = false;

    // Check if the key is already in place
    if (fileContents.includes(localeKey)) {
      Logging.warning(`The key (${localeKey}) was already defined in the following file: ${fileData.fileName}.`);
      return;
    }

    let idx = -1;
    // Check if "d.ts" file
    if (fileData.fileName.endsWith(".d.ts")) {
      idx = TextHelper.findInsertPosition(fileLines, localeKey, TextHelper.FindPositionTs);
  }

    // Check if "js" file
    if (fileData.fileName.endsWith(".js") || (fileData.fileName.endsWith(".ts") && !fileData.fileName.endsWith(".d.ts"))) {
      // Check if line starts with "return" and ends with "{"
      idx = TextHelper.findInsertPosition(fileLines, localeKey, TextHelper.FindPositionJs);
    }

    // Check if the line was found, add the key and save the file
    if (idx !== -1) {
      applyEdit = true;
      const getLinePos = fileLines[idx + 1].search(/\S|$/);
      // Create the data to insert in the file
      let newLineData: string | null = null;
      if (fileData.fileName.endsWith(".d.ts")) {
        newLineData = `${localeKey}: string;\r\n${' '.repeat(getLinePos)}`;
      } else if (fileData.fileName.endsWith(".js") || (fileData.fileName.endsWith(".ts") && !fileData.fileName.endsWith(".d.ts"))) {
        newLineData = `${localeKey}: "${localeValue.replace(/"/g, `\\"`)}",\r\n${' '.repeat(getLinePos)}`;
      }
      // Check if there is data to insert
      if (newLineData) {
        edit.insert(fileData.uri, new vscode.Position((idx + 1), getLinePos), newLineData);
      }
    }

    if (applyEdit) {
      try {
        const result = await vscode.workspace.applyEdit(edit).then(success => success);
        if (!result) {
          Logging.error(`Couldn't add the key to the file: ${fileName}.`);
        } else {
          await fileData.save();
        }
      } catch (e) {
        Logging.error(`Something went wrong adding the locale key to the file: ${fileName}.`);
      }
    }

    return;
  }
}