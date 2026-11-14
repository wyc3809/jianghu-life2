# 兵器圖實畫檢查 · EA0.108.0

before-after.jpg對比正式EA0.107.0七類通用圖與本輪獨有圖；full-contact.jpg列30件，native-contact.jpg以58px檢視。兩份接觸表及列表、詳情、短屏新裝備、真正3D開箱卡面與二維後備均已檢視。

checkRareWeaponArt.py使用隔離存檔、封鎖雲端，Chromium 390×844、320×568、430×932。browser.json記錄63張實際載入、30張獨有Canvas hash及512尺寸／透明邊緣、33張通用類型對應；共8組流程通過。確認選中裝備詳情先顯示該件圖，取消不換裝；普通／對戰裝備分開保存及重開保留；資源、背包、RNG不因瀏覽或領取演出重複改動。

獲得新裝備展示新舊兩件圖；初次320短屏測試發現按鈕被擠走，已改內容捲動、底部按鈕常見，再跑三尺寸通過。new-gear-320-before-fit.jpg保留修正前負例。3D開箱讀真正lootConfig；強制無WebGL仍顯示同件神兵，loot-fallback-320.jpg已先關掉離線領受彈窗，沒有遮住器物。

完整139檔1,025項測試、Pages構建及敘事hard-fail 0／文案禁句0處通過。assets-qa.json為30張來源尺寸與透明守門。沒有真iPhone／TestFlight驗收結論。EA0.108.0按玩家一般發布授權上線，遠端結果以PR及Pages紀錄為準。
