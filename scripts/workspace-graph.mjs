import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const WORKSPACE_GROUPS = ["apps", "packages"];
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

export async function discoverWorkspaces(root) {
  const workspaces = [];

  for (const group of WORKSPACE_GROUPS) {
    const directory = path.join(root, group);
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(directory, entry.name, "package.json");
      try {
        const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
        if (!manifest.name) continue;
        workspaces.push({
          name: manifest.name,
          group,
          directory: path.join(directory, entry.name),
          manifest,
        });
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }

  workspaces.sort((left, right) => left.name.localeCompare(right.name));
  return workspaces;
}

export function buildWorkspaceGraph(workspaces) {
  const byName = new Map();
  for (const workspace of workspaces) {
    if (byName.has(workspace.name)) {
      throw new Error(`Duplicate workspace name: ${workspace.name}`);
    }
    byName.set(workspace.name, workspace);
  }

  const dependencies = new Map();
  const dependents = new Map();

  for (const workspace of workspaces) {
    const internal = new Map();

    for (const field of DEPENDENCY_FIELDS) {
      for (const dependency of Object.keys(workspace.manifest[field] ?? {}).sort()) {
        if (!byName.has(dependency)) continue;
        const categories = internal.get(dependency) ?? new Set();
        categories.add(field);
        internal.set(dependency, categories);
      }
    }

    dependencies.set(workspace.name, internal);
    for (const dependency of internal.keys()) {
      const current = dependents.get(dependency) ?? new Set();
      current.add(workspace.name);
      dependents.set(dependency, current);
    }
  }

  for (const workspace of workspaces) {
    if (!dependents.has(workspace.name)) dependents.set(workspace.name, new Set());
  }

  return { workspaces: byName, dependencies, dependents };
}

export function selectWorkspaces(graph, selector) {
  if (!WORKSPACE_GROUPS.includes(selector) && selector !== "all") {
    throw new Error(`Unknown workspace selector: ${selector}`);
  }

  return [...graph.workspaces.values()]
    .filter((workspace) => selector === "all" || workspace.group === selector)
    .map((workspace) => workspace.name)
    .sort();
}

export function dependencyClosure(graph, selectedNames) {
  const closure = new Set();
  const pending = [...selectedNames];

  while (pending.length > 0) {
    const name = pending.pop();
    if (closure.has(name)) continue;
    if (!graph.workspaces.has(name)) throw new Error(`Unknown workspace: ${name}`);
    closure.add(name);

    for (const dependency of graph.dependencies.get(name)?.keys() ?? []) {
      pending.push(dependency);
    }
  }

  return closure;
}

export function topologicalOrder(graph, selectedNames) {
  const selected = new Set(selectedNames);
  for (const name of selected) {
    if (!graph.workspaces.has(name)) throw new Error(`Unknown workspace: ${name}`);
  }

  const indegree = new Map([...selected].map((name) => [name, 0]));
  const selectedDependents = new Map([...selected].map((name) => [name, []]));

  for (const name of selected) {
    for (const dependency of graph.dependencies.get(name)?.keys() ?? []) {
      if (!selected.has(dependency)) continue;
      indegree.set(name, indegree.get(name) + 1);
      selectedDependents.get(dependency).push(name);
    }
  }

  const ready = [...indegree.entries()]
    .filter(([, count]) => count === 0)
    .map(([name]) => name)
    .sort();
  const ordered = [];

  while (ready.length > 0) {
    const name = ready.shift();
    ordered.push(name);

    for (const dependent of selectedDependents.get(name).sort()) {
      const next = indegree.get(dependent) - 1;
      indegree.set(dependent, next);
      if (next === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }

  if (ordered.length !== selected.size) {
    const blocked = [...indegree.entries()]
      .filter(([, count]) => count > 0)
      .map(([name]) => name)
      .sort();
    throw new Error(`Workspace dependency cycle detected: ${blocked.join(", ")}`);
  }

  return ordered;
}
