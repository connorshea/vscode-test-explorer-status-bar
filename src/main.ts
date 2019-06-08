import * as vscode from 'vscode';
import { TestHub, testExplorerExtensionId } from 'vscode-test-adapter-api';
import { TestExplorerStatusBarController } from './controller';

let testHub: TestHub | undefined;
let controller: TestExplorerStatusBarController | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Get the Test Explorer extension
  const testExplorerExtension = vscode.extensions.getExtension<TestHub>(testExplorerExtensionId);

  if (testExplorerExtension) {
    testHub = testExplorerExtension.exports;
    controller = new TestExplorerStatusBarController();
    testHub.registerTestController(controller);
  }
}

export function deactivate(): void {
  if (testHub && controller) {
    testHub.unregisterTestController(controller);
  }
}
