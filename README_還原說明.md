# Cloudflare 每日分享平台｜程式備份

備份日期：2026-11-16
對應 GitHub：dw5000tw-33/DChurch（當時 main 版本）

本壓縮備份包含 3 個實際使用中的 Cloudflare Workers **原始碼及 binding 名稱設定**：

1. `thll-remote-ping-test`：接受 READ_PAGE 指令，保存 B 電腦擴充功能回傳的結果。使用 Durable Object `RELAY`，類別 `Relay`。
2. `thll-daily-share-remote-bridge`：公開前台的轉接層；Service Binding `REMOTE` 指向 `thll-remote-ping-test`。
3. `thll-daily-share-source-test`：荒漠甘泉、每日天糧、每日讀經日期查詢。D1 Binding `READING_DB` 指向既有 `priest-roster-db`。

每個 Worker 的 `index.js` 是 API 取得的當時部署原始碼；`bindings.json` 是設定摘要（只保留 binding 名稱、類型與必要識別碼）。

## 非包含項目 — 請注意

- 不包含 ADMIN_TOKEN、DEVICE_TOKEN、管理密碼、LINE Token 等金鑰**值**。Cloudflare secrets 只能重新設定，請在自己的密碼管理工具保存，不要寫入公開 GitHub。
- 不包含 Durable Object `Relay` 已儲存的命令和回傳歷史；需要重建 namespace 和 Durable Object migration。
- 不包含 `priest-roster-db` (D1) 的資料內容。日期查詢依賴現有 DB，重建環境時需另外備份／還原資料庫。
- 不包含正式教會後台 `thll-priest-roster` 的完整 Worker 原始碼；本次只備份分享平台新增使用的三個 Worker。
- 不包含 B 電腦 Chrome 擴充功能原始碼；B 電腦版本另行備份 `C:\Users\dw500\Documents\Codex\B_Chrome_Reader_V0.3.1`。

## 還原次序（請先在測試環境演練）

1. 匯入 `thll-remote-ping-test/index.js`。建立 Durable Object `Relay`（SQLite，原使用 migration tag `v1`），binding 名稱 `RELAY`。設定 `ADMIN_TOKEN` 與 `DEVICE_TOKEN` secret。
2. 匯入 `thll-daily-share-remote-bridge/index.js`，設定 Service Binding `REMOTE` 指向第一個 Worker。
3. 匯入 `thll-daily-share-source-test/index.js`，設定 D1 Binding `READING_DB` 指向正確的資料庫；請先驗證讀經資料仍存在。
4. 確認 Workers.dev 路徑與 DChurch 前台 `daily-share/index.html` 裡使用的網址相符。
5. 在 B 電腦測試 `READ_PAGE`、來源查證、三篇禱告與東海靈糧堂顯示，最後確認公開網頁三個日期來源與 LINE 複製。
6. 不要直接覆蓋正式 `thll-priest-roster`，亦不要將金鑰貼到 GitHub。

## 專案連結

- DChurch：https://github.com/dw5000tw-33/DChurch
- 分享平台：https://dw5000tw-33.github.io/DChurch/daily-share/index.html
- 遠端 Worker：https://thll-remote-ping-test.dw5000-tw.workers.dev/
- 日期來源 Worker：https://thll-daily-share-source-test.dw5000-tw.workers.dev/
- 轉接 Worker：https://thll-daily-share-remote-bridge.dw5000-tw.workers.dev/

本檔案為程式及設定備份，不等於完整環境／資料庫災難復原備份。
