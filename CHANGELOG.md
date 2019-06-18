# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.1.2] - 2019-06-18
### Fixed
- Fix 3 second timeout that caused the status bar state to be overwritten in certain cases. Thanks [AlexHaxe](https://github.com/AlexHaxe)! ([#3](https://github.com/connorshea/vscode-test-explorer-status-bar/pull/3))

## [1.1.1] - 2019-06-14
### Fixed
- Fix test ID detection for test adapters that use `TestInfo` objects as the parameter for `TestRunEvent`s. Thanks [kondratyev-nv](https://github.com/kondratyev-nv)! ([#2](https://github.com/connorshea/vscode-test-explorer-status-bar/pull/2))

## [1.1.0] - 2019-06-10
### Added
- Add support for multi-root workspaces. Thanks [kondratyev-nv](https://github.com/kondratyev-nv)! ([#1](https://github.com/connorshea/vscode-test-explorer-status-bar/pull/1))

## [1.0.1] - 2019-06-09
### Changed
- The status bar item now opens the test explorer when clicked.

## [1.0.0] - 2019-06-08

Initial release.

[Unreleased]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/v1.1.0...v1.1.1
[1.0.1]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/connorshea/vscode-test-explorer-status-bar/compare/9804111ef54c0c99de1400038b42195efb4e133c...v1.0.0
