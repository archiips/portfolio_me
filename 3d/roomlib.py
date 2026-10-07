import bpy, os, glob, math
from mathutils import Vector

ROOT = "/Users/architjaiswal/blenderkit_data/models"

def find_blend(prefix):
    for d in sorted(os.listdir(ROOT)):
        if d.startswith(prefix):
            b = glob.glob(os.path.join(ROOT, d, "**", "*.blend"), recursive=True)
            if b: return b[0]
    raise FileNotFoundError(prefix)

def append_asset(prefix, into="Furniture", rename=None):
    """Append the asset's collection and parent everything under one Empty.

    BlenderKit collections often hold unparented siblings, so scaling the
    'root' object alone silently misses them. Grouping under a fresh Empty
    makes fit()/place()/rot_z() move the whole asset as one unit.
    """
    bf = find_blend(prefix)
    with bpy.data.libraries.load(bf, link=False) as (src, dst):
        cname = src.collections[0]
        dst.collections = [cname]
    coll = dst.collections[0]
    target = bpy.data.collections.get(into) or bpy.context.scene.collection
    target.children.link(coll)

    name = rename or cname
    grp = bpy.data.objects.new(name, None)
    grp.empty_display_type = 'PLAIN_AXES'
    grp.empty_display_size = 0.25
    coll.objects.link(grp)

    bpy.context.view_layer.update()
    for o in list(coll.objects):
        if o is grp or o.parent is not None:
            continue
        mw = o.matrix_world.copy()
        o.parent = grp
        o.matrix_world = mw
    coll.name = name + "_grp"
    bpy.context.view_layer.update()
    return grp

def descendants(obj):
    out = [obj]
    for c in obj.children_recursive:
        out.append(c)
    return out

def world_bbox(obj):
    pts = []
    for o in descendants(obj):
        if o.type != 'MESH' or not o.data or len(o.data.vertices) == 0:
            continue
        mw = o.matrix_world
        for c in o.bound_box:
            pts.append(mw @ Vector(c))
    if not pts:
        return Vector((0,0,0)), Vector((0,0,0))
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

def dims(obj):
    mn, mx = world_bbox(obj)
    return mx - mn

def fit(obj, size, axis=None):
    """Scale uniformly so the chosen axis (or largest) measures `size` metres."""
    d = dims(obj)
    cur = max(d.x, d.y, d.z) if axis is None else {'x':d.x,'y':d.y,'z':d.z}[axis]
    if cur <= 1e-9: return
    f = size / cur
    obj.scale = tuple(s * f for s in obj.scale)
    bpy.context.view_layer.update()

def rot_z(obj, degrees):
    obj.rotation_mode = 'XYZ'
    obj.rotation_euler.z += math.radians(degrees)
    bpy.context.view_layer.update()

def place(obj, x=None, y=None, z=None, anchor="bottom-center"):
    """Move so the bbox anchor lands at (x,y,z). z defaults to sitting on the floor."""
    bpy.context.view_layer.update()
    mn, mx = world_bbox(obj)
    ctr = (mn + mx) / 2
    ax, ay, az = ctr.x, ctr.y, mn.z
    if "top" in anchor:   az = mx.z
    if "minx" in anchor:  ax = mn.x
    if "maxx" in anchor:  ax = mx.x
    if "miny" in anchor:  ay = mn.y
    if "maxy" in anchor:  ay = mx.y
    loc = obj.location.copy()
    if x is not None: loc.x += (x - ax)
    if y is not None: loc.y += (y - ay)
    if z is not None: loc.z += (z - az)
    obj.location = loc
    bpy.context.view_layer.update()

def report(obj):
    mn, mx = world_bbox(obj)
    d = mx - mn
    return (f"{obj.name:28s} size=({d.x:.2f},{d.y:.2f},{d.z:.2f}) "
            f"min=({mn.x:.2f},{mn.y:.2f},{mn.z:.2f}) max=({mx.x:.2f},{mx.y:.2f},{mx.z:.2f})")

def box(name, x0, x1, y0, y1, z0, z1, coll_name, material=None):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.location = ((x0+x1)/2, (y0+y1)/2, (z0+z1)/2)
    o.scale = (abs(x1-x0), abs(y1-y0), abs(z1-z0))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for c in list(o.users_collection): c.objects.unlink(o)
    (bpy.data.collections.get(coll_name) or bpy.context.scene.collection).objects.link(o)
    if material: o.data.materials.append(material)
    return o

def srgb(hexcol):
    def c(v):
        v = v/255.0
        return v/12.92 if v <= 0.04045 else ((v+0.055)/1.055)**2.4
    return (c((hexcol>>16)&255), c((hexcol>>8)&255), c(hexcol&255), 1.0)
