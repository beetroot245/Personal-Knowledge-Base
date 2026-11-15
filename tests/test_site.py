"""從儲存庫根目錄執行：python3 tests/test_site.py。"""
import functools
import os
import http.server
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, Error

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT.parent)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}/{ROOT.name}/'
checks = 0

def check(condition, message):
    global checks
    assert condition, message
    checks += 1
    print(f'PASS {checks}: {message}')

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE_PATH') or None)
        page = browser.new_page(viewport={'width': 1440, 'height': 1100})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.goto(base)
        page.wait_for_selector('.note-card')
        notes = page.evaluate('window.KB_NOTES')
        check(len(notes) >= 1 and len({n['id'] for n in notes}) == len(notes), '筆記存在且 id 唯一')
        import re
        from datetime import date
        for note in notes:
            assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', note['id'])
            assert note['category'] in ['學習方法', '數位工具', '知識管理', '生活思考']
            assert isinstance(note['minutes'], int) and note['minutes'] > 0
            date.fromisoformat(note['updated'])
            assert all(isinstance(note[key], str) and note[key].strip() for key in ['title', 'summary'])
            assert note['tags'] and all(isinstance(tag, str) for tag in note['tags'])
            assert len(note['sections']) >= 2
            for section in note['sections']:
                assert section['heading'] and section['paragraphs']
                assert all(isinstance(text, str) and text.strip() for text in section['paragraphs'])
        check(True, '所有筆記符合 AGENTS.md 資料格式')
        check(page.locator('.note-card').count() == len(notes), '首頁顯示所有卡片')
        page.locator('#search').fill('費曼')
        check(page.locator('.note-card').count() == 1, '標題搜尋')
        page.locator('#search').fill('Dunlosky')
        check(page.locator('.note-card').count() == 1 and '間隔複習' in page.locator('.note-card h3').inner_text(), '內文搜尋')
        page.locator('#search').fill('沒有這個關鍵字XYZ')
        check(page.locator('#empty-state').is_visible() and page.locator('.note-card').count() == 0, '搜尋無結果狀態')
        page.locator('#reset-filters').click()
        page.locator('[data-filter="知識管理"]').click()
        check(page.locator('.note-card').count() == 3 and set(page.locator('.card-top .category-badge').all_text_contents()) == {'知識管理'}, '主題篩選及數量')
        page.locator('[data-filter="all"]').click()
        page.locator('#sort').select_option('minutes')
        expected = sorted(notes, key=lambda n: (n['minutes'], -int(n['updated'].replace('-', ''))))
        check(page.locator('.note-card h3').all_text_contents() == [n['title'] for n in expected], '閱讀時間排序')
        page.locator('#sort').select_option('title')
        expected_titles = page.evaluate('window.KB_NOTES.map(n=>n.title).sort((a,b)=>a.localeCompare(b,"zh-Hant"))')
        check(page.locator('.note-card h3').all_text_contents() == expected_titles, '標題排序')
        page.locator('#sort').select_option('updated')
        check(page.locator('.note-card h3').all_text_contents() == [n['title'] for n in sorted(notes, key=lambda n: n['updated'], reverse=True)], '日期排序')
        page.locator('.favorite-button').first.click()
        page.reload()
        check(page.locator('.favorite-button[aria-pressed="true"]').count() == 1, '收藏重載後保留')
        page.locator('[data-view="favorites"]').click()
        check(page.locator('.note-card').count() == 1, '我的收藏檢視')
        page.locator('.favorite-button').click()
        check(page.locator('#empty-state').is_visible(), '取消最後一則收藏顯示引導')
        page.locator('#reset-filters').click()
        page.locator('.note-card h3 a').first.click()
        page.locator('#note-dialog').wait_for(state='visible')
        check(page.locator('#note-dialog').is_visible() and page.locator('.note-section').count() >= 2, '開啟完整筆記')
        deep_link = page.url
        page.locator('#dialog-favorite').click()
        check(page.locator('#dialog-favorite').get_attribute('aria-pressed') == 'true', '閱讀視窗收藏')
        page.keyboard.press('Escape')
        page.wait_for_function('!document.querySelector("#note-dialog").open && !location.hash.startsWith("#note=")')
        check(not page.locator('#note-dialog').is_visible() and '#note=' not in page.url, 'Escape 關閉及清理網址')
        page.goto(deep_link)
        check(page.locator('#note-dialog').is_visible(), '深層網址直接閱讀')
        page.locator('#close-note').click()
        page.keyboard.press('/')
        check(page.locator('#search').evaluate('(node)=>node === document.activeElement'), '鍵盤搜尋捷徑')
        page.locator('#search').fill('<img src=x onerror=alert(1)>')
        check(page.locator('#empty-state').is_visible(), '搜尋特殊字元安全處理')
        page.locator('#reset-filters').click()
        for width in [1440, 768, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 900})
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}px 版面沒有橫向溢出')
        page.screenshot(path='/tmp/knowledge-base-mobile.png', full_page=True)
        page.set_viewport_size({'width': 1440, 'height': 1100})
        page.screenshot(path='/tmp/knowledge-base-desktop.png', full_page=True)
        check(not errors, f'HTTP 專案子路徑瀏覽沒有瀏覽器錯誤：{errors}')
        # 某些受管理的 Chromium 禁止 file://；明確區別環境限制與功能失敗。
        file_page = browser.new_page()
        try:
            file_page.goto((ROOT / 'index.html').as_uri())
            check(file_page.locator('.note-card').count() == len(notes), 'file:// 直接開啟可用')
            file_page.locator('.note-card h3 a').first.click()
            file_page.locator('#note-dialog').wait_for(state='visible')
            check(file_page.locator('#note-dialog').is_visible(), 'file:// 閱讀筆記可用')
        except Error as error:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(error):
                raise
            print('SKIP: file:// 直接開啟與閱讀（瀏覽器管理政策禁止；HTTP 功能已驗證）')
        browser.close()
    print(f'\n{checks} checks passed.')
finally:
    server.shutdown()
    server.server_close()
