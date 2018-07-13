import { Config } from './../commands/Config';
import TextHelper from './TextHelper';

export default class ResourceHelper {

  /**
   * Exclude all the none related project resource paths
   * 
   * @param configInfo 
   */
  public static excludeResourcePaths(configInfo: Config) {
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
}