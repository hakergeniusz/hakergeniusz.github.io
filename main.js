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
const smoothContent = $('#smoothContent');
const smoothSpacer = $('#smoothSpacer');
let smoothTarget = window.scrollY;
let smoothCurrent = window.scrollY;
let smoothRaf = null;

function sizeSmoothSpacer() {
  if (!smoothContent || !smoothSpacer) return;
  smoothSpacer.style.height = `${smoothContent.scrollHeight}px`;
}

function smoothLoop() {
  smoothCurrent += (smoothTarget - smoothCurrent) * 0.1;
  if (Math.abs(smoothTarget - smoothCurrent) < 0.5) smoothCurrent = smoothTarget;
  smoothContent.style.transform = `translate3d(0, ${-smoothCurrent}px, 0)`;
  smoothRaf = smoothCurrent !== smoothTarget ? requestAnimationFrame(smoothLoop) : null;
}

if (smoothEnabled && smoothContent && smoothSpacer) {
  root.classList.add('smooth-active');
  sizeSmoothSpacer();
  window.addEventListener('resize', sizeSmoothSpacer);
  if ('MutationObserver' in window) {
    new MutationObserver(sizeSmoothSpacer).observe(smoothContent, { childList: true, subtree: true });
  }
  window.addEventListener('scroll', () => {
    smoothTarget = window.scrollY;
    if (smoothRaf === null) smoothRaf = requestAnimationFrame(smoothLoop);
  }, { passive: true });
  smoothRaf = requestAnimationFrame(smoothLoop);
}

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 80);
    window.scrollTo(0, top);
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
function isMobileDevice() {
  return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 820px)').matches;
}
window.isMobileDevice = isMobileDevice;

const avatarZone = $('#avatarZone');
const avatar = $('#avatar');
let restoreAvatar = () => {};
let onAvatarPoof = () => {};
let onAvatarRestore = () => {};

