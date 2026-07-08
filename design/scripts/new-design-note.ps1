param(
  [string]$Title = "design-note"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$designDir = Split-Path -Parent $scriptDir
$historyDir = Join-Path $designDir "history"
New-Item -ItemType Directory -Force -Path $historyDir | Out-Null

$slug = $Title.ToLowerInvariant()
$slug = $slug -replace "[^a-z0-9]+", "-"
$slug = $slug.Trim("-")
if (-not $slug) { $slug = "design-note" }

$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$path = Join-Path $historyDir "$stamp-$slug.md"

@"
# $Title

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm")
Area: Design Studio
Live app: ../Main File.html

## Goal


## Visual Direction


## Keep Unchanged

- Existing app behavior.
- Workbook parsing and validation logic.
- Import/export flow.

## Files Touched


## Verification


## Follow-ups


"@ | Set-Content -Path $path -Encoding UTF8

Write-Host $path
