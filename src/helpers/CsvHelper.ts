import * as vscode from "vscode";
import * as fs from "fs";
import * as stringify from "csv-stringify";
import { LocalizedResourceValue } from "../models/Config";
import { LocaleCsvInfo, LocaleCsvData } from "../models/LocaleCsvInfo";
import Logging from "../commands/Logging";
import ImportLocaleHelper from "./ImportLocaleHelper";
import { LocaleKeyValue } from "../models/LocaleKeyValue";
import ProjectFileHelper from "./ProjectFileHelper";
import { OPTION_IMPORT_ALL } from "./ExtensionSettings";

const LOCALE_HEADER = "Locale";

export default class CsvHelper {

  /**
   * Start processing the CSV data
   * 
   * @param csvData 
   * @param impLocale 
   * @param resx 
   */
  public static startCsvImporting(csvData: string[][], impLocale: string, resx: LocalizedResourceValue[]) {
    // Get the header information
    const csvHeaders = this.getHeaders(csvData);
    if (csvHeaders && csvHeaders.keyIdx !== null) {
      // Process the CSV data
      const localeData = this.processCsvData(csvData, csvHeaders);
      if (localeData) {
        // Check which resx file needs to be imported
        if (impLocale === OPTION_IMPORT_ALL) {
          // Full import
          for (const localeResx of resx) {
            ImportLocaleHelper.createLocaleFiles(localeResx, localeData);
          }
        } else {
          // Single import
          ImportLocaleHelper.createLocaleFiles(resx.find(r => r.key === impLocale), localeData);
        }
      }
    } else {
      Logging.error(`The header information is not correctly in place.`);
    }
  }

  /**
   * Create a new CSV file
   * 
   * @param jsFiles 
   * @param resource 
   * @param csvFileLocation 
   * @param delimiter 
   * @param fileExtension 
   */
  public static createCsvFile(localeFiles: vscode.Uri[], resource: LocalizedResourceValue, csvFileLocation: string, delimiter: string, fileExtension: string): string {
    const locales = localeFiles.map(f => {
      const filePath = f.path.substring(f.path.lastIndexOf("/") + 1);
      return `${LOCALE_HEADER} ${filePath.replace(`.${fileExtension}`, "")}`;
    });
    // Create the headers for the CSV file
    const headers = ["key", ...locales, resource.key];
    const filePath = ProjectFileHelper.getAbsPath(csvFileLocation);
    fs.writeFileSync(filePath, headers.join(delimiter));
    return headers.join(delimiter);
  }

  /**
   * Update the CSV data based on the retrieved locale pairs
   * 
   * @param csvLocation 
   * @param csvData 
   * @param keyValuePairs 
   * @param localeName 
   * @param resourceName 
   * @param delimiter 
   */
  public static updateData(csvData: string[][], keyValuePairs: LocaleKeyValue[], localeName: string, resourceName: string): string[][] {
    const rowDefinition = this.getRowDefinition(csvData);
    if (rowDefinition) {
      // Start looping over the keyValuePairs
      for (const keyValue of keyValuePairs) {
        const rowIdx = this.findRowForKey(csvData, keyValue.key, rowDefinition.indexOf("key"));
        // Check if rowIdx has been found
        if (rowIdx) {
          // Update the row data
          csvData = this.updateDataRow(csvData, rowIdx, rowDefinition, keyValue, localeName, resourceName);
        } else {
          // Key wasn't found, adding a new data row
          csvData = this.addDataRow(csvData, rowDefinition, keyValue, localeName, resourceName);
        }
      }
    }
    return csvData;
  }

  /**
   * Write the CSV data to the file
   * 
   * @param fileLocation 
   * @param fileData 
   * @param delimiter 
   */
  public static writeToCsvFile(fileLocation: string, fileData: string[][], delimiter: string) {
    stringify(fileData, { delimiter }, (err: any | Error, output: any) => {
      if (output) {
        const filePath = ProjectFileHelper.getAbsPath(fileLocation);
        fs.writeFileSync(filePath, output, { encoding: "utf8" });
        Logging.info(`Exported the locale data to the CSV file.`);
      } else {
        Logging.error(`Something went wrong while writing to the CSV file.`);
      }
    });
  }

  /**
   * Update the current row data
   * 
   * @param csvData 
   * @param rowIndex 
   * @param rowDefinition 
   * @param keyValue 
   * @param localeName 
   * @param resourceName 
   */
  private static updateDataRow(csvData: string[][], rowIndex: number, rowDefinition: string[], keyValue: LocaleKeyValue, localeName: string, resourceName: string): string[][] {
    // Get the row
    let rowData = csvData[rowIndex];
    if (rowData) {
      for (let i = 0; i <= rowDefinition.length; i++) {
        // Get the row
        const header = rowDefinition[i];
        if (header === localeName && rowData[i] === "") {
          rowData[i] = keyValue.value; // Add the locale value to the CSV data if it was empty
        } else if (header === resourceName && rowData[i] === "") {
          // Specify that the key is used in the specified resource. 
          // This allows the locale key to be used by multiple resources.
          rowData[i] = "x"; 
        }
      }
    }

    return csvData;
  }

