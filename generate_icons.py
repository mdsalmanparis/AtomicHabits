from PIL import Image, ImageDraw
import math

def draw_icon(size):
    base_size = 1024
    img = Image.new("RGBA", (base_size, base_size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # Solid black canvas
    draw.rectangle([0, 0, base_size, base_size], fill=(0, 0, 0, 255))
    
    cx, cy = base_size / 2, base_size / 2 + 20
    
    # Outer Flame (White)
    draw.ellipse([cx - 220, cy - 180, cx + 220, cy + 240], fill=(255, 255, 255, 255))
    draw.polygon([
        (cx - 220, cy),
        (cx, cy - 380),
        (cx + 220, cy),
        (cx + 80, cy + 100),
        (cx - 80, cy + 100)
    ], fill=(255, 255, 255, 255))

    # Inner cutout for flame core (black accent cutout)
    draw.ellipse([cx - 90, cy + 10, cx + 90, cy + 180], fill=(0, 0, 0, 255))
    draw.polygon([
        (cx - 90, cy + 60),
        (cx + 25, cy - 120),
        (cx + 90, cy + 60)
    ], fill=(0, 0, 0, 255))

    # Inner white flame core
    draw.ellipse([cx - 45, cy + 50, cx + 45, cy + 150], fill=(255, 255, 255, 255))

    # Downsample with LANCZOS for super crisp retina output
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

sizes = {
    "public/apple-touch-icon.png": 180,
    "public/apple-touch-icon-180x180.png": 180,
    "public/pwa-192x192.png": 192,
    "public/pwa-512x512.png": 512,
}

for path, sz in sizes.items():
    icon = draw_icon(sz)
    icon.save(path, "PNG")
    print(f"Generated {path} ({sz}x{sz})")

print("All iOS and PWA icons generated successfully!")
