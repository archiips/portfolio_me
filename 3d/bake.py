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

SAMPLES = 128
NAV_TEX = 1024        # for the individually-baked nav targets
DENSITY = 460         # texels per metre (sqrt of surface area), big assets
SMALL_DENSITY = 1400  # desk props and other small things you zoom in on
SMALL_AREA = 1.5      # m^2 of surface; below this an asset counts as small
MIN_TEX, MAX_TEX = 256, 2048
POOL_TEX = 2048       # small assets share atlases of this size
DECIMATE_TO = 30000   # 8k tore holes in the cloth meshes (bed, pillows)
MIN_RATIO = 0.12

# Bake at a fraction of the real light so bright areas don't clip in an 8-bit
# texture. The browser multiplies it back (1 / LIGHT_SCALE) and tone-maps with
# AgX, the same view transform the Blender scene is graded in.
LIGHT_SCALE = 0.5

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
    targets are static, so the hierarchy is dropped and every transform is
    applied to the mesh. Joining objects with mixed (and mirrored) transforms
    turned some surfaces inside out, so the white mousepad baked black."""
    from mathutils import Matrix
    for o in objs:
        mw = o.matrix_world.copy()
        o.parent = None
        if o.data.users > 1:
            o.data = o.data.copy()
        o.data.transform(mw)
        if mw.determinant() < 0:
            o.data.flip_normals()
        o.matrix_world = Matrix.Identity(4)
        o.data.update()


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


def matte_for_bake(objs):
    """Baking COMBINED freezes reflections seen from the surface normal, so
    glossy and metal materials came out as random black/orange patches (the
    chair back, the bed frame). A rough, non-metal version bakes clean."""
    seen = set()
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not m or not m.use_nodes or m.name in seen:
                continue
            seen.add(m.name)
            nt = m.node_tree
            # Glass/refraction/transparent shaders made the PC, the window and
            # one prop atlas take ~15 min each (rays bouncing inside closed
            # glass). Baked they only ever look like a flat tinted surface.
            for g in [n for n in nt.nodes
                      if n.type in ('BSDF_GLASS', 'BSDF_REFRACTION', 'BSDF_TRANSPARENT')]:
                d = nt.nodes.new("ShaderNodeBsdfPrincipled")
                col = g.inputs.get("Color")
                d.inputs["Base Color"].default_value = col.default_value if col else (0.8, 0.8, 0.8, 1)
                d.inputs["Roughness"].default_value = 0.6
                for l in list(g.outputs[0].links):
                    nt.links.new(d.outputs[0], l.to_socket)
                nt.nodes.remove(g)
            for b in (n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'):
                for name, val in (("Metallic", 0.0), ("Transmission Weight", 0.0),
                                  ("Coat Weight", 0.0)):
                    inp = b.inputs.get(name)
                    if inp:
                        for l in list(inp.links):
                            m.node_tree.links.remove(l)
                        inp.default_value = val
                r = b.inputs["Roughness"]
                if r.links:
                    for l in list(r.links):
                        m.node_tree.links.remove(l)
                    r.default_value = 0.65
                else:
                    r.default_value = max(r.default_value, 0.55)
    log(f"made {len(seen)} materials matte for baking")


def scale_lights(k):
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.data.energy *= k
    w = bpy.context.scene.world
    bg = next((n for n in w.node_tree.nodes if n.type == 'BACKGROUND'), None) if w else None
    if bg:
        bg.inputs["Strength"].default_value *= k
    # emissive surfaces (monitor, lamp shades, LED strips) light the room too
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        for n in m.node_tree.nodes:
            if n.type == 'EMISSION':
                n.inputs["Strength"].default_value *= k
            elif n.type == 'BSDF_PRINCIPLED':
                n.inputs["Emission Strength"].default_value *= k


def root_of(o):
    while o.parent:
        o = o.parent
    return o


def area(o):
    s = o.matrix_world.to_scale()
    k = abs(s.x * s.y * s.z) ** (2 / 3)
    return sum(p.area for p in o.data.polygons) * k


def density(a):
    return SMALL_DENSITY if a < SMALL_AREA else DENSITY


def tex_size(a):
    px = math.sqrt(max(a, 1e-6)) * density(a)
    size = 2 ** round(math.log2(max(px, 1)))
    return max(MIN_TEX, min(MAX_TEX, size))


def group_by_asset(objs):
    """One texture per asset, sized by its surface area, instead of 45 random
    meshes sharing one 2048 atlas (which left big things like the curtains
    and the bed blurry and smeared). Small assets are pooled so the room
    doesn't turn into hundreds of draw calls."""
    groups = {}
    for o in objs:
        groups.setdefault(root_of(o).name, []).append(o)
    big, pool = [], []
    for name, ms in sorted(groups.items()):
        a = sum(area(o) for o in ms)
        size = tex_size(a)
        (big if size >= 1024 else pool).append((name, ms, a, size))
    out = [(ms, size, f"a_{name}") for name, ms, a, size in big]
    budget = (POOL_TEX ** 2) * 0.5          # texels one pool atlas can really hold
    cur, cur_a, i = [], 0.0, 0
    for name, ms, a, size in sorted(pool, key=lambda g: -g[2]):
        texels = a * density(a) ** 2
        if cur and cur_a + texels > budget:
            out.append((cur, POOL_TEX, f"pool{i:02d}"))
            cur, cur_a, i = [], 0.0, i + 1
        cur += ms
        cur_a += texels
    if cur:
        out.append((cur, POOL_TEX, f"pool{i:02d}"))
    return out


