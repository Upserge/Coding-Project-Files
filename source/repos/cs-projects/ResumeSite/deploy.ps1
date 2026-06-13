# Deploy ResumeSite: commit source to Coding-Project-Files, build, push to Jason.io.
# Usage: .\deploy.ps1 [-CommitMessage "optional message"] [-SkipSourceCommit]

[CmdletBinding()]
param(
    [string]$CommitMessage = "",
    [switch]$SkipSourceCommit
)

$ErrorActionPreference = "Stop"

$ResumeSiteRoot = $PSScriptRoot
$MonorepoRoot = (Resolve-Path (Join-Path $ResumeSiteRoot "..\..\..\..")).Path
$ResumeSiteRepoPath = "source/repos/cs-projects/ResumeSite"
$JasonIoRoot = if ($env:JASON_IO_ROOT) { $env:JASON_IO_ROOT } else { "C:\Users\upser\OneDrive\Desktop\Jason.io" }
$DistBrowser = Join-Path $ResumeSiteRoot "dist\ResumeSite\browser"
$ExpectedBaseHref = "/Jason.io/"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

# Git writes CRLF/LF warnings to stderr; with $ErrorActionPreference = Stop that aborts the script.
function Invoke-GitQuiet {
    param([Parameter(Mandatory = $true)][string[]]$GitArgs)

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        & git @GitArgs 2>$null
        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $prev
    }
}

function Invoke-GitOutput {
    param([Parameter(Mandatory = $true)][string[]]$GitArgs)

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        return (& git @GitArgs 2>$null)
    }
    finally {
        $ErrorActionPreference = $prev
    }
}

function Invoke-GitStrict {
    param([Parameter(Mandatory = $true)][string[]]$GitArgs)

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        $output = & git @GitArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            $text = ($output | Out-String).Trim()
            throw "git $($GitArgs -join ' ') failed (exit $LASTEXITCODE): $text"
        }
        if ($output) {
            Write-Output $output
        }
    }
    finally {
        $ErrorActionPreference = $prev
    }
}

function Ensure-GitRepo([string]$Path, [string]$Label) {
    if (-not (Test-Path (Join-Path $Path ".git"))) {
        throw "$Label repo not found at: $Path"
    }
}

function Get-HasGitChanges([string]$RepoPath, [string[]]$Pathspec) {
    Push-Location $RepoPath
    try {
        if ($Pathspec) {
            $unstaged = (Invoke-GitQuiet (@("diff", "--quiet", "--") + $Pathspec)) -ne 0
            $staged = (Invoke-GitQuiet (@("diff", "--cached", "--quiet", "--") + $Pathspec)) -ne 0
            $untracked = @(Invoke-GitOutput (@("ls-files", "--others", "--exclude-standard", "--") + $Pathspec)).Count -gt 0
            return $unstaged -or $staged -or $untracked
        }

        $unstaged = (Invoke-GitQuiet @("diff", "--quiet")) -ne 0
        $staged = (Invoke-GitQuiet @("diff", "--cached", "--quiet")) -ne 0
        $status = Invoke-GitOutput @("status", "--porcelain")
        return $unstaged -or $staged -or [bool]$status
    }
    finally {
        Pop-Location
    }
}

Write-Step "Checking repository paths"
Ensure-GitRepo $MonorepoRoot "Coding-Project-Files"
Ensure-GitRepo $JasonIoRoot "Jason.io"

