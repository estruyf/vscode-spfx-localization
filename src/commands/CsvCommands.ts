import * as vscode from 'vscode';
import { ICsvData } from '../helpers/CsvData';
import Logging from './Logging';
import ProjectFileHelper from '../helpers/ProjectFileHelper';
import { Config, LocalizedResourceValue } from '../models/Config';
import ResourceHelper from '../helpers/ResourceHelper';
import CsvHelper from '../helpers/CsvHelper';
import ExportLocaleHelper from '../helpers/ExportLocaleHelper';
import {
  CONFIG_KEY,
  CONFIG_CSV_DELIMITER,
  CONFIG_CSV_FILELOCATION,
  OPTION_IMPORT_ALL,
  CONFIG_FILE_EXTENSION,
  CONFIG_CSV_USE_BOM,
  CONFIG_CSV_USE_COMMENT,
  CONFIG_CSV_USE_TIMESTAMP
} from '../helpers/ExtensionSettings';

export default class CsvCommands {

  /**
   * Import locale labels and keys from a CSV file
   * 
   * Logic
   * 1. get the CSV file ✅
   * 2. get the headers from the CSV file (key, locale, localizedResource) ✅
   * 3. ask which localized resource to use (if multiple are configured) ✅
   * 4. ask if the localized resource files can be overwritten - atm files will be created from the CSV file
   * 5. start (creating and) writing to the files ✅
   */
  public static async import() {

    const config = vscode.workspace.getConfiguration(CONFIG_KEY);

    // Retrieve the delimiter
    let delimiter: string | undefined = config.get(CONFIG_CSV_DELIMITER);
    if (!delimiter) {
      delimiter = ";";
      Logging.warning(`The delimiter setting was empty, ";" will be used instead.`);
    }

    const useBom = !!config.get(CONFIG_CSV_USE_BOM);

    const filePath = this.getCsvFilePath();

    if (filePath) {
      const csvData = await CsvHelper.openFile(filePath, delimiter, useBom);
      if (csvData) {
        this.initializeImport(csvData);
      } else {
        Logging.error(`The CSV/XLSX file could not be retrieved. Used file location: "${filePath}".`);
        return null;
      }
    }
  }

  /**
   * Export locale labels and keys to a CSV file
   * 
   * Logic
   * 1. select the localized resource to output (if multiple) ✅
   * 2. get the localized resource files ✅
   * 3. fetch the csv file or create it if it doesn't exist ✅
   * 4. get all the headers or create them if they do not exist ✅
   * 5. add the keys and values ✅
   * 6. ask to override the data in the CSV file - atm the CSV becomes the master of the data
   */
  public static async export(resxToUse: LocalizedResourceValue | null = null) {
    try {
      const config = vscode.workspace.getConfiguration(CONFIG_KEY);
      // Use the provided resource or ask which resource file to use
      const resources = resxToUse ? [resxToUse] : await this.getResourceToUse();
      if (resources && resources.length > 0) {
        for (const resource of resources) {
          if (resource) {
            let fileExtension: string | undefined = config.get(CONFIG_FILE_EXTENSION);
            if (!fileExtension) {
              fileExtension = "js";
            }

            // Get all the localized resource files
            const resourcePath = ProjectFileHelper.getResourcePath(resource);
            let localeFiles = await vscode.workspace.findFiles(`${resourcePath}/*.${fileExtension}`);
            if (!localeFiles || localeFiles.length === 0) {
              Logging.error(`No locale files were found for the selected resource: ${resource.key}.`);
            }

            // Exclude the mystrings file
            if (fileExtension === "ts") {
              localeFiles = localeFiles.filter(f => !f.path.includes("mystrings.d.ts"));
            }

            let delimiter: string | undefined = config.get(CONFIG_CSV_DELIMITER);
            if (!delimiter) {
              delimiter = ";";
              Logging.warning(`The delimiter setting was empty, ";" will be used instead.`);
            }

            // Retrieve the settings for the extension
            const csvFileLocation: string | undefined = config.get(CONFIG_CSV_FILELOCATION);
            if (!csvFileLocation) {
              Logging.error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
              throw new Error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
            }

            const useBom = !!config.get(CONFIG_CSV_USE_BOM);
            const useComment = !!config.get(CONFIG_CSV_USE_COMMENT);
            const useTimestamp = !!config.get(CONFIG_CSV_USE_TIMESTAMP);

            // Get the CSV file or create one
            const filePath = await this.getCsvFilePath();
            
            if (filePath) {
              // Start the export
              try {
                let csvData = await CsvHelper.openFile(filePath, delimiter, useBom);
                if (!csvData) {
                  csvData = await CsvHelper.createCsvData(localeFiles, resource, csvFileLocation, fileExtension, useComment, useTimestamp);
                }
                ExportLocaleHelper.startExport(csvData, localeFiles, csvFileLocation, delimiter as string, resource.key, useBom, useComment, useTimestamp);
              } catch (err) {
                Logging.error(`Unable to read the file ${filePath}. ${err}`);
              }
            }
          }
        }
      }
    } catch (e) {
      // Nothing to do here
    }
  }

