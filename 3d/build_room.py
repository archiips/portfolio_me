"""Rebuild the 3D portfolio room from the local BlenderKit library.

    blender --background --python 3d/build_room.py

Inspired by rachelqrwei.ca: warm interior lighting, dark warm background,
a `glow` emissive lamp, and named hitboxes for raycast navigation.
"""
import bpy, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
exec(open(os.path.join(HERE, "roomlib.py")).read())

REPO = os.path.dirname(HERE)
BLEND_OUT = os.path.expanduser("~/main/Blender/room.blend")
GLB_OUT = os.path.join(REPO, "public", "models", "room.glb")

# Room shell, in metres. Diorama: walls on -X and +Y only.
RX0, RX1, RY0, RY1, RZ1, T = -2.2, 2.2, -2.0, 2.0, 2.7, 0.10
WX0, WX1, WZ0, WZ1 = 0.70, 2.10, 0.95, 2.15      # window opening
BACK_Y, LEFT_X = 1.97, -2.17                      # inner wall faces
DX0, DX1, DY0, DY1, DTOP = 0.45, 2.15, 1.22, 1.95, 0.75   # desk


def material(name, base, rough=0.75, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = srgb(base)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def emissive(name, hexcol, strength):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = srgb(hexcol)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs["Emission"],
                 next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs["Surface"])
    return m


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for coll in list(bpy.data.collections):
        bpy.data.collections.remove(coll)


def build_shell():
    scene = bpy.context.scene
    for n in ("Shell", "Furniture", "Desk", "Decor", "Lighting", "Camera", "Nav"):
        scene.collection.children.link(bpy.data.collections.new(n))

    # dark subfloor: the plank asset has gaps modelled in, and this reads
    # through them as grout rather than as holes
    m_floor = material("Floor_Wood", 0x3A2A1C, rough=0.80)
    m_wall = material("Wall_Warm", 0xCDB69B, rough=0.92)
    m_trim = material("Trim_Cream", 0xEADFCD, rough=0.80)
    m_desk = material("Desk_Wood", 0x6B4428, rough=0.55)

    box("Floor", RX0, RX1, RY0, RY1, -T, 0.0, "Shell", material=m_floor)
    for name, x0, x1, z0, z1 in (
        ("Wall_Back_L", RX0, WX0, 0.0, RZ1),
        ("Wall_Back_R", WX1, RX1, 0.0, RZ1),
        ("Wall_Back_Under", WX0, WX1, 0.0, WZ0),
        ("Wall_Back_Over", WX0, WX1, WZ1, RZ1),
    ):
        box(name, x0, x1, RY1, RY1 + T, z0, z1, "Shell", material=m_wall)
    box("Wall_Left", RX0 - T, RX0, RY0, RY1, 0.0, RZ1, "Shell", material=m_wall)
    box("Base_Back", RX0, RX1, RY1 - 0.02, RY1, 0.0, 0.10, "Shell", material=m_trim)
    box("Base_Left", RX0, RX0 + 0.02, RY0, RY1, 0.0, 0.10, "Shell", material=m_trim)

    for n, x0, x1, y0, y1, z0, z1 in (
        ("Desk_Top", DX0, DX1, DY0, DY1, DTOP - 0.045, DTOP),
        ("Desk_SideL", DX0, DX0 + 0.05, DY0 + 0.03, DY1, 0.0, DTOP - 0.045),
        ("Desk_SideR", DX1 - 0.05, DX1, DY0 + 0.03, DY1, 0.0, DTOP - 0.045),
        ("Desk_Back", DX0, DX1, DY1 - 0.04, DY1, 0.30, DTOP - 0.045),
    ):
        box(n, x0, x1, y0, y1, z0, z1, "Desk", material=m_desk)


def build_sky():
    """Gradient card right behind the glass. Kept close so parallax never
    lets its edge slip past the end of the back wall."""
    m = bpy.data.materials.new("Sky_Card")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    emi, ramp = nt.nodes.new("ShaderNodeEmission"), nt.nodes.new("ShaderNodeValToRGB")
    coord, sep = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = srgb(0xF6B978)
    ramp.color_ramp.elements[1].position = 0.95
    ramp.color_ramp.elements[1].color = srgb(0x7FA9D8)
    nt.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emi.inputs["Color"])
    emi.inputs["Strength"].default_value = 3.0
    nt.links.new(emi.outputs["Emission"],
                 next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs["Surface"])
    box("Sky_Card", -1.10, 2.08, 2.13, 2.17, 0.45, 2.50, "Shell", material=m)


