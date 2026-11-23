<#
.SYNOPSIS
    Website helper: download and run the canonical rustfetch PowerShell installer.

.DESCRIPTION
    All arguments are forwarded unchanged to the installer in the rustfetch
    repository (e.g. -Version, -InstallDir, -Uninstall).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1 -Version v0.2.8 -InstallDir "$env:USERPROFILE\Tools"
#>
$ErrorActionPreference = 'Stop'

$Url = 'https://raw.githubusercontent.com/hakergeniusz/rustfetch/main/installers/install.ps1'

try {
    $Installer = Invoke-RestMethod -Uri $Url -UseBasicParsing
} catch {
    Write-Error "Could not download the rustfetch installer: $($_.Exception.Message)"
    exit 1
}

# The installer's own `exit` calls propagate from the scriptblock; a clean
# return falls through with the host's default success status.
& ([scriptblock]::Create($Installer)) @args
