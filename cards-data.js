/* 蛋仔派对卡片图鉴 �� 卡游 10 级稀有度体系
   R < SR < PR < SSR < HR < UR < CP < LGR < GP < SP
   越稀有张数越少：R12/SR10/PR8/SSR6/HR5/UR4/CP3/LGR3/GP2/SP1，共 54 张
   注：sp-festival-egg、sp-season-egg、gp-divine-egg 的皮肤图保留在 /cards 素材库 */
(function () {
  const CARD_POOL = [

    // ═══════════════════ R：普通卡片 ★（12张）══════════════════
    // 注：原 r-party-ribbon、r-jelly-bean 两张皮肤图保留在 /cards 素材库，不参与抽卡池
    {id:'r-sunny-egg',    rarity:'R', name:'阳光蛋小黄',   skill:'晨读能量', colors:{bg:'#fff7e0',egg:'#ffe07a',accent:'#ffb830',eye:'#5c3d00'},icon:'☀', desc:'清晨的阳光蛋仔，陪你开启一天的学习。'},
    {id:'r-pink-heart',   rarity:'R', name:'甜心蛋小粉',   skill:'快乐打卡', colors:{bg:'#fff0f5',egg:'#ffb3c6',accent:'#ff6b8a',eye:'#5c1a2a'},icon:'💕',desc:'总是笑眯眯的粉红蛋仔，让每次打卡都甜甜的。'},
    {id:'r-ocean-wave',   rarity:'R', name:'海浪蛋小蓝',   skill:'专注力UP',colors:{bg:'#e8f6ff',egg:'#7cb9ff',accent:'#2980cc',eye:'#0a2a40'},icon:'🌊',desc:'像大海一样沉稳的蓝色蛋仔，帮你静下心来。'},
    {id:'r-cocoa-egg',    rarity:'R', name:'可可蛋小黑',   skill:'仔细检查', colors:{bg:'#f5efe6',egg:'#8b7355',accent:'#5c3d2e',eye:'#2a1a0a'},icon:'🍫',desc:'认真细心的巧克力蛋仔，检查作业从不马虎。'},
    {id:'r-forest-leaf',  rarity:'R', name:'森林蛋小绿',   skill:'朗读练习', colors:{bg:'#eaf8ea',egg:'#7dd87d',accent:'#2e8b2e',eye:'#0a2a0a'},icon:'🌿',desc:'安静陪你朗读的绿色蛋仔，像森林一样清新。'},
    {id:'r-grape-pop',    rarity:'R', name:'葡萄蛋小紫',   skill:'单词记忆', colors:{bg:'#f5edff',egg:'#c9a0ff',accent:'#7b4fcc',eye:'#2a0d4a'},icon:'🍇',desc:'葡萄味的小紫蛋仔，记忆单词有一套。'},
    {id:'r-orange-joy',   rarity:'R', name:'橘乐蛋小橙',   skill:'口算热身', colors:{bg:'#fff4e6',egg:'#ffaa5e',accent:'#e07020',eye:'#4a1a00'},icon:'🍊',desc:'活力满满的橙色蛋仔，数字题越做越起劲。'},
    {id:'r-cloud-puff',   rarity:'R', name:'云朵蛋小白',   skill:'轻松阅读', colors:{bg:'#f8fbff',egg:'#f0f0f5',accent:'#c0c0d0',eye:'#3a3a4a'},icon:'☁', desc:'软绵绵的云朵蛋仔，陪你安静读完一本书。'},
    {id:'r-red-bounce',   rarity:'R', name:'跳跳蛋小红',   skill:'订正提醒', colors:{bg:'#fff0f0',egg:'#ff6b6b',accent:'#cc2a2a',eye:'#4a0a0a'},icon:'⭐',desc:'充满干劲的红色蛋仔，做完了别忘了订正哦。'},
    {id:'r-mint-candy',   rarity:'R', name:'薄荷糖蛋',     skill:'数感训练', colors:{bg:'#eafff5',egg:'#7ee8b8',accent:'#2ea866',eye:'#0a2a18'},icon:'🍬',desc:'清凉薄荷味蛋仔，数感训练清爽又快乐。'},
    {id:'r-bubble-pop',   rarity:'R', name:'泡泡糖蛋',     skill:'动画补给', colors:{bg:'#eef8ff',egg:'#a0d8ff',accent:'#5098cc',eye:'#1a2a40'},icon:'🫧',desc:'轻飘飘的泡泡蛋仔，看动画学英语的好搭档。'},
    {id:'r-star-sprinkle',rarity:'R', name:'星星糖蛋',     skill:'好词摘录', colors:{bg:'#fffbe6',egg:'#ffe26a',accent:'#d4a800',eye:'#3a2a00'},icon:'🌟',desc:'闪亮亮的星星蛋仔，陪你摘录好词好句。'},

    // ═══════════════════ SR：超级卡片 ★★（10张）══════════════════
    {id:'sr-phoenix-egg',  rarity:'SR',name:'凤凰蛋',       skill:'满进度冲刺',colors:{bg:'#fff4e6',egg:'#ff8844',accent:'#ff4400',eye:'#4a1000'},icon:'🔥',desc:'浴火重生的凤凰蛋，全勤日的终极伙伴。'},
    {id:'sr-dragon-scale', rarity:'SR',name:'龙鳞蛋',       skill:'难题突破', colors:{bg:'#e8ffe8',egg:'#40b888',accent:'#206040',eye:'#0a2010'},icon:'🐉',desc:'披着龙鳞的蛋仔，帮你攻克最难的题目。'},
    {id:'sr-neon-glow',    rarity:'SR',name:'霓虹蛋',       skill:'专注续航', colors:{bg:'#1a1a2e',egg:'#ff40ff',accent:'#40ffff',eye:'#ffffff'},icon:'💜',desc:'在黑夜中闪耀的霓虹蛋仔，越学越有劲。'},
    {id:'sr-ice-crystal',  rarity:'SR',name:'冰晶蛋',       skill:'冷静思考', colors:{bg:'#e8f8ff',egg:'#80d0ff',accent:'#2080cc',eye:'#0a1a30'},icon:'❄',desc:'晶莹剔透的冰晶蛋仔，让你冷静思考不慌张。'},
    {id:'sr-galaxy-swirl', rarity:'SR',name:'银河漩涡蛋',   skill:'连胜蓄力', colors:{bg:'#200040',egg:'#9060ff',accent:'#d0a0ff',eye:'#ffffff'},icon:'🌌',desc:'来自银河的漩涡蛋仔，连胜能量源源不断。'},
    {id:'sr-magic-hat',    rarity:'SR',name:'魔法帽蛋',     skill:'知识整理', colors:{bg:'#2a0030',egg:'#c040e0',accent:'#ff80ff',eye:'#ffffff'},icon:'🎩',desc:'戴着魔法帽的蛋仔，知识变得井井有条。'},
    {id:'sr-crystal-gem',  rarity:'SR',name:'水晶宝石蛋',   skill:'书写工整', colors:{bg:'#fff0ff',egg:'#e0b0ff',accent:'#9060cc',eye:'#2a0a40'},icon:'💎',desc:'像宝石一样珍贵的水晶蛋仔，字迹工整又漂亮。'},
    {id:'sr-magma-core',   rarity:'SR',name:'熔岩之心蛋',   skill:'七天冲刺', colors:{bg:'#300010',egg:'#ff6020',accent:'#ffd040',eye:'#200000'},icon:'🌋',desc:'内心燃烧着熔岩的蛋仔，最后冲刺交给他。'},
    {id:'sr-thunder-egg',  rarity:'SR',name:'雷霆蛋',       skill:'爆发提速', colors:{bg:'#dfe6ff',egg:'#5aa0ff',accent:'#ffd23a',eye:'#0a1a3a'},icon:'⚡',desc:'周身缠绕闪电的雷霆蛋仔，卡壳时给你一记爆发提速。'},
    {id:'sr-aurora-egg',   rarity:'SR',name:'极光蛋',       skill:'灵感迸发', colors:{bg:'#0a1628',egg:'#00d4aa',accent:'#8844ff',eye:'#e0ffff'},icon:'🌈',desc:'身披极光的神秘蛋仔，灵感如极光般绚丽绽放。'},

    // ═══════════════════ PR：稀有卡片 ★★★（8张）══════════════════
    {id:'pr-sakura-bloom',    rarity:'PR',name:'樱花绽放',   skill:'优雅表达', colors:{bg:'#fff0f8',egg:'#ffb6c8',accent:'#e84a9c',eye:'#4a1028'},icon:'🌸',desc:'樱花飘落的温柔蛋仔，让表达如花般优美。'},
    {id:'pr-moonlight-silver',rarity:'PR',name:'月光银',     skill:'夜读专注', colors:{bg:'#e8ecf4',egg:'#c8d4e8',accent:'#6688bb',eye:'#1a2440'},icon:'🌙',desc:'月光照耀下的银白蛋仔，夜晚学习的好伴侣。'},
    {id:'pr-rainbow-arc',     rarity:'PR',name:'蛋仔彩虹',   skill:'多彩思维', colors:{bg:'#faf8ff',egg:'#e8d8f8',accent:'#aa66dd',eye:'#3a1040'},icon:'🌈',desc:'七彩斑斓的蛋仔，思维如虹般丰富多彩。'},
    {id:'pr-cosmic-dust',     rarity:'PR',name:'宇宙尘埃',   skill:'广博积累', colors:{bg:'#1a1030',egg:'#6a5090',accent:'#9966dd',eye:'#d0c0f0'},icon:'✨',desc:'承载星尘的宇宙蛋仔，知识如星辰般浩瀚。'},
    {id:'pr-golden-feather',  rarity:'PR',name:'金羽',       skill:'华丽呈现', colors:{bg:'#fff8e8',egg:'#ffd868',accent:'#cc9900',eye:'#4a3000'},icon:'🪶',desc:'披着金羽的高贵蛋仔，每次展示都闪闪发光。'},
    {id:'pr-starfall-shower', rarity:'PR',name:'流星雨',     skill:'突破瞬间', colors:{bg:'#101828',egg:'#4466aa',accent:'#77aaff',eye:'#c0d8ff'},icon:'💫',desc:'流星划过的璀璨蛋仔，突破就在一瞬间。'},
    {id:'pr-ocean-pearl',    rarity:'PR',name:'海洋珍珠',   skill:'沉淀积累', colors:{bg:'#e0f4ff',egg:'#88cce8',accent:'#2299bb',eye:'#0a2840'},icon:'🐚',desc:'孕育珍珠的深海蛋仔，日积月累终成大器。'},
    {id:'pr-crystal-dew',     rarity:'PR',name:'水晶露珠',   skill:'纯净领悟', colors:{bg:'#e8ffff',egg:'#a0e8e0',accent:'#33aaaa',eye:'#0a3030'},icon:'💧',desc:'凝结晨露的水晶蛋仔，每个知识点都清澈透亮。'},

    // ═══════════════════ SSR：超级豪华卡片 ★★★（6张）══════════════════
    {id:'ssr-golden-egg',   rarity:'SSR',name:'黄金传说蛋', skill:'全勤大奖', colors:{bg:'#2a2000',egg:'#ffd040',accent:'#fff080',eye:'#4a3000'},icon:'👑',desc:'传说中的黄金蛋仔，只有坚持到底的人才能见到。'},
    {id:'ssr-shadow-king',  rarity:'SSR',name:'暗影君主蛋', skill:'终极荣耀', colors:{bg:'#0a0a15',egg:'#403060',accent:'#c080ff',eye:'#ffa0ff'},icon:'🖤',desc:'暗影中的君主，为坚持不懈的你献上最高荣誉。'},
    {id:'ssr-angel-wing',   rarity:'SSR',name:'天使之翼蛋', skill:'梦想珍藏', colors:{bg:'#f0f0ff',egg:'#ffffff',accent:'#ffd0a0',eye:'#303050'},icon:'🕊',desc:'张开翅膀的天使蛋仔，把你的努力化作永恒珍藏。'},
    {id:'ssr-emperor-egg',  rarity:'SSR',name:'至尊蛋皇',   skill:'终极收藏', colors:{bg:'#1a0030',egg:'#c080ff',accent:'#ffd0ff',eye:'#200040'},icon:'🔮',desc:'蛋仔世界的至尊存在，只有最努力的人才能拥有。'},
    {id:'ssr-celestial-egg',rarity:'SSR',name:'天界之蛋',   skill:'神圣加护', colors:{bg:'#f8f0ff',egg:'#f0e0ff',accent:'#dda0ff',eye:'#3a1040'},icon:'🏆',desc:'来自天界的神圣蛋仔，为你加持最强大的祝福。'},
    {id:'ssr-eternal-flame',rarity:'SSR',name:'永恒之火',   skill:'永不放弃', colors:{bg:'#180808',egg:'#ff4422',accent:'#ffaa44',eye:'#ffeecc'},icon:'🔥',desc:'燃烧着永不熄灭火焰的蛋仔，坚持就是胜利。'},

    // ═══════════════════ HR：豪华稀有卡片 ★★★★★（5张）══════════════════
    {id:'hr-dragon-emperor',rarity:'HR',name:'龙皇蛋',      skill:'帝王统御', colors:{bg:'#082010',egg:'#208850',accent:'#50cc70',eye:'#a0ffa0'},icon:'🐲',desc:'万龙之皇的化身，统领所有学习领域的王者。'},
    {id:'hr-phoenix-queen', rarity:'HR',name:'凤后蛋',      skill:'涅槃重生', colors:{bg:'#200800',egg:'#cc2200',accent:'#ff6633',eye:'#ffcc99'},icon:'🦚',desc:'凤凰女王的化身，从挫折中浴火重生的力量。'},
    {id:'hr-cosmic-ruler',  rarity:'HR',name:'宇宙主宰',    skill:'全知全能', colors:{bg:'#100828',egg:'#5533aa',accent:'#aa77ff',eye:'#ddb0ff'},icon:'🌐',desc:'掌控宇宙秩序的主宰蛋仔，无所不知无所不能。'},
    {id:'hr-time-keeper',   rarity:'HR',name:'时间守护者',  skill:'时光回溯', colors:{bg:'#18181e',egg:'#997744',accent:'#ccaa66',eye:'#eeddaa'},icon:'⏳',desc:'掌管时间流逝的守护者，每一秒都弥足珍贵。'},
    {id:'hr-dream-weaver',  rarity:'HR',name:'织梦者',      skill:'梦想成真', colors:{bg:'#1a1028',egg:'#9966bb',accent:'#ccaaff',eye:'#e8d8ff'},icon:'💭',desc:'编织梦境与现实的织梦者，让梦想照进现实。'},

    // ═══════════════════ UR：超级稀有卡片 ★★★★★（4张）══════════════════
    {id:'ur-void-lord',    rarity:'UR',name:'虚空领主',    skill:'吞噬困难', colors:{bg:'#08041a',egg:'#220044',accent:'#8833dd',eye:'#cc99ff'},icon:'🌀',desc:'来自虚空的深渊领主，将一切困难吞噬殆尽。'},
    {id:'ur-storm-bringer',rarity:'UR',name:'风暴使者',    skill:'席卷全场', colors:{bg:'#141820',egg:'#445566',accent:'#88aacc',eye:'#ccddee'},icon:'🌪️',desc:'召唤风暴的强大使者，气势磅礴无人能挡。'},
    {id:'ur-light-bringer',rarity:'UR',name:'光明使者',    skill:'驱散迷茫', colors:{bg:'#f8f8ff',egg:'#e8e8ff',accent:'#aaaaff',eye:'#4444aa'},icon:'✨',desc:'带来光明的神圣使者，驱散一切困惑与迷茫。'},
    {id:'ur-shadow-hunter',rarity:'UR',name:'暗影猎手',    skill:'精准出击', colors:{bg:'#0a0610',egg:'#1a1028',accent:'#aa3355',eye:'#ff8888'},icon:'🗡️',desc:'潜行于暗影中的猎手，精准锁定每一个目标。'},

    // ═══════════════════ CP：收藏版 ★★★★★★★（3张）══════════════════
    {id:'cp-rainbow-prism',rarity:'CP',name:'蛋仔棱镜',    skill:'折射智慧', colors:{bg:'#f8f8f8',egg:'#e0e0f0',accent:'#aa88dd',eye:'#554477'},icon:'🔮',desc:'将知识折射成七彩光芒的蛋仔，智慧斑斓多彩。'},
    {id:'cp-galaxy-core',  rarity:'CP',name:'银河核心',    skill:'核心爆发', colors:{bg:'#060618',egg:'#2233aa',accent:'#6688ff',eye:'#aaccff'},icon:'💫',desc:'蕴含银河终极能量的核心蛋仔，爆发力无穷无尽。'},
    {id:'cp-infinity-loop', rarity:'CP',name:'无限循环',    skill:'循环精进', colors:{bg:'#e8e8ec',egg:'#bbb8cc',accent:'#7788aa',eye:'#334466'},icon:'♾️',desc:'象征无限进步的循环蛋仔，每次循环都更上一层楼。'},

    // ═══════════════════ LGR：传说版 ★★★★★★★★（3张）══════════════════
    {id:'lgr-origin-egg',  rarity:'LGR',name:'起源之蛋',    skill:'万物初始', colors:{bg:'#fff8e0',egg:'#f0d890',accent:'#cc9922',eye:'#553300'},icon:'🌱',desc:'万物起源的原始之蛋，蕴含创造一切的无限可能。'},
    {id:'lgr-universe-egg',rarity:'LGR',name:'宇宙之蛋',    skill:'包罗万象', colors:{bg:'#0a0820',egg:'#332266',accent:'#8866dd',eye:'#ccb0ff'},icon:'🪐',desc:'孕育整个宇宙的神奇之蛋，知识如星河般浩瀚无垠。'},
    {id:'lgr-destiny-egg', rarity:'LGR',name:'命运之蛋',    skill:'天命所归', colors:{bg:'#1a0a20',egg:'#663388',accent:'#cc66dd',eye:'#ffaaff'},icon:'🎯',desc:'命运眷顾的天选之蛋，每一步都走在正确的道路上。'},

    // ═══════════════════ SP：特殊卡片 ★★★★★★★（1张，最高稀有度）══════════════════
    // 注：sp-festival-egg、sp-season-egg 皮肤图保留在 /cards 素材库，不参与抽卡池
    {id:'sp-event-egg',    rarity:'SP',name:'活动限定',     skill:'限时珍藏', colors:{bg:'#f0f0fa',egg:'#9999cc',accent:'#6666aa',eye:'#222244'},icon:'🎫',desc:'特殊活动专属的限量蛋仔，错过就不再有。'},

    // ═══════════════════ GP：豪华卡片 ★★★★★★（2张）══════════════════
    // 注：gp-divine-egg 皮肤图保留在 /cards 素材库，不参与抽卡池
    {id:'gp-imperial-egg', rarity:'GP',name:'帝王蛋',       skill:'君临天下', colors:{bg:'#1a1000',egg:'#cc9900',accent:'#ffd700',eye:'#ffeeaa'},icon:'👑',desc:'至高无上的帝王蛋仔，以王者之气君临天下。'},
    {id:'gp-legendary-egg',rarity:'GP',name:'传奇蛋',       skill:'不朽传奇', colors:{bg:'#12081a',egg:'#442288',accent:'#bb77ee',ee:'#eebbff'},icon:'🏅',desc:'书写不朽传奇的终极蛋仔，名字将被永远铭记。'}
  ];

  /* ── 工具函数 ── */
  function rarityClass(r) {
    return ({SP:'sp',GP:'gp',LGR:'lgr',CP:'cp',UR:'ur',HR:'hr',SSR:'ssr',PR:'pr',SR:'sr',R:'r'})[r] || 'r';
  }
  function getCard(cardId) { return CARD_POOL.find(item=>item.id===cardId); }

  /* ── 卡图素材映射（自动从 CARD_POOL 生成）── */
  const CARD_ARTWORK = {};
  CARD_POOL.forEach(card => { CARD_ARTWORK[card.id] = `cards/${card.id}.webp`; });

  /* ── 卡片渲染（优先用图片，降级到 SVG）── */
  function buildEggSvg(card) {
    if(CARD_ARTWORK[card.id]) return `<img src="${CARD_ARTWORK[card.id]}" alt="${card.name}" loading="lazy"/>`;
    const c=card.colors, r=card.rarity;
    const rc = rarityClass(r);

    // 光效：SSR及以上等级有动态闪光
    const shineMap = {SSR:'card-ssr-shine',HR:'card-hr-shine',UR:'card-ur-shine',
                      CP:'card-cp-shine',LGR:'card-lgr-shine',SP:'card-sp-shine',GP:'card-gp-shine'};
    const shine = shineMap[r] ? `<div class="${shineMap[r]}"></div>` : '';

    // 徽章文字
    const badgeMap = {
      R:'<span class="card-badge badge-r">R</span>',
      SR:'<span class="card-badge badge-sr">SR</span>',
      PR:'<span class="card-badge badge-pr">PR</span>',
      SSR:'<span class="card-badge badge-ssr">SSR</span>',
      HR:'<span class="card-badge badge-hr">HR</span>',
      UR:'<span class="card-badge badge-ur">UR</span>',
      CP:'<span class="card-badge badge-cp">CP</span>',
      LGR:'<span class="card-badge badge-lgr">LGR</span>',
      SP:'<span class="card-badge badge-sp">SP</span>',
      GP:'<span class="card-badge badge-gp">GP</span>'
    };
    const rarityBadge = badgeMap[r] || badgeMap.R;

    // 顶部装饰（皇冠/角等）
    let topDeco = '';
    if(r==='SSR'||r==='GP') topDeco = '<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:24px">👑</div>';
    else if(r==='HR'||r==='UR') topDeco = '<div style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:20px">⭐</div>';
    else if(r==='SR') topDeco = '<div style="position:absolute;top:-16px;right:12px;font-size:16px">⭐</div>';

    // 表情大小随稀有度递增
    const emojiSize = ({SP:42,GP:40,LGR:38,CP:36,UR:34,HR:32,SSR:30,PR:28,SR:26,R:24})[r] || 24;

    return `<div class="egg-card-face card-${rc}" style="background:linear-gradient(135deg,${c.bg} 0%,${c.egg}22 100%)">
      ${rarityBadge}
      <div class="egg-body" style="background:radial-gradient(circle at 40% 40%,${lighten(c.egg,30)},${c.egg} 70%,${c.accent});width:90px;height:110px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;margin:30px auto 10px;position:relative;box-shadow:0 8px 24px ${c.accent}44">
        <div class="egg-highlight" style="position:absolute;top:20px;left:22px;width:20px;height:14px;background:rgba(255,255,255,.35);border-radius:50%;transform:rotate(-20deg)"></div>
        <div class="egg-face-emoji" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-40%);font-size:${emojiSize}px">${card.icon||'🥚'}</div>
        ${topDeco}
      </div>
      <div class="egg-card-name" style="color:${c.accent};font-size:14px;font-weight:700;text-align:center;margin-bottom:4px">${card.name}</div>
      ${shine}
    </div>`;
  }

  function lighten(hex,pct){try{let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);r=Math.min(255,r+Math.round((255-r)*pct/100));g=Math.min(255,g+Math.round((255-g)*pct/100));b=Math.min(255,b+Math.round((255-b)*pct/100));return `rgb(${r},${g},${b})`}catch(e){return hex}}

  window.CARD_DATA = Object.freeze({ CARD_POOL, CARD_ARTWORK, rarityClass, buildEggSvg, getCard });
})();
