# ZSU ONEPLUS SUSFS Release TODO

- [x] Initialize the ccache environment before model cache restoration.
- [x] Resolve ZSU symbol dependencies from the KernelSU-Next source tree.
- [x] Validate all 158 model configurations and ZSU-root build targets locally.
- [x] Stop the focused single-model verification run before restarting the all-model release.
- [x] Restart the complete 158-model stable ZSU release matrix.
- [ ] Monitor every model build and address any shared release-blocking error.
- [ ] Verify 158 model-named AnyKernel packages plus normal and spoofed ZSU manager APKs in the final release.
- [x] Prevent ccache final-statistics logging from copying `ccache.log` onto itself and failing completed model builds.
- [x] Verify the repository is permanently public and that hosted Actions runners can start jobs.
- [x] Rerun the complete 158-model stable ZSU release workflow using public-repository Actions capacity.
- [x] Install `dos2unix` in the shared model-build dependency step so HMBIRD-enabled models do not fail during patch application.
- [x] Make the Android 15 6.6 KernelSU-Next SELinux policy helper symbols externally linkable for HMBIRD-enabled model builds.
- [ ] Diagnose and correct the shared Android 16 / 6.12 model-build failure affecting the final OOS16 configurations.
- [x] Install `libdw-dev` for Android 16 / 6.12 builds so `gendwarfksyms` can find the required `dwarf.h` host header.
- [x] Show every model's complete detected kernel version across all supported tracks in workflow-job and release-facing labels instead of the shortened Android/KMI label.
- [ ] Run the corrected Android 16 / Linux 6.12 model group before retrying the full 158-model release.
