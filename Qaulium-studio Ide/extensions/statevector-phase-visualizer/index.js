async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "statevectorPhasePanel",
    title: "Statevector and Phase Visualizer",
    location: "sidebar",
    component: { type: "statevector-phase-visualizer", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.statevector.phase.visualizer.open",
    title: "Statevector and Phase Visualizer: Open",
    run: () => {
      context.api.ui.revealView("statevectorPhasePanel");
      context.logger.info("statevector-phase-visualizer command executed");
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