def build_floor_planks():
    """Lay the stylized plank asset as a 3x3 tiling that covers the slab exactly.

    One stretched copy looks wrong - the asset is a set of spaced boards, so it
    is scaled to a third of the room and arrayed.
    """
    p = append_asset("stylized-wood-pl", into="Shell", rename="FloorPlanks")
    p.rotation_euler = (math.radians(90), 0, 0)   # local Y -> world Z, Z -> world Y
    bpy.context.view_layer.update()
    base = dims(p)
    NX, NY = 3, 3
    p.scale.x = (abs(RX1 - RX0) / NX) / base.x
    p.scale.z = (abs(RY1 - RY0) / NY) / base.y
    p.scale.y = 0.022 / base.z
    bpy.context.view_layer.update()
    for o in [o for o in descendants(p) if o.type == 'MESH']:
        a1 = o.modifiers.new("TileX", 'ARRAY')
        a1.count, a1.relative_offset_displace = NX, (1, 0, 0)
        a2 = o.modifiers.new("TileY", 'ARRAY')
        a2.count, a2.relative_offset_displace = NY, (0, 0, 1)
    bpy.context.view_layer.update()
    place(p, x=0.0, y=0.0, z=0.0, anchor="top-center")


def place_assets():
    O = bpy.data.objects

    w = append_asset("sliding-window-t", into="Shell", rename="Window")
    fit(w, WX1 - WX0, axis='x')
    w.scale.z *= ((WZ1 - WZ0) / dims(w).z)
    bpy.context.view_layer.update()
    place(w, x=(WX0 + WX1) / 2, y=2.05, z=WZ0)

    cu = append_asset("curtains", into="Decor", rename="Curtains")
    fit(cu, 1.66, axis='x')          # 1.95 overhung the wall, room ends at x=2.2
    place(cu, x=1.35, y=1.86)
    cu.location.z += (2.44 - world_bbox(cu)[1].z)

    bed = append_asset("modern-bed", into="Furniture", rename="Bed")
    fit(bed, 2.05, axis='y')
    place(bed, x=-1.45, y=1.95, z=0.0, anchor="bottom-center-maxy")

    bst = append_asset("bed-side-table", into="Furniture", rename="BedsideTable")
    fit(bst, 0.50, axis='x')
    place(bst, x=-1.92, y=-0.18, z=0.0)

    ca = append_asset("carpet", into="Decor", rename="Carpet")
    fit(ca, 2.20, axis='x')
    place(ca, x=0.15, y=-0.55, z=0.004)

    ch = append_asset("gaming-chair-ora", into="Furniture", rename="Chair")
    fit(ch, 1.15, axis='z')
    rot_z(ch, 195)
    place(ch, x=1.30, y=0.72, z=0.0)

    # desk surface
    for prefix, name, size, axis, xyz in (
        ("samsung-odyssey-", "Monitor", 0.82, 'x', (1.30, 1.78, DTOP)),
        ("mouse-pad", "MousePad", 0.62, 'x', (1.32, 1.42, DTOP + 0.002)),
        ("custom-keyboard", "Keyboard", 0.36, 'x', (1.24, 1.44, DTOP + 0.004)),
        ("wirelesss-mouse", "Mouse", 0.11, 'y', (1.56, 1.43, DTOP + 0.004)),
        ("gaming-computer-", "PC", 0.46, 'z', (0.82, 1.60, 0.0)),   # clear of Desk_SideL
        ("headphone-stand-", "HeadphoneStand", 0.26, 'z', (0.66, 1.72, DTOP + 0.002)),
        ("headphones-rigge", "Headphones", 0.19, 'z', (0.66, 1.70, 0.86)),
    ):
        o = append_asset(prefix, into="Desk", rename=name)
        fit(o, size, axis=axis)
        place(o, x=xyz[0], y=xyz[1], z=xyz[2])

    sc = append_asset("display-shelf-ca", into="Furniture", rename="ShelfCabinet")
    fit(sc, 1.95, axis='z')
    place(sc, x=-0.52, y=2.00, z=0.0, anchor="bottom-center-maxy")   # flush to wall

    pg = append_asset("pegboard", into="Decor", rename="Pegboard")
    pg.rotation_euler = (0, 0, math.radians(-90))      # face +X for the left wall
    fit(pg, 0.95, axis='z')
    place(pg, x=LEFT_X, y=-1.15, z=1.05, anchor="bottom-minx")

    pt = append_asset("wall-painting-m4", into="Decor", rename="Painting")
    pt.rotation_euler = (math.radians(90), 0, math.radians(90))   # modelled flat
    fit(pt, 0.46)
    place(pt, x=LEFT_X, y=0.75, z=1.42, anchor="bottom-minx")

    fs = append_asset("floating-shelf-w", into="Decor", rename="FloatShelf")
    fit(fs, 0.68, axis='y')
    place(fs, x=LEFT_X, y=-0.25, z=1.28, anchor="bottom-minx")

    gl = append_asset("photos-garland", into="Decor", rename="Garland")
    fit(gl, 1.30, axis='x')
    place(gl, x=-1.45, y=BACK_Y - 0.02, z=1.75)

    st = append_asset("small-table", into="Furniture", rename="SmallTable")
    fit(st, 0.78, axis='x')
    rot_z(st, 90)
    place(st, x=-1.86, y=-1.52, z=0.0)

    su = append_asset("succulent-plant", into="Decor", rename="Succulent")
    fit(su, 0.17)
    place(su, x=-1.95, y=-0.16, z=0.40)

    bk = append_asset("books", into="Decor", rename="Books")
    fit(bk, 0.26)
    rot_z(bk, 22)
    place(bk, x=-1.86, y=-1.72, z=0.49)   # front of the side table, clear of the iMac

    for prefix, name, size, axis, rz, (x, y, z) in (
        ("plush-dog-toy-ak", "Shiba", 0.30, None, -25, (-1.52, 0.35, 0.59)),
        ("stuffed-monkey-0", "Monkey", 0.26, None, 40, (-1.14, 0.82, 0.59)),
        ("garfield-slipper", "Slippers", 0.30, 'x', 15, (-0.72, -0.40, 0.00)),
        ("action-figure-le", "LeBron", 0.22, 'z', -150, (-0.68, 1.84, 1.95)),
        ("potatoman", "PotatoMan", 0.18, 'z', 160, (-0.36, 1.84, 1.95)),
        ("rubik-cube", "RubikCube", 0.09, None, 30, (-1.98, -0.44, 1.44)),
        ("rubik-pyraminx", "Pyraminx", 0.09, None, -20, (-1.84, -0.44, 1.44)),
        ("wooden-sparrow", "Sparrow", 0.13, 'x', -110, (-1.93, -0.10, 1.44)),
        ("lego-mini-figure", "Lego", 0.10, 'z', -165, (1.86, 1.56, DTOP + 0.002)),
        ("pencil-cup", "PencilCup", 0.13, 'z', 10, (1.97, 1.78, DTOP)),
        ("graphite-pencil", "Pencil", 0.17, None, 75, (1.78, 1.33, DTOP + 0.002)),
        ("eyeglass", "Glasses", 0.13, 'x', -35, (-1.77, -0.28, 0.40)),
    ):
        o = append_asset(prefix, into="Decor", rename=name)
        fit(o, size, axis=axis)
        if rz:
            rot_z(o, rz)
        place(o, x=x, y=y, z=z)


