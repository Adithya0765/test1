#include "backend-bridge.hpp"

namespace qaulium::extensions {

qaulium::SimulationResult basic_integration_extension_bridge::RunSimulation(const qaulium::SimulationRequest& request) {
  qaulium::SimulationResult result;
  result.run_id = request.run_id;
  result.backend_id = request.backend_id.empty() ? "basic-integration-extension" : request.backend_id;
  result.metrics.duration_ms = 40;
  result.metrics.peak_memory_mb = 32;
  result.metrics.fidelity_estimate = 0.99;
  result.observables.insert({"z0", 0.2});
  result.observables.insert({"z1", -0.3});
  result.diagnostics.push_back({"info", "Basic Integration Extension backend bridge stub executed"});
  return result;
}

}  // namespace qaulium::extensions
