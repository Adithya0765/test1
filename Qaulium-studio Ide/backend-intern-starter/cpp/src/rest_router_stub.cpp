#include <httplib.h>
#include <nlohmann/json.hpp>

#include "../include/bridge_router.hpp"

using json = nlohmann::json;

int main() {
  qaulium::starter::BridgeRouter router;
  httplib::Server server;

  server.Get("/health", [](const httplib::Request&, httplib::Response& res) {
    res.set_content(R"({"ok":true,"service":"qaulium-backend-intern-starter"})", "application/json");
  });

  server.Post("/route/simulate", [&](const httplib::Request& req, httplib::Response& res) {
    try {
      const body = json::parse(req.body);
      const extension_id = body.value("extensionId", "");

      qaulium::SimulationRequest request;
      request.run_id = body.value("runId", "run_unknown");
      request.backend_id = body.value("backendId", "");
      request.mode = body.value("mode", "wasm");

      // TODO: parse circuit payload and wire to bridge request model.
      auto result = router.Route(extension_id, request);

      json out = {
          {"ok", true},
          {"result",
           {
               {"runId", result.run_id},
               {"backendId", result.backend_id},
               {"metrics",
                {
                    {"durationMs", result.metrics.duration_ms},
                }},
           }},
      };
      res.set_content(out.dump(), "application/json");
    } catch (const std::exception& ex) {
      res.status = 400;
      json err = {{"ok", false}, {"message", ex.what()}};
      res.set_content(err.dump(), "application/json");
    }
  });

  server.listen("0.0.0.0", 9001);
  return 0;
}
