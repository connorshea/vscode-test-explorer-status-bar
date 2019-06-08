import * as vscode from 'vscode';
import { TestController, TestAdapter, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';

type Test = { id: String, state: 'pending' | 'passed' | 'failed' | 'skipped' | 'running' | 'errored' };

/**
 * Controller for the Test StatusBarItem.
 */
export class TestExplorerStatusBarController implements TestController {
  private readonly disposables = new Map<TestAdapter, { dispose(): void }[]>();

  private statusBarItem: vscode.StatusBarItem;
  private passedTests = 0;
  private failedTests = 0;
  private testSuite: TestSuiteInfo | undefined = undefined;
  private testList: Array<Test> | undefined = undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
    this.statusBarItem.show();

    // Run all tests when the statusBarItem is clicked.
    this.statusBarItem.command = 'test-explorer.run-all';
  }

  registerTestAdapter(adapter: TestAdapter): void {
    const adapterDisposables: { dispose(): void }[] = [];
    this.disposables.set(adapter, adapterDisposables);

    adapterDisposables.push(adapter.tests(testLoadEvent => {
      if (testLoadEvent.type === 'started') {
        this.setStatusBarItemText('loading');
      } else {
        this.testSuite = testLoadEvent.suite;
        this.getTestSuiteInfo(this.testSuite);
        this.setStatusBarItemText('loaded');
        // Wait 3 seconds, then return to 'waiting' state.
        setTimeout(() => {
          this.setStatusBarItemText('waiting');
        }, 3000);
      }
    }));

    adapterDisposables.push(adapter.testStates(testRunEvent => {
      if (testRunEvent.type === 'started') {
        this.setStatusBarItemText('started');
        this.resetTestState();
      } else if (testRunEvent.type === 'test') {
        this.setTestState(testRunEvent.test as String, testRunEvent.state);
        this.getTestStates();
        this.setStatusBarItemText('running');
      } else if (testRunEvent.type === 'finished') {
        this.getTestStates();
        this.setStatusBarItemText('finished');
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
    
    this.testList = this.generateTestList(suite) as Array<Test>;

    return this.testList;
  }

  private generateTestList(info: TestSuiteInfo | TestInfo): (Array<Test> | Test) {
    if (info.type === 'suite') {
      let testList: Array<any> = [];
      for (const child of info.children) {
        testList = testList.concat(this.generateTestList(child));
      }
      return testList;
    } else { // info.type === test
      return {
        id: info.id,
        state: 'pending'
      }
    }
  }

  /**
   * Resets all tests in the testList's to pending.
   * This prevents old data from being reused when the test suite is re-run.
   */
  private resetTestState(): void {
    if (this.testList !== undefined) {
      this.testList = this.testList.map(test => {
        return {
          id: test.id,
          state: 'pending'
        }
      });
    }
  }

  private setTestState(testId: String, state: Test['state']): void {
    if (this.testList !== undefined) {
      let testIndex = this.testList.findIndex((test) => test.id === testId);
      if (this.testList[testIndex] !== undefined) {
        this.testList[testIndex].state = state;
      }
    }
  }

  private getTestStates(): void {
    if (this.testList !== undefined) {
      let passedTests = this.testList.filter(test => ['passed', 'skipped'].includes(test.state));
      let failedTests = this.testList.filter(test => ['failed', 'errored'].includes(test.state));
      this.passedTests = passedTests.length;
      this.failedTests = failedTests.length;
    }
  }

  private countTests(): number {
    if (this.testList === undefined) {
      return 0;
    } else {
      return this.testList.length;
    }
  }

  private setStatusBarItemText(status: 'loading' | 'loaded' | 'waiting' | 'started' | 'running' | 'finished'): void {
    let statusBarText = '$(beaker) ';

    switch (status) {
      case 'running':
        statusBarText += `${(((this.passedTests + this.failedTests) / this.countTests()) * 100).toFixed(1)}% `;
        statusBarText += `${this.passedTests}/${this.countTests()} passed`
        if (this.failedTests > 0) {
          statusBarText += ` (${this.failedTests} failed)`;
        }
        break;
      case 'finished':
        statusBarText += `${this.passedTests}/${this.countTests()} passed`
        if (this.failedTests > 0) {
          statusBarText += ` (${this.failedTests} failed)`;
        }
        break;
      case 'started':
        statusBarText += 'Running tests...';
        break;
      case 'loading':
        statusBarText += 'Loading tests...';
        break;
      case 'loaded':
        statusBarText += `Loaded ${this.countTests()} tests`;
        break;
      case 'waiting':
        statusBarText += `${this.countTests()} tests`;
        break;
      default:
        break;
    }

    this.statusBarItem.text = statusBarText;
  }
}
