import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const [inputPath] = process.argv.slice(2);
if (!inputPath) {
  console.error("Usage: node scripts/enrich-model-kernel-versions.mjs <models.json>");
  process.exit(1);
}

const repositoryRoot = process.cwd();
const configs = JSON.parse(await readFile(resolve(inputPath), "utf8"));
if (!Array.isArray(configs)) {
  throw new Error("The model input must be a JSON array.");
}

function attributes(fragment) {
  return Object.fromEntries(
    [...fragment.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
  );
}

function findMakefileValue(makefile, key) {
  const match = makefile.match(new RegExp(`^${key}\\s*=\\s*([^\\s#]+)`, "m"));
  if (!match) throw new Error(`Makefile is missing ${key}.`);
  return match[1];
}

async function fetchMakefile(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "ZSU-Model-Matrix/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
    }
  }
  throw new Error(`Unable to fetch ${url}: ${lastError.message}`);
}

async function resolveKernelLabel(config, cache) {
  if (typeof config.kernel_full_version === "string" && config.kernel_full_version.length > 0) {
    return config.kernel_full_version;
  }

  const manifestPath = join(repositoryRoot, "manifests", config.os_version.toLowerCase(), config.manifest);
  const manifest = await readFile(manifestPath, "utf8");
  const remotes = new Map(
    [...manifest.matchAll(/<remote\b([^>]*)\/?>(?:<\/remote>)?/g)].map(([, fragment]) => {
      const value = attributes(fragment);
      return [value.name, value.fetch?.replace(/\/$/, "")];
    }),
  );
  const defaultMatch = manifest.match(/<default\b([^>]*)\/?>(?:<\/default>)?/);
  const defaults = defaultMatch ? attributes(defaultMatch[1]) : {};
  const projects = [...manifest.matchAll(/<project\b([^>]*?)(?:\/>|>([\s\S]*?)<\/project>)/g)].map(([, fragment, body = ""]) => ({
    ...attributes(fragment),
    body,
  }));
  const common = projects.find((project) => project.path?.replace(/^\.\//, "") === "kernel_platform/common")
    ?? projects.find((project) => /<linkfile\b[^>]*\bdest="kernel_platform\/common"/.test(project.body));
  if (!common) throw new Error(`${config.model}: manifest has no kernel_platform/common project.`);

  const remoteName = common.remote ?? defaults.remote;
  const revision = common.revision ?? defaults.revision;
  const fetchBase = remotes.get(remoteName);
  if (!fetchBase?.startsWith("https://github.com/")) {
    throw new Error(`${config.model}: common source does not use a supported GitHub remote.`);
  }
  if (!common.name || !revision) throw new Error(`${config.model}: common source has incomplete manifest metadata.`);

  const rawBase = fetchBase.replace("https://github.com/", "https://raw.githubusercontent.com/");
  const makefileUrl = `${rawBase}/${common.name}/${revision}/Makefile`;
  let makefile = cache.get(makefileUrl);
  if (!makefile) {
    makefile = await fetchMakefile(makefileUrl);
    cache.set(makefileUrl, makefile);
  }

  const version = findMakefileValue(makefile, "VERSION");
  const patchlevel = findMakefileValue(makefile, "PATCHLEVEL");
  const sublevel = findMakefileValue(makefile, "SUBLEVEL");
  const detectedTrack = `${version}.${patchlevel}`;
  if (detectedTrack !== config.kernel_version) {
    throw new Error(`${config.model}: manifest Makefile track ${detectedTrack} does not match config track ${config.kernel_version}.`);
  }
  return `${config.android_version}-${version}.${patchlevel}.${sublevel}`;
}

const cache = new Map();
const enriched = new Array(configs.length);
let nextIndex = 0;
const workerCount = Math.min(8, Math.max(1, configs.length));

await Promise.all(
  Array.from({ length: workerCount }, async () => {
    while (nextIndex < configs.length) {
      const index = nextIndex;
      nextIndex += 1;
      const config = configs[index];
      enriched[index] = { ...config, kernel_full_version: await resolveKernelLabel(config, cache) };
    }
  }),
);

console.log(JSON.stringify(enriched));
