"""Bake the room's lighting into textures so the GLB matches the Blender render.

    blender --background ~/main/Blender/room.blend --python 3d/bake.py

Why this exists: glTF has no area-light type. Seven of the ten lights in this
scene are area lights and the exporter silently drops them, so the unbaked GLB
looks nothing like the render. Baking moves the lighting into the textures and
the web layer then needs almost no runtime lighting - the same trick the
rachelqrwei.ca reference uses.

Outputs ~/main/Blender/room_baked.blend and public/models/room-baked.glb.
"""
import bpy, os, sys, time, math

REPO = os.path.expanduser("~/main/PROJECTS/PORTFOLIO/portfolio-app")
BLEND_OUT = os.path.expanduser("~/main/Blender/room_baked.blend")
GLB_OUT = os.path.join(REPO, "public", "models", "room-baked.glb")

SAMPLES = 48
ATLAS = 2048          # for joined batches
NAV_TEX = 1024        # for the individually-baked nav targets
BATCH = 45            # meshes joined per atlas
DECIMATE_TO = 8000    # same budget the web export uses

# section -> the object that visually represents it. 'aboutme' lives on the
# Messi poster, which keeps its own name, so it needs an explicit mapping.
NAV = {"projects": "projects", "aboutme": "Poster_Messi", "education": "education",
       "work": "work", "contact": "contact"}

# Flat artwork is shown as the image itself instead of being baked. Squeezed
# into a shared atlas the 0.3 m vinyl cover was a few dark pixels, and the
# Messi poster's 1024px bake came back black in the full run.
PICTURES = {"Poster_Messi": 0.92, "Vinyl_Sleeve": 0.85}   # name -> brightness

# Animated in the browser, so it must not leave a baked shadow on the floor.
NO_SHADOW_ROOTS = ("Panda",)


def log(*a):
    print("[bake]", *a, flush=True)


def setup_cycles():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = (d.type == 'METAL')
    sc.cycles.device = 'GPU'
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
    sc.render.bake.margin = 6
    sc.render.bake.use_clear = True
    sc.render.bake.use_pass_direct = True
    sc.render.bake.use_pass_indirect = True
    sc.cycles.bake_type = 'COMBINED'
    log("cycles on METAL,", SAMPLES, "samples")


def descendants(o):
    return [o] + list(o.children_recursive)


def animated(o):
    r = o
    while r.parent:
        r = r.parent
    return bool((o.animation_data and o.animation_data.action)
                or (r.animation_data and r.animation_data.action))


def in_view_layer():
    """Appending assets leaves objects in collections that are not linked to the
    view layer. They cannot be selected, and select_set() raises on them."""
    return set(o.name for o in bpy.context.view_layer.objects)


def collect():
    """Static meshes to bake, split into nav targets and everything else."""
    vl = in_view_layer()

    def usable(o):
        return (o.type == 'MESH' and o.data and not o.hide_render
                and o.name in vl and len(o.data.polygons) > 0)

    nav_sets, nav_members = {}, set()
    for section, objname in NAV.items():
        root = bpy.data.objects.get(objname)
        if not root:
            log(f"  nav '{section}': object '{objname}' not found, skipping")
            continue
        ms = [o for o in descendants(root) if usable(o)]
        if ms:
            nav_sets[section] = ms
            nav_members.update(o.name for o in ms)

    rest = []
    for o in bpy.data.objects:
        if not usable(o):
            continue
        if (o.name in nav_members or o.name in PICTURES or animated(o)
                or o.name.startswith("steam_")):
            continue
        rest.append(o)
    return nav_sets, rest


def select(objs):
    bpy.ops.object.select_all(action='DESELECT')
    ok = []
    for o in objs:
        try:
            o.select_set(True)
            ok.append(o)
        except RuntimeError:
            pass
    if ok:
        bpy.context.view_layer.objects.active = ok[0]
    return ok


