export const JOB_CONFIG = {
  paladin: { id: 'paladin', name: '圣骑士', icon: '🛡️', color: 'gold', motto: '为了身材管理而战', talent: '坚如磐石', passive: '竞技场任务金币 +50%，体力上限 30', weapon: 'holy-sword', weaponName: '誓约胜利之剑', weaponIcon: '✨', maxStamina: 30, buff: 'iron_will' },
  mage: { id: 'mage', name: '大魔导士', icon: '🔮', color: 'violet', motto: '搞钱与学术都是真理', talent: '魔力共鸣', passive: '工作、学习任务发布不消耗体力，商店 -20%', weapon: 'fire-staff', weaponName: '火焰法杖', weaponIcon: '🔥', maxStamina: 20, buff: 'alchemy' },
  ranger: { id: 'ranger', name: '游侠', icon: '🌲', color: 'green', motto: '兴趣就是最好的副业', talent: '风行者', passive: '完成任务有 15% 几率获得随机掉落', weapon: 'composite-bow', weaponName: '复合弓', weaponIcon: '🏹', maxStamina: 20, buff: 'looter' },
};

export const JOB_IDS = Object.keys(JOB_CONFIG);

export const QUOTE_LIBRARY = {
  task: {
    perfect: ['这就是传说中的“纯牛马”精神吗？太感动了！', '领主大人的满意程度已溢出屏幕！', 'XP +100，金币 +∞，今晚吃烤肉！'],
    normal: ['又一只怪兽被收入囊中，干得漂亮！', '日常打卡成功，离退休又近了一步。', '虽然没有惊天动地，但稳扎稳打才是王道。'],
    danger: ['差一点点就 Over 了！你的心脏还好吗？', '这就是极限操作？下次别这么吓我了！', '在最后一秒完成才是真男人的浪漫！'],
    night: ['月亮都睡了，你还在战斗？致敬！', '肝度爆表！请立刻申请工伤……啊不，申请休息！', '在深夜里发光的不是星星，是你的屏幕。'],
    paladin: ['圣光在上，你的盾牌今天连灰尘都没沾到！', '堡垒就是这样一块砖一块砖垒起来的。'],
    mage: ['魔力回路通畅！这就是智慧的压强！', '真理往往藏在枯燥的抄写中。'],
    ranger: ['风都追不上你的速度，呼——过去了！', '这就是森林法则：完成它，然后生存下去。'],
  },
  pet: {
    slime_green: ['咕叽……咕叽……', '绿史莱姆突然变得很大，又弹了回来。', '它把你粘住了，扯不下来。'],
    sleepy_cat: ['呼……呼……Zzz', '瞌睡黑猫伸了个懒腰，翻了个身。', '人类，还不睡吗？'],
    fire_baby: ['火元素宝宝噼里啪啦地燃烧起来。', '火焰变成蓝色，旋转了一圈。', '烫！你的手指冒烟了。'],
    ghost_lamp: ['幽灵灯忽明忽暗地飘着。', '幽灵灯发出嘿嘿嘿的阴森笑声。', '嘿！它穿过食物，根本没有胃。'],
    dragon_whelp: ['幼龙试图喷火，结果喷出一口烟：咳咳……', '幼龙扑腾着小翅膀飞离地面 5 厘米。', '幼龙发出乳龙咆哮：嗷呜~'],
    pixel_bug: ['像素虫播放起 8-bit 复古音乐。', '像素虫的身体颜色在 RGB 间疯狂切换。', 'ERROR 404: Pet not found.'],
  },
  oracle: [
    '种一棵树最好的时间是十年前，其次是现在。',
    '生活原本沉闷，但跑起来就有风。',
    '世上无难事，只要肯放弃。',
    '这不是 Bug，这是未定义的 Feature（特性）。',
    '带薪难过，带薪发呆，主打一个回本。',
    '只要我够快，Deadline 就追不上我。',
    '有时候，重新加载也是一种解决方案。',
    '生活没有攻略，但你可以存档（睡觉）。',
  ],
  oracleDialogues: [
    { question: '魔法灵问：你现在最想逃避的，是哪一件最小的事？', answer: '先把它缩小到五分钟能完成的动作，勇者不需要一次打完整个副本。' },
    { question: '魔法灵问：任务墙上最亮的那张悬赏是什么？', answer: '先完成它。清晰的下一步，比完美的全局计划更有魔力。' },
    { question: '魔法灵问：你是在等待动力，还是可以先行动？', answer: '动力通常是行动的掉落物，不是进入副本的门票。' },
    { question: '魔法灵问：如果今天只完成一件事，你会选择什么？', answer: '把它钉在任务墙最上方，其他事情暂时只是背景音。' },
    { question: '魔法灵问：体力槽已经见底，还要继续冲锋吗？', answer: '休息不是撤退，是给下一次攻击准备暴击。先补给，再出发。' },
    { question: '魔法灵问：深夜的你，真的还在高效吗？', answer: '如果眼睛开始自动保存草稿，今晚的最佳任务可能是睡觉。' },
    { question: '魔法灵问：这次完成得不够完美，值得结算吗？', answer: '当然。完成是一枚现实金币，完美主义只是还没上线的皮肤。' },
    { question: '魔法灵问：要不要把一个大任务拆成三只小怪？', answer: '拆吧。每击败一只，你都会获得继续前进的经验值。' },
    { question: '魔法灵问：你是在忙，还是在推进？', answer: '看看任务墙有没有减少。没有减少的话，就挑一件真正重要的事开始。' },
    { question: '魔法灵问：今天的自己需要鸡汤还是毒鸡汤？', answer: '世上无难事，只要肯放弃刷新的页面，先做一件具体的小事。' },
  ],
};

