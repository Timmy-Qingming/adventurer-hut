# AIO 冒险者小屋

轻量化的本地任务管理 RPG 原型。

## 本地运行

```powershell
npm install
npm run dev
```

## 生产构建

```powershell
npm run build
npm run preview
```

## 浏览器测试

```powershell
npm run test:e2e
```

测试会自动启动 Vite，并使用 Chromium 验证召唤悬赏、解析、完成、刷新持久化和黑市导航。

静态部署到子路径时设置 `BASE_PATH`，例如 GitHub Pages：

```powershell
$env:BASE_PATH = '/vibe-coding-scaffold/'
npm run build
```

## 当前能力

- 魔法咒语解析与悬赏任务流
- LocalStorage 存档
- 经验、等级、金币、属性和体力成长
- 黑市、体力药水、武器库存和衣柜
- 称号解锁、每日恢复和冒险日志
- Canvas 符文和 Web Audio API 音效

数据只保存在当前浏览器，不包含账号或后端同步。