def fill_cabinet_and_extras():
    """Shelf heights were measured by raycasting down the cabinet's centre."""
    O = bpy.data.objects
    CY = 1.87
    SHELF = {1: 1.458, 2: 1.222, 3: 0.985, 4: 0.749}
    for prefix, name, size, z, x in (
        ("slowpoke", "Slowpoke", 0.17, SHELF[1], -0.50),
        ("peaking-birds", "PeakingBirds", 0.16, SHELF[2], -0.52),
        ("pencil-holder", "PencilHolder", 0.15, SHELF[4], -0.46),
    ):
        o = append_asset(prefix, into="Decor", rename=name)
        fit(o, size)
        face_camera(o)
        place(o, x=x, y=CY, z=z)

    sc = append_asset("scissors", into="Decor", rename="Scissors")
    fit(sc, 0.16)
    rot_z(sc, 35)
    place(sc, x=0.70, y=1.38, z=DTOP)

    # iMac on the side table: rotate BEFORE fitting, or the AABB inflates
    im = append_asset("imac-computer", into="Decor", rename="iMac")
    face_camera(im)
    fit(im, 0.26)
    place(im, x=-1.86, y=-1.35, z=0.49)


def settle_props():
    """Raycast every loose prop down onto whatever is really beneath it."""
    O = bpy.data.objects
    for name in ("Shiba", "Monkey", "RubikCube", "Pyraminx", "Sparrow",
                 "Lego", "Pencil", "Glasses", "Succulent", "Slippers"):
        if name in O:
            settle(O[name], lift=0.25)
    for name in ("LeBron", "PotatoMan"):
        if name in O:
            face_camera(O[name])


