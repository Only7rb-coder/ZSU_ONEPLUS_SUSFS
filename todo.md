# ZSU ONEPLUS SUSFS Release TODO

- [x] Initialize the ccache environment before model cache restoration.
- [x] Resolve ZSU symbol dependencies from the KernelSU-Next source tree.
- [x] Validate all 158 model configurations and ZSU-root build targets locally.
- [x] Stop the focused single-model verification run before restarting the all-model release.
- [x] Restart the complete 158-model stable ZSU release matrix.
- [ ] Monitor every model build and address any shared release-blocking error.
- [ ] Verify 158 model-named AnyKernel packages plus normal and spoofed ZSU manager APKs in the final release.
- [ ] Prevent ccache final-statistics logging from copying `ccache.log` onto itself and failing completed model builds.
