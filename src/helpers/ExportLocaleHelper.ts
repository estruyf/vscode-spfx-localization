import * as vscode from "vscode";
import ResourceHelper from "./ResourceHelper";
import CsvHelper from "./CsvHelper";

export default class ExportLocaleHelper {

  /**
   * Start the localization export to the CSV file
   * 
   * @param err 
   * @param csvData 
   * @param jsFiles 
   * @param csvLocation 
   * @param delimiter
   * @param resourceName 
   */
  public static async startExport(err: any | Error, csvData: string[][], jsFiles: vscode.Uri[], csvLocation: string, delimiter: string, resourceName: string): Promise<void> {
    // Start looping over the JS Locale files
    for (const jsFile of jsFiles) {
      const jsFileData = await vscode.workspace.openTextDocument(jsFile);
      if (jsFileData) {
        const keyValuePairs = ResourceHelper.getKeyValuePairs(jsFileData.getText());
        // Check if key value pairs have been retrieved
        if (keyValuePairs && keyValuePairs.length > 0) {
          const localeName = jsFileData.fileName.substring((jsFileData.fileName.lastIndexOf("/") + 1), jsFileData.fileName.lastIndexOf(".js"));
          // Start adding/updating the key and values to the CSV data
          csvData = CsvHelper.updateData(csvData, keyValuePairs, localeName, resourceName);
        }
      }
    }

    // Once all data has been processed, the CSV file can be created
    CsvHelper.writeToCsvFile(csvLocation, csvData, delimiter);
  }
}