def decimate_all(objs):
    n = 0
    for o in objs:
        tris = sum(max(len(p.vertices) - 2, 0) for p in o.data.polygons)
        if tris > DECIMATE_TO:
            m = o.modifiers.new("BakeDecimate", 'DECIMATE')
            m.ratio = max(DECIMATE_TO / tris, MIN_RATIO)
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


def denoise(img):
    """Cycles does not denoise bakes, which left a speckle on everything
    (most visible on the mouse). Run the baked image through the compositor's
    OpenImageDenoise node in a throwaway scene and copy the result back."""
    sc = bpy.data.scenes.get("DenoiseTmp") or bpy.data.scenes.new("DenoiseTmp")
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = img.size
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
    if not sc.camera:
        cam = bpy.data.objects.new("DenoiseCam", bpy.data.cameras.new("DenoiseCam"))
        sc.collection.objects.link(cam)
        sc.camera = cam
    sc.use_nodes = True
    nt = sc.node_tree
    nt.nodes.clear()
    src = nt.nodes.new("CompositorNodeImage")
    src.image = img
    dn = nt.nodes.new("CompositorNodeDenoise")
    dn.prefilter = 'ACCURATE'
    dn.use_hdr = False
    out = nt.nodes.new("CompositorNodeComposite")
    nt.links.new(src.outputs["Image"], dn.inputs["Image"])
    nt.links.new(dn.outputs["Image"], out.inputs["Image"])
    bpy.ops.render.render(scene=sc.name)
    tmp = os.path.join(bpy.app.tempdir or "/tmp", f"dn_{img.name}.png")
    bpy.data.images["Render Result"].save_render(tmp, scene=sc)
    res = bpy.data.images.load(tmp)
    img.pixels.foreach_set(list(res.pixels))
    img.update()
    bpy.data.images.remove(res)
    os.remove(tmp)


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

    try:
        denoise(img)
    except Exception as e:  # never lose a bake to the denoiser
        log(f"  denoise failed for {tag}: {e}")

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
    scale_lights(LIGHT_SCALE)
    nav_sets, rest = collect()
    matte_for_bake(rest + [o for ms in nav_sets.values() for o in ms])
    log(f"nav targets: {list(nav_sets)}   other static meshes: {len(rest)}")

    decimate_all(rest + [o for ms in nav_sets.values() for o in ms])
    # object references survive convert(); re-collect to be safe
    nav_sets, rest = collect()
    batches = group_by_asset(rest)        # needs the hierarchy, so before unparenting
    unparent_all(rest + [o for ms in nav_sets.values() for o in ms])

    for name, brightness in PICTURES.items():
        o = bpy.data.objects.get(name)
        if o:
            picture_material(o, brightness * LIGHT_SCALE)  # browser undoes the scale

    targets = []
    for name, ms in nav_sets.items():
        j = join(ms, f"nav_{name}")
        if j and j.data.materials and j.data.materials[0].name.startswith("Picture_"):
            continue  # already an unlit picture, nothing to bake
        if j:
            targets.append((j, NAV_TEX, f"nav_{name}"))
    for ms, size, tag in batches:
        tag = "".join(c if c.isalnum() or c in "_-" else "_" for c in tag)
        j = join(ms, tag)
        if j:
            targets.append((j, size, tag))
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

    export_web()
    log(f"done in {time.time()-t0:.0f}s total")


# Per-object triangle budget for the web file. The bake joins whole assets,
# and some (the wall shelf's plants, the prop atlases) came to 250k-900k
# triangles - 2.6M in all, drawn twice a frame because of the mirror floor.
# Collapse decimation keeps the baked UVs, so this runs after baking.
WEB_TRI_CAP = 45000
WEB_TRI_CAPS = {"nav_projects": 30000, "nav_contact": 25000, "a_Keyboard": 25000,
                "Akita": 15000}


def slim_for_web():
    total_before = total_after = 0
    for o in bpy.data.objects:
        if o.type != 'MESH' or o.hide_render or o.name.endswith("hitbox"):
            continue
        tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
        total_before += tris
        cap = WEB_TRI_CAPS.get(o.name, WEB_TRI_CAP)
        if tris > cap:
            m = o.modifiers.new("WebDecimate", 'DECIMATE')
            m.ratio = cap / tris
            m.use_collapse_triangulate = True
            total_after += cap
        else:
            total_after += tris
    log(f"web triangles: {total_before:,} -> ~{total_after:,}")


def export_web():
    """Export public/models/room-baked.glb from the baked scene. Also run on
    its own (3d/reexport.py) to re-slim without the hour-long bake."""
    slim_for_web()
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
    log(f"exported {GLB_OUT} ({os.path.getsize(GLB_OUT)/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
