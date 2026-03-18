#pragma once

#include "../../integrations/shared/backend-cpp-types.hpp"

namespace qaulium::extensions {

class bloch_sphere_visualizer_bridge final : public qaulium::ExtensionBackendBridge {
 public:
  qaulium::SimulationResult RunSimulation(const qaulium::SimulationRequest& request) override;
};

}  // namespace qaulium::extensions
