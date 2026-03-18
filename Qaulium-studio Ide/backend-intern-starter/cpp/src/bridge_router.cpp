#include "../include/bridge_router.hpp"

#include <stdexcept>

namespace qaulium::starter {

void BridgeRouter::Register(const std::string& extension_id, BridgePtr bridge) {
  bridges_[extension_id] = std::move(bridge);
}

qaulium::SimulationResult BridgeRouter::Route(
    const std::string& extension_id,
    const qaulium::SimulationRequest& request) const {
  const auto it = bridges_.find(extension_id);
  if (it == bridges_.end() || !it->second) {
    throw std::runtime_error("No bridge registered for extension: " + extension_id);
  }
  return it->second->RunSimulation(request);
}

bool BridgeRouter::Has(const std::string& extension_id) const {
  return bridges_.find(extension_id) != bridges_.end();
}

}  // namespace qaulium::starter