def build_extras():
    """Props not in the asset library: desk lamp, mug, two framed prints."""
    m_lamp = material("Lamp_Metal", 0x2E2E33, rough=0.35, metal=0.8)
    LX, LY = 0.62, 1.80
    box("Lamp_Base", LX-0.07, LX+0.07, LY-0.07, LY+0.07, DTOP, DTOP+0.022, "Desk", material=m_lamp)
    box("Lamp_Stem", LX-0.011, LX+0.011, LY-0.011, LY+0.011, DTOP+0.022, 1.11, "Desk", material=m_lamp)
    box("Lamp_Arm", LX-0.011, LX+0.20, LY-0.011, LY+0.011, 1.088, 1.11, "Desk", material=m_lamp)
    box("Lamp_Shade", LX+0.13, LX+0.27, LY-0.065, LY+0.065, 1.00, 1.088, "Desk", material=m_lamp)
    box("lamp_glow", LX+0.145, LX+0.255, LY-0.055, LY+0.055, 0.995, 1.002, "Desk",
        material=emissive("Lamp_Emit", 0xFFD9A0, 9.0))
    ld = bpy.data.lights.new("DeskLamp", type='SPOT')
    ld.energy, ld.color = 34.0, srgb(0xFFD4A6)[:3]
    ld.spot_size, ld.spot_blend, ld.shadow_soft_size = math.radians(95), 0.5, 0.06
    lo = bpy.data.objects.new("DeskLamp", ld)
    lo.location = (0.82, 1.80, 0.985)     # spots already aim down -Z; do not flip
    bpy.data.collections["Lighting"].objects.link(lo)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.040, depth=0.095, vertices=24,
                                        location=(0.95, 1.36, DTOP + 0.0475))
    mug = bpy.context.active_object
    mug.name = "Mug"
    for c in list(mug.users_collection):
        c.objects.unlink(mug)
    bpy.data.collections["Desk"].objects.link(mug)
    mug.data.materials.append(material("Mug_Ceramic", 0xE8E2D6, rough=0.35))
    bpy.ops.object.shade_smooth()

    home = os.path.expanduser("~/main/PROJECTS/PORTFOLIO")
    for name, path, wall, pos, zc, w, h in (
        ("Poster_Home", f"{home}/Home screen.png", "back", 0.18, 1.52, 0.62, 0.40),
        ("Poster_Me", f"{home}/portfolio-app/public/profile.jpg", "left", 1.35, 1.62, 0.34, 0.44),
    ):
        if not os.path.exists(path):
            print("poster image missing, skipping:", path)
            continue
        img = bpy.data.images.load(path, check_existing=True)
        pm = bpy.data.materials.new(name + "_Mat")
        pm.use_nodes = True
        bsdf = next(n for n in pm.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        tex = pm.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = img
        pm.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.55
        fr = material(name + "_Frame", 0x241B14, rough=0.5)
        if wall == "back":
            box(name + "_F", pos-w/2-0.02, pos+w/2+0.02, 1.975, 1.995,
                zc-h/2-0.02, zc+h/2+0.02, "Decor", material=fr)
            box(name, pos-w/2, pos+w/2, 1.968, 1.975, zc-h/2, zc+h/2, "Decor", material=pm)
        else:
            box(name + "_F", -2.195, -2.175, pos-w/2-0.02, pos+w/2+0.02,
                zc-h/2-0.02, zc+h/2+0.02, "Decor", material=fr)
            box(name, -2.175, -2.168, pos-w/2, pos+w/2, zc-h/2, zc+h/2, "Decor", material=pm)


def build_monitor_screen():
    """The asset ships a Samsung demo texture; swap it for the portfolio wallpaper."""
    O = bpy.data.objects
    wall = os.path.expanduser("~/main/PROJECTS/PORTFOLIO/portfolio-app/public/wallpaper.jpg")
    if not os.path.exists(wall):
        print("wallpaper missing, leaving stock screen texture")
        return
    img = bpy.data.images.load(wall, check_existing=True)
    root = O.get("projects") or O.get("Monitor")
    screen = next((o for o in descendants(root)
                   if o.type == 'MESH' and o.name.lower().startswith("screen")
                   and "bezel" not in o.name.lower()), None)
    if not screen:
        print("screen mesh not found")
        return
    m = bpy.data.materials.new("Screen_Wallpaper")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    emi = nt.nodes.new("ShaderNodeEmission")
    emi.inputs["Strength"].default_value = 1.6
    nt.links.new(tex.outputs["Color"], emi.inputs["Color"])
    nt.links.new(emi.outputs["Emission"],
                 next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs["Surface"])
    screen.data.materials.clear()
    screen.data.materials.append(m)


def build_lighting():
    O = bpy.data.objects

    def area(name, loc, energy, color, size, rot):
        ld = bpy.data.lights.new(name, type='AREA')
        ld.energy, ld.size, ld.color = energy, size, srgb(color)[:3]
        o = bpy.data.objects.new(name, ld)
        o.location, o.rotation_euler = loc, rot
        bpy.data.collections["Lighting"].objects.link(o)
        return o

    sun = bpy.data.lights.new("Sun_Key", type='SUN')
    sun.energy, sun.color, sun.angle = 1.9, srgb(0xFFD9A0)[:3], math.radians(3.0)
    so = bpy.data.objects.new("Sun_Key", sun)
    so.location = (1.4, 3.5, 2.6)
    so.rotation_euler = (math.radians(58), 0, math.radians(205))
    bpy.data.collections["Lighting"].objects.link(so)

    area("Win_Fill", (1.4, 1.92, 1.55), 190.0, 0xFFE7BF, 1.5, (math.radians(90), 0, 0))
    area("Amb_Bounce", (0.0, -1.2, 2.45), 115.0, 0xFFE7BF, 3.2, (math.radians(180), 0, 0))
    area("Rim_Cool", (-2.6, -2.6, 2.0), 65.0, 0x82ADED, 2.0,
         (math.radians(70), 0, math.radians(-135)))
    area("Floor_Bounce", (0.0, -0.2, 0.85), 55.0, 0xFFD9B0, 3.0, (math.radians(-28), 0, 0))
    area("Front_Fill", (2.2, -4.2, 2.6), 42.0, 0xFFE7BF, 3.0,
         (math.radians(62), 0, math.radians(28)))

    mn, mx = world_bbox(O["Monitor"])
    area("ScreenLight", ((mn.x + mx.x) / 2, mn.y - 0.18, (mn.z + mx.z) / 2 + 0.05),
         26.0, 0x8FC2F0, 0.7, (math.radians(86), 0, math.radians(180)))

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, segments=24, ring_count=14,
                                         location=(-2.02, -0.30, 0.475))
    g = bpy.context.active_object
    g.name = "glow"
    for c in list(g.users_collection):
        c.objects.unlink(g)
    bpy.data.collections["Lighting"].objects.link(g)
    g.data.materials.append(emissive("Glow_Emit", 0xFFDEA1, 7.0))
    bpy.ops.object.shade_smooth()

    gl = bpy.data.lights.new("GlowLight", type='POINT')
    gl.energy, gl.shadow_soft_size, gl.color = 70.0, 0.09, srgb(0xFFD4A6)[:3]
    go = bpy.data.objects.new("GlowLight", gl)
    go.location = (-2.02, -0.30, 0.50)
    bpy.data.collections["Lighting"].objects.link(go)

    f0, f1 = world_bbox(bpy.data.objects["FloatShelf"])
    box("shelf_strip", f0.x + 0.03, f1.x - 0.10, f0.y + 0.04, f1.y - 0.04,
        f0.z - 0.012, f0.z - 0.004, "Lighting",
        material=emissive("Strip_Emit", 0xFFC98A, 4.0))
    area("StripLight", ((f0.x + f1.x) / 2, (f0.y + f1.y) / 2, f0.z - 0.03),
         12.0, 0xFFC98A, 0.5, (math.radians(180), 0, 0))

    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = srgb(0x201910)
    bg.inputs["Strength"].default_value = 0.22


