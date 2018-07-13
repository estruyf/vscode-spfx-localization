
export default class TextHelper {
  
  /**
   * Strip quotes at the beginning and end of the string
   * 
   * @param value 
   */
  public static stripQuotes(value: string): string {
    if ((value.startsWith(`'`) && value.endsWith(`'`)) || 
        (value.startsWith(`"`) && value.endsWith(`"`)) || 
        (value.startsWith("`") && value.endsWith("`"))) {
      return value.substring(1, value.length - 1);
    }

    return value;
  }
}