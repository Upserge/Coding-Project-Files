# One-pass MP4 loops for the work reel. Run locally: npm run media:loops
# Requires ffmpeg (winget install Gyan.FFmpeg). Source clips: media/{slug}.mp4

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$OutDir = Join-Path $RepoRoot "public/work/loops"
$SourceDir = Join-Path $RepoRoot "media"
$Slugs = @("resume-site", "gambdle", "hunt-and-hide", "lil-green-ghouls", "pacman")
$MinSourceBytes = 500000
$TargetW = 760
$TargetH = 380
$MaxDurationSec = 8

function Find-Ffmpeg {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft/WinGet/Links/ffmpeg.exe"),
        "C:\Users\upser\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }

    $cmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    Write-Error "ffmpeg not found. Install: winget install Gyan.FFmpeg"
}

$ffmpeg = Find-Ffmpeg
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$vf = "scale=${TargetW}:${TargetH}:force_original_aspect_ratio=increase,crop=${TargetW}:${TargetH},fps=30"

foreach ($slug in $Slugs) {
    $input = Join-Path $SourceDir "$slug.mp4"
    if (-not (Test-Path $input)) {
        Write-Warning "Skip $slug - missing media/$slug.mp4"
        continue
    }

    $size = (Get-Item $input).Length
    if ($size -lt $MinSourceBytes) {
        Write-Warning "Skip $slug - file is $size bytes (OneDrive stub?). Right-click -> Always keep on this device, then retry."
        continue
    }

    Write-Host "==> $slug ($([math]::Round($size / 1MB, 1)) MB)" -ForegroundColor Cyan

    $mp4Out = Join-Path $OutDir "$slug.mp4"
    & $ffmpeg -y -hide_banner -loglevel warning -i $input -an -t $MaxDurationSec `
        -vf $vf -c:v libx264 -preset veryfast -crf 28 -movflags +faststart `
        $mp4Out

    $mp4Kb = [math]::Round((Get-Item $mp4Out).Length / 1KB)
    Write-Host "    -> $mp4Kb KB" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Commit public/work/loops/*.mp4 - posters use existing hero images." -ForegroundColor Cyan