def build_camera():
    scene = bpy.context.scene
    cd = bpy.data.cameras.new("Cam_Main")
    cd.lens_unit = 'FOV'
    cd.angle = math.radians(42)
    cam = bpy.data.objects.new("Cam_Main", cd)
    bpy.data.collections["Camera"].objects.link(cam)
    cam.location = Vector((7.2, -7.4, 5.4))
    cam.rotation_euler = (Vector((-0.1, 0.1, 1.15)) - cam.location) \
        .to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError as e:
        print("engine options ->", e)
    scene.render.resolution_x, scene.render.resolution_y = 1600, 1000
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -0.30
    if hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 128


def build_nav():
    """Invisible raycast targets; the visible group takes the section name."""
    O = bpy.data.objects
    hb = bpy.data.materials.new("Hitbox")
    hb.use_nodes = True
    hb.blend_method = 'BLEND'
    next(n for n in hb.node_tree.nodes
         if n.type == "BSDF_PRINCIPLED").inputs["Alpha"].default_value = 0.0

    MAP = {"projects": "Monitor", "aboutme": "Painting", "education": "Books",
           "work": "ShelfCabinet", "contact": "Garland"}
    PAD = 0.06
    for section, objname in MAP.items():
        mn, mx = world_bbox(O[objname])
        b = box(f"{section}hitbox", mn.x - PAD, mx.x + PAD, mn.y - PAD, mx.y + PAD,
                mn.z - PAD, mx.z + PAD, "Nav", material=hb)
        b.hide_render = True
        O[objname].name = section


