# Crave Social — The Invitation

A complete responsive brand website, based on the supplied Crave Social Figma file, the Kelvin reference and the attached motion reference. All runtime assets are local: fonts, photographs, SVGs, animation libraries and five optimized event films.

## Run locally

Requires Node.js 20 or newer. No dependency installation is needed to serve the site.

```sh
npm run dev
```

Open http://127.0.0.1:4173. The complete website lives in `dist/`. The source repository is https://github.com/ameeranaushin/crave-social. Serve or deploy the contents of `dist/` with any static host. Pushing source to GitHub does not deploy a live website.

## Deploy on Vercel

Import this repository with the Root Directory left at the repository root (`.`). The tracked `vercel.json` selects the Other framework preset, runs `npm run check`, and publishes `dist` as the Output Directory. Vercel must serve `dist/index.html` at `/`, rather than exposing the site beneath `/dist/`. Pushes to `main` trigger production deployments when the GitHub integration is connected.

## Connect enquiries

Set `enquiryEmail` in `dist/config.js` when the business email is available. The form then prepares a populated email for the visitor to send in their own email app. Until configured, it explicitly downloads an unsent enquiry draft. No form submission, inbox delivery or guest-list registration is claimed. If automatic form delivery is wanted later, connect a server endpoint or an existing form provider.

The Bloom Affair date, time and location come from the supplied design. Update `dist/index.html` when the event changes. No fabricated testimonials or statistics have been included.

## Motion

- The preloader flashes eight original event photographs inside the central square. Large, bold crave / social typography stays on either side with generous tracking. The photos swap on a single GSAP timeline without blank frames; scrolling, navigation keys and Skip dismiss the entrance immediately.
- The complete orange-and-glass artwork stands in front of the oval hero panel, like the supplied flower placement. A shared grid keeps hero copy inside the panel corners, with responsive type sizes.
- A sticky hero stage lifts the aperture away as native scrolling reveals the oversized statement character by character, with perspective and staggered timing.
- The moments heading uses a staggered, scroll-driven blur-to-sharp reveal for its two lines and supporting copy.
- Bling & Scoops: paired vertical slides travel in opposite directions as the user scrolls, alternating small and large photograph compositions. Six additional unused Drive originals bring the gallery to twelve photos, with four visible per scene. The section has no timer or automatic slide changes.
- A Haunted Social uses larger desktop photographs. Each pair moves into focus as the previous pair moves upward. Mobile portrait keeps a short pinned sequence of larger postcards shuffling to alternate sides. Short landscape windows and reduced motion use readable flowing layouts.
- A little reel life: the original semicircular fan is restored. Five video cards complete one full cycle within that curved layout across one viewport of scrolling, then the scene releases into the next section. Decorative stills at the ends continue the arc as cards return. Only central video previews decode frames as scroll progress changes, and they hold still at rest. Larger cards have close gaps sized to their rotations, with both title lines placed above the arc. Previous/next controls and keyboard navigation provide another way through the films. On mobile, native vertical scrolling pins the scene and moves all five cards horizontally from right to left. Each film is centered in turn, with 01 / 05 through 05 / 05 counters and play buttons. Brief opening and closing holds let the scene settle before releasing to the next section. Reduced motion keeps a native swipe gallery. Films load only when opened. Click/tap opens the full video player.
- The orange ribbon and the small section-label rows have been removed. Functional gallery controls, event details and navigation remain.
- Previous-event links lead into the expanding Upcoming Experiences tickets. Closed desktop rails show Open + vertically, and the current ticket shows Viewing. Mobile uses horizontal action cues.
- Brand worlds: feature cards enter in sequence as in the supplied reference. The desktop pin is brief and leaves time to read the final layout. Mobile uses individual cards in ordinary vertical flow.
- People: a wide cloud-blue community banner with a white content card and a generated row of half tangerines instead of flowers.
- The final chapter uses three illustrated postage stamps for brands, creators and the next invitation.
- Footer: CRAVE SOCIAL rises into its original position one letter at a time, directly following scroll progress.
- Photo captions, corner tags, picture badges and outward share-like arrow ornaments have been removed. Images retain accessible descriptions and lightbox functionality.
- Native image lightbox with keyboard navigation, enquiry dialogs and mobile navigation.
- Automatic `prefers-reduced-motion` support and a visitor-controlled motion switch.

After the automatic opening and curved reveal, section presentation timelines follow native scroll progress and hold still at rest. Buttons and the full video player respond to explicit interaction. Reduced motion skips the opening, replaces the sticky sequences with ordinary stacked sections, displays the photo galleries as grids and keeps video previews paused. The motion switch can change this during a visit. WebGL failure displays the local citrus image as a fallback. The hero uses a textured image plane rather than a volumetric orange model, preserving the supplied composition. See `ASSET_NOTES.md` for the image preparation prompts and provenance.

The supplied palette is Cloud Blue `#C8D8F1`, Juicy Tangerine `#FF831F`, Butter Yellow `#FFF1B8`, Soft Cream `#FFFDF7`, Midnight Ink `#243B53` and Soft Lilac `#DCD3F5`. Shared colour tokens live in `dist/citrus-social.css`.

## Validation

```sh
npm install
npm run check
npm run qa:scroll
npm run qa:refinement
```

