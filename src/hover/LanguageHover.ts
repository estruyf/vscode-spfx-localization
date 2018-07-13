import * as vscode from 'vscode';
import ProjectFileHelper from '../helpers/ProjectFileHelper';
import ResourceHelper from '../helpers/ResourceHelper';

export default class LanguageHover {

  public static async onHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
    // Retrieve the word the user is currently hovering
    const wordRange = await document.getWordRangeAtPosition(position);
    const word = document.getText(wordRange);
    // Check if a word has been found
    if (word) {
      // Get the project config file
      const config = await ProjectFileHelper.getConfig();
      if (config) {
        // Get only the project resources
        const resx = ResourceHelper.excludeResourcePaths(config);
        if (resx && resx.length > 0) {
          const hoverValues = [];
          // Loop over the resource files
          for (const resource of resx) {
            let crntResxAdded = false;
            // Get the path
            let resourcePath = resource.value.substring(0, resource.value.lastIndexOf('/'));
            // Use the src directory
            if (resourcePath.startsWith("lib/")) {
              resourcePath = resourcePath.replace("lib/", "src/");
            }
            // Get all files from the localization folder
            const jsFiles = await vscode.workspace.findFiles(`${resourcePath}/*.js`);
            // Loop over the files to see the 
            for (const jsFile of jsFiles) {
              if (jsFile) {
                const fileData = await vscode.workspace.openTextDocument(jsFile);
                const fileContents = fileData.getText();
                const localeName = fileData.fileName.substring((fileData.fileName.lastIndexOf("/") + 1), fileData.fileName.lastIndexOf(".js"));
                // Process the file with the hovered word
                const value = ResourceHelper.getResourceValue(fileContents, word);
                if (value) {
                  if (!crntResxAdded) {
                    // Add extra line break if it is not the first line
                    if (hoverValues.length !== 0) {
                      hoverValues.push(`\n`);
                    }
                    hoverValues.push(`**${resource.key}**\n`);
                    crntResxAdded = true;
                  }
                  hoverValues.push(`- **${localeName}**: "${value}"`);
                }
              }
            }
          }

          // Check if something needs to be added for the hover panel
          if (hoverValues && hoverValues.length > 0) {
            return new vscode.Hover(hoverValues.join("\n"));
          }
        }
      }
    }
  }
}