if (avatarZone && avatar) {
  let avatarBusy = false;
  let avatarHoldTimer = null;
  let avatarHoldFired = false;
  let avatarClicks = [];
  let avatarPoofDelayTimer = null;
  const RICKROLL_URL = 'https://media.tenor.com/x8v1oNUOmg4AAAPo/rickroll-roll.mp4';

  function playRickroll() {
    avatarHoldFired = true;
    const flipper = $('#avatarFlipper');
    const back = $('#avatarBack');
    if (!flipper || !back) return;

    if (avatar.classList.contains('is-gone') || avatar.classList.contains('is-bursting')) {
      avatar.classList.remove('is-gone', 'is-bursting', 'is-returning');
      avatarBusy = false;
    }

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

  function startAvatarHold(event) {
    if (isMobileDevice() || (event && event.pointerType === 'touch')) return;
    if ($('#avatarFlipper')?.classList.contains('is-flipped')) return;
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
    if ($('#avatarFlipper')?.classList.contains('is-flipped')) return;
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

  function handleAvatarClick(event) {
    if ($('#avatarFlipper')?.classList.contains('is-flipped')) return;
    if (avatarHoldFired) { avatarHoldFired = false; return; }

    if (isMobileDevice() || (event && event.pointerType === 'touch')) {
      const now = performance.now();
      avatarClicks = avatarClicks.filter((t) => now - t <= 3000);
      avatarClicks.push(now);

      if (avatarClicks.length >= 4) {
        avatarClicks = [];
        clearTimeout(avatarPoofDelayTimer);
        avatarPoofDelayTimer = null;
        clearTimeout(pacAutoTimer);
        pacAutoTimer = null;
        playRickroll();
        return;
      }

      clearTimeout(avatarPoofDelayTimer);
      avatarPoofDelayTimer = setTimeout(() => {
        avatarPoofDelayTimer = null;
        toggleAvatar();
      }, 260);
      return;
    }

    toggleAvatar();
  }

  avatarZone.addEventListener('pointerdown', (event) => {
    if (event.button === 0 || event.button === undefined) startAvatarHold(event);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => avatarZone.addEventListener(evt, cancelAvatarHold));

  avatarZone.addEventListener('click', handleAvatarClick);
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
    $('#heatmapStatus').textContent = 'Live from GitHub';
  } catch (_) {
    loadTokenStats();
    $('#heatmapStatus').textContent = 'Live unavailable - showing snapshot';
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
let pacStartTime = 0;
let pacWon = false;
let pacTriggerWin = null;

function formatPacTime(ms) {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

const PAC_SKIP_TAGS = new Set(['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION']);

const PAC_SKIP_LAYOUT = 'main, section, header, footer, nav, #smoothContent, .wrap, .hero, .hero-copy, .hero-art, .about-grid, .controls, .badges, .btn-row, .top-actions, .repo-grid, .stats, .section-head, .center, .footer-links, .skip-link';

function isEdible(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (PAC_SKIP_TAGS.has(el.tagName)) return false;
  if (el.matches(PAC_SKIP_LAYOUT)) return false;
  if (el.closest('.pacman, .pac-hud, #avatarZone, .eat-fx, #toast, .pac-win-overlay, .ghostty-overlay, .tiles-overlay, .bad-apple-overlay, .skip-link')) return false;
  if (el.classList.contains('eaten') || el.classList.contains('restoring') || el.closest('.eaten')) return false;
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
  if (!pacActive && !pacWon) return;
  pacActive = false;
  pacWon = false;
  pacLoopToken += 1;
  clearInterval(pacFrame);
  clearTimeout(pacAutoTimer);
  pacAutoTimer = null;
  $('.pacman')?.remove();
  $('.pac-hud')?.remove();
  $('.pac-win-overlay')?.remove();

  const restored = pacEaten.slice();
  restored.forEach((el) => {
    el.classList.remove('eaten');
    el.classList.add('restoring');
  });
  setTimeout(() => restored.forEach((el) => el.classList.remove('restoring')), 520);

  pacEaten = [];
  pacDir = { x: 0, y: 0 };
  document.body.style.touchAction = pacOldTouchAction;
  restoreAvatar();
  showToast('Pac-Man restored everything');
}

function spawnPacman() {
  if (pacActive) return;
  document.querySelectorAll('.pacman, .pac-hud').forEach((el) => el.remove());
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
  hud.innerHTML = '<div class="pac-hud-line">PAC-MAN - <span class="pac-score">0</span> EATEN - <button type="button" class="pac-restore-btn" aria-label="Restore site">ESC RESTORE</button></div><div class="pac-progress"><div class="pac-progress-fill"></div></div>' +
    '<div class="pac-dpad" aria-label="Pac-Man controls"><button type="button" data-dir="up" aria-label="Up">▲</button><button type="button" data-dir="left" aria-label="Left">◀</button><button type="button" data-dir="down" aria-label="Down">▼</button><button type="button" data-dir="right" aria-label="Right">▶</button></div>';
  document.body.append(pacman, hud);
  pacOldTouchAction = document.body.style.touchAction;
  document.body.style.touchAction = isMobileDevice() ? 'pan-y' : 'none';

  hud.querySelector('.pac-restore-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    stopPacman();
  });

  const dpadDirs = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
  hud.querySelectorAll('.pac-dpad button').forEach((btn) => {
    const setDir = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const d = dpadDirs[btn.dataset.dir];
      if (d) pacDir = { x: d[0], y: d[1] };
    };
    btn.addEventListener('pointerdown', setDir);
    btn.addEventListener('click', setDir);
  });
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
  pacStartTime = performance.now();
  pacWon = false;
  let score = 0;
  const scoreEl = hud.querySelector('.pac-score');
  const progressFill = hud.querySelector('.pac-progress-fill');
  const updateHud = () => {
    scoreEl.textContent = score;
    const remaining = Array.from(document.body.querySelectorAll('*')).filter(isEdible).length;
    const pct = Math.min(100, Math.max((score / pacTotal) * 100, remaining === 0 ? 100 : ((pacTotal - remaining) / pacTotal) * 100));
    progressFill.style.width = `${pct}%`;
  };
  updateHud();

  const triggerPacWin = () => {
    if (pacWon) return;
    pacWon = true;
    pacActive = false;
    clearInterval(pacFrame);
    document.body.style.touchAction = pacOldTouchAction;

    const elapsedMs = performance.now() - pacStartTime;
    const timeStr = formatPacTime(elapsedMs);

    showToast(`Congratulations! You ate the website in ${timeStr}.`);

    const overlay = document.createElement('div');
    overlay.className = 'pac-win-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="pac-win-modal">' +
        '<div class="pac-win-badge">★ PAC-MAN VICTORY ★</div>' +
        `<p class="pac-win-msg">Congratulations! You ate the website in <strong>${timeStr}</strong>.</p>` +
        '<p class="pac-win-question">Do you want it again?</p>' +
        '<div class="pac-win-actions">' +
          '<button type="button" class="pac-win-btn pac-win-btn-yes" id="pacWinYes">Yes, Eat Again</button>' +
          '<button type="button" class="pac-win-btn pac-win-btn-no" id="pacWinNo">No, Restore</button>' +
        '</div>' +
      '</div>';
    document.body.append(overlay);

    const cleanup = () => {
      window.removeEventListener('keydown', onWinKey);
      overlay.remove();
    };

    const handleYes = () => {
      cleanup();
      pacWon = false;
      document.querySelectorAll('.pacman, .pac-hud').forEach((el) => el.remove());
      const restored = pacEaten.slice();
      restored.forEach((el) => {
        el.classList.remove('eaten');
        el.classList.add('restoring');
      });
      setTimeout(() => restored.forEach((el) => el.classList.remove('restoring')), 520);
      pacEaten = [];
      showToast('Round 2! Go Pac-Man!');
      setTimeout(() => spawnPacman(), 550);
    };

    const handleNo = () => {
      cleanup();
      pacWon = false;
      stopPacman();
    };

    const onWinKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'n') {
        e.preventDefault();
        e.stopPropagation();
        handleNo();
      } else if (k === 'enter' || k === 'y') {
        e.preventDefault();
        e.stopPropagation();
        handleYes();
      }
    };
    window.addEventListener('keydown', onWinKey);

    overlay.querySelector('#pacWinYes').addEventListener('click', handleYes);
    overlay.querySelector('#pacWinNo').addEventListener('click', handleNo);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleNo();
    });
  };
  pacTriggerWin = triggerPacWin;

  const eat = (el) => {
    const r = el.getBoundingClientRect();
    el.classList.add('eaten');
    pacEaten.push(el);
    el.querySelectorAll('*').forEach((child) => {
      if (!child.classList.contains('eaten')) {
        child.classList.add('eaten');
        pacEaten.push(child);
      }
    });
    score += 1;
    updateHud();
    const fx = document.createElement('span');
    fx.className = 'eat-fx';
    fx.textContent = '+1';
    fx.style.left = `${r.left + r.width / 2}px`;
    fx.style.top = `${r.top + r.height / 2}px`;
    document.body.append(fx);
    setTimeout(() => fx.remove(), 620);

    const remaining = Array.from(document.body.querySelectorAll('*')).filter(isEdible).length;
    if (remaining === 0 || score >= pacTotal) {
      triggerPacWin();
    }
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

      if (isMobileDevice()) {
        const arrowOnlyDirs = {
          arrowleft: [-1, 0],
          arrowright: [1, 0],
          arrowup: [0, -1],
          arrowdown: [0, 1]
        };
        if (arrowOnlyDirs[key]) {
          event.preventDefault();
          pacDir = { x: arrowOnlyDirs[key][0], y: arrowOnlyDirs[key][1] };
        }
      } else {
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
      }
    });
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

