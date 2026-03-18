async function activate(context) {
  const disposables = [];

  const viewDisposable = context.api.ui.registerView({
    id: "quantumAssistantPanel",
    title: "Quantum Assistant Chat",
    location: "sidebar",
    component: { type: "quantum-assistant-chat", status: "ready" }
  });
  disposables.push(viewDisposable);

  const commandDisposable = context.api.commands.registerCommand({
    id: "qaulium.quantum.assistant.chat.open",
    title: "Quantum Assistant Chat: Open",
    run: () => {
      context.api.ui.revealView("quantumAssistantPanel");
      context.logger.info("quantum-assistant-chat command executed");
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
