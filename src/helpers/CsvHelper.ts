import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LocalizedResourceValue } from "../models/Config";
import { LocaleCsvInfo, LocaleCsvData } from "../models/LocaleCsvInfo";
import Logging from "../commands/Logging";
import ImportLocaleHelper from "./ImportLocaleHelper";
import { LocaleKeyValue } from "../models/LocaleKeyValue";
import ProjectFileHelper from "./ProjectFileHelper";
import { OPTION_IMPORT_ALL } from "./ExtensionSettings";
import { COMMENT_HEADER, KEY_HEADER, LOCALE_HEADER, TIMESTAMP_HEADER } from "../constants/CsvHeaders";
import { ICsvData } from "./CsvData";
import { CsvDataArray } from "./CsvDataArray";
import { CsvDataExcel } from "./CsvDataExcel";

export default class CsvHelper {

  public static async openFile(filePath: string, delimiter: string, bom: boolean): Promise<ICsvData | null> {

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const result: ICsvData = this.isCsv(filePath) ? new CsvDataArray() : new CsvDataExcel();
    await result.read(filePath, { delimiter, bom });
    return result;
  }

  /**
   * Start processing the CSV data
   * 
   * @param csvData 
   * @param impLocale 
   * @param resx 
   */
  public static async startCsvImporting(csvData: ICsvData, impLocale: string, resx: LocalizedResourceValue[]) {
    // Get the header information
    const csvHeaders = this.getHeaders(csvData);
    if (csvHeaders && csvHeaders.keyIdx >= 0) {
      // Process the CSV data
      const localeData = this.processCsvData(csvData, csvHeaders);
      if (localeData) {
        // Check which resx file needs to be imported
        if (impLocale === OPTION_IMPORT_ALL) {
          // Full import
          for (const localeResx of resx) {
            await ImportLocaleHelper.createLocaleFiles(localeResx, localeData);
          }
        } else {
          // Single import
          await ImportLocaleHelper.createLocaleFiles(resx.find(r => r.key === impLocale), localeData);
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
  public static async createCsvData(localeFiles: vscode.Uri[], resource: LocalizedResourceValue, csvFileLocation: string, fileExtension: string, useComment: boolean, useTimestamp: boolean): Promise<ICsvData> {
    const locales = localeFiles.map(f => {
      const filePath = f.path.substring(f.path.lastIndexOf("/") + 1);
      return filePath.replace(`.${fileExtension}`, "");
    });
    // Create the headers for the CSV file
    const headers = [KEY_HEADER, ...locales, resource.key];

    // add comment column if feature is enabled
    if (useComment) {
      headers.push(COMMENT_HEADER);
    }

    // add timestamp column if feature is enabled
    if (useTimestamp) {
      headers.push(TIMESTAMP_HEADER);
    }

    if (this.isCsv(csvFileLocation)) {
      return new CsvDataArray([headers], resource.key);
    } else {
      return new CsvDataExcel([headers], resource.key);
    }
  }

  /**
   * Use current timestamp as default comment for the new strings
   */
  private static addTimestamp = () => new Date().toISOString().split('.')[0];

  /**
   * Update the CSV data based on the retrieved locale pairs
   * @param csvData 
   * @param keyValuePairs 
   * @param localeName 
   * @param resourceName 
   * @param useComment 
   * @param useTimestamp 
   */
  public static updateData(csvData: ICsvData, keyValuePairs: LocaleKeyValue[], localeName: string, resourceName: string, useComment?: boolean, useTimestamp?: boolean) {

    const csvHeaders = this.getHeaders(csvData);

    const timestamp = useTimestamp ? this.addTimestamp() : '';

    if (csvHeaders && csvHeaders.keyIdx >= 0) {
      // Start looping over the keyValuePairs
      for (const keyValue of keyValuePairs) {
        const rowIdx = this.findRowForKey(csvData, keyValue.key, csvHeaders.keyIdx);
        // Check if rowIdx has been found
        if (rowIdx) {
          // Update the row data
          this.updateDataRow(csvData, rowIdx, csvHeaders, keyValue, localeName, resourceName, timestamp);
        } else {
          // Key wasn't found, adding a new data row
          this.addDataRow(csvData, csvHeaders, keyValue, localeName, resourceName, timestamp);
        }
      }
    }
  }

  public static isCsv(filePath: string) {
    return path.extname(filePath).toLocaleLowerCase() === '.csv';
  }

  /**
   * Write the CSV data to the file
   * 
   * @param fileLocation 
   * @param csvData 
   * @param delimiter 
   * @param useBom
   */
  public static async writeToCsvFile(fileLocation: string, csvData: ICsvData, delimiter: string, bom: boolean) {
    const filePath = ProjectFileHelper.getAbsPath(fileLocation);
    if (await csvData.write(filePath, { delimiter, bom })) {
      Logging.info(`Exported the locale data to the CSV/XLSX file.`);
    } else {
      Logging.error(`Something went wrong while writing to the CSV/XLSX file.`);
    }
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
  private static updateDataRow(csvData: ICsvData, rowIndex: number, csvHeaders: LocaleCsvInfo, keyValue: LocaleKeyValue, localeName: string, resourceName: string, timestamp: string) {
    let rowModified = false;

    for (const locale of csvHeaders.localeIdx) {
      if (locale.key === localeName) {
        const existingValue = csvData.getValue(rowIndex, locale.idx);
        if (!existingValue) {
          csvData.setValue(rowIndex, locale.idx, keyValue.value);
          rowModified = true;
        } else {
          if (existingValue !== keyValue.value) {
            Logging.warning(`Ignoring overwritten ${keyValue.key} in ${localeName} '${keyValue.value}'. Keeping '${existingValue}'.`);
          }
        }
        // rowModified = true;
      }
    }

    for (const resx of csvHeaders.resxNames) {
      if (resourceName === resx.key && !csvData.getValue(rowIndex, resx.idx)) {
        csvData.setValue(rowIndex, resx.idx, "x"); // Specify that the key is used in the specified resource
        rowModified = true;
      }
    }

    if (timestamp && csvHeaders.timestampIdx !== null && rowModified) {
      csvData.setValue(rowIndex, csvHeaders.timestampIdx, timestamp);
    }
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
  private static addDataRow(csvData: ICsvData, csvHeaders: LocaleCsvInfo, keyValue: LocaleKeyValue, localeName: string, resourceName: string, timestamp: string) {
    if (csvHeaders.keyIdx >= 0) {

      // Add the new row
      const insertRow = this.findInsertRowForKey(csvData, keyValue.key, csvHeaders.keyIdx);
      csvData.addRow(insertRow);

      csvData.setValue(insertRow, csvHeaders.keyIdx, keyValue.key);

      for (const locale of csvHeaders.localeIdx) {
        if (locale.key === localeName) {
          csvData.setValue(insertRow, locale.idx, keyValue.value); // Add the locale key to the CSV data
        }
      }

      for (const resx of csvHeaders.resxNames) {
        if (resourceName === resx.key) {
          csvData.setValue(insertRow, resx.idx, "x"); // Specify that the key is used in the specified resource
        }
      }

      if (timestamp && csvHeaders.timestampIdx !== null) {
        csvData.setValue(insertRow, csvHeaders.timestampIdx, timestamp);
      }
    }
  }

  /**
   * Search for the corresponding key / row
   * 
   * @param csvData 
   * @param localeKey 
   */
  private static findRowForKey(csvData: ICsvData, localeKey: string, cellIdx: number): number | null {
    for (let row = 0; row < csvData.rowCount; row++) {
      if (row && csvData.getValue(row, cellIdx) === localeKey) {
        return row;
      }
    }
    return null;
  }

  /**
   * Search for proper new row insert position (compare lines by keys, stop at the first which follows the key)
   * 
   * @param csvData 
   * @param localeKey 
   */
  private static findInsertRowForKey(csvData: ICsvData, localeKey: string, cellIdx: number): number {
    let result = 1;
    for (let row = 1; row < csvData.rowCount; row++) {
      const rowKey = row && csvData.getValue(row, cellIdx);
      if (rowKey && rowKey.toLowerCase() < localeKey.toLowerCase()) {
        result = row + 1;
      }
    }
    return result;
  }

  /**
   * Process all the locale data from the CSV file
   * 
   * @param csvData 
   * @param csvHeaders 
   */
  private static processCsvData(csvData: ICsvData, csvHeaders: LocaleCsvInfo): LocaleCsvData | null {
    if (csvHeaders.keyIdx >= 0) {
      const localeData: LocaleCsvData = {};
      // Create all the required locale data
      for (const locale of csvHeaders.localeIdx) {
        localeData[locale.key] = [];
      }
      // Start looping over all the rows (filtering out the first row)
      for (let row = 1; row < csvData.rowCount; ++row) {
        // Loop over all the locales in the csv file
        for (const locale of csvHeaders.localeIdx) {
          // Loop over the available resources
          for (const resx of csvHeaders.resxNames) {
            const resxValue = csvData.getValue(row, resx.idx) || null;
            // Check if the label is for the current resource
            if (resxValue && resxValue.toLowerCase() === "x") {
              localeData[locale.key].push({
                key: csvData.getValue(row, csvHeaders.keyIdx) || null,
                label: csvData.getValue(row, locale.idx) || null,
                comment: csvHeaders.commentIdx !== null ? csvData.getValue(row, csvHeaders.commentIdx) : null,
                timestamp: csvHeaders.timestampIdx !== null ? csvData.getValue(row, csvHeaders.timestampIdx) : null,
                resx: resx.key || null
              });
            }
          }
        }
      }

      return localeData;
    } else {
      Logging.error(`The required ${KEY_HEADER} header was not found in the CSV file.`);
      return null;
    }
  }

  private static getLocaleName(cell: string): string | null {
    const trimmed = cell.toLowerCase().trim();
    if (trimmed.startsWith(LOCALE_HEADER.toLowerCase())) {
      return trimmed.replace(LOCALE_HEADER.toLowerCase(), "").trim();
    } else {
      const match = cell && /^[a-z]{2}-[a-z]{2}$/.exec(trimmed);
      return match && match[0];
    }
  }

  /**
   * Get the headers of the CSV file
   * 
   * @param csvData 
   */
  private static getHeaders(csvData: ICsvData): LocaleCsvInfo | null {
    if (csvData && csvData.rowCount > 0) {
      const headerInfo: LocaleCsvInfo = {
        keyIdx: -1,
        localeIdx: [],
        commentIdx: null,
        timestampIdx: null,
        resxNames: []
      };
      for (let i = 0; i <= csvData.colCount; i++) {
        // Get the cell
        const cell = csvData.getValue(0, i);
        if (cell) {
          // Add the key index to the object
          if (cell.toLowerCase() === KEY_HEADER.toLocaleLowerCase()) {
            headerInfo.keyIdx = i;
          } else if (cell.toLowerCase() === COMMENT_HEADER.toLowerCase()) {
            headerInfo.commentIdx = i;
          } else if (cell.toLowerCase() === TIMESTAMP_HEADER.toLowerCase()) {
            headerInfo.timestampIdx = i;
          } else if (CsvHelper.getLocaleName(cell)) {
            headerInfo.localeIdx.push({
              key: CsvHelper.getLocaleName(cell)!,
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
    return null;
  }

}