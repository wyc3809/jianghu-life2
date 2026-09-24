# Product separation — 江湖一生 vs WorthBook

江湖一生原本同 WorthBook（淨資產 PWA）共用 `wyc3809/App`。分拆後：

| Product | Repo | Canonical branch | Live URL |
|---------|------|------------------|----------|
| 江湖一生（Vite + React） | `wyc3809/jianghu-life2`（本 repo） | `main` | https://wyc3809.github.io/jianghu-life2/ |
| WorthBook（Next.js） | `wyc3809/App` | `main` | https://wyc3809.github.io/App/worthtracker/ |

## Rules

1. 本 repo 只有江湖一生；`main` 就係遊戲主線，功能分支 PR 合併入 `main`。
2. 唔好將 WorthBook 原始碼搬入嚟，反之亦然。
3. 部署：合併到 `main` 後 GitHub Actions 自動發佈（`.github/workflows/deploy-pages.yml` → `gh-pages`，base `/jianghu-life2/`）。
