Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$extensionsRoot = Join-Path $root "extensions"
$matrixPath = Join-Path $root "docs\extension-compatibility-matrix.json"

if (!(Test-Path $extensionsRoot)) {
  throw "Extensions folder not found: $extensionsRoot"
}

if (!(Test-Path $matrixPath)) {
  throw "Compatibility matrix not found: $matrixPath"
}

$matrixRaw = Get-Content $matrixPath -Raw | ConvertFrom-Json
$matrix = @($matrixRaw)
$results = @()

foreach ($item in $matrix) {
  $id = [string]$item.extensionId
  $base = Join-Path $extensionsRoot $id
  $checks = [ordered]@{
    extensionId = $id
    manifest = Test-Path (Join-Path $base "extension.json")
    runtime = Test-Path (Join-Path $base "index.js")
    compatibility = Test-Path (Join-Path $base "integration\compatibility.json")
    frontendAdapter = Test-Path (Join-Path $base "integration\frontend-adapter.ts")
    backendHeader = Test-Path (Join-Path $base "integration\backend-bridge.hpp")
    backendSource = Test-Path (Join-Path $base "integration\backend-bridge.cpp")
  }

  $checks.ready = ($checks.manifest -and $checks.runtime -and $checks.compatibility -and $checks.frontendAdapter -and $checks.backendHeader -and $checks.backendSource)
  $results += [pscustomobject]$checks
}

$notReady = @($results | Where-Object { -not $_.ready })

[pscustomobject]@{
  total = $results.Count
  ready = ($results | Where-Object { $_.ready }).Count
  notReady = @($notReady).Count
} | ConvertTo-Json -Depth 4

if ($notReady.Count -gt 0) {
  Write-Output "not_ready_extensions:"
  $notReady | Select-Object extensionId, manifest, runtime, compatibility, frontendAdapter, backendHeader, backendSource | Format-Table | Out-String | Write-Output
  exit 2
}
