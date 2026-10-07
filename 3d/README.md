# 3D Portfolio Room

Source for the interactive 3D room that will replace the macOS-desktop portfolio.
Inspired by [rachelqrwei.ca](https://rachelqrwei.ca); built from Archit's own
BlenderKit asset library.

## Files

| Path | What it is |
|---|---|
| `roomlib.py` | Placement helpers — append assets, measure world bounds, scale to real metres, snap to the floor |
| `build_room.py` | Rebuilds the entire room from scratch, headless or over MCP |
| `room-preview.png` | Reference render of the current state |
| `settle()` in roomlib | Raycasts a prop down onto the surface actually beneath it |
| `face_camera()` in roomlib | Turns figurines toward the camera instead of the wall |
| `../public/models/room.glb` | Web export (Draco + 512px textures), ~11 MB |

The master `room.blend` is **not** in git — it is ~160 MB, above GitHub's
100 MB per-file limit. It lives at `~/main/Blender/room.blend`.
`build_room.py` regenerates it, so the repo stays the source of truth.

## Rebuilding

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python 3d/build_room.py
```

Assets are read from `~/blenderkit_data/models/` by folder prefix, so the
BlenderKit library must be present locally.

## Floor

The stylized plank asset is a set of boards with gaps modelled in, so it is
scaled to a third of the room and arrayed 3x3 to cover the slab exactly. The
solid `Floor` stays underneath in a dark brown so the gaps read as grout
rather than as holes.

## Room layout

4.4 m x 4.0 m x 2.7 m, open on two sides as a diorama. Walls on -X and +Y,
camera looking in from (+X, -Y, +Z). A window is cut into the back wall at
x 0.70-2.10, z 0.95-2.15, with a gradient sky card tucked just behind the
glass (close enough that parallax never lets it peek past the wall edge).

## Lighting

Follows the reference's scheme — warm interior, cool overlay:

Deliberately dim — the ambient rig is kept low so the practical lights
(desk lamp, monitor, bedside orb, shelf strip) carry the room, as in the
reference.

| Light | Colour | Energy | Role |
|---|---|---|---|
| `Sun_Key` | `#FFD9A0` | 1.9 | Low warm sun raking through the window |
| `Win_Fill` | `#FFE7BF` | 190 | Soft bounce just inside the glass |
| `Amb_Bounce` | `#FFE7BF` | 115 | Broad ambient, the reference's `AmbientLight` |
| `Floor_Bounce` | `#FFD9B0` | 55 | Keeps the floor off pure black |
| `Front_Fill` | `#FFE7BF` | 42 | Fill from the open side |
| `Rim_Cool` | `#82ADED` | 65 | Cool rim so the warm key reads against something |
| `DeskLamp` | `#FFD4A6` | 34 | Spot — the main practical |
| `GlowLight` | `#FFD4A6` | 70 | Point light at the bedside `glow` orb |
| `ScreenLight` | `#8FC2F0` | 26 | Monitor spill |
| `StripLight` | `#FFC98A` | 14 | LED strip under the floating shelf |

World background `#201910` at strength 0.22, view exposure -0.30.
Emissive meshes: `glow`, `lamp_glow`, `shelf_strip`, and the monitor's
`Screen` mesh (textured with `public/wallpaper.jpg`).

### Known limitation: area lights do not survive glTF

glTF has no area-light type. Seven of the ten lights above are area lights and
the exporter drops them, so `room.glb` currently carries only `Sun_Key`,
`DeskLamp` and `GlowLight`. **The GLB will not look like the preview render
until the lighting is baked to texture.** This is why the reference bakes and
then runs a single `AmbientLight` at runtime.

In the browser, finish the look the way the reference does: a `#82ADED`
overlay at 45% opacity in `mix-blend-mode: overlay`, plus bloom and gold
`#FFDE85` hover outlines.

## Desk layout

Everything on the desk is placed to avoid collisions; the lamp, headphone
stand, coffee cup and mousepad all overlapped at some point. Current zones:

- **x 0.45–1.00** — lamp (back), headphones (front), coffee + steam, rubik's cube
- **x 1.01–1.71** — monitor, white mousepad, keyboard, white mouse
- **x 1.72–2.15** — hot wheels track with three die-cast cars, pencil, lego

## Animation

The scene runs 1-240 frames and the GLB carries 8 animation clips.

| What | How |
|---|---|
| Panda | Free-roaming walk loop over 7 waypoints across the open floor; heading is derived from the travel direction each leg |
| Steam | Six wisps rising off the coffee, each with a CYCLES modifier |

Steam phases are **1, 23, 45, 12, 34, 56** against a 66-frame span. They must
not be exact multiples of the span or every wisp lands on the same phase and
the plume pulses as one blob.

Steam uses `surface_render_method = 'BLENDED'` — EEVEE Next ignores the older
`blend_method`. A small emission keeps the wisps from reading as dark blobs in
a dim room. Honestly, convincing steam is better done as a sprite/shader in the
web layer; this is a reasonable stand-in.

In Three.js, play the clips with `THREE.LoopRepeat`.

## Wall art

| File | Source | Licence |
|---|---|---|
| `public/textures/messi.jpg` | Wikimedia Commons, *Lionel-Messi-Argentina-2022-FIFA-World-Cup (cropped)* | **CC BY 4.0** — attribution required if published |
| `public/textures/talk-to-you.jpg` | iTunes artwork API, Ricky Montgomery *Talk to You* | **Copyrighted** — label-owned cover art |

The album cover is fine locally, but it is not licensed for redistribution.
Consider replacing it before the site goes public.

**UV gotcha:** the poster mesh carries a `(90, 0, 90)` rotation, and Generated
texture coordinates are in *local* space — using them there smears the image
into stripes. It must use the mesh's own UV map. The vinyl sleeve is an
unrotated box, so Generated Y/Z works for it.

## Flat-modelled wall assets

Two assets ship lying flat with their display face on +Z: the wall painting
and the floating-shelf unit. Mounting them needs Euler `(90, 0, 90)`, which
sends +Z→+X (face the room), +Y→+Z (upright), +X→+Y (along the wall). Judging
them by "which axis is thinnest" gets it wrong — the shelf unit reads as a
horizontal shelf and ends up lying down like a table.

## Interaction naming

Raycast targets are invisible boxes; the visible group carries the section name.

| Section | Object | Hitbox |
|---|---|---|
| Projects | Monitor | `projectshitbox` |
| About | Archit's framed photo | `aboutmehitbox` |
| Education | Book stack | `educationhitbox` |
| Work | Display cabinet | `workhitbox` |
| Contact | Photo garland | `contacthitbox` |

Hitboxes are hidden in render but exported to the GLB — set `visible = false`
on load and raycast against them.


## Texture resolution

The BlenderKit textures are packed inside the asset `.blend` files with no
external path, so the 512px web downscale could not be reverted in the saved
`room.blend`. The source assets in `~/blenderkit_data/` are untouched —
re-running `build_room.py` restores full resolution.

## Not used

Four spare keyboards (`g915`, `ibm`, `white`, `apple-macintosh`) and three
spare PC cases (`computer-build`, `creator-s-dream`, `raijintek-paean`) are
duplicates of pieces already in the room. `smooth-podium` is four podiums
spread 1.8 m apart and does not scale down usefully. `mini-itx-pc` has no
`.blend` in its folder.
