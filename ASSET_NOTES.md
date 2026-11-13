# Citrus hero artwork

## Gallery additions, 12 November 2026

Six previously unused originals from the supplied Drive folder were exported to WebP, retaining their original content. Their cached source files are in the existing local `crave-social-build/reference/originals` directory:

| Original | Website asset |
| --- | --- |
| `04.jpg` | `bling-blooms.webp` |
| `09.jpg` | `bling-portrait.webp` |
| `11.jpg` | `bling-room.webp` |
| `14.jpg` | `bling-table.webp` |
| `18.jpg` | `bling-guest.webp` |
| `22.jpg` | `bling-gifts.webp` |

`tangerine-scatter.svg` is a local vector illustration for the blue Haunted Social section. `hero-aperture.svg` supplies the matching white cutout when WebGL is unavailable.

Final asset: `dist/assets/citrus-glass.png`.

Prepared with the built-in imagegen tool from the user's attached orange-and-glass image. This is a generated transparent adaptation of the attachment, used in place of the lilies. The original output remains in the local Codex generated-images folder. It is rendered on a depth-tested image plane in the hero, with gentle movement; it is not a volumetric fruit model.

The reference images and clips for the galleries are used to study motion only. The website's event photographs and five films come from the user's supplied media.

## Final image preparation prompt

Use case: background-extraction. Asset type: transparent hero artwork for a website. Edit target: the user's attached photorealistic orange half-slice encircled by a clear spiral glass ribbon, on a pale blue background. Other attached images (a colour palette screenshot and website loading-screen screenshots) are supporting context only and MUST NOT appear in the output. Primary request: isolate the orange slice AND the entire clear glass ribbon from the blue background, with a true alpha transparent background. Preserve the orange's original half-circle shape, angle, juicy photographic texture, rind, orange colour, and the clear glass ribbon's flowing spiral shape, reflections and fine orange-tinted edges. Reconstruct only the transparent glass areas so the pale blue background is removed cleanly and can composite on cloud blue or cream. Show the full original citrus-and-glass composition, centered with a small safe margin around every glass edge; no cropping. Keep the reference composition and photorealistic 3D product-render quality. No text, no palette swatches, no UI, no extra fruit, no lily, no checkerboard baked into the output.

# Half-tangerine community banner

Final asset: `dist/assets/tangerine-garden.png`.

Generated with the built-in imagegen tool as a transparent decorative strip for the people banner. This replaces the flowers from the user's layout reference. The original generated output remains in the local Codex generated-images folder; the website uses its project-local copy.

## Final generation prompt

Use case: stylized-concept. Asset type: decorative cutout strip along the bottom edge of a website community banner. Create a wide horizontal arrangement of cute miniature half tangerines, like a small cheerful citrus garden, on a genuinely transparent alpha background. Soft premium 3D product illustration, juicy orange flesh with delicate radial segments, thick creamy pale pith, slightly bumpy orange peel, softly rounded forms, warm studio lighting. Around twelve half fruits in different sizes and angles, some cut faces upright toward camera, some reclining, overlapping into a continuous gently uneven row. Their bottoms share one ground line. Include a few tiny orange wedges for variety. The highest fruits reach at most one third of the image height; the upper two thirds are transparent empty space. Composition wide 3:1, reaches across almost the full width, leave a narrow transparent margin around left and right edge. Colours juicy tangerine #FF831F, warm orange, butter #FFF1B8 and creamy white #FFFDF7 highlights. No blue background, no flowers, no leaves, no faces, no text, no UI, no containers, no harsh dark shadows. The resulting strip must composite naturally over a cloud blue webpage.

## Loading reference — 13 November 2026

The loader follows the image-cycling composition of the user-supplied Pinterest pin `707346685267899283`, which names Cappen.com. The original Cappen loader was inspected for its small central image, upward entrance, quick image changes and side wordmarks. The implementation is local GSAP code and uses only Crave photos already exported from the supplied Drive folder: `06f1e.webp`, `242d5.webp`, `bling-blooms.webp`, `5791d.webp`, `bling-portrait.webp`, `8304d.webp`, `bling-gifts.webp` and `1bb58.webp`. No Cappen images or scripts are shipped.

## Updated brand loader and palette

The central loader now uses the existing vector half-tangerine inside a Citrus Orange square, framed by enlarged bold crave / social text. The previous image-cycling loader has been replaced by this brand-mark layout. The original event photographs remain in the galleries. Logo, aperture and scatter SVG colours were updated to the five-colour palette using SVG edits; no bitmap photos were recoloured.

## Forest reference and restored photographs

The latest logo reference is matched with forest green `#202E29` for the hero and supporting surfaces. The central loader again uses the eight original Drive photos listed above, without recolouring or modifying them. Their opacity is switched on one GSAP timeline; the citrus logo remains in the navbar and footer.
