import * as vscode from 'vscode';
import { TestController, TestAdapter, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';

/**
 * This class is intended as a starting point for implementing a "real" TestController.
 * The file `README.md` contains further instructions.
 */
export class StatusBarController implements TestController {

  // here we collect subscriptions and other disposables that need
  // to be disposed when an adapter is unregistered
  private readonly disposables = new Map<TestAdapter, { dispose(): void }[]>();

  private statusBarItem: vscode.StatusBarItem;
  private passedTests = 0;
  private failedTests = 0;
  private testCount = 0;
  private testSuite: TestSuiteInfo | undefined = undefined;
  private testList: Array<TestInfo> | undefined = undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);
    this.statusBarItem.show();

    // Run all tests when the statusBarItem is clicked,
    // We do this by invoking a command that is contributed by the Test Explorer extension
    this.statusBarItem.command = 'test-explorer.run-all';
  }

  registerTestAdapter(adapter: TestAdapter): void {
    const adapterDisposables: { dispose(): void }[] = [];
    this.disposables.set(adapter, adapterDisposables);

    adapterDisposables.push(adapter.tests(testLoadEvent => {
      if (testLoadEvent.type === 'started') {
        this.statusBarItem.text = 'Loading tests...';
      } else {
        this.testSuite = testLoadEvent.suite;
        this.getTestSuiteInfo(testLoadEvent.suite);
        this.testCount = this.testSuite ? countTests(this.testSuite) : 0;
        this.statusBarItem.text = `Loaded ${this.testCount} tests`;
      }
    }));

    adapterDisposables.push(adapter.testStates(testRunEvent => {
      if (testRunEvent.type === 'started') {
        this.statusBarItem.text = 'Running tests: ...';
        this.passedTests = 0;
        this.failedTests = 0;
      } else if (testRunEvent.type === 'test') {
        if (testRunEvent.state === 'passed') {
          this.passedTests++;
        } else if (testRunEvent.state === 'failed') {
          this.failedTests++;
        }
        this.statusBarItem.text =
          this.failedTests > 0
            ? `Running tests: ${this.passedTests}/${this.testCount} passed (${this.failedTests} failed)`
            : `Running tests: ${this.passedTests}/${this.testCount} passed`;
      
      } else if (testRunEvent.type === 'finished') {
        this.statusBarItem.text =
          this.failedTests > 0
            ? `Tests: ${this.passedTests}/${this.testCount} passed (${this.failedTests} failed)`
            : `Tests: ${this.passedTests}/${this.testCount} passed`;
      }
    }));
  }

  unregisterTestAdapter(adapter: TestAdapter): void {
    const adapterDisposables = this.disposables.get(adapter);
    if (adapterDisposables) {
      for (const disposable of adapterDisposables) {
        disposable.dispose();
      }
      this.disposables.delete(adapter);
    }
  }

  private getTestSuiteInfo(suite: TestSuiteInfo | undefined): any {
    if (suite === undefined) {
      return [];
    }
    
    this.testList = this.generateTestList(suite);
    console.log(this.testList);

    return this.testList;
  }

  private generateTestList(info: TestSuiteInfo | TestInfo): any {
    console.log(info);
    if (info.type === 'suite') {
      let testList: Array<any> = [];
      for (const child of info.children) {
        testList.concat(this.generateTestList(child));
      }
      return testList;
    } else { // info.type === test
      return {
        id: info.id,
        status: 'unknown'
      }
    }
  }

  private setTestState(testId: String, state: String): void {
    if (this.testList !== undefined) {
      // let test = this.testList.filter((test) => test.id === testId);
    }
  }
}

function countTests(info: TestSuiteInfo | TestInfo): number {
  if (info.type === 'suite') {
    let total = 0;
    for (const child of info.children) {
      total += countTests(child);
    }
    return total;
  } else if (info.type === 'test') {
    return 1;
  }
  return 0;
}
