# Test Explorer Status Bar extension

**[Install it from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=connorshea.vscode-test-explorer-status-bar)**

This is a VS Code extension that adds a status bar item for test statistics. It works with the [Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer) extension and any of its adapters.

![A screenshot of the status bar item](/img/screenshot1.png)
![A screenshot of the status bar item while running](/img/screenshot2.png)
![A screenshot of the status bar item while running after a test has failed](/img/screenshot3.png)
![A screenshot of the status bar item after the tests have finished running](/img/screenshot4.png)

## Contributing

You'll need VS Code and Node (any version >= 12 should probably work).

- Clone the repository: `git clone https://github.com/connorshea/vscode-test-explorer-status-bar`
- Run `npm install` to install dependencies.
- Open the directory in VS Code.
- Run `npm run watch` or start the `watch` Task in VS Code to get the TypeScript compiler running.
- Go to the Debug section in the sidebar and run "Status Bar extension". This will start a separate VS Code instance for testing the extension in. It gets updated code whenever "Reload Window" is run in the Command Palette.
  - You'll need a test adapter (e.g. the [Ruby adapter](https://marketplace.visualstudio.com/items?itemName=connorshea.vscode-ruby-test-adapter)) and a test suite to use the status bar extension with.

This extension is based on [the example test controller](https://github.com/hbenl/vscode-example-test-controller), it may be useful to check that repository for more information.

### Publishing a new version

See [the VS Code extension docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) for more info.

Before publishing, make sure to update the `CHANGELOG.md` file. You also need to be logged in to `vsce`.

`vsce publish VERSION`, e.g. `vsce publish 1.0.0` will automatically handle creating the git commit and git tag, updating the `package.json`, and publishing the new version to the Visual Studio Marketplace. You'll need to manually run `git push` and `git push --tags` after publishing.

Alternatively, you can bump the extension version with `vsce publish major`, `vsce publish minor`, or `vsce publish patch`.
