# SharePoint Framework Localization Resources Extension

This extension for Visual Studio Code makes it easier to work with resources in SharePoint Framework projects. It allows you to add new resource keys to the localization files, import the localization file dependency and quickly check a localization value by hovering over the name.

**Importing**

![Importing](./assets/import-localization.gif)

**Creating new resource keys**

![Creating new resource keys](./assets/create-localization.gif)

**What with multiple localized resources?**

When multiple localization resources are available (retrieved from the `config.json` file), it will propose you which one to import or add your keys.

![Localized resource options](./assets/resource-options.png)

Here is a sample of my `config.json` file:

![config.json](./assets/config-file.png)

**Quickly check the resource value**

By hovering over the resource value used in your TypeScript or React code, a hover panel appears to show you the known values:

![Hover panel](./assets/resource-hover.gif)

## Usage

**Import resource module to the current file**

- Start by opening the command prompt:
  - Windows `⇧+ctrl+P`
  - Mac: `⇧+⌘+P`
- Type: `SPFx import localization strings module` and press `enter`
- Select the localized resource to import (if multiple are available, otherwise it will take the first one)

**Create a new localized key**

- Start by selecting some text in your code
- Open the command prompt:
  - Windows `⇧+ctrl+P`
  - Mac: `⇧+⌘+P`
- Type: `SPFx create localization key` and press `enter`
- Provide the name of the key to create
- Select the localized resource to import (if multiple are available, otherwise it will take the first one)

**Editor context menu**

All the actions are also available from the editor its context menu.

![Editor context menu actions](./assets/editor-context-menu-actions.png)

When you select text, the `add and insert` action becomes available:

![Editor context menu add and insert](./assets/editor-context-menu-add.png)

## Feedback and snippet ideas

Feedback and ideas are always welcome. Please submit them via creating an issue in the project repository: [issue list](https://github.com/estruyf/vscode-spfx-localization/issues).