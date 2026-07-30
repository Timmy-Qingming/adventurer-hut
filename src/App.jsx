import React, { useEffect, useRef, useState } from 'react';
import { ITEM_CATALOG, ITEM_POOL, JOB_CONFIG, JOB_DROP_ITEMS, JOB_IDS, PETS, QUOTE_LIBRARY, RAFFLE_CONFIG, getAccessory, getItem, getJobConfig, normalizeEquipment } from './constants';
import CharacterAvatar from './components/CharacterAvatar';
import PetCorner, { getPetMeta } from './components/PetCorner';
import './recurrence.css';
import { getTaskWarningAt, useJobLogic } from './hooks/useJobLogic';

const STORAGE_KEY = 'adventurer-hut-state';
const TEST_MODE = new URLSearchParams(window.location.search).has('testMode');
const localDateKey = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const todayKey = () => localDateKey(new Date());
const jobConfigs = JOB_CONFIG;
const jobIds = JOB_IDS;
const initialState = {
  character: { job: 'paladin', jobLevel: 1, buffs: ['iron_will'], level: 1, exp: 0, gold: 100, title: '见习冒险者', attributes: { STR: 5, INT: 5, WIS: 5, VIT: 20, DEX: 5 } },
  tasks: [
    { id: 'starter-1', content: '整理本周工作台与灵感碎片', type: '工作', difficulty: '普通', reward: 28, exp: 18, status: 'open', createdAt: Date.now() },
    { id: 'starter-2', content: '给重要的人发一条问候消息', type: '社交', difficulty: '简单', reward: 16, exp: 10, status: 'open', createdAt: Date.now() },
  ],
  status: { stamina: 27, maxStamina: 30, potionsUsedToday: 0, lastRestDate: todayKey() },
  equipment: { weapon: 'holy-sword', accessory: null, leftHand: null, rightHand: null, legs: null, accessories: { head: null, back: null, face: null, hand: null, leftHand: null, rightHand: null, legs: null }, skin: 'default', title: '见习冒险者' },
  inventory: ['rusty-sword', 'holy-sword', 'default'],
  achievements: ['见习冒险者'],
  streak: { current: 0, best: 0, lastCompletedDate: null },
  dailyClearStreak: { current: 0, best: 0, lastDate: null },
  furniture: { owned: ['hearth'], placed: ['hearth'] },
  pets: ['slime_green'],
  activePet: 'slime_green',
  petState: { mood: 'happy', lastInteraction: Date.now(), lastPassiveAt: Date.now() },
};

const typeMeta = {
  工作: { icon: '✦', color: 'teal', attribute: 'INT' },
  运动: { icon: '⚔', color: 'red', attribute: 'STR' },
  学习: { icon: '◈', color: 'blue', attribute: 'WIS' },
  社交: { icon: '☼', color: 'gold', attribute: 'DEX' },
  生活: { icon: '⌂', color: 'stone', attribute: 'VIT' },
  创意: { icon: '🎨', color: 'amber', attribute: 'DEX' },
};

const MONSTER_CATALOG = {
  工作: { 简单: { name: '文档蠕虫', emoji: '🐛', description: '不断复制粘贴，消耗你的耐心。' }, 普通: { name: 'PPT恶魔', emoji: '👹', description: '会幻化出无数张空白幻灯片，让你迷失。' }, 困难: { name: '截止日Boss', emoji: '💀', description: '时间流逝时，它会变大，压力剧增。' } },
  学习: { 简单: { name: '单词史莱姆', emoji: '💧', description: '黏住你的大脑，让你记不住。' }, 普通: { name: '公式幽灵', emoji: '👻', description: '在你眼前飘来飘去，看不懂。' }, 困难: { name: '考试巨龙', emoji: '🐉', description: '喷吐焦虑之火，让大脑宕机。' } },
  运动: { 简单: { name: '懒惰小鬼', emoji: '👻', description: '总是劝你再躺五分钟。' }, 普通: { name: '疲惫巨魔', emoji: '🗿', description: '肌肉酸痛的化身，让你想放弃。' }, 困难: { name: '马拉松恶魔', emoji: '😈', description: '不断在耳边说放弃吧。' } },
  社交: { 简单: { name: '尴尬小精灵', emoji: '🧚', description: '让你不知道说什么。' }, 普通: { name: '派对怪兽', emoji: '🎉', description: '准备礼物、话题都很消耗精力。' }, 困难: { name: '关系Boss', emoji: '💀', description: '复杂关系中一次失误就会 Game Over。' } },
  生活: { 简单: { name: '拖延水蛭', emoji: '🦎', description: '吸走你的时间，让你刷手机。' }, 普通: { name: '家务巨像', emoji: '🗿', description: '看起来无穷无尽，让你无从下手。' }, 困难: { name: '账单恶魔', emoji: '👹', description: '巨额数字让你头晕目眩。' } },
  创意: { 简单: { name: '灵感火花', emoji: '🔥', description: '稍纵即逝，需要立刻抓住。' }, 普通: { name: '创意枯竭怪', emoji: '🧌', description: '像一堵墙，让大脑一片空白。' }, 困难: { name: '完美主义恶魔', emoji: '😈', description: '让你陷入细节，永远无法完成。' } },
};

const getMonster = (type, difficulty) => MONSTER_CATALOG[type]?.[difficulty] || MONSTER_CATALOG.工作.普通;
const getReminderStage = (deadlineAt, now) => {
  const remaining = deadlineAt - now;
  if (remaining <= 0) return 'overdue';
  if (remaining < 30 * 60 * 1000) return 'berserk';
  if (remaining < 60 * 60 * 1000) return 'warning';
  if (remaining < 3 * 60 * 60 * 1000) return 'urgent';
  if (remaining < 24 * 60 * 60 * 1000) return 'awake';
  return 'sleeping';
};
const getReminderText = (stage, monsterName, taskName) => ({
  sleeping: '怪兽正在沉睡，你可以从容准备。',
  awake: '怪兽已苏醒，开始准备战斗吧！',
  urgent: '怪兽进入狂暴前兆！它的血条正在减少！',
  warning: '警告！怪兽即将狂暴！你的时间不多了！',
  berserk: `🚨 狂暴警报！${monsterName}即将破城，立即处理「${taskName}」！`,
  overdue: `怪兽已攻破城墙！「${taskName}」已失败。`,
}[stage] || '怪兽正在观察你的行动。');

const EQUIPMENT_SLOTS = ['head', 'face', 'back', 'body', 'leftHand', 'rightHand', 'legs'];
const SLOT_LABELS = { head: '头部', face: '面部', back: '背部', body: '胸部', leftHand: '左手', rightHand: '右手', legs: '腿部' };
const RARITY_ORDER = { 传说: 5, 史诗: 4, 稀有: 3, 普通: 2, 惊喜: 1 };
const JOB_ART = { ranger: '/icons/ranger.svg', mage: '/icons/mage.svg', paladin: '/icons/paladin.svg' };
const TASK_TYPES = Object.keys(typeMeta);
const randomQuote = (quotes) => quotes[Math.floor(Math.random() * quotes.length)];

const shopItems = [
  { id: 'stamina-potion', name: '微光体力药水', description: '恢复 5 点体力，每日最多 2 瓶', price: 30, icon: '🧪', kind: 'potion' },
  { id: 'ember-sword', name: '余烬短剑', description: '一把会提醒你行动的红色武器', price: 90, icon: '🗡️', iconPath: '/icons/sword.svg', kind: 'weapon' },
  { id: 'moon-staff', name: '月相法杖', description: '适合夜间学习与安静思考', price: 120, icon: '🔮', kind: 'weapon' },
  { id: 'fire-staff', name: '火焰法杖', description: '大魔导士专属，完成任务时爆发火焰', price: 160, icon: '🔥', kind: 'weapon', job: 'mage' },
  { id: 'composite-bow', name: '复合弓', description: '游侠专属，任务完成有掉落加成', price: 160, icon: '🏹', kind: 'weapon', job: 'ranger' },
  { id: 'holy-sword', name: '誓约胜利之剑', description: '圣骑士专属，竞技场赏金提高', price: 160, icon: '✨', kind: 'weapon', job: 'paladin' },
];

const titles = [
  { id: '见习冒险者', name: '见习冒险者', icon: '✦', rarity: '普通', requirement: '初次踏入小屋', unlocked: () => true },
  { id: '觉醒者', name: '觉醒者', icon: '⚔', rarity: '稀有', requirement: '首次击败困难任务', unlocked: (state) => state.tasks.some((task) => task.status === 'done' && ['困难', '重要'].includes(task.difficulty)) },
  { id: '行动派', name: '行动派', icon: '➤', rarity: '普通', requirement: '完成 3 个悬赏', unlocked: (state) => state.tasks.filter((task) => task.status === 'done').length >= 3 },
  { id: '纯牛马', name: '纯牛马', icon: '♞', rarity: '普通', requirement: '完成 10 个悬赏', unlocked: (state) => state.tasks.filter((task) => task.status === 'done').length >= 10 },
  { id: '打工人', name: '打工人', icon: '▣', rarity: '稀有', requirement: '完成 50 个悬赏', unlocked: (state) => state.tasks.filter((task) => task.status === 'done').length >= 50 },
  { id: '任务机器', name: '任务机器', icon: '⚙', rarity: '史诗', requirement: '完成 200 个悬赏', unlocked: (state) => state.tasks.filter((task) => task.status === 'done').length >= 200 },
  { id: '夜行生物', name: '夜行生物', icon: '☾', rarity: '稀有', requirement: '深夜完成 20 个悬赏', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && task.completedAt && [23, 0, 1, 2, 3, 4].includes(new Date(task.completedAt).getHours())).length >= 20 },
  { id: '强迫症晚期', name: '强迫症晚期', icon: '▦', rarity: '史诗', requirement: '连续 30 天清空今日待办', unlocked: (state) => state.dailyClearStreak?.best >= 30 },
  { id: '微习惯大师', name: '微习惯大师', icon: '◌', rarity: '史诗', requirement: '完成 50 次微习惯', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && task.repeatType === 'micro').length >= 50 },
];

const achievementCatalog = [
  { id: '连胜火焰', name: '连胜火焰', icon: '♨', rarity: '稀有', description: '连续 14 天完成任务', requirement: '连续 14 天完成任务', unlocked: (state) => state.streak.best >= 14 },
  { id: 'Boss猎人', name: 'Boss 猎人', icon: '☠', rarity: '史诗', description: '累计击败 50 个困难任务', requirement: '完成 50 个困难任务', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && ['困难', '重要'].includes(task.difficulty)).length >= 50 },
  { id: '杂兵清理者', name: '杂兵清理者', icon: '✹', rarity: '稀有', description: '累计击败 50 个简单任务', requirement: '完成 50 个简单任务', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && task.difficulty === '简单').length >= 50 },
  { id: '全能勇士', name: '全能勇士', icon: '✥', rarity: '传说', description: '六大领域各完成 10 个任务', requirement: '六大领域各完成 10 个任务', unlocked: (state) => TASK_TYPES.every((type) => state.tasks.filter((task) => task.status === 'done' && task.type === type).length >= 10) },
  { id: '熬夜冠军', name: '熬夜冠军', icon: '☾', rarity: '稀有', description: '深夜完成 5 个任务', requirement: '深夜完成 5 个任务', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && task.completedAt && [22, 23, 0, 1, 2, 3, 4, 5].includes(new Date(task.completedAt).getHours())).length >= 5 },
  { id: '早起的鸟儿', name: '早起的鸟儿', icon: '☀', rarity: '稀有', description: '早上 6:00 - 8:00 完成 7 个任务', requirement: '早间完成 7 个任务', unlocked: (state) => state.tasks.filter((task) => task.status === 'done' && task.completedAt && [6, 7].includes(new Date(task.completedAt).getHours())).length >= 7 },
  { id: '大陆征服者', name: '大陆征服者', icon: '✦', rarity: '史诗', description: '六大领域都创建过任务', requirement: '六大领域各创建过任务', unlocked: (state) => TASK_TYPES.every((type) => state.tasks.some((task) => task.type === type)) },
  { id: '收藏家', name: '收藏家', icon: '◇', rarity: '稀有', description: '收集 10 种怪兽组合', requirement: '完成 10 种不同领域与难度组合', unlocked: (state) => new Set(state.tasks.filter((task) => task.status === 'done').map((task) => `${task.type}-${task.difficulty}`)).size >= 10 },
  { id: '改命师', name: '改命师', icon: '⌛', rarity: '史诗', description: '重新规划逾期任务并完成', requirement: '完成一个曾经逾期的任务', unlocked: (state) => state.tasks.some((task) => task.status === 'done' && task.updatedAt && task.completedAt > task.updatedAt) },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved?.character || !Array.isArray(saved.tasks) || !saved.status) return initialState;
    const job = jobIds.includes(saved.character?.job) ? saved.character.job : 'paladin';
    const jobConfig = getJobConfig(job);
    const hasJobData = Boolean(saved.character?.job);
    const hydrated = {
      ...initialState,
      ...saved,
      character: { ...initialState.character, ...saved.character, job, jobLevel: saved.character?.jobLevel || 1, buffs: Array.isArray(saved.character?.buffs) ? saved.character.buffs : [job === 'paladin' ? 'iron_will' : job === 'mage' ? 'alchemy' : 'looter'] },
      status: { ...initialState.status, ...saved.status, maxStamina: hasJobData ? (saved.status?.maxStamina || jobConfig.maxStamina) : jobConfig.maxStamina },
      equipment: normalizeEquipment({ ...initialState.equipment, ...saved.equipment, weapon: saved.equipment?.weapon || jobConfig.weapon }),
      tasks: saved.tasks.map((task) => ({ ...task, taskKind: task.taskKind || (task.content?.startsWith('会议：') ? 'meeting' : 'instant'), durationMinutes: Number(task.durationMinutes) || (task.content?.startsWith('会议：') ? 60 : 30), startAt: task.startAt || null, status: task.status === 'done' || task.status === 'in-progress' ? task.status : 'open', deadlineAt: task.deadlineAt || task.createdAt + 24 * 60 * 60 * 1000, warningAt: task.warningAt || getTaskWarningAt(job, task.createdAt), monster: task.monster || getMonster(task.type, task.difficulty), reminders: { urgentSent: Boolean(task.reminders?.urgentSent), berserkSent: Boolean(task.reminders?.berserkSent) }, subTasks: Array.isArray(task.subTasks) ? task.subTasks.map((subTask) => ({ ...subTask, id: subTask.id || crypto.randomUUID(), done: Boolean(subTask.done) })) : [] })),
      inventory: Array.isArray(saved.inventory) ? saved.inventory : initialState.inventory,
      achievements: [...new Set(['见习冒险者', ...(Array.isArray(saved.achievements) ? saved.achievements : [])])],
      streak: { ...initialState.streak, ...(saved.streak || {}) },
      dailyClearStreak: { ...initialState.dailyClearStreak, ...(saved.dailyClearStreak || {}) },
      furniture: { ...initialState.furniture, ...(saved.furniture || {}) },
      raffle: { ...initialState.raffle, ...saved.raffle, history: Array.isArray(saved.raffle?.history) ? saved.raffle.history.slice(0, 10) : [] },
      pets: Array.isArray(saved.pets) && saved.pets.length ? saved.pets : initialState.pets,
      activePet: saved.activePet === null ? null : saved.activePet || initialState.activePet,
      petState: { ...initialState.petState, ...saved.petState, lastPassiveAt: saved.petState?.lastPassiveAt || Date.now() },
    };
    hydrated.inventory = [...new Set([...hydrated.inventory, hydrated.equipment.weapon])];
    if (hydrated.status.lastRestDate !== todayKey()) {
      hydrated.status = { ...hydrated.status, stamina: hydrated.status.maxStamina, potionsUsedToday: 0, lastRestDate: todayKey() };
    }
    return hydrated;
  } catch {
    return initialState;
  }
}

