// claude-setups · vanilla SPA
(function () {
  'use strict';

  // ===== Constants =====
  const SETUPS = (window.SETUPS_DATA || []).slice();
  const SPEC_LABELS = window.SPECIALTY_LABELS || {};
  const DEFAULT_SPECS = [
    'fullstack', 'frontend', 'backend', 'mobile', 'devops',
    'data-engineer', 'data-science', 'research',
  ];
  const presentSpecs = new Set();
  for (const s of SETUPS) for (const sp of s.specialties) presentSpecs.add(sp);
  const tabIds = ['all'].concat(DEFAULT_SPECS.filter(id => presentSpecs.has(id)))
    .concat([...presentSpecs].filter(id => !DEFAULT_SPECS.includes(id)));

  const ICONS = {
    plug: '⚡', mcp: '◉', hook: '⚓', skill: '✦', arrow: '→',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    github: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.77 5.47.77 11.75c0 4.94 3.2 9.12 7.64 10.6.56.1.76-.24.76-.54 0-.27-.01-1.17-.02-2.12-3.11.68-3.77-1.31-3.77-1.31-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.1-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.61 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.23-5.11 5.51.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.05 0 .3.2.65.77.54 4.43-1.48 7.63-5.66 7.63-10.6C23.23 5.47 18.27.5 12 .5z"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  };

  const LOGO_HTML = '<div class="logo-mark" style="width:32px;height:32px" aria-hidden><div class="logo-inner"><span>{</span><span class="logo-dot"></span><span>}</span></div></div>';

  // ===== State =====
  const state = {
    route: parseHash(),
    theme: getTweak('theme', 'light'),
    aesthetic: getTweak('aesthetic', 'playful'),
    query: '',
    specialty: 'all',
    activeFile: null,
  };

  // ===== Utilities =====
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function parseHash() {
    const h = (location.hash || '').replace(/^#/, '');
    const m = h.match(/^\/setup\/([^/]+)\/([^/]+)\/?$/);
    if (m) return { name: 'view', author: decodeURIComponent(m[1]), slug: decodeURIComponent(m[2]) };
    return { name: 'index' };
  }
  function getTweak(k, fallback) {
    try { return (JSON.parse(localStorage.getItem('claude-setups.tweaks') || '{}')[k]) || fallback; }
    catch (e) { return fallback; }
  }
  function setTweak(k, v) {
    try {
      const cur = JSON.parse(localStorage.getItem('claude-setups.tweaks') || '{}');
      cur[k] = v;
      localStorage.setItem('claude-setups.tweaks', JSON.stringify(cur));
    } catch (e) {}
    document.documentElement.setAttribute('data-' + k, v);
  }
  function specLabel(id) { return SPEC_LABELS[id] || id; }
  function avatarChar(name) { return String(name || '?').trim().charAt(0).toUpperCase() || '?'; }
  function avatarBg(seed) {
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const hue = h % 360; return 'hsl(' + hue + ' 55% 45%)';
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return iso; }
  }
  function formatNum(n) { return Number(n || 0).toLocaleString('en-US'); }

  // ===== Markdown (overview) =====
  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.split('\n');
    const out = [];
    let inList = false, inOrdered = false, inCode = false, codeBuf = [];
    const closeList = () => {
      if (inList) { out.push('</ul>'); inList = false; }
      if (inOrdered) { out.push('</ol>'); inOrdered = false; }
    };
    const inline = (s) => {
      s = esc(s);
      s = s.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      return s;
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) {
        if (inCode) {
          out.push('<pre class="md-pre mono"><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
          codeBuf = []; inCode = false;
        } else { closeList(); inCode = true; }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        closeList();
        const lvl = h[1].length;
        out.push('<h' + (lvl + 1) + ' class="md-h' + lvl + '">' + inline(h[2]) + '</h' + (lvl + 1) + '>');
        continue;
      }
      const ul = line.match(/^[-*]\s+(.*)$/);
      if (ul) {
        if (!inList) { closeList(); out.push('<ul class="md-ul">'); inList = true; }
        out.push('<li>' + inline(ul[1]) + '</li>'); continue;
      }
      const ol = line.match(/^(\d+)\.\s+(.*)$/);
      if (ol) {
        if (!inOrdered) { closeList(); out.push('<ol class="md-ol">'); inOrdered = true; }
        out.push('<li>' + inline(ol[2]) + '</li>'); continue;
      }
      if (line.trim() === '') { closeList(); continue; }
      closeList();
      out.push('<p class="md-p">' + inline(line) + '</p>');
    }
    closeList();
    if (inCode) out.push('<pre class="md-pre mono"><code>' + esc(codeBuf.join('\n')) + '</code></pre>');
    return out.join('\n');
  }

  // ===== Syntax highlighting =====
  function highlight(code, kind) {
    let html = esc(code);
    if (kind === 'sh') {
      html = html.replace(/(^|\n)(#.*)/g, '$1<span class="tok-com">$2</span>');
      html = html.replace(/\b(if|then|fi|for|in|do|done|else|elif|while|case|esac|set|echo|exit|grep|cat|rm|mkdir|cd|export|return|function|local|source)\b/g, '<span class="tok-kw">$1</span>');
      html = html.replace(/(\$\{?[A-Za-z_][A-Za-z0-9_]*\}?)/g, '<span class="tok-var">$1</span>');
      html = html.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tok-str">$1</span>');
    } else if (kind === 'md') {
      html = html.replace(/(^|\n)(#{1,6} .*)/g, '$1<span class="tok-head">$2</span>');
      html = html.replace(/(`[^`\n]+`)/g, '<span class="tok-code">$1</span>');
      html = html.replace(/(^|\n)(- .*)/g, '$1<span class="tok-list">$2</span>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="tok-bold">$1</span>');
    } else if (kind === 'json') {
      html = html.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="tok-kw">$1</span>$2');
      html = html.replace(/:\s*(&quot;[^&]*?&quot;)/g, ': <span class="tok-str">$1</span>');
      html = html.replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>');
    } else if (kind === 'yml' || kind === 'yaml') {
      html = html.replace(/(^|\n)(#.*)/g, '$1<span class="tok-com">$2</span>');
      html = html.replace(/(^|\n)(\s*)([A-Za-z0-9_-]+)(:)/g, '$1$2<span class="tok-kw">$3</span>$4');
    }
    return html;
  }

  // ===== Topbar / Tweaks / Footer =====
  function renderTopbar() {
    const tb = document.getElementById('topbar');
    tb.innerHTML =
      '<div class="topbar-left" data-act="home">' + LOGO_HTML +
      '<div class="brand">claude-setups<span class="brand-sub"> / gallery</span></div></div>' +
      '<div class="topbar-right">' +
        '<a class="btn-ghost btn-ghost-sm" href="https://github.com/adhenawer/claude-setups-registry" target="_blank" rel="noreferrer">' +
        ICONS.github + ' repo</a>' +
        '<button class="iconbtn" data-act="theme" aria-label="Toggle theme">' +
          (state.theme === 'dark' ? ICONS.sun : ICONS.moon) +
        '</button>' +
      '</div>';
    tb.querySelector('[data-act=home]').addEventListener('click', goHome);
    tb.querySelector('[data-act=theme]').addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      setTweak('theme', state.theme);
      renderTopbar();
    });
  }

  // ===== Copy command =====
  function copyCmdHtml(cmd, size) {
    const cls = 'copy-cmd' + (size === 'lg' ? ' copy-cmd-lg' : '');
    return '<button class="' + cls + '" data-cmd="' + esc(cmd) + '" title="Copy">' +
      '<span class="copy-cmd-dollar">$</span>' +
      '<code class="copy-cmd-text">' + esc(cmd) + '</code>' +
      '<span class="copy-cmd-btn">' + ICONS.copy + '</span>' +
    '</button>';
  }
  function bindCopyCmds(root) {
    root.querySelectorAll('.copy-cmd').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(cmd).then(() => {
          const label = btn.querySelector('.copy-cmd-btn');
          const prev = label.innerHTML;
          label.textContent = 'copied!';
          setTimeout(() => { label.innerHTML = prev; }, 1600);
        }, () => {});
      });
    });
  }

  // ===== Routing =====
  function goHome() { location.hash = '/'; }
  function goView(author, slug) { location.hash = '/setup/' + author + '/' + slug; }

  // ===== Gallery (index) =====
  function heroHtml() {
    const total = SETUPS.length;
    return '<section class="hero"><div class="hero-grid">' +
      '<div class="hero-left">' +
        '<div class="hero-eyebrow"><span class="pulse-dot"></span>' +
          '<span>public registry · ' + total + ' ' + plural(total, 'setup', 'setups') + ' shared</span></div>' +
        '<h1 class="hero-title"><span class="ink">Claude Code</span> setups<br/>built by the <span class="underlined">community</span>.</h1>' +
        '<p class="hero-sub">Discover how other developers configure Claude — hooks, instructions, skills, MCPs — and clone an entire setup with <strong>one command</strong>. Your secrets never leave your machine.</p>' +
        '<div class="hero-cta">' + copyCmdHtml('npx -y claude-setups publish', 'lg') +
          '<a class="btn-ghost" href="https://github.com/adhenawer/claude-setups-registry" target="_blank" rel="noreferrer">' +
          ICONS.github + ' view on GitHub</a></div>' +
      '</div>' +
      '<div class="hero-right" aria-hidden>' + heroVisualHtml() + '</div>' +
    '</div></section>';
  }
  function heroVisualHtml() {
    return '<div class="hero-visual">' +
      '<div class="hv-card hv-card-back">' +
        '<div class="hv-header"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>' +
        '<span class="hv-title">~/.claude/</span></div>' +
        '<div class="hv-tree mono">' +
          '<div>├─ <span class="hv-folder">hooks/</span></div>' +
          '<div>│  ├─ pre-commit-lint.sh</div>' +
          '<div>│  └─ on-save-format.sh</div>' +
          '<div>├─ <span class="hv-folder">skills/</span></div>' +
          '<div>│  ├─ drizzle-migrate.md</div>' +
          '<div>│  └─ test-scaffold.md</div>' +
          '<div>├─ <span class="hv-folder">agents/</span></div>' +
          '<div>└─ CLAUDE.md</div>' +
        '</div></div>' +
      '<div class="hv-card hv-card-front">' +
        '<div class="hv-header"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>' +
        '<span class="hv-title">fullstack-zen · mirror</span></div>' +
        '<div class="hv-term mono">' +
          '<div><span class="prompt">$</span> npx -y claude-setups mirror marina/fullstack-zen</div>' +
          '<div class="muted">→ installing plugins (3)</div>' +
          '<div class="muted">→ adding MCP servers (4)</div>' +
          '<div class="muted">→ extracting bundle (21 files)</div>' +
          '<div><span class="ok">✓</span> setup mirrored in 3.8s</div>' +
          '<div class="blinker">▊</div>' +
        '</div></div>' +
    '</div>';
  }

  function countsFor() {
    const c = { all: SETUPS.length };
    for (const s of SETUPS) for (const sp of s.specialties) c[sp] = (c[sp] || 0) + 1;
    return c;
  }

  function specialtyTabsHtml(counts) {
    return '<div class="specialty-tabs" role="tablist">' +
      tabIds.map(id => {
        const label = id === 'all' ? 'All' : specLabel(id);
        const cls = 'spec-tab' + (state.specialty === id ? ' is-active' : '');
        return '<button class="' + cls + '" role="tab" aria-selected="' + (state.specialty === id) + '" data-spec="' + esc(id) + '">' +
          esc(label) + '<span class="spec-count">' + (counts[id] || 0) + '</span></button>';
      }).join('') + '</div>';
  }

  function searchBarHtml() {
    return '<div class="searchbar">' +
      '<span class="search-icon">' + ICONS.search + '</span>' +
      '<input id="searchInput" type="text" placeholder="Search by title, author, tag…" value="' + esc(state.query) + '" />' +
      (state.query ? '<button class="search-clear" data-act="clear-search">clear</button>' : '') +
    '</div>';
  }

  function filterSetups() {
    const q = state.query.trim().toLowerCase();
    return SETUPS.filter(s => {
      if (state.specialty !== 'all' && !s.specialties.includes(state.specialty)) return false;
      if (!q) return true;
      const hay = [s.title, s.description, s.author, s.authorName, s.specialties.join(' '), s.tags.join(' ')]
        .join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function cardHtml(s) {
    const primary = s.specialties[0] || 'other';
    const mirrors = Number(s.mirrors || 0);
    const statPills = [
      { n: s.stats.plugins, l: 'plugins', i: ICONS.plug },
      { n: s.stats.mcps, l: 'MCPs', i: ICONS.mcp },
      { n: s.stats.hooks, l: 'hooks', i: ICONS.hook },
      { n: s.stats.skills, l: 'skills', i: ICONS.skill },
    ].filter(p => p.n > 0).map(p =>
      '<div class="stat-pill" title="' + p.n + ' ' + p.l + '">' +
        '<span class="stat-icon">' + p.i + '</span>' +
        '<span class="stat-n">' + p.n + '</span>' +
        '<span class="stat-label">' + p.l + '</span>' +
      '</div>'
    ).join('');
    const tagsHtml = s.tags.slice(0, 4).map(t =>
      '<span class="badge badge-muted">#' + esc(t) + '</span>'
    ).join('');
    return '<article class="card" tabindex="0" data-author="' + esc(s.author) + '" data-slug="' + esc(s.slug) + '">' +
      '<div class="card-top">' +
        '<div class="card-author">' +
          '<div class="avatar" aria-label="' + esc(s.authorName) + '" style="width:36px;height:36px;background:' + esc(s.avatarBg) + ';font-size:15px">' + esc(s.avatar) + '</div>' +
          '<div class="card-author-meta">' +
            '<div class="card-author-name">' + esc(s.authorName) + '</div>' +
            '<div class="card-author-handle">@' + esc(s.author) + '</div>' +
          '</div>' +
        '</div>' +
        '<span class="card-specialty">' + esc(specLabel(primary)) + '</span>' +
      '</div>' +
      '<h3 class="card-title">' + esc(s.title) + '</h3>' +
      '<p class="card-desc">' + esc(s.description) + '</p>' +
      '<div class="card-tags">' + tagsHtml + '</div>' +
      '<div class="card-stats">' + statPills + '</div>' +
      '<div class="card-foot">' +
        '<span class="card-mirrors">' + formatNum(mirrors) + ' ' + plural(mirrors, 'mirror', 'mirrors') + '</span>' +
        '<span class="card-open">view setup ' + ICONS.arrow + '</span>' +
      '</div>' +
    '</article>';
  }

  function gridHtml(filtered) {
    if (!filtered.length) {
      return '<div class="empty"><div class="empty-emoji" aria-hidden>∅</div>' +
        '<p>No setups match your search.</p>' +
        '<button class="btn-ghost" data-act="reset-filters">clear filters</button></div>';
    }
    return '<div class="grid">' + filtered.map(cardHtml).join('') + '</div>';
  }

  function renderIndex() {
    const main = document.getElementById('main');
    main.setAttribute('data-screen-label', '01 Gallery');
    const counts = countsFor();
    const filtered = filterSetups();
    main.innerHTML =
      heroHtml() +
      '<section class="gallery">' +
        '<div class="gallery-toolbar" id="toolbar">' +
          searchBarHtml() +
          specialtyTabsHtml(counts) +
        '</div>' +
        '<div id="gridWrap">' + gridHtml(filtered) + '</div>' +
        '<div class="gallery-footnote">' +
          '<span>Is your setup missing here?</span>' +
          copyCmdHtml('npx -y claude-setups publish') +
        '</div>' +
      '</section>';

    bindCopyCmds(main);
    bindCardGlow(main);
    wireIndexEvents();
  }

  function wireIndexEvents() {
    const main = document.getElementById('main');
    const input = main.querySelector('#searchInput');
    if (input) {
      input.addEventListener('input', (e) => {
        state.query = e.target.value;
        updateIndexGrid();
      });
    }
    main.addEventListener('click', onIndexClick);
  }

  function onIndexClick(e) {
    const card = e.target.closest('.card');
    if (card) { goView(card.dataset.author, card.dataset.slug); return; }
    const tab = e.target.closest('.spec-tab');
    if (tab) {
      state.specialty = tab.dataset.spec;
      updateIndexGrid();
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'clear-search') {
      state.query = '';
      const main = document.getElementById('main');
      const input = main.querySelector('#searchInput');
      if (input) input.value = '';
      updateIndexGrid();
    } else if (act.dataset.act === 'reset-filters') {
      state.query = ''; state.specialty = 'all';
      const main = document.getElementById('main');
      const input = main.querySelector('#searchInput');
      if (input) input.value = '';
      updateIndexGrid();
    }
  }

  function updateIndexGrid() {
    const main = document.getElementById('main');
    const gridWrap = main.querySelector('#gridWrap');
    if (!gridWrap) return;
    const filtered = filterSetups();
    gridWrap.innerHTML = gridHtml(filtered);
    bindCardGlow(gridWrap);
    // Update tab active state
    const counts = countsFor();
    main.querySelectorAll('.spec-tab').forEach(t => {
      const id = t.dataset.spec;
      t.classList.toggle('is-active', id === state.specialty);
      t.setAttribute('aria-selected', id === state.specialty);
      const count = t.querySelector('.spec-count');
      if (count) count.textContent = counts[id] || 0;
    });
    // Update clear button presence
    const sb = main.querySelector('.searchbar');
    const existingClear = sb.querySelector('.search-clear');
    if (state.query && !existingClear) {
      const b = document.createElement('button');
      b.className = 'search-clear';
      b.dataset.act = 'clear-search';
      b.textContent = 'clear';
      sb.appendChild(b);
    } else if (!state.query && existingClear) {
      existingClear.remove();
    }
  }

  function bindCardGlow(root) {
    root.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        card.style.setProperty('--mx', mx + '%');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') goView(card.dataset.author, card.dataset.slug);
      });
    });
  }

  // ===== Detail (view) =====
  function buildTree(files) {
    const root = { files: [], children: {} };
    for (const f of files) {
      const parts = f.path.split('/');
      if (parts.length === 1) root.files.push(f);
      else {
        const dir = parts[0];
        if (!root.children[dir]) root.children[dir] = { name: dir, files: [] };
        root.children[dir].files.push(Object.assign({}, f, { leaf: parts.slice(1).join('/') }));
      }
    }
    return root;
  }

  function fileTreeHtml(files, active) {
    const tree = buildTree(files);
    let html = '<nav class="filetree">';
    for (const f of tree.files) {
      const cls = 'ft-file' + (active === f.path ? ' is-active' : '');
      html += '<button class="' + cls + '" data-path="' + esc(f.path) + '">' +
        '<span class="ft-icon">' + ICONS.file + '</span>' +
        '<span class="ft-name">' + esc(f.path) + '</span></button>';
    }
    for (const dir of Object.values(tree.children)) {
      html += '<div class="ft-dir">' +
        '<div class="ft-dir-label">' +
          '<span class="ft-icon">' + ICONS.folder + '</span>' +
          '<span>' + esc(dir.name) + '/</span>' +
          '<span class="ft-dir-count">' + dir.files.length + '</span>' +
        '</div>';
      for (const f of dir.files) {
        const cls = 'ft-file ft-file-nested' + (active === f.path ? ' is-active' : '');
        html += '<button class="' + cls + '" data-path="' + esc(f.path) + '">' +
          '<span class="ft-icon">' + ICONS.file + '</span>' +
          '<span class="ft-name">' + esc(f.leaf) + '</span></button>';
      }
      html += '</div>';
    }
    return html + '</nav>';
  }

  function fileViewerHtml(file) {
    if (!file) return '<div class="fv-empty">Select a file from the tree.</div>';
    if (file.content == null) {
      return '<div class="fileviewer">' +
        '<div class="fv-header"><div class="fv-path mono">' + esc(file.path) + '</div>' +
        '<div class="fv-meta"><span>' + (file.size || 0) + ' bytes</span>' +
        '<span class="fv-kind">' + esc(file.kind || '') + '</span></div></div>' +
        '<div class="fv-empty">File content not available in preview (binary or too large). Download the bundle to inspect.</div>' +
      '</div>';
    }
    const lines = String(file.content).split('\n').length;
    const html = highlight(file.content, file.kind);
    return '<div class="fileviewer">' +
      '<div class="fv-header">' +
        '<div class="fv-path mono">' + esc(file.path) + '</div>' +
        '<div class="fv-meta">' +
          '<span>' + lines + ' lines</span>' +
          '<span class="fv-kind">' + esc(file.kind || '') + '</span>' +
        '</div>' +
      '</div>' +
      '<pre class="fv-code mono"><code>' + html + '</code></pre>' +
    '</div>';
  }

  function pluginsSectionHtml(setup) {
    if (!setup.plugins.length) return '';
    const rows = setup.plugins.map(p => {
      const src = p.from || p.marketplace || '';
      const srcLabel = p.marketplace ? 'marketplace:' + p.marketplace : (src || 'npm');
      return '<li class="plugin-row">' +
        '<span class="plugin-icon">' + ICONS.plug + '</span>' +
        '<span class="plugin-name mono">' + esc(p.name) + '</span>' +
        '<span class="plugin-version mono">v' + esc(p.version || '?') + '</span>' +
        '<span class="plugin-from">' + esc(srcLabel) + '</span>' +
      '</li>';
    }).join('');
    return sectionHtml('Plugins', setup.plugins.length, '<ul class="plugin-list">' + rows + '</ul>');
  }

  function mcpSectionHtml(setup) {
    if (!setup.mcps.length) return '';
    const rows = setup.mcps.map(m =>
      '<li class="mcp-row">' +
        '<div class="mcp-name-wrap">' +
          '<span class="mcp-bullet">' + ICONS.mcp + '</span>' +
          '<span class="mcp-name mono">' + esc(m.name) + '</span>' +
        '</div>' +
        '<code class="mcp-cmd mono">' + esc(m.cmd || '') + '</code>' +
      '</li>'
    ).join('');
    return sectionHtml('MCP servers', setup.mcps.length, '<ul class="mcp-list">' + rows + '</ul>');
  }

  function sectionHtml(title, count, inner) {
    return '<section class="vsection">' +
      '<header class="vsection-head"><h2>' + esc(title) + '</h2>' +
      (count != null ? '<span class="vsection-count">' + count + '</span>' : '') +
      '</header>' + inner + '</section>';
  }

  function bundleSectionHtml(setup) {
    if (!setup.files.length) return '';
    return sectionHtml('Bundle', setup.files.length,
      '<div class="bundle" id="bundle">' +
        '<div id="ftWrap">' + fileTreeHtml(setup.files, state.activeFile) + '</div>' +
        '<div id="fvWrap">' + fileViewerHtml(setup.files.find(f => f.path === state.activeFile)) + '</div>' +
      '</div>'
    );
  }

  function renderView() {
    const main = document.getElementById('main');
    main.setAttribute('data-screen-label', '02 Setup detail');
    const setup = SETUPS.find(s =>
      s.author === state.route.author && s.slug === state.route.slug
    );
    if (!setup) {
      main.innerHTML = '<div class="notfound"><p>Setup not found.</p>' +
        '<button class="btn-ghost" data-act="home">' + ICONS.back + ' back to gallery</button></div>';
      main.querySelector('[data-act=home]').addEventListener('click', goHome);
      return;
    }
    if (!state.activeFile && setup.files.length) state.activeFile = setup.files[0].path;

    const mirrorCmd = 'npx -y claude-setups mirror ' + setup.author + '/' + setup.slug;
    const primarySpec = setup.specialties[0] || 'other';
    const tagsHtml = '<span class="badge">' + esc(specLabel(primarySpec)) + '</span>' +
      setup.tags.map(t => '<span class="badge badge-muted">#' + esc(t) + '</span>').join('');

    main.innerHTML =
      '<div class="view">' +
        '<button class="backlink" data-act="home">' + ICONS.back + ' back to gallery</button>' +
        '<header class="view-hero">' +
          '<div class="view-hero-left">' +
            '<div class="view-author-row">' +
              '<div class="avatar" aria-label="' + esc(setup.authorName) + '" style="width:52px;height:52px;background:' + esc(setup.avatarBg) + ';font-size:22px">' + esc(setup.avatar) + '</div>' +
              '<div>' +
                '<div class="view-author-name">' + esc(setup.authorName) + '</div>' +
                '<div class="view-author-handle">@' + esc(setup.author) + ' · published on ' + esc(formatDate(setup.published)) + '</div>' +
              '</div>' +
              '<a class="btn-ghost btn-ghost-sm" href="' + esc(setup.authorUrl || ('https://github.com/' + setup.author)) + '" target="_blank" rel="noreferrer">' +
                ICONS.github + ' GitHub</a>' +
            '</div>' +
            '<h1 class="view-title">' + esc(setup.title) + '</h1>' +
            '<p class="view-desc">' + esc(setup.description) + '</p>' +
            '<div class="view-tags">' + tagsHtml + '</div>' +
            '<div class="view-cta">' +
              copyCmdHtml(mirrorCmd, 'lg') +
              (setup.mirrors
                ? '<span class="view-mirrors">' + formatNum(setup.mirrors) + ' ' + plural(setup.mirrors, 'person cloned it', 'people cloned it') + '</span>'
                : '') +
            '</div>' +
          '</div>' +
          '<aside class="view-stats-card">' +
            '<div class="vsc-title">in the bundle</div>' +
            '<div class="vsc-grid">' +
              '<div><span class="vsc-n">' + setup.stats.plugins + '</span><span class="vsc-l">plugins</span></div>' +
              '<div><span class="vsc-n">' + setup.stats.mcps + '</span><span class="vsc-l">MCPs</span></div>' +
              '<div><span class="vsc-n">' + setup.stats.hooks + '</span><span class="vsc-l">hooks</span></div>' +
              '<div><span class="vsc-n">' + setup.stats.skills + '</span><span class="vsc-l">skills</span></div>' +
            '</div>' +
          '</aside>' +
        '</header>' +
        (setup.overview ? sectionHtml('Overview', null,
          '<div class="overview">' + renderMarkdown(setup.overview) + '</div>') : '') +
        pluginsSectionHtml(setup) +
        mcpSectionHtml(setup) +
        bundleSectionHtml(setup) +
      '</div>';

    bindCopyCmds(main);
    main.querySelectorAll('[data-act=home]').forEach(el => el.addEventListener('click', goHome));
    main.querySelectorAll('.ft-file').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeFile = btn.dataset.path;
        const fv = document.getElementById('fvWrap');
        const setupFile = setup.files.find(f => f.path === state.activeFile);
        if (fv) fv.innerHTML = fileViewerHtml(setupFile);
        main.querySelectorAll('.ft-file').forEach(b =>
          b.classList.toggle('is-active', b.dataset.path === state.activeFile));
      });
    });
    window.scrollTo(0, 0);
  }

  // ===== Boot =====
  function render() {
    if (state.route.name === 'view') renderView();
    else renderIndex();
  }

  function main() {
    renderTopbar();
    render();
    window.addEventListener('hashchange', () => {
      state.route = parseHash();
      state.activeFile = null;
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else main();
})();
