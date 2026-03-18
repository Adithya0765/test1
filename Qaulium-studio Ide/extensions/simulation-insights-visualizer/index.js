async function activate(context) {
  const insightsView = context.api.ui.registerView({
    id: "simulationInsightsPanel",
    title: "Simulation Insights",
    location: "sidebar",
    component: { type: "insights" }
  });

  const heatmapView = context.api.ui.registerView({
    id: "observablesHeatmapPanel",
    title: "Observables Heatmap",
    location: "sidebar",
    component: { type: "heatmap" }
  });

  const command = context.api.commands.registerCommand({
    id: "qaulium.visualization.insights.open",
    title: "Open Simulation Insights",
    run: () => {
      context.api.ui.revealView("simulationInsightsPanel");
      context.logger.info("Simulation insights opened");
    }
  });

  context.subscriptions.push(insightsView, heatmapView, command);
  context.logger.info("Simulation Insights Visualizer activated");
}

async function deactivate() {}

function dispose() {}

module.exports = {
  activate,
  deactivate,
  dispose
};
