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
  private testList: Array<{ id: String, state: String }> | undefined = undefined;

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
        this.getTestSuiteInfo(this.testSuite);
        this.testCount = this.testSuite ? this.countTests(this.testSuite) : 0;
        this.statusBarItem.text = `Loaded ${this.testCount} tests`;
      }
    }));

    adapterDisposables.push(adapter.testStates(testRunEvent => {
      if (testRunEvent.type === 'started') {
        this.statusBarItem.text = 'Running tests: ...';
        this.passedTests = 0;
        this.failedTests = 0;
      } else if (testRunEvent.type === 'test') {
        this.setTestState(testRunEvent.test as String, testRunEvent.state);
        this.getTestStates();
        this.statusBarItem.text =
          this.failedTests > 0
            ? `Running tests: ${this.passedTests}/${this.testCount} passed (${this.failedTests} failed)`
            : `Running tests: ${this.passedTests}/${this.testCount} passed`;
      
      } else if (testRunEvent.type === 'finished') {
        this.getTestStates();
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
    
    this.testList = this.generateTestList(suite) as Array<{ id: String, state: String }>;

    return this.testList;
  }

  private generateTestList(info: TestSuiteInfo | TestInfo): (Array<{ id: String, state: String }> | { id: String, state: String }) {
    if (info.type === 'suite') {
      let testList: Array<any> = [];
      for (const child of info.children) {
        testList = testList.concat(this.generateTestList(child));
      }
      return testList;
    } else { // info.type === test
      return {
        id: info.id,
        state: 'unknown'
      }
    }
  }

  private setTestState(testId: String, state: String): void {
    if (this.testList !== undefined) {
      let testIndex = this.testList.findIndex((test) => test.id === testId);
      if (this.testList[testIndex] !== undefined) {
        this.testList[testIndex].state = state;
      }
    }
  }

  private getTestStates(): void {
    console.log('getTestStates');
    if (this.testList !== undefined) {
      let passedTests = this.testList.filter(test => test.state === 'passed');
      let failedTests = this.testList.filter(test => test.state === 'failed');
      this.passedTests = passedTests.length;
      this.failedTests = failedTests.length;
    }
  }

  private countTests(info: TestSuiteInfo | TestInfo): number {
    if (this.testList === undefined) {
      return 0;
    } else {
      return this.testList.length;
    }
  }
}
