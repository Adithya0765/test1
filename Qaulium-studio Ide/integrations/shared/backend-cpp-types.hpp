#pragma once

#include <map>
#include <optional>
#include <string>
#include <vector>

namespace qaulium {

struct Diagnostic {
  std::string level;
  std::string message;
};

struct SimulationMetrics {
  int duration_ms = 0;
  std::optional<int> peak_memory_mb;
  std::optional<double> fidelity_estimate;
};

struct SimulationRequest {
  std::string run_id;
  std::string backend_id;
  int qubits = 0;
  std::vector<std::string> operations;
  std::string mode = "wasm";
  std::optional<int> shots;
  std::optional<std::string> noise_model;
};

struct SimulationResult {
  std::string run_id;
  std::string backend_id;
  SimulationMetrics metrics;
  std::map<std::string, double> observables;
  std::vector<Diagnostic> diagnostics;
};

class ExtensionBackendBridge {
 public:
  virtual ~ExtensionBackendBridge() = default;
  virtual SimulationResult RunSimulation(const SimulationRequest& request) = 0;
};

}  // namespace qaulium
