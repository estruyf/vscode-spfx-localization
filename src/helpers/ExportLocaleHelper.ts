import * as vscode from "vscode";
import * as path from "path";
import ResourceHelper from "./ResourceHelper";
import CsvHelper from "./CsvHelper";
import { ICsvData } from "./CsvData";

export default class ExportLocaleHelper {

  /**
   * Start the localization export to the CSV file
   * 
   * @param err 
   * @param csvData 
   * @param localeFiles 
   * @param csvLocation 
   * @param delimiter
   * @param resourceName
   */
  public static async startExport(csvData: ICsvData, localeFiles: vscode.Uri[], csvLocation: string, delimiter: string, resourceName: string, useBom: boolean): Promise<void> {
    // Start looping over the JS Locale files
    for (const localeFile of localeFiles) {
      const localeData = await vscode.workspace.openTextDocument(localeFile);
      if (localeData) {
        const keyValuePairs = ResourceHelper.getKeyValuePairs(localeData.getText());
        // Check if key value pairs have been retrieved
        if (keyValuePairs && keyValuePairs.length > 0) {
          const fileName = path.basename(localeData.fileName);
          const localeName = fileName.split('.').slice(0, -1).join('.');
          // Start adding/updating the key and values to the CSV data
          CsvHelper.updateData(csvData, keyValuePairs, localeName, resourceName);
        }
      }
    }

    // Once all data has been processed, the CSV file can be created
    await CsvHelper.writeToCsvFile(csvLocation, csvData, delimiter, useBom);
  }
}