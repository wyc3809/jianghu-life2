# 雲端（Supabase）開通步驟

做完以下步驟，重新部署後遊戲就會有雲端存檔、換機同步同江湖榜。未設定之前，遊戲照常運作（雲端功能自動收埋）。

## 1. 開 Supabase 專案

1. 去 <https://supabase.com> 註冊（可用 GitHub 登入）→ **New project**。
2. 名：`jianghu-life`；Region 揀近你嘅（例如 Singapore / Tokyo）；密碼自己記低。

## 2. 開登入方式

Dashboard → **Authentication** → **Sign In / Providers**：

- 開 **Allow anonymous sign-ins**
- **Email** 保持開啟（綁定同換機登入用）

Dashboard → **Authentication** → **URL Configuration**：

- **Site URL**：`https://wyc3809.github.io/jianghu-life2/`
- **Redirect URLs** 加：`https://wyc3809.github.io/jianghu-life2/**`

## 3. 建資料表

Dashboard → **SQL Editor** → New query → 開 [schema.sql](../supabase/schema.sql)，撳 **Raw**，複製全部內容並貼上 → **Run**。

## 4. 攞公開 URL 同 key

Dashboard → **Project Settings** → **API**（或 **Data API**）：

- **Project URL**（例如 `https://abcd1234.supabase.co`）
- **API Keys** 頁面嘅 **publishable key**（`sb_publishable_...`），或者 **Legacy API Keys** 入面嘅 **anon public** key（`eyJ...`）。兩種都可以。

> ⚠️ 唔好用 `service_role` key——嗰條係管理員鎖匙，絕對唔可以放入網頁。

## 5. 放入 GitHub

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **Variables** 分頁 → **New repository variable**：

| Name | Value |
|------|-------|
| `SUPABASE_URL` | 第 4 步嘅 Project URL |
| `SUPABASE_ANON_KEY` | 第 4 步嘅 publishable／anon public key |

## 6. 重新部署

GitHub → **Actions** → **Deploy to GitHub Pages** → **Run workflow**（必須重新 build，單改 Variables 唔會更新已上線版本）。

## 本機開發

喺 repo 根目錄開 `.env.local`（已被 git 忽略）：

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

冇雲端都想睇排行榜畫面：`npm run dev` 後開 `http://localhost:5173/?cloudDemo=1`（示範數據，只限 dev）。

## 7. 驗證

等 Pages workflow 同部署完成後，重新開遊戲 → 設定 → 雲端。確認有匿名身份，再綁定電郵並完成確認；用另一個瀏覽器登入相同電郵，檢查人生同祖蔭有還原。唔好喺綁定成功前清除原有瀏覽器資料。

如果 SQL 報錯、頁面顯示登入失敗，記低錯誤文字再處理。新專案嘅實際登入、RLS 同換機流程需要專案開通後先可以驗證。
