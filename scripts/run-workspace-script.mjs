import { spawnSync } from "node:child_process";
import {
  buildWorkspaceGraph,
  discoverWorkspaces,
  selectWorkspaces,
  topologicalOrder,
} from "./workspace-graph.mjs";

const [script, scope = "all"] = process.argv.slice(2);
if (!script || !["all", "apps", "packages"].includes(scope)) {
  console.error("Usage: node scripts/run-workspace-script.mjs <script> [all|apps|packages]");
  process.exit(2);
}

const graph = buildWorkspaceGraph(await discoverWorkspaces(process.cwd()));
const participants = selectWorkspaces(graph, scope).filter(
  (name) => graph.workspaces.get(name).manifest.scripts?.[script],
);

if (participants.length === 0) {
  console.log(`No workspaces with script "${script}" found in scope "${scope}".`);
  process.exit(0);
}

let ordered;
try {
  ordered = topologicalOrder(graph, participants);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
for (const workspace of ordered) {
  const result = spawnSync(npmCommand, ["-w", workspace, "run", script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}
