async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "vqeWorkbenchPanel",
    title: "VQE Workbench",
    location: "sidebar",
    component: { type: "vqe-workbench", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.vqe.workbench.open",
    title: "VQE Workbench: Open",
    run: () => {
      context.api.ui.revealView("vqeWorkbenchPanel");
      context.logger.info("vqe-workbench command executed");
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