/* ---------------- ghostty console easter egg (lazy uutils WASM) ---------------- */
let ghosttyOpen = false;

function openGhostty() {
  if (ghosttyOpen) return;
  ghosttyOpen = true;

  const overlay = document.createElement('div');
  overlay.className = 'ghostty-overlay';
  overlay.innerHTML = '<div class="ghostty-window" role="dialog" aria-label="Ghostty terminal">' +
    '<div class="ghostty-bar">' +
    '<span class="ghostty-title">ghostty - uutils wasm</span>' +
    '<button class="ghostty-dot" type="button" data-ghostty="min" aria-label="Minimize terminal"></button>' +
    '<button class="ghostty-dot" type="button" data-ghostty="max" aria-label="Maximize terminal"></button>' +
    '<button class="ghostty-dot" type="button" data-ghostty="close" aria-label="Close terminal"></button></div>' +
    '<div class="ghostty-body"><div class="ghostty-loading">downloading uutils.wasm (3.2 MB zstd)...</div><div id="ghostty-term" class="ghostty-frame"></div></div></div>';
  document.body.append(overlay);
  root.classList.add('ghostty-open');

  const win = overlay.querySelector('.ghostty-window');
  let restoreBtn = null;

  const notify = (message) => {
    const el = document.createElement('div');
    el.className = 'ghostty-notify';
    el.textContent = message;
    document.body.append(el);
    setTimeout(() => el.remove(), 1800);
  };

  const onKey = (event) => {
    if (overlay.classList.contains('is-hidden')) return;
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
  };
  const close = () => {
    ghosttyOpen = false;
    document.removeEventListener('keydown', onKey);
    root.classList.remove('ghostty-open');
    restoreBtn?.remove();
    overlay.remove();
  };
  const maximize = () => {
    win.classList.toggle('is-maximized');
    window.dispatchEvent(new Event('resize'));
  };
  const minimize = () => {
    overlay.classList.add('is-hidden');
    root.classList.remove('ghostty-open');
    if (!restoreBtn) {
      restoreBtn = document.createElement('button');
      restoreBtn.className = 'ghostty-restore';
      restoreBtn.type = 'button';
      restoreBtn.title = 'Restore terminal';
      restoreBtn.textContent = 'ghostty';
      restoreBtn.addEventListener('click', () => {
        overlay.classList.remove('is-hidden');
        root.classList.add('ghostty-open');
        restoreBtn.remove();
        restoreBtn = null;
        window.dispatchEvent(new Event('resize'));
        document.querySelector('#ghostty-term .xterm-helper-textarea')?.focus();
      });
      document.body.append(restoreBtn);
    }
    notify('Minimized!');
  };

  document.addEventListener('keydown', onKey);
  overlay.querySelectorAll('[data-ghostty]').forEach((btn) => {
    btn.addEventListener('click', { close, max: maximize, min: minimize }[btn.dataset.ghostty]);
  });
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });

  // Nothing is fetched until the console command runs.
  loadScript('assets/uutils-terminal.js')
    .then(() => window.initPlayground('ghostty-term'))
    .then(() => overlay.querySelector('.ghostty-loading')?.remove())
    .catch((err) => {
      const loading = overlay.querySelector('.ghostty-loading');
      if (loading) loading.textContent = `ghostty: failed to load - ${err.message}`;
    });
}

