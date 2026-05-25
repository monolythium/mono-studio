import { requireMonoAddress } from "./address.js";
import { monoHash } from "./hash.js";
import type { DeployPlan, MrvArtifactBundle, RiskLabel } from "./types.js";

export type DeployPlanInput = {
  chainId: string;
  from: string;
  artifactBundle: MrvArtifactBundle;
  valueLythoshi?: string;
  executionUnitLimit?: number;
  maxExecutionFeeLythoshi?: string;
  constructorInput?: Record<string, unknown>;
};

function riskLabel(id: string, title: string, severity: RiskLabel["severity"], detail: string): RiskLabel {
  return {
    id,
    title,
    severity,
    detail
  };
}

export function createDeployPlan(input: DeployPlanInput): DeployPlan {
  requireMonoAddress(input.from, "account");

  const executionUnitLimit = input.executionUnitLimit ?? 1_250_000;
  const maxExecutionFeeLythoshi = input.maxExecutionFeeLythoshi ?? String(executionUnitLimit * 8);
  const valueLythoshi = input.valueLythoshi ?? "0";
  const expectedContractAddress = `monoc1${monoHash({
    chainId: input.chainId,
    from: input.from,
    artifactHash: input.artifactBundle.artifactHash
  }).slice(0, 38)}`;
  const abiHash = monoHash(input.artifactBundle.abiManifest);

  const riskLabels: RiskLabel[] = [
    riskLabel("artifact-hash", "Artifact hash locked", "info", "Wallet approval must show the same artifact hash."),
    riskLabel("fee-cap", "Fee cap set", "info", "Execution cannot exceed the declared fee cap."),
    valueLythoshi === "0"
      ? riskLabel("no-value", "No value transfer", "info", "Deployment does not attach native value.")
      : riskLabel("value-attached", "Value attached", "warning", "Deployment attaches native value.")
  ];

  return {
    chainId: input.chainId,
    from: input.from,
    expectedContractAddress,
    artifactHash: input.artifactBundle.artifactHash,
    abiHash,
    valueLythoshi,
    executionUnitLimit,
    maxExecutionFeeLythoshi,
    constructorInput: input.constructorInput ?? {},
    riskLabels,
    walletApprovalPayload: {
      kind: "mrv-deploy",
      summary: `Deploy ${input.artifactBundle.abiManifest.name}`,
      artifactHash: input.artifactBundle.artifactHash,
      expectedContractAddress,
      feeCapLythoshi: maxExecutionFeeLythoshi,
      valueLythoshi
    }
  };
}
