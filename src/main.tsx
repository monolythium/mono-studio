import React from "react";
import ReactDOM from "react-dom/client";
import {
  Blocks,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Cog,
  FileCode2,
  FolderGit2,
  KeyRound,
  Landmark,
  Layers3,
  ListChecks,
  PackagePlus,
  Play,
  RefreshCcw,
  ShieldCheck,
  TerminalSquare,
  WalletCards
} from "lucide-react";
import {
  buildArtifactBundle,
  createDeployPlan,
  createMrcTokenPlan,
  createProjectFromTemplate,
  createVerificationBundle,
  listTemplates,
  simulateCall,
  validateArtifactBundle
} from "./devkit/index.js";
import { readinessCheckNativeDev } from "./mcp/nativeDevMcp.js";
import type { MrcAssetKind, RiskLabel, TemplateManifest } from "./devkit/index.js";
import "./styles.css";

type Screen = "tokens" | "contracts" | "templates" | "simulator" | "deployments" | "verification" | "mcp" | "settings";

type NavItem = {
  id: Screen;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { id: "tokens", label: "Tokens", icon: PackagePlus },
  { id: "contracts", label: "Contracts", icon: FileCode2 },
  { id: "templates", label: "Templates", icon: Blocks },
  { id: "simulator", label: "Simulator", icon: Play },
  { id: "deployments", label: "Deployments", icon: WalletCards },
  { id: "verification", label: "Verification", icon: ClipboardCheck },
  { id: "mcp", label: "MCP", icon: TerminalSquare },
  { id: "settings", label: "Settings", icon: Cog }
];

const accountAddress = "mono1studioaccount00000000000000";
const project = createProjectFromTemplate("counter-example", "Counter", "/Users/alex/Mono/Counter");
const artifact = buildArtifactBundle(project.project, project.files);
const artifactValidation = validateArtifactBundle(artifact);
const simulation = simulateCall({ artifactBundle: artifact, call: "increment", args: { amount: "1" } });
const deployPlan = createDeployPlan({ chainId: "local-dev", from: accountAddress, artifactBundle: artifact });
const verification = createVerificationBundle(artifact, deployPlan, project.files);
const readiness = readinessCheckNativeDev();
const templates = listTemplates();

function riskClass(label: RiskLabel): string {
  return `risk ${label.severity}`;
}

