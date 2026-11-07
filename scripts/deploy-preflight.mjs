import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "package-lock.json",
  "AGENTS.md",
  "structure.md",
  "requirements.md",
];
const missing = [];

for (const item of required) {
  try {
    await access(path.join(root, item));
  } catch {
    missing.push(item);
  }
}

if (missing.length > 0) {
  console.error(`Deploy preflight failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}

const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
for (const script of [
  "architecture:check",
  "format:check",
  "lint",
  "typecheck",
  "test",
  "build",
  "deploy:preflight",
]) {
  if (!pkg.scripts?.[script]) {
    console.error(`Deploy preflight failed. package.json is missing script: ${script}`);
    process.exit(1);
  }
}

const entries = await readdir(root);
if (entries.includes(".env")) {
  console.error(
    "Deploy preflight failed. A real .env file must not be committed at repository root.",
  );
  process.exit(1);
}

try {
  const envExample = await readFile(path.join(root, ".env.example"), "utf8");
  for (const key of ["DATABASE_URL", "REDIS_URL", "SESSION_TOKEN_PEPPER", "TELEGRAM_BOT_TOKEN"]) {
    if (!envExample.includes(`${key}=`)) {
      console.error(`Deploy preflight failed. .env.example is missing ${key}.`);
      process.exit(1);
    }
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log("Deploy preflight passed.");
