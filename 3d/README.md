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

## Room layout

4.4 m x 4.0 m x 2.7 m, open on two sides as a diorama. Walls on -X and +Y,
camera looking in from (+X, -Y, +Z). A window is cut into the back wall at
x 0.70-2.10, z 0.95-2.15, with a gradient sky card tucked just behind the
glass (close enough that parallax never lets it peek past the wall edge).

## Lighting

Follows the reference's scheme — warm interior, cool overlay:

| Light | Colour | Role |
|---|---|---|
| `Sun_Key` | `#FFD9A0` | Low warm sun raking through the window |
| `Win_Fill` | `#FFE7BF` | Soft bounce just inside the glass |
| `Amb_Bounce` | `#FFE7BF` | Broad ambient, the reference's `AmbientLight` |
| `Floor_Bounce` | `#FFD9B0` | Keeps floor and bed out of the mud |
| `Front_Fill` | `#FFE7BF` | Fill from the open side |
| `Rim_Cool` | `#82ADED` | Cool rim so the warm key reads against something |
| `GlowLight` | `#FFD4A6` | Point light at the `glow` orb |
| `ScreenLight` | `#8FC2F0` | Monitor spill |
| `StripLight` | `#FFC98A` | LED strip under the floating shelf |

World background is `#201910`, matching the reference's clear colour.
Emissive meshes: `glow`, `screen_glow`, `shelf_strip`.

In the browser, finish the look the way the reference does: a `#82ADED`
overlay at 45% opacity in `mix-blend-mode: overlay`, plus bloom and gold
`#FFDE85` hover outlines.

## Interaction naming

Raycast targets are invisible boxes; the visible group carries the section name.

| Section | Object | Hitbox |
|---|---|---|
| Projects | Monitor | `projectshitbox` |
| About | Wall painting | `aboutmehitbox` |
| Education | Book stack | `educationhitbox` |
| Work | Display cabinet | `workhitbox` |
| Contact | Photo garland | `contacthitbox` |

Hitboxes are hidden in render but exported to the GLB — set `visible = false`
on load and raycast against them.
