import * as vscode from 'vscode';
import { TestController, TestAdapter, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';

type Test = { id: String, state: 'pending' | 'passed' | 'failed' | 'skipped' | 'running' | 'errored' };

class TestAdapterState {
  public passedTests: number = 0;
  public failedTests: number = 0;
  public testSuite: TestSuiteInfo | undefined = undefined;
  public testList: Array<Test> | undefined = undefined;
}

/**
 * Controller for the Test StatusBarItem.
 */
export class TestExplorerStatusBarController implements TestController {
  private readonly disposables = new Map<TestAdapter, { dispose(): void }[]>();

  private statusBarItem: vscode.StatusBarItem;
  private testAdapterStates: TestAdapterState[] = []; 

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 40);
    this.statusBarItem.show();

    // View Test Explorer when the statusBarItem is clicked.
    this.statusBarItem.command = 'workbench.view.extension.test';
  }

  registerTestAdapter(adapter: TestAdapter): void {
    const adapterDisposables: { dispose(): void }[] = [];
    this.disposables.set(adapter, adapterDisposables);

    const testAdapterState = new TestAdapterState();
    this.testAdapterStates.push(testAdapterState);

    let timeoutId: NodeJS.Timeout;
    
    adapterDisposables.push(adapter.tests(testLoadEvent => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (testLoadEvent.type === 'started') {
        this.setStatusBarItemText('loading');
      } else {
        testAdapterState.testSuite = testLoadEvent.suite;
        this.getTestSuiteInfo(testAdapterState, testAdapterState.testSuite);
        this.setStatusBarItemText('loaded');
        // Wait 3 seconds, then return to 'waiting' state unless cancelled.
        timeoutId = setTimeout(() => {
          this.setStatusBarItemText('waiting');
        }, 3000);
      }
    }));

    adapterDisposables.push(adapter.testStates(testRunEvent => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (testRunEvent.type === 'started') {
        this.setStatusBarItemText('started');
        this.resetTestState(testAdapterState);
      } else if (testRunEvent.type === 'test') {
        const testId = (typeof testRunEvent.test === 'string') ? testRunEvent.test : testRunEvent.test.id;
        this.setTestState(testAdapterState, testId, testRunEvent.state);
        this.getTestStates(testAdapterState);
        this.setStatusBarItemText('running');
      } else if (testRunEvent.type === 'finished') {
        this.getTestStates(testAdapterState);
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

  private getTestSuiteInfo(testAdapterState: TestAdapterState, suite: TestSuiteInfo | undefined): any {
    if (suite === undefined) {
      return [];
    }
    
    testAdapterState.testList = this.generateTestList(suite) as Array<Test>;

    return testAdapterState.testList;
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
  private resetTestState(testAdapterState: TestAdapterState): void {
    if (testAdapterState.testList !== undefined) {
      testAdapterState.testList = testAdapterState.testList.map(test => {
        return {
          id: test.id,
          state: 'pending'
        }
      });
    }
  }

  private setTestState(testAdapterState: TestAdapterState, testId: String, state: Test['state']): void {
    if (testAdapterState.testList !== undefined) {
      let testIndex = testAdapterState.testList.findIndex((test) => test.id === testId);
      if (testAdapterState.testList[testIndex] !== undefined) {
        testAdapterState.testList[testIndex].state = state;
      }
    }
  }

  private getTestStates(testAdapterState: TestAdapterState): void {
    if (testAdapterState.testList !== undefined) {
      let passedTests = testAdapterState.testList.filter(test => ['passed', 'skipped'].includes(test.state));
      let failedTests = testAdapterState.testList.filter(test => ['failed', 'errored'].includes(test.state));
      testAdapterState.passedTests = passedTests.length;
      testAdapterState.failedTests = failedTests.length;
    }
  }

  private countTests(valueFn: (state: TestAdapterState) => number): number {
    return this.testAdapterStates.map(valueFn).reduce((a, b) => a + b, 0);
  }

  private setStatusBarItemText(status: 'loading' | 'loaded' | 'waiting' | 'started' | 'running' | 'finished'): void {
    let statusBarText = '$(beaker) ';
    let failedTestString = '';

    const totalTests = this.countTests(s => {
      if (s.testList === undefined) {
        return 0;
      } else {
        return s.testList.length;
      }
    });
    const totalPassed = this.countTests(s => s.passedTests);
    const totalFailed = this.countTests(s => s.failedTests);
    switch (status) {
      case 'running':
        let percentageComplete = (((totalPassed + totalFailed) / totalTests) * 100).toFixed(1);
        failedTestString = '';
        if (totalFailed > 0) { failedTestString = ` | $(x) ${totalFailed}` }
        statusBarText += `${totalTests} tests | ${percentageComplete}% ($(check) ${totalPassed}${failedTestString})`;
        break;
      case 'finished':
        failedTestString = '';
        if (totalFailed > 0) { failedTestString = ` | $(x) ${totalFailed}` }
        statusBarText += `${totalTests} tests ($(check) ${totalPassed}${failedTestString})`;
        break;
      case 'started':
        statusBarText += 'Running tests...';
        break;
      case 'loading':
        statusBarText += 'Loading tests...';
        break;
      case 'loaded':
        statusBarText += `Loaded ${totalTests} tests`;
        break;
      case 'waiting':
        statusBarText += `${totalTests} tests`;
        break;
      default:
        break;
    }

    this.statusBarItem.text = statusBarText;
  }
}
