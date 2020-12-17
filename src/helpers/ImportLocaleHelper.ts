import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import Logging from "../commands/Logging";
import { LocalizedResourceValue } from "../models/Config";
import { LocaleCsvData, LocaleData } from "../models/LocaleCsvInfo";
import ProjectFileHelper from "./ProjectFileHelper";
import { CONFIG_KEY, CONFIG_FILE_EXTENSION } from "./ExtensionSettings";
import TextHelper from "./TextHelper";

export default class ImportLocaleHelper {

  /**
   * Create the locale files
   * 
   * @param csvData 
   * @param resx 
   */
  public static async createLocaleFiles(resx: LocalizedResourceValue | undefined, localeData: LocaleCsvData | null) {
    if (!resx || !localeData) {
      return;
    }

    let fileExtension: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_FILE_EXTENSION);
    if (!fileExtension) {
      fileExtension = "js";
    }

    // Create the key in the localized resource file
    let resourcePath = ProjectFileHelper.getResourcePath(resx);

    // Start creating the files
    for (const key in localeData) {
      const localLabels = localeData[key];
      if (key && localLabels && localLabels.length > 0) {
        const resourceKeys = localeData[key].filter(l => l.resx === resx.key);
        if (resourceKeys && resourceKeys.length > 0) {

          await this.ensureTypescriptKeysDefined(resx, localLabels)

          // Create the file content
          let fileContents = fileExtension === "ts" ? `declare var define: any;
       
define([], () => {
` : `define([], function() {
`;

          fileContents += `  return {
    ${resourceKeys.map(k => `${k.key}: "${k.label}"`).join(`,\n    `)}
  };
});`;
          // Start creating the file
          const fileLocation = path.join(vscode.workspace.rootPath || __dirname, resourcePath, `${key}.${fileExtension}`);
          fs.writeFileSync(fileLocation, fileContents, { encoding: "utf8" });
          Logging.info(`Localization labels have been imported.`);
        }
      }
    }
  }


  /**
   * Ensure all lables are inserted in the definition (.d.ts) file when importing csv
   * 
   * @param resx
   * @param localLabels
  */
  private static async ensureTypescriptKeysDefined(resx: LocalizedResourceValue, localLabels: LocaleData[]): Promise<void> {

    // Create the key in the localized resource file
    let resourcePath = ProjectFileHelper.getResourcePath(resx);

    // Get all files from the localization folder
    const definitionFiles = await vscode.workspace.findFiles(`${resourcePath}/*.d.ts`);

    // nothing to update
    if (definitionFiles.length == 0) {
      return;
    }

    if (definitionFiles.length > 1) {
      Logging.warning(`There is more than one typescript definition file (.d.ts), the update skipped.`);
      return;
    }

    const fileData = await vscode.workspace.openTextDocument(definitionFiles[0]);
    const fileName = fileData.fileName;
    const fileContents = fileData.getText();
    const fileLines = fileContents.split("\n");

    // Create workspace edit
    const edit = new vscode.WorkspaceEdit();

    const startPos = fileLines.findIndex(line => {
      const matches = line.trim().match(/(^declare interface|{$)/gi);
      return matches !== null && matches.length >= 2;
    });

    // the file is non-standard
    if (startPos === -1) {
      Logging.warning(`The file ${fileName} does not start with 'declare interface'. File updated skipped.`);
      return;
    }

    let applyEdit = false;

    for (let localLabel of localLabels) {

      const localeKey = localLabel.key;

      // Check if the line was found, add the key and save the file
      if (!fileContents.includes(`${localeKey}: string;`)) {
        applyEdit = true;
        const getLine = TextHelper.findInsertPosition(fileLines, localeKey!, TextHelper.FindPositionTs);
        const getLinePos = fileLines[getLine + 1].search(/\S|$/);
        // Create the data to insert in the file
        const newLineData = `${localeKey}: string;\r\n${' '.repeat(getLinePos)}`;
        edit.insert(fileData.uri, new vscode.Position(getLine+1, getLinePos), newLineData);
      }
    }

    if (applyEdit) {
      try {
        const result = await vscode.workspace.applyEdit(edit).then(success => success);
        if (!result) {
          Logging.warning(`Couldn't update the typescript definition file: ${fileName}.`);
        } else {
          await fileData.save();
        }
      } catch (e) {
        Logging.warning(`Something went wrong when updating the typescript definition file: ${fileName}.`);
      }
    }
  }
}
