import * as vscode from 'vscode';
import { Config } from './Config';
import { ActionType } from './ActionType';

const EXTENSION_NAME = "SPFx Localization";

export class LocaleKey {
  /**
   * Create a new localization key for a SharePoint Framework solution
   */
  public static async insert() {
    // The code you place here will be executed every time your command is executed
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.error(`You aren't editing a file at the moment.`);
      return; // No open text editor
    }
    
    // Get the current text selection
    let selection = editor.selection;
    let text = editor.document.getText(selection);
    if (!text) {
      this.error(`You didn't select a string to replace with the locale key.`);
      return;
    }

    // Check if the text start and ends width quotes
    text = this.stripQuotes(text);

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
      this.error(`You aren't editing a file at the moment.`);
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
      this.warning(`Current file already contains a localized resources strings import.`);
      return;
    }

    // Fetch the project config
    const configInfo: Config | null = await this.getConfig();
    if (configInfo && configInfo.localizedResources) {
      const resx = this.excludeResourcePaths(configInfo);
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
          this.error("You didn't select a localized resource to insert.");
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
      this.error(`You didn't specify a locale key to create.`);
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
        this.error(`You didn't specify the default localization value.`);
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
    const configInfo: Config | null = await this.getConfig();    
    if (configInfo) {
      if (!configInfo.localizedResources) {
        this.error(`No localizedResources were defined in the config.`);
        return;
      }

      // Convert to array and filter out the none project related resource files
      const resx = this.excludeResourcePaths(configInfo);
      if (resx && resx.length > 0) {
        // Fetch the default locale resource
        let defaultResx = resx[0];

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
        let resourcePath = defaultResx.value.substring(0, defaultResx.value.lastIndexOf('/'));
        // Check if the path starts with 'lib/', if this is the case, it needs to be changed to 'src/'
        if (resourcePath.startsWith("lib/")) {
          resourcePath = resourcePath.replace("lib/", "src/");
        }

        // Get all files from the localization folder
        const jsFiles = await vscode.workspace.findFiles(`${resourcePath}/*`);

        // Loop over all the files
        for (const filePath of jsFiles) {
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
    }
  }

  /**
   * Fetch the project config file
   */
  private static async getConfig(): Promise<Config | null> {
    // Start the search for the loc folder in the project
    const configFileUrls = await vscode.workspace.findFiles('**/config/config.json', "**/node_modules/**", 1);
    if (!configFileUrls || configFileUrls.length === 0) {
      this.error(`Solution config file could not be retrieved.`);
      return null;
    }

    // Take the first config file
    const configFileUrl = configFileUrls[0];
    if (configFileUrl) {
      // Fetch the the config file contents
      const configFile = await vscode.workspace.openTextDocument(configFileUrl);
      if (!configFile) {
        this.error(`Could not read the config file.`);
        return null;
      }

      // Get the file contents
      const contents = configFile.getText();
      if (!contents) {
        this.error(`Could not retrieve the file contents.`);
        return null;
      }

      // Fetch the config information and check if localizedResources were defined
      const configInfo: Config = JSON.parse(contents);
      return configInfo;
    }

    return null;
  }

  /**
   * Exclude all the none related project resource paths
   * 
   * @param configInfo 
   */
  private static excludeResourcePaths(configInfo: Config) {
    const lrKeys = Object.keys(configInfo.localizedResources);
    const resx = [];
    for (const key of lrKeys) {
      const value = configInfo.localizedResources[key];
      if (!value.includes("node_modules")) {
        resx.push({
          key,
          value
        });
      }
    }
    return resx;
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
      this.warning(`The key (${localeKey}) was already defined in the following file: ${fileData.fileName}.`);
      return;
    }

    let idx = -1;
    // Check if "d.ts" file
    if (fileData.fileName.endsWith(".d.ts")) {
      // Check if line starts with "declare interface" and ends with "{"
      idx = fileLines.findIndex(line => {
        const matches = line.trim().match(/(^declare interface|{$)/gi);
        return matches !== null && matches.length >= 2;
      });
    } 

    // Check if "js" file
    if (fileData.fileName.endsWith(".js")) {
      // Check if line starts with "return" and ends with "{"
      idx = fileLines.findIndex(line => {
        const matches = line.trim().match(/(^return|{$)/gi);
        return matches !== null && matches.length >= 2;
      });
    }

    // Check if the line was found, add the key and save the file
    if (idx !== -1) {
      applyEdit = true;
      const getLinePos = fileLines[idx + 1].search(/\S|$/);
      // Create the data to insert in the file
      let newLineData: string | null = null;
      if (fileData.fileName.endsWith(".d.ts")) {
        newLineData = `${localeKey}: string;\r\n${' '.repeat(getLinePos)}`;
      } else if (fileData.fileName.endsWith(".js")) {
        newLineData = `${localeKey}: "${localeValue}",\r\n${' '.repeat(getLinePos)}`;
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
          this.error(`Couldn't add the key to the file: ${fileName}.`);
        } else {
          await fileData.save();
        }
      } catch (e) {
        this.error(`Something went wrong adding the locale key to the file: ${fileName}.`);
      }
    }

    return;
  }

  /**
   * Strip quotes at the beginning and end of the string
   * 
   * @param value 
   */
  private static stripQuotes(value: string): string {
    if ((value.startsWith(`'`) && value.endsWith(`'`)) || 
        (value.startsWith(`"`) && value.endsWith(`"`)) || 
        (value.startsWith("`") && value.endsWith("`"))) {
      return value.substring(1, value.length - 1);
    }

    return value;
  }

  /**
   * Show an error message
   * 
   * @param msg 
   */
  private static error(msg: string): void {
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${msg}`);
  }

  /**
   * Show an error message
   * 
   * @param msg 
   */
  private static warning(msg: string): void {
    vscode.window.showWarningMessage(`${EXTENSION_NAME}: ${msg}`);
  }
}