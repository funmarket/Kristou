import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildWorkspaceGraph,
  dependencyClosure,
  discoverWorkspaces,
  selectWorkspaces,
  topologicalOrder,
} from "../../scripts/workspace-graph.mjs";

async function writeWorkspace(root, group, folder, manifest) {
  const directory = path.join(root, group, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "package.json"), JSON.stringify(manifest));
}

async function withWorkspaceFixture(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "kristou-workspace-graph-"));
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("discovers every workspace before command participation is considered", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "apps", "api", {
      name: "@kristou/api",
      scripts: { build: "echo api" },
      dependencies: { "@kristou/config": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "config", {
      name: "@kristou/config",
      scripts: { typecheck: "echo config" },
    });

    const workspaces = await discoverWorkspaces(root);
    assert.deepEqual(workspaces.map((workspace) => workspace.name), [
      "@kristou/api",
      "@kristou/config",
    ]);
  });
});

test("keeps frontend to ui dependency even when ui lacks the requested command", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "packages", "frontend", {
      name: "@kristou/frontend",
      scripts: { build: "echo frontend" },
      dependencies: { "@kristou/ui": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "ui", {
      name: "@kristou/ui",
      scripts: { typecheck: "echo ui" },
    });

    const graph = buildWorkspaceGraph(await discoverWorkspaces(root));
    assert.deepEqual([...graph.dependencies.get("@kristou/frontend").keys()], ["@kristou/ui"]);
    assert.deepEqual([...dependencyClosure(graph, ["@kristou/frontend"])].sort(), [
      "@kristou/frontend",
      "@kristou/ui",
    ]);
  });
});

test("keeps app to package dependency visible when selecting apps", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "apps", "api", {
      name: "@kristou/api",
      dependencies: { "@kristou/config": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "config", { name: "@kristou/config" });

    const graph = buildWorkspaceGraph(await discoverWorkspaces(root));
    assert.deepEqual(selectWorkspaces(graph, "apps"), ["@kristou/api"]);
    assert.deepEqual([...graph.dependencies.get("@kristou/api").keys()], ["@kristou/config"]);
  });
});

test("orders selected workspaces deterministically by dependency then name", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "packages", "frontend", {
      name: "@kristou/frontend",
      dependencies: { "@kristou/ui": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "ui", { name: "@kristou/ui" });
    await writeWorkspace(root, "packages", "config", { name: "@kristou/config" });

    const graph = buildWorkspaceGraph(await discoverWorkspaces(root));
    assert.deepEqual(
      topologicalOrder(graph, ["@kristou/frontend", "@kristou/ui", "@kristou/config"]),
      ["@kristou/config", "@kristou/ui", "@kristou/frontend"],
    );
  });
});

test("fails closed when selected workspaces contain a dependency cycle", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "packages", "a", {
      name: "@kristou/a",
      dependencies: { "@kristou/b": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "b", {
      name: "@kristou/b",
      dependencies: { "@kristou/a": "0.1.0" },
    });

    const graph = buildWorkspaceGraph(await discoverWorkspaces(root));
    assert.throws(
      () => topologicalOrder(graph, ["@kristou/a", "@kristou/b"]),
      /Workspace dependency cycle detected: @kristou\/a, @kristou\/b/,
    );
  });
});

test("retains internal optional dependency category and ordering", async () => {
  await withWorkspaceFixture(async (root) => {
    await writeWorkspace(root, "packages", "consumer", {
      name: "@kristou/consumer",
      optionalDependencies: { "@kristou/optional": "0.1.0" },
    });
    await writeWorkspace(root, "packages", "optional", { name: "@kristou/optional" });

    const graph = buildWorkspaceGraph(await discoverWorkspaces(root));
    assert.deepEqual(
      [...graph.dependencies.get("@kristou/consumer").get("@kristou/optional")],
      ["optionalDependencies"],
    );
    assert.deepEqual(topologicalOrder(graph, ["@kristou/consumer", "@kristou/optional"]), [
      "@kristou/optional",
      "@kristou/consumer",
    ]);
  });
});
