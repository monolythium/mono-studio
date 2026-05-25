# Native Developer Surface Decision

Mono Studio is a native Mono builder, not a compatibility-first clone of Ethereum tooling.

Developer-facing app screens, CLI commands, MCP tools, templates, and shared native-dev APIs must use Mono vocabulary:

- MRV artifacts and ABI manifests;
- MRC assets and token passports;
- typed `mono1`, `monoc1`, and `mrc1` addresses;
- execution units, lythoshi fee caps, and wallet approval payloads;
- native receipts, syscalls, state diffs, and risk labels.

Compatibility notes may live in isolated docs only. The app source and template registry are checked by `pnpm no-evm`.