export const JOB_DROP_ITEMS = [
  { id: 'stamina-potion', name: '微光体力药水', icon: '🧪', kind: 'potion', bonuses: {} },
  { id: 'moon-ring', name: '月光敏捷戒指', icon: '💍', kind: 'accessory', slot: 'hand', bonuses: { DEX: 3 } },
  { id: 'leaf-charm', name: '林间护符', icon: '🍃', kind: 'accessory', slot: 'back', bonuses: { VIT: 2, WIS: 1 } },
];

export const RAFFLE_CONFIG = {
  basePrice: 50,
  pityDraws: 10,
  giantMilkTeaChance: 0.001,
  giantMilkTeaPityDraws: 100,
  rarities: [
    { id: 'common', name: '普通', weight: 60 },
    { id: 'rare', name: '稀有', weight: 25 },
    { id: 'epic', name: '史诗', weight: 10 },
    { id: 'legendary', name: '传说', weight: 4 },
    { id: 'surprise', name: '惊喜', weight: 1 },
  ],
};

export const getJobConfig = (job) => JOB_CONFIG[job] || JOB_CONFIG.paladin;

export const PETS = [
  { id: 'slime_green', name: '绿史莱姆', icon: '🟢', rarity: '普通', unlock: 'initial', passive: '每小时自动恢复 1 点体力' },
  { id: 'sleepy_cat', name: '瞌睡黑猫', icon: '🐈‍⬛', rarity: '普通', unlock: 'task_milestone', requirement: 10, passive: '深夜任务经验 +10%' },
  { id: 'fire_baby', name: '火元素宝宝', icon: '🔥', rarity: '稀有', unlock: 'task_milestone', requirement: 25, passive: '互动有几率掉落金币' },
  { id: 'ghost_lamp', name: '幽灵灯', icon: '🏮', rarity: '史诗', unlock: 'task_milestone', requirement: 50, passive: '黑市商品价格 -5%' },
  { id: 'dragon_whelp', name: '幼龙', icon: '🐉', rarity: '传说', unlock: 'task_milestone', requirement: 100, passive: '所有属性成长速度 +10%' },
  { id: 'pixel_bug', name: '像素虫', icon: '🪲', rarity: '彩蛋', unlock: 'easter_egg', passive: '创建任务时任务内容输入神秘咒语获取。', hint: '不坐高铁，不坐飞机，全靠两条腿跑，累了还不敢停，饿了只能吃草。问：这是什么员工？' },
];

