# Native Dev MCP Profile

`src/mcp/nativeDevMcp.ts` defines the native developer tool list, resources, prompts, and wallet approval flags.

The profile is intentionally read/write scoped:

- project creation may write files only under a selected workspace root;
- build, validate, test, simulate, trace, and inspect commands do not require wallet approval;
- deploy, call, asset creation, market request, approval request, and passport publication require wallet approval;
- signing and submission are outside MCP authority unless a wallet-approved payload exists.

The future MCP binary can import this descriptor and bind each tool to the shared `src/devkit` functions.