function parseSpell(text, forcedType = '') {
  const normalized = text.trim();
  const type = forcedType || (/跑|走|健身|运动|瑜伽/.test(normalized) ? '运动' : /读|学|课程|练习/.test(normalized) ? '学习' : /朋友|同事|消息|联系/.test(normalized) ? '社交' : /画|设计|创作|副业|灵感/.test(normalized) ? '创意' : /买菜|打扫|洗|整理房间/.test(normalized) ? '生活' : '工作');
  const difficulty = /紧急|重要|困难|大Boss/.test(normalized) ? '困难' : /顺手|简单|回复|喝水/.test(normalized) ? '简单' : '普通';
  const multiplier = difficulty === '困难' ? 1.8 : difficulty === '普通' ? 1.25 : 0.8;
  return { content: normalized || '未命名悬赏', type, difficulty, reward: Math.round(20 * multiplier), exp: Math.round(14 * multiplier) };
}

function formatRemaining(deadlineAt, now) {
  const remaining = Math.max(0, deadlineAt - now);
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return remaining === 0 ? '已过期' : `剩余 ${hours}h ${minutes}m`;
}
const difficultyOrder = { 困难: 0, 重要: 0, 普通: 1, 简单: 2 };
const difficultyClass = { 困难: 'hard', 重要: 'hard', 普通: 'normal', 简单: 'easy' };
const getTaskDeadline = (task) => task.deadlineAt || task.createdAt + 24 * 60 * 60 * 1000;
const getRepeatInterval = (repeatType) => repeatType === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : repeatType === 'micro' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
const DEFAULT_REPEAT_DAYS = [1, 3, 5];
const getNextRepeatDeadline = (task, fromTime = getTaskDeadline(task)) => {
  if (task.repeatType === 'customWeekly') {
    const days = Array.isArray(task.repeatDays) && task.repeatDays.length ? task.repeatDays : DEFAULT_REPEAT_DAYS;
    const next = new Date(fromTime);
    for (let offset = 1; offset <= 7; offset += 1) {
      next.setTime(fromTime + offset * 24 * 60 * 60 * 1000);
      if (days.includes(next.getDay())) return next.getTime();
    }
  }
  return fromTime + getRepeatInterval(task.repeatType);
};
const dateKey = (date) => localDateKey(date);
const startOfWeek = (date) => { const value = new Date(date); value.setHours(0, 0, 0, 0); const day = value.getDay() || 7; value.setDate(value.getDate() - day + 1); return value; };
const sameDate = (first, second) => dateKey(first) === dateKey(second);
const sortOpenTasks = (tasks) => [...tasks].sort((a, b) => {
  const levelDifference = (difficultyOrder[a.difficulty] ?? 1) - (difficultyOrder[b.difficulty] ?? 1);
  if (levelDifference !== 0) return levelDifference;
  const deadlineDifference = getTaskDeadline(a) - getTaskDeadline(b);
  if (deadlineDifference !== 0) return deadlineDifference;
  return (a.createdAt || 0) - (b.createdAt || 0);
});
function ItemIcon({ item, empty = '◇' }) {
  return <span className={`item-icon ${item ? `rarity-${item.rarity || '普通'}` : 'item-icon-empty'}`} aria-hidden="true">{item?.iconPath ? <img src={item.iconPath} alt="" /> : item?.icon || empty}</span>;
}

const inventoryCount = (inventory, itemId) => inventory.filter((storedId) => storedId === itemId).length;
const addInventoryItem = (inventory, itemId) => [...inventory, itemId];
const removeInventoryItem = (inventory, itemId) => {
  const index = inventory.indexOf(itemId);
  return index < 0 ? inventory : [...inventory.slice(0, index), ...inventory.slice(index + 1)];
};

function AbilityRadar({ attributes }) {
  const keys = ['STR', 'INT', 'WIS', 'VIT', 'DEX'];
  const center = 60;
  const radius = 43;
  const points = keys.map((key, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / keys.length;
    const value = Math.max(0, Math.min(50, Number(attributes[key]) || 0)) / 50;
    return { key, x: center + Math.cos(angle) * radius * value, y: center + Math.sin(angle) * radius * value, labelX: center + Math.cos(angle) * 52, labelY: center + Math.sin(angle) * 52 };
  });
  return <div className="ability-radar" aria-label="能力雷达"><svg viewBox="0 0 120 120" role="img"><image href="/icons/ability-radar.svg" x="8" y="8" width="104" height="104" opacity=".48" /><polygon className="radar-fill" points={points.map(({ x, y }) => `${x},${y}`).join(' ')} /><polygon className="radar-line" points={points.map(({ x, y }) => `${x},${y}`).join(' ')} /><g>{points.map(({ key, labelX, labelY }) => <text key={key} x={labelX} y={labelY}>{key}</text>)}</g></svg></div>;
}

function playChime() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 520;
    gain.gain.setValueAtTime(0.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  } catch {
    // 音频被浏览器阻止时不影响任务流。
  }
}

function RuneCanvas({ tone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frame;
    let rotation = 0;
    const draw = () => {
      const size = canvas.width;
      context.clearRect(0, 0, size, size);
      context.save();
      context.translate(size / 2, size / 2);
      context.rotate(rotation);
      context.strokeStyle = tone;
      context.lineWidth = 1.5;
      context.globalAlpha = 0.85;
      for (let ring = 0; ring < 3; ring += 1) {
        context.beginPath();
        context.arc(0, 0, 54 + ring * 24, 0, Math.PI * 2);
        context.stroke();
      }
      for (let side = 0; side < 6; side += 1) {
        context.rotate(Math.PI / 3);
        context.beginPath();
        context.moveTo(0, -92);
        context.lineTo(0, 92);
        context.stroke();
      }
      context.restore();
      rotation += 0.003;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [tone]);
  return <canvas className="rune-canvas" ref={canvasRef} width="240" height="240" aria-label="旋转魔法阵" />;
}

function ScheduleViews({ view, date, tasks, now, onViewChange, onDateChange, onTaskClick, onSlotClick, onDeleteTask }) {
  const selected = new Date(`${date}T00:00:00`);
  const days = Array.from({ length: 7 }, (_, index) => { const day = startOfWeek(selected); day.setDate(day.getDate() + index); return day; });
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => { const day = new Date(gridStart); day.setDate(gridStart.getDate() + index); return day; });
  const tasksOn = (day) => tasks.filter((task) => sameDate(getTaskDeadline(task), day));
  const dayTasks = tasksOn(selected);
  const changeDate = (offset, unit = 'day') => { const next = new Date(selected); if (unit === 'month') next.setMonth(next.getMonth() + offset); else next.setDate(next.getDate() + offset); onDateChange(dateKey(next)); };
  const taskBlock = (task, compact = false) => { const durationMinutes = Number(task.durationMinutes) || 30; const isTimeBlock = task.taskKind === 'meeting' || task.content?.startsWith('会议：'); return <div className={`schedule-task ${isTimeBlock ? 'schedule-task-block' : 'schedule-task-point'} difficulty-${difficultyClass[task.difficulty] || 'normal'} ${getTaskDeadline(task) <= now ? 'schedule-task-overdue' : ''}`} style={isTimeBlock && !compact ? { minHeight: `${Math.max(42, Math.min(260, durationMinutes * 1.15))}px` } : undefined} key={task.id} onClick={() => onTaskClick(task)} title={`${task.content} · ${formatRemaining(getTaskDeadline(task), now)}`} role="button" tabIndex="0"><span>{task.monster?.emoji || typeMeta[task.type]?.icon || '✦'}</span><strong>{compact ? task.content.slice(0, 12) : task.content}</strong>{!compact && <small>{new Date(getTaskDeadline(task)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · {isTimeBlock ? `${durationMinutes} 分钟` : task.type}</small>}<button className="schedule-delete" onClick={(event) => { event.stopPropagation(); onDeleteTask(task.id); }} aria-label={`删除日历事件 ${task.content}`}>×</button></div>; };
  return <section className="schedule-views"><div className="schedule-toolbar"><div className="schedule-view-tabs"><button className={view === 'day' ? 'active' : ''} onClick={() => onViewChange('day')}>日视图</button><button className={view === 'week' ? 'active' : ''} onClick={() => onViewChange('week')}>周视图</button><button className={view === 'month' ? 'active' : ''} onClick={() => onViewChange('month')}>月视图</button></div><div className="schedule-nav"><button onClick={() => changeDate(-1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day')}>‹</button><strong>{view === 'month' ? `${selected.getFullYear()}年${selected.getMonth() + 1}月` : view === 'week' ? `${dateKey(days[0])} - ${dateKey(days[6])}` : `${selected.getMonth() + 1}月${selected.getDate()}日`}</strong><button onClick={() => changeDate(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day')}>›</button><button onClick={() => onDateChange(dateKey(Date.now()))}>今天</button></div></div>{view === 'day' && <div className="day-schedule"><div className="time-axis">{Array.from({ length: 19 }, (_, index) => <span key={index}>{String(index + 6).padStart(2, '0')}:00</span>)}</div><div className="day-lane"><i className="current-time-line" style={{ top: `${Math.max(0, Math.min(100, ((new Date().getHours() + new Date().getMinutes() / 60 - 6) / 18) * 100))}%` }} />{dayTasks.length ? dayTasks.map((task) => taskBlock(task)) : <div className="schedule-empty">今天没有安排，战场等待新的悬赏。</div>}</div><aside className="day-overview"><strong>今日概览</strong><span>{dayTasks.length} 项待办</span><span>微习惯 {tasks.filter((task) => task.repeatType === 'micro' && sameDate(getTaskDeadline(task), selected)).length} 项</span></aside></div>}{view === 'week' && <div className="week-schedule"><div className="week-grid">{days.map((day) => <div className={`week-day ${sameDate(day, new Date()) ? 'today' : ''}`} key={dateKey(day)}><header><strong>周{['一', '二', '三', '四', '五', '六', '日'][day.getDay() === 0 ? 6 : day.getDay() - 1]}</strong><small>{day.getMonth() + 1}/{day.getDate()}</small></header>{tasksOn(day).map((task) => taskBlock(task, true))}</div>)}</div></div>}{view === 'month' && <div className="month-schedule"><div className="month-weekdays">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>周{day}</span>)}</div><div className="month-grid">{monthDays.map((day) => <button className={`month-day ${day.getMonth() !== selected.getMonth() ? 'outside' : ''} ${sameDate(day, new Date()) ? 'today' : ''}`} key={dateKey(day)} onClick={() => { onDateChange(dateKey(day)); onViewChange('day'); }}><time>{day.getDate()}</time><div>{tasksOn(day).slice(0, 4).map((task) => <i className={`month-dot difficulty-${difficultyClass[task.difficulty] || 'normal'}`} key={task.id} title={task.content} />)}</div></button>)}</div></div>}</section>;
}

