import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('冒险者可以召唤、完成并保留悬赏进度', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '冒险者小屋' })).toBeVisible();
  await expect(page.getByText('2 个待处理')).toBeVisible();

  await page.getByRole('button', { name: /召唤新的悬赏/ }).click();
  await page.getByRole('textbox').fill('学习 React 组件，重要，今晚完成');
  await expect(page.getByText('◈ 学习', { exact: true })).toBeVisible();
  await expect(page.getByText('困难', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /刻下悬赏/ }).click();

  await expect(page.getByText('3 个待处理')).toBeVisible();
  await expect(page.getByRole('heading', { name: '学习 React 组件，重要，今晚完成' })).toBeVisible();

  await page.getByRole('button', { name: '完成悬赏 →' }).first().click();
  await expect(page.getByText('2 个待处理')).toBeVisible();
  await expect(page.getByText(/经验值/)).toBeVisible();

  await page.reload();
  await expect(page.getByText('2 个待处理')).toBeVisible();
  await page.getByRole('button', { name: '黑市' }).click();
  await expect(page.getByRole('heading', { name: '小屋黑市' })).toBeVisible();
});

test('衣柜展示职业祭坛和三种职业天赋', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '打开衣柜' }).click();
  await expect(page.getByRole('heading', { name: '衣柜与转职祭坛' })).toBeVisible();
  await expect(page.getByRole('button', { name: /圣骑士.*坚如磐石/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /大魔导士.*魔力共鸣/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /游侠.*风行者/ })).toBeVisible();
  expect(await page.getByText('LV 10', { exact: true }).count()).toBeGreaterThan(0);
});

test('角色栏展示当前职业缩略图标签', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('🛡️ 圣骑士', { exact: true })).toBeVisible();
  await expect(page.locator('.character-avatar')).toHaveClass(/avatar-large/);
});

test('游侠任务显示截止预警延长一小时', async ({ page }) => {
  await page.goto('/');
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = { ...(state.character || {}), job: 'ranger', jobLevel: 1, buffs: ['looter'] };
    state.status = { ...(state.status || {}), maxStamina: 20, stamina: 10 };
    state.tasks = [{ id: 'ranger-task', content: '设计一个新徽章', type: '创意', difficulty: '普通', reward: 25, exp: 16, staminaCost: 1, warningExtensionHours: 1, status: 'open', createdAt: Date.now() }];
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByText(/预警 \+1 小时/)).toBeVisible();
  await expect(page.getByText('🌲 游侠', { exact: true })).toBeVisible();
});

test('黑市提供抽奖并应用大魔导士九折', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = { ...(state.character || {}), job: 'mage', jobLevel: 1, buffs: ['alchemy'], gold: 100 };
    state.status = { ...(state.status || {}), stamina: 10, maxStamina: 20 };
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.goto('/');
  await page.getByRole('button', { name: '黑市' }).click();
  await expect(page.getByRole('heading', { name: '小屋黑市' })).toBeVisible();
  await expect(page.getByText(/大魔导士享受商品 8 折，抽奖 9 折/)).toBeVisible();
  await expect(page.getByRole('button', { name: '45 ◉' })).toBeVisible();
  await expect(page.getByText(/已抽 0 次 · 保底 0\/10/)).toBeVisible();
  await page.getByRole('button', { name: '45 ◉' }).click();
  await expect(page.getByText(/已抽 1 次 · 保底/)).toBeVisible();
});

test('装备饰品后真实增加角色属性', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = { ...(state.character || {}), job: 'ranger', jobLevel: 1, buffs: ['looter'] };
    state.status = { ...(state.status || {}), stamina: 10, maxStamina: 20 };
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.inventory = [...new Set([...(state.inventory || []), 'moon-ring'])];
    state.equipment = { ...(state.equipment || {}), accessory: null };
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.goto('/');
  await expect(page.getByText('DEX').locator('..').getByText('5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '💍' }).click();
  await expect(page.getByText('月光敏捷戒指 · DEX +3')).toBeVisible();
  await expect(page.getByText('DEX').locator('..').getByText('8', { exact: true })).toBeVisible();
});

test('独立抽奖记录面板展示历史结果', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = state.character || {};
    state.status = { ...(state.status || {}), stamina: 10, maxStamina: 20 };
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.raffle = { draws: 2, pity: 1, history: [{ id: 'moon-ring', name: '月光敏捷戒指', icon: '💍', rarity: '稀有', duplicate: true, timestamp: Date.now() }] };
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.goto('/');
  await page.getByRole('button', { name: '抽奖记录' }).click();
  await expect(page.getByRole('heading', { name: '抽奖记录' })).toBeVisible();
  await expect(page.getByText('已抽 2 次')).toBeVisible();
  await expect(page.getByText('重复转化 +20 金币')).toBeVisible();
});

