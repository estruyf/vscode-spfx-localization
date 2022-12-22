import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {

    // Download VS Code, unzip it and run the integration test
		await runTests({ 
      extensionDevelopmentPath: path.resolve(__dirname, '../../'), 
      extensionTestsPath: path.resolve(__dirname, './index')
    });
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exit(1);
	}
}

main();