def curves_to_meshes():
    """Curve objects (the garland string, parts of the chair) are skipped by
    collect(), so they reached the GLB unbaked and lit only by the ambient
    light. Converting them first lets them bake like everything else."""
    vl = in_view_layer()
    curves = [o for o in bpy.data.objects
              if o.type in ('CURVE', 'FONT') and not o.hide_render and o.name in vl]
    if select(curves):
        bpy.ops.object.convert(target='MESH')
    log(f"converted {len(curves)} curves to meshes")


def unparent_all(objs):
    """join() deletes every merged object. Any of them that parented an object
    in a LATER batch took that child's parent away, and the child fell back to
    its local transform - which is how a desk prop ended up on the rug. Baking
    targets are static, so dropping the hierarchy (keeping world position) is
    safe."""
    for o in objs:
        if o.parent:
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw


def hide_shadows():
    for root in NO_SHADOW_ROOTS:
        r = bpy.data.objects.get(root)
        if r:
            for o in descendants(r):
                o.visible_shadow = False


def picture_material(obj, brightness):
    """Unlit image material on the mesh's front face. The source material maps
    the image with Generated Y/Z, so the same mapping is written into a real
    UV layer - glTF has no Generated coordinates."""
    src = obj.material_slots[0].material if obj.material_slots else None
    img = next((n.image for n in src.node_tree.nodes if n.type == 'TEX_IMAGE'), None) if src else None
    if img is None:
        log(f"  {obj.name}: no image found, leaving as is")
        return
    me = obj.data
    xs = [v.co for v in me.vertices]
    y0, y1 = min(v.y for v in xs), max(v.y for v in xs)
    z0, z1 = min(v.z for v in xs), max(v.z for v in xs)
    for u in list(me.uv_layers):
        me.uv_layers.remove(u)
    uv = me.uv_layers.new(name="Bake")
    for loop in me.loops:
        co = me.vertices[loop.vertex_index].co
        uv.data[loop.index].uv = ((co.y - y0) / (y1 - y0), (co.z - z0) / (z1 - z0))

    mat = bpy.data.materials.new(f"Picture_{obj.name}")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Emission Strength"].default_value = brightness
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image, tex.extension = img, 'EXTEND'
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],
                 next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs["Surface"])
    me.materials.clear()
    me.materials.append(mat)
    log(f"  {obj.name}: unlit picture ({img.size[0]}x{img.size[1]})")


def decimate_all(objs):
    n = 0
    for o in objs:
        tris = sum(max(len(p.vertices) - 2, 0) for p in o.data.polygons)
        if tris > DECIMATE_TO:
            m = o.modifiers.new("BakeDecimate", 'DECIMATE')
            m.ratio = max(DECIMATE_TO / tris, 0.05)
            n += 1
    if n:
        if select(objs):
            bpy.ops.object.convert(target='MESH')  # applies modifiers
    log(f"decimated {n} meshes before baking")


def join(objs, name):
    ok = select(objs)
    if not ok:
        return None
    if len(ok) > 1:
        bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active
    j.name = name
    return j


def unwrap(obj, margin=0.004):
    uv = obj.data.uv_layers.get("Bake") or obj.data.uv_layers.new(name="Bake")
    obj.data.uv_layers.active = uv
    select([obj])
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margin)
    bpy.ops.object.mode_set(mode='OBJECT')
    return uv


