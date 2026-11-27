#!/bin/sh
# Website helper: fetch and run the canonical pico installer.
#
# Usage:
#   curl -fsSL https://hakergeniusz.github.io/pico/install.sh | sh
#   sh install.sh                          # latest release, ~/.local/bin
#   PICO_VERSION=0.1.0 sh install.sh       # pin a release
#   PICO_INSTALL_DIR=/opt/bin sh install.sh # custom install directory
#
# The real installer (SHA-256 verification, user-scoped install, platform
# detection) lives in the pico repository; this file only forwards arguments.

set -eu

URL='https://raw.githubusercontent.com/hakergeniusz/pico/feat/basic-editor/install.sh'

if ! command -v curl >/dev/null 2>&1; then
    printf 'error: curl is required to download the pico installer\n' >&2
    exit 1
fi

curl -fsSL "$URL" | sh -s -- "$@"