def export_web(max_px=512, target_tris=8000):
    for i in list(bpy.data.images):
        if i.source == 'VIEWER' or i.size[0] == 0:
            continue
        w, h = i.size
        m = max(w, h)
        if m > max_px:
            f = max_px / m
            try:
                i.scale(max(int(w * f), 4), max(int(h * f), 4))
            except Exception as e:
                print("skip image", i.name, e)

    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.data:
            continue
        tris = sum(max(len(p.vertices) - 2, 0) for p in o.data.polygons)
        if tris > target_tris and not any(m.type == 'DECIMATE' for m in o.modifiers):
            md = o.modifiers.new("WebDecimate", 'DECIMATE')
            md.ratio = max(target_tris / tris, 0.05)

    hidden = [o for o in bpy.data.objects if o.hide_render]
    for o in hidden:
        o.hide_render = False        # hitboxes must ship in the GLB
    os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT, export_format='GLB', use_visible=True, export_apply=True,
        export_cameras=True, export_lights=True, export_yup=True,
        export_image_format='JPEG', export_jpeg_quality=72,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6)
    for o in hidden:
        o.hide_render = True
    print(f"glb -> {os.path.getsize(GLB_OUT)/1e6:.1f} MB")


def main():
    clear_scene()
    build_shell()
    build_floor_planks()
    build_sky()
    place_assets()
    fill_cabinet_and_extras()
    build_monitor_screen()
    build_lighting()
    build_extras()
    settle_props()
    build_camera()
    build_nav()
    os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT, compress=True)
    print("blend ->", BLEND_OUT)
    export_web()


if __name__ == "__main__":
    main()
