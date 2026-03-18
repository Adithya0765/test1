async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "hardwareDigitalTwinPanel",
    title: "Hardware Digital Twin",
    location: "sidebar",
    component: { type: "hardware-digital-twin", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.hardware.digital.twin.open",
    title: "Hardware Digital Twin: Open",
    run: () => {
      context.api.ui.revealView("hardwareDigitalTwinPanel");
      context.logger.info("hardware-digital-twin command executed");
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
