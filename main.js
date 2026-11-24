/* ============================================================
   hakergeniusz.github.io - interactions and live data
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const icons = () => { if (window.lucide) window.lucide.createIcons(); };

/* ---------------- theme + true-dark easter egg ---------------- */
const root = document.documentElement;
root.classList.add('has-js');

/* ---------------- inertial smooth scrolling (GSAP-style) ---------------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smoothEnabled = !reduceMotion && window.matchMedia('(pointer: fine)').matches;
let smoothTarget = window.scrollY;
let smoothCurrent = window.scrollY;
let smoothRaf = null;

function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }

function smoothLoop() {
  smoothCurrent += (smoothTarget - smoothCurrent) * 0.09;
  if (Math.abs(smoothTarget - smoothCurrent) < 0.5) smoothCurrent = smoothTarget;
  window.scrollTo(0, smoothCurrent);
  if (smoothCurrent !== smoothTarget) smoothRaf = requestAnimationFrame(smoothLoop);
  else smoothRaf = null;
}

function smoothTo(value) {
  smoothTarget = Math.max(0, Math.min(maxScroll(), value));
  if (smoothRaf === null) smoothRaf = requestAnimationFrame(smoothLoop);
}

if (smoothEnabled) {
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    smoothTo(smoothTarget + delta);
  }, { passive: false });

  window.addEventListener('scroll', () => {
    if (smoothRaf !== null) return;
    if (Math.abs(window.scrollY - smoothTarget) > 2) smoothTo(window.scrollY);
  }, { passive: true });
}

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 80);
    if (smoothEnabled) smoothTo(top);
    else window.scrollTo(0, top);
    history.replaceState(null, '', `#${id}`);
  });
});

const revealTargets = $$('.hero-copy > *, .stats, .section-head, .burn-frame, .about-grid > .panel');
if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i % 5, 4) * 60}ms`;
    revealObserver.observe(el);
  });
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

const themeToggle = $('#themeToggle');
const HEATMAPS = {
  light: 'assets/token-heatmap-light.svg',
  dark: 'assets/token-heatmap-dark.svg',
  'true-dark': 'assets/token-heatmap-true-dark.svg'
};
const LIVE_HEATMAP_URL = 'https://raw.githubusercontent.com/hakergeniusz/hakergeniusz/data/token-heatmap.svg';
const HEATMAP_LABEL = 'PI+CLAUDE+ZCODE+QWEN+GEMINI+OPENCODE+CODEX // TOKEN BURN';
const HEATMAP_LABEL_BRUTAL = 'PI+CLAUDE+ZCODE+OPENCODE // TOKEN BURN';

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('hgz-theme', theme);
  const heatmap = $('#heatmap');
  if (heatmap && heatmap.tagName.toLowerCase() === 'img') heatmap.src = HEATMAPS[theme] || HEATMAPS.light;
  themeToggle?.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  if (themeToggle) themeToggle.innerHTML = `<i data-lucide="${theme === 'light' ? 'moon' : 'sun'}"></i>`;
  icons();
}

const savedTheme = localStorage.getItem('hgz-theme');
setTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

let holdTimer = null;
let longPressFired = false;

function startHold() {
  longPressFired = false;
  holdTimer = setTimeout(() => {
    longPressFired = true;
    setTheme('true-dark');
    showToast('TRUE DARK MODE');
  }, 3000);
}
function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
}

themeToggle?.addEventListener('pointerdown', (event) => {
  if (event.button === 0 || event.button === undefined) startHold();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => themeToggle?.addEventListener(evt, cancelHold));
themeToggle?.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startHold();
});
themeToggle?.addEventListener('keyup', (event) => {
  if (event.key === 'Enter' || event.key === ' ') cancelHold();
});
themeToggle?.addEventListener('click', () => {
  if (longPressFired) { longPressFired = false; return; }
  setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});

const trueDarkOverlay = $('#trueDarkOverlay');
window.addEventListener('pointermove', (event) => {
  trueDarkOverlay?.style.setProperty('--mx', `${event.clientX}px`);
  trueDarkOverlay?.style.setProperty('--my', `${event.clientY}px`);
}, { passive: true });

/* ---------------- toast + copy handles ---------------- */
const toast = $('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------------- avatar poof easter egg ---------------- */
const avatarZone = $('#avatarZone');
const avatar = $('#avatar');
let restoreAvatar = () => {};
let onAvatarPoof = () => {};
let onAvatarRestore = () => {};

if (avatarZone && avatar) {
  let avatarBusy = false;
  let avatarHoldTimer = null;
  let avatarHoldFired = false;
  const RICKROLL_URL = 'https://media.tenor.com/x8v1oNUOmg4AAAPo/rickroll-roll.mp4';

  function playRickroll() {
    avatarHoldFired = true;
    const flipper = $('#avatarFlipper');
    const back = $('#avatarBack');
    if (!flipper || !back) return;

    const video = document.createElement('video');
    video.className = 'rickroll-video';
    video.src = RICKROLL_URL;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    back.replaceChildren(video);
    flipper.classList.add('is-flipped');
    video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });

    setTimeout(() => {
      video.pause();
      back.replaceChildren();
      flipper.classList.remove('is-flipped');
    }, 5000);
  }

  function startAvatarHold() {
    clearTimeout(avatarHoldTimer);
    avatarHoldTimer = setTimeout(playRickroll, 3000);
  }
  function cancelAvatarHold() {
    clearTimeout(avatarHoldTimer);
    avatarHoldTimer = null;
  }

  restoreAvatar = () => {
    if (!avatar.classList.contains('is-gone')) return;
    avatar.classList.remove('is-gone');
    avatar.classList.add('is-returning');
    avatarBusy = true;
    setTimeout(() => { avatar.classList.remove('is-returning'); avatarBusy = false; }, 400);
  };

  function toggleAvatar() {
    if (avatarBusy) return;
    if (avatarHoldFired) { avatarHoldFired = false; return; }

    if (avatar.classList.contains('is-gone')) {
      onAvatarRestore();
      restoreAvatar();
      return;
    }

    avatarBusy = true;
    avatar.classList.add('is-bursting');

    for (let i = 0; i < 18; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const distance = 70 + Math.random() * 90;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--dr', `${Math.random() * 360}deg`);
      if (i % 3 === 0) spark.style.background = 'var(--fg)';
      avatarZone.append(spark);
      setTimeout(() => spark.remove(), 750);
    }

    setTimeout(() => {
      avatar.classList.remove('is-bursting');
      avatar.classList.add('is-gone');
      avatarBusy = false;
      onAvatarPoof();
      showToast('Poof! Click again to bring it back');
    }, 450);
  }

  avatarZone.addEventListener('pointerdown', (event) => {
    if (event.button === 0 || event.button === undefined) startAvatarHold();
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => avatarZone.addEventListener(evt, cancelAvatarHold));

  avatarZone.addEventListener('click', toggleAvatar);
  avatarZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAvatar();
    }
  });
}

