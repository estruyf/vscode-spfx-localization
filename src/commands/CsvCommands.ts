import * as vscode from 'vscode';
import * as parse from 'csv-parse';
import Logging from './Logging';
import ProjectFileHelper from '../helpers/ProjectFileHelper';
import { Config, LocalizedResourceValue } from '../models/Config';
import ResourceHelper from '../helpers/ResourceHelper';
import CsvHelper from '../helpers/CsvHelper';
import ExportLocaleHelper from '../helpers/ExportLocaleHelper';
import { CONFIG_KEY, CONFIG_CSV_DELIMITER, CONFIG_CSV_FILELOCATION, OPTION_IMPORT_ALL } from '../helpers/ExtensionSettings';

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
    // Retrieve the delimiter
    let delimiter: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_CSV_DELIMITER);
    if (!delimiter) {
      delimiter = ";";
      Logging.warning(`The delimiter setting was empty, ";" will be used instead.`);
    }
    // Get the contents of the CSV file
    const csvContents = await this.getCsvFile();
    if (csvContents) {
      parse(csvContents, { delimiter }, this.initializeImport);
    } else {
      // Already returned an error
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
      // Use the provided resource or ask which resource file to use
      const resources = resxToUse ? [resxToUse] : await this.getResourceToUse();
      if (resources && resources.length > 0) {
        for (const resource of resources) {
          if (resource) {
            // Get all the localized resource files
            const resourcePath = ProjectFileHelper.getResourcePath(resource);
            const jsFiles = await vscode.workspace.findFiles(`${resourcePath}/*.js`);
            if (!jsFiles || jsFiles.length === 0) {
              Logging.error(`No locale files were found for the selected resource: ${resource.key}.`);
            }

            let delimiter: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_CSV_DELIMITER);
            if (!delimiter) {
              delimiter = ";";
              Logging.warning(`The delimiter setting was empty, ";" will be used instead.`);
            }

            // Retrieve the settings for the extension
            const csvFileLocation: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_CSV_FILELOCATION);
            if (!csvFileLocation) {
              Logging.error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
              throw new Error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
            }

            // Get the CSV file or create one
            let csvData = await this.getCsvFile(true);
            if (!csvData) {
              csvData = CsvHelper.createCsvFile(jsFiles, resource, csvFileLocation, delimiter);
            }

            // Start the export
            parse(csvData, { delimiter }, (err: any | Error, csvData: string[][]) => ExportLocaleHelper.startExport(err, csvData, jsFiles, csvFileLocation, delimiter as string, resource.key));
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
  private static initializeImport = async (err: any | Error, csvData: string[][]): Promise<void> => {
    // Check if the file contained content
    if (csvData && csvData.length > 0) {
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
            CsvHelper.startCsvImporting(csvData, defaultResx, resx);
          }
        }
      } else {
        Logging.error(`SPFx project config file could not be retrieved`);
      }
    } else {
      Logging.warning(`The CSV file is empty.`);
    }
  }

  /**
   * Get the CSV file
   * 
   * @param needsToExists Specify if the file needs to exist
   */
  private static async getCsvFile(needsToExists: boolean = false): Promise<string | null> {
    // Retrieve the CSV file config value
    const csvFileLocation: string | undefined = vscode.workspace.getConfiguration(CONFIG_KEY).get(CONFIG_CSV_FILELOCATION);
    if (!csvFileLocation) {
      Logging.error(`The "spfxLocalization.csvFileLocation" configuration setting is not provided.`);
      return null;
    }

    // Get the absolute path for the file
    const filePath = ProjectFileHelper.getAbsPath(csvFileLocation);

    try {
      // Open the file
      const fileData = await vscode.workspace.openTextDocument(filePath);
      if (!fileData) {
        Logging.error(`The CSV file could not be retrieved. Used file location: "${filePath}".`);
        return null;
      }

      // Return the file content
      return fileData ? fileData.getText() : null;
    } catch (e) {
      if (!needsToExists) {
        // Logging.error(`Sorry, something failed while retrieving the CSV file.`);
        Logging.error(`The CSV file could not be retrieved. Used file location: "${csvFileLocation}".`);
      }
      return null;
    }
  }
}