if (-not $SkipSourceCommit) {
    Write-Step "Committing ResumeSite source to Coding-Project-Files (master)"
    Push-Location $MonorepoRoot
    try {
        $hasChanges = Get-HasGitChanges $MonorepoRoot @($ResumeSiteRepoPath)
        if ($hasChanges) {
            Invoke-GitStrict (@("add", "--") + @($ResumeSiteRepoPath))
            if (-not $CommitMessage) {
                $CommitMessage = "Update ResumeSite source."
            }
            Invoke-GitStrict @("commit", "-m", $CommitMessage, "-m", "Automated deploy script commit for ResumeSite.")
            Write-Host "Committed source changes." -ForegroundColor Green
        }
        else {
            Write-Host "No ResumeSite source changes to commit." -ForegroundColor Yellow
        }

        Write-Step "Pushing Coding-Project-Files to origin/master"
        Invoke-GitStrict @("push", "origin", "master")
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "Skipping source commit (--SkipSourceCommit)." -ForegroundColor Yellow
}

Write-Step "Building ResumeSite for GitHub Pages (baseHref $ExpectedBaseHref)"
Push-Location $ResumeSiteRoot
try {
    npm run build -- --configuration=github-pages
    if ($LASTEXITCODE -ne 0) {
        throw "Production build failed."
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path $DistBrowser)) {
    throw "Build output not found: $DistBrowser"
}

$indexPath = Join-Path $DistBrowser "index.html"
$indexHtml = Get-Content $indexPath -Raw
if ($indexHtml -notmatch [regex]::Escape("<base href=`"$ExpectedBaseHref`">")) {
    throw "Built index.html is missing expected base href: $ExpectedBaseHref"
}

Write-Step "Deploying dist to Jason.io (main)"
Push-Location $JasonIoRoot
try {
    Invoke-GitStrict @("checkout", "main") | Out-Null
    Invoke-GitStrict @("pull", "origin", "main")

    $builtFiles = Get-ChildItem -Path $DistBrowser -File
    if ($builtFiles.Count -eq 0) {
        throw "Build output folder is empty: $DistBrowser"
    }

    foreach ($file in $builtFiles) {
        Copy-Item -Path $file.FullName -Destination (Join-Path $JasonIoRoot $file.Name) -Force
    }

    Copy-Item -Path (Join-Path $DistBrowser "index.html") -Destination (Join-Path $JasonIoRoot "404.html") -Force

    $newMain = (Get-ChildItem -Path $DistBrowser -Filter "main-*.js" | Select-Object -First 1).Name
    $newStyles = (Get-ChildItem -Path $DistBrowser -Filter "styles-*.css" | Select-Object -First 1).Name

    Get-ChildItem -Path $JasonIoRoot -Filter "main-*.js" | ForEach-Object {
        if ($_.Name -ne $newMain) {
            Remove-Item $_.FullName -Force
            Write-Host "Removed stale bundle: $($_.Name)" -ForegroundColor DarkYellow
        }
    }

    if ($newStyles) {
        Get-ChildItem -Path $JasonIoRoot -Filter "styles-*.css" | ForEach-Object {
            if ($_.Name -ne $newStyles) {
                Remove-Item $_.FullName -Force
                Write-Host "Removed stale stylesheet: $($_.Name)" -ForegroundColor DarkYellow
            }
        }
    }

    Get-ChildItem -Path $JasonIoRoot -Filter "chunk-*.js" | Remove-Item -Force

    $prodIndex = Get-Content (Join-Path $JasonIoRoot "index.html") -Raw
    if ($prodIndex -notmatch [regex]::Escape("<base href=`"$ExpectedBaseHref`">")) {
        throw "Production index.html base href verification failed."
    }

    if (Get-HasGitChanges $JasonIoRoot) {
        Invoke-GitStrict @("add", "-A")
        $deployMessage = "Deploy ResumeSite production build."
        Invoke-GitStrict @("commit", "-m", $deployMessage, "-m", "Automated deploy: $ExpectedBaseHref base href, 404 SPA fallback, bundle $newMain.")
        Invoke-GitStrict @("push", "origin", "main")
        Write-Host "Production deploy pushed to origin/main." -ForegroundColor Green
    }
    else {
        Write-Host "Jason.io already matches the latest build. Nothing to push." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

Push-Location $ResumeSiteRoot
Write-Step "Deploy complete"
Write-Host "Source repo : https://github.com/Upserge/Coding-Project-Files/tree/master/$($ResumeSiteRepoPath -replace '\\','/')" -ForegroundColor Green
Write-Host "Production  : https://upserge.github.io/Jason.io/" -ForegroundColor Green
Write-Host "Working dir : $ResumeSiteRoot" -ForegroundColor Green
