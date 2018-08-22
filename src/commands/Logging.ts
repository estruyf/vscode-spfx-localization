import * as vscode from 'vscode';

const EXTENSION_NAME = "SPFx Localization";

export default class Logging {

  /**
   * Show an information message
   * 
   * @param msg 
   */
  public static info(msg: string): void {
    vscode.window.showInformationMessage(`${EXTENSION_NAME}: ${msg}`);
  }

  /**
   * Show an error message
   * 
   * @param msg 
   */
  public static error(msg: string): void {
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: ${msg}`);
  }

  /**
   * Show an error message
   * 
   * @param msg 
   */
  public static warning(msg: string): void {
    vscode.window.showWarningMessage(`${EXTENSION_NAME}: ${msg}`);
  }
}