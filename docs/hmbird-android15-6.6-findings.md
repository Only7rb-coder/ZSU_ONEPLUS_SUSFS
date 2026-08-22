# HMBIRD Android 15 / 6.6 Build Findings

The public full-matrix run `32547462638` was cancelled after four Android 15 / 6.6 HMBIRD-enabled OOS15 configurations failed during final kernel linking. The prior missing `dos2unix` dependency was corrected in commit `2624fb1`, and the failing jobs then progressed beyond HMBIRD patch application into the kernel build.

The representative failed job, `build (OP-ACE-5-PRO, OOS15, android15-6.6)`, reached `ld.lld` and reported unresolved SELinux policy symbols, including `security_context_to_sid_with_policy`, `security_sid_to_context_with_policy`, and `security_compute_av_user_with_policy`. The unresolved references originate from modified SELinux hook and selinuxfs code paths after the HMBIRD patch sequence.

The affected configurations are `OP-ACE-5-PRO`, `OP-ACE-5-PRO-6.6.30`, `OP-ACE-5-ULTRA`, and `OP-ACE-5-ULTRA-6.6.50`, all on OOS15 with Android 15 / Linux 6.6. The HMBIRD compatibility correction must preserve the configuration-specific HMBIRD feature while preventing those unsupported policy helper references from reaching the final link.

The reference build action at `https://github.com/huangdihd/OnePlus_ReSukiSU_SUSFS/blob/main/.github/actions/build-kernel/action.yml` contains a newer HMBIRD model-selection and patch-file validation block. It is a comparison source for restoring release-matrix parity, but the final ZSU action must retain the private ZSU root integration and allowlist.
