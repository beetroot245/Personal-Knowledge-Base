(() => {
  'use strict';
  const notes = window.KB_NOTES;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const storageKey = 'shizhi-favorites-v1';
  let favorites;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    favorites = new Set(Array.isArray(stored) ? stored.filter(id => notes.some(note => note.id === id)) : []);
  } catch { favorites = new Set(); }
  let view = 'all';
  let category = 'all';
  let activeNote = null;
  let previousFocus = null;
  const dialog = $('#note-dialog');

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch { /* 收藏仍可在本次瀏覽使用。 */ }
    // 更新現有按鈕以保留鍵盤焦點；收藏檢視移除卡片後，將焦點移到結果標題。
    const focused = document.activeElement;
    const removesFocusedCard = view === 'favorites' && !favorites.has(id) && focused?.closest('.note-card');
    render();
    if (removesFocusedCard && !dialog.open) {
      $('#section-title').tabIndex = -1;
      $('#section-title').focus();
    } else if (focused?.dataset.favorite === id && !dialog.open) {
      $$('[data-favorite]').find(button => button.dataset.favorite === id)?.focus();
    }
    updateDialogFavorite();
  }

  function updateDialogFavorite() {
    if (!activeNote) return;
    const saved = favorites.has(activeNote.id);
    $('#dialog-favorite').textContent = saved ? '★ 已收藏' : '☆ 收藏筆記';
    $('#dialog-favorite').setAttribute('aria-pressed', String(saved));
  }

  function createCard(note) {
    const card = element('article', 'note-card');
    const top = element('div', 'card-top');
    const badge = element('span', 'category-badge', note.category);
    badge.dataset.category = note.category;
    const favorite = element('button', 'favorite-button', favorites.has(note.id) ? '★' : '☆');
    favorite.type = 'button';
    favorite.dataset.favorite = note.id;
    favorite.setAttribute('aria-label', `${favorites.has(note.id) ? '取消收藏' : '收藏'}：${note.title}`);
    favorite.setAttribute('aria-pressed', String(favorites.has(note.id)));
    favorite.addEventListener('click', () => toggleFavorite(note.id));
    top.append(badge, favorite);
    const heading = element('h3');
    const link = element('a', '', note.title);
    link.href = `#note=${note.id}`;
    link.addEventListener('click', event => {
      event.preventDefault();
      previousFocus = link;
      if (location.hash === link.hash) openNote(note); else location.hash = link.hash;
    });
    heading.append(link);
    const tags = element('div', 'tags');
    note.tags.forEach(tag => tags.append(element('span', '', `# ${tag}`)));
    const bottom = element('div', 'card-bottom');
    const date = element('time', '', note.updated.replaceAll('-', '.'));
    date.dateTime = note.updated;
    bottom.append(date, element('span', '', `${note.minutes} 分鐘閱讀 ↗`));
    card.append(top, heading, element('p', '', note.summary), tags, bottom);
    return card;
  }

  function render() {
    const query = $('#search').value.trim().toLocaleLowerCase();
    const filtered = notes.filter(note => {
      const searchable = [note.title, note.summary, note.category, ...note.tags,
        ...note.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.items || [])])].join(' ').toLocaleLowerCase();
      return (view !== 'favorites' || favorites.has(note.id)) && (category === 'all' || note.category === category) && searchable.includes(query);
    });
    const sort = $('#sort').value;
    filtered.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'zh-Hant') : sort === 'minutes' ? a.minutes - b.minutes || b.updated.localeCompare(a.updated) : b.updated.localeCompare(a.updated));
    $('#notes-grid').replaceChildren(...filtered.map(createCard));
    $('#empty-state').hidden = filtered.length > 0;
    $('#empty-message').textContent = view === 'favorites' && favorites.size === 0 ? '按下筆記右上角的星號，把想重讀的內容留在這裡。' : '換個關鍵字，或試試其他主題。';
    $('#section-title').firstChild.textContent = `${view === 'favorites' ? '我的收藏' : category === 'all' ? '所有筆記' : category} `;
    $('#result-count').textContent = `${filtered.length} 則`;
    $('#all-count').textContent = notes.length;
    $('#favorite-count').textContent = favorites.size;
    $$('[data-view]').forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('[data-filter]').forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('[data-category]').filter(button => button.tagName === 'BUTTON').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  }

  function openNote(note) {
    activeNote = note;
    const article = $('#note-content');
    const badge = element('span', 'category-badge', note.category);
    badge.dataset.category = note.category;
    const title = element('h2', '', note.title);
    title.id = 'note-title';
    article.replaceChildren(badge, title,
      element('div', 'note-meta', `${note.updated} 更新 · ${note.minutes} 分鐘閱讀 · ${note.tags.map(tag => `#${tag}`).join(' ')}`),
      element('p', 'note-summary', note.summary));
    note.sections.forEach(section => {
      const block = element('section', 'note-section');
      block.append(element('h3', '', section.heading));
      section.paragraphs.forEach(paragraph => block.append(element('p', '', paragraph)));
      if (section.items) {
        const list = element('ul');
        section.items.forEach(item => list.append(element('li', '', item)));
        block.append(list);
      }
      article.append(block);
    });
    updateDialogFavorite();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.title = `${note.title} · 拾知`;
  }

  function syncHash() {
    let id;
    try { id = decodeURIComponent(location.hash.replace(/^#note=/, '')); } catch { return; }
    const note = location.hash.startsWith('#note=') && notes.find(item => item.id === id);
    if (note) openNote(note); else if (dialog.open) dialog.close();
  }

  $('#close-note').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  dialog.addEventListener('close', () => {
    if (location.hash.startsWith('#note=')) history.replaceState(null, '', location.pathname + location.search);
    document.title = '拾知 · 個人知識庫';
    activeNote = null;
    if (previousFocus?.isConnected) previousFocus.focus();
    else { $('#section-title').tabIndex = -1; $('#section-title').focus({ preventScroll: true }); }
  });
  $('#dialog-favorite').addEventListener('click', () => { if (activeNote) toggleFavorite(activeNote.id); });
  $('#search').addEventListener('input', render);
  $('#sort').addEventListener('change', render);
  $$('[data-filter],button[data-category]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter || button.dataset.category;
    render();
    if (button.dataset.category) $('#notes').scrollIntoView({ behavior: 'smooth' });
  }));
  $$('[data-view]').forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view;
    category = 'all';
    $('#search').value = '';
    render();
  }));
  $('#reset-filters').addEventListener('click', () => {
    view = 'all'; category = 'all'; $('#search').value = ''; render();
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !dialog.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); $('#search').focus();
    }
  });
  $('#stat-notes').textContent = notes.length;
  $('#stat-date').textContent = notes.map(note => note.updated).sort().at(-1)?.slice(5).replace('-', '.') || '—';
  $$('[data-count]').forEach(node => { node.textContent = notes.filter(note => note.category === node.dataset.count).length; });
  window.addEventListener('hashchange', syncHash);
  render();
  syncHash();
})();
