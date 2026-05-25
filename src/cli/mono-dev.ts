#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  buildArtifactBundle,
  createDeployPlan,
  createProjectFromTemplate,
  createVerificationBundle,
  listTemplates,
  simulateCall,
  validateArtifactBundle
} from "../devkit/index.js";
import type { MonoProject, MrvArtifactBundle } from "../devkit/index.js";

type ParsedArgs = {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index] ?? "";
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(value);
    }
  }

  return { command, positional, flags };
}

function flagText(flags: Record<string, string | boolean>, name: string, fallback: string): string {
  const value = flags[name];
  return typeof value === "string" ? value : fallback;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeProjectFiles(root: string, files: Record<string, string>): void {
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(root, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

function findFiles(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      const relative = absolute.slice(root.length + 1);
      if (relative.startsWith("target")) continue;
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        walk(absolute);
      } else {
        out[relative] = readFileSync(absolute, "utf8");
      }
    }
  };
  walk(root);
  return out;
}

function loadProject(root: string): MonoProject {
  const projectPath = join(root, "mono.project.json");
  if (!existsSync(projectPath)) {
    throw new Error(`No mono.project.json found in ${root}.`);
  }
  return readJson<MonoProject>(projectPath);
}

function loadArtifact(path: string): MrvArtifactBundle {
  if (!existsSync(path)) {
    throw new Error(`Artifact bundle not found: ${path}`);
  }
  return readJson<MrvArtifactBundle>(path);
}

function buildProject(root: string): MrvArtifactBundle {
  const project = loadProject(root);
  const sources = findFiles(root);
  const bundle = buildArtifactBundle(project, sources);
  const targetPath = join(root, "target", "mono", `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mrv.json`);
  writeJson(targetPath, bundle);
  return bundle;
}

function print(value: unknown): void {
  if (typeof value === "string") {
    process.stdout.write(`${value}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  }
}

function help(): void {
  print(`mono-dev commands

mono-dev templates
mono-dev new <name> --template counter-example --out .
mono-dev build [project-root]
mono-dev validate <artifact-json>
mono-dev test [project-root]
mono-dev simulate [project-root]
mono-dev trace [project-root]
mono-dev deploy-plan <artifact-json> --from mono1... --chain local-dev
mono-dev verify-bundle <artifact-json> --from mono1... --out target/mono/verification.json
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case "help":
    case "--help":
    case "-h":
      help();
      return;

    case "templates":
      print(listTemplates());
      return;

    case "new": {
      const name = args.positional[0] ?? "counter";
      const template = flagText(args.flags, "template", "counter-example");
      const out = resolve(flagText(args.flags, "out", "."));
      const root = join(out, name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "mono-project");
      const project = createProjectFromTemplate(template, name, root);
      mkdirSync(root, { recursive: true });
      writeProjectFiles(root, project.files);
      print({
        created: root,
        template: project.manifest.id,
        project: project.project.id
      });
      return;
    }

    case "build": {
      const root = resolve(args.positional[0] ?? ".");
      const bundle = buildProject(root);
      print({
        artifactHash: bundle.artifactHash,
        sourceBundleHash: bundle.sourceBundleHash,
        syscalls: bundle.syscallImports
      });
      return;
    }

    case "validate": {
      const artifactPath = resolve(args.positional[0] ?? "");
      const result = validateArtifactBundle(loadArtifact(artifactPath));
      print(result);
      if (!result.ok) process.exitCode = 1;
      return;
    }

    case "test": {
      const root = resolve(args.positional[0] ?? ".");
      const bundle = buildProject(root);
      const result = validateArtifactBundle(bundle);
      print({
        ok: result.ok,
        diagnostics: result.diagnostics,
        artifactHash: bundle.artifactHash
      });
      if (!result.ok) process.exitCode = 1;
      return;
    }

    case "simulate": {
      const root = resolve(args.positional[0] ?? ".");
      const bundle = buildProject(root);
      print(simulateCall({ artifactBundle: bundle, call: "increment", args: { amount: "1" } }));
      return;
    }

    case "trace": {
      const root = resolve(args.positional[0] ?? ".");
      const bundle = buildProject(root);
      print(simulateCall({ artifactBundle: bundle, call: "increment", args: { amount: "1" } }).trace);
      return;
    }

    case "deploy-plan": {
      const artifactPath = resolve(args.positional[0] ?? "");
      const from = flagText(args.flags, "from", "");
      const chainId = flagText(args.flags, "chain", "local-dev");
      print(createDeployPlan({ chainId, from, artifactBundle: loadArtifact(artifactPath) }));
      return;
    }

    case "verify-bundle": {
      const artifactPath = resolve(args.positional[0] ?? "");
      const artifact = loadArtifact(artifactPath);
      const from = flagText(args.flags, "from", "");
      const out = resolve(flagText(args.flags, "out", "target/mono/verification.json"));
      const plan = createDeployPlan({ chainId: flagText(args.flags, "chain", "local-dev"), from, artifactBundle: artifact });
      const sources = {
        "artifact.mrv.json": JSON.stringify(artifact, null, 2)
      };
      const bundle = createVerificationBundle(artifact, plan, sources);
      writeJson(out, bundle);
      print({
        written: out,
        bundleHash: bundle.bundleHash,
        passport: bundle.passport.address
      });
      return;
    }

    default:
      help();
      process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
