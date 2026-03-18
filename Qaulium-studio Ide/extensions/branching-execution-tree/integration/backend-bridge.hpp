#pragma once

#include "../../integrations/shared/backend-cpp-types.hpp"

namespace qaulium::extensions {

class branching_execution_tree_bridge final : public qaulium::ExtensionBackendBridge {
 public:
  qaulium::SimulationResult RunSimulation(const qaulium::SimulationRequest& request) override;
};

}  // namespace qaulium::extensions
