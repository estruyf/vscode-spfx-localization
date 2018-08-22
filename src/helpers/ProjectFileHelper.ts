import * as vscode from 'vscode';
import * as path from 'path';
import { Config, LocalizedResourceValue } from '../models/Config';

export default class ProjectFileHelper {
    
  /**
   * Fetch the project config file
   */
  public static async getConfig(errorLog?: (msg: string) => void): Promise<Config | null> {
    // Start the search for the loc folder in the project
    const configFileUrls = await vscode.workspace.findFiles('**/config/config.json', "**/node_modules/**", 1);
    if (!configFileUrls || configFileUrls.length === 0) {
      if (errorLog) {
        errorLog(`Solution config file could not be retrieved.`);
      }
      return null;
    }

    // Take the first config file
    const configFileUrl = configFileUrls[0];
    if (configFileUrl) {
      // Fetch the the config file contents
      const configFile = await vscode.workspace.openTextDocument(configFileUrl);
      if (!configFile) {
        if (errorLog) {
          errorLog(`Could not read the config file.`);
        }
        return null;
      }

      // Get the file contents
      const contents = configFile.getText();
      if (!contents) {
        if (errorLog) {
          errorLog(`Could not retrieve the file contents.`);
        }
        return null;
      }

      // Fetch the config information and check if localizedResources were defined
      const configInfo: Config = JSON.parse(contents);
      return configInfo;
    }

    return null;
  }


  /**
   * Retrieve the resource path for the file
   * 
   * @param resx 
   */
  public static getResourcePath(resx: LocalizedResourceValue): string {
    // Create the key in the localized resource file
    let resourcePath = resx.value.substring(0, resx.value.lastIndexOf('/'));
    // Check if the path starts with 'lib/', if this is the case, it needs to be changed to 'src/'
    if (resourcePath.startsWith("lib/")) {
      resourcePath = resourcePath.replace("lib/", "src/");
    }
    return resourcePath;
  }

  /**
   * Get the absolute path for the file
   * 
   * @param fileLocation 
   */
  public static getAbsPath(fileLocation: string): any {
    // Create the file path
    const rootPath = vscode.workspace.rootPath || __dirname;
    return path.join(rootPath, fileLocation);
  }
}