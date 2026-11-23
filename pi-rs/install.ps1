<#
.SYNOPSIS
    Website helper: download and run the canonical pi-rs PowerShell installer.

.DESCRIPTION
    All arguments are forwarded unchanged to the installer in the pi-rs
    repository (e.g. -Version, -Prefix, -Force, -AddToPath).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1 -Version v0.1.1 -Prefix "$env:LOCALAPPDATA\Programs\pi-rs"
#>
$ErrorActionPreference = 'Stop'

$Url = 'https://raw.githubusercontent.com/hakergeniusz/pi-rs/main/scripts/install.ps1'

try {
    $Installer = Invoke-RestMethod -Uri $Url -UseBasicParsing
} catch {
    Write-Error "Could not download the pi-rs installer: $($_.Exception.Message)"
    exit 1
}

# The installer's own `exit` calls propagate from the scriptblock; a clean
# return falls through with the host's default success status.
& ([scriptblock]::Create($Installer)) @args
