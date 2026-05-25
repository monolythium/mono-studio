export type RiskSeverity = "info" | "warning" | "critical";

export type RiskLabel = {
  id: string;
  title: string;
  severity: RiskSeverity;
  detail: string;
};

export type MonoAddressKind = "account" | "contract" | "asset";

export type MonoAddress = {
  value: string;
  kind: MonoAddressKind;
};

export type MonoProject = {
  id: string;
  name: string;
  rootPath: string;
  templateId: string;
  packageManager: "cargo" | "none";
  mrvProfile: "debug" | "release";
  sdkVersion: string;
  monoCoreCommit: string;
  createdAt: string;
  lastOpenedAt: string;
};

export type AbiManifest = {
  name: string;
  version: string;
  exports: Array<{
    name: string;
    inputs: string[];
    output: string;
    mutatesState: boolean;
  }>;
};

export type MrvArtifactBundle = {
  artifactBytes: string;
  artifactHash: string;
  codeHash: string;
  abiManifest: AbiManifest;
  syscallImports: string[];
  memoryLimits: {
    initialPages: number;
    maxPages: number;
  };
  storageNamespace: string;
  buildMetadata: {
    templateId: string;
    profile: MonoProject["mrvProfile"];
    sdkVersion: string;
    monoCoreCommit: string;
    builtAt: string;
  };
  debugMapHash?: string;
  sourceBundleHash: string;
};

export type MrcAssetKind =
  | "mrc20-fixed-supply"
  | "mrc20-capped-mint"
  | "mrc721-collection"
  | "mrc1155-collection"
  | "mrc4626-vault";

export type TokenAllocation = {
  address: string;
  amount: string;
};

export type MrcTokenPlan = {
  assetKind: MrcAssetKind;
  name: string;
  symbol: string;
  decimals: number;
  supplyPolicy: "fixed" | "capped" | "collection" | "vault";
  mintPolicy: "none" | "issuer" | "role";
  transferPolicy: "open" | "restricted";
  metadataPolicy: "immutable" | "mutable";
  adminRoles: string[];
  issuerAddress: string;
  initialAllocations: TokenAllocation[];
  marketRequest?: {
    quoteAsset: string;
    initialLiquidity: string;
  };
  riskLabels: RiskLabel[];
};

export type DeployPlan = {
  chainId: string;
  from: string;
  expectedContractAddress: string;
  artifactHash: string;
  abiHash: string;
  valueLythoshi: string;
  executionUnitLimit: number;
  maxExecutionFeeLythoshi: string;
  constructorInput: Record<string, unknown>;
  riskLabels: RiskLabel[];
  walletApprovalPayload: {
    kind: "mrv-deploy";
    summary: string;
    artifactHash: string;
    expectedContractAddress: string;
    feeCapLythoshi: string;
    valueLythoshi: string;
  };
};

export type SimulationEvent = {
  name: string;
  data: Record<string, string>;
};

export type SimulationTraceEntry = {
  step: number;
  op: string;
  units: number;
  detail: string;
};

export type SimulationResult = {
  status: "ok" | "failed";
  returnData: string;
  cyclesUsed: number;
  syscallUnits: number;
  stateIoUnits: number;
  events: SimulationEvent[];
  stateDiff: Array<{
    key: string;
    before: string;
    after: string;
  }>;
  nativeDeltas: Array<{
    asset: string;
    address: string;
    delta: string;
  }>;
  trace: SimulationTraceEntry[];
  diagnostics: string[];
};

export type ContractPassport = {
  address: string;
  artifactHash: string;
  sourceBundleHash: string;
  abiHash: string;
  compilerVersion: string;
  sdkVersion: string;
  templateId?: string;
  verificationStatus: "draft" | "submitted" | "verified" | "rejected";
  riskLabels: RiskLabel[];
  deployTx?: string;
  issuer: string;
};

export type TemplateManifest = {
  id: string;
  name: string;
  category: "asset" | "contract" | "policy" | "example";
  description: string;
  license: string;
  deterministicBuildHash: string;
  expectedSyscalls: string[];
  riskLabels: RiskLabel[];
};

export type TemplateProject = {
  manifest: TemplateManifest;
  project: MonoProject;
  files: Record<string, string>;
};
