#!/bin/sh
# Website one-liner: install the latest pico Arch package.
#   curl -fsSL https://hakergeniusz.github.io/pico/install-arch.sh | sh
# Env: PICO_VERSION to pin a release tag.
set -eu

repo=hakergeniusz/pico
tag=${PICO_VERSION:-}
if [ -z "$tag" ]; then
  tag=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" |
    sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
fi
[ -n "$tag" ] || { printf 'pico arch installer: no release tag found\n' >&2; exit 1; }
version=${tag#v}

case "$(uname -m)" in
  x86_64|amd64) arch=x86_64 ;;
  aarch64|arm64) arch=aarch64 ;;
  riscv64) arch=riscv64 ;;
  *) printf 'pico arch installer: unsupported architecture\n' >&2; exit 1 ;;
esac

asset="pico-$version-1-$arch.pkg.tar.zst"
base="https://github.com/$repo/releases/download/$tag"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT INT TERM

printf 'Downloading %s\n' "$asset"
curl -fsSL "$base/$asset" -o "$tmp/$asset"
curl -fsSL "$base/$asset.sha256" -o "$tmp/$asset.sha256"
(cd "$tmp" && sha256sum -c "$asset.sha256")

if [ "$(id -u)" -eq 0 ]; then
  sudo_cmd=""
else
  sudo_cmd=sudo
fi
$sudo_cmd pacman -U --noconfirm "$tmp/$asset"
printf 'Installed pico %s\n' "$version"
