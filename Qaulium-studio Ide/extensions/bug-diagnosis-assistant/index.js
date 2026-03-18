async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "bugDiagnosisPanel",
    title: "Bug Diagnosis Assistant",
    location: "sidebar",
    component: { type: "bug-diagnosis-assistant", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.bug.diagnosis.assistant.open",
    title: "Bug Diagnosis Assistant: Open",
    run: () => {
      context.api.ui.revealView("bugDiagnosisPanel");
      context.logger.info("bug-diagnosis-assistant command executed");
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
