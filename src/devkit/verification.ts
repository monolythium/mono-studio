import { monoHash } from "./hash.js";
import type { ContractPassport, DeployPlan, MrvArtifactBundle } from "./types.js";

export type VerificationBundle = {
  bundleHash: string;
  passport: ContractPassport;
  artifact: {
    artifactHash: string;
    sourceBundleHash: string;
    abiHash: string;
  };
  files: Array<{
    path: string;
    hash: string;
  }>;
};

export function createContractPassport(bundle: MrvArtifactBundle, deployPlan: DeployPlan): ContractPassport {
  return {
    address: deployPlan.expectedContractAddress,
    artifactHash: bundle.artifactHash,
    sourceBundleHash: bundle.sourceBundleHash,
    abiHash: deployPlan.abiHash,
    compilerVersion: "mrv-riscv-native-dev-preview",
    sdkVersion: bundle.buildMetadata.sdkVersion,
    templateId: bundle.buildMetadata.templateId,
    verificationStatus: "draft",
    riskLabels: deployPlan.riskLabels,
    issuer: deployPlan.from
  };
}

export function createVerificationBundle(
  artifactBundle: MrvArtifactBundle,
  deployPlan: DeployPlan,
  sources: Record<string, string>
): VerificationBundle {
  const passport = createContractPassport(artifactBundle, deployPlan);
  const files = Object.entries(sources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, content]) => ({
      path,
      hash: monoHash(content)
    }));

  return {
    bundleHash: monoHash({
      passport,
      files
    }),
    passport,
    artifact: {
      artifactHash: artifactBundle.artifactHash,
      sourceBundleHash: artifactBundle.sourceBundleHash,
      abiHash: deployPlan.abiHash
    },
    files
  };
}