  /**
   * Add a new data row to the CSV data
   * 
   * @param csvData 
   * @param rowDefinition 
   * @param keyValue 
   * @param localeName 
   * @param resourceName 
   */
  private static addDataRow(csvData: string[][], rowDefinition: string[], keyValue: LocaleKeyValue, localeName: string, resourceName: string): string[][] {
    let rowData = [];
    for (const header of rowDefinition) {
      if (header === "key") { 
        rowData.push(keyValue.key); // Add the locale key to the CSV data
      } else if (header === localeName) {
        rowData.push(keyValue.value); // Add the locale value to the CSV data
      } else if (header === resourceName) {
        rowData.push("x"); // Specify that the key is used in the specified resource
      } else {
        rowData.push(""); // All other values can be empty
      }
    }
    
    // Check if rowData length is equal to rowDefinition length
    if (rowData.length === rowDefinition.length) {
      // Add the new row
      csvData.push(rowData);
    }

    return csvData;
  }

  /**
   * Search for the corresponding key / row
   * 
   * @param csvData 
   * @param localeKey 
   */
  private static findRowForKey(csvData: string[][], localeKey: string, cellIdx: number): number | null {
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      if (row && row[cellIdx] === localeKey) {
        return i;
      }
    }
    return null;
  }

  /**
   * Process all the locale data from the CSV file
   * 
   * @param csvData 
   * @param csvHeaders 
   */
  private static processCsvData(csvData: string[][], csvHeaders: LocaleCsvInfo): LocaleCsvData | null {
    if (csvHeaders.keyIdx !== null) { 
      const localeData: LocaleCsvData = {};
      // Create all the required locale data
      for (const locale of csvHeaders.localeIdx) {
        localeData[locale.key] = [];
      }
      // Start looping over all the rows (filtering out the first row)
      const allDataRows = csvData.filter((v, i) => i !== 0);
      for (const row of allDataRows) {
        if (row) {
          // Loop over all the locales in the csv file
          for (const locale of csvHeaders.localeIdx) {
            // Loop over the available resources
            for (const resx of csvHeaders.resxNames) {
              const resxValue = row[resx.idx] || null;
              // Check if the label is for the current resource
              if (resxValue && resxValue.toLowerCase() === "x") {
                localeData[locale.key].push({
                  key: row[csvHeaders.keyIdx] || null,
                  label: row[locale.idx] || null,
                  resx: resx.key || null
                });
              }
            }
          }
        }
      }

      return localeData;
    } else {
      Logging.error(`The required "key" header was not found in the CSV file.`);
      return null;
    }
  }

  /**
   * Get the headers of the CSV file
   * 
   * @param csvData 
   */
  private static getHeaders (csvData: string[][]): LocaleCsvInfo | null {
    if (csvData && csvData.length > 0) {
      const firstRow = csvData[0];
      if (firstRow) {
        const headerInfo: LocaleCsvInfo = {
          keyIdx: null,
          localeIdx: [],
          resxNames: []
        };
        for (let i = 0; i <= firstRow.length; i++) {
          // Get the cell
          const cell = firstRow[i];
          if (cell) {
            // Add the key index to the object
            if (cell.toLowerCase() === "key") {
              headerInfo.keyIdx = i;
            } else if (cell.toLowerCase().startsWith(LOCALE_HEADER.toLowerCase())) {
              headerInfo.localeIdx.push({
                key: cell.toLowerCase().replace(LOCALE_HEADER.toLowerCase(), "").trim(),
                idx: i
              });
            } else {
              headerInfo.resxNames.push({
                key: cell,
                idx: i
              });
            }
          }
        }
        return headerInfo;
      }
    }
    return null;
  }

  /**
   * Get row definition
   * 
   * @param csvData
   */
  private static getRowDefinition (csvData: string[][]): string[] | null {
    if (csvData && csvData.length > 0) {
      const firstRow = csvData[0];
      return firstRow.map(cell => {
        if (cell.toLowerCase() === "key") {
          return cell.toLowerCase();
        } else if (cell.toLowerCase().startsWith(LOCALE_HEADER.toLowerCase())) {
          return cell.toLowerCase().replace(LOCALE_HEADER.toLowerCase(), "").trim();
        } else {
          return cell;
        }
      });
    }
    return null;
  }
}