# ZSU Root SUSFS

**ZSU Root SUSFS** is a configuration-driven repository for building multi-KMI Generic Kernel Image packages with the ZSU root integration and SUSFS. It uses the user-owned ZSU GKI foundation and follows the same practical pattern as the supplied reference project: a central build dispatcher selects defined Android/KMI tracks, runs isolated builds, gathers artifacts, and optionally publishes a GitHub release.

The ZSU integration source is [`Only7rb-coder/zsu`](https://github.com/Only7rb-coder/zsu), which is GPL-3.0 licensed. This repository retains that licensing responsibility for any ZSU kernel source it fetches or incorporates. The supplied reference repository informed the architecture only; its files were not copied because it does not declare a license.

## Build scope

The initial build matrix mirrors the maintained GKI tracks already used by the ZSU project. A successful build produces only artifacts for the selected track. It does not certify compatibility with every device that reports the same Android and KMI family.

| Build track | Android line | Kernel line | Intended output |
| --- | --- | --- | --- |
| `android12-5.10` | Android 12 | 5.10 | ZSU-root GKI artifacts and AnyKernel packaging where supported |
| `android13-5.15` | Android 13 | 5.15 | ZSU-root GKI artifacts and AnyKernel packaging where supported |
| `android14-6.1` | Android 14 | 6.1 | ZSU-root GKI artifacts and AnyKernel packaging where supported |
| `android15-6.6` | Android 15 | 6.6 | ZSU-root GKI artifacts and AnyKernel packaging where supported |
| `android16-6.12` | Android 16 | 6.12 | ZSU-root GKI artifacts and AnyKernel packaging where supported |

## How releases work

Run **Build ZSU Root Kernel** from the repository’s Actions page. Choose `Actions` for a build-only run, `Pre-Release` for testing artifacts, or `Release` only after the selected target has been validated. The workflow retrieves current ZSU manager artifacts, applies the selected ZSU and SUSFS configuration, and checks selected build results before creating a release.

> A successful compilation is not a guarantee that an artifact is safe to flash on every device within a KMI family. Before flashing, retain the matching stock boot image and use a known recovery path for the exact firmware currently installed.

## Configuration checks

The `Validate ZSU Root Configuration` workflow runs on changes to the matrix definition and workflows. It checks that each target has a unique identifier, a supported Android/KMI pair, a corresponding reusable workflow, and the declared ZSU integration source.

## Credits and upstreams

This project uses the ZSU root source, the SUSFS project, the Android GKI ecosystem, and the user-owned GKI ZSU foundation. The OnePlus ReSukiSU/SUSFS repository supplied the high-level model of configuration-driven multi-device builds and release packaging.
