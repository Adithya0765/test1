Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$extensionsRoot = Join-Path $root "extensions"

$dirs = Get-ChildItem -Path $extensionsRoot -Directory

$extensionMatrix = @()

foreach ($dir in $dirs) {
  $manifestPath = Join-Path $dir.FullName "extension.json"
  if (!(Test-Path $manifestPath)) {
    continue
  }

  $manifestRaw = Get-Content $manifestPath -Raw
  $manifestRaw = $manifestRaw -replace "^\uFEFF", ""
  $manifest = $manifestRaw | ConvertFrom-Json

  $contributes = $manifest.contributes
  $commands = @()
  if ($contributes -and $contributes.PSObject.Properties.Name -contains 'commands' -and $contributes.commands) {
    foreach ($c in $contributes.commands) {
      $commands += [string]$c.command
    }
  }

  $views = @()
  if ($contributes -and $contributes.PSObject.Properties.Name -contains 'views' -and $contributes.views) {
    foreach ($v in $contributes.views) {
      $views += [string]$v.id
    }
  }

  $backends = @()
  if ($contributes -and $contributes.PSObject.Properties.Name -contains 'simulationBackends' -and $contributes.simulationBackends) {
    foreach ($b in $contributes.simulationBackends) {
      $backends += [string]$b.id
    }
  }

  $category = "Tooling"
  if ($manifest.name -match "simulator") { $category = "Simulation" }
  elseif ($manifest.name -match "visualizer") { $category = "Visualization" }
  elseif ($manifest.name -match "assistant") { $category = "AI" }
  elseif ($manifest.name -match "debugger|branching") { $category = "Debugger" }
  elseif ($manifest.name -match "workbench") { $category = "Algorithms" }
  elseif ($manifest.name -match "digital-twin") { $category = "Hardware" }

  $integrationDir = Join-Path $dir.FullName "integration"
  if (!(Test-Path $integrationDir)) {
    New-Item -ItemType Directory -Path $integrationDir | Out-Null
  }

  $compatSpec = [ordered]@{
    extensionId = [string]$manifest.name
    extensionDisplayName = [string]$manifest.displayName
    category = $category
    frontend = [ordered]@{
      framework = "react"
      entryPoint = "integration/frontend-adapter.ts"
      panelId = $(if ($views.Count -gt 0) { $views[0] } else { "" })
      commands = $commands
      eventsOut = @("extension:ready", "view:mount", "simulation:result")
      eventsIn = @("command:execute", "simulation:run", "state:update")
    }
    backend = [ordered]@{
      language = "c++"
      bridgeType = "rest"
      endpoint = "http://localhost:9000/simulate/$($manifest.name)"
      grpcService = "qaulium.extensions.$($manifest.name.Replace('-', '.')).Runner"
      required = [bool]($backends.Count -gt 0)
      simulationBackends = $backends
    }
  }

  $compatPath = Join-Path $integrationDir "compatibility.json"
  ($compatSpec | ConvertTo-Json -Depth 10) | Set-Content -Path $compatPath -Encoding UTF8

  $adapterName = (($manifest.name -split '-') | ForEach-Object {
    if ($_.Length -gt 0) {
      $_.Substring(0,1).ToUpper() + $_.Substring(1)
    }
  }) -join ''

  $compatJson = $compatSpec | ConvertTo-Json -Depth 10
  $bridgeName = $manifest.name.Replace('-', '_')
  $mountFunctionName = "mount$($adapterName)Adapter"

  $frontendAdapter = @"
import type { ExtensionCompatibilityProfile, ExtensionHostApi } from "../../../integrations/shared/frontend-react-types";

export const profile: ExtensionCompatibilityProfile = $compatJson;

export function $mountFunctionName(host: ExtensionHostApi): void {
  if (profile.frontend.panelId) {
    host.mountView(profile.frontend.panelId, {
      extensionId: profile.extensionId,
      displayName: profile.extensionDisplayName,
      category: profile.category
    });
  }
}

export async function executePrimaryCommand(host: ExtensionHostApi): Promise<void> {
  const command = profile.frontend.commands[0];
  if (command) {
    await host.executeCommand(command, { source: "react-adapter" });
  }
}
"@

  $frontendPath = Join-Path $integrationDir "frontend-adapter.ts"
  Set-Content -Path $frontendPath -Value $frontendAdapter -Encoding UTF8

  $backendHeader = @"
#pragma once

#include "../../integrations/shared/backend-cpp-types.hpp"

namespace qaulium::extensions {

class $($bridgeName)_bridge final : public qaulium::ExtensionBackendBridge {
 public:
  qaulium::SimulationResult RunSimulation(const qaulium::SimulationRequest& request) override;
};

}  // namespace qaulium::extensions
"@

  $backendSource = @"
#include "backend-bridge.hpp"

namespace qaulium::extensions {

qaulium::SimulationResult $($bridgeName)_bridge::RunSimulation(const qaulium::SimulationRequest& request) {
  qaulium::SimulationResult result;
  result.run_id = request.run_id;
  result.backend_id = request.backend_id.empty() ? "$($manifest.name)" : request.backend_id;
  result.metrics.duration_ms = 40;
  result.metrics.peak_memory_mb = 32;
  result.metrics.fidelity_estimate = 0.99;
  result.observables.insert({"z0", 0.2});
  result.observables.insert({"z1", -0.3});
  result.diagnostics.push_back({"info", "$($manifest.displayName) backend bridge stub executed"});
  return result;
}

}  // namespace qaulium::extensions
"@

  $backendHeaderPath = Join-Path $integrationDir "backend-bridge.hpp"
  $backendSourcePath = Join-Path $integrationDir "backend-bridge.cpp"
  Set-Content -Path $backendHeaderPath -Value $backendHeader -Encoding UTF8
  Set-Content -Path $backendSourcePath -Value $backendSource -Encoding UTF8

  $extensionMatrix += [pscustomobject]@{
    extensionId = [string]$manifest.name
    displayName = [string]$manifest.displayName
    category = $category
    hasSimulationBackend = [bool]($backends.Count -gt 0)
    commands = $commands.Count
    views = $views.Count
  }
}

$matrixPath = Join-Path $root "docs\extension-compatibility-matrix.json"
($extensionMatrix | ConvertTo-Json -Depth 8) | Set-Content -Path $matrixPath -Encoding UTF8

Write-Output "profiles_generated=$($extensionMatrix.Count)"