function FutureTaskPreview({ tasks, anchorDate, onMoveToToday, onOpenDate }) {
  const grouped = Array.from({ length: 3 }, (_, offset) => {
    const date = new Date(anchorDate);
    date.setDate(date.getDate() + offset + 1);
    return { date, tasks: tasks.filter((task) => sameDate(getTaskDeadline(task), date)) };
  });
  return <section className="future-preview" aria-label="未来三天预览"><div className="future-preview-heading"><div><p className="eyebrow">NEXT THREE DAYS</p><h2>即将到来</h2></div><span>轻装查看未来安排</span></div><div className="future-preview-grid">{grouped.map(({ date, tasks: dayTasks }) => <button className="future-day" key={dateKey(date)} onClick={() => onOpenDate(dateKey(date))}><header><strong>{date.getMonth() + 1}月{date.getDate()}日</strong><small>{['日', '一', '二', '三', '四', '五', '六'][date.getDay()]} · {dayTasks.length} 项</small></header>{dayTasks.length ? dayTasks.map((task) => <span className="future-task" key={task.id} onContextMenu={(event) => { event.preventDefault(); onMoveToToday(task); }}><i>{typeMeta[task.type]?.icon || '✦'}</i><b>{task.content}</b><time>{new Date(getTaskDeadline(task)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time><em onClick={(event) => { event.stopPropagation(); onMoveToToday(task); }}>移至今日</em></span>) : <small className="future-empty">暂无悬赏</small>}</button>)}</div></section>;
}

function App() {
  const [state, setState] = useState(loadState);
  const [isModalOpen, setModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('board');
  const [wardrobeTab, setWardrobeTab] = useState('equipment');
  const [wardrobeSlot, setWardrobeSlot] = useState('head');
  const [spell, setSpell] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [repeatType, setRepeatType] = useState('none');
  const [repeatDays, setRepeatDays] = useState(DEFAULT_REPEAT_DAYS);
  const [repeatStartInput, setRepeatStartInput] = useState('');
  const [repeatEndInput, setRepeatEndInput] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [eventKind, setEventKind] = useState('task');
  const [durationInput, setDurationInput] = useState('30');
  const [scheduleView, setScheduleView] = useState('day');
  const [scheduleDate, setScheduleDate] = useState(dateKey(Date.now()));
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [subtaskDrafts, setSubtaskDrafts] = useState([]);
  const [expandedTaskIds, setExpandedTaskIds] = useState([]);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState('');
  const [notice, setNoticeState] = useState('');
  const [oracleAdvice, setOracleAdvice] = useState('');
  const [raffleResult, setRaffleResult] = useState(null);
  const [completionEffect, setCompletionEffect] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [reminderBanner, setReminderBanner] = useState(null);
  const [now, setNow] = useState(Date.now());
  const preview = parseSpell(spell, selectedTaskType);
  const setNotice = (message) => {
    if (message === '灵魂建议：先完成最小、最具体的那件事。') {
      const dialogue = randomQuote(QUOTE_LIBRARY.oracleDialogues);
      const context = state.status.stamina <= 5 ? '当前体力偏低，先把休息安排进计划。' : state.tasks.filter((task) => task.status === 'open').length > 5 ? '任务较多，先只锁定一个最小行动。' : '把下一步写得具体一点，行动会更容易开始。';
      setOracleAdvice(`${dialogue.question} ${dialogue.answer} ${context}`);
      setNoticeState('');
      return;
    }
    setNoticeState(message);
  };

  const exportSave = () => {
    const payload = { app: 'adventurer-hut', version: 1, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adventurer-hut-save-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('存档已导出到本地文件');
  };

  const importSave = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const importedState = payload?.state || payload;
        if (!importedState?.character || !Array.isArray(importedState.tasks) || !importedState.status) throw new Error('invalid save');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
        window.location.reload();
      } catch {
        setNotice('存档文件无效，未导入任何数据');
      }
    };
    reader.onerror = () => setNotice('存档文件读取失败，未导入任何数据');
    reader.readAsText(file);
  };

  useEffect(() => {
    const adviceContent = oracleAdvice ? JSON.stringify(`魔法灵考虑\n${oracleAdvice}`).replace(/\\n/g, '\\\\A ') : '""';
    document.documentElement.style.setProperty('--oracle-advice-content', adviceContent);
  }, [oracleAdvice]);

  const applyTestPreset = (preset) => {
    if (preset === 'reset') {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
      return;
    }
    setState((current) => {
      if (preset === 'max') {
        return { ...current, character: { ...current.character, level: 20, exp: 199, gold: 9999, attributes: { STR: 50, INT: 50, WIS: 50, VIT: 50, DEX: 50 } }, status: { ...current.status, stamina: 30, maxStamina: 30 }, inventory: [...new Set([...current.inventory, ...ITEM_POOL.map((item) => item.id), ...JOB_DROP_ITEMS.map((item) => item.id), 'rusty-sword', 'holy-sword', 'fire-staff', 'composite-bow', 'ember-sword', 'moon-staff'])], pets: [...new Set([...current.pets, ...PETS.map((pet) => pet.id)])], activePet: 'fire_baby' };
      }
      if (preset === 'leveling') {
        return { ...current, character: { ...current.character, gold: 9999 } };
      }
      if (preset === 'levelByLevel') {
        return { ...current, character: { ...current.character, level: current.character.level + 1, exp: 0, gold: 9999 } };
      }
      if (preset === 'raffle') {
        return { ...current, character: { ...current.character, gold: 9999 }, raffle: { ...current.raffle, draws: 9, pity: RAFFLE_CONFIG.pityDraws - 1 } };
      }
      if (preset === 'expired') {
        const createdAt = Date.now() - 25 * 60 * 60 * 1000;
        return { ...current, tasks: [{ id: `test-expired-${Date.now()}`, content: '测试：已过期悬赏', type: '工作', difficulty: '普通', reward: 999, exp: 999, staminaCost: 1, status: 'open', createdAt, deadlineAt: createdAt + 24 * 60 * 60 * 1000, warningAt: createdAt + 23 * 60 * 60 * 1000 }, ...current.tasks] };
      }
      if (preset === 'randomTasks') {
        const createdAt = Date.now();
        const randomTasks = Array.from({ length: 6 }, (_, index) => {
          const type = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];
          const subTasks = index % 2 === 0 ? [
            { id: `test-subtask-${createdAt}-${index}-1`, content: `测试：${type}行动准备`, done: false },
            { id: `test-subtask-${createdAt}-${index}-2`, content: `测试：完成${type}行动收尾`, done: false },
          ] : [];
          return { id: `test-random-${createdAt}-${index}`, content: `测试：完成一项${type}行动`, type, difficulty: index % 3 === 0 ? '重要' : '普通', reward: 20 + index * 5, exp: 12 + index * 2, staminaCost: 0, status: 'open', subTasks, createdAt: createdAt + index, deadlineAt: createdAt + index + 24 * 60 * 60 * 1000, warningAt: createdAt + index + 23 * 60 * 60 * 1000 };
        });
        return { ...current, tasks: [...randomTasks, ...current.tasks] };
      }
      return current;
    });
    setNotice(`测试预设已应用：${preset === 'max' ? '满资源' : preset === 'leveling' ? '逐级升级，仅满金币' : preset === 'levelByLevel' ? '升一级' : preset === 'raffle' ? '抽奖保底' : preset === 'expired' ? '过期任务' : '随机任务组（6 个多领域任务）'}`);
  };

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* 忽略不可用的持久化环境 */ }
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const candidates = state.tasks.filter((task) => task.status !== 'done' && task.deadlineAt);
    const urgentTask = candidates.find((task) => getReminderStage(task.deadlineAt, now) === 'urgent' && !task.reminders?.urgentSent);
    const berserkTask = candidates.find((task) => getReminderStage(task.deadlineAt, now) === 'berserk' && !task.reminders?.berserkSent);
    const taskToNotify = berserkTask || urgentTask;
    if (!taskToNotify) return;
    const stage = getReminderStage(taskToNotify.deadlineAt, now);
    const monster = taskToNotify.monster || getMonster(taskToNotify.type, taskToNotify.difficulty);
    const message = getReminderText(stage, monster.name, taskToNotify.content);
    setReminderBanner({ taskId: taskToNotify.id, monster, stage, message });
    setNotice(`宠物情报：${message}`);
    if ('Notification' in window) {
      const sendNotification = () => new Notification(`${monster.name}正在逼近！`, { body: `${taskToNotify.content} · ${formatRemaining(taskToNotify.deadlineAt, now)}`, tag: `task-${taskToNotify.id}-${stage}` });
      if (Notification.permission === 'granted') sendNotification();
      else if (Notification.permission === 'default') Notification.requestPermission().then((permission) => { if (permission === 'granted') sendNotification(); });
    }
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskToNotify.id ? { ...task, reminders: { ...(task.reminders || {}), urgentSent: task.reminders?.urgentSent || stage === 'urgent', berserkSent: task.reminders?.berserkSent || stage === 'berserk' } } : task) }));
  }, [now]);

  useEffect(() => {
    if (!reminderBanner) return undefined;
    const timer = window.setTimeout(() => setReminderBanner(null), 7000);
    return () => window.clearTimeout(timer);
  }, [reminderBanner]);

  useEffect(() => {
    if (state.activePet !== 'slime_green') return;
    const hoursPassed = Math.floor((Date.now() - state.petState.lastPassiveAt) / (60 * 60 * 1000));
    if (hoursPassed < 1) return;
    setState((current) => ({ ...current, status: { ...current.status, stamina: Math.min(current.status.maxStamina, current.status.stamina + hoursPassed) }, petState: { ...current.petState, lastPassiveAt: Date.now() } }));
  }, [state.activePet]);

  useEffect(() => {
    if (!completionEffect) return undefined;
    const timer = window.setTimeout(() => setCompletionEffect(null), 1800);
    return () => window.clearTimeout(timer);
  }, [completionEffect]);

  useEffect(() => {
    document.querySelectorAll('.quest-card').forEach((card) => {
      const startButton = Array.from(card.querySelectorAll('button')).find((button) => button.textContent.includes('开始挑战'));
      if (startButton) startButton.disabled = false;
      const taskContent = card.querySelector('h3')?.textContent;
      const sameTitleTasks = state.tasks.filter((item) => item.status !== 'done' && item.content === taskContent);
      const sameTitleCards = Array.from(document.querySelectorAll('.quest-card')).filter((item) => item.querySelector('h3')?.textContent === taskContent);
      const task = sameTitleTasks[sameTitleCards.indexOf(card) % Math.max(1, sameTitleTasks.length)];
      if (task) {
        const stage = getReminderStage(task.deadlineAt || now, now);
        const monster = task.monster || getMonster(task.type, task.difficulty);
        card.classList.remove('monster-sleeping', 'monster-awake', 'monster-urgent', 'monster-warning', 'monster-berserk', 'monster-overdue');
        card.classList.add(`monster-${stage}`);
        const icon = card.querySelector('.quest-icon');
        if (icon) {
          icon.textContent = monster.emoji;
          let monsterName = icon.querySelector('.monster-name');
          if (!monsterName) {
            monsterName = document.createElement('small');
            monsterName.className = 'monster-name';
            icon.appendChild(monsterName);
          }
          monsterName.textContent = monster.name;
          icon.setAttribute('aria-label', monster.name);
          icon.setAttribute('title', monster.description || monster.name);
        }
        card.setAttribute('data-monster', monster.name);
        card.setAttribute('data-task-id', task.id);
      }
    });
  }, [state.tasks, now]);

  useEffect(() => {
    document.querySelectorAll('.quest-card').forEach((card) => {
      const titleRow = card.querySelector('.quest-title-row');
      if (!titleRow || titleRow.querySelector('.expand-task-button')) return;
      const taskContent = titleRow.querySelector('h3')?.textContent;
      const task = state.tasks.find((item) => item.content === taskContent);
      if (!task) return;
      const button = document.createElement('button');
      button.className = 'expand-task-button';
      button.type = 'button';
      button.textContent = '创建子任务';
      button.addEventListener('click', () => openChildTaskModal(task.id));
      titleRow.appendChild(button);
    });
  }, [state.tasks, expandedTaskIds]);

  useEffect(() => {
    if (!isModalOpen) {
      setParentTaskId(null);
      setEditingTaskId(null);
      setEventKind('task');
      setDurationInput('30');
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const modal = document.querySelector('.spell-modal');
    const anchor = modal?.querySelector('.subtask-editor');
    if (!modal || !anchor) return undefined;
    let picker = modal.querySelector('.modal-repeat-picker');
    if (!picker) {
      picker = document.createElement('div');
      picker.className = 'modal-repeat-picker';
      picker.innerHTML = '<label for="modal-repeat-type">重复方式</label><select id="modal-repeat-type"><option value="none">不重复</option><option value="daily">每天 · 固定时间</option><option value="weekly">每周 · 固定时间</option><option value="customWeekly">自定义 · 每周多日</option><option value="micro">微习惯 · 每小时</option></select><div class="repeat-range"><label>开始于<input id="repeat-start" type="datetime-local" /></label><label>结束于<input id="repeat-end" type="datetime-local" /></label></div><small>循环任务只会在开始和结束范围内生成</small>';
      anchor.parentNode.insertBefore(picker, anchor);
      picker.querySelector('select').addEventListener('change', (event) => setRepeatType(event.target.value));
      picker.querySelector('#repeat-start').addEventListener('change', (event) => setRepeatStartInput(event.target.value));
      picker.querySelector('#repeat-end').addEventListener('change', (event) => setRepeatEndInput(event.target.value));
    }
    const select = picker.querySelector('select');
    select.value = repeatType;
    select.disabled = Boolean(parentTaskId);
    const startInput = picker.querySelector('#repeat-start');
    const endInput = picker.querySelector('#repeat-end');
    startInput.value = repeatStartInput;
    endInput.value = repeatEndInput;
    startInput.disabled = Boolean(parentTaskId) || repeatType === 'none';
    endInput.disabled = Boolean(parentTaskId) || repeatType === 'none';
    if (repeatType === 'customWeekly' && !picker.querySelector('.repeat-days')) {
      const days = document.createElement('div');
      days.className = 'repeat-days';
      days.innerHTML = ['日', '一', '二', '三', '四', '五', '六'].map((day, index) => `<label><input type="checkbox" value="${index}" ${repeatDays.includes(index) ? 'checked' : ''} />周${day}</label>`).join('');
      picker.appendChild(days);
      days.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
        const selected = Array.from(days.querySelectorAll('input:checked')).map((item) => Number(item.value));
        setRepeatDays(selected.length ? selected : DEFAULT_REPEAT_DAYS);
      }));
    }
    return undefined;
  }, [isModalOpen, repeatType, repeatDays, repeatStartInput, repeatEndInput, parentTaskId]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const modal = document.querySelector('.spell-modal');
    const deadline = modal?.querySelector('.task-deadline-input');
    if (!modal || !deadline) return undefined;
    let picker = modal.querySelector('.event-kind-picker');
    if (!picker) {
      picker = document.createElement('label');
      picker.className = 'event-kind-picker';
      picker.innerHTML = '<span>安排类型</span><select><option value="task">瞬时任务</option><option value="meeting">时段任务 / 会议</option></select>';
      deadline.parentNode.insertBefore(picker, deadline);
      picker.querySelector('select').addEventListener('change', (event) => { setEventKind(event.target.value); if (event.target.value === 'meeting') setDurationInput('60'); });
    }
    picker.querySelector('select').value = eventKind;
    return undefined;
  }, [isModalOpen, eventKind]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const modal = document.querySelector('.spell-modal');
    const deadline = modal?.querySelector('.task-deadline-input');
    if (!modal || !deadline) return undefined;
    let duration = modal.querySelector('.duration-picker');
    if (!duration) {
      duration = document.createElement('label');
      duration.className = 'duration-picker';
      duration.innerHTML = '<span>预估时长（分钟）</span><input type="number" min="15" max="720" step="15" />';
      deadline.parentNode.insertBefore(duration, deadline.nextSibling);
      duration.querySelector('input').addEventListener('change', (event) => setDurationInput(event.target.value));
    }
    duration.querySelector('input').value = durationInput;
    duration.hidden = eventKind !== 'meeting';
    return undefined;
  }, [isModalOpen, eventKind, durationInput]);

  useEffect(() => {
    setState((current) => {
      const recurring = current.tasks.filter((task) => ['daily', 'weekly', 'customWeekly'].includes(task.repeatType) && task.seriesId);
      const seriesIds = [...new Set(recurring.map((task) => task.seriesId))];
      const additions = [];
      seriesIds.forEach((seriesId) => {
        const seriesTasks = recurring.filter((task) => task.seriesId === seriesId);
        const futureTasks = seriesTasks.filter((task) => task.status !== 'done' && getTaskDeadline(task) > now);
        let cursor = Math.max(...seriesTasks.map(getTaskDeadline));
        let guard = 0;
        while (futureTasks.length + additions.filter((task) => task.seriesId === seriesId).length < 3 && guard < 8) {
          const template = seriesTasks[0];
          cursor = getNextRepeatDeadline({ ...template, deadlineAt: cursor }, cursor);
          if (cursor > now && (!template.repeatEndAt || cursor <= template.repeatEndAt)) additions.push({ ...template, id: crypto.randomUUID(), createdAt: cursor - getRepeatInterval(template.repeatType), deadlineAt: cursor, warningAt: getTaskWarningAt(current.character.job, cursor - getRepeatInterval(template.repeatType)), status: 'open', reminders: { urgentSent: false, berserkSent: false }, completedAt: undefined });
          if (template.repeatEndAt && cursor > template.repeatEndAt) break;
          guard += 1;
        }
      });
      return additions.length ? { ...current, tasks: [...current.tasks, ...additions] } : current;
    });
  }, [now]);

  const microTasks = state.tasks.filter((task) => task.status !== 'done' && task.repeatType === 'micro');
  const listDate = new Date();
  listDate.setHours(0, 0, 0, 0);
  const openTasks = sortOpenTasks(state.tasks.filter((task) => task.status !== 'done' && sameDate(getTaskDeadline(task), listDate)));
  const sortedOpenTasks = sortOpenTasks(openTasks);
  const futurePreviewTasks = state.tasks.filter((task) => task.status !== 'done' && task.repeatType !== 'micro' && getTaskDeadline(task) > listDate.getTime() && getTaskDeadline(task) <= listDate.getTime() + 4 * 24 * 60 * 60 * 1000);
  const scheduleTasks = sortOpenTasks(state.tasks.filter((task) => task.status !== 'done' && task.repeatType !== 'micro' && getTaskDeadline(task) <= now + 7 * 24 * 60 * 60 * 1000)).slice(0, 8);
  const calendarTasks = state.tasks.filter((task) => task.status !== 'done');
  const selectedDateValue = new Date(`${scheduleDate}T00:00:00`);
  const selectedDayTasks = calendarTasks.filter((task) => sameDate(getTaskDeadline(task), selectedDateValue));
  const weekStart = startOfWeek(selectedDateValue);
  const weekDays = Array.from({ length: 7 }, (_, index) => { const day = new Date(weekStart); day.setDate(weekStart.getDate() + index); return day; });
  const monthStart = new Date(selectedDateValue.getFullYear(), selectedDateValue.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => { const day = new Date(monthGridStart); day.setDate(monthGridStart.getDate() + index); return day; });
  const changeScheduleDate = (offset, unit = 'day') => { const next = new Date(selectedDateValue); if (unit === 'month') next.setMonth(next.getMonth() + offset); else next.setDate(next.getDate() + offset); setScheduleDate(dateKey(next)); };
  const moveTaskToListDate = (task) => {
    const originalDeadline = new Date(getTaskDeadline(task));
    const target = new Date(listDate);
    target.setHours(originalDeadline.getHours(), originalDeadline.getMinutes(), 0, 0);
    if (target.getTime() <= now) target.setTime(now + 60 * 60 * 1000);
    setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, deadlineAt: target.getTime(), todayPinned: true } : item) }));
    setNotice(`已将「${task.content}」传送到今日战场`);
  };
  const openScheduleSlot = (slot) => {
    setEditingTaskId(null);
    setSpell('');
    setSelectedTaskType('');
    setEventKind('task');
    setRepeatType('none');
    setDeadlineInput(new Date(slot.getTime() - slot.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setModalOpen(true);
  };
  useEffect(() => {
    if (scheduleView !== 'day') return undefined;
    const lane = document.querySelector('.day-lane');
    if (!lane) return undefined;
    const handleSlotClick = (event) => {
      if (event.target.closest?.('.schedule-task')) return;
      const bounds = lane.getBoundingClientRect();
      const hour = 6 + Math.max(0, Math.min(17.99, ((event.clientY - bounds.top) / bounds.height) * 18));
      const slot = new Date(`${scheduleDate}T00:00:00`);
      slot.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
      openScheduleSlot(slot);
    };
    lane.addEventListener('click', handleSlotClick);
    return () => lane.removeEventListener('click', handleSlotClick);
  }, [scheduleDate, scheduleView]);
  useEffect(() => {
    if (scheduleView !== 'week') return undefined;
    const columns = Array.from(document.querySelectorAll('.week-day'));
    const handlers = columns.map((column, index) => {
      const handler = (event) => {
        if (event.target.closest?.('.schedule-task')) return;
        const selected = new Date(`${scheduleDate}T00:00:00`);
        const date = startOfWeek(selected);
        date.setDate(date.getDate() + index);
        setScheduleDate(dateKey(date));
        setScheduleView('day');
      };
      column.addEventListener('click', handler);
      return { column, handler };
    });
    return () => handlers.forEach(({ column, handler }) => column.removeEventListener('click', handler));
  }, [scheduleDate, scheduleView]);
  const completedTasks = state.tasks.filter((task) => task.status === 'done');
  const currentJob = jobConfigs[state.character.job] || jobConfigs.paladin;
  const jobLogic = useJobLogic(state.character.job);
  const equippedWeapon = state.equipment.weapon ? (state.equipment.weapon === 'rusty-sword' ? { name: '旧铁剑', icon: '🗡️' } : shopItems.find((item) => item.id === state.equipment.weapon) || getItem(state.equipment.weapon) || { name: currentJob.weaponName, icon: currentJob.weaponIcon }) : { name: '未装备武器', icon: '◇' };
  const equippedItems = EQUIPMENT_SLOTS.map((slot) => ({ slot, item: getItem(state.equipment[slot]) })).filter(({ item }) => item);
  const ownedCatalog = [...ITEM_POOL, ...JOB_DROP_ITEMS, ...shopItems.map((item) => ({ ...item, rarity: item.rarity || '普通' }))];
  const allEquipments = ownedCatalog.filter((item) => item.slot && ['accessory', 'skin'].includes(item.kind));
  const isWardrobeItemUnlocked = (item) => {
    if (state.inventory.includes(item.id) || (item.unlockTitle && state.achievements.includes(item.unlockTitle)) || (item.unlockAchievement && state.achievements.includes(item.unlockAchievement))) return true;
    const doneTasks = state.tasks.filter((task) => task.status === 'done');
    const workTasks = doneTasks.filter((task) => task.type === '工作');
    const studyTasks = doneTasks.filter((task) => task.type === '学习');
    const workMinutes = workTasks.reduce((total, task) => total + (Number(task.durationMinutes) || 0), 0);
    const createdCount = state.tasks.length;
    return item.unlockRule === 'work-20' ? workTasks.length >= 20
      : item.unlockRule === 'work-100' ? workTasks.length >= 100
      : item.unlockRule === 'micro-100' ? doneTasks.filter((task) => task.repeatType === 'micro').length >= 100
      : item.unlockRule === 'created-200' ? createdCount >= 200
      : item.unlockRule === 'study-50' ? studyTasks.length >= 50
      : item.unlockRule === 'work-50-hours' ? workMinutes >= 3000
      : item.unlockRule === 'work-100-hours' ? workMinutes >= 6000
      : item.unlockRule === 'overdue-5' ? doneTasks.filter((task) => task.deadlineAt && task.completedAt > task.deadlineAt).length >= 5
      : item.unlockRule === 'focus-3' ? doneTasks.filter((task) => Number(task.durationMinutes) > 0).length >= 3
      : false;
  };
  useEffect(() => {
    const unlockedIds = allEquipments.filter(isWardrobeItemUnlocked).map((item) => item.id);
    const missingIds = unlockedIds.filter((itemId) => !state.inventory.includes(itemId));
    if (missingIds.length === 0) return;
    setState((current) => ({ ...current, inventory: [...new Set([...current.inventory, ...missingIds])] }));
  }, [state.tasks, state.achievements, state.inventory]);
  const ownedEquipments = allEquipments.filter(isWardrobeItemUnlocked).sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0));
  const weaponCatalog = [{ id: 'rusty-sword', name: '旧铁剑', icon: '🗡️', description: '初始装备' }, ...shopItems.filter((item) => item.kind === 'weapon'), ...ITEM_POOL.filter((item) => item.kind === 'weapon')];
  const equippedAccessory = equippedItems.find(({ slot }) => slot === 'leftHand')?.item || null;
  const effectiveAttributes = equippedItems.reduce((attributes, { item }) => Object.entries(item.bonuses || {}).reduce((next, [key, value]) => ({ ...next, [key]: next[key] + value }), attributes), { ...state.character.attributes });
  const expNeeded = state.character.level * 100;
  const expPercent = Math.min(100, (state.character.exp / expNeeded) * 100);
  const continentProgress = TASK_TYPES.map((type) => {
    const tasks = state.tasks.filter((task) => task.type === type);
    const done = tasks.filter((task) => task.status === 'done').length;
    return { type, done, total: tasks.length, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  });
  const achievementItems = achievementCatalog.map((achievement) => ({ ...achievement, unlocked: achievement.unlocked(state) }));

  const addTask = () => {
    if (!spell.trim()) return;
    if (parentTaskId) {
      const parentTask = state.tasks.find((task) => task.id === parentTaskId);
      if (!parentTask) return;
      const childTask = { id: crypto.randomUUID(), content: spell.trim(), done: false };
      setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === parentTaskId ? { ...task, subTasks: [...(task.subTasks || []), childTask] } : task) }));
      setSpell('');
      setDeadlineInput('');
      setRepeatType('none');
      setRepeatStartInput('');
      setRepeatEndInput('');
      setSubtaskDraft('');
      setSubtaskDrafts([]);
      setParentTaskId(null);
      setModalOpen(false);
      setNotice(`子任务已添加到「${parentTask.content}」`);
      playChime();
      return;
    }
    if (editingTaskId) {
      const parsedDeadline = deadlineInput ? new Date(deadlineInput).getTime() : null;
      if (!Number.isFinite(parsedDeadline) || parsedDeadline <= Date.now()) {
        setNotice('编辑后的截止时间必须晚于当前时间');
        return;
      }
      const durationMinutes = eventKind === 'meeting' ? Math.max(15, Math.min(720, Number(durationInput) || 60)) : 30;
      setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === editingTaskId ? { ...task, taskKind: eventKind === 'meeting' ? 'meeting' : 'instant', durationMinutes, startAt: eventKind === 'meeting' ? parsedDeadline - durationMinutes * 60000 : null, content: eventKind === 'meeting' ? `会议：${spell.trim()}` : spell.trim(), type: preview.type, difficulty: preview.difficulty, deadlineAt: parsedDeadline, monster: getMonster(preview.type, preview.difficulty), updatedAt: Date.now() } : task) }));
      setEditingTaskId(null);
      setSpell('');
      setDeadlineInput('');
      setSelectedTaskType('');
      setModalOpen(false);
      setNotice('悬赏安排已更新');
      return;
    }
    if (/活人微死，打卡上班|konami|像素虫/i.test(spell)) {
      setState((current) => ({ ...current, pets: [...new Set([...current.pets, 'pixel_bug'])], activePet: 'pixel_bug' }));
      setNotice('彩蛋触发：像素虫从暗门里钻了出来');
      setSpell('');
      setModalOpen(false);
      return;
    }
    const staminaCost = jobLogic.getStaminaCost(preview.type);
    if (state.status.stamina < staminaCost) {
      setNotice('体力不足，去黑市喝一瓶药水吧');
      return;
    }
    const currentTime = Date.now();
    const createdAt = repeatType !== 'none' && repeatStartInput ? new Date(repeatStartInput).getTime() : currentTime;
    const repeatEndAt = repeatType !== 'none' && repeatEndInput ? new Date(repeatEndInput).getTime() : null;
    const rawDeadline = deadlineInput ? new Date(deadlineInput).getTime() : createdAt + getRepeatInterval(repeatType);
    const parsedDeadline = repeatType === 'customWeekly' ? getNextRepeatDeadline({ repeatType, repeatDays }, rawDeadline - 24 * 60 * 60 * 1000) : rawDeadline;
    if (repeatType !== 'none' && createdAt < currentTime - 60 * 1000) {
      setNotice('循环任务开始时间不能早于当前时间');
      return;
    }
    if (repeatEndAt && repeatEndAt <= parsedDeadline) {
      setNotice('循环任务结束时间必须晚于首期截止时间');
      return;
    }
    if (!Number.isFinite(parsedDeadline) || parsedDeadline <= createdAt) {
      setNotice('截止时间必须晚于当前时间');
      return;
    }
    const durationMinutes = eventKind === 'meeting' ? Math.max(15, Math.min(720, Number(durationInput) || 60)) : 30;
    const task = { ...preview, taskKind: eventKind === 'meeting' ? 'meeting' : 'instant', durationMinutes, startAt: eventKind === 'meeting' ? parsedDeadline - durationMinutes * 60000 : null, content: eventKind === 'meeting' ? `会议：${spell.trim()}` : spell.trim(), reward: jobLogic.getGoldReward(preview.type, preview.reward), staminaCost, warningExtensionHours: jobLogic.getWarningExtensionHours(), deadlineAt: parsedDeadline, repeatEndAt, warningAt: jobLogic.getTaskWarningAt(createdAt), monster: getMonster(preview.type, preview.difficulty), reminders: { urgentSent: false, berserkSent: false }, repeatType, repeatDays: repeatType === 'customWeekly' ? repeatDays : [], seriesId: repeatType !== 'none' && repeatType !== 'micro' ? crypto.randomUUID() : null, id: crypto.randomUUID(), status: 'open', subTasks: subtaskDrafts.map((content) => ({ id: crypto.randomUUID(), content, done: false })), createdAt };
    setState((current) => ({ ...current, tasks: [task, ...current.tasks], status: { ...current.status, stamina: current.status.stamina - staminaCost } }));
    setSpell('');
    setDeadlineInput('');
    setRepeatType('none');
    setRepeatStartInput('');
    setRepeatEndInput('');
    setSubtaskDraft('');
    setSubtaskDrafts([]);
    setSelectedTaskType('');
    setSelectedTaskType('');
    setModalOpen(false);
    setNotice('悬赏已钉上任务墙');
    playChime();
  };

  const addSubtaskDraft = () => {
    const content = subtaskDraft.trim();
    if (!content) return;
    setSubtaskDrafts((current) => [...current, content]);
    setSubtaskDraft('');
  };

  const openChildTaskModal = (taskId) => {
    setParentTaskId(taskId);
    setSpell('');
    setDeadlineInput('');
    setRepeatType('none');
    setRepeatStartInput('');
    setRepeatEndInput('');
    setSubtaskDraft('');
    setSubtaskDrafts([]);
    setModalOpen(true);
  };

  const toggleTaskExpanded = (taskId) => setExpandedTaskIds((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);

  const toggleSubTask = (taskId, subTaskId) => {
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, subTasks: (task.subTasks || []).map((subTask) => subTask.id === subTaskId ? { ...subTask, done: !subTask.done } : subTask) } : task) }));
  };

  const completeTask = (task) => {
    if (task.status === 'open') {
      setState((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: 'in-progress', startedAt: Date.now() } : item) }));
      setNotice('挑战已开始，专注击破这一只小怪');
      return;
    }
    const overdue = Boolean(task.deadlineAt && task.deadlineAt <= now);
    if (overdue && task.status !== 'in-progress') {
      setNotice('这份悬赏已逾期，先点击开始挑战即可补卡');
      return;
    }
    const completedCount = completedTasks.length + 1;
    const completionDate = todayKey();
    const projectedTasks = state.tasks.map((item) => item.id === task.id ? { ...item, status: 'done' } : item);
    const todayTasks = projectedTasks.filter((item) => dateKey(item.createdAt) === completionDate || dateKey(getTaskDeadline(item)) === completionDate);
    const clearedToday = todayTasks.length > 0 && todayTasks.every((item) => item.status === 'done');
    const previousClear = state.dailyClearStreak || { current: 0, best: 0, lastDate: null };
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDateKey = localDateKey(yesterdayDate);
    const clearCurrent = clearedToday ? (previousClear.lastDate === completionDate ? previousClear.current : previousClear.lastDate === yesterdayDateKey ? previousClear.current + 1 : 1) : previousClear.current;
    const projectedDailyClearStreak = clearedToday ? { current: clearCurrent, best: Math.max(previousClear.best, clearCurrent), lastDate: completionDate } : previousClear;
    const projectedState = { ...state, tasks: projectedTasks, dailyClearStreak: projectedDailyClearStreak };
    const newlyUnlockedTitles = titles.filter((title) => title.unlocked(projectedState) && !state.achievements.includes(title.id));
    const newlyUnlockedAchievements = achievementCatalog.filter((achievement) => achievement.unlocked(projectedState) && !state.achievements.includes(achievement.id));
    const newlyUnlocked = [...newlyUnlockedTitles, ...newlyUnlockedAchievements];
    const unlockedRewardIds = new Set([...state.achievements, ...newlyUnlocked.map((entry) => entry.id)]);
    const newlyUnlockedItems = ITEM_CATALOG.filter((item) => (item.unlockTitle && unlockedRewardIds.has(item.unlockTitle)) || (item.unlockAchievement && unlockedRewardIds.has(item.unlockAchievement))).map((item) => item.id);
    const droppedItem = state.character.job === 'ranger' && Math.random() < 0.15 ? JOB_DROP_ITEMS[Math.floor(Math.random() * JOB_DROP_ITEMS.length)] : null;
    setState((current) => {
      const completedDate = completionDate;
      const lastDate = current.streak.lastCompletedDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      const currentStreak = lastDate === completedDate ? current.streak.current : lastDate === yesterdayKey ? current.streak.current + 1 : 1;
      const streakMultiplier = currentStreak >= 30 ? 1.5 : currentStreak >= 7 ? 1.3 : currentStreak >= 3 ? 1.15 : 1;
      const reward = Math.max(1, Math.round((overdue ? task.reward * 0.8 : task.reward) * streakMultiplier));
      const isNightTask = [22, 23, 0, 1, 2, 3, 4, 5].includes(new Date().getHours());
      const expGain = current.activePet === 'sleepy_cat' && isNightTask ? Math.round(task.exp * 1.1) : task.exp;
      const nextExp = current.character.exp + expGain;
      const levelUp = nextExp >= current.character.level * 100;
      const attribute = typeMeta[task.type]?.attribute || 'DEX';
      const completedAt = Date.now();
      const nextDeadline = Math.max(completedAt + 60 * 1000, getTaskDeadline(task) + getRepeatInterval(task.repeatType));
      const nextTask = task.repeatType && task.repeatType !== 'none' && !task.seriesId ? { ...task, id: crypto.randomUUID(), status: 'open', createdAt: completedAt, deadlineAt: nextDeadline, warningAt: getTaskWarningAt(state.character.job, completedAt), monster: getMonster(task.type, task.difficulty), reminders: { urgentSent: false, berserkSent: false }, completedAt: undefined } : null;
      const nextTasks = current.tasks.map((item) => item.id === task.id ? { ...item, status: 'done', completedAt } : item);
      if (nextTask) nextTasks.push(nextTask);
      const completedTotal = nextTasks.filter((item) => item.status === 'done').length;
      const milestonePets = PETS.filter((pet) => pet.unlock === 'task_milestone' && completedTotal >= pet.requirement).map((pet) => pet.id);
      const unlockedPets = [...new Set([...current.pets, ...milestonePets])];
      return {
        ...current,
        tasks: nextTasks,
        character: { ...current.character, exp: levelUp ? nextExp - current.character.level * 100 : nextExp, level: levelUp ? current.character.level + 1 : current.character.level, gold: current.character.gold + reward, attributes: { ...current.character.attributes, [attribute]: current.character.attributes[attribute] + (current.activePet === 'dragon_whelp' ? 1.1 : 1) } },
        status: { ...current.status, stamina: Math.min(current.status.maxStamina, current.status.stamina + (current.character.job === 'paladin' ? 2 : current.character.job === 'mage' ? 0 : 1)) },
        achievements: [...new Set([...current.achievements, ...newlyUnlocked.map((title) => title.id), ...(currentStreak >= 14 ? ['连胜火焰'] : []), ...(projectedDailyClearStreak.best >= 30 ? ['强迫症晚期'] : [])])],
        streak: { current: currentStreak, best: Math.max(current.streak.best, currentStreak), lastCompletedDate: completedDate },
        dailyClearStreak: projectedDailyClearStreak,
        inventory: [...new Set([...current.inventory, ...newlyUnlockedItems, ...(droppedItem ? [droppedItem.id] : [])])],
        pets: unlockedPets,
      };
    });
    const achievementNotice = newlyUnlocked.length > 0 ? `成就解锁：「${newlyUnlocked[0].name}」` : '';
    const lootNotice = droppedItem ? ` · 风行者掉落：${droppedItem.icon}${droppedItem.name}` : '';
    const milestoneNotice = [10, 25, 50, 100].includes(completedCount) ? ` · 宠物里程碑解锁 ${PETS.find((pet) => pet.requirement === completedCount)?.icon || ''}` : '';
    const remaining = task.deadlineAt ? task.deadlineAt - now : Number.POSITIVE_INFINITY;
    const isNightTask = [22, 23, 0, 1, 2, 3, 4, 5].includes(new Date().getHours());
    const quotePool = remaining <= 60 * 60 * 1000 ? QUOTE_LIBRARY.task.danger : isNightTask ? QUOTE_LIBRARY.task.night : task.exp >= 20 ? QUOTE_LIBRARY.task.perfect : [...QUOTE_LIBRARY.task.normal, ...(QUOTE_LIBRARY.task[state.character.job] || [])];
    setCompletionEffect({ reward: Math.round((overdue ? task.reward * 0.8 : task.reward) * (state.streak.current >= 30 ? 1.5 : state.streak.current >= 7 ? 1.3 : state.streak.current >= 3 ? 1.15 : 1)), streak: state.streak.current + 1, overdue });
    setNotice(achievementNotice || `${randomQuote(quotePool)} · ${overdue ? '逾期补卡，奖励按 80% 结算' : '属性成长 +1'} · 连胜 ${state.streak.current + 1} 天${lootNotice}${milestoneNotice}`);
    playChime();
  };

  const deleteTask = (taskId) => {
    const target = state.tasks.find((task) => task.id === taskId);
    const seriesId = target?.seriesId;
    if (!target) return;
    const deleteSeries = seriesId ? window.confirm(`确定删除「${target.content}」的整个循环任务系列吗？\n点击“取消”可继续选择是否只删除当前事件。`) : false;
    if (seriesId && !deleteSeries && !window.confirm(`确定只删除当前事件「${target.content}」吗？`)) return;
    if (!seriesId && !window.confirm(`确定删除事件「${target.content}」吗？\n删除后将无法恢复。`)) return;
    setDeletingTaskId(taskId);
    window.setTimeout(() => {
      setState((current) => ({ ...current, tasks: current.tasks.filter((task) => deleteSeries ? task.seriesId !== seriesId : task.id !== taskId) }));
      setDeletingTaskId(null);
      setNotice(deleteSeries ? '循环任务系列已删除' : '当前任务事件已删除');
    }, 420);
  };

  const openTaskEditor = (task) => {
    setEditingTaskId(task.id);
    setSpell(task.content.replace(/^会议：/, ''));
    setEventKind(task.content.startsWith('会议：') ? 'meeting' : 'task');
    setDurationInput(String(task.durationMinutes || (task.content.startsWith('会议：') ? 60 : 30)));
    setDeadlineInput(new Date(getTaskDeadline(task) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setSelectedTaskType(task.type || '');
    setRepeatType(task.repeatType || 'none');
    setRepeatDays(Array.isArray(task.repeatDays) && task.repeatDays.length ? task.repeatDays : DEFAULT_REPEAT_DAYS);
    setModalOpen(true);
  };

  const buyItem = (item) => {
    if (item.kind === 'weapon' && state.inventory.includes(item.id)) {
      setNotice('这件装备已经在你的衣柜里了');
      return;
    }
    if (item.kind === 'potion' && state.status.potionsUsedToday >= 2) {
      setNotice('今天的药水配额已经用完了');
      return;
    }
    const petDiscount = state.activePet === 'ghost_lamp' ? 0.95 : 1;
    const price = jobLogic.getShopPrice(Math.round(item.price * petDiscount));
    if (state.character.gold < price) {
      setNotice('金币不够，先去完成一份悬赏吧');
      return;
    }
    if (item.kind === 'potion') {
      setState((current) => ({ ...current, character: { ...current.character, gold: current.character.gold - price }, inventory: addInventoryItem(current.inventory, item.id) }));
    } else {
      setState((current) => ({ ...current, character: { ...current.character, gold: current.character.gold - price }, inventory: addInventoryItem(current.inventory, item.id) }));
    }
    setNotice(`${item.name} 已收入小屋`);
    playChime();
  };

  const drawRaffle = () => {
    const price = state.character.job === 'mage' ? Math.round(RAFFLE_CONFIG.basePrice * 0.9) : RAFFLE_CONFIG.basePrice;
    if (state.character.gold < price) {
      setNotice('金币不够，先完成悬赏再抽取魔法灵');
      return;
    }
    const pool = [...ITEM_POOL, ...JOB_DROP_ITEMS.filter((item) => item.kind === 'accessory').map((item) => ({ ...item, rarity: '稀有' })), ...shopItems.filter((item) => item.kind === 'weapon' && !item.job).map((item) => ({ ...item, rarity: '史诗' }))];
    const pityReady = state.raffle.pity >= RAFFLE_CONFIG.pityDraws - 1;
    const nextDraw = state.raffle.draws + 1;
    const milkTeaOwned = state.inventory.includes('giant-milk-tea');
    const milkTeaGuaranteed = !milkTeaOwned && nextDraw >= RAFFLE_CONFIG.giantMilkTeaPityDraws;
    const milkTeaLucky = !milkTeaOwned && Math.random() < RAFFLE_CONFIG.giantMilkTeaChance;
    const rarityRoll = Math.random() * 100;
    const targetRarity = pityReady ? '史诗' : rarityRoll < 60 ? '普通' : rarityRoll < 85 ? '稀有' : rarityRoll < 95 ? '史诗' : rarityRoll < 99 ? '传说' : '惊喜';
    const rarityPool = milkTeaGuaranteed || milkTeaLucky ? pool.filter((item) => item.id === 'giant-milk-tea') : pool.filter((item) => item.rarity === targetRarity);
    const result = rarityPool[Math.floor(Math.random() * rarityPool.length)] || pool[0];
    const duplicate = result.kind === 'pet' ? state.pets.includes(result.petId) : result.kind === 'gold' || result.kind === 'potion' ? false : state.inventory.includes(result.id);
    const duplicateValue = 20;
    const historyEntry = { ...result, duplicate, timestamp: Date.now() };
    setState((current) => {
      const isPet = result.kind === 'pet';
      const isPotion = result.kind === 'potion';
      const isGold = result.kind === 'gold';
      const rewardGold = duplicate ? duplicateValue : isGold ? result.value : 0;
      return { ...current, character: { ...current.character, gold: current.character.gold - price + rewardGold }, status: { ...current.status, stamina: current.status.stamina }, pets: isPet && !duplicate ? [...new Set([...current.pets, result.petId])] : current.pets, inventory: isPet || isGold || duplicate ? current.inventory : addInventoryItem(current.inventory, result.id), raffle: { draws: current.raffle.draws + 1, pity: ['史诗', '传说', '惊喜'].includes(result.rarity) ? 0 : current.raffle.pity + 1, history: [historyEntry, ...current.raffle.history].slice(0, 10) } };
    });
    setRaffleResult({ ...result, duplicate });
    setNotice(duplicate ? `重复物品已转化为 ${duplicateValue} 金币：${result.icon} ${result.name}` : `魔法灵吐出：${result.rarity} · ${result.icon} ${result.name}`);
    playChime();
  };

  const equipWeapon = (weaponId) => {
    if (!state.inventory.includes(weaponId)) return;
    setState((current) => ({ ...current, equipment: { ...current.equipment, weapon: weaponId, rightHand: null, accessories: { ...current.equipment.accessories, rightHand: null } } }));
    setNotice('装备已换上，气场发生了变化');
  };

  const equipAccessory = (accessoryId) => {
    const item = getItem(accessoryId);
    if (!item || !['accessory', 'skin'].includes(item.kind) || !isWardrobeItemUnlocked(item) || !item.slot) return;
    setState((current) => { const accessories = current.equipment.accessories || {}; const slot = item.slot === 'hand' ? 'leftHand' : item.slot; return { ...current, equipment: { ...current.equipment, [slot]: accessoryId, ...(slot === 'rightHand' ? { weapon: null } : {}), ...(slot === 'leftHand' ? { hand: accessoryId, accessory: accessoryId } : {}), accessories: { ...accessories, [slot]: accessoryId, ...(slot === 'rightHand' ? { rightHand: accessoryId } : {}), ...(slot === 'leftHand' ? { hand: accessoryId } : {}) } } }; });
    setNotice(`${item.name} 已装备到${item.slot}槽位`);
  };

  const unequipSlot = (slot) => {
    if (!state.equipment[slot]) return;
    setState((current) => ({ ...current, equipment: { ...current.equipment, [slot]: null, ...(slot === 'leftHand' ? { hand: null, accessory: null } : {}), accessories: { ...current.equipment.accessories, [slot]: null, ...(slot === 'leftHand' ? { hand: null } : {}) } } }));
    setNotice(`${SLOT_LABELS[slot]}装备已卸下`);
  };

  const useMiscItem = (item) => {
    if (item.kind !== 'potion' || !state.inventory.includes(item.id) || state.status.potionsUsedToday >= 2) return;
    setState((current) => ({ ...current, inventory: removeInventoryItem(current.inventory, item.id), status: { ...current.status, stamina: Math.min(current.status.maxStamina, current.status.stamina + (item.value || 5)), potionsUsedToday: current.status.potionsUsedToday + 1 } }));
    setNotice(`${item.name} 已使用，体力恢复`);
  };

  const sellMiscItem = (item) => {
    if (item.kind !== 'potion' || !state.inventory.includes(item.id)) return;
    const value = Math.max(5, Math.round((item.value || 20) / 2));
    setState((current) => ({ ...current, inventory: removeInventoryItem(current.inventory, item.id), character: { ...current.character, gold: current.character.gold + value } }));
    setNotice(`${item.name} 已出售，获得 ${value} 金币`);
  };

  const openWardrobe = (tab = 'equipment', slot = 'head') => {
    setWardrobeTab(tab);
    setWardrobeSlot(slot);
    setActivePanel('wardrobe-modern');
  };

  const interactPet = () => {
    if (!state.activePet) {
      setNotice('宠物正在休息，去宠物仓库召回它吧');
      return;
    }
    const pet = getPetMeta(state.activePet);
    const coinDrop = state.activePet === 'fire_baby' && Math.random() < 0.35 ? 1 + Math.floor(Math.random() * 5) : 0;
    setState((current) => ({ ...current, character: { ...current.character, gold: current.character.gold + coinDrop }, petState: { mood: current.activePet === 'sleepy_cat' ? 'sleepy' : 'happy', lastInteraction: Date.now() } }));
    const petQuote = randomQuote(QUOTE_LIBRARY.pet[state.activePet] || QUOTE_LIBRARY.pet.slime_green);
    setNotice(coinDrop ? `${petQuote} · ${pet.name} 炸裂出 ${coinDrop} 金币！` : `${petQuote}`);
    playChime();
  };

  const equipTitle = (title) => {
    if (!title.unlocked(state)) return;
    setState((current) => ({ ...current, equipment: { ...current.equipment, title: title.id }, character: { ...current.character, title: title.id } }));
    setNotice(`称号已切换为「${title.name}」`);
  };

  const changeJob = (nextJob) => {
    if (nextJob === state.character.job) return;
    if (state.character.level < 10) {
      setNotice('达到 LV 10 后才能转职');
      return;
    }
    if (state.character.gold < 500) {
      setNotice('转职祭坛需要 500 金币');
      return;
    }
    const config = getJobConfig(nextJob);
    const oldJobWeapon = getJobConfig(state.character.job).weapon;
    setState((current) => ({ ...current, character: { ...current.character, job: nextJob, jobLevel: 1, gold: current.character.gold - 500, buffs: [config.buff] }, status: { ...current.status, stamina: 0, maxStamina: config.maxStamina }, equipment: { ...current.equipment, weapon: 'rusty-sword' }, inventory: [...new Set([...current.inventory.filter((item) => item !== oldJobWeapon), 'rusty-sword'])] }));
    setNotice(`转职成功：${config.name}，今日体力已重置`);
    playChime();
  };

  return (
    <main className={`app-shell job-${currentJob.color}`}>
      <div className="ambient-glow glow-one" /><div className="ambient-glow glow-two" />
      <PetCorner petId={state.activePet} mood={state.petState.mood} celebrating={Boolean(completionEffect)} onInteract={interactPet} />
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✧</span><div><p className="eyebrow">AIO / 724</p><h1>冒险者小屋</h1></div></div>
        <div className="top-actions"><span className="save-state">● 本地存档正常</span><button className="nav-button market-button" onClick={() => setActivePanel('shop')}><img src="/icons/shopping.svg" alt="" />黑市</button><button className="nav-button" onClick={() => setActivePanel('raffle')}>抽奖记录</button><button className="icon-button wardrobe-button" onClick={() => setActivePanel('wardrobe')} aria-label="打开衣柜"><img src="/icons/wardrobe.svg" alt="" /></button></div>
      </header>
      {TEST_MODE && <section className="test-tools" aria-label="测试工具"><strong>测试工具</strong><span>仅当前 URL 生效，不代表正式玩法</span><button onClick={() => applyTestPreset('max')}>满资源</button><button onClick={() => applyTestPreset('leveling')}>逐级升级</button><button onClick={() => applyTestPreset('levelByLevel')}>升一级</button><button onClick={() => applyTestPreset('raffle')}>抽奖保底</button><button onClick={() => applyTestPreset('expired')}>过期任务</button><button onClick={() => applyTestPreset('randomTasks')}>随机任务组</button><button className="test-reset" onClick={() => applyTestPreset('reset')}>重置存档</button></section>}

      <section className="hero-grid">
        <aside className="character-panel panel">
          <div className="portrait-wrap"><CharacterAvatar job={state.character.job} equipment={state.equipment} weapon={state.equipment.weapon ? equippedWeapon : null} background={JOB_ART[state.character.job]} /><span className="level-badge">LV {state.character.level}</span></div>
          <p className="eyebrow">当前职业 · {currentJob.name}</p><h2>{state.character.title}</h2><p className="muted">{currentJob.motto}</p>
          <div className="stat-line"><span>经验值</span><strong>{state.character.exp} / {expNeeded}</strong></div><div className="xp-track"><i style={{ width: `${expPercent}%` }} /></div>
          <div className="resource-grid"><div><span>◉</span><strong>{state.character.gold}</strong><small>金币</small></div><div><span>♨</span><strong>{state.status.stamina}/{state.status.maxStamina}</strong><small>体力</small></div></div>
          <div className="ability-panel"><div><p className="section-label">能力雷达</p><small>装备属性已计入</small></div><AbilityRadar attributes={effectiveAttributes} /></div>
          <div className="equipped-accessory"><span>已装备</span><strong>{equippedItems.filter(({ slot }) => slot !== 'body').length}/4</strong>{equippedAccessory ? <small>{equippedAccessory.name} · {Object.entries(equippedAccessory.bonuses || {}).map(([key, value]) => `${key} +${value}`).join(' · ')}</small> : <small>尚未装备手部饰品</small>}{equippedItems.filter(({ slot }) => !['hand', 'body'].includes(slot)).length > 0 && <small>{equippedItems.filter(({ slot }) => !['hand', 'body'].includes(slot)).map(({ item }) => `${item.icon}${item.name}`).join(' · ')}</small>}</div><div className="accessory-actions">{equippedItems.map(({ slot, item }) => <button key={slot} className="selected" title={`${SLOT_LABELS[slot]}：${item.name}`} onClick={() => openWardrobe('equipment', slot)}>{item.icon}</button>)}</div>
          <div className="pet-selector"><span>出战宠物</span>{state.activePet ? <button className="selected" title={`${getPetMeta(state.activePet).name}：打开宠物仓库`} onClick={() => openWardrobe('pets')}>{getPetMeta(state.activePet).icon}</button> : <small>休息中</small>}</div>
        </aside>

        <section className="room panel">
          {activePanel === 'wardrobe-modern' && wardrobeTab === 'misc' && <div className="inventory-overview"><p className="section-label">完整道具仓库 · 药水可逐件使用或出售</p><div className="save-tools"><strong>本地存档</strong><small>数据只保存在当前浏览器，不会上传</small><button onClick={exportSave}>导出存档</button><label><span>导入存档</span><input type="file" accept="application/json,.json" onChange={importSave} /></label></div><div className="inventory-overview-grid">{[...ITEM_POOL, ...JOB_DROP_ITEMS, ...shopItems.filter((item) => item.kind === 'potion')].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index).map((item) => { const quantity = inventoryCount(state.inventory, item.id); const usable = item.kind === 'potion'; const visible = true; return visible ? <article className={`inventory-stack ${quantity === 0 ? 'unowned' : ''}`} key={item.id}><ItemIcon item={item} /><div><strong>{item.name} ×{quantity}</strong><small>{quantity > 0 ? item.description || '可在背包中管理' : `未获得 · ${item.description || '黑市、抽奖或任务获取'}`}</small></div>{quantity > 0 && usable && <><button disabled={state.status.potionsUsedToday >= 2} onClick={() => useMiscItem(item)}>使用一件</button><button onClick={() => sellMiscItem(item)}>出售一件</button></>}</article> : null; })}</div></div>}
          {activePanel === 'wardrobe-modern' && <div className="subpanel wardrobe-modern"><div className="room-header"><div><p className="eyebrow">WARDROBE MANAGEMENT</p><h2>装备管理中心</h2></div><button className="back-button" onClick={() => setActivePanel('board')}>返回任务墙</button></div><div className="wardrobe-tabs"><button className={wardrobeTab === 'equipment' ? 'active' : ''} onClick={() => setWardrobeTab('equipment')}>装备穿戴</button><button className={wardrobeTab === 'pets' ? 'active' : ''} onClick={() => setWardrobeTab('pets')}>宠物仓库</button><button className={wardrobeTab === 'misc' ? 'active' : ''} onClick={() => setWardrobeTab('misc')}>背包杂项</button></div>{wardrobeTab === 'equipment' && <><div className="slot-filter">{EQUIPMENT_SLOTS.map((slot) => <button key={slot} className={wardrobeSlot === slot ? 'active' : ''} onClick={() => setWardrobeSlot(slot)}>{SLOT_LABELS[slot]}</button>)}</div><div className="wardrobe-section"><p className="section-label">{SLOT_LABELS[wardrobeSlot]} · 同槽位装备互斥</p><div className="wardrobe-grid equipment-grid">{allEquipments.filter((item) => item.slot === wardrobeSlot).map((item) => { const owned = state.inventory.includes(item.id); return <button disabled={!owned} className={`wardrobe-item ${state.equipment[wardrobeSlot] === item.id ? 'equipped' : ''} ${!owned ? 'locked' : ''}`} key={item.id} onClick={() => equipAccessory(item.id)}><ItemIcon item={item} /><small>{item.name}</small><em>{owned ? item.rarity || '普通' : `未获得 · ${item.description || '黑市或抽奖获取'}`}</em>{state.equipment[wardrobeSlot] === item.id && <b>已装备</b>}</button>; })}{allEquipments.filter((item) => item.slot === wardrobeSlot).length === 0 && <div className="empty-state compact-empty"><span>◇</span><p>这个槽位还没有装备</p><small>去黑市或完成任务寻找新物品。</small></div>}</div>{state.equipment[wardrobeSlot] && <button className="unequip-button" onClick={() => unequipSlot(wardrobeSlot)}>卸下当前{SLOT_LABELS[wardrobeSlot]}装备</button>}</div><div className="wardrobe-section"><p className="section-label">当前武器 · {equippedWeapon.name}</p><div className="wardrobe-grid">{['rusty-sword', 'holy-sword', 'fire-staff', 'composite-bow', 'ember-sword', 'moon-staff'].map((weaponId) => { const item = weaponId === 'rusty-sword' ? { name: '旧铁剑', icon: '🛡️', description: '初始装备' } : shopItems.find((shopItem) => shopItem.id === weaponId); if (!item) return null; const owned = state.inventory.includes(weaponId); return <button disabled={!owned} className={`wardrobe-item ${state.equipment.weapon === weaponId ? 'equipped' : ''} ${!owned ? 'locked' : ''}`} key={weaponId} onClick={() => equipWeapon(weaponId)}><ItemIcon item={item} /><small>{item.name}</small><em>{owned ? '已获得' : `未获得 · ${item.description || '黑市获取'}`}</em>{state.equipment.weapon === weaponId && <b>已装备</b>}</button>; })}</div></div></>}{wardrobeTab === 'pets' && <div className="wardrobe-section"><p className="section-label">宠物仓库 · 选择一只陪你冒险</p><div className="pet-vault">{PETS.map((pet) => { const owned = state.pets.includes(pet.id); return <button disabled={!owned} className={`pet-vault-item ${state.activePet === pet.id ? 'active' : ''} ${!owned ? 'locked' : ''}`} key={pet.id} onClick={() => setState((current) => ({ ...current, activePet: pet.id }))}><span>{pet.icon}</span><strong>{pet.name}</strong><small>{owned ? pet.passive : `未获得 · ${pet.unlock === 'task_milestone' ? `完成 ${pet.requirement} 个任务解锁` : '完成彩蛋条件解锁'}`}</small>{state.activePet === pet.id && <b>出战中</b>}</button>; })}</div><button className="unequip-button" onClick={() => setState((current) => ({ ...current, activePet: null }))}>让当前宠物休息</button></div>}{wardrobeTab === 'misc' && <div className="wardrobe-section"><p className="section-label">背包杂项 · 消耗品与可出售物品</p><div className="misc-list">{ownedCatalog.filter((item) => state.inventory.includes(item.id) && ['potion', 'gold'].includes(item.kind)).map((item) => <article className="misc-item" key={item.id}><ItemIcon item={item} /><div><strong>{item.name}</strong><small>{item.description || '背包中的杂项物品'}</small></div>{item.kind === 'potion' && <button onClick={() => useMiscItem(item)}>使用</button>}<button onClick={() => sellMiscItem(item)}>出售</button></article>)}{ownedCatalog.filter((item) => state.inventory.includes(item.id) && ['potion', 'gold'].includes(item.kind)).length === 0 && <div className="empty-state compact-empty"><span>◇</span><p>背包杂项为空</p><small>抽奖和冒险奖励会出现在这里。</small></div>}</div></div>}</div>}
          <div className="equipment-dock" aria-label="当前装备"><button className="dock-pet" onClick={() => openWardrobe('pets')} title="打开宠物仓库"><ItemIcon item={state.activePet ? { icon: getPetMeta(state.activePet).icon, rarity: '稀有' } : null} empty="🐾" /></button>{EQUIPMENT_SLOTS.map((slot) => <button className={`dock-slot ${state.equipment[slot] ? 'filled' : ''}`} key={slot} onClick={() => openWardrobe('equipment', slot)} title={`打开${SLOT_LABELS[slot]}装备`}><ItemIcon item={getItem(state.equipment[slot])} /><small>{SLOT_LABELS[slot]}</small></button>)}<button className="dock-slot filled" onClick={() => openWardrobe('equipment', 'hand')} title="打开武器装备"><ItemIcon item={equippedWeapon} /><small>武器</small></button></div>
          {activePanel === 'board' && <><div className="room-header"><div><p className="eyebrow">THE QUEST BOARD</p><h2>今日悬赏</h2></div><span className="quest-count">{openTasks.length} 个待处理</span></div><div className="quest-wall">{openTasks.length === 0 ? <div className="empty-state"><span>☾</span><p>任务墙空空如也</p><small>召唤一份悬赏，让小屋重新运转。</small></div> : sortedOpenTasks.map((task) => { const deadlineAt = getTaskDeadline(task); const expired = deadlineAt <= now; return <article className={`quest-card difficulty-${difficultyClass[task.difficulty] || 'normal'} ${typeMeta[task.type]?.color || 'teal'} ${expired ? 'expired' : ''}`} key={task.id}><div className="quest-icon">{typeMeta[task.type]?.icon || '✦'}</div><div className="quest-content"><div className="quest-meta"><span>{task.type} · {task.difficulty}</span><small>+{task.exp} EXP · 体力 -{task.staminaCost ?? 1}{task.warningExtensionHours ? ` · 预警 +${task.warningExtensionHours} 小时` : ''} · {formatRemaining(deadlineAt, now)}</small></div><h3>{task.content}</h3><div className="quest-foot"><span>赏金 <b>◉ {task.reward}</b></span><button disabled={expired} onClick={() => completeTask(task)}>{expired ? '已过期' : '完成悬赏'} <span>→</span></button><button className="delete-button" onClick={() => deleteTask(task.id)} aria-label={`删除任务 ${task.content}`}>×</button></div></div></article>; })}</div><button className="summon-button" onClick={() => setModalOpen(true)}><span>✦</span><div><strong>召唤新的悬赏</strong><small>把现实任务写成冒险咒语</small></div><b>+</b></button><button className="log-link" onClick={() => setActivePanel('log')}>查看冒险日志 →</button></>}
            {activePanel === 'board' && <><div className="room-header"><div><p className="eyebrow">THE QUEST BOARD</p><h2>今日悬赏</h2></div><span className="quest-count">{openTasks.length} 个待处理</span></div><div className="quest-wall">{openTasks.length === 0 ? <div className="empty-state"><span>☾</span><p>任务墙空空如也</p><small>召唤一份悬赏，让小屋重新运转。</small></div> : openTasks.map((task) => { const deadlineAt = task.deadlineAt || task.createdAt + 24 * 60 * 60 * 1000; const expired = deadlineAt <= now; const subTasks = Array.isArray(task.subTasks) ? task.subTasks : []; const subDone = subTasks.filter((subTask) => subTask.done).length; const allSubTasksDone = subTasks.length === 0 || subDone === subTasks.length; const expanded = expandedTaskIds.includes(task.id); return <article className={`quest-card ${typeMeta[task.type]?.color || 'teal'} ${task.status === 'in-progress' ? 'in-progress' : ''} ${expired ? 'expired' : ''} ${deletingTaskId === task.id ? 'deleting' : ''}`} key={task.id}><div className="quest-icon">{typeMeta[task.type]?.icon || '✦'}</div><div className="quest-content"><div className="quest-meta"><span>{task.type} · {task.difficulty}</span><small>+{task.exp} EXP · 体力 -{task.staminaCost ?? 1}{task.warningExtensionHours ? ` · 预警 +${task.warningExtensionHours} 小时` : ''} · {formatRemaining(deadlineAt, now)}</small></div><div className="quest-title-row"><h3>{task.content}</h3>{subTasks.length > 0 && <button className="expand-task-button" onClick={() => toggleTaskExpanded(task.id)} aria-expanded={expanded}>{expanded ? '收起子任务' : `展开子任务 ${subDone}/${subTasks.length}`}</button>}</div>{subTasks.length > 0 && <div className="subtask-progress"><span>{'▓'.repeat(subDone)}{'░'.repeat(subTasks.length - subDone)}</span><small>子任务 {subDone}/{subTasks.length}</small></div>}{expanded && <div className="subtask-list">{subTasks.map((subTask) => <button className={subTask.done ? 'done' : ''} key={subTask.id} onClick={() => toggleSubTask(task.id, subTask.id)}><span>{subTask.done ? '✓' : '○'}</span>{subTask.content}</button>)}<button className="create-subtask-button" onClick={() => openChildTaskModal(task.id)}>＋ 创建子任务</button></div>}<div className="quest-foot"><span>赏金 <b>◉ {task.reward}</b></span><button disabled={!allSubTasksDone} onClick={() => completeTask(task)}>{task.status === 'open' ? '开始挑战' : expired ? '补卡完成' : '完成悬赏'} <span>→</span></button><button className="delete-button" onClick={() => deleteTask(task.id)} aria-label={`删除任务 ${task.content}`}>×</button></div></div></article>; })}</div><button className="summon-button" onClick={() => setModalOpen(true)}><span>✦</span><div><strong>召唤新的悬赏</strong><small>把现实任务写成冒险咒语</small></div><b>+</b></button><button className="log-link" onClick={() => setActivePanel('log')}>查看冒险日志 →</button></>}
          {activePanel === 'log' && <div className="subpanel"><div className="room-header"><div><p className="eyebrow">ADVENTURE LOG</p><h2>完成记录</h2></div><button className="back-button" onClick={() => setActivePanel('board')}>返回任务墙</button></div>{completedTasks.length === 0 ? <div className="empty-state"><span>☾</span><p>还没有完成记录</p><small>先完成一份悬赏，日志会自己长出来。</small></div> : <div className="history-list">{[...completedTasks].reverse().map((task) => <article className="history-item" key={task.id}><span>✓</span><div><strong>{task.content}</strong><small>{task.type} · 获得 {task.reward} 金币 / {task.exp} EXP</small></div></article>)}</div>}</div>}
          {activePanel === 'raffle' && <div className="subpanel"><div className="room-header"><div><p className="eyebrow">RAFFLE ARCHIVE</p><h2>抽奖记录</h2></div><button className="back-button" onClick={() => setActivePanel('board')}>返回任务墙</button></div><div className="raffle-summary"><strong>已抽 {state.raffle.draws} 次</strong><span>史诗保底进度 {state.raffle.pity}/{RAFFLE_CONFIG.pityDraws}</span></div>{state.raffle.history.length === 0 ? <div className="empty-state"><span>✧</span><p>还没有抽奖记录</p><small>去黑市召唤一次魔法灵，记录会留在这里。</small></div> : <div className="raffle-history">{state.raffle.history.map((entry, index) => <article className={`raffle-history-item rarity-${entry.rarity}`} key={`${entry.timestamp}-${index}`}><span className="history-icon">{entry.icon}</span><div><strong>{entry.name}</strong><small>{entry.rarity} · {entry.duplicate ? '重复转化 +20 金币' : '已收入背包'} · {new Date(entry.timestamp).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</small></div></article>)}</div>}</div>}
          {activePanel === 'shop' && <div className="subpanel"><div className="room-header"><div><p className="eyebrow">THE BLACK MARKET</p><h2>小屋黑市</h2></div><button className="back-button" onClick={() => setActivePanel('board')}>返回任务墙</button></div><p className="panel-intro">魔法灵只接受金币，不接受拖延。{state.character.job === 'mage' && ' 大魔导士享受商品 8 折，抽奖 9 折。'}</p><article className={`raffle-panel ${raffleResult ? `rarity-${raffleResult.rarity}` : ''}`}><span className="shop-icon">🎁</span><div><strong>魔法灵抽奖</strong><small>{raffleResult ? `最近获得：${raffleResult.rarity} · ${raffleResult.icon} ${raffleResult.name}` : '随机获得药水、饰品或武器'} · 已抽 {state.raffle.draws} 次 · 保底 {state.raffle.pity}/{RAFFLE_CONFIG.pityDraws}</small></div><button className="buy-button" onClick={drawRaffle}>{state.character.job === 'mage' ? '45 ◉' : '50 ◉'}</button></article><div className="shop-list">{shopItems.map((item) => { const price = jobLogic.getShopPrice(item.price); const locked = item.job && item.job !== state.character.job; return <article className={`shop-item ${locked ? 'locked' : ''}`} key={item.id}><span className="shop-icon">{item.icon}</span><div><strong>{item.name}</strong><small>{locked ? `仅限${jobConfigs[item.job].name}` : item.description}</small></div><button className="buy-button" disabled={locked} onClick={() => buyItem(item)}>{locked ? '职业限定' : item.kind === 'potion' ? `${price} ◉` : state.inventory.includes(item.id) ? '已拥有' : `${price} ◉`}</button></article>; })}</div></div>}
          {activePanel === 'wardrobe' && <div className="subpanel"><div className="room-header"><div><p className="eyebrow">WARDROBE & TITLES</p><h2>衣柜与转职祭坛</h2></div><button className="back-button" onClick={() => setActivePanel('board')}>返回任务墙</button></div><div className="wardrobe-section"><p className="section-label">武器 · {equippedWeapon.name}</p><div className="wardrobe-grid">{['rusty-sword', 'holy-sword', 'fire-staff', 'composite-bow', 'ember-sword', 'moon-staff'].map((weaponId) => { const item = weaponId === 'rusty-sword' ? { name: '旧铁剑', icon: '🛡️' } : shopItems.find((shopItem) => shopItem.id === weaponId); if (!item) return null; return <button className={`wardrobe-item ${state.equipment.weapon === weaponId ? 'equipped' : ''} ${!state.inventory.includes(weaponId) ? 'locked' : ''}`} key={weaponId} onClick={() => equipWeapon(weaponId)}><span>{item.icon}</span><small>{item.name}</small>{state.equipment.weapon === weaponId && <b>已装备</b>}</button>; })}</div></div><div className="wardrobe-section"><p className="section-label">称号</p><div className="title-list">{titles.map((title) => <button className={`title-item ${state.equipment.title === title.id ? 'equipped' : ''} ${!title.unlocked(state) ? 'locked' : ''}`} key={title.id} onClick={() => equipTitle(title)}><span>✦</span><div><strong>{title.name}</strong><small>{title.unlocked(state) ? title.requirement : `未解锁 · ${title.requirement}`}</small></div></button>)}</div></div><div className="wardrobe-section job-shrine"><p className="section-label">转职祭坛 · 保留等级与属性</p><div className="job-list">{jobIds.map((jobId) => { const job = jobConfigs[jobId]; return <button className={`job-card ${state.character.job === jobId ? 'active' : ''}`} key={jobId} onClick={() => changeJob(jobId)}><span className="job-card-icon">{job.icon}</span><div><strong>{job.name}</strong><small>{job.talent} · {job.passive}</small></div><b>{state.character.job === jobId ? '当前' : state.character.level >= 10 && state.character.gold >= 500 ? '500 ◉' : 'LV 10'}</b></button>; })}</div></div></div>}
        </section>

        <aside className="oracle-panel panel"><div className="oracle-orb">✦<span /></div><p className="eyebrow">小屋魔法灵 · 第 {Math.max(1, Math.floor(completedTasks.length / 5) + 1)} 层</p><h2>“今天也要<br /><em>打败拖延。</em>”</h2><div className="oracle-runes"><span className={openTasks.length ? 'lit' : ''}>◈</span><span className={completedTasks.length >= 3 ? 'lit' : ''}>✦</span><span className={completedTasks.length >= 10 ? 'lit' : ''}>♢</span></div><div className="speech-mark">“</div><p className="oracle-copy">完成 {completedTasks.length > 0 ? `了 ${completedTasks.length} 个悬赏，` : ''}现实里的小事，壁炉就会亮一点。</p><div className="oracle-quest"><span>下一道预言</span><strong>{completedTasks.length < 10 ? `再完成 ${10 - completedTasks.length} 个任务解锁瞌睡黑猫` : completedTasks.length < 25 ? `再完成 ${25 - completedTasks.length} 个任务唤醒火元素` : '地下城入口已经为你点亮'}</strong></div><div className="fireplace"><span>♨</span><i /><i /><i /></div><button className="ghost-button" onClick={() => setNotice('灵魂建议：先完成最小、最具体的那件事。')}>听取建议 <span>↗</span></button></aside>
      </section>

      <section className="recurrence-hub panel" aria-label="循环任务"><div className="recurrence-heading"><div><p className="eyebrow">REPEAT QUESTS</p><h2>循环任务控制台</h2></div><span>完成后自动生成下一期</span></div><div className="recurrence-controls"><label htmlFor="repeat-default">新任务默认重复</label><select id="repeat-default" value={repeatType} onChange={(event) => setRepeatType(event.target.value)}><option value="none">不重复</option><option value="daily">每天</option><option value="weekly">每周</option><option value="micro">微习惯 · 每小时</option></select><button onClick={() => { setRepeatType('none'); setModalOpen(true); }}>创建一次性任务</button><button onClick={() => { setRepeatType('daily'); setModalOpen(true); }}>创建每日任务</button></div>{microTasks.length > 0 && <div className="micro-habit-panel"><div><strong>今日微习惯</strong><small>高频任务不会打扰主任务墙</small></div><div className="micro-habit-list">{microTasks.map((task) => <article key={task.id}><span>{typeMeta[task.type]?.icon || '✦'}</span><div><strong>{task.content}</strong><small>下一次 · {formatRemaining(getTaskDeadline(task), now)}</small></div><button onClick={() => completeTask(task)}>完成</button></article>)}</div></div>}</section>
      <section className="schedule-hub panel" aria-label="冒险日程"><div className="schedule-heading"><div><p className="eyebrow">ADVENTURE SCHEDULE</p><h2>冒险日程表</h2></div><span>未来 7 天 · {scheduleTasks.length} 项安排</span></div>{scheduleTasks.length === 0 ? <div className="schedule-empty">未来七天没有待处理安排，去召唤一份新的悬赏吧。</div> : <div className="schedule-list">{scheduleTasks.map((task) => <article className={`schedule-item difficulty-${difficultyClass[task.difficulty] || 'normal'}`} key={task.id}><time>{new Date(getTaskDeadline(task)).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}<b>{new Date(getTaskDeadline(task)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</b></time><span>{typeMeta[task.type]?.icon || '✦'}</span><div><strong>{task.content}</strong><small>{task.type} · {task.difficulty}{task.repeatType && task.repeatType !== 'none' ? ` · ${task.repeatType === 'daily' ? '每天' : '每周'}` : ''}</small></div><em>{formatRemaining(getTaskDeadline(task), now)}</em></article>)}</div>}</section>
      <FutureTaskPreview tasks={futurePreviewTasks} anchorDate={listDate} onMoveToToday={moveTaskToListDate} onOpenDate={(date) => { setScheduleDate(date); setScheduleView('day'); }} />
      <ScheduleViews view={scheduleView} date={scheduleDate} tasks={calendarTasks} now={now} onViewChange={setScheduleView} onDateChange={setScheduleDate} onTaskClick={openTaskEditor} onSlotClick={openScheduleSlot} onDeleteTask={deleteTask} />
      <section className="progress-hub panel" aria-label="冒险进度">
        <div className="progress-hub-header"><div><p className="eyebrow">ADVENTURER'S ARCHIVE</p><h2>小屋成长档案</h2></div><span>连胜 {state.streak.current} 天 · 最佳 {state.streak.best} 天</span></div>
        <div className="continent-grid">{continentProgress.map((entry) => <div className="continent-progress" key={entry.type}><div><strong>{typeMeta[entry.type].icon} {entry.type}</strong><b>{entry.percent}%</b></div><i><em style={{ width: `${entry.percent}%` }} /></i><small>{entry.done}/{entry.total || 0} 已完成{entry.percent === 100 && entry.total > 0 ? ' · 通关奖励已点亮' : ''}</small></div>)}</div>
        <div className="archive-columns"><div><p className="section-label">成就徽章</p><div className="achievement-grid">{achievementItems.map((achievement) => <article className={`achievement-badge ${state.achievements.includes(achievement.id) || achievement.unlocked ? 'unlocked' : ''}`} key={achievement.id}><span>{achievement.icon}</span><div><strong>{achievement.name}</strong><small>{state.achievements.includes(achievement.id) || achievement.unlocked ? achievement.description : '尚未解锁'}</small></div></article>)}</div></div><div><p className="section-label">小屋布置</p><div className="furniture-scene">{state.furniture.placed.includes('hearth') && <span className="furniture hearth" title="壁炉">♨</span>}{state.furniture.placed.includes('desk') && <span className="furniture desk" title="冒险者书桌">▤</span>}{state.furniture.placed.includes('plant') && <span className="furniture plant" title="魔法盆栽">♣</span>}{state.furniture.placed.includes('banner') && <span className="furniture banner" title="任务旗帜">⚑</span>}</div><div className="furniture-controls">{[['hearth', '壁炉'], ['desk', '书桌'], ['plant', '盆栽'], ['banner', '旗帜']].map(([id, name]) => <button className={state.furniture.placed.includes(id) ? 'active' : ''} key={id} onClick={() => toggleFurniture(id)}>{name}</button>)}</div></div></div>
      </section>
      {completionEffect && <div className="completion-overlay" role="status" aria-live="polite"><div className="completion-burst"><span>✦</span><strong>悬赏完成</strong><small>{completionEffect.overdue ? '逾期补卡 · 奖励 80%' : `连胜 ${completionEffect.streak} 天`}</small><b>+{completionEffect.reward} ◉</b></div><div className="coin-stream" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index}>◉</i>)}</div></div>}
      {reminderBanner && <button className={`reminder-banner reminder-${reminderBanner.stage}`} onClick={() => { setExpandedTaskIds((current) => current.includes(reminderBanner.taskId) ? current : [...current, reminderBanner.taskId]); window.setTimeout(() => document.querySelector(`[data-task-id="${reminderBanner.taskId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); setReminderBanner(null); }}><span>{reminderBanner.monster.emoji}</span><div><strong>⚠️ 警报：{reminderBanner.monster.name}正在逼近！</strong><small>{reminderBanner.message}</small></div><b>立即挑战 →</b></button>}
      {oracleAdvice && <section className="oracle-advice" aria-label="魔法灵考虑"><div><p className="eyebrow">ORACLE'S THOUGHT</p><p>{oracleAdvice}</p></div><button onClick={() => setOracleAdvice('')} aria-label="收起魔法灵考虑">×</button></section>}
      <footer className="footer-bar"><span>小屋日志 · 第 01 日</span><span className="footer-tip">完成任务会获得对应属性成长</span><span>离线模式 / v0.1</span></footer>
      {notice && <button className="toast" onClick={() => setNotice('')}>✦ {notice}</button>}
      {isModalOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}><section className="spell-modal" role="dialog" aria-modal="true" aria-labelledby="spell-title"><button className="close-button" onClick={() => setModalOpen(false)} aria-label="关闭">×</button><div className="modal-rune"><RuneCanvas tone={typeMeta[preview.type].color === 'red' ? '#e36b5b' : '#7dd0c4'} /><span>✧</span></div><p className="eyebrow">RITUAL OF INTENTION</p><h2 id="spell-title">写下你的咒语</h2><p className="modal-intro">魔法灵会自动识别领域，也可以手动指定。</p><textarea autoFocus value={spell} onChange={(event) => setSpell(event.target.value)} placeholder="例如：完成产品方案，重要，今晚" /><label className="field-label" htmlFor="task-deadline">截止时间</label><input id="task-deadline" className="task-deadline-input" type="datetime-local" value={deadlineInput} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} onChange={(event) => setDeadlineInput(event.target.value)} /><div className="subtask-editor"><div className="field-label">子任务（可选）</div><div className="subtask-entry"><input value={subtaskDraft} onChange={(event) => setSubtaskDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addSubtaskDraft())} placeholder="例如：先列出三项要点" /><button type="button" onClick={addSubtaskDraft}>添加</button></div>{subtaskDrafts.length > 0 && <div className="subtask-draft-list">{subtaskDrafts.map((content, index) => <button type="button" key={`${content}-${index}`} onClick={() => setSubtaskDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{content} ×</button>)}</div>}</div><div className="task-type-picker" role="group" aria-label="任务领域"><span>任务领域</span><button className={!selectedTaskType ? 'active' : ''} onClick={() => setSelectedTaskType('')}>自动识别</button>{TASK_TYPES.map((taskType) => <button key={taskType} className={selectedTaskType === taskType ? 'active' : ''} onClick={() => setSelectedTaskType(taskType)}>{typeMeta[taskType].icon} {taskType}</button>)}</div><div className="parse-preview"><span>解析结果</span><b>{typeMeta[preview.type].icon} {preview.type}</b><b>{preview.difficulty}</b><strong>◉ {preview.reward} · {preview.exp} EXP</strong></div><button className="confirm-button" disabled={!spell.trim()} onClick={addTask}>刻下悬赏 <span>✦</span></button></section></div>}
    </main>
  );
}

export default App;