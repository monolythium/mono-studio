# Mono Studio

> Native builder shell for [Monolythium](https://monolythium.com) contracts and assets, with a headless CLI and an MCP descriptor for AI dev tools.

**License:** Apache-2.0 · **Status:** preview (testnet only) · **Stack:** React 19 + TypeScript + Vite + Node CLI

---

## What Mono Studio is

Mono Studio is the developer toolchain for building on Monolythium. It ships three surfaces from one repo:

- **`mono-dev` CLI** — headless project create / build / validate / test / simulate / trace / deploy-plan / verify-bundle. Use it from a terminal or wire it into CI.
- **Studio app** — a React shell for tokens, contracts, templates, simulation, deployments, verification, MCP, and settings. Runs as a Vite dev server today; embedded as a tab in the Monolythium desktop wallet via a sidecar boundary.
- **Native-dev MCP descriptor** — a complete tool + resource + prompt + approval list at `src/mcp/nativeDevMcp.ts`. Any MCP-compatible AI client (Claude Desktop, Cursor, Claude Code, etc.) can drive the same dev surface.

All three call the same `src/devkit/` modules, so a contract built from the CLI looks identical to one built from the UI or from an AI agent.

## Why a separate toolchain (not Hardhat / Foundry)

Monolythium is not an Ethereum clone. The toolchain reflects that:

- **MRV** contracts, not Solidity/EVM ones
- **MRC** assets and token passports, not ERC tokens
- **`mono1` / `monoc1` / `mrc1`** typed bech32m addresses, not hex 0x addresses
- **Execution units** + **lythoshi** fee caps, not gas / gwei / wei
- **Native receipts** with syscalls, state diffs, and risk labels — not Solidity stack traces
- **Approval payloads** signed at the wallet boundary, not raw transactions broadcast from the CLI

A `pnpm no-evm` guardrail scan on every build enforces this in source + templates. See [`docs/no-evm-decision.md`](./docs/no-evm-decision.md) for the rationale.

## Status: preview

Functional, but not yet production-grade. Set expectations before adopting:

- **Chain target is testnet.** Monolythium mainnet has not launched. Anything built here runs against the public testnet; mainnet activation is gated on separate protocol milestones.
- **Adapter-shaped DevKit modules.** `src/devkit/` is intentionally adapter-shaped so the implementations can be replaced by canonical bindings from `mono-core` and `mono-core-sdk` once those packages are pinned. The deterministic hash helper is a preview checksum, not the final artifact hash.
- **Clone-and-build only.** No published npm package, no downloadable binary, no installer.
- **Wallet host pending.** The Monolythium desktop wallet's Studio tab is the production host; it ships in a future wallet release.
- **API + CLI surface may change.** Until the first non-preview tag, expect breaking changes between commits.

Watch this repo for the first non-preview release before standing up anything you'd hate to migrate.

## Prerequisites

- **Node** 22+
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@10 --activate`)
- A POSIX shell. macOS, Linux, and WSL are tested; native Windows should work but is unverified.
- Rust + cargo are *not* required today — the current build path produces preview artifacts in pure TypeScript. They'll be required once the canonical MRV builder wires in.

## Quick start

```bash
git clone https://github.com/monolythium/mono-studio.git
cd mono-studio
pnpm install
pnpm build           # runs no-evm scan, typecheck, vite build, CLI build
pnpm test            # runs the devkit unit tests + no-evm scan again
```

Then take the 60-second tour:

```bash
# List the built-in templates
node dist/cli/mono-dev.js templates

# Create a new project from the counter example
node dist/cli/mono-dev.js new my-counter --template counter-example --out /tmp

# Build it (produces a preview deterministic-hash manifest)
node dist/cli/mono-dev.js build /tmp/my-counter

# Run the simulator and inspect the syscall trace
node dist/cli/mono-dev.js simulate /tmp/my-counter
```

To bring up the Studio UI in a browser instead:

```bash
pnpm dev   # serves at http://localhost:5173
```

## CLI reference

| Command | What it does |
|---|---|
| `mono-dev templates` | List the built-in template registry |
| `mono-dev new <name> --template <id> --out <dir>` | Scaffold a new project from a template |
| `mono-dev build <project>` | Build a preview artifact + manifest |
| `mono-dev validate <project>` | Schema + structural checks on the project |
| `mono-dev test <project>` | Run the fixture tests declared in the project |
| `mono-dev simulate <project>` | Run the project against the in-process simulator |
| `mono-dev trace <project> <call>` | Run a single call and emit the syscall trace |
| `mono-dev deploy-plan <project>` | Build a deploy plan + approval payload (no signing) |
| `mono-dev verify-bundle <project>` | Build a verification bundle ready for Monoscan publication |

Deploy, call, token-create, and publish flows produce **approval payloads only**. Signing and submission happen at the wallet boundary — never inside this CLI.

## MCP integration (Claude Desktop / Cursor / Claude Code)

The Native-dev MCP profile lives at [`src/mcp/nativeDevMcp.ts`](./src/mcp/nativeDevMcp.ts). It declares every dev tool, every resource, every prompt template, and which operations require wallet approval. Until the standalone MCP server binary ships, the easiest way to drive Mono Studio from an AI client today is through the Monolythium desktop wallet's Studio tab — it spawns the DevKit as a sidecar and routes destructive operations through the wallet's approval bridge.

When the standalone MCP binary lands, your AI client's MCP config will look like:

```json
{
  "mcpServers": {
    "mono-studio": {
      "command": "mono-dev",
      "args": ["mcp"]
    }
  }
}
```

The descriptor's read/write boundary is intentional:

- **No approval needed:** project creation (writes inside the chosen workspace only), build, validate, test, simulate, trace, inspect.
- **Wallet approval required:** deploy, call, asset creation, market request, approval request, passport publication.
- **Out of MCP authority:** signing and submission — those stay behind the wallet boundary unconditionally.

See [`docs/mcp-profile.md`](./docs/mcp-profile.md) for the full spec.

## Architecture

```
mono-studio/
├── src/devkit/             # Shared models, schemas, deterministic hashing,
│                           # deploy plans, simulation, verification bundles.
│                           # Both the UI and the CLI call into here.
├── src/cli/mono-dev.ts     # Headless CLI entry point.
├── src/mcp/nativeDevMcp.ts # Native-dev MCP descriptor.
├── src/main.tsx            # React Studio shell.
├── templates/              # Built-in project templates (counter-example today).
├── scripts/no-evm-scan.mjs # Guardrail: scans source + templates for EVM/Solidity vocab.
└── docs/                   # Architectural decision records.
```

The DevKit modules are deliberately adapter-shaped so they can be replaced by canonical bindings from [`mono-core`](https://github.com/monolythium-vision/mono-core) and `mono-core-sdk` once those packages are pinned. The deterministic hash helper today is a preview checksum; canonical artifact hashing lands with the first mainnet-blocking release.

## Documentation

- [`docs/native-devkit.md`](./docs/native-devkit.md) — boundaries, what's wired today, next integration tasks
- [`docs/mcp-profile.md`](./docs/mcp-profile.md) — MCP tool / resource / prompt / approval-boundary spec
- [`docs/no-evm-decision.md`](./docs/no-evm-decision.md) — why MRV + MRC + bech32m + execution units, not EVM lookalikes

## Examples

- [`templates/counter-example/`](./templates/counter-example/) — minimal MRV contract with `init`, `increment`, `read` calls plus a fixture test. Cloning this is the fastest way to see the full project shape.

## Related projects

- [**monolythium.com**](https://monolythium.com) — protocol home, whitepaper, ecosystem links
- **monolythium/desktop-wallet** *(private)* — the Monolythium wallet that hosts the Studio tab as a sidecar
- **monolythium-vision/mono-core** *(private)* — the chain itself; the source of truth for canonical artifact bindings that replace this DevKit's adapter shims

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. Run `pnpm test` (devkit tests + the `no-evm` guardrail scan).
2. Keep `pnpm typecheck` green.
3. If you're touching the MCP descriptor or DevKit module shapes, link the matching doc update in your PR description.

For substantive changes — new tools, new templates, new module shapes — open an issue first so we can align on the integration boundary before the work lands.

## Security

Mono Studio's approval boundary is the wallet, not this CLI. Found a vulnerability? Please **don't open a public issue.** Email `security@monolythium.com` so we can coordinate disclosure.

## License

Apache License 2.0 — declared in [`package.json`](./package.json). Full text at <https://www.apache.org/licenses/LICENSE-2.0>.
