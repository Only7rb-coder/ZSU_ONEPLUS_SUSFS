# Reference-Parity Architecture Findings

Source repository: <https://github.com/huangdihd/OnePlus_ReSukiSU_SUSFS>

## Required Reference Structure

The reference project is device-model driven rather than generic GKI-track driven. It contains 156 JSON model configurations under `configs/oos14`, `configs/oos15`, and `configs/oos16`, paired with per-model manifest files under `manifests/`.

Each model configuration declares the release-facing identity and build inputs, including `model`, `soc`, `branch`, `manifest`, `android_version`, `kernel_version`, `os_version`, compiler settings, feature flags, module blacklist, and kernel uname. Example source: `configs/oos16/OP15.json`.

Its reusable build architecture is implemented with `.github/actions/build-kernel`, `kernel-source-sync`, `cache`, and `disk-cleanup`. The build action consumes a complete model JSON configuration, syncs model-specific kernel source from its manifest, injects the selected root implementation and SUSFS, builds the model-specific kernel, creates a model-named AnyKernel package, and emits checksums and metadata.

The reference dispatcher is `.github/workflows/build-kernel-release.yml`. It supports model/OS selection, a single `config_path` validation mode, root-branch selection, build-only versus release behavior, matrix planning, dynamic asset collection, a model table in release notes, versioned `SUSFS-rN` tags, and release notifications.

## ZSU Porting Rules

The ZSU equivalent must preserve the reference project’s model registry, per-model source synchronization, package naming, matrix selection, release asset table, checksums, and tag flow. Root integration must change from the reference project’s selectable root implementations to `Only7rb-coder/zsu` and its ZSU manager artifacts. The ZSU repository must not claim a generic Android/KMI artifact is model-specific unless it is built from that model’s declared source manifest.

## Current Gap

`ZSU_ONEPLUS_SUSFS` currently has generic Android/KMI target data and generic kernel workflows. It does not yet contain the reference project’s model registry, model manifests, reusable source-sync/build actions, or model-named AnyKernel packaging path. These components must be ported and then tested through one selected model configuration before a stable model-named release is published.

## Model Packaging Contract

The reference package name is generated from the model configuration and actual detected kernel version:

```text
AK3_<model>_<os-version>_<android-kernel-full-version>_ZSU_<zsu-version>_SuSFS_<susfs-version>.zip
```

The package must include the flashable AnyKernel layout, the built kernel `Image`, and a small model/OS metadata file. The release workflow gathers each package dynamically and generates a release table with model, OS version, kernel version, feature flags, direct asset links, asset sizes, and SHA-256 values.

## Source and Root Integration Contract

Every model build must synchronize exactly the source manifest declared by its JSON configuration. The existing generic ZSU workflow already establishes the ZSU integration requirement: use the SUSFS-capable KernelSU Next base and replace its manager allowlist with the private ZSU manager signing certificate. The model-driven action must apply the same integration after model-specific source synchronization, and before SUSFS patching and compilation.

The implementation will use a ZSU-only model build interface. It will not expose the reference project’s root-selection options in the new workflow. The ZSU manager artifacts are fetched from `Only7rb-coder/zsu` and remain attached to release artifacts when produced by the selected build.

## Exact Reference Run Parity Target

The user-supplied successful reference run `32509598443`, from commit `2150b7578c724490f6dbc8b9439b26a8ed82d6c5`, completed 158 model build jobs with no failures. Its first model job began at `2026-08-21T17:43:21Z` and its final model job completed at `2026-08-21T19:14:04Z`.

The run reached 19 concurrent model builds. Across all 158 jobs, the median model build time was 620 seconds and the maximum was 1434 seconds. The ZSU workflow must use a 19-job matrix concurrency limit rather than the earlier four-job limit to match the reference build throughput.

The reference run contains two model configurations absent from the initial ZSU import:

| Missing configuration | Model package identity |
|---|---|
| `configs/oos16/OP-ACE-5-RACE-6.1.134.json` | `OP-ACE-5-RACE-6.1.134` |
| `configs/oos16/OP-NORD-CE-5-6.1.134.json` | `OP-NORD-CE-5-6.1.134` |

Both configurations and their matching manifests are required before an all-device ZSU release can truthfully claim parity with the referenced run.

## Active Full-Matrix Investigation

The first 158-device ZSU release attempt started with 19 concurrent jobs as intended. Several early model jobs reached the model source and toolchain preparation stage but failed before a package was produced. Their logs show that the new repository does not yet have the reference project’s pre-populated `ccache-cache` and `lto-cache` release buckets; these cache misses are non-fatal and the workflow correctly continues with fresh state.

The failure investigation is using completed-job logs from the ZSU release run rather than waiting for the entire matrix to finish. The subsequent corrective work must preserve the ZSU manager signing-certificate allowlist and must not publish a release until the model builds produce their model-named packages successfully.