test('宠物角展示初始史莱姆并支持互动', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '互动 绿史莱姆' })).toBeVisible();
  await page.getByRole('button', { name: '互动 绿史莱姆' }).click({ force: true });
  await expect(page.getByText('绿史莱姆：今天也要一起冒险！')).toBeVisible();
  await expect(page.getByRole('button', { name: '互动 绿史莱姆' }).locator('.pet-icon')).toHaveText('🟢');
});

test('衣橱和黑市使用指定 SVG 图标', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '打开衣柜' }).locator('img')).toHaveAttribute('src', '/icons/wardrobe.svg');
  await expect(page.getByRole('button', { name: /黑市/ }).locator('img')).toHaveAttribute('src', '/icons/shopping.svg');
});

test('宠物可以通过完成任务里程碑解锁', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = { ...(state.character || {}), level: 1, gold: 9999 };
    state.status = { ...(state.status || {}), stamina: 10, maxStamina: 20 };
    state.pets = ['slime_green'];
    state.activePet = 'slime_green';
    state.tasks = Array.from({ length: 9 }, (_, index) => ({ id: `done-${index}`, content: `已完成任务 ${index}`, type: '工作', difficulty: '普通', reward: 10, exp: 5, status: 'done', createdAt: Date.now() - index * 1000 })).concat([{ id: 'milestone-task', content: '完成第十个任务', type: '工作', difficulty: '普通', reward: 10, exp: 5, staminaCost: 1, status: 'open', createdAt: Date.now(), deadlineAt: Date.now() + 86400000 }]);
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.goto('/');
  await page.getByRole('button', { name: '完成悬赏 →' }).click();
  await expect(page.getByText('🐈‍⬛')).toBeVisible();
});

test('等级展示使用火柴人素体并实时叠加装备', async ({ page }) => {
  await page.addInitScript(() => {
    const state = JSON.parse(localStorage.getItem('adventurer-hut-state') || '{}');
    state.character = { ...(state.character || {}), job: 'paladin' };
    state.status = { ...(state.status || {}), stamina: 10, maxStamina: 30 };
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.inventory = [...new Set([...(state.inventory || []), 'moon-ring'])];
    state.equipment = { ...(state.equipment || {}), accessory: null, hand: null, accessories: { ...(state.equipment?.accessories || {}), hand: null } };
    localStorage.setItem('adventurer-hut-state', JSON.stringify(state));
  });
  await page.goto('/');
  await expect(page.locator('.stick-figure')).toBeVisible();
  await page.getByRole('button', { name: '💍' }).click();
  await expect(page.locator('.avatar-item-hand')).toHaveText('💍');
});

test('测试模式可以注入满资源和过期任务场景', async ({ page }) => {
  await page.goto('/?testMode=1');
  await expect(page.getByRole('region', { name: '测试工具' })).toBeVisible();
  await page.getByRole('button', { name: '满资源' }).click();
  await expect(page.getByText('9999', { exact: true })).toBeVisible();
  await expect(page.getByText('LV 20', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '过期任务' }).click();
  await expect(page.getByRole('heading', { name: '测试：已过期悬赏' })).toBeVisible();
  await expect(page.getByRole('button', { name: '已过期 →' })).toBeVisible();
});

test('四个饰品槽可以同时装备且同槽位互斥', async ({ page }) => {
  await page.goto('/?testMode=1');
  await page.getByRole('button', { name: '满资源' }).click();
  await page.locator('button[title*="head"]').first().click();
  await page.locator('button[title*="back"]').first().click();
  await page.locator('button[title*="face"]').first().click();
  await page.locator('button[title*="hand"]').first().click();
  await expect(page.getByText('4/4', { exact: true })).toBeVisible();
  await page.locator('button[title*="back"]').nth(1).click();
  await expect(page.getByText('4/4', { exact: true })).toBeVisible();
});

test('逐级升级预设只补满金币并保留初始等级', async ({ page }) => {
  await page.goto('/?testMode=1');
  await expect(page.getByText('LV 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '逐级升级' }).click();
  await expect(page.getByText('9999', { exact: true })).toBeVisible();
  await expect(page.getByText('LV 1', { exact: true })).toBeVisible();
  await expect(page.getByText('测试预设已应用：逐级升级，仅满金币')).toBeVisible();
});

test('升一级预设每点击一次只增加一级', async ({ page }) => {
  await page.goto('/?testMode=1');
  await expect(page.getByText('LV 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '升一级', exact: true }).click();
  await expect(page.getByText('LV 2', { exact: true })).toBeVisible();
  await expect(page.getByText('0 / 200', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '升一级', exact: true }).click();
  await expect(page.getByText('LV 3', { exact: true })).toBeVisible();
  await expect(page.getByText('9999', { exact: true })).toBeVisible();
  await expect(page.getByText('测试预设已应用：升一级')).toBeVisible();
});