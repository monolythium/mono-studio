import { monoHash, shortHash } from "./hash.js";
import type { MrvArtifactBundle, SimulationResult } from "./types.js";

export type SimulateInput = {
  artifactBundle: MrvArtifactBundle;
  call: string;
  args: Record<string, string>;
};

export function simulateCall(input: SimulateInput): SimulationResult {
  const seed = monoHash({
    artifactHash: input.artifactBundle.artifactHash,
    call: input.call,
    args: input.args
  });
  const units = 24_000 + Number.parseInt(seed.slice(0, 4), 16);
  const stateKey = `${input.artifactBundle.storageNamespace}.${input.call}`;

  return {
    status: "ok",
    returnData: `ok:${shortHash(seed, 10)}`,
    cyclesUsed: units * 3,
    syscallUnits: input.artifactBundle.syscallImports.length * 120,
    stateIoUnits: 2,
    events: [
      {
        name: `${input.call}.completed`,
        data: {
          result: shortHash(seed, 8)
        }
      }
    ],
    stateDiff: [
      {
        key: stateKey,
        before: "0",
        after: input.args.amount ?? "1"
      }
    ],
    nativeDeltas: [],
    trace: [
      {
        step: 1,
        op: "state.read",
        units: 80,
        detail: stateKey
      },
      {
        step: 2,
        op: input.call,
        units,
        detail: "contract export"
      },
      {
        step: 3,
        op: "event.emit",
        units: 40,
        detail: `${input.call}.completed`
      }
    ],
    diagnostics: ["Simulation completed with deterministic local fixture state."]
  };
}
