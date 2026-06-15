# Reel loop media

## Quick workflow (recommended)

1. Put raw screen captures in `media/{slug}.mp4` (not committed — large files).
2. Ensure files are **fully downloaded** (OneDrive: *Always keep on this device*).
3. Run once locally:

   ```powershell
   npm run media:loops
   ```

4. Commit the outputs in `public/work/loops/*.mp4` (~200–800 KB each).

Posters come from existing `heroImage` assets — no separate poster step.

## Slugs

| Project | Source | Loop output |
|---------|--------|-------------|
| Resume Site | `media/resume-site.mp4` | `public/work/loops/resume-site.mp4` |
| Gambdle | `media/gambdle.mp4` | `public/work/loops/gambdle.mp4` |
| Hunt and Hide | `media/hunt-and-hide.mp4` | `public/work/loops/hunt-and-hide.mp4` |
| Lil Green Ghouls | `media/lil-green-ghouls.mp4` | `public/work/loops/lil-green-ghouls.mp4` |
| PAC-MAN | `media/pacman.mp4` | `public/work/loops/pacman.mp4` |

## Manual alternative

Export 760×380 MP4 loops directly into `public/work/loops/` with HandBrake, Clipchamp, or similar. Skip ffmpeg entirely.

## Why not WebM?

MP4 (H.264) covers all target browsers. A second WebM encode doubled runtime and caused most of the pipeline failures.
