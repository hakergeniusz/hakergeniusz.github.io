#!/bin/sh
# Website one-liner: install the latest pico RPM on Fedora/RHEL-like systems.
#   curl -fsSL https://hakergeniusz.github.io/pico/install-rpm.sh | sh
# Env: PICO_VERSION to pin a release tag.
set -eu

repo=hakergeniusz/pico
tag=${PICO_VERSION:-}
if [ -z "$tag" ]; then
  tag=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" |
    sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
fi
[ -n "$tag" ] || { printf 'pico rpm installer: no release tag found\n' >&2; exit 1; }

case "$(uname -m)" in
  x86_64|amd64) rpm_arch=x86_64 ;;
  aarch64|arm64) rpm_arch=aarch64 ;;
  riscv64) rpm_arch=riscv64 ;;
  *) printf 'pico rpm installer: unsupported architecture\n' >&2; exit 1 ;;
esac

rpm_url=""
for url in $(curl -fsSL "https://api.github.com/repos/$repo/releases/tags/$tag" |
  sed -n 's/.*"browser_download_url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'); do
  case "$url" in
    *".$rpm_arch.rpm") rpm_url=$url ;;
  esac
done
[ -n "$rpm_url" ] || { printf 'pico rpm installer: no RPM asset for %s\n' "$rpm_arch" >&2; exit 1; }

asset=${rpm_url##*/}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

printf 'Downloading %s\n' "$asset"
curl -fsSL "$rpm_url" -o "$tmp/$asset"
curl -fsSL "$rpm_url.sha256" -o "$tmp/$asset.sha256"
(cd "$tmp" && sha256sum -c "$asset.sha256")

if [ "$(id -u)" -eq 0 ]; then
  sudo_cmd=""
else
  sudo_cmd=sudo
fi
$sudo_cmd dnf install -y "$tmp/$asset"
printf 'Installed pico from %s\n' "$asset"
