import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const configsRoot = join(root, "configs");
const manifestsRoot = join(root, "manifests");
const requiredFields = [
  "model",
  "soc",
  "branch",
  "manifest",
  "android_version",
  "kernel_version",
  "os_version",
  "lto",
  "rust_build",
  "disk_cleanup",
  "susfs",
  "opt",
  "ds",
  "bbg",
  "bbr",
  "ttl",
  "ip_set",
  "unicode",
  "ntsync",
  "uname",
];

function walkJson(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkJson(path);
    return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
  });
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

if (!existsSync(configsRoot) || !existsSync(manifestsRoot)) {
  fail("Both configs/ and manifests/ are required for model-driven builds.");
} else {
  const files = walkJson(configsRoot);
  if (files.length === 0) fail("No model JSON configuration files were found.");

  const identities = new Set();
  const tracks = new Set();
  for (const file of files) {
    const label = relative(root, file);
    let config;
    try {
      config = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      fail(`${label} is not valid JSON: ${error.message}`);
      continue;
    }

    for (const field of requiredFields) {
      if (config[field] === undefined || config[field] === null || config[field] === "") {
        fail(`${label} is missing required field '${field}'.`);
      }
    }

    if (!/^OP[\w.-]*$/.test(config.model ?? "")) fail(`${label} has invalid model '${config.model}'.`);
    if (!/^OOS(14|15|16)$/.test(config.os_version ?? "")) fail(`${label} has unsupported OS '${config.os_version}'.`);
    if (!/^android(12|13|14|15|16)$/.test(config.android_version ?? "")) fail(`${label} has unsupported Android track '${config.android_version}'.`);
    if (!/^(5\.10|5\.15|6\.1|6\.6|6\.12)$/.test(config.kernel_version ?? "")) fail(`${label} has unsupported kernel track '${config.kernel_version}'.`);
    if (!/^(none|thin|full)$/.test(config.lto ?? "")) fail(`${label} has invalid LTO value '${config.lto}'.`);

    for (const field of ["rust_build", "disk_cleanup", "susfs", "opt", "ds", "bbg", "bbr", "ttl", "ip_set", "unicode", "ntsync"]) {
      if (typeof config[field] !== "boolean") fail(`${label} field '${field}' must be boolean.`);
    }

    if (config.branch?.startsWith("wild/")) {
      const manifestPath = join(manifestsRoot, config.os_version.toLowerCase(), config.manifest);
      if (!existsSync(manifestPath)) fail(`${label} references missing local manifest '${relative(root, manifestPath)}'.`);
    } else if (!/^https:\/\//.test(config.manifest ?? "") && !/^[\w./-]+\.xml$/.test(config.manifest ?? "")) {
      fail(`${label} has invalid manifest '${config.manifest}'.`);
    }

    const identity = `${config.model}|${config.os_version}|${config.android_version}|${config.kernel_version}|${config.manifest}`;
    if (identities.has(identity)) fail(`${label} duplicates an existing model configuration identity.`);
    identities.add(identity);
    tracks.add(`${config.android_version}-${config.kernel_version}`);
  }

  if (process.exitCode) process.exit(process.exitCode);
  console.log(`Validated ${files.length} model configurations across ${tracks.size} Android/KMI tracks.`);
}
