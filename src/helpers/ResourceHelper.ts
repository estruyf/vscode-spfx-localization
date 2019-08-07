import { Config, LocalizedResourceValue } from '../models/Config';
import TextHelper from './TextHelper';
import { LocaleKeyValue } from '../models/LocaleKeyValue';

export default class ResourceHelper {

  /**
   * Exclude all the none related project resource paths
   * 
   * @param configInfo 
   */
  public static excludeResourcePaths(configInfo: Config): LocalizedResourceValue[] {
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
   * Search the word/key in the resource file
   * 
   * @param contents 
   * @param key 
   */
  public static getResourceValue(contents: string, key: string): string | null {
    // Select the return object
    if (contents.includes(key)) {
      const regEx = new RegExp(`\\b${key}\\b`);
      const keyIdx = contents.search(regEx);
      if (keyIdx !== -1) {
        const colonIdx = contents.indexOf(":", keyIdx);
        const commaIdx = contents.indexOf(",", keyIdx);

        if (colonIdx !== -1 && commaIdx !== -1) {
          let value = contents.substring((colonIdx + 1), commaIdx);
          value = value.trim();
          value = TextHelper.stripQuotes(value);
          return value;
        }
      }
    }
    return null;
  }

  /**
   * Retrieve the key value pairs from the locale file contents
   * 
   * @param fileContents 
   */
  public static getKeyValuePairs(fileContents: string): LocaleKeyValue[] {
    let localeKeyValue: LocaleKeyValue[] = [];
    // Check if file contents were passed
    if (fileContents) {
      // Find the position of the return statement
      const fileLines = fileContents.split("\n");
      const returnIdx = fileLines.findIndex(line => {
        const matches = line.trim().match(/(^return|{$)/gi);
        return matches !== null && matches.length >= 2;
      });

      // Check if the index has been found
      if (returnIdx !== -1) {
        // Loop over all the lines
        let x = 0;
        for (const line of fileLines) {
          if (x > returnIdx) {
            const lineVal = line.trim();
            // Get the colon location
            const colonIdx = lineVal.indexOf(":");
            if (colonIdx !== -1) {
              const keyName = lineVal.substring(0, colonIdx);
              let keyValue = lineVal.substring((colonIdx + 1));
              keyValue = keyValue.trim();
              keyValue = TextHelper.stripQuotes(keyValue);

              // Add the key and value to the array
              if (keyName && keyValue) {
                localeKeyValue.push({
                  key: TextHelper.stripQuotes(keyName),
                  value: keyValue
                });
              }
            }
          } 
          x++;
        }
      }
    }

    return localeKeyValue;
  }
}