export const ITEM_POOL = [
  { id: 'mini-thunder-potion', name: '迷你雷电瓶', icon: '⚡', rarity: '普通', kind: 'potion', value: 5, description: '恢复 5 点体力' },
  { id: 'copper-pouch', name: '一袋铜币', icon: '🪙', rarity: '普通', kind: 'gold', value: 20, description: '直接获得 20 金币' },
  { id: 'broom-charm', name: '骑士扫把', icon: '🧹', rarity: '普通', kind: 'accessory', slot: 'back', bonuses: { VIT: 1 }, description: '小屋地板变干净' },
  { id: 'coffee-eye', name: '熊猫头套', icon: '🐼', rarity: '稀有', kind: 'accessory', slot: 'face', bonuses: { INT: 2 }, description: '替换火柴人头部，深夜任务不额外消耗体力' },
  { id: 'adventurer-cap', name: '冒险家便帽', icon: '🎩', rarity: '稀有', kind: 'accessory', slot: 'head', description: '角色头像戴上帽子' },
  { id: 'turtle-shell', name: '减速龟壳', icon: '🐢', rarity: '史诗', kind: 'accessory', slot: 'back', bonuses: { VIT: 4 }, description: '任务倒计时暂停一小时' },
  { id: 'pixel-glasses', name: '像素眼镜', icon: '👾', rarity: '史诗', kind: 'accessory', slot: 'face', bonuses: { INT: 3, DEX: 1 }, description: '开启极客模式' },
  { id: 'black-cat-egg', name: '黑猫玩偶', icon: '🐈‍⬛', rarity: '史诗', kind: 'pet', petId: 'sleepy_cat', description: '孵化瞌睡黑猫' },
  { id: 'fire-crystal-egg', name: '火晶蛋', icon: '🔴', rarity: '稀有', kind: 'pet', petId: 'fire_baby', description: '孵化火元素宝宝' },
  { id: 'ghost-lamp-egg', name: '幽灵灯笼', icon: '🏮', rarity: '史诗', kind: 'pet', petId: 'ghost_lamp', description: '召唤幽灵灯' },
  { id: 'time-pocket-watch', name: '时间怀表', icon: '⏳', rarity: '传说', kind: 'accessory', slot: 'body', bonuses: { WIS: 5 }, description: '每天一次任务回溯' },
  { id: 'dragon-scale-shield', name: '龙鳞盾', icon: '🛡️', rarity: '传说', kind: 'weapon', description: '背景出现巨龙投影' },
  { id: 'chaos-egg', name: '混沌之卵', icon: '🥚', rarity: '传说', kind: 'pet', petId: 'dragon_whelp', description: '孵化随机宠物' },
  { id: 'brick', name: '一块砖头', icon: '🧱', rarity: '惊喜', kind: 'accessory', slot: 'hand', description: '拍醒不想工作的自己' },
  { id: 'mosaic-block', name: '马赛克方块', icon: '💩', rarity: '惊喜', kind: 'accessory', slot: 'head', description: '全头覆盖的恶搞装备' },
  { id: 'overtime-crown', name: '加班皇冠', icon: '👑', rarity: '稀有', kind: 'accessory', slot: 'head', unlockTitle: '纯牛马', description: '歪斜的 KPI 皇冠' },
  { id: 'sleep-mask', name: '睡眠眼罩', icon: '😴', rarity: '稀有', kind: 'accessory', slot: 'face', unlockAchievement: '熬夜冠军', description: 'Zzz…，夜行者的勋章' },
  { id: 'robot-worker-mask', name: '机器人工作机器', icon: '🤖', rarity: '史诗', kind: 'accessory', slot: 'face', unlockRule: 'work-20', description: '我是无情的工作机器' },
  { id: 'streak-cape', name: '连胜斗篷', icon: '🧣', rarity: '史诗', kind: 'accessory', slot: 'back', unlockAchievement: '连胜火焰', description: '背后飘动的燃烧火焰' },
  { id: 'vampire-cape', name: '吸血鬼披风', icon: '🦇', rarity: '史诗', kind: 'accessory', slot: 'back', unlockTitle: '夜行生物', description: '黑色高领红内衬披风' },
  { id: 'robotic-keyboard', name: '机械键盘', icon: '⌨️', rarity: '史诗', kind: 'accessory', slot: 'rightHand', unlockRule: 'work-100', description: '右手抱着机械键盘，累计完成 100 个工作任务' },
  { id: 'giant-milk-tea', name: '巨型奶茶', icon: '🧋', rarity: '传说', kind: 'accessory', slot: 'leftHand', description: '左手续命奶茶，仅可通过抽奖获得' },
  { id: 'handheld-console', name: '手持游戏机', icon: '🧮', rarity: '稀有', kind: 'accessory', slot: 'leftHand', unlockRule: 'fishing-set', description: '左手复古掌机，摸鱼套装部件' },
  { id: 'scroll-contract', name: '卷轴契约', icon: '📜', rarity: '史诗', kind: 'accessory', slot: 'rightHand', unlockRule: 'created-200', description: '右手握着写满 TODO 的卷轴' },
  { id: 'collapsed-shield', name: '塌陷护盾', icon: '🛡️', rarity: '史诗', kind: 'accessory', slot: 'leftHand', unlockTitle: '强迫症晚期', description: '已经碎裂但仍在坚持的护盾' },
  { id: 'overtime-suit', name: '西装裤', icon: '👖', rarity: '稀有', kind: 'accessory', slot: 'legs', unlockRule: 'work-100-hours', description: '笔挺的黑色西装裤，搭配皮鞋' },
  { id: 'shorts-slippers', name: '短裤拖鞋', icon: '🩳', rarity: '普通', kind: 'accessory', slot: 'legs', unlockRule: 'lazy-streak', description: '大花短裤搭配人字拖' },
  { id: 'toilet-mount', name: '坐便器', icon: '🚽', rarity: '惊喜', kind: 'accessory', slot: 'legs', unlockRule: 'sitting-8-hours', description: '坐在带轮子的马桶上' },
  { id: 'baseball-cap', name: '棒球帽', icon: '🧢', rarity: '普通', kind: 'accessory', slot: 'head', unlockRule: 'fishing-set', description: '摸鱼的蓝色棒球帽' },
  { id: 'sleep-mask-head', name: '睡眠眼罩', icon: '🛌', rarity: '稀有', kind: 'accessory', slot: 'head', unlockAchievement: '熬夜冠军', description: '额头上的 Zzz… 眼罩' },
  { id: 'bachelor-cap', name: '学士帽', icon: '🎓', rarity: '稀有', kind: 'accessory', slot: 'head', unlockRule: 'study-50', description: '学习领域累计完成 50 个任务' },
  { id: 'frog-hood', name: '暴躁蛙头套', icon: '🐸', rarity: '稀有', kind: 'accessory', slot: 'head', unlockRule: 'skip-5', description: '一周内跳过 5 个任务' },
  { id: 'hard-hat', name: '安全帽', icon: '👷', rarity: '稀有', kind: 'accessory', slot: 'head', unlockRule: 'work-50-hours', description: '工作领域累计 50 小时' },
  { id: 'ascended-mask', name: '升天了', icon: '😇', rarity: '史诗', kind: 'accessory', slot: 'face', unlockRule: 'focus-3', description: '连续完成 3 个时段任务' },
  { id: 'pure-cow-mask', name: '纯牛马', icon: '🐮', rarity: '稀有', kind: 'accessory', slot: 'face', unlockTitle: '纯牛马', description: '牛鼻环口罩与麻木表情' },
  { id: 'black-sunglasses', name: '黑超墨镜', icon: '🕶️', rarity: '稀有', kind: 'accessory', slot: 'face', unlockTitle: '行动派', description: '什么都看不见也要继续行动' },
  { id: 'sad-mask', name: '悲伤面具', icon: '🎭', rarity: '稀有', kind: 'accessory', slot: 'face', unlockRule: 'overdue-5', description: '逾期超过 5 次后解锁' },
];

