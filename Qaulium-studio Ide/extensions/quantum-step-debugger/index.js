async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "quantumStepDebuggerPanel",
    title: "Quantum Step Debugger",
    location: "sidebar",
    component: { type: "quantum-step-debugger", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.quantum.step.debugger.open",
    title: "Quantum Step Debugger: Open",
    run: () => {
      context.api.ui.revealView("quantumStepDebuggerPanel");
      context.logger.info("quantum-step-debugger command executed");
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
