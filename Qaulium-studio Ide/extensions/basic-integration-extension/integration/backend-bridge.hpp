#pragma once

#include "../../integrations/shared/backend-cpp-types.hpp"

namespace qaulium::extensions {

class basic_integration_extension_bridge final : public qaulium::ExtensionBackendBridge {
 public:
  qaulium::SimulationResult RunSimulation(const qaulium::SimulationRequest& request) override;
};

}  // namespace qaulium::extensions
