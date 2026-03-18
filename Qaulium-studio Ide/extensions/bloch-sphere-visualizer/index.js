async function activate(context) {
  const viewDisposable = context.api.ui.registerView({
    id: "blochSpherePanel",
    title: "Bloch Sphere",
    location: "sidebar",
    component: { type: "bloch-sphere" }
  });

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.visualization.bloch.open",
    title: "Open Bloch Sphere",
    run: () => {
      context.api.ui.revealView("blochSpherePanel");
      context.logger.info("Bloch sphere panel opened");
    }
  });

  context.subscriptions.push(viewDisposable, commandDisposable);
}

async function deactivate() {}

function dispose() {}

module.exports = {
  activate,
  deactivate,
  dispose
};