def bake_object(obj, size, tag):
    img = bpy.data.images.new(f"BK_{tag}", size, size, alpha=False)
    img.colorspace_settings.name = 'sRGB'
    nodes_added = []
    for slot in obj.material_slots:
        m = slot.material
        if not m:
            continue
        if m.users > 1:
            m = m.copy()
            slot.material = m
        m.use_nodes = True
        n = m.node_tree.nodes.new("ShaderNodeTexImage")
        n.image = img
        n.select = True
        m.node_tree.nodes.active = n
        nodes_added.append((m, n))
    if not nodes_added:
        bpy.data.images.remove(img)
        return None

    select([obj])
    t0 = time.time()
    bpy.ops.object.bake(type='COMBINED', use_clear=True)
    log(f"  baked {tag} ({size}px, {len(obj.data.polygons)} faces) "
        f"in {time.time()-t0:.0f}s")

    # A generated image lives only in memory. Saving the .blend without packing
    # it silently discards every pixel, and the file reopens fully black - the
    # GLB still looked right because it was exported in the same session.
    img.pack()

    for m, n in nodes_added:
        m.node_tree.nodes.remove(n)

    # one flat emissive material carrying the baked result
    mat = bpy.data.materials.new(f"Baked_{tag}")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(n)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Emission Strength"].default_value = 1.0
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "Bake"
    nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"],
                 next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL').inputs["Surface"])
    obj.data.materials.clear()
    obj.data.materials.append(mat)

    # Joining merges every source UV layer, which pushed "Bake" to index 4.
    # Three.js only reads UV sets 0-3, so the shader failed with
    # "'uv4' : undeclared identifier" and the room rendered blank. The other
    # layers were only needed to sample the ORIGINAL textures during the bake,
    # so drop them now and "Bake" becomes set 0.
    for name in [u.name for u in obj.data.uv_layers if u.name != "Bake"]:
        obj.data.uv_layers.remove(obj.data.uv_layers[name])
    return img


def main():
    t0 = time.time()
    setup_cycles()
    curves_to_meshes()
    hide_shadows()
    nav_sets, rest = collect()
    log(f"nav targets: {list(nav_sets)}   other static meshes: {len(rest)}")

    decimate_all(rest + [o for ms in nav_sets.values() for o in ms])
    # object references survive convert(); re-collect to be safe
    nav_sets, rest = collect()
    unparent_all(rest + [o for ms in nav_sets.values() for o in ms])

    for name, brightness in PICTURES.items():
        o = bpy.data.objects.get(name)
        if o:
            picture_material(o, brightness)

    targets = []
    for name, ms in nav_sets.items():
        j = join(ms, f"nav_{name}")
        if j and j.data.materials and j.data.materials[0].name.startswith("Picture_"):
            continue  # already an unlit picture, nothing to bake
        if j:
            targets.append((j, NAV_TEX, f"nav_{name}"))
    rest.sort(key=lambda o: o.name)
    for i in range(0, len(rest), BATCH):
        tag = f"batch{i//BATCH:02d}"
        j = join(rest[i:i + BATCH], tag)
        if j:
            targets.append((j, ATLAS, tag))
    log(f"{len(targets)} bake targets")

    for obj, size, tag in targets:
        unwrap(obj)
        bake_object(obj, size, tag)

    # the room is now lit by its textures; drop the lights and the world
    for o in [o for o in bpy.data.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(o, do_unlink=True)
    if bpy.context.scene.world:
        bg = next((n for n in bpy.context.scene.world.node_tree.nodes
                   if n.type == 'BACKGROUND'), None)
        if bg:
            bg.inputs["Strength"].default_value = 0.0

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT, compress=True)
    log("saved", BLEND_OUT)

    # Hitboxes are render-hidden so they never bake, but the browser needs them
    # for raycasting. Only they are un-hidden: un-hiding EVERY hidden object
    # used to ship leftover props (shelf text, stray cylinders) in the GLB.
    for o in bpy.data.objects:
        if o.name.endswith("hitbox"):
            o.hide_render = False
    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT, export_format='GLB', use_visible=True, use_renderable=True,
        export_apply=True, export_cameras=True, export_lights=False,
        export_yup=True, export_animations=True, export_frame_range=True,
        export_image_format='JPEG', export_jpeg_quality=80,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6)
    log(f"exported {GLB_OUT} "
        f"({os.path.getsize(GLB_OUT)/1e6:.1f} MB) in {time.time()-t0:.0f}s total")


if __name__ == "__main__":
    main()
