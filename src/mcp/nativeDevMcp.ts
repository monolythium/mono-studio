export type NativeDevTool = {
  name: string;
  purpose: string;
  requiresWalletApproval: boolean;
  writesWorkspace: boolean;
};

export type NativeDevPrompt = {
  name: string;
  description: string;
};

const nativeDevToolRows = [
  ["mrv_project_new", "Create a project from a signed native template.", false, true],
  ["mrv_template_list", "List available template manifests and hashes.", false, false],
  ["mrv_template_get", "Read a selected template manifest.", false, false],
  ["mrv_build", "Build a project artifact through the configured devkit.", false, false],
  ["mrv_validate_artifact", "Validate artifact shape, ABI manifest, syscalls, and metadata.", false, false],
  ["mrv_test", "Run local project tests.", false, false],
  ["mrv_simulate_call", "Simulate a contract call with local fixture state.", false, false],
  ["mrv_trace", "Return syscall and state trace details from a simulation.", false, false],
  ["mrv_abi_inspect", "Inspect exported contract calls and typed fields.", false, false],
  ["mrv_receipt_decode", "Decode native receipts into typed events and state changes.", false, false],
  ["mrv_deploy_plan", "Prepare a deploy plan for wallet review.", true, false],
  ["mrv_call_plan", "Prepare a call plan for wallet review.", true, false],
  ["mrc_token_plan", "Create a native asset plan with risk labels.", true, false],
  ["mrc_token_validate", "Validate a native asset plan before approval.", false, false],
  ["mrc_market_plan", "Draft an optional market request for approved quote assets.", true, false],
  ["wallet_approval_request", "Submit an approval request to the wallet boundary.", true, false],
  ["monoscan_verify_bundle", "Prepare a source and artifact verification bundle.", false, false],
  ["monoscan_publish_passport", "Publish approved passport metadata after user confirmation.", true, false],
  ["security_review", "Review workspace, artifact, and role risks.", false, false],
  ["readiness_check_native_dev", "Check local compiler, template, and wallet bridge readiness.", false, false]
 ] as const satisfies ReadonlyArray<readonly [string, string, boolean, boolean]>;

export const nativeDevTools: NativeDevTool[] = nativeDevToolRows.map(([name, purpose, requiresWalletApproval, writesWorkspace]) => ({
  name,
  purpose,
  requiresWalletApproval,
  writesWorkspace
}));

export const nativeDevResources = [
  "mono://docs/mrv",
  "mono://docs/mrc",
  "mono://docs/syscalls",
  "mono://docs/templates",
  "mono://docs/no-evm",
  "mono://project/current",
  "mono://project/artifacts",
  "mono://project/test-results",
  "mono://project/security-review"
];

export const nativeDevPrompts: NativeDevPrompt[] = [
  {
    name: "Create an MRC-20 token safely",
    description: "Collect issuer, supply, metadata, role, and allocation requirements before creating an asset plan."
  },
  {
    name: "Create an MRV contract from a template",
    description: "Pick a native template, write files inside the selected workspace, then build and simulate."
  },
  {
    name: "Review this MRV contract for native risks",
    description: "Inspect syscalls, value movement, state changes, roles, and deployment settings."
  },
  {
    name: "Explain this syscall trace",
    description: "Summarize execution units, state reads and writes, events, and diagnostics."
  },
  {
    name: "Prepare a deploy plan for wallet approval",
    description: "Create a reviewable deployment payload with artifact hash, expected address, fee cap, and risk labels."
  }
];

export function readinessCheckNativeDev() {
  return {
    profile: "native-dev",
    walletBoundary: "approval-required",
    tools: nativeDevTools.length,
    resources: nativeDevResources,
    prompts: nativeDevPrompts.map((prompt) => prompt.name)
  };
}
