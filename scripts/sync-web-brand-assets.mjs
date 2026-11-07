import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = path.join(root, "packages/ui/src/assets/kristou-logo.png");
const publicDirectory = path.join(root, "apps/web/public");
const destination = path.join(publicDirectory, "kristou-logo.png");

await mkdir(publicDirectory, { recursive: true });
await copyFile(source, destination);

console.log("Synced canonical KRISTOU logo into the Web public build directory.");
