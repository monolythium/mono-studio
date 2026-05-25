# Native DevKit Build Notes

## Scope

This repo implements the Mono Studio first-pass shell as a standalone private app. It keeps the surface aligned with the cross-repo plan while leaving clear adapter points for:

- canonical MRV artifact validation from `mono-core`;
- reusable native-dev APIs from `mono-core-sdk`;
- wallet approval and keychain flows from desktop wallet code;
- Monoscan verification and passport publication endpoints;
- local `lyth-dev-mcp` process launch.

## Current Boundaries

- `src/devkit` owns schemas, deterministic preview hashes, token plans, deploy plans, simulation output, and verification bundle shapes.
- `src/cli/mono-dev.ts` is the headless command surface.
- `src/mcp/nativeDevMcp.ts` is the native developer MCP contract skeleton.
- `src/main.tsx` is the first usable Studio shell.

The deterministic hash helper is a preview checksum. Replace it with canonical artifact hashing once `mono-core-sdk` exposes the final binding.

## Next Integration Tasks

1. Replace preview artifact building with canonical MRV builder output.
2. Replace preview simulation with the runtime-backed MRV runner.
3. Add Tauri commands for workspace trust, external editor launch, and MCP sidecar start.
4. Wire approval payloads into the wallet operations drawer.
5. Publish verification bundles to Monoscan after explicit user confirmation.
