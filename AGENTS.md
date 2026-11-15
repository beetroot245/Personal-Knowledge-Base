# 個人知識庫：給 AI 與協作者的工作規則

## 目的
把零散的學習整理成可搜尋、可回顧、可延伸的繁體中文知識筆記。讀者應能從首頁找到主題、閱讀完整筆記，並收藏常用內容。範例筆記是教學示範，不代表站主的個人經歷。

## 技術與檔案結構
- 純 HTML、CSS、JavaScript 靜態網站；不使用框架、建置工具、CDN 或後端。
- `index.html`：網站骨架、導覽與筆記閱讀視窗。
- `assets/styles.css`：色彩、版面、響應式設計。
- `assets/app.js`：搜尋、分類、排序、收藏及筆記閱讀互動。
- `content/notes.js`：唯一的筆記資料來源，使用 `window.KB_NOTES` 陣列。
- `templates/note-template.js`：新增筆記的格式範本，不直接載入網站。
- `tests/test_site.py`：Playwright 瀏覽器功能測試。
- `.github/workflows/pages.yml`：GitHub Pages 自動部署。
- 檔名採小寫 kebab-case，所有網站資源使用相對路徑，支援 GitHub Pages 專案子路徑及直接開啟 index.html。

## 視覺與內容風格
- 繁體中文為主；溫暖米白背景、墨綠重點色、細框線及編輯式留白。
- 使用系統字型，不依賴外部字型或圖片；避免裝飾性漸層與大量動畫。
- 桌面為側欄與三欄卡片；平板雙欄、手機單欄，320px 寬度不出現橫向捲動。
- 筆記以清楚、可實作的語句呈現。不要捏造引用、研究結果、站主經歷或個資。
- 新增功能須保留現有搜尋、分類、收藏、排序與深層連結。

## 新增筆記的固定流程
1. 讀取本檔與 `templates/note-template.js`。
2. 將一筆完整資料加入 `content/notes.js`；不要複製整頁 HTML。
3. `id` 必須是唯一的英文 kebab-case，發布後保持穩定，因為網址使用 `#note=<id>`。
4. 必填：`id`、`title`、`category`、`summary`、`tags`、`updated`、`minutes`、`sections`。
5. 分類使用「學習方法」「數位工具」「知識管理」「生活思考」。若要新分類，同步修改首頁的分類按鈕及測試。
6. 日期使用真實編輯日期 `YYYY-MM-DD`，`minutes` 為正整數、約略閱讀時間；摘要約 30–70 個中文字。
7. `sections` 每節有 `heading` 與非空的 `paragraphs` 字串陣列；可有 `items` 字串陣列。至少兩節，包含概念與可實作步驟。
8. 內容一律是純文字。前端使用 `textContent` 建立節點，禁止將筆記資料插入 `innerHTML`、禁止 `eval`。
9. 若引用外部資料，在內文標明可查證的出處；不確定的資訊應明確註記或略去。

## 開發與驗證
- 直接開啟 `index.html`，或於儲存庫根目錄執行 `python3 -m http.server 8000`。
- 每個雲端任務已隔離；使用現有 checkout，除非使用者要求，不要建立 Git worktree。
- 變更前後檢查 `git status`，保留他人修改；不要提交憑證、套件快取、測試截圖或個資。
- JavaScript 語法檢查：`node --check assets/app.js` 與 `node --check content/notes.js`。
- 瀏覽器測試：安裝 Python Playwright 與 Chromium 後，在根目錄執行 `python3 tests/test_site.py`。測試自行啟動暫時 HTTP 伺服器。
- 驗證搜尋、無結果、分類、排序、收藏持久化、筆記深層連結、Escape 關閉、手機版面與主控台錯誤。
- 可互動元件使用原生 button/input/select/dialog，提供標籤、鍵盤焦點、適當對比；搜尋結果數量使用 aria-live。
- 不要為單純新增內容導入新依賴。若改資料格式，必須同步更新範本、README、驗證程式及既有內容。

## 發布
推送 main 後由 GitHub Actions 部署 GitHub Pages；GitHub Settings → Pages → Source 必須選擇 GitHub Actions。沒有權限或部署失敗時，據實說明阻擋原因，不把預期網址當成已發布成果。
