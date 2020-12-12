import * as vscode from "vscode";
import * as fs from "fs";
import * as stringify from "csv-stringify";
import { LocalizedResourceValue } from "../models/Config";
import { LocaleCsvInfo, LocaleCsvData } from "../models/LocaleCsvInfo";
import Logging from "../commands/Logging";
import ImportLocaleHelper from "./ImportLocaleHelper";
import { LocaleKeyValue } from "../models/LocaleKeyValue";
import ProjectFileHelper from "./ProjectFileHelper";
import { OPTION_IMPORT_ALL, UTF8_BOM } from "./ExtensionSettings";

const LOCALE_HEADER = "Locale";

export default class CsvHelper {

  /**
   * Start processing the CSV data
   * 
   * @param csvData 
   * @param impLocale 
   * @param resx 
   */
  public static async startCsvImporting(csvData: string[][], impLocale: string, resx: LocalizedResourceValue[]) {
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
  public static createCsvFile(localeFiles: vscode.Uri[], resource: LocalizedResourceValue, csvFileLocation: string, delimiter: string, fileExtension: string
    , useBom: boolean, useComment: boolean): string {
    const locales = localeFiles.map(f => {
      const filePath = f.path.substring(f.path.lastIndexOf("/") + 1);
      return `${LOCALE_HEADER} ${filePath.replace(`.${fileExtension}`, "")}`;
    });
    // Create the headers for the CSV file
    const headers = ["key", ...locales, resource.key];

    // add comment column if feature is enabled
    if (useComment)
      headers.push("comment");

    const filePath = ProjectFileHelper.getAbsPath(csvFileLocation);
    const bom = useBom ? UTF8_BOM : '';
    fs.writeFileSync(filePath, bom + headers.join(delimiter));
    return headers.join(delimiter);
  }

  // use current timestamp as default comment for the new strings
  private static makeDefaultComment = () => new Date().toISOString().split('.')[0];

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
  public static updateData(csvData: string[][], keyValuePairs: LocaleKeyValue[], localeName: string, resourceName: string, 
    useComment?: boolean, useCommentTimestamp?: boolean): string[][] {

    const csvHeaders = this.getHeaders(csvData);

    // add comment column if feature is enabled
    if (useComment && csvHeaders && csvHeaders.commentIdx === null) {
      for (let rowIdx = 0; rowIdx < csvData.length; ++rowIdx) {
        if (rowIdx === 0) {
          csvData[rowIdx].push('comment');
          csvHeaders.commentIdx = csvData[rowIdx].length - 1;
        } else {
          csvData[rowIdx].push('');
        }
      }
    }

    const comment = useComment && useCommentTimestamp ? this.makeDefaultComment() : '';
    
    if (csvHeaders && csvHeaders.keyIdx !== null) {
      // Start looping over the keyValuePairs
      for (const keyValue of keyValuePairs) {
        const rowIdx = this.findRowForKey(csvData, keyValue.key, csvHeaders.keyIdx);
        // Check if rowIdx has been found
        if (rowIdx) {
          // Update the row data
          csvData = this.updateDataRow(csvData, rowIdx, csvHeaders, keyValue, localeName, resourceName, comment);
        } else {
          // Key wasn't found, adding a new data row
          csvData = this.addDataRow(csvData, csvHeaders, keyValue, localeName, resourceName, comment);
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
   * @param useBom
   */
  public static writeToCsvFile(fileLocation: string, fileData: string[][], delimiter: string, useBom: boolean) {
    stringify(fileData, { delimiter }, (err: any | Error, output: any) => {
      if (output) {
        const filePath = ProjectFileHelper.getAbsPath(fileLocation);
        const bom = useBom ? UTF8_BOM : '';
        fs.writeFileSync(filePath, bom + output, { encoding: "utf8" });
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
  private static updateDataRow(csvData: string[][], rowIndex: number, csvHeaders: LocaleCsvInfo, keyValue: LocaleKeyValue, localeName: string, resourceName: string
    , comment: string): string[][] {
    // Get the row
    let rowData = csvData[rowIndex];
    if (rowData) {
      let rowModified = false;

      for (const locale of csvHeaders.localeIdx) {
        if (locale.key === localeName && rowData[locale.idx] === "") {
          rowData[locale.idx] = keyValue.value;
          rowModified = true;
        }
      }

      for (const resx of csvHeaders.resxNames) {
        if (resourceName === resx.key && rowData[resx.idx] === "") {
          rowData[resx.idx] = "x"; // Specify that the key is used in the specified resource
          rowModified = true;
        }
      }
      if (comment && csvHeaders.commentIdx !== null && rowModified) {
        rowData[csvHeaders.commentIdx] = comment;
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
  private static addDataRow(csvData: string[][], csvHeaders: LocaleCsvInfo, keyValue: LocaleKeyValue, localeName: string, resourceName: string
    , comment: string): string[][] {
    let rowData = [];
    if (csvHeaders.keyIdx !== null) {

      rowData[csvHeaders.keyIdx] = keyValue.key;

      for (const locale of csvHeaders.localeIdx) {
        rowData[locale.idx] = keyValue.value; // Add the locale key to the CSV data
      }

      for (const resx of csvHeaders.resxNames) {
        if (resourceName === resx.key) {
          rowData[resx.idx] = "x"; // Specify that the key is used in the specified resource
        }
      }
      if (comment && csvHeaders.commentIdx !== null)
        rowData[csvHeaders.commentIdx] = comment;

      // Add the new row
      const insertRow = this.findInsertRowForKey(csvData, keyValue.key, csvHeaders.keyIdx!)
      csvData.splice(insertRow, 0, rowData);
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
   * Search for proper new row insert position (compare lines by keys, stop at the first which follows the key)
   * 
   * @param csvData 
   * @param localeKey 
   */
  private static findInsertRowForKey(csvData: string[][], localeKey: string, cellIdx: number): number {
    let result = 1;
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      const rowKey = row && row[cellIdx];
      if (rowKey && rowKey.toLowerCase() < localeKey.toLowerCase()) {
        result = i + 1;
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
                  comment: csvHeaders.commentIdx !== null ? row[csvHeaders.commentIdx] : null,
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
  private static getHeaders(csvData: string[][]): LocaleCsvInfo | null {
    if (csvData && csvData.length > 0) {
      const firstRow = csvData[0];
      if (firstRow) {
        const headerInfo: LocaleCsvInfo = {
          keyIdx: null,
          commentIdx: null,
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
            } else if (cell.toLowerCase() === "comment") {
              headerInfo.commentIdx = i;
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

}