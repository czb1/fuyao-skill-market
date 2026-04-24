# Vue 3 + Vite + TypeScript（最小可用脚手架）设计

日期：2026-04-24

## 目标

在空目录中搭建一套可直接运行的前端工程骨架，满足：

- 开箱可运行：`npm install` 后可 `npm run dev`
- 技术栈固定：Vue 3 + Vite + TypeScript
- 规范可落地：ESLint + Prettier
- 符合约束：
  - `if/for/do/while` 等语句执行体必须使用 `{}`（通过 ESLint `curly: ["error", "all"]` 强制）
  - `.js/.ts/.vue` 中对象与数组等多行结构使用拖尾逗号（通过 Prettier `trailingComma: "all"` 强制）

非目标（本阶段不做）：

- 不引入 `vue-router` / `pinia`
- 不加入 `husky` / `lint-staged` / `commitlint`

## 工程形态

### 工具与版本

- Node：使用当前环境可用版本（已探测到 Node 22.x 可用）
- 包管理器：npm（不依赖 pnpm）

### 目录结构（最小但可扩展）

- `index.html`
- `vite.config.ts`
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`（按 Vite 官方模板）
- `src/`
  - `main.ts`
  - `App.vue`
  - `assets/`（示例资源）
  - `style.css`（全局样式）

## 依赖与脚本

### 生产依赖

- `vue`

### 开发依赖

- `vite`、`@vitejs/plugin-vue`
- `typescript`、`vue-tsc`
- `eslint`、`eslint-plugin-vue`（以及与 TS 相关的 eslint 支持）
- `prettier`、`eslint-config-prettier`（避免规则冲突）

### npm scripts

- `dev`：启动本地开发服务器
- `build`：类型检查 + 生产构建
- `preview`：本地预览构建产物
- `lint`：ESLint 检查
- `format`：Prettier 格式化

## 代码规范落地策略

### ESLint

- 强制大括号：`curly: ["error", "all"]`
- Vue + TypeScript 常规规则启用（以官方推荐为主，避免过度定制）

### Prettier

- 拖尾逗号：`trailingComma: "all"`
- 与 ESLint 协同：通过 `eslint-config-prettier` 关闭与 Prettier 冲突的 ESLint 风格规则

## 验收标准

- `npm install` 成功
- `npm run dev` 可启动并打开默认页面
- `npm run build` 成功产出
- `npm run lint`、`npm run format` 可运行
- 当代码出现不带 `{}` 的控制语句体时，ESLint 能报错
- 当对象/数组等多行结构未使用拖尾逗号时，Prettier 会格式化为带拖尾逗号
