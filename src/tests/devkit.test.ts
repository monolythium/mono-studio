import assert from "node:assert/strict";
import {
  buildArtifactBundle,
  createDeployPlan,
  createMrcTokenPlan,
  createProjectFromTemplate,
  createVerificationBundle,
  listTemplates,
  simulateCall,
  validateMonoAddress
} from "../devkit/index.js";
import { nativeDevTools } from "../mcp/nativeDevMcp.js";

const account = "mono1qqqqqqqqqqqqqqqqqqqqqqqqqqqq";

const templates = listTemplates();
assert.ok(templates.length >= 12);
assert.ok(templates.some((template) => template.id === "counter-example"));

const project = createProjectFromTemplate("counter-example", "Counter", "/tmp/counter");
assert.equal(project.project.templateId, "counter-example");
assert.ok(project.files["src/lib.rs"]?.includes("increment"));

const artifact = buildArtifactBundle(project.project, project.files);
assert.equal(artifact.artifactHash.length, 64);
assert.equal(artifact.abiManifest.exports[1]?.name, "increment");

const simulation = simulateCall({ artifactBundle: artifact, call: "increment", args: { amount: "1" } });
assert.equal(simulation.status, "ok");
assert.equal(simulation.trace.length, 3);

const token = createMrcTokenPlan({
  assetKind: "mrc20-fixed-supply",
  name: "Native Test",
  symbol: "NTST",
  decimals: 8,
  supply: "100000000",
  issuerAddress: account,
  mintAuthority: "none",
  metadataMutable: false,
  transferRestricted: false,
  allocations: [{ address: account, amount: "100000000" }]
});
assert.equal(token.supplyPolicy, "fixed");
assert.equal(token.adminRoles.length, 0);

const plan = createDeployPlan({
  chainId: "local-dev",
  from: account,
  artifactBundle: artifact
});
assert.ok(plan.expectedContractAddress.startsWith("monoc1"));
assert.equal(plan.valueLythoshi, "0");

const verification = createVerificationBundle(artifact, plan, project.files);
assert.equal(verification.passport.address, plan.expectedContractAddress);
assert.equal(verification.artifact.artifactHash, artifact.artifactHash);

const rejectedPrefix = validateMonoAddress(`${String.fromCharCode(48)}${String.fromCharCode(120)}abc`, "contract");
assert.equal(rejectedPrefix.ok, false);

assert.equal(nativeDevTools.some((tool) => tool.name === "mrv_deploy_plan" && tool.requiresWalletApproval), true);

console.log("devkit tests passed");
