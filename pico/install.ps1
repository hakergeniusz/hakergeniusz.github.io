<#
.SYNOPSIS
    Website helper: download and run the canonical pico PowerShell installer.

.DESCRIPTION
    All arguments are forwarded unchanged to the installer in the pico
    repository (for example -Version, -InstallDir, -BaseUrl, -Token).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1

.EXAMPLE
    irm https://hakergeniusz.github.io/pico/install.ps1 | iex

.EXAMPLE
    irm https://hakergeniusz.github.io/pico/install.ps1 | iex -ArgumentList @('-Version','0.1.0')
#>
$ErrorActionPreference = 'Stop'

$Url = 'https://raw.githubusercontent.com/hakergeniusz/pico/feat/basic-editor/install.ps1'

try {
    $Installer = Invoke-RestMethod -Uri $Url -UseBasicParsing
} catch {
    Write-Error "Could not download the pico installer: $($_.Exception.Message)"
    exit 1
}

# The installer's own `exit` calls propagate from the scriptblock; a clean
# return falls through with the host's default success status.
& ([scriptblock]::Create($Installer)) @args
