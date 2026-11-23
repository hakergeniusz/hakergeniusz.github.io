#!/bin/sh
# Website helper: fetch and run the canonical pi-rs installer.
#
# Usage:
#   sh install.sh                          # latest release, ~/.local/bin/pi-rs
#   sh install.sh --prefix ~/.local/bin    # any installer flag is forwarded
#   sh install.sh --version v0.1.1
#   sh install.sh                          # re-run to update an existing install
#
# The real installer (SHA-256 verification, prefix-only writes, sh/bash/zsh
# support) lives in the pi-rs repository; this file only forwards arguments.

set -eu

URL='https://raw.githubusercontent.com/hakergeniusz/pi-rs/main/scripts/install.sh'

if ! command -v curl >/dev/null 2>&1; then
    printf 'error: curl is required to download the pi-rs installer\n' >&2
    exit 1
fi

curl -fsSL "$URL" | sh -s -- "$@"
