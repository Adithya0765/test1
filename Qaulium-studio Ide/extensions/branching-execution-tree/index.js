async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "branchingExecutionTreePanel",
    title: "Branching Execution Tree",
    location: "sidebar",
    component: { type: "branching-execution-tree", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.branching.execution.tree.open",
    title: "Branching Execution Tree: Open",
    run: () => {
      context.api.ui.revealView("branchingExecutionTreePanel");
      context.logger.info("branching-execution-tree command executed");
    }
  });
  disposables.push(commandDisposable);


  context.subscriptions.push(...disposables);
}

async function deactivate() {}
function dispose() {}

module.exports = {
  activate,
  deactivate,
  dispose
};