Object.defineProperty(window, 'ghostty', {
  configurable: true,
  get() { openGhostty(); return () => openGhostty(); }
});

/* ---------------- mobile easter-egg dock (hidden behind a footer long-press) ---------------- */
const mobileEggs = $('#mobileEggs');
const footerBrand = $('#footerBrand');
let eggHoldTimer = null;
let eggsVisible = false;
const showEggs = () => {
  eggsVisible = !eggsVisible;
  mobileEggs.hidden = !eggsVisible;
  if (eggsVisible) showToast('???');
};
const cancelEggHold = () => { clearTimeout(eggHoldTimer); eggHoldTimer = null; };
footerBrand?.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') return;
  event.preventDefault(); // stop the native text-selection/callout gesture
  eggHoldTimer = setTimeout(showEggs, 1500);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) =>
  footerBrand?.addEventListener(evt, cancelEggHold));
footerBrand?.addEventListener('contextmenu', (event) => event.preventDefault());
$$('[data-egg]').forEach((btn) => {
  btn.addEventListener('click', () => {
    mobileEggs.hidden = true;
    eggsVisible = false;
    const eggs = { ghostty: openGhostty, tiles: openTiles, snake: openSnake };
    eggs[btn.dataset.egg]?.();
  });
});

/* ---------------- snake easter egg ---------------- */
const SNAKE_SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
let snakeSeqIdx = 0;
let snakeOpen = false;

