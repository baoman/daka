"""
卡图批量压缩脚本
用法：python compress_cards.py
会自动将 cards/ 下所有 PNG 压缩为 WebP（质量 85），并保留原文件名。
同时输出压缩前后大小对比。
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("需要先安装 Pillow：pip install Pillow")
    sys.exit(1)

CARDS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cards")
QUALITY = 85
MAX_WIDTH = 512  # 卡片展示宽度约 180-200px，512 足够

def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f}MB"

def compress_image(src_path):
    """压缩单张图片：resize + 转 WebP"""
    dst_path = os.path.splitext(src_path)[0] + ".webp"
    try:
        img = Image.open(src_path)
        # resize 如果宽度超过 MAX_WIDTH
        if img.width > MAX_WIDTH:
            new_height = int(img.height * MAX_WIDTH / img.width)
            img = img.resize((MAX_WIDTH, new_height), Image.LANCZOS)
        # 转 RGBA 以支持透明
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        img.save(dst_path, "WebP", quality=QUALITY, method=6)
        src_size = os.path.getsize(src_path)
        dst_size = os.path.getsize(dst_path)
        ratio = (1 - dst_size / src_size) * 100
        print(f"  {format_size(src_size)} -> {format_size(dst_size)}  (-{ratio:.0f}%)  {os.path.basename(dst_path)}")
        return True, src_size, dst_size
    except Exception as e:
        print(f"  ERROR: {e}  {src_path}")
        return False, 0, 0

def main():
    if not os.path.isdir(CARDS_DIR):
        print(f"cards 目录不存在: {CARDS_DIR}")
        sys.exit(1)
    
    png_files = []
    for root, dirs, files in os.walk(CARDS_DIR):
        for f in files:
            if f.lower().endswith(".png"):
                png_files.append(os.path.join(root, f))
    
    if not png_files:
        print("cards 目录下没有找到 PNG 文件")
        sys.exit(1)
    
    print(f"找到 {len(png_files)} 张 PNG，开始压缩...\n")
    
    total_src = 0
    total_dst = 0
    success = 0
    
    for src in sorted(png_files):
        ok, s, d = compress_image(src)
        if ok:
            success += 1
            total_src += s
            total_dst += d
    
    print(f"\n=== 汇总 ===")
    print(f"成功压缩: {success}/{len(png_files)}")
    print(f"原始总大小: {format_size(total_src)}")
    print(f"压缩后总大小: {format_size(total_dst)}")
    print(f"总节省: {format_size(total_src - total_dst)} ({(1 - total_dst / total_src) * 100:.0f}%)")
    print(f"\nWebP 文件已生成在 PNG 同目录下。")
    print(f"下一步需要修改 HTML 中的图片引用，将 .png 改为 .webp")

if __name__ == "__main__":
    main()
