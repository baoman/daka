from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "cards-data.js"
MAIN = ROOT / "每日打卡.html"
PREVIEW = ROOT / "全部卡片预览.html"
RELEASE = ROOT / "V1.3-发版说明.md"

def fail(message):
    print(f"FAIL: {message}")
    return False

def main():
    ok = True
    for path in (SHARED, MAIN, PREVIEW, RELEASE):
        if not path.is_file():
            ok = fail(f"缺少文件：{path.name}") and ok
    if not ok:
        return 1

    shared = SHARED.read_text(encoding="utf-8")
    main_page = MAIN.read_text(encoding="utf-8")
    preview_page = PREVIEW.read_text(encoding="utf-8")
    release = RELEASE.read_text(encoding="utf-8")

    ids = re.findall(r"id:\s*'([^']+)'", shared)
    if len(ids) != 26:
        ok = fail(f"CARD_POOL 数量应为 26，实际为 {len(ids)}") and ok
    if len(ids) != len(set(ids)):
        ok = fail("CARD_POOL 存在重复 ID") and ok

    artwork = dict(re.findall(r"'([^']+)'\s*:\s*'([^']+\.webp)'", shared))
    if set(ids) != set(artwork):
        missing = sorted(set(ids) - set(artwork))
        extra = sorted(set(artwork) - set(ids))
        ok = fail(f"卡池与卡图映射不一致；缺失={missing}，多余={extra}") and ok
    for card_id, relative in artwork.items():
        if not (ROOT / relative).is_file():
            ok = fail(f"{card_id} 的资源不存在：{relative}") and ok

    for name, page in ((MAIN.name, main_page), (PREVIEW.name, preview_page)):
        if not re.search(r'<script\s+src="cards-data\.js(?:\?[^\"]*)?"></script>', page):
            ok = fail(f"{name} 未引入 cards-data.js") and ok
        if 'const {' not in page or '} = window.CARD_DATA;' not in page:
            ok = fail(f"{name} 未解构共享卡片数据") and ok
        destructure = page.split('= window.CARD_DATA;')[0]
        for needed in ('CARD_POOL', 'CARD_ARTWORK', 'rarityClass', 'buildPonySvg', 'getCard'):
            locally_defined = (f'function {needed}(' in page) or (f'const {needed} =' in page) or (f'let {needed} =' in page)
            if needed not in destructure and not locally_defined:
                ok = fail(f"{name} 缺少共享/本地定义：{needed}") and ok
        for marker in ('const CARD_POOL =', 'const CARD_ARTWORK =', 'function rarityClass(', 'function buildPonySvg('):
            if marker in page:
                ok = fail(f"{name} 仍保留重复定义：{marker}") and ok
        if 'function buildCardTile(' not in page:
            ok = fail(f"{name} 缺少页面专有 buildCardTile") and ok

    for marker in ('window.CARD_DATA', 'const CARD_POOL =', 'const CARD_ARTWORK =', 'function rarityClass(', 'function buildPonySvg('):
        if marker not in shared:
            ok = fail(f"共享模块缺少：{marker}") and ok

    if 'V1.3' not in release or 'V1.3' not in main_page:
        ok = fail("页面版本号与 V1.3 发版说明不一致") and ok
    for marker in ('DATA_SCHEMA_VERSION', 'summer_reward_center_v3', 'migrateRewardState'):
        if marker not in main_page:
            ok = fail(f"主页面缺少本地数据迁移标记：{marker}") and ok

    if ok:
        print(f"PASS: {len(ids)} 张卡片、{len(artwork)} 个 WebP 资源、两页共享模块接入、V1.3 与 localStorage 迁移检查通过。")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(main())
