"""Re-export the web GLB from the already-baked scene, without re-baking.

    blender --background ~/main/Blender/room_baked.blend --python 3d/reexport.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bake  # noqa: E402

bake.export_web()
