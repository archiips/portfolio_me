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
| `face_camera()` in roomlib | Turns figurines toward the camera — takes `model_forward_deg` |
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

### Area lights do not survive glTF — hence the bake

glTF has no area-light type. Seven of the ten lights above are area lights and
the exporter drops them, so the unbaked `room.glb` carries only `Sun_Key`,
`DeskLamp` and `GlowLight` and looks nothing like the render. `bake.py` solves
this by moving the lighting into the textures.

## Baking

```bash
blender --background ~/main/Blender/room.blend --python 3d/bake.py
```

Takes about 3–5 minutes on an M3 (Cycles on Metal, 48 samples, COMBINED).
Outputs `~/main/Blender/room_baked.blend` and `public/models/room-baked.glb`.

| | `room.glb` | `room-baked.glb` |
|---|---|---|
| Size | 11.7 MB | 9.7 MB |
| Lights | 3 (of 10) | **0** |
| Images | ~140 | 10 |
| Materials | many | 16, ten with `emissiveTexture` |
| Looks like the render | no | **yes** |

How it works:

1. Decimate to the same 8k-triangle budget the web export uses, so the bake
   isn't paying for geometry that never ships.
2. Join static meshes into 2048px atlas batches. The five nav targets stay
   separate at 1024px (`nav_projects`, `nav_aboutme`, …) so the web layer can
   still outline them individually. Hitboxes are untouched.
3. Smart UV Project into a dedicated `Bake` UV layer per target.
4. Bake COMBINED (direct + indirect), then give each target one flat material:
   black base colour, baked image as emission.
5. Delete all lights and zero the world.

Animated objects — the panda and the steam — are excluded from the bake and
keep their own materials, so the web layer still wants a dim ambient light
for them.

### Gotchas hit while writing this

- **Generated images are not saved with the .blend unless packed.** The first
  run produced a correct GLB (exported in the same session) but a `.blend`
  that reopened completely black. `img.pack()` after each bake fixes it.
- Appended assets leave objects in collections that aren't linked to the view
  layer; `select_set()` raises on those, so selection is filtered.
- `aboutme` is not an object name — it lives on `Poster_Messi` — so `NAV` is a
  section→object mapping.

In the browser, finish the look the way the reference does: a `#82ADED`
overlay at 45% opacity in `mix-blend-mode: overlay`, plus bloom and gold
`#FFDE85` hover outlines.

## Desk layout

Everything on the desk is placed to avoid collisions; the lamp, headphone
stand, coffee cup and mousepad all overlapped at some point. Current zones:

- **x 0.45–1.00** — lamp (back), headphones (front), coffee + steam, rubik's cube
- **x 1.01–1.71** — monitor, white mousepad, keyboard, white mouse
- **x 1.72–2.15** — hot wheels track with three die-cast cars, pencil, lego

## Model rest headings

`face_camera()` originally assumed every model rests facing +Y. That is not
true, and it left figurines staring at the wall. The rest heading must be
measured per asset from the `angles` views and passed as `model_forward_deg`
(0 = +X, 90 = +Y):

| Asset | Rest heading |
|---|---|
| LeBron figure | 230° |
| PotatoMan | 141° |
| Gaming PC case | front is +X — identified by the intake fans sitting on that face |

The PC is rotated −90° so its front faces the chair at −Y.

## Wall spacing

`space_wall_items()` lays the pegboard, shelf unit, vinyl and poster out with
equal gaps across y −1.86 → 1.42, all on one vertical centre at z 1.60. Placed
individually they crowded together, with the pegboard touching the shelf.

The desk lamp sits at y 1.65. The curtain plane starts at y 1.80 and the lamp
is 1.11 m tall, so at its original y 1.84 the shade passed straight through it.

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
| `public/textures/messi-pin.jpg` | Pinterest pin `11329436559819330` — an oil-painting style Messi artwork | **Unknown artist, copyrighted** — no licence identified |
| `public/textures/talk-to-you.jpg` | iTunes artwork API, Ricky Montgomery *Talk to You* | **Copyrighted** — label-owned cover art |

Neither of these is licensed for redistribution. Both are fine while the
project is local, but they should be replaced or cleared before the site is
public — the Messi piece in particular is someone's original painting and
the Pinterest pin does not credit them.

The poster is 1080x1920, so the square asset frame is replaced by a built
portrait frame at 9:16 rather than squashing the image.

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
