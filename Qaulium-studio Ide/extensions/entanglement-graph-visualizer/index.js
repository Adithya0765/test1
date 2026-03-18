async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "entanglementGraphPanel",
    title: "Entanglement Graph Visualizer",
    location: "sidebar",
    component: { type: "entanglement-graph-visualizer", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.entanglement.graph.visualizer.open",
    title: "Entanglement Graph Visualizer: Open",
    run: () => {
      context.api.ui.revealView("entanglementGraphPanel");
      context.logger.info("entanglement-graph-visualizer command executed");
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