export const ITEM_CATALOG = [...JOB_DROP_ITEMS, ...ITEM_POOL];
export const getItem = (itemId) => ITEM_CATALOG.find((item) => item.id === itemId) || null;
export const getAccessory = (accessoryId) => getItem(accessoryId);
export const normalizeEquipment = (equipment = {}) => {
  const accessories = equipment.accessories || {};
  const leftHand = equipment.leftHand || accessories.leftHand || equipment.hand || accessories.hand || equipment.accessory || null;
  const rightHand = equipment.rightHand || accessories.rightHand || null;
  const body = equipment.body || accessories.body || null;
  return {
    weapon: equipment.weapon === null ? null : equipment.weapon || 'rusty-sword',
    head: equipment.head || accessories.head || null,
    back: equipment.back || accessories.back || null,
    face: equipment.face || accessories.face || null,
    hand: leftHand,
    leftHand,
    rightHand,
    legs: equipment.legs || accessories.legs || null,
    body,
    accessory: hand,
    accessories: { head: equipment.head || accessories.head || null, back: equipment.back || accessories.back || null, face: equipment.face || accessories.face || null, hand: leftHand, leftHand, rightHand, legs: equipment.legs || accessories.legs || null, body },
    skin: equipment.skin || 'default',
    title: equipment.title || '见习冒险者',
  };
};
