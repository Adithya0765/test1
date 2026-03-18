# Qaulium Launch Pack (12 Extensions)

## Included extensions

1. tensor-network-simulator
2. bloch-sphere-visualizer
3. density-matrix-simulator
4. noise-aware-simulator
5. entanglement-graph-visualizer
6. statevector-phase-visualizer
7. quantum-assistant-chat
8. bug-diagnosis-assistant
9. quantum-step-debugger
10. branching-execution-tree
11. vqe-workbench
12. hardware-digital-twin

## Where to find them

All extension packages are under:

- `extensions/<extension-id>/extension.json`
- `extensions/<extension-id>/index.js`

## Marketplace registry

All launch extensions are listed in:

- `server/data/marketplace.json`

## Validation status

- Marketplace load: passed
- Install flow: passed
- Activation flow: passed
- Simulation flow: passed for `density-matrix` backend

## Notes

- Runtime parser now handles UTF-8 BOM in JSON files to avoid manifest parsing failures.
- This launch pack is intentionally basic and integration-ready for future React frontend and C++ backend expansion.
