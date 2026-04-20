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
    if (h === '/docs' || h === '/docs/') return { name: 'docs' };
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
        '<a class="btn-ghost btn-ghost-sm" href="#/docs" data-act="docs">docs</a>' +
        '<a class="btn-ghost btn-ghost-sm" href="https://github.com/adhenawer/claude-setups" target="_blank" rel="noreferrer">' +
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
          '<a class="btn-ghost" href="https://github.com/adhenawer/claude-setups" target="_blank" rel="noreferrer">' +
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
      const url = p.marketplaceUrl;
      const nameHtml = url
        ? '<a class="plugin-name mono" href="' + esc(url) + '" target="_blank" rel="noreferrer">' + esc(p.name) + '</a>'
        : '<span class="plugin-name mono">' + esc(p.name) + '</span>';
      const fromHtml = url
        ? '<a class="plugin-from" href="' + esc(url) + '" target="_blank" rel="noreferrer">' + esc(srcLabel) + '</a>'
        : '<span class="plugin-from">' + esc(srcLabel) + '</span>';
      return '<li class="plugin-row">' +
        '<span class="plugin-icon">' + ICONS.plug + '</span>' +
        nameHtml +
        '<span class="plugin-version mono">v' + esc(p.version || '?') + '</span>' +
        fromHtml +
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

  // ===== Docs =====
  const DOCS_MD = [
    '# CLI reference',
    '',
    'Three commands from the [claude-setups](https://github.com/adhenawer/claude-setups) CLI talk to this registry. This page explains exactly what each one reads, writes, and guarantees.',
    '',
    '## publish',
    '',
    '`npx -y claude-setups publish [--with-bundle]`',
    '',
    'Packages your local Claude Code configuration into a descriptor and submits it to the registry as a GitHub Issue. The registry never sees your machine directly — you control what goes in.',
    '',
    '### What it publishes',
    '',
    '- **Descriptor JSON** — title, description, tags, 1–3 specialties, author handle.',
    '- **Plugins list** — name, version, marketplace reference (no install scripts).',
    '- **Marketplaces list** — `source + repo` so consumers know where plugins come from.',
    '- **MCP servers** — `name`, `command`, `args`. The `env` block is **always stripped**: API keys and secrets never leave your machine.',
    '- **Bundle** (optional, `--with-bundle`) — a tarball with files under fixed prefixes.',
    '',
    '### What the bundle can contain',
    '',
    '- `hooks/**` · `skills/**` · `commands/**` · `agents/**`',
    '- Root-level markdown: `CLAUDE.md`, `RTK.md`, any `*.md`',
    '',
    '### What is NEVER published',
    '',
    '- `settings.json` / `settings.*` · `.claude.json` — **rejected at validation** if present in the tarball.',
    '- MCP `env` values — silently removed before the descriptor is built.',
    '- Absolute paths or `..` traversals in bundle files — rejected.',
    '- Anything outside the allowed prefixes above — rejected.',
    '',
    '### The submission flow',
    '',
    '1. CLI opens a GitHub Issue labeled `setup:submission` with the descriptor as JSON.',
    '2. If a bundle exists, CLI pushes it to a temporary branch `bundle/<author>-<slug>-<timestamp>`.',
    '3. The [ingest action](https://github.com/adhenawer/claude-setups-registry/blob/master/.github/workflows/ingest.yml) validates schema, specialties, slug format, and bundle path safety.',
    '4. On success: descriptor lands at `data/setups/<author>/<slug>.json`, bundle moves to `data/bundles/<author>/<slug>.tar.gz`, issue closes with the live URL.',
    '5. On failure: issue is labeled `invalid` and commented with the exact reason.',
    '',
    '### Author lock',
    '',
    'The descriptor `author` field must match the GitHub user who opened the issue. You cannot publish on behalf of someone else.',
    '',
    '## mirror',
    '',
    '`npx -y claude-setups mirror <author>/<slug>`',
    '',
    'Installs a published setup locally. Fetches the descriptor JSON + bundle from Pages, installs plugins, registers MCP servers, extracts the bundle into `~/.claude/`.',
    '',
    '### What it writes to your machine',
    '',
    '- **Plugins** — each plugin is installed from its marketplace the same way `plugin add` would.',
    '- **MCP servers** — registered via `claude mcp add`. Since the descriptor has no `env`, you must set API keys yourself after mirror.',
    '- **Bundle files** — extracted under `~/.claude/` preserving their relative path (`hooks/foo.sh`, `skills/bar.md`, etc).',
    '',
    '### Overwrite rules (never destructive)',
    '',
    '- **Local files are never deleted or replaced in place.** If `~/.claude/hooks/on-save.sh` already exists and the setup ships one at the same path, mirror **renames your file to `on-save.sh.bak`** before writing the incoming version. You keep both — the original is always recoverable.',
    '- **`.bak` chain.** If a `.bak` already exists from a previous mirror, the new backup becomes `on-save.sh.bak.2`, then `.bak.3`, and so on. No backup is ever overwritten either.',
    '- **Byte-identical files are skipped.** If the incoming file hashes to the same sha256 as your local one, mirror does nothing — no `.bak`, no write, no noise.',
    '- **`settings.json` and `.claude.json` are never touched.** They cannot be in a bundle (rejected at publish), so mirror never reads, writes, or backs them up.',
    '- **Plugin version conflicts** — if you have a different version of the same plugin installed, the CLI follows marketplace upgrade behavior. Your existing plugins are not uninstalled.',
    '',
    '### Duplicate / identical files across setups',
    '',
    'Two setups can ship the same path (say, both have `skills/test-scaffold.md`). Because mirror never destroys, mirroring the first one lands it as `skills/test-scaffold.md`; mirroring the second one pushes the first to `.bak` and writes the new file. The registry does not merge or diff contents — your local tree is the source of truth, and every version is preserved on disk for you to reconcile manually.',
    '',
    '### What mirror does NOT do',
    '',
    '- Does not delete any local file, ever. Worst case: you get `.bak` copies to clean up.',
    '- Does not touch files outside `~/.claude/<prefix>/` paths declared in the bundle.',
    '- Does not run any scripts from the bundle — files land on disk inert.',
    '- Does not install the CLI itself or modify shell profiles.',
    '- Does not send telemetry beyond opening the mirror-counter issue (increments the public `mirrors` count on the descriptor).',
    '',
    '## revoke',
    '',
    '`npx -y claude-setups revoke <slug>`',
    '',
    'Removes your published setup from the registry.',
    '',
    '### What it removes',
    '',
    '- `data/setups/<author>/<slug>.json` — deleted.',
    '- `data/bundles/<author>/<slug>.tar.gz` — deleted.',
    '- Gallery entry disappears on the next Pages rebuild (seconds).',
    '',
    '### Rules',
    '',
    '- **Only the original author can revoke.** The [moderation action](https://github.com/adhenawer/claude-setups-registry/blob/master/.github/workflows/moderate.yml) verifies that the issue opener matches the setup\'s `author` field.',
    '- **Idempotent.** Revoking an already-revoked setup succeeds silently.',
    '- **Not a takedown.** Anyone who already mirrored your setup still has the files locally. Revoke removes the *listing*, not copies already distributed.',
    '',
    '### The flow',
    '',
    '1. CLI opens an issue labeled `setup:revoke` with `{ "author": "...", "slug": "..." }` in the body.',
    '2. The moderation workflow checks author ownership and deletes the files.',
    '3. Pages rebuilds automatically; the setup disappears from the gallery.',
    '',
    '## Privacy boundary',
    '',
    'The registry is a pile of static JSON in a public repo. Everything you publish is public forever (git history keeps revoked content). **Review the descriptor preview the CLI shows before hitting submit** — once merged, the only recourse is revoke (which keeps the git history).',
    '',
    'Your secrets stay local: MCP `env`, `settings.json`, and `.claude.json` are filtered at publish time, blocked at validation, and never extracted by mirror.',
  ].join('\n');

  function renderDocs() {
    const main = document.getElementById('main');
    main.setAttribute('data-screen-label', '03 Docs');
    main.innerHTML =
      '<div class="view">' +
        '<button class="backlink" data-act="home">' + ICONS.back + ' back to gallery</button>' +
        '<article class="overview docs-article">' + renderMarkdown(DOCS_MD) + '</article>' +
      '</div>';
    main.querySelectorAll('[data-act=home]').forEach(el => el.addEventListener('click', goHome));
    window.scrollTo(0, 0);
  }

  // ===== Boot =====
  function render() {
    if (state.route.name === 'view') renderView();
    else if (state.route.name === 'docs') renderDocs();
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
