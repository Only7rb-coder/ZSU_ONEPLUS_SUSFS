# ZSU Root SUSFS v2.3.0

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

Run **Build ZSU Root Kernel** from the repository’s Actions page. Choose `Actions` for a build-only run, `Pre-Release` for testing artifacts, or `Release` only after the selected target has been validated. The workflow retrieves the pinned ZSU manager release, applies the selected ZSU and SUSFS configuration, and checks selected build results before creating a release.

### ZSU Manager compatibility

Builds from this repository are intentionally locked to **ZSU Manager `v1.3.13` (`1.3.13_33338`)** from [`Only7rb-coder/zsu`](https://github.com/Only7rb-coder/zsu). The manager download job fails closed if the repository’s latest release is different, so a manager update cannot silently produce kernels with an unverified API/signature combination. Update the compatibility contract in `config/zsu-root-targets.json` and `.github/workflows/get-manager.yml` together after validating a new manager release.

### SUSFS installation (required)

SUSFS has two parts. **Flashing the kernel ZIP alone does not install the SUSFS userspace module**, so the SUSFS page/card may remain unavailable in the manager:

1. Flash the matching `AK3_..._ZSU_..._SuSFS_...zip` in recovery.
2. Boot Android, install the release’s `ksu_module_susfs.zip` **inside ZSU Manager**, enable it, and reboot once.

Use only the ZSU Manager APK shipped with the same release. The kernel build accepts only the pinned ZSU signing certificate; a normal KernelSU or KernelSU-Next manager is intentionally rejected. Do not install the SUSFS module through another root manager.

If SUSFS is still unavailable, confirm that the kernel and module came from the same release, that the selected model package matches the device and firmware, and that the module is enabled after reboot. Release automation now refuses to publish a kernel release without a valid arm64 SUSFS module.

> A successful compilation is not a guarantee that an artifact is safe to flash on every device within a KMI family. Before flashing, retain the matching stock boot image and use a known recovery path for the exact firmware currently installed.

## Configuration checks

The `Validate ZSU Root Configuration` workflow runs on changes to the matrix definition and workflows. It checks that each target has a unique identifier, a supported Android/KMI pair, a corresponding reusable workflow, and the declared ZSU integration source.

## Credits and upstreams

This project uses the ZSU root source, the SUSFS project, the Android GKI ecosystem, and the user-owned GKI ZSU foundation. The OnePlus ReSukiSU/SUSFS repository supplied the high-level model of configuration-driven multi-device builds and release packaging.
