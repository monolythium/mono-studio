import { monoHash } from "./hash.js";
import { getTemplate } from "./templates.js";
import type { AbiManifest, MonoProject, MrvArtifactBundle } from "./types.js";

export type ArtifactValidation = {
  ok: boolean;
  diagnostics: string[];
};

export function defaultAbiManifest(name: string): AbiManifest {
  return {
    name,
    version: "1",
    exports: [
      {
        name: "init",
        inputs: [],
        output: "u64",
        mutatesState: true
      },
      {
        name: "increment",
        inputs: ["u64"],
        output: "u64",
        mutatesState: true
      },
      {
        name: "read",
        inputs: [],
        output: "u64",
        mutatesState: false
      }
    ]
  };
}

export function buildArtifactBundle(project: MonoProject, sources: Record<string, string>): MrvArtifactBundle {
  const template = getTemplate(project.templateId);
  const sourceBundleHash = monoHash(sources);
  const abiManifest = defaultAbiManifest(project.name);
  const codeHash = monoHash({
    projectId: project.id,
    profile: project.mrvProfile,
    sources
  });
  const artifactBytes = monoHash({
    codeHash,
    abiManifest,
    sourceBundleHash
  });

  return {
    artifactBytes,
    artifactHash: monoHash({ artifactBytes, templateId: project.templateId }),
    codeHash,
    abiManifest,
    syscallImports: template.expectedSyscalls,
    memoryLimits: {
      initialPages: 2,
      maxPages: 16
    },
    storageNamespace: `mrv.${project.id}`,
    buildMetadata: {
      templateId: project.templateId,
      profile: project.mrvProfile,
      sdkVersion: project.sdkVersion,
      monoCoreCommit: project.monoCoreCommit,
      builtAt: new Date().toISOString()
    },
    debugMapHash: project.mrvProfile === "debug" ? monoHash({ debug: sources }) : undefined,
    sourceBundleHash
  };
}

export function validateArtifactBundle(bundle: MrvArtifactBundle): ArtifactValidation {
  const diagnostics: string[] = [];

  if (bundle.artifactHash.length !== 64) diagnostics.push("Artifact hash must be 64 lowercase hex characters.");
  if (bundle.codeHash.length !== 64) diagnostics.push("Code hash must be 64 lowercase hex characters.");
  if (bundle.abiManifest.exports.length === 0) diagnostics.push("ABI manifest must expose at least one entry.");
  if (bundle.memoryLimits.initialPages < 1) diagnostics.push("Initial memory pages must be positive.");
  if (bundle.memoryLimits.maxPages < bundle.memoryLimits.initialPages) diagnostics.push("Max memory pages must not be below initial pages.");
  if (!bundle.storageNamespace.startsWith("mrv.")) diagnostics.push("Storage namespace must use an mrv prefix.");
  if (bundle.syscallImports.length === 0) diagnostics.push("Expected syscall imports are missing.");

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}
