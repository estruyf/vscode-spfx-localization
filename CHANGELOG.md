# Change Log

## [0.0.3] - 2018-06-06

**Enhancements**

- Remove single and double quotes if string starts and ends with it
- Added the option which allows you to place the new key inside curly brackets `{}`
- Checks if key was already defined

**Fixes**

- Fixes spaces on beginning of the next line where key was added

## [0.0.2] - 2018-06-06

**Fixes**

- Changed `fs.readDirSync` to use the `vscode` api
- Fixed an issue where only the `lib` files were modified instead of the `src` files
- Added a check to see if the `strings` import is already present in the current file

## [0.0.1] - 2018-06-06
- Initial BETA release