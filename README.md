# Mono Studio

Mono Studio is the native builder shell for MRV contracts, MRC assets, wallet approval plans, local simulation, template registry workflows, and AI-assisted development.

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
