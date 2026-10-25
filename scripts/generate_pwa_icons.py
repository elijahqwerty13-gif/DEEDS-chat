import zlib
import struct
import math
import os

def create_png(width, height, get_pixel, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter: None
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend((int(max(0, min(255, r))),
                             int(max(0, min(255, g))),
                             int(max(0, min(255, b))),
                             int(max(0, min(255, a)))))
    
    compressed = zlib.compress(raw_data, level=9)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def render_deeds_icon(x, y, w, h, is_maskable=False):
    # Normalized coords from -1.0 to 1.0
    nx = (x / w) * 2.0 - 1.0
    ny = (y / h) * 2.0 - 1.0
    dist = math.sqrt(nx * nx + ny * ny)

    # Base background: #040b08 (r=4, g=11, b=8)
    bg_r, bg_g, bg_b, bg_a = 4, 11, 8, 255

    # If not maskable, we can round the corners for any icon
    if not is_maskable:
        # Rounded rectangle corner cut
        corner_r = 0.35
        # Distance to rounded rect boundary
        dx = max(0.0, abs(nx) - (1.0 - corner_r))
        dy = max(0.0, abs(ny) - (1.0 - corner_r))
        corner_dist = math.sqrt(dx * dx + dy * dy)
        if corner_dist > corner_r:
            return 0, 0, 0, 0  # Transparent outside rounded rect

    # Scale factor for maskable vs any (maskable needs 15-20% margin for Android safe zone)
    scale = 0.68 if is_maskable else 0.82
    snx = nx / scale
    sny = ny / scale
    sdist = math.sqrt(snx * snx + sny * sny)

    # Emerald radial background glow
    if sdist < 1.0:
        glow_factor = max(0.0, 1.0 - sdist) ** 1.8
        bg_r += glow_factor * 20
        bg_g += glow_factor * 110
        bg_b += glow_factor * 70

    # Circular emerald glowing ring
    ring_radius = 0.88
    ring_width = 0.05
    ring_dist = abs(sdist - ring_radius)
    if ring_dist < ring_width:
        ring_intensity = max(0.0, 1.0 - (ring_dist / ring_width)) ** 1.5
        # Gradient across ring from top-left (#34d399) to bottom-right (#059669)
        ring_t = (snx + sny + 2.0) / 4.0
        ring_r = 52 * (1 - ring_t) + 5 * ring_t
        ring_g = 211 * (1 - ring_t) + 150 * ring_t
        ring_b = 153 * (1 - ring_t) + 105 * ring_t
        
        bg_r = bg_r * (1 - ring_intensity) + ring_r * ring_intensity
        bg_g = bg_g * (1 - ring_intensity) + ring_g * ring_intensity
        bg_b = bg_b * (1 - ring_intensity) + ring_b * ring_intensity

    # Central chat-leaf emblem
    # Modeled after DEEDS CHAT leaf emblem
    # Centered around (0, 0.05)
    cx = snx
    cy = sny - 0.05
    
    # Leaf 1: primary teardrop/chat bubble shape
    # Defined by parabolic arcs:
    # Top tip at (0, -0.48), bottom curved at (0, 0.38)
    in_leaf = False
    leaf_t = 0.0
    if -0.5 <= cy <= 0.4:
        # width profile
        prog = (cy + 0.5) / 0.9  # 0 at top, 1 at bottom
        # asymmetric curve
        max_w = math.sin(prog * math.pi * 0.85) * 0.42
        if -max_w <= cx <= max_w:
            in_leaf = True
            leaf_t = prog

    if in_leaf:
        # Beautiful mint/emerald gradient (#34d399 -> #10b981 -> #047857)
        lr = 52 * (1 - leaf_t) + 16 * leaf_t
        lg = 211 * (1 - leaf_t) + 185 * leaf_t
        lb = 153 * (1 - leaf_t) + 129 * leaf_t

        # White highlight crescent inside leaf
        hcx = cx + 0.08
        hcy = cy + 0.05
        hdist = math.sqrt(hcx * hcx + hcy * hcy)
        if 0.12 < hdist < 0.28 and cx < 0.05 and cy > -0.25:
            hint = max(0.0, 1.0 - abs(hdist - 0.20) / 0.08)
            lr = lr * (1 - hint * 0.8) + 255 * (hint * 0.8)
            lg = lg * (1 - hint * 0.8) + 255 * (hint * 0.8)
            lb = lb * (1 - hint * 0.8) + 255 * (hint * 0.8)

        # Ambient inner shadow / contrast
        bg_r = lr
        bg_g = lg
        bg_b = lb

    # Sparkle / star at top-right
    sp_x = snx - 0.40
    sp_y = sny + 0.35
    sp_dist = abs(sp_x) + abs(sp_y)  # diamond shape
    if sp_dist < 0.12:
        sp_intensity = max(0.0, 1.0 - (sp_dist / 0.12)) ** 2
        bg_r = bg_r * (1 - sp_intensity) + 255 * sp_intensity
        bg_g = bg_g * (1 - sp_intensity) + 255 * sp_intensity
        bg_b = bg_b * (1 - sp_intensity) + 255 * sp_intensity

    return bg_r, bg_g, bg_b, bg_a

os.makedirs('public', exist_ok=True)

# 1. 192x192 any icon
create_png(192, 192, lambda x, y, w, h: render_deeds_icon(x, y, w, h, is_maskable=False), 'public/pwa-192x192.png')

# 2. 512x512 any icon
create_png(512, 512, lambda x, y, w, h: render_deeds_icon(x, y, w, h, is_maskable=False), 'public/pwa-512x512.png')

# 3. 512x512 maskable icon (full-bleed with safe-zone margin)
create_png(512, 512, lambda x, y, w, h: render_deeds_icon(x, y, w, h, is_maskable=True), 'public/pwa-maskable-512x512.png')

# 4. 180x180 apple-touch-icon
create_png(180, 180, lambda x, y, w, h: render_deeds_icon(x, y, w, h, is_maskable=False), 'public/apple-touch-icon.png')

print("All PWA PNG icons generated successfully!")
