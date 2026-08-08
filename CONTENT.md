# VJ One — quick content guide

Every editable string, link and media path lives in `app/site.config.ts`.

## Media

Replace the files in `public/media/` keeping the same names and nothing in the
code needs to change.

| File | Where it appears |
| --- | --- |
| `hero-desktop.mp4` | Background film, viewports wider than 900px |
| `hero-mobile.mp4` | Background film, 900px and under (also 1080p) |
| `take-1.mp4` … `take-4.mp4` | The four cards, and fullscreen playback |

The takes are 720×1280 (9:16). Keep new files vertical — the fullscreen viewer
frames them at native 9:16, uncropped.

**Always encode H.264, never HEVC.** The original hero was HEVC, which Chrome
and Firefox largely refuse to play. Both hero cuts are H.264, audio stripped,
with `faststart` so they begin playing before the download finishes:

- desktop — 1920×1080 @ 8000 kbps
- mobile — 1920×1080 @ 5000 kbps

**Keep the mobile cut at 1080p.** It was 720p and looked bad: the film is
landscape and gets `object-fit: cover` on a portrait screen, so it is scaled to
fill the *height* — a 375×812 phone at DPR 3 wants ~2400px of height and 720p
only has 720. Resolution, not bitrate, was the bottleneck.

The film **streams** — it is not fully downloaded before the site appears — so
file size does not delay the intro and quality does not have to be traded away.

The HEVC originals are archived in `_originals/` (git-ignored).

## Copy and links

Edit in `app/site.config.ts`:

- `name`, `brandMark`, `tagline`
- `hero.chapter`, `hero.lineOne`, `hero.lineTwo`, `hero.scrollCue`
- `statement` — the two-line phrase in the hero foot (static text, not a link)
- `reel.chapter`, `reel.hint`
- `takes[].title` / `.meta` / `.index`
- WhatsApp: change `WHATSAPP_NUMBER` (digits only, country + area code) and
  `WHATSAPP_MESSAGE` at the top of the file.

Page title, description and social preview text live in `app/layout.tsx`.

## How the page is built

It is **one section**. `.reel` is 230vh tall with a sticky viewport that stays
pinned for the whole scroll, so content moves over one continuous shot rather
than between separate blocks. Scroll position scrubs the headline out and the
cards in.

### Careful: the blend depends on the stacking context

`Beyond` and the brand lockup use `mix-blend-mode: difference` against the film.
That only works because `.backdrop` is rendered **inside** `.reel__viewport`,
which is the stacking context they all share. Two consequences:

- Do not move `.backdrop` back out of the viewport, or the blend silently stops
  compositing against anything.
- Do not add `transform`, `filter`, `opacity < 1`, `isolation` or a `z-index` to
  `.reel__intro` or `.reel__headline`. Any of those makes the element a stacking
  context and cuts the blended type off from the film. This is why the scroll
  animation fades `.reel__intro` with opacity alone — a `filter: blur(0px)` left
  behind at rest was enough to kill it.

## Intro

Ported from the original project (`Codex/vj-authority`). Pure CSS on an
`is-leaving` flag, driven by two timers in `Experience.tsx`:

1. `VJ` flies in from the left and `ONE` from the right, tracking closing from
   `0.22em` to `-0.087em`, centred and at 48% scale.
2. At **1550ms** the dock descends into its hero position at full scale (1s).
3. The curtain is held back a full second, then collapses (`scaleY(0)`, 420ms)
   — the film is uncovered only after the lockup has landed.
4. At **3040ms** the overlay unmounts and `.reel__brand` takes over in the same
   frame. It holds a beat, drops out of frame, and the headline curtains in.

The dock and `.reel__brand` are two elements at **identical coordinates** —
verified at 1440×860 and 375×812, both landing on the same rect. If you change
one's position, font size or letter-spacing, change the other or the handoff
will visibly jump.

Both are `mix-blend-mode: difference` over the film.

Plays once per tab — `sessionStorage` key `vj-one-seen-v1`. Clear it to replay:

```js
sessionStorage.removeItem('vj-one-seen-v1')
```

An inline script in `app/layout.tsx` sets `data-vj-returning` /
`data-vj-reduced` before first paint so returning and reduced-motion visitors
never see a frame of the intro.

## Cards and playback

**Nothing on the cards is blurred** — the films are plainly visible. The only
overlay is a gradient, present so the index and caption keep contrast.

Hovering starts a silent preview. Clicking opens **fullscreen playback** at
native 9:16 with no filter, crop or grade, and clears that card's centre title
so nothing sits over the footage. Escape, the close button, or a click outside
the frame dismisses it.

Blur belongs to **one place only**: the hero background film, which drops to
`blur(26px) brightness(0.4)` while a film is open.
