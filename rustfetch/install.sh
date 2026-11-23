#!/bin/sh
# Website helper: fetch and run the canonical rustfetch installer.
#
# Usage:
#   sh install.sh                     # latest release, user install
#   sh install.sh --prefix ~/.local   # any installer flag is forwarded
#   sh install.sh --version v0.2.8
#
# The real installer (SHA-256 verification, zsh completion, etc.) lives in the
# rustfetch repository; this file only forwards arguments to it.

set -eu

URL='https://raw.githubusercontent.com/hakergeniusz/rustfetch/main/install.sh'

if ! command -v curl >/dev/null 2>&1; then
    printf 'error: curl is required to download the rustfetch installer\n' >&2
    exit 1
fi

curl -fsSL "$URL" | sh -s -- "$@"
