# Contributing to Mono Studio

Thanks for considering a contribution. Mono Studio is in **preview** — the API and CLI surface are still moving — so the most useful contributions today are bug reports, doc fixes, template proposals, and small focused PRs against existing modules.

## Before opening a pull request

Run all three gates locally — there is no CI workflow in the repo today, so the burden is on you:

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # build:node + devkit tests + no-evm guardrail scan
pnpm build       # no-evm + tsc --noEmit + vite build + CLI build
```

Keep all three green before opening the PR.

## Scope of changes we're looking for

- **Bug fixes** in `src/devkit/`, `src/cli/`, or the Studio shell — welcome any time.
- **Doc fixes** in `README.md`, `CONTRIBUTING.md`, or `docs/` — welcome any time.
- **New templates** under `templates/` — please follow the shape of [`templates/counter-example/`](./templates/counter-example/) (a `mono-template.json` manifest + a `src/` directory + at least one fixture test).
- **New `mono-dev` subcommands** — open an issue first so we can align on the surface before the work lands.
- **Changes to `src/mcp/nativeDevMcp.ts` (the MCP descriptor)** — these are public-API changes; please link a matching update to [`docs/mcp-profile.md`](./docs/mcp-profile.md) in your PR description.
- **Changes to `src/devkit/types.ts` or any devkit module shape** — same: link the matching doc update.

## What we'll likely push back on

- New EVM / Solidity / Hardhat / Foundry vocabulary anywhere in `src/` or `templates/`. The `pnpm no-evm` scan catches this — please don't add an allowlist entry without a doc rationale.
- Direct chain RPC calls outside the adapter boundary. Deploy, call, asset creation, market request, approval request, and passport publication flows produce **approval payloads only**; the wallet is the only signer.
- Adding a dependency that already has a maintained TypeScript-native alternative. Mono Studio aims for a small dependency footprint.

## Commit + PR conventions

- Plain English in the imperative ("Add foo", "Fix bar") — no emoji, no `:phase:` or colon-prefixes.
- One logical change per commit when practical. Squash before merge if a PR grew several commits during review.
- Reference the relevant doc or issue in the PR description.

## Security

If you've found a vulnerability, please **do not open a public issue**. Email `security@monolythium.com` and we'll coordinate disclosure.

## Code of conduct

Be respectful. Disagree on technical merit. Don't be a jerk.
