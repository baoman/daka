"""
卡图批量重命名脚本
将 cards/ 下所有卡图统一重命名为 等级-角色名.png 格式
"""
import os
import shutil

CARDS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cards")

# 旧文件路径 -> 新文件名
RENAME_MAP = {
    # R 卡
    'A_cute_chibi_pony_character_si_2026-07-27T09-01-27.png': 'r-apple-glow.png',
    'A_cute_chibi_pony_character_pl_2026-07-27T09-01-58.png': 'r-cloud-bubble.png',
    '为儿童学习打卡收藏卡重画一张_R_卡角色图_薄荷跳跳__必须_2026-07-28T03-25-34.png': 'r-mint-hop.png',
    'A_cute_chibi_pony_character_ho_2026-07-27T09-02-59.png': 'r-sea-star.png',
    'A_cute_chibi_pony_character_lo_2026-07-27T09-03-28.png': 'r-candy-book.png',
    '为儿童学习打卡收藏卡重新生成一张_R_卡角色图_角色名_雨滴_2026-07-28T07-53-18.png': 'r-rain-step.png',
    'A_cute_chibi_pony_character_wi_2026-07-27T09-04-33.png': 'r-lemon-note.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T06-50-59.png': 'r-peach-dew.png',
    '为儿童学习打卡收藏卡重新生成一张_R_卡角色图_角色名_晴空_2026-07-28T07-53-58.png': 'r-kite-sky.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T06-53-41.png': 'r-berry-bell.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T07-18-57.png': 'r-shell-sugar.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T06-52-39.png': 'r-star-bookmark.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T07-20-02.png': 'r-blueberry-spin.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_R_卡角色图_角色名_2026-07-28T07-20-47.png': 'r-vanilla-breeze.png',
    # SR 卡
    'generated/sr-glass-comet/基于输入图进行重绘_保留同一只小马角色_琉璃流星_的核心设定_2026-07-28T10-09-51.png': 'sr-glass-comet.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_SR_卡角色图_角色_2026-07-28T07-21-45.png': 'sr-garland-aria.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_SR_卡角色图_角色_2026-07-28T07-24-05.png': 'sr-sugar-aurora.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_SR_卡角色图_角色_2026-07-28T07-26-48.png': 'sr-starlight-post.png',
    # SSR 卡
    '为儿童学习打卡收藏卡生成一张统一系列的_SSR_卡角色图_角_2026-07-28T07-21-45.png': 'ssr-rainbow-castle.png',
    '为儿童学习打卡收藏卡生成一张统一系列的_SSR_卡角色图_角_2026-07-28T07-26-48.png': 'ssr-moonlit-legend.png',
}

def main():
    if not os.path.isdir(CARDS_DIR):
        print(f"cards 目录不存在: {CARDS_DIR}")
        return

    success = 0
    skipped = 0
    errors = 0

    for old_rel, new_name in RENAME_MAP.items():
        old_path = os.path.join(CARDS_DIR, old_rel)
        new_path = os.path.join(CARDS_DIR, new_name)

        if not os.path.isfile(old_path):
            print(f"  SKIP (not found): {old_rel}")
            skipped += 1
            continue

        if os.path.exists(new_path) and os.path.abspath(old_path) != os.path.abspath(new_path):
            # 目标已存在且不是自己，先删除旧的（内容相同）
            pass

        try:
            shutil.move(old_path, new_path)
            print(f"  OK: {old_rel}  ->  {new_name}")
            success += 1
        except Exception as e:
            print(f"  ERROR: {e}  ({old_rel})")
            errors += 1

    print(f"\n=== 汇总 ===")
    print(f"成功重命名: {success}")
    print(f"跳过(未找到): {skipped}")
    print(f"失败: {errors}")

if __name__ == "__main__":
    main()
