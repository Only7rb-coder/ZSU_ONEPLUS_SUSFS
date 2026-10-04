#!/usr/bin/env bash
# Validate the two artifacts required for SUSFS on a ZSU kernel.
# Usage: validate-susfs-package.sh <AnyKernel ZIP> <SUSFS module ZIP>
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <AnyKernel ZIP> <SUSFS module ZIP>" >&2
  exit 2
fi

kernel_zip=$1
module_zip=$2

for archive in "$kernel_zip" "$module_zip"; do
  [[ -s "$archive" ]] || { echo "::error::Missing or empty archive: $archive" >&2; exit 1; }
  unzip -tqq "$archive" || { echo "::error::Invalid ZIP archive: $archive" >&2; exit 1; }
done

kernel_list=$(mktemp)
module_list=$(mktemp)
trap 'rm -f "$kernel_list" "$module_list"' EXIT
unzip -Z1 "$kernel_zip" > "$kernel_list"
unzip -Z1 "$module_zip" > "$module_list"

require_entry() {
  local list=$1 entry=$2 label=$3
  grep -Fxq "$entry" "$list" || {
    echo "::error::$label is missing required entry '$entry'" >&2
    exit 1
  }
}

# A valid flashable package must contain a kernel and the AnyKernel installer.
require_entry "$kernel_list" Image "Kernel package"
require_entry "$kernel_list" anykernel.sh "Kernel package"
require_entry "$kernel_list" META-INF/com/google/android/updater-script "Kernel package"

# The support module must be a real KernelSU/SUSFS module, not merely a ZIP
# containing unrelated files. Accept a root directory prefix for module ZIPs
# produced by third-party CI artifacts.
module_prop=$(grep -E '(^|/)module\.prop$' "$module_list" | head -n 1 || true)
[[ -n "$module_prop" ]] || {
  echo "::error::SUSFS support module has no module.prop" >&2
  exit 1
}

module_prop_text=$(unzip -p "$module_zip" "$module_prop")
id=$(awk -F= '$1 == "id" {print $2; exit}' <<< "$module_prop_text")
name=$(awk -F= '$1 == "name" {print $2; exit}' <<< "$module_prop_text")
version=$(awk -F= '$1 == "version" {print $2; exit}' <<< "$module_prop_text")
[[ "$id" == "susfs4ksu" ]] || { echo "::error::Unexpected SUSFS module id: ${id:-missing}" >&2; exit 1; }
grep -qi 'susfs' <<< "${name:-}" || { echo "::error::SUSFS module name is missing SUSFS marker" >&2; exit 1; }
[[ "$version" == v* ]] || { echo "::error::SUSFS module has no version" >&2; exit 1; }

grep -Eq '(^|/)tools/ksu_susfs_arm64$' "$module_list" || {
  echo "::error::SUSFS module is missing tools/ksu_susfs_arm64" >&2
  exit 1
}

# Keep the kernel package's release label truthful. A SUSFS release must not
# silently publish a plain ZSU package under a SUSFS name.
kernel_name=$(basename "$kernel_zip")
grep -Eq '_SuSFS_v[0-9]+\.[0-9]+\.[0-9]+\.zip$' <<< "$kernel_name" || {
  echo "::error::Kernel package name does not declare a SUSFS version: $kernel_name" >&2
  exit 1
}

echo "SUSFS package validation passed"
echo "  kernel: $kernel_name"
echo "  module: $(basename "$module_zip")"
echo "  module version: $version"
