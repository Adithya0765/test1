#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include "../../../integrations/shared/backend-cpp-types.hpp"

namespace qaulium::starter {

using BridgePtr = std::shared_ptr<qaulium::ExtensionBackendBridge>;

class BridgeRouter {
 public:
  void Register(const std::string& extension_id, BridgePtr bridge);
  qaulium::SimulationResult Route(const std::string& extension_id, const qaulium::SimulationRequest& request) const;
  bool Has(const std::string& extension_id) const;

 private:
  std::unordered_map<std::string, BridgePtr> bridges_;
};

}  // namespace qaulium::starter
