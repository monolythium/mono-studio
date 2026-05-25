# Mono Studio

Mono Studio is the native builder shell for MRV contracts, MRC assets, wallet approval plans, local simulation, template registry workflows, and AI-assisted development.

## Status: preview

This is an early-access release. It is functional but not yet production-grade — set expectations before adopting:

- **Chain target is testnet.** Monolythium mainnet has not launched. Anything you build here runs against the public testnet today; mainnet activation is gated on separate protocol milestones.
- **Adapter-shaped DevKit modules.** `src/devkit/` is intentionally adapter-shaped so the implementations can be replaced by canonical bindings from `mono-core` and `mono-core-sdk` once those packages are pinned. The deterministic hash helper is a preview checksum, not the final artifact hash.
- **Clone-and-build only.** No published npm package, no downloadable binary, no installer. `pnpm install && pnpm build` from a clone is the supported path.
- **Wallet host pending.** Mono Studio talks to the Monolythium desktop wallet's Studio tab over a sidecar boundary for approval payloads. The host side is in-flight; the wallet release that ships the Studio tab as a public default is not out yet.
- **API + CLI surface may change.** Until the first non-preview tag, expect breaking changes between commits.

Watch this repo for the first non-preview release before standing up anything you'd hate to migrate.

This repo currently contains:

- React Studio shell for tokens, contracts, templates, simulation, deployments, verification, MCP, and settings.
- Shared TypeScript devkit models and helpers.
- `mono-dev` headless CLI for project creation, build, validate, test, simulate, trace, deploy-plan, and verify-bundle.
- Native-dev MCP descriptor with the tool, resource, prompt, and approval boundary list.
- Guardrail scan for developer-facing source and templates.

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

After `pnpm build`, the CLI is available from `dist/cli/mono-dev.js`:

```bash
node dist/cli/mono-dev.js templates
node dist/cli/mono-dev.js new Counter --template counter-example --out /tmp
node dist/cli/mono-dev.js build /tmp/counter
node dist/cli/mono-dev.js simulate /tmp/counter
```

## Architecture

The app and CLI call the same `src/devkit` modules. Those modules are intentionally adapter-shaped so they can be replaced by canonical `mono-core-sdk` and `mono-core` bindings as soon as the source-of-truth packages are pinned.

Deploy, call, token-create, and publish flows produce approval payloads only. Signing and submission stay behind the wallet boundary.