The QA suite expects the local server running and installed Google Chrome. It checks automatic opening playback without scrolling, the curved hero reveal, idle-state stability, reversible scroll motion, two cards per Haunted stage, one complete cycle within the semicircular Reel Life fan, scroll-scrubbed video frames, full video playback, feature cards, enquiry drafts, the individual footer letters, mobile navigation and reduced-motion cleanup. It also checks images, browser errors and overflow at 1440, 768, 390 and 360 px. Screenshots and results are written to ignored `qa/scroll/`. The earlier QA entrypoints delegate to this suite. The refinement suite additionally checks interrupted entrances, fast/reverse wheel input, small trackpad-like deltas, sticky boundaries, film-card gaps at 900 and 720 px desktop heights, autonomous ribbon continuity, anchor links and direct anchor loads, stable dialog return, native horizontal and vertical touch gestures, gallery controls, mobile landscape, reduced motion and layout shifts. Its screenshots and report are in ignored `qa/refinement/`.

## Sources

- [Crave Social Figma design](https://www.figma.com/design/bEkHmp4JZXqo2bQwju2Lrj/Crave-Social-%E2%80%94-The-Invitation?node-id=20-523)
- [Supplied media folder](https://drive.google.com/drive/folders/1a6NkiHFSDIHP-ysPDGp_BkOz40uS9dUP)
- [Kelvin visual reference](https://kelvin.8b.com/)
- User-supplied `website inspo.mp4`, used only as a motion reference.
- [Bling & Scoops opposing slides reference](https://in.pinterest.com/pin/349873464805367834/).
- User-supplied `gallery inspo.mp4`, used as the Haunted Social stack-to-columns reference.
- [Reel Life fan reference](https://in.pinterest.com/pin/569353577917470858/).
- [Event ticket accordion reference](https://in.pinterest.com/pin/867717053229695870/).
- [Sequential feature-card motion reference](https://in.pinterest.com/pin/942730134518011607/).
- [People banner reference](https://in.pinterest.com/pin/1033646551993106715/).
- [Postage-stamp chapter reference](https://in.pinterest.com/pin/150237337565385368/).
- Generated half-tangerine strip: `dist/assets/tangerine-garden.png`, prepared with the built-in imagegen tool. The complete prompt is in `ASSET_NOTES.md`.
- User-supplied citrus image and palette screenshot. The transparent hero artwork is saved in `dist/assets/citrus-glass.png`.
- Local GSAP 3.13.0 and ScrollTrigger distributions retain their license headers. Typefaces are Antonio, Hubot Sans, Kalnia and Cormorant Garamond from Google Fonts.
- Three.js 0.180.0 is bundled locally under its MIT license. The hero image, geometry and libraries are all local; there are no external requests at runtime.

The photos retain their original content and were exported to WebP for delivery. Full-resolution Drive originals were matched to the Figma media and used where available. Event videos were converted to silent H.264 MP4 for web playback. Source media and tooling scratch files are excluded from version control.

## Visual revision — 13 November 2026

The half-tangerine is the C in both wordmarks; the footer text starts with RAVE SOCIAL. Mobile portrait restores the opposing photo slides and postcard shuffle, with native scrolling and reversibility. The mobile films now use a pinned horizontal sequence driven by vertical scroll.

`npm run qa:refinement` verifies the new loading canvas, clean hero, removed strip and labels, enlarged cards, ticket cues, mobile motion, reverse scrolling, touch gestures, landscape layouts, anchors and reduced motion. Screenshots and results are in ignored `qa/revision-nov13/`.

## Brand and mobile reels

`dist/brand-theme.css` defines the five brand roles: Deep Slate Charcoal `#1A2321`, Citrus Orange `#F7931A`, Muted Slate Blue `#4A6B82`, Sage Green `#5C765C` and Soft Cream `#F5F2EB`. Existing CSS tokens map to these roles. SVG brand elements and the WebGL hero panel use the same colours.

Mobile portrait and touch landscape layouts use the pinned film sequence. Desktop keeps the existing fan. The pin follows native vertical input directly, works in reverse, preserves play and keyboard controls, releases after the fifth film, and falls back to a normal carousel for reduced motion.

Run `npm run qa:brand` for palette, loader, centered film positions, counters, playback, keyboard controls, reverse scrolling, pin release, landscape and reduced-motion verification at 360, 390 and 430 px. Screenshots and results are saved in ignored `qa/brand-update/`.

## Forest green, glass navigation and photo loader

The supplied logo reference adds `--brand-forest: #202E29`. The hero background, Reel Life, community banner, contact section and selected dark cards share this forest green. The navbar uses a translucent green tint, a soft highlight, a light border and 22px backdrop blur; the mobile menu uses a matching frosted overlay. Navigation stays in its existing document flow.

The loader square cycles through eight original Drive photographs every 150ms while preserving its large editorial type. Image decoding is prepared before playback with a bounded wait. The tangerine icon is no longer displayed in the loader.


## Text readability

`dist/readability.css` raises body copy to 16px and small labels and controls to at least 13px. Coloured surfaces define their foreground explicitly, including cream text on the slate-blue Haunted section and forest-green cards. Cards grow with their copy, mobile tickets reserve room for the larger type, and animated button fills stay underneath their labels.

The local readability audit and screenshots in ignored `qa/readability/` cover desktop, tablet and 360/390px mobile layouts, all three ticket states and button hover labels.
