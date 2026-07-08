param(
  [string]$Title = "garage-note"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$garageDir = Split-Path -Parent $scriptDir
$historyDir = Join-Path $garageDir "history"
New-Item -ItemType Directory -Force -Path $historyDir | Out-Null

$slug = $Title.ToLowerInvariant()
$slug = $slug -replace "[^a-z0-9]+", "-"
$slug = $slug.Trim("-")
if (-not $slug) { $slug = "garage-note" }

$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$path = Join-Path $historyDir "$stamp-$slug.md"

@"
# $Title

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm")
Area: Garage
Live app: ../Main File.html

## Goal


## Current Behavior


## Desired Behavior


## Affected Engine Area


## Risks And Edge Cases


## Files Touched


## Verification


## Follow-ups


"@ | Set-Content -Path $path -Encoding UTF8

Write-Host $path
