#include "backend-bridge.hpp"

namespace qaulium::extensions {

qaulium::SimulationResult hardware_digital_twin_bridge::RunSimulation(const qaulium::SimulationRequest& request) {
  qaulium::SimulationResult result;
  result.run_id = request.run_id;
  result.backend_id = request.backend_id.empty() ? "hardware-digital-twin" : request.backend_id;
  result.metrics.duration_ms = 40;
  result.metrics.peak_memory_mb = 32;
  result.metrics.fidelity_estimate = 0.99;
  result.observables.insert({"z0", 0.2});
  result.observables.insert({"z1", -0.3});
  result.diagnostics.push_back({"info", "Hardware Digital Twin backend bridge stub executed"});
  return result;
}

}  // namespace qaulium::extensions