function RiskList({ labels }: { labels: RiskLabel[] }) {
  return (
    <div className="risk-list">
      {labels.map((label) => (
        <div className={riskClass(label)} key={label.id} title={label.detail}>
          <span>{label.title}</span>
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function App() {
  const [screen, setScreen] = React.useState<Screen>("contracts");
  const [tokenKind, setTokenKind] = React.useState<MrcAssetKind>("mrc20-fixed-supply");
  const [tokenSymbol, setTokenSymbol] = React.useState("LYTHX");
  const [metadataMutable, setMetadataMutable] = React.useState(false);
  const [transferRestricted, setTransferRestricted] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateManifest>(templates.find((item) => item.id === "counter-example") ?? templates[0]);

  const tokenPlan = React.useMemo(
    () =>
      createMrcTokenPlan({
        assetKind: tokenKind,
        name: "Builder Credit",
        symbol: tokenSymbol,
        decimals: 8,
        supply: "100000000",
        issuerAddress: accountAddress,
        mintAuthority: tokenKind === "mrc20-fixed-supply" ? "none" : "issuer",
        metadataMutable,
        transferRestricted,
        allocations: [{ address: accountAddress, amount: "100000000" }]
      }),
    [metadataMutable, tokenKind, tokenSymbol, transferRestricted]
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/mono-studio.svg" alt="" />
          <div>
            <strong>Mono Studio</strong>
            <span>Native DevKit</span>
          </div>
        </div>
        <nav aria-label="Build">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={screen === item.id ? "nav-button active" : "nav-button"}
                key={item.id}
                onClick={() => setScreen(item.id)}
                title={item.label}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="wallet-summary">
          <KeyRound size={17} />
          <div>
            <span>Wallet approval</span>
            <strong>Required</strong>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Build</p>
            <h1>{navItems.find((item) => item.id === screen)?.label}</h1>
          </div>
          <div className="status-strip">
            <span>Chain: local-dev</span>
            <span>Workspace trusted</span>
            <span>Artifact ready</span>
          </div>
        </header>

        {screen === "tokens" && <TokensScreen tokenKind={tokenKind} setTokenKind={setTokenKind} tokenSymbol={tokenSymbol} setTokenSymbol={setTokenSymbol} metadataMutable={metadataMutable} setMetadataMutable={setMetadataMutable} transferRestricted={transferRestricted} setTransferRestricted={setTransferRestricted} tokenPlan={tokenPlan} />}
        {screen === "contracts" && <ContractsScreen />}
        {screen === "templates" && <TemplatesScreen selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />}
        {screen === "simulator" && <SimulatorScreen />}
        {screen === "deployments" && <DeploymentsScreen />}
        {screen === "verification" && <VerificationScreen />}
        {screen === "mcp" && <McpScreen />}
        {screen === "settings" && <SettingsScreen />}
      </main>
    </div>
  );
}

function TokensScreen({
  tokenKind,
  setTokenKind,
  tokenSymbol,
  setTokenSymbol,
  metadataMutable,
  setMetadataMutable,
  transferRestricted,
  setTransferRestricted,
  tokenPlan
}: {
  tokenKind: MrcAssetKind;
  setTokenKind: (value: MrcAssetKind) => void;
  tokenSymbol: string;
  setTokenSymbol: (value: string) => void;
  metadataMutable: boolean;
  setMetadataMutable: (value: boolean) => void;
  transferRestricted: boolean;
  setTransferRestricted: (value: boolean) => void;
  tokenPlan: ReturnType<typeof createMrcTokenPlan>;
}) {
  return (
    <section className="screen two-column">
      <div className="panel">
        <div className="panel-title">
          <Landmark size={18} />
          <h2>Asset Plan</h2>
        </div>
        <div className="form-grid">
          <Field label="Kind">
            <select value={tokenKind} onChange={(event) => setTokenKind(event.target.value as MrcAssetKind)}>
              <option value="mrc20-fixed-supply">MRC-20 fixed supply</option>
              <option value="mrc20-capped-mint">MRC-20 capped mint</option>
              <option value="mrc721-collection">MRC-721 collection</option>
              <option value="mrc1155-collection">MRC-1155 collection</option>
              <option value="mrc4626-vault">MRC-4626 vault</option>
            </select>
          </Field>
          <Field label="Symbol">
            <input value={tokenSymbol} onChange={(event) => setTokenSymbol(event.target.value.toUpperCase())} maxLength={12} />
          </Field>
          <Field label="Supply">
            <input readOnly value="100000000" />
          </Field>
          <Field label="Decimals">
            <input readOnly value="8" />
          </Field>
        </div>
        <div className="toggle-row">
          <label>
            <input type="checkbox" checked={metadataMutable} onChange={(event) => setMetadataMutable(event.target.checked)} />
            Mutable metadata
          </label>
          <label>
            <input type="checkbox" checked={transferRestricted} onChange={(event) => setTransferRestricted(event.target.checked)} />
            Transfer restrictions
          </label>
        </div>
        <div className="button-row">
          <button className="primary" type="button" title="Create wallet approval request">
            <WalletCards size={17} />
            Request Approval
          </button>
          <button type="button" title="Refresh token risk labels">
            <RefreshCcw size={17} />
            Recheck
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">
          <ShieldCheck size={18} />
          <h2>Token Passport Preview</h2>
        </div>
        <dl className="facts">
          <div>
            <dt>Name</dt>
            <dd>{tokenPlan.name}</dd>
          </div>
          <div>
            <dt>Policy</dt>
            <dd>{tokenPlan.supplyPolicy}</dd>
          </div>
          <div>
            <dt>Issuer</dt>
            <dd>{tokenPlan.issuerAddress}</dd>
          </div>
          <div>
            <dt>Admin roles</dt>
            <dd>{tokenPlan.adminRoles.length ? tokenPlan.adminRoles.join(", ") : "None"}</dd>
          </div>
        </dl>
        <RiskList labels={tokenPlan.riskLabels} />
      </div>
    </section>
  );
}

function ContractsScreen() {
  return (
    <section className="screen contract-layout">
      <div className="panel project-tree">
        <div className="panel-title">
          <FolderGit2 size={18} />
          <h2>{project.project.name}</h2>
        </div>
        <ul className="file-list">
          {Object.keys(project.files).map((path) => (
            <li key={path}>
              <Code2 size={15} />
              <span>{path}</span>
            </li>
          ))}
        </ul>
        <div className="button-row vertical">
          <button type="button" title="Open project in external editor">
            <Code2 size={17} />
            Open Editor
          </button>
          <button className="primary" type="button" title="Build artifact">
            <Play size={17} />
            Build
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <ListChecks size={18} />
          <h2>Build And Diagnostics</h2>
        </div>
        <div className="command-grid">
          <button type="button">
            <Play size={17} />
            Build
          </button>
          <button type="button">
            <CheckCircle2 size={17} />
            Validate
          </button>
          <button type="button">
            <ListChecks size={17} />
            Test
          </button>
          <button type="button">
            <TerminalSquare size={17} />
            Simulate
          </button>
        </div>
        <div className={artifactValidation.ok ? "diagnostic ok" : "diagnostic"}>
          <CheckCircle2 size={18} />
          <span>{artifactValidation.ok ? "Artifact validation passed" : artifactValidation.diagnostics.join(", ")}</span>
        </div>
        <pre>{JSON.stringify({ artifactHash: artifact.artifactHash, sourceBundleHash: artifact.sourceBundleHash }, null, 2)}</pre>
      </div>

      <div className="panel artifact-panel">
        <div className="panel-title">
          <Boxes size={18} />
          <h2>Artifact Inspector</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>Artifact hash</dt>
            <dd>{artifact.artifactHash}</dd>
          </div>
          <div>
            <dt>ABI hash</dt>
            <dd>{deployPlan.abiHash}</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>{artifact.storageNamespace}</dd>
          </div>
          <div>
            <dt>Memory</dt>
            <dd>{artifact.memoryLimits.initialPages} / {artifact.memoryLimits.maxPages} pages</dd>
          </div>
        </dl>
        <div className="syscall-list">
          {artifact.syscallImports.map((syscall) => (
            <span key={syscall}>{syscall}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesScreen({
  selectedTemplate,
  setSelectedTemplate
}: {
  selectedTemplate: TemplateManifest;
  setSelectedTemplate: (value: TemplateManifest) => void;
}) {
  return (
    <section className="screen templates-layout">
      <div className="template-grid">
        {templates.map((template) => (
          <button
            className={selectedTemplate.id === template.id ? "template-card active" : "template-card"}
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            type="button"
          >
            <span>{template.category}</span>
            <strong>{template.name}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="panel-title">
          <Blocks size={18} />
          <h2>Template Manifest</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>Template</dt>
            <dd>{selectedTemplate.id}</dd>
          </div>
          <div>
            <dt>Hash</dt>
            <dd>{selectedTemplate.deterministicBuildHash}</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>{selectedTemplate.license}</dd>
          </div>
        </dl>
        <div className="syscall-list">
          {selectedTemplate.expectedSyscalls.map((syscall) => (
            <span key={syscall}>{syscall}</span>
          ))}
        </div>
        <RiskList labels={selectedTemplate.riskLabels} />
      </div>
    </section>
  );
}

function SimulatorScreen() {
  return (
    <section className="screen simulator-layout">
      <div className="panel">
        <div className="panel-title">
          <Play size={18} />
          <h2>Local Simulation</h2>
        </div>
        <dl className="meter-grid">
          <div>
            <dt>Cycles</dt>
            <dd>{simulation.cyclesUsed.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Syscall units</dt>
            <dd>{simulation.syscallUnits}</dd>
          </div>
          <div>
            <dt>State I/O units</dt>
            <dd>{simulation.stateIoUnits}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{simulation.status}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button className="primary" type="button">
            <Play size={17} />
            Run
          </button>
          <button type="button">
            <RefreshCcw size={17} />
            Reset Fixture
          </button>
        </div>
      </div>
      <div className="panel trace-panel">
        <div className="panel-title">
          <Layers3 size={18} />
          <h2>Trace</h2>
        </div>
        <ol className="trace-list">
          {simulation.trace.map((entry) => (
            <li key={entry.step}>
              <span>{entry.step}</span>
              <strong>{entry.op}</strong>
              <em>{entry.units} units</em>
              <small>{entry.detail}</small>
            </li>
          ))}
        </ol>
      </div>
      <div className="panel">
        <div className="panel-title">
          <ClipboardCheck size={18} />
          <h2>State Diff</h2>
        </div>
        <pre>{JSON.stringify(simulation.stateDiff, null, 2)}</pre>
      </div>
    </section>
  );
}

function DeploymentsScreen() {
  const states = ["draft", "wallet review", "submitted", "confirmed"];
  return (
    <section className="screen two-column">
      <div className="panel">
        <div className="panel-title">
          <WalletCards size={18} />
          <h2>Deploy Plan</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>From</dt>
            <dd>{deployPlan.from}</dd>
          </div>
          <div>
            <dt>Expected address</dt>
            <dd>{deployPlan.expectedContractAddress}</dd>
          </div>
          <div>
            <dt>Execution units</dt>
            <dd>{deployPlan.executionUnitLimit.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Max fee</dt>
            <dd>{deployPlan.maxExecutionFeeLythoshi} lythoshi</dd>
          </div>
        </dl>
        <RiskList labels={deployPlan.riskLabels} />
      </div>
      <div className="panel">
        <div className="panel-title">
          <ChevronRight size={18} />
          <h2>Queue</h2>
        </div>
        <div className="deployment-list">
          {states.map((state, index) => (
            <div className={index === 0 ? "deployment-row active" : "deployment-row"} key={state}>
              <span>{index + 1}</span>
              <strong>{state}</strong>
              <small>{index === 0 ? artifact.artifactHash.slice(0, 18) : "waiting"}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VerificationScreen() {
  return (
    <section className="screen two-column">
      <div className="panel">
        <div className="panel-title">
          <ClipboardCheck size={18} />
          <h2>Verification Bundle</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>Bundle hash</dt>
            <dd>{verification.bundleHash}</dd>
          </div>
          <div>
            <dt>Files</dt>
            <dd>{verification.files.length}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{verification.passport.verificationStatus}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button className="primary" type="button">
            <ClipboardCheck size={17} />
            Publish
          </button>
          <button type="button">
            <ShieldCheck size={17} />
            Review Files
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">
          <ShieldCheck size={18} />
          <h2>Contract Passport</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>Address</dt>
            <dd>{verification.passport.address}</dd>
          </div>
          <div>
            <dt>Artifact</dt>
            <dd>{verification.passport.artifactHash}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{verification.passport.sourceBundleHash}</dd>
          </div>
          <div>
            <dt>Issuer</dt>
            <dd>{verification.passport.issuer}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function McpScreen() {
  return (
    <section className="screen mcp-layout">
      <div className="panel">
        <div className="panel-title">
          <TerminalSquare size={18} />
          <h2>Native Dev MCP</h2>
        </div>
        <dl className="meter-grid">
          <div>
            <dt>Profile</dt>
            <dd>{readiness.profile}</dd>
          </div>
          <div>
            <dt>Tools</dt>
            <dd>{readiness.tools}</dd>
          </div>
          <div>
            <dt>Boundary</dt>
            <dd>{readiness.walletBoundary}</dd>
          </div>
          <div>
            <dt>Prompts</dt>
            <dd>{readiness.prompts.length}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button className="primary" type="button">
            <Play size={17} />
            Start
          </button>
          <button type="button">
            <ClipboardCheck size={17} />
            Copy Config
          </button>
        </div>
      </div>
      <div className="panel tool-list">
        <div className="panel-title">
          <ListChecks size={18} />
          <h2>Tool List</h2>
        </div>
        {readiness.resources.slice(0, 5).map((resource) => (
          <div className="tool-row" key={resource}>
            <span>{resource}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsScreen() {
  return (
    <section className="screen settings-layout">
      <div className="panel">
        <div className="panel-title">
          <Cog size={18} />
          <h2>Workspace</h2>
        </div>
        <dl className="facts compact">
          <div>
            <dt>Root</dt>
            <dd>{project.project.rootPath}</dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd>{project.project.templateId}</dd>
          </div>
          <div>
            <dt>SDK</dt>
            <dd>{project.project.sdkVersion}</dd>
          </div>
        </dl>
      </div>
      <div className="panel">
        <div className="panel-title">
          <ShieldCheck size={18} />
          <h2>Guardrails</h2>
        </div>
        <div className="diagnostic ok">
          <CheckCircle2 size={18} />
          <span>Native developer scan is configured for source and templates.</span>
        </div>
        <div className="diagnostic ok">
          <CheckCircle2 size={18} />
          <span>Wallet approval is required for deploy, call, asset, and publish actions.</span>
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