  /**
   * Ask for which component you want to export the localization
   */
  private static async getResourceToUse(): Promise<LocalizedResourceValue[] | null> {
    const configInfo: Config | null = await ProjectFileHelper.getConfig();
    if (configInfo && configInfo.localizedResources) {
      // Retrieve all the project related localized resources
      const resx = ResourceHelper.excludeResourcePaths(configInfo);
      if (resx && resx.length > 0) {
        // Take the default one to import
        let defaultResx: string | undefined = resx[0].key;
        if (resx.length > 1) {
          // Add an option to import all
          let opts = resx.map(r => r.key);
          opts.push(OPTION_IMPORT_ALL);
          defaultResx = await vscode.window.showQuickPick(opts, {
            placeHolder: "Specify for which resource file you want to perform the input.",
            canPickMany: false
          });
        }

        // Check if an option was provided
        if (defaultResx) {
          if (defaultResx === OPTION_IMPORT_ALL) {
            // Return all resources
            return resx;
          } else {
            // Return only the one you choose
            return resx.filter(r => r.key === defaultResx);
          }
        }
      }
    }
    return null;
  }

  /**
   * Initialize the CSV data import
   * 
   * @param err Parsing error
   * @param csvData Retrieved CSV data from the file
   */
  private static async initializeImport (csvData: ICsvData): Promise<void> {
    // Check if the file contained content
    if (csvData && csvData.rowCount > 0) {
      // Retrieve the config data
      const configInfo: Config | null = await ProjectFileHelper.getConfig();
      if (configInfo && configInfo.localizedResources) {
        // Retrieve all the project related localized resources
        const resx = ResourceHelper.excludeResourcePaths(configInfo);
        if (resx && resx.length > 0) {
          // Take the default one to import
          let defaultResx: string | undefined = resx[0].key;
          if (resx.length > 1) {
            // Add an option to import all
            let opts = resx.map(r => r.key);
            opts.push(OPTION_IMPORT_ALL);
            defaultResx = await vscode.window.showQuickPick(opts, {
              placeHolder: "Specify for which resource file you want to perform the input.",
              canPickMany: false
            });
          }

          // Check if an option was provided
          if (defaultResx) {
            // Start the CSV data
            await CsvHelper.startCsvImporting(csvData, defaultResx, resx);
          }
        }
      } else {
        Logging.error(`SPFx project config file could not be retrieved`);
      }
    } else {
      Logging.warning(`The CSV/XLSX file is empty.`);
    }
  }

  /**
   * Get the CSV file
   * 
   * @param needsToExists Specify if the file needs to exist
   */
  private static getCsvFilePath(): string | null {
    // Retrieve the CSV file config value
    const csvFileLocation: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_CSV_FILELOCATION);
    if (!csvFileLocation) {
      Logging.error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
      return null;
    }

    // Get the absolute path for the file
    return ProjectFileHelper.getAbsPath(csvFileLocation);
  }
}