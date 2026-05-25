import { monoHash, shortHash } from "./hash.js";
import type { RiskLabel, TemplateManifest, TemplateProject } from "./types.js";

const SDK_VERSION = "0.1.0-native-dev";
const CORE_COMMIT = "pending-core-pin";

const risk = (id: string, title: string, detail: string): RiskLabel => ({
  id,
  title,
  severity: "info",
  detail
});

const templateSeed: Array<Omit<TemplateManifest, "deterministicBuildHash">> = [
  {
    id: "mrc20-fixed-supply",
    name: "MRC-20 Fixed Supply",
    category: "asset",
    description: "Native fungible asset with immutable supply.",
    license: "Apache-2.0",
    expectedSyscalls: ["asset.create", "asset.allocate"],
    riskLabels: [risk("fixed-supply", "Fixed supply", "No mint role is present after creation.")]
  },
  {
    id: "mrc20-capped-mint",
    name: "MRC-20 Capped Mint",
    category: "asset",
    description: "Native fungible asset with an issuer-controlled capped mint policy.",
    license: "Apache-2.0",
    expectedSyscalls: ["asset.create", "asset.mint", "role.check"],
    riskLabels: [risk("mint-cap", "Capped mint", "Minting is constrained by a declared cap.")]
  },
  {
    id: "mrc721-drop",
    name: "MRC-721 Drop",
    category: "asset",
    description: "Collection drop with immutable item metadata option.",
    license: "Apache-2.0",
    expectedSyscalls: ["collection.create", "collection.mint"],
    riskLabels: [risk("collection-admin", "Collection admin", "Issuer controls the initial collection setup.")]
  },
  {
    id: "mrc1155-game-items",
    name: "MRC-1155 Game Items",
    category: "asset",
    description: "Multi-item collection with role-limited minting.",
    license: "Apache-2.0",
    expectedSyscalls: ["collection.create", "collection.mint", "role.check"],
    riskLabels: [risk("role-mint", "Role minting", "Minting requires a configured role.")]
  },
  {
    id: "mrc4626-vault",
    name: "MRC-4626 Vault",
    category: "asset",
    description: "Native vault asset template for tokenized share accounting.",
    license: "Apache-2.0",
    expectedSyscalls: ["asset.create", "vault.account"],
    riskLabels: [risk("vault-accounting", "Vault accounting", "Share math must be reviewed against fixture results.")]
  },
  {
    id: "vesting-lockup",
    name: "Vesting Lockup",
    category: "contract",
    description: "Time-based release schedule with issuer-defined beneficiaries.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "time.now", "asset.transfer"],
    riskLabels: [risk("schedule-bound", "Schedule bound", "Release rules depend on the configured schedule.")]
  },
  {
    id: "merchant-escrow",
    name: "Merchant Escrow",
    category: "contract",
    description: "Two-party escrow with receipt-aware settlement.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "asset.transfer"],
    riskLabels: [risk("escrow-admin", "Escrow admin", "Dispute paths must be configured before deployment.")]
  },
  {
    id: "agent-spending-policy",
    name: "Agent Spending Policy",
    category: "policy",
    description: "Bounded allowance contract for local agents and services.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "asset.transfer", "role.check"],
    riskLabels: [risk("spend-cap", "Spend cap", "Outgoing value is constrained by configured policy limits.")]
  },
  {
    id: "subscription-payments",
    name: "Subscription Payments",
    category: "contract",
    description: "Recurring payment authorization with cancelable terms.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "asset.transfer", "time.now"],
    riskLabels: [risk("recurring", "Recurring transfer", "Payment cadence and maximum amount are explicit.")]
  },
  {
    id: "clob-market-maker",
    name: "CLOB Market Maker",
    category: "contract",
    description: "Strategy shell for native order placement and inventory controls.",
    license: "Apache-2.0",
    expectedSyscalls: ["market.quote", "market.order", "state.write"],
    riskLabels: [risk("inventory", "Inventory policy", "Strategy limits are enforced by local state.")]
  },
  {
    id: "bridge-imported-asset-adapter",
    name: "Imported Asset Adapter",
    category: "contract",
    description: "Accounting adapter for assets imported from external settlement paths.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "asset.transfer"],
    riskLabels: [risk("external-route", "External route", "Imported balances depend on a separate verification path.")]
  },
  {
    id: "counter-example",
    name: "Counter Example",
    category: "example",
    description: "Minimal MRV contract with increment and read calls.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write", "event.emit"],
    riskLabels: [risk("example", "Example contract", "This template is intended for test deployments.")]
  },
  {
    id: "hello-storage",
    name: "Hello Storage",
    category: "example",
    description: "Small state storage contract for first-run validation.",
    license: "Apache-2.0",
    expectedSyscalls: ["state.read", "state.write"],
    riskLabels: [risk("example", "Example contract", "This template is intended for test deployments.")]
  }
];

export const templateRegistry: TemplateManifest[] = templateSeed.map((template) => ({
  ...template,
  deterministicBuildHash: monoHash({
    id: template.id,
    expectedSyscalls: template.expectedSyscalls,
    license: template.license
  })
}));

export function listTemplates(): TemplateManifest[] {
  return templateRegistry;
}

export function getTemplate(templateId: string): TemplateManifest {
  const template = templateRegistry.find((entry) => entry.id === templateId);
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }
  return template;
}

export function createProjectFromTemplate(templateId: string, name: string, rootPath = "."): TemplateProject {
  const manifest = getTemplate(templateId);
  const now = new Date().toISOString();
  const projectId = `mono-project-${shortHash({ templateId, name, now })}`;
  const safeName = name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "mono-project";

  const project = {
    id: projectId,
    name,
    rootPath,
    templateId,
    packageManager: "cargo" as const,
    mrvProfile: "debug" as const,
    sdkVersion: SDK_VERSION,
    monoCoreCommit: CORE_COMMIT,
    createdAt: now,
    lastOpenedAt: now
  };

  const files = buildTemplateFiles(manifest, safeName);
  return {
    manifest,
    project,
    files: {
      "mono.project.json": `${JSON.stringify(project, null, 2)}\n`,
      "template.manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
      ...files
    }
  };
}

function buildTemplateFiles(manifest: TemplateManifest, packageName: string): Record<string, string> {
  const contractName = manifest.id.replace(/[^a-z0-9]+/g, "_");
  const stateKey = `${contractName}.value`;

  return {
    "Cargo.toml": `[package]
name = "${packageName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[profile.release]
opt-level = "z"
lto = true
`,
    "src/lib.rs": `#![no_std]

pub fn init() -> u64 {
    0
}

pub fn increment(current: u64, amount: u64) -> u64 {
    current.saturating_add(amount)
}

pub fn read(current: u64) -> u64 {
    current
}
`,
    "tests/fixture.json": `${JSON.stringify(
      {
        templateId: manifest.id,
        state: {
          [stateKey]: "0"
        },
        calls: [
          {
            name: "increment",
            input: {
              amount: "1"
            },
            expect: {
              value: "1"
            }
          }
        ]
      },
      null,
      2
    )}\n`,
    "SECURITY.md": `# Security Notes

- Template: ${manifest.name}
- Expected syscalls: ${manifest.expectedSyscalls.join(", ")}
- Review role and value movement settings before deployment.
`,
    "README.md": `# ${manifest.name}

${manifest.description}

Run local checks with:

\`\`\`bash
mono-dev build
mono-dev test
mono-dev simulate
\`\`\`
`
  };
}
