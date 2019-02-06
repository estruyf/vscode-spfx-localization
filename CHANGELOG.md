# Change Log

## [1.2.2] - 2019-02-06

**Fixes**

- Fixed an issue where the localization label with double quotes usage was incorrectly created

## [1.2.1] - 2018-09-25

**Fixes**

- Performance improvements by temporarily disabling the hover provider

## [1.2.0] - 2018-08-22

**Enhancements**

- Added the ability to export localization labels to a CSV file
- Added the ability to import localization labels from a CSV file
- Context actions should only be shown in SPFx projects

## [1.1.0] - 2018-07-31

**Enhancements**

- Added the localization actions to the editor context menu

## [1.0.0] - 2018-07-13

**Enhancements**

- Added hover provider to show the resource values of the hovered string

## [0.0.5] - 2018-06-14

**Enhancements**

- Removed information messages when localization keys were added

## [0.0.4] - 2018-06-08

**Enhancements**

- Added a new command to let you create a localized key without selecting text
- Code optimizations

## [0.0.3] - 2018-06-07

**Enhancements**

- Remove single and double quotes if string starts and ends with it
- Added the option which allows you to place the new key inside curly brackets `{}`
- Checks if key was already defined

**Fixes**

- Fixes spaces on beginning of the next line where key was added

## [0.0.2] - 2018-06-07

**Fixes**

- Changed `fs.readDirSync` to use the `vscode` api
- Fixed an issue where only the `lib` files were modified instead of the `src` files
- Added a check to see if the `strings` import is already present in the current file

## [0.0.1] - 2018-06-06
- Initial BETA release