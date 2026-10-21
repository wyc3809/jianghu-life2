# 第32項：非同步共用江湖

玩家更正唔需要房間、唔使雙方同時在線。本批使用真Supabase Auth、Edge及Postgres，冇模擬戰果回覆。

- `api-report.json`：三個真身份全部可直接入籍同一世界，第三人唔能讀非本人完整戰報，三表／RPC瀏覽器拒絕、前端篡改拒絕、離線防守、同一戰果、重送只一場、排名按真winner、其他人不變、全員離線62秒後收益及領取一次入帳。
- `browser-report.json`：三個獨立身份，390×844 DPR2。乙先入籍再離線關頁，甲之後先入籍挑戰；甲離場後乙另時重開，同一戰果及角色仍在，完全唔需雙方同時在線。第三人直接入場、遺失已處理挑戰回覆後收據恢復、卷六大河落日、重播／重開、320／390／420無溢出／44px主要觸控、pageerror0。
- `comparison.jpg`、`landing.png`：移除開房邀請，直接入籍。
- `offline-list.png`、`volume-six.png`、`result.png`、`return-later.png`、`phone-*.png`：離線名單、真逐招、戰果、不同時間返場及手機。
- `asynchronous.mp4`、`replay.gif`：正常速度操作／演出，GIF節錄25–34秒。
- `game-before-after.jpg`、`game-jianghu.png`：正常江湖頁，seed42、free600／paidTest0；改前沿用EA0.80.0留底。
- `tests.txt`／`build.txt`／`narrate.txt`：96檔698測試、Pages build含tsc及narrate hard-fail0。
- `backend.json`：實際Edge版本、migration、RLS及表／RPC前端權限驗證。

首次瀏覽器run遇到舊dev server已停止（ERR_CONNECTION_REFUSED），重開dev後完整重跑通過；唔當產品故障，亦冇以未完成run充數。原始session／key只喺ignored目錄，報告唔含JWT／API key。

當前presence只計江湖試場頁，並非全遊戲各頁；100人封測保護上限未當容量保證。未當iPhone真機、60fps、幫會／門派戰或完整MMO驗收。