const DISCORD_PROFILE = 'https://discord.com/users/1257212645933580289';

$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async (event) => {
  if (event.shiftKey) {
    window.open(DISCORD_PROFILE, '_blank', 'noopener,noreferrer');
    return;
  }
  const value = btn.dataset.copy;
  try {
    await navigator.clipboard.writeText(value);
    showToast(`Copied @${value}`);
  } catch (_) {
    showToast(`Discord: @${value}`);
  }
}));

/* ---------------- repos: snapshot + live GitHub API ---------------- */
const FEATURED_REPOS = [
  { name: 'rustfetch', description: 'Fastfetch- and hyfetch-inspired Rust system info tool', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'discord-bot', description: 'Yet Another Shitty Made Discord Bot', language: 'Python', stars: 2, forks: 2, flag: 'Pinned' },
  { name: 'griffel', description: 'A distraction-free Markdown editor for Linux, written in Rust', language: 'Rust', stars: 1, forks: 0, flag: 'Pinned' },
  { name: 'freecam', description: 'Freecam - control your camera separately from your player. A Horizon native mod ported from the Minecraft Freecam mod', language: 'Rust', stars: 1, forks: 1, flag: 'Pinned' },
  { name: 'pi-rs', description: 'Rust rewrite of the Pi coding-agent harness (earendil-works/pi)', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'emoxidize', description: 'Single-instance GTK4 emoji picker - clean-room Rust implementation of Emojify', language: 'Rust', stars: 0, forks: 0, flag: 'Pinned' },
  { name: 'sakura-temple-wgpu', description: 'Grand Sakura Valley: native Rust + wgpu 30/WGSL voxel diorama with GPU petals and PCF shadows', language: 'Rust', stars: 0, forks: 0, flag: 'Featured' },
  { name: 'Frame', description: 'Independent keyboard-driven media player - GTK4/libadwaita rewrite of Cine with libmpv', language: 'Rust', stars: 0, forks: 0 },
  { name: 'radix', description: 'Clean-room black-box rewrite of GNOME Calculator in Rust/GTK4', language: 'Rust', stars: 0, forks: 0 },
  { name: 'hashcheck', description: 'Check hashes for your files - GTK4/libadwaita app in Rust', language: 'Rust', stars: 0, forks: 0 },
  { name: 'tiles', description: 'The classic 2048 puzzle, built with GTK4 and libadwaita in Rust', language: 'Rust', stars: 0, forks: 0 },
  { name: 'pi-gui', description: 'Native GTK4/libadwaita GUI front-end for the pi agent', language: 'Rust', stars: 0, forks: 0 },
  { name: 'fullbright', description: 'Native Horizon mod that toggles full brightness in-game with a rebindable key', language: 'Rust', stars: 0, forks: 0 },
  { name: 'png-to-webp-screenshot-converter', description: 'Rust tool and systemd service converting screenshots to WebP', language: 'Rust', stars: 0, forks: 0 },
  { name: 'baritone-helper', description: 'Helper utility for Baritone', language: 'Rust', stars: 0, forks: 0 },
  { name: 'trash-cli-rs', description: 'Move files or folders to Trash instead of rm, for all platforms', language: 'Rust', stars: 0, forks: 0, flag: 'Fork' },
  { name: 'arbor', description: 'Arbor - see where your disk space grows: clean-room Rust/GTK4 disk usage analyzer', language: 'Rust', stars: 0, forks: 0 },
  { name: 'statview', description: 'Small Rust statistics viewer', language: 'Rust', stars: 0, forks: 0 },
  { name: 'no_chat_reports', description: 'Rust utility for chat reports', language: 'Rust', stars: 0, forks: 0 },
  { name: 'nofall-gpl-port', description: 'GPL port of the NoFall mod', language: 'Rust', stars: 0, forks: 0 },
  { name: 'nohunger-gpl-port', description: 'GPL port of the NoHunger mod', language: 'Rust', stars: 0, forks: 0 },
  { name: 'pi-markdown-extras', description: 'Pi extension: GitHub-style markdown alerts, headings and task checkboxes', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-timer', description: 'A timer extension for Pi', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-guardrails', description: 'Guardrails extension for Pi', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-cord', description: 'Chat with your Pi coding agent from Discord or Telegram with streaming replies', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-subagents', description: 'Subagents for Pi - run isolated child agents in parallel', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-token-usage', description: 'Global token and cost accounting for pi, with a per-model breakdown', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-sandbox', description: 'Optional bubblewrap isolation for pi bash tool calls', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-ssh', description: "Run pi coding agent's tools on a remote machine over SSH", language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-title', description: 'Auto-titles pi coding agent sessions with a cheap nested model call', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-tmux', description: 'tmux integration for the pi coding agent', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'pi-zsh', description: 'Pi extension: bash tool runs zsh with your real .zshrc loaded', language: 'TypeScript', stars: 0, forks: 0 },
  { name: 'discord-tracker', description: 'A Discord bot for tracking various events', language: 'Python', stars: 0, forks: 0 },
  { name: 'gphotos-storage-saver', description: 'Merge Google Takeout metadata and convert JPEGs to efficient formats', language: 'Python', stars: 0, forks: 0 },
  { name: 'pi-rdp-computer-use', description: 'Pi extension: computer use over RDP (headless screenshots and input)', language: 'Python', stars: 0, forks: 0 },
  { name: 'bad-apple-keyboard', description: 'Bad Apple keyboard animation', language: 'Python', stars: 0, forks: 0 },
  { name: 'fly', description: 'Python utility project', language: 'Python', stars: 0, forks: 0 },
  { name: 'portal_interact', description: 'Python portal interaction scripts', language: 'Python', stars: 0, forks: 0 },
  { name: 'pingfix', description: 'Python ping fixer', language: 'Python', stars: 0, forks: 0 },
  { name: 'homebrew-rustfetch', description: 'Homebrew tap for rustfetch', language: 'Ruby', stars: 0, forks: 0 }
];

let repos = FEATURED_REPOS.slice();
const state = { search: '', lang: 'all', sort: 'featured', showAll: false };
const VISIBLE_COUNT = 12;

function langClass(language) {
  return (language || 'other').toLowerCase().replace(/[^a-z]/g, '');
}

function makeRepoCard(repo) {
  const card = document.createElement('a');
  card.className = 'repo';
  card.href = `https://github.com/hakergeniusz/${encodeURIComponent(repo.name)}`;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const top = document.createElement('div');
  top.className = 'repo-top';
  const name = document.createElement('div');
  name.className = 'repo-name';
  name.innerHTML = '<i data-lucide="book-open"></i>';
  name.append(document.createTextNode(repo.name));
  const visibility = document.createElement('span');
  visibility.className = 'visibility';
  visibility.textContent = 'public';
  top.append(name, visibility);

  const desc = document.createElement('p');
  desc.textContent = repo.description || 'No description yet.';

  const meta = document.createElement('div');
  meta.className = 'repo-meta';
  const lang = document.createElement('span');
  lang.innerHTML = `<i class="lang-dot ${langClass(repo.language)}"></i>`;
  lang.append(document.createTextNode(repo.language || 'Other'));
  const stars = document.createElement('span');
  stars.innerHTML = '<i data-lucide="star"></i>';
  stars.append(document.createTextNode(String(repo.stars || 0)));
  const forks = document.createElement('span');
  forks.innerHTML = '<i data-lucide="git-fork"></i>';
  forks.append(document.createTextNode(String(repo.forks || 0)));
  meta.append(lang, stars, forks);
  if (repo.flag) {
    const flag = document.createElement('span');
    flag.className = 'flag';
    flag.textContent = repo.flag.toUpperCase();
    meta.append(flag);
  }

  card.append(top, desc, meta);
  return card;
}

function renderRepos() {
  const grid = $('#repoGrid');
  let list = repos.filter((repo) => {
    const matchesLang = state.lang === 'all' || repo.language === state.lang;
    const haystack = `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase();
    return matchesLang && haystack.includes(state.search);
  });

  if (state.sort === 'stars') list.sort((a, b) => b.stars - a.stars);
  if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

  const shown = state.showAll ? list : list.slice(0, VISIBLE_COUNT);
  grid.replaceChildren(...shown.map(makeRepoCard));
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'loading';
    empty.textContent = 'No repos match those filters.';
    grid.append(empty);
  }
  $('#showMore').hidden = list.length <= VISIBLE_COUNT;
  $('#showMore').textContent = state.showAll ? 'Show less' : `Show more repos (${list.length})`;
  icons();
}

async function loadLiveRepos() {
  try {
    const res = await fetch('https://api.github.com/users/hakergeniusz/repos?per_page=100&sort=updated');
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const live = await res.json();
    const byName = new Map(live.map((r) => [r.name, r]));
    repos = repos.map((repo) => {
      const l = byName.get(repo.name);
      if (!l) return repo;
      return {
        ...repo,
        description: l.description || repo.description,
        language: l.language || repo.language,
        stars: l.stargazers_count ?? repo.stars,
        forks: l.forks_count ?? repo.forks
      };
    });
    $('#statRepos').textContent = String(live.length);
    const badge = $('#badgeRepos');
    if (badge) badge.lastChild.textContent = ` ${live.length} public repos`;
  } catch (err) {
    console.info('Using built-in repo snapshot:', err.message);
  }
  renderRepos();
}

/* ---------------- bad apple easter egg (lazy loaded) ---------------- */
const BAD_FRAMES_URL = 'assets/bad-apple-frames.zst';
const BAD_AUDIO_URL = 'assets/bad-apple-audio.mp3';
const FZSTD_URL = 'assets/fzstd.js';
let badApplePlaying = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.fzstd) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.append(s);
  });
}

async function playBadApple() {
  if (badApplePlaying) return;
  badApplePlaying = true;
  showToast('BAD APPLE!!');

  const overlay = document.createElement('div');
  overlay.className = 'bad-apple-overlay';
  overlay.innerHTML = '<div class="bad-apple-hint">BAD APPLE!! - ESC OR CLICK TO STOP</div><pre class="bad-apple-screen">LOADING...</pre>';
  document.body.append(overlay);
  const screen = overlay.querySelector('.bad-apple-screen');

  let raf = null;
  let audio = null;
  const onKey = (event) => { if (event.key === 'Escape') cleanup(); };
  function cleanup() {
    badApplePlaying = false;
    if (raf) cancelAnimationFrame(raf);
    if (audio) { audio.pause(); audio.remove(); }
    overlay.remove();
    window.removeEventListener('keydown', onKey);
  }
  window.addEventListener('keydown', onKey);
  overlay.addEventListener('click', cleanup);

  try {
    await loadScript(FZSTD_URL);
    const res = await fetch(BAD_FRAMES_URL);
    if (!res.ok) throw new Error(String(res.status));
    const raw = window.fzstd.decompress(new Uint8Array(await res.arrayBuffer()));
    const frames = new TextDecoder().decode(raw).split('\n===FRAME===\n');

    audio = new Audio(BAD_AUDIO_URL);
    audio.play().catch(() => {});

    const start = performance.now();
    const tick = () => {
      if (!badApplePlaying) return;
      const index = Math.floor((performance.now() - start) / (1000 / 30));
      if (index >= frames.length) { cleanup(); return; }
      screen.textContent = frames[index];
      raf = requestAnimationFrame(tick);
    };
    tick();
  } catch (err) {
    screen.textContent = `FAILED TO LOAD BAD APPLE\n${err.message}`;
    setTimeout(cleanup, 3000);
  }
}

$('#repoSearch').addEventListener('input', (e) => {
  state.search = e.target.value.toLowerCase();
  renderRepos();
  if (state.search.replace(/\s+/g, '-') === 'play-bad-apple') playBadApple();
});
$('#repoSort').addEventListener('change', (e) => { state.sort = e.target.value; renderRepos(); });
$$('.filter').forEach((btn) => btn.addEventListener('click', () => {
  $$('.filter').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.lang = btn.dataset.lang;
  renderRepos();
}));
$('#showMore').addEventListener('click', () => { state.showAll = !state.showAll; renderRepos(); });

loadLiveRepos();

/* ---------------- live token heatmap pulled from GitHub ---------------- */
function applyHeatmapStats(text) {
  const title = text.match(/([\d.]+[BMT]) tokens over (\d+) days/i);
  if (title) {
    $('#statTokens').textContent = title[1];
    $('#burnTotals').textContent = `${title[1]} total - ${title[2]} active days`;
    $('#statStreak')?.setAttribute('title', `${title[2]} active days tracked`);
  }
  const requests = text.match(/([\d,]+)\s+requests\s*·\s*tracking since/i);
  if (requests) $('#statRequests').textContent = requests[1];
}

async function loadTokenStats() {
  const file = HEATMAPS[root.dataset.theme] || HEATMAPS.light;
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(String(res.status));
    applyHeatmapStats(await res.text());
  } catch (_) {
    // Snapshot values stay in place when offline.
  }
}

async function loadLiveHeatmap() {
  try {
    const res = await fetch(LIVE_HEATMAP_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    let text = await res.text();
    applyHeatmapStats(text);

    text = text.replace(/<style>[\s\S]*?<\/style>/, '');
    text = text.replace(HEATMAP_LABEL, HEATMAP_LABEL_BRUTAL);
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('bad svg');
    const svg = doc.documentElement;
    svg.setAttribute('id', 'heatmap');
    svg.setAttribute('class', 'heatmap-live');
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('width', '100%');
    const node = document.importNode(svg, true);
    const img = $('#heatmap');
    if (img) img.replaceWith(node);
    $('#heatmapStatus').textContent = 'Brutalist edition - live from GitHub';
  } catch (_) {
    loadTokenStats();
    $('#heatmapStatus').textContent = 'Brutalist edition - snapshot (live unavailable)';
  }
}
loadLiveHeatmap();

/* ---------------- LOC contributed (generated by scripts/count-loc.py) ---------------- */
async function loadLocStats() {
  try {
    const res = await fetch('assets/loc-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const added = data.totalAdded || 0;
    $('#statLoc').textContent = added >= 1000000 ? `${(added / 1000000).toFixed(2)}M` : added.toLocaleString();
    $('#statLoc').title = `${added.toLocaleString()} lines added, ${(data.totalDeleted || 0).toLocaleString()} deleted across ${data.repos || 0} repos (commit code frequency, generated ${data.generatedAt || 'n/a'})`;
  } catch (_) {
    $('#statLoc').textContent = '--';
    $('#statLoc').title = 'Run scripts/count-loc.py to generate this number';
  }
}
loadLocStats();

/* ---------------- pac-man easter egg ---------------- */
let pacActive = false;
let pacFrame = null;
let pacListenersReady = false;
let pacAutoTimer = null;
const PAC_SIZE = 64;
const PAC_SPEED = 4;
let pacLoopToken = 0;
let pacPosition = { x: 0, y: 0 };
let pacAngle = 180;
let pacDir = { x: 0, y: 0 };
let pacSwipeStart = null;
let pacOldTouchAction = '';
let pacEaten = [];
let pacTotal = 1;
let pacLastEat = 0;

const PAC_SKIP_TAGS = new Set(['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'NOSCRIPT']);

const PAC_SKIP_LAYOUT = 'main, section, header, footer, nav, .wrap, .hero, .hero-copy, .hero-art, .about-grid, .controls, .badges, .btn-row, .top-actions, .repo-grid, .stats, .section-head, .center, .footer-links';

function isEdible(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (PAC_SKIP_TAGS.has(el.tagName)) return false;
  if (el.matches(PAC_SKIP_LAYOUT)) return false;
  if (el.closest('.pacman, .pac-hud, #avatarZone, .eat-fx, #toast')) return false;
  if (el.classList.contains('eaten') || el.classList.contains('restoring')) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  if (r.width * r.height > 500000) return false;
  const hasText = el.textContent && el.textContent.trim().length > 0;
  const leafMedia = /^(IMG|SVG|CANVAS|VIDEO)$/.test(el.tagName);
  return hasText || leafMedia;
}

function schedulePacman() {
  clearTimeout(pacAutoTimer);
  pacAutoTimer = setTimeout(() => {
    pacAutoTimer = null;
    if (!pacActive) spawnPacman();
  }, 10000);
}

onAvatarPoof = () => schedulePacman();
onAvatarRestore = () => { clearTimeout(pacAutoTimer); pacAutoTimer = null; };

function stopPacman() {
  if (!pacActive) return;
  pacActive = false;
  pacLoopToken += 1;
  clearInterval(pacFrame);
  clearTimeout(pacAutoTimer);
  pacAutoTimer = null;
  $('.pacman')?.remove();
  $('.pac-hud')?.remove();

  const restored = pacEaten.slice();
  restored.forEach((el) => {
    el.classList.remove('eaten');
    el.classList.add('restoring');
  });
  setTimeout(() => restored.forEach((el) => el.classList.remove('restoring')), 520);

  pacEaten = [];
  pacDir = { x: 0, y: 0 };
  pacSwipeStart = null;
  document.body.style.touchAction = pacOldTouchAction;
  restoreAvatar();
  showToast('Pac-Man restored everything');
}

function spawnPacman() {
  if (pacActive) return;
  pacActive = true;
  clearTimeout(pacAutoTimer);
  pacAutoTimer = null;
  const myToken = ++pacLoopToken;

  const pacman = document.createElement('div');
  pacman.className = 'pacman';
  pacman.setAttribute('aria-hidden', 'true');
  pacman.innerHTML = '<div class="pacman-body"></div>';
  const pacBody = pacman.querySelector('.pacman-body');
  const hud = document.createElement('div');
  hud.className = 'pac-hud';
  const touchDevice = window.matchMedia('(pointer: coarse)').matches;
  hud.innerHTML = '<div class="pac-hud-line">PAC-MAN - <span class="pac-score">0</span> EATEN - ESC RESTORE</div><div class="pac-progress"><div class="pac-progress-fill"></div></div>' +
    (touchDevice ? '<div class="pac-dpad"><button type="button" data-dir="up" aria-label="Up">▲</button><button type="button" data-dir="left" aria-label="Left">◀</button><button type="button" data-dir="down" aria-label="Down">▼</button><button type="button" data-dir="right" aria-label="Right">▶</button></div>' : '');
  document.body.append(pacman, hud);
  pacOldTouchAction = document.body.style.touchAction;
  document.body.style.touchAction = touchDevice ? 'pan-y' : 'none';

  if (touchDevice) {
    const dpadDirs = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
    hud.querySelectorAll('.pac-dpad button').forEach((btn) => {
      const setDir = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const d = dpadDirs[btn.dataset.dir];
        pacDir = { x: d[0], y: d[1] };
      };
      btn.addEventListener('pointerdown', setDir);
    });
  }
  pacAngle = 180;
  pacDir = { x: 0, y: 0 };

  const zone = $('#avatarZone');
  const rect = zone?.getBoundingClientRect() || { left: 60, top: 120, width: 210, height: 210 };
  pacPosition = {
    x: Math.max(8, Math.min(window.innerWidth - PAC_SIZE - 8, rect.left + rect.width / 2 - PAC_SIZE / 2)),
    y: Math.max(8, Math.min(window.innerHeight - PAC_SIZE - 8, rect.top + rect.height / 2 - PAC_SIZE / 2))
  };
  pacman.style.transform = `translate(${pacPosition.x}px, ${pacPosition.y}px)`;
  pacBody.style.transform = `rotate(${pacAngle}deg)`;

  pacTotal = Math.max(1, Array.from(document.body.querySelectorAll('*')).filter(isEdible).length);
  let score = 0;
  const scoreEl = hud.querySelector('.pac-score');
  const progressFill = hud.querySelector('.pac-progress-fill');
  const updateHud = () => {
    scoreEl.textContent = score;
    progressFill.style.width = `${Math.min(100, (score / pacTotal) * 100)}%`;
  };
  updateHud();

  const eat = (el) => {
    const r = el.getBoundingClientRect();
    el.classList.add('eaten');
    pacEaten.push(el);
    score += 1;
    updateHud();
    const fx = document.createElement('span');
    fx.className = 'eat-fx';
    fx.textContent = '+1';
    fx.style.left = `${r.left + r.width / 2}px`;
    fx.style.top = `${r.top + r.height / 2}px`;
    document.body.append(fx);
    setTimeout(() => fx.remove(), 620);
  };

  const step = () => {
    if (!pacActive || myToken !== pacLoopToken) return;
    let dx = pacDir.x * PAC_SPEED;
    let dy = pacDir.y * PAC_SPEED;

    const nextX = pacPosition.x + dx;
    const nextY = pacPosition.y + dy;
    if (nextX < 0 || nextX > window.innerWidth - PAC_SIZE) { dx = 0; pacDir.x = 0; }
    if (nextY < 0 || nextY > window.innerHeight - PAC_SIZE) { dy = 0; pacDir.y = 0; }

    if (dx || dy) {
      pacAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      pacBody.style.transform = `rotate(${pacAngle}deg)`;
    }

    pacPosition.x = Math.max(0, Math.min(window.innerWidth - PAC_SIZE, pacPosition.x + dx));
    pacPosition.y = Math.max(0, Math.min(window.innerHeight - PAC_SIZE, pacPosition.y + dy));
    pacman.style.transform = `translate(${pacPosition.x}px, ${pacPosition.y}px)`;

    const cx = pacPosition.x + PAC_SIZE / 2;
    const cy = pacPosition.y + PAC_SIZE / 2;
    const under = document.elementFromPoint(cx, cy);
    let onYellow = false;
    let node = under;
    while (node && node !== document.documentElement) {
      const rgb = getComputedStyle(node).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgb && Number(rgb[1]) > 180 && Number(rgb[2]) > 140 && Number(rgb[3]) < 100) { onYellow = true; break; }
      node = node.parentElement;
    }
    pacman.classList.toggle('on-yellow', onYellow);

    if (performance.now() - pacLastEat < 140) return;
    const probes = [
      [cx + pacDir.x * 24, cy + pacDir.y * 24],
      [cx, cy],
      [cx - pacDir.x * 20, cy - pacDir.y * 20]
    ];
    for (const [px, py] of probes) {
      if (px < 0 || py < 0 || px >= window.innerWidth || py >= window.innerHeight) continue;
      let found = null;
      for (const el of document.elementsFromPoint(px, py)) {
        if (isEdible(el)) { found = el; break; }
      }
      if (found) {
        eat(found);
        pacLastEat = performance.now();
        break;
      }
    }
  };
  step();
  pacFrame = setInterval(step, 16);

  if (!pacListenersReady) {
    pacListenersReady = true;
    window.addEventListener('keydown', (event) => {
      if (!pacActive) return;
      const key = event.key.toLowerCase();
      if (key === 'escape') { stopPacman(); return; }
      if (event.target instanceof Element && event.target.matches('input, textarea, select')) return;
      const dirs = {
        arrowleft: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0],
        arrowup: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1]
      };
      if (dirs[key]) {
        event.preventDefault();
        pacDir = { x: dirs[key][0], y: dirs[key][1] };
      }
    });

    window.addEventListener('pointerdown', (event) => {
      if (!pacActive || event.pointerType === 'mouse') return;
      pacSwipeStart = { x: event.clientX, y: event.clientY };
    }, { passive: true });

    window.addEventListener('pointermove', (event) => {
      if (!pacActive || event.pointerType === 'mouse' || !pacSwipeStart) return;
      event.preventDefault();
      const deltaX = event.clientX - pacSwipeStart.x;
      const deltaY = event.clientY - pacSwipeStart.y;
      const length = Math.hypot(deltaX, deltaY);
      if (length > 6) {
        pacDir = { x: deltaX / length, y: deltaY / length };
        pacSwipeStart = { x: event.clientX, y: event.clientY };
      }
    }, { passive: false });

    const endSwipe = () => { pacSwipeStart = null; };
    window.addEventListener('pointerup', endSwipe, { passive: true });
    window.addEventListener('pointercancel', endSwipe, { passive: true });
  }
}

const PAC_CODE = ['p', 'a', 'c', 'm', 'a', 'n'];
let pacCodeIndex = 0;
window.addEventListener('keydown', (event) => {
  if (event.target instanceof Element && event.target.matches('input, textarea, select')) return;
  const key = event.key.toLowerCase();
  if (key === PAC_CODE[pacCodeIndex]) {
    pacCodeIndex += 1;
    if (pacCodeIndex === PAC_CODE.length) {
      pacCodeIndex = 0;
      if (avatar && avatar.classList.contains('is-gone')) {
        spawnPacman();
        showToast('PAC-MAN unlocked');
      } else {
        showToast('Poof the avatar first');
      }
    }
  } else {
    pacCodeIndex = key === PAC_CODE[0] ? 1 : 0;
  }
});

const BAD_CODE = ['b', 'a', 'd', 'a', 'p', 'p', 'l', 'e'];
let badCodeIndex = 0;
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === BAD_CODE[badCodeIndex]) {
    badCodeIndex += 1;
    if (badCodeIndex === BAD_CODE.length) {
      badCodeIndex = 0;
      playBadApple();
    }
  } else {
    badCodeIndex = key === BAD_CODE[0] ? 1 : 0;
  }
});

if (new URLSearchParams(location.search).has('pacman')) setTimeout(spawnPacman, 300);

icons();
