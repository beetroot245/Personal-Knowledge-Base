# 拾知 · Personal Knowledge Base

一個以繁體中文打造的個人知識庫，把學習、工具與生活的想法整理成可以再次使用的筆記。這是「建立自己的 AGENTS.md」課堂專案：規則先行，內容與網站依照同一套方式持續擴充。

## 專案成果

- `index.html`：可直接瀏覽的靜態網站，米白與墨綠的知識花園風格。
- 9 則完整示範筆記、4 個主題；範例不代表站主的經歷或個人資料。
- 全文搜尋（含筆記內文）、主題篩選、最近更新／標題／閱讀時間排序。
- 收藏筆記，儲存於當前瀏覽器 localStorage；不會跨裝置同步。若瀏覽器禁止儲存，仍可在當次瀏覽使用。
- 點開卡片閱讀完整筆記；支援 `#note=build-a-second-brain` 等可分享網址。
- 響應式版面、鍵盤操作、原生對話框與焦點管理；按 `/` 搜尋、`Escape` 關閉筆記。
- 無執行階段套件、外部字型、追蹤工具或付費服務。

## 專案規則

先閱讀 [AGENTS.md](AGENTS.md)。它定義專案目的、視覺、資料格式、檔案位置、AI 修改規則、驗證及發布流程。AI 或人類協作者都使用同一套規範。

## 本機預覽

直接用現代瀏覽器開啟 `index.html`，或在儲存庫根目錄執行：

```sh
python3 -m http.server 8000
```

再開啟 `http://localhost:8000`。不需要 npm install 或建置；停止時按 Ctrl+C。

## 新增筆記

1. 閱讀 `AGENTS.md`，複製 `templates/note-template.js` 的物件。
2. 填入唯一英文 kebab-case `id`、標題、分類、摘要、標籤、日期、閱讀分鐘與至少兩節完整內文。
3. 加入 `content/notes.js` 的 `window.KB_NOTES` 陣列。
4. 執行語法與瀏覽器測試，確認新筆記出現在首頁、搜尋與對話框。
5. 提交並推送至 main。首頁卡片與分類數量會自動更新，不必複製頁面。

例如可以告訴 AI：「先讀 AGENTS.md，依範本新增一則主題為『閱讀筆記』的知識管理筆記，保留現有功能並執行測試。」

## 檔案結構

```text
AGENTS.md                  AI 與協作者的規則
index.html                 首頁與閱讀視窗
assets/app.js              網站互動
assets/styles.css          響應式視覺
assets/favicon.svg         網站圖示
content/notes.js            筆記唯一資料來源
templates/note-template.js  新增內容範本
tests/test_site.py          功能與資料驗證
.github/workflows/pages.yml 自動部署
```

## 驗證

```sh
node --check assets/app.js
node --check content/notes.js
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_site.py
```

若環境已有 Chromium，可改用 `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium python3 tests/test_site.py`，不需另外下載瀏覽器。

Playwright 僅供開發驗證，網站本身不依賴它。測試會啟動並清理暫時的 HTTP 伺服器，驗證筆記格式、搜尋、分類、排序、收藏與重載、完整閱讀與深層連結、鍵盤操作、320px 手機版面及瀏覽器錯誤。Linux 若缺少 Chromium 系統函式庫，使用具有系統套件安裝權限的環境執行 `python3 -m playwright install --with-deps chromium`。

## GitHub Pages 發布

儲存庫：https://github.com/beetroot245/Personal-Knowledge-Base

預期發布位置：https://beetroot245.github.io/Personal-Knowledge-Base/

此網址只有在 Pages 設定與部署成功後才可瀏覽，不代表目前已發布。

1. 將專案推送至 GitHub 的 `main` 分支。
2. 在儲存庫 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
3. 到 **Actions → Deploy knowledge base to GitHub Pages** 執行 Run workflow，或推送下一次更新。
4. 等待部署成功，從 Settings → Pages 開啟實際網站。

工作流程只發布 `index.html`、`assets/`、`content/`；不把測試、規則或其他儲存庫檔案混入網站產物。網站使用相對路徑，支援 GitHub Pages 的專案子路徑。若未啟用 Pages、沒有儲存庫寫入權限，或帳號方案不允許目前私有儲存庫發布，需由擁有者調整設定；不要把私密內容加入公開網站。