function openSnake() {
  if (snakeOpen) return;
  snakeOpen = true;
  root.classList.add('snake-open');

  const overlay = document.createElement('div');
  overlay.className = 'snake-overlay';
  overlay.innerHTML = '<div class="snake-window">' +
    '<div class="snake-bar"><span>SNAKE // WASM-FREE</span><button class="snake-close" type="button" aria-label="Close snake">x</button></div>' +
    '<iframe class="snake-frame" src="assets/snake/index.html?v=34" title="Snake game"></iframe></div>';
  document.body.append(overlay);

  const close = () => {
    snakeOpen = false;
    root.classList.remove('snake-open');
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.snake-close').addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  const frame = overlay.querySelector('.snake-frame');
  frame.addEventListener('load', () => {
    frame.focus();
    try {
      frame.contentWindow?.focus();
      frame.contentDocument?.getElementById('game')?.focus();
    } catch (_) { /* cross-origin guard */ }
  });
}

/* ---------------- tiles / 2048 wasm easter egg ---------------- */
// Full Konami code: Up Up Down Down Left Right Left Right.
const TILES_SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
let tilesSeqIdx = 0;
let tilesOpen = false;

function openTiles() {
  if (tilesOpen) return;
  tilesOpen = true;
  root.classList.add('tiles-open');

  const overlay = document.createElement('div');
  overlay.className = 'tiles-overlay';
  overlay.innerHTML = '<div class="tiles-window">' +
    '<div class="tiles-bar"><span>2048 // TILES WASM</span><button class="tiles-close" type="button" aria-label="Close 2048">x</button></div>' +
    '<iframe class="tiles-frame" src="assets/tiles/index.html" title="2048 game"></iframe></div>';
  document.body.append(overlay);

  const close = () => {
    tilesOpen = false;
    root.classList.remove('tiles-open');
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.tiles-close').addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  const frame = overlay.querySelector('.tiles-frame');
  frame.addEventListener('load', () => frame.focus());
}

// Snake uses the short code; 2048 uses the full Konami code. Both share a
// single listener so overlapping prefixes never fire both games.
const arrowCodes = [
  { seq: SNAKE_SEQ, idx: 0, run: openSnake },
  { seq: TILES_SEQ, idx: 0, run: openTiles }
];
window.addEventListener('keydown', (event) => {
  if (event.target instanceof Element && event.target.matches('input, textarea, select')) return;
  arrowCodes.forEach((code) => {
    if (event.key !== code.seq[code.idx]) {
      code.idx = event.key === code.seq[0] ? 1 : 0;
      return;
    }
    code.idx += 1;
    if (code.idx === code.seq.length) {
      code.idx = 0;
      code.run();
    }
  });
});

const BAD_CODE = ['b', 'a', 'd', 'a', 'p', 'p', 'l', 'e'];
let badCodeIndex = 0;
window.addEventListener('keydown', (event) => {
  if (event.target instanceof Element && event.target.matches('input, textarea, select')) return;
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

window.pacEatAll = () => {
  if (!pacActive) spawnPacman();
  const edible = Array.from(document.body.querySelectorAll('*')).filter(isEdible);
  edible.forEach((el) => {
    el.classList.add('eaten');
    pacEaten.push(el);
  });
  if (pacTriggerWin) pacTriggerWin();
};

